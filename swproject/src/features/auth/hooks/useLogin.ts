/**
 * @file 로그인 훅 - useLogin
 * @created Sprint 1 - Auth 훅 구현
 * @migrated next/navigation → react-router-dom
 * @dependsOn src/features/auth/api/authApi.ts (loginEmail)
 * @dependsOn src/shared/stores/authStore.ts (setAuth)
 * @usedBy src/pages/auth/LoginPage.tsx
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginEmail } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/authStore';
import type { LoginRequest } from '@/shared/types/auth';

/**
 * useLogin 훅 반환 타입
 */
interface UseLoginReturn {
  /** 로그인 실행 함수 - 성공 시 대시보드로 이동 */
  login: (data: LoginRequest) => Promise<void>;
  /** 로그인 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 로그인 훅
 * - loginEmail API 호출 → authStore에 사용자 정보 + 토큰 저장 → 대시보드로 라우팅
 * - 에러 발생 시 setError + 에러 re-throw (호출 측에서 처리)
 */
export function useLogin(): UseLoginReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const login = useCallback(
    async (data: LoginRequest) => {
      setIsPending(true);
      setError(null);
      try {
        const response = await loginEmail(data);
        // 로그인 성공: 사용자 정보 + 토큰 쌍을 store에 저장
        setAuth(response.user, response.accessToken, response.refreshToken);
        // 대시보드로 이동
        navigate('/dashboard');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
        setError(message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [setAuth, navigate]
  );

  return { login, isPending, error };
}
