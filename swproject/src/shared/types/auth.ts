/**
 * @file 인증(Auth) 관련 타입 정의
 * @created Sprint 1 - Auth 타입 정의
 * @updated Backend Swagger spec alignment
 * @dependsOn 없음 (순수 타입 정의)
 * @usedBy src/features/auth/api/authApi.ts
 * @usedBy src/shared/stores/authStore.ts
 */

/**
 * 사용자 기본 정보
 * - backend AuthLoginEmailResDto 에서 추출
 */
export interface User {
  userId: number;
  email: string;
  name: string;
}

/**
 * 인증 세션 정보 (사용자 + 액세스 토큰)
 */
export interface AuthSession {
  user: User;
  accessToken: string;
}

/**
 * 로그인 요청 바디
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 회원가입 요청 바디
 * - backend AuthRegisterEmailReqDto 매칭
 */
export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

/**
 * 토큰 재발급 요청 바디
 */
export interface RefreshRequest {
  refreshToken: string;
}

/**
 * 토큰 재발급 응답 (accessToken + refreshToken 쌍)
 * - backend AuthRefreshTokenResDto 매칭 (expiresIn 제거)
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * 인증 응답 (로그인/회원가입 시 반환)
 * - backend AuthLoginEmailResDto 매칭
 * - { userId, email, name, accessToken, refreshToken }
 */
export interface AuthResponse {
  userId: number;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
}

/**
 * 로그아웃 요청 바디
 * - backend AuthLogoutReqDto 매칭
 */
export interface LogoutRequest {
  accessToken: string;
  refreshToken: string;
}
