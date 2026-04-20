/**
 * @file 인증(Auth) 상태 관리 Zustand Store
 * @created Sprint 1 - Auth Store 구현 (Sprint 1에서 refreshToken 필드 추가)
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
 * - refreshToken: [Sprint 1 수정] accessToken 만료 시 재발급에 사용
 */
interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null; // [Sprint 1 수정] 토큰 재발급을 위한 리프레시 토큰 추가
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
      refreshToken: null, // [Sprint 1 수정] 초기값 추가
      setAuth: (user, accessToken, refreshToken) => set({ user, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'auth-storage' }
  )
);
