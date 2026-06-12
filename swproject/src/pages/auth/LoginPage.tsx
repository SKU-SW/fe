/**
 * @file 로그인 페이지
 * @migrated Next.js App Router → React Router
 * @updated A1~A4: 비밀번호 보기 토글, autoComplete, 자동 포커스, 죽은 링크 제거
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLogin } from '@/features/auth/hooks';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas/authSchemas';
import AuthCard from '@/features/auth/components/AuthCard';
import GoogleButton from '@/features/auth/components/GoogleButton';

export default function LoginPage() {
  const { login, isPending, error: apiError } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    setFocus('email');
  }, [setFocus]);

  const onSubmit = async (data: LoginFormData) => {
    await login(data);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base p-4 transition-colors">
      {/* 헤더가 없는 화면이라 상단에 창 이동용 드래그 스트립을 둔다(Electron hiddenInset). */}
      <div className="app-drag-region fixed inset-x-0 top-0 z-50 h-7" />
      <AuthCard title="환영합니다" subtitle="AI 스트리머 파트너 플랫폼에 로그인하세요">
        {apiError && (
          <div
            className="mb-4 rounded-xl border border-status-danger/20 bg-status-danger/10 p-3 text-base text-status-danger"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-base font-medium text-content-secondary">이메일</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-content-muted" />
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="w-full rounded-xl border border-border-default bg-surface-base py-2.5 pl-10 pr-3 text-base text-content-primary placeholder:text-content-muted transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-base text-status-danger">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-base font-medium text-content-secondary">비밀번호</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-content-muted" />
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="w-full rounded-xl border border-border-default bg-surface-base py-2.5 pl-10 pr-10 text-base text-content-primary placeholder:text-content-muted transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-base text-status-danger">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="mt-6 w-full rounded-xl bg-brand px-4 py-2.5 text-base font-medium text-content-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-8 mb-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default" />
          </div>
          <div className="relative flex justify-center text-base">
            <span className="bg-surface-panel px-2 text-content-muted">또는</span>
          </div>
        </div>

        <GoogleButton label="Google로 로그인" />

        <div className="mt-8 text-center">
          <p className="text-base text-content-muted">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-brand transition-colors hover:text-brand-hover">
              회원가입
            </Link>
          </p>
        </div>
      </AuthCard>
    </main>
  );
}
