/**
 * @file 회원가입 페이지
 * @migrated Next.js App Router → React Router
 * @change 'use client' 제거 (Vite는 모두 클라이언트)
 */

import { useSignup } from '@/features/auth/hooks';

export default function SignupPage() {
  const { signup } = useSignup();
  void signup;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">회원가입</h1>
        <p className="text-center text-sm text-gray-400">2주차에 구현 예정</p>
      </div>
    </main>
  );
}
