/**
 * @file 회원가입 훅 - useSignup
 * @created Sprint 1 - Auth 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/auth/api/authApi.ts (registerEmail)
 * @dependsOn src/shared/stores/authStore.ts (setAuth)
 * @usedBy src/pages/auth/SignupPage.tsx
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { registerEmail } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/shared/stores/authStore';
import type { SignupRequest, User } from '@/shared/types/auth';

/**
 * useSignup 훅 반환 타입
 */
interface UseSignupReturn {
  /** 회원가입 실행 함수 - 성공 시 대시보드로 이동 */
  signup: (data: SignupRequest) => Promise<void>;
  /** 회원가입 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 회원가입 훅
 * - registerEmail API 호출 → authStore에 사용자 정보 + 토큰 저장 → 대시보드로 라우팅
 * - 로그인과 동일한 플로우 (회원가입 후 자동 로그인)
 */
export function useSignup(): UseSignupReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const signup = useCallback(
    async (data: SignupRequest) => {
      setIsPending(true);
      setError(null);
      try {
        const response = await registerEmail(data);
        // 회원가입 성공: 응답에서 User 객체 구성 후 자동 로그인 처리
        const user: User = {
          userId: response.userId,
          email: response.email,
          name: response.name,
        };
        setAuth(user, response.accessToken, response.refreshToken);
        // 대시보드로 이동
        navigate('/dashboard');
      } catch (err: unknown) {
        const message =
          (err as AxiosError<{ message?: string }>)?.response?.data?.message ??
          (err instanceof Error ? err.message : '회원가입에 실패했습니다.');
        setError(message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [setAuth, navigate]
  );

  return { signup, isPending, error };
}
