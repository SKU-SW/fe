/**
 * @file 로그아웃 훅 - useLogout
 * @created Sprint 1 - Auth 훅 구현
 * @updated Backend Swagger spec alignment (logout에 토큰 바디 전달)
 * @dependsOn src/features/auth/api/authApi.ts (logout)
 * @dependsOn src/shared/stores/authStore.ts (clearAuth, accessToken, refreshToken)
 * @usedBy src/components/layouts/DashboardLayout.tsx (헤더 로그아웃 버튼)
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/authStore';

/**
 * useLogout 훅 반환 타입
 */
interface UseLogoutReturn {
  /** 로그아웃 실행 함수 */
  logout: () => Promise<void>;
  /** 로그아웃 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 로그아웃 훅
 * - 서버에 로그아웃 API 호출 (refreshToken 무효화)
 * - 요청 바디: { accessToken, refreshToken }
 * - 서버 호출 실패해도 로컬에서는 무조건 로그아웃 처리
 *   (서버가 다운되어도 사용자는 로그아웃할 수 있어야 함)
 * - clearAuth 후 로그인 페이지로 이동
 */
export function useLogout(): UseLogoutReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    setIsPending(true);
    setError(null);
    try {
      // 서버에 토큰 쌍을 전달하여 로그아웃 요청
      if (accessToken && refreshToken) {
        await logout({ accessToken, refreshToken });
      }
    } catch {
      // 서버 로그아웃 실패해도 로컬에서는 로그아웃 처리
      // 네트워크 오류나 서버 다운 상황에서도 사용자는 로그아웃할 수 있어야 함
    } finally {
      clearAuth();
      setIsPending(false);
      navigate('/login');
    }
  }, [clearAuth, navigate, accessToken, refreshToken]);

  return { logout: handleLogout, isPending, error };
}
