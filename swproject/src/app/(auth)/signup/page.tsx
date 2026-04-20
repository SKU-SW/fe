/**
 * @file 회원가입 페이지
 * @created Sprint 1 - Auth 페이지 구현 (UI는 2주차 구현 예정)
 * @dependsOn src/features/auth/hooks/useSignup.ts (useSignup 훅 준비됨)
 *
 * 현재 상태:
 * - useSignup 훅은 이미 연동되어 있음
 * - UI는 2주차에 react-hook-form + zod로 구현 예정
 * - void signup으로 ESLint 경고 방지 (훅 준비 확인용)
 */

'use client';

import { useSignup } from '@/features/auth/hooks';

/**
 * 회원가입 페이지 컴포넌트
 * - 2주차에 폼 UI 구현 예정 (이메일, 비밀번호, 이름 입력)
 * - useSignup 훅은 이미 준비됨 (회원가입 → 자동 로그인 → 대시보드 이동)
 */
export default function SignupPage() {
  const { signup } = useSignup();
  void signup; // ESLint 경고 방지 - 훅이 준비되어 있음을 표시

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">회원가입</h1>
        <p className="text-center text-sm text-gray-400">2주차에 구현 예정</p>
      </div>
    </main>
  );
}
