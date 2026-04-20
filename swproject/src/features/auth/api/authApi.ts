/**
 * @file 인증(Auth) API 호출 함수 모음
 * @created Sprint 1 - Auth API 레이어 구현
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @dependsOn src/shared/types/auth.ts (LoginRequest, SignupRequest, AuthResponse, RefreshRequest, TokenResponse)
 * @usedBy src/features/auth/hooks/*.ts (모든 auth 훅)
 */

import apiClient from '@/shared/lib/axios';
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  RefreshRequest,
  TokenResponse,
} from '@/shared/types/auth';

const AUTH_BASE = '/api/v1/auth';

/**
 * 이메일 회원가입
 * - POST /api/v1/auth/register/email
 * - 성공 시 AuthResponse (user + accessToken + refreshToken) 반환
 */
export async function registerEmail(data: SignupRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${AUTH_BASE}/register/email`, data);
  return res.data;
}

/**
 * 이메일 로그인
 * - POST /api/v1/auth/login/email
 * - 성공 시 AuthResponse (user + accessToken + refreshToken) 반환
 */
export async function loginEmail(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${AUTH_BASE}/login/email`, data);
  return res.data;
}

/**
 * 액세스 토큰 재발급
 * - POST /api/v1/auth/refresh
 * - refreshToken으로 새 accessToken + refreshToken 쌍 발급
 * - 주로 axios 인터셉터에서 자동 호출되지만, 수동 호출용으로도 노출
 */
export async function refreshAccessToken(data: RefreshRequest): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>(`${AUTH_BASE}/refresh`, data);
  return res.data;
}

/**
 * 로그아웃
 * - POST /api/v1/auth/logout
 * - 서버 측에서 refreshToken 무효화
 * - 실패해도 클라이언트에서는 로그아웃 처리 진행 (useLogout 훅 참조)
 */
export async function logout(): Promise<void> {
  await apiClient.post(`${AUTH_BASE}/logout`);
}
