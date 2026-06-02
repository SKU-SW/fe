/**
 * @file 인증(Auth) API 호출 함수 모음
 * @created Sprint 1 - Auth API 레이어 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @dependsOn src/shared/types/auth.ts (LoginRequest, SignupRequest, AuthResponse, RefreshRequest, TokenResponse, LogoutRequest)
 * @usedBy src/features/auth/hooks/*.ts (모든 auth 훅)
 */

import apiClient, { bareClient } from '@/shared/lib/axios';
import type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  RefreshRequest,
  TokenResponse,
  LogoutRequest,
  ChzzkAuthUrlResponse,
  ChzzkStatusResponse,
} from '@/shared/types/auth';

const AUTH_BASE = '/api/v1/auth';

/**
 * 이메일 회원가입
 * - POST /api/v1/auth/register/email
 * - 요청: { name, email, password, passwordConfirm }
 * - 성공 시 AuthResponse (userId + email + name + accessToken + refreshToken) 반환
 */
export async function registerEmail(data: SignupRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${AUTH_BASE}/register/email`, data);
  return res.data;
}

/**
 * 이메일 로그인
 * - POST /api/v1/auth/login/email
 * - 성공 시 AuthResponse (userId + email + name + accessToken + refreshToken) 반환
 */
export async function loginEmail(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>(`${AUTH_BASE}/login/email`, data);
  return res.data;
}

/**
 * 액세스 토큰 재발급
 * - POST /api/v1/auth/refresh
 * - refreshToken으로 새 accessToken + refreshToken 쌍 발급
 * - 응답: { accessToken, refreshToken } (expiresIn 없음)
 * - 주로 axios 인터셉터에서 자동 호출되지만, 수동 호출용으로도 노출
 */
export async function refreshAccessToken(data: RefreshRequest): Promise<TokenResponse> {
  // refresh API는 인터셉터 영향을 받지 않도록 bareClient 사용
  const res = await bareClient.post<TokenResponse>(`${AUTH_BASE}/refresh`, data);
  return res.data;
}

/**
 * 로그아웃
 * - POST /api/v1/auth/logout
 * - 요청 바디: { accessToken, refreshToken }
 * - 서버 측에서 refreshToken 무효화
 * - 실패해도 클라이언트에서는 로그아웃 처리 진행 (useLogout 훅 참조)
 */
export async function logout(data: LogoutRequest): Promise<void> {
  await apiClient.post(`${AUTH_BASE}/logout`, data);
}

/**
 * 치지직 인증 URL 조회
 * - GET /api/v1/auth/chzzk (Bearer JWT 필요)
 * - 백엔드가 state를 Redis에 저장 후 chzzk OAuth URL 반환
 * - 프론트는 받은 authUrl을 외부 브라우저로 열어야 함 (Electron shell.openExternal)
 */
export async function getChzzkAuthUrl(): Promise<ChzzkAuthUrlResponse> {
  const res = await apiClient.get<ChzzkAuthUrlResponse>(`${AUTH_BASE}/chzzk`);
  return res.data;
}

/**
 * 치지직 연동 상태 조회
 * - GET /api/v1/auth/chzzk/status (백엔드 추가 요청 중)
 * - linked=false 이거나 refreshToken 만료 시 재연동 필요
 */
export async function getChzzkStatus(): Promise<ChzzkStatusResponse> {
  const res = await apiClient.get<ChzzkStatusResponse>(`${AUTH_BASE}/chzzk/status`);
  return res.data;
}

/**
 * 치지직 연동 해제
 * - DELETE /api/v1/auth/chzzk (백엔드 추가 요청 중)
 * - 백엔드 AuthService.revokeChzzkTokens() 호출 → chzzk revoke + User 엔티티 토큰 정리
 */
export async function disconnectChzzk(): Promise<void> {
  await apiClient.delete(`${AUTH_BASE}/chzzk`);
}
