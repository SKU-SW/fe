/**
 * @file 로그인 페이지
 * @created Sprint 1 - Auth 페이지 구현
 * @dependsOn src/features/auth/hooks/useLogin.ts (useLogin 훅)
 * @dependsOn src/features/auth/schemas/authSchemas.ts (loginSchema, LoginFormData)
 * @dependsOn src/features/auth/components/AuthCard.tsx
 * @dependsOn src/features/auth/components/GoogleButton.tsx
 *
 * 기능:
 * - react-hook-form + zod로 폼 유효성 검사
 * - useLogin 훅으로 API 호출
 * - 에러 표시 (API 에러 + 필드 유효성 에러)
 * - Google 로그인 버튼 준비 (UI만, 기능은 추후 구현)
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useLogin } from '@/features/auth/hooks';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/authSchemas';
import AuthCard from '@/features/auth/components/AuthCard';
import GoogleButton from '@/features/auth/components/GoogleButton';

/**
 * 로그인 페이지 컴포넌트
 * - 이메일/비밀번호 입력 폼
 * - 제출 시 useLogin 훅으로 API 호출
 * - 성공 시 대시보드로 자동 이동 (훅 내부 처리)
 */
export default function LoginPage() {
  // API 레벨 에러 상태 (서버 응답 에러)
  const [apiError, setApiError] = useState('');
  const { login, isPending } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 폼 제출 핸들러
  const onSubmit = async (data: LoginFormData) => {
    setApiError('');
    try {
      await login(data);
    } catch (err: unknown) {
      // 에러 메시지 추출: Error 객체 → API 응답 data.message → 기본 메시지
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setApiError(message ?? '로그인에 실패했습니다');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <AuthCard title="환영합니다" subtitle="AI 스트리머 파트너 플랫폼에 로그인하세요">
        {/* API 에러 표시 */}
        {apiError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {apiError}
          </div>
        )}

        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 이메일 필드 */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-300">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
              <input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-sm">{errors.email.message}</p>
            )}
          </div>

          {/* 비밀번호 필드 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">비밀번호</label>
              <a href="#" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                비밀번호 찾기
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm">{errors.password.message}</p>
            )}
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="w-full mt-6 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
          >
            {isSubmitting || isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 구분선 + Google 로그인 */}
        <div className="mt-8 mb-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-400">또는</span>
          </div>
        </div>

        <GoogleButton label="Google로 로그인" />

        {/* 회원가입 링크 */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
              회원가입
            </Link>
          </p>
        </div>
      </AuthCard>
    </main>
  );
}
