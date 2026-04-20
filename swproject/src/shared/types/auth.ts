/**
 * @file 인증(Auth) 관련 타입 정의
 * @created Sprint 1 - Auth 타입 정의 (기존 + Sprint 1에서 RefreshRequest, TokenResponse, AuthResponse 추가)
 * @dependsOn 없음 (순수 타입 정의)
 * @usedBy src/features/auth/api/authApi.ts
 * @usedBy src/shared/stores/authStore.ts
 */

/**
 * 사용자 기본 정보
 */
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
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
 */
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

// [Sprint 1 수정] refreshToken 필드 추가
/**
 * 토큰 재발급 요청 바디
 */
export interface RefreshRequest {
  refreshToken: string;
}

// [Sprint 1 수정] refreshToken 필드 추가
/**
 * 토큰 재발급 응답 (accessToken + refreshToken 쌍)
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

// [Sprint 1 수정] refreshToken 필드 추가
/**
 * 인증 응답 (로그인/회원가입 시 반환)
 * - 사용자 정보 + 액세스/리프레시 토큰 쌍 포함
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
