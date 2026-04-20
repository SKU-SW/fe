/**
 * @file 토큰 재발급 훅 - useRefreshToken
 * @created Sprint 1 - Auth 훅 구현
 * @migrated 'use client' 제거 (Vite는 모두 클라이언트)
 * @dependsOn src/features/auth/api/authApi.ts (refreshAccessToken)
 * @dependsOn src/shared/stores/authStore.ts (setTokens, refreshToken)
 * @usedBy 필요시 수동 토큰 갱신이 필요한 컴포넌트에서 사용
 *
 * 참고: 대부분의 토큰 재발급은 src/shared/lib/axios.ts 인터셉터에서 자동으로 처리됨.
 * 이 훅은 명시적으로 토큰 갱신이 필요한 경우(예: 앱 foreground 복귀 시)에 사용.
 */

import { useState, useCallback } from 'react';
import { refreshAccessToken } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * useRefreshToken 훅 반환 타입
 */
interface UseRefreshTokenReturn {
  /** 토큰 재발급 실행 함수 - 성공 시 true, 실패 시 false 반환 */
  refresh: () => Promise<boolean>;
  /** 토큰 재발급 진행 중 여부 */
  isRefreshing: boolean;
}

/**
 * 토큰 재발급 훅
 * - refreshToken으로 새 accessToken + refreshToken 쌍을 발급받음
 * - axios 인터셉터의 자동 재발급과 별개로, 수동 재발급이 필요할 때 사용
 * - refreshToken이 없으면 바로 false 반환 (API 호출 안 함)
 */
export function useRefreshToken(): UseRefreshTokenReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const setTokens = useAuthStore((s) => s.setTokens);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  const refresh = useCallback(async (): Promise<boolean> => {
    // refreshToken이 없으면 재발급 불가
    if (!refreshToken) return false;
    setIsRefreshing(true);
    try {
      const response = await refreshAccessToken({ refreshToken });
      // 새 토큰 쌍으로 store 갱신
      setTokens(response.accessToken, response.refreshToken);
      return true;
    } catch {
      // 재발급 실패 (refreshToken 만료 등)
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken, setTokens]);

  return { refresh, isRefreshing };
}
