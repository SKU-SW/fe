/**
 * @file 인증(Auth) 상태 관리 Zustand Store
 * @created Sprint 1 - Auth Store 구현
 * @updated Backend Swagger spec alignment (User 타입 userId로 변경)
 * @dependsOn src/shared/types/auth.ts (User 타입)
 * @usedBy src/shared/lib/axios.ts (JWT 토큰 읽기/갱신)
 * @usedBy src/features/auth/hooks/*.ts (로그인/로그아웃/토큰 재발급)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/shared/types/auth';

/**
 * 인증 Store 인터페이스
 * - user: 현재 로그인한 사용자 정보
 * - accessToken: API 요청 시 Authorization 헤더에 사용
 * - refreshToken: accessToken 만료 시 재발급에 사용
 */
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** 로그인/회원가입 성공 시 호출 - 사용자 정보 + 토큰 쌍 저장 */
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  /** 토큰 재발급 시 호출 - 토큰만 갱신 (사용자 정보는 유지) */
  setTokens: (accessToken: string, refreshToken: string) => void;
  /** 로그아웃 시 호출 - 모든 인증 정보 초기화 */
  clearAuth: () => void;
}

/**
 * 인증 상태 Store
 * - zustand persist 미들웨어로 localStorage에 자동 저장 (key: 'auth-storage')
 * - 앱 재시작 시 로그인 상태 유지
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'auth-storage',
      // accessToken도 persist에 포함 (페이지 새로고침 시 인증 상태 유지)
      // 보안상 민감한 서비스라면 httpOnly cookie + refresh flow 권장
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
