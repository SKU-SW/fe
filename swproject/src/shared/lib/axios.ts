/**
 * @file API 클라이언트 설정 (axios 인스턴스 + JWT 인터셉터 + 401 토큰 재발급)
 * @created Sprint 1 - API 클라이언트 구현
 * @migrated Next.js process.env → Vite import.meta.env
 * @change NEXT_PUBLIC_API_BASE_URL → VITE_API_BASE_URL (Vite 환경변수 규칙)
 * @dependsOn src/shared/stores/authStore.ts (useAuthStore - 토큰 읽기/갱신)
 * @dependsOn src/shared/types/api.ts (ApiResponse 타입)
 * @dependsOn src/shared/types/auth.ts (TokenResponse 타입)
 * @usedBy features 내 모든 API 함수
 *
 * 핵심 기능:
 * 1. 요청 인터셉터: accessToken을 자동으로 Authorization 헤더에 주입
 * 2. 응답 인터셉터: ApiResponse<T>를 자동으로 unwrap하여 data만 반환
 * 3. 401 에러 처리: 토큰 재발급 → 재시도 (큐 패턴으로 동시 요청 처리)
 */

import axios from 'axios';
import { useAuthStore } from '@/shared/stores/authStore';
import type { ApiResponse } from '@/shared/types/api';
import type { TokenResponse } from '@/shared/types/auth';

/**
 * 인증 토큰이 자동으로 주입되는 API 클라이언트
 * - 대부분의 API 요청에 사용
 * - baseURL은 환경변수에서 읽어오며, 없으면 localhost:8080 사용
 */
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const resolvedBaseUrl = import.meta.env.DEV
  ? ''
  : (configuredBaseUrl || 'http://localhost:8080');

const apiClient = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 인증 토큰이 주입되지 않는 "bare" 클라이언트
 * - 토큰 재발급(refresh) API 호출 시 사용
 * - 재발급 요청 자체에 토큰이 필요하면 무한 루프에 빠질 수 있으므로 분리
 */
export const bareClient = axios.create({
  baseURL: resolvedBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * ApiResponse<T> 래퍼를 자동으로 풀어주는 헬퍼
 * - 백엔드가 { success: true, data: T } 형태로 반환할 때 data만 추출
 * - 이미 T 형태라면 그대로 반환 (호환성 보장)
 */
function unwrapData<T>(payload: T | ApiResponse<T>): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    ('success' in payload || 'status' in payload)
  ) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
}

// ============================================================
// 요청 인터셉터: JWT 자동 주입
// ============================================================
// apiClient를 통한 모든 요청에 accessToken을 자동으로 추가
// 단, 인증 엔드포인트(login/register/refresh)는 토큰을 붙이면 안 됨:
//   - 만료된 토큰이 남아있으면 백엔드가 401로 거부 → 로그인 자체가 막힘

// 토큰을 주입하지 않는 경로 (전체 URL 또는 path 일부 매칭)
const AUTH_PUBLIC_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
];

apiClient.interceptors.request.use(
  (config) => {
    const url = config.url ?? '';
    const isPublicAuth = AUTH_PUBLIC_PATHS.some((p) => url.startsWith(p));
    if (isPublicAuth) {
      // 혹시 남아있을 수 있는 Authorization 헤더 제거
      if (config.headers && 'Authorization' in config.headers) {
        delete (config.headers as Record<string, unknown>).Authorization;
      }
      return config;
    }

    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// 응답 인터셉터: 401 -> 토큰 재발급 -> 재시도 (큐 패턴)
// ============================================================
// 왜 큐 패턴이 필요한가?
// - 동시에 여러 API 요청이 401을 받으면, 각각이 독립적으로 토큰 재발급을 시도함
// - 큐 패턴: 첫 번째 401만 재발급을 트리거하고, 나머지는 큐에 대기
// - 재발급 완료 후 큐에 있는 모든 요청을 새 토큰으로 재시도

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * 인증이 완전히 만료되었을 때 로그인 페이지로 강제 이동
 * - HashRouter 사용 중이므로 #/login 경로 사용
 * - 이미 로그인 페이지면 리다이렉트 생략 (무한 루프 방지)
 */
function redirectToLogin() {
  if (typeof window === 'undefined') return;
  if (window.location.hash.startsWith('#/login')) return;
  window.location.hash = '#/login';
}

/**
 * 대기 큐에 있는 모든 Promise를 처리
 * - error가 있으면 모두 reject (재발급 실패)
 * - token이 있으면 모두 resolve (재발급 성공)
 */
const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  // 성공 응답: ApiResponse unwrap
  (response) => {
    response.data = unwrapData(response.data);
    return response;
  },
  // 에러 응답: 401 처리
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    // 401 에러이고 아직 재시도하지 않은 요청만 처리
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // 이미 토큰 재발급 중이면 큐에 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // 토큰 재발급 시작 (동시 요청 차단)
      originalRequest._retry = true;
      isRefreshing = true;

      // 리프레시 토큰이 없으면 재발급 불가 → 인증 정리 + 로그인 페이지로
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        isRefreshing = false;
        useAuthStore.getState().clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        // bareClient 사용: 재발급 요청에는 토큰 인터셉터가 적용되면 안 됨
        const refreshResponse = await bareClient.post<ApiResponse<TokenResponse> | TokenResponse>(
          '/api/v1/auth/refresh',
          { refreshToken }
        );
        const response = unwrapData(refreshResponse.data);
        // 새 토큰 저장
        useAuthStore.getState().setTokens(response.accessToken, response.refreshToken);
        // 원래 요청에 새 토큰 적용
        originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
        // 대기 큐 해제 (성공)
        processQueue(null, response.accessToken);
        return apiClient(originalRequest);
      } catch {
        // 재발급 실패: refreshToken까지 만료된 상황 → 인증 정리 + 로그인 페이지로
        processQueue(error, null);
        useAuthStore.getState().clearAuth();
        redirectToLogin();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
