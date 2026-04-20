/**
 * @file API 응답/에러 공통 타입 정의
 * @created Sprint 1 - API 레이어 공통 타입 구현
 * @dependsOn 없음 (순수 타입 정의)
 * @usedBy src/shared/lib/axios.ts (ApiResponse unwrap)
 * @usedBy src/features/**/api/*.ts (모든 API 함수)
 */

/**
 * 백엔드 API 표준 응답 래퍼
 * - 모든 API 응답은 이 구조로 감싸져 반환됨
 * - axios 인터셉터에서 자동으로 unwrap되어 실제 데이터만 전달됨
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * API 에러 응답 타입
 * - HTTP 상태 코드와 에러 메시지를 포함
 */
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
