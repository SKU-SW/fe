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
    <main className="min-h-screen bg-discord-main flex items-center justify-center p-4">
      <AuthCard title="환영합니다" subtitle="AI 스트리머 파트너 플랫폼에 로그인하세요">
        {apiError && (
          <div
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-discord-text">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-discord-textMuted pointer-events-none" />
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="w-full pl-10 pr-3 py-2.5 bg-discord-main border border-discord-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-red-400 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-discord-text">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-discord-textMuted pointer-events-none" />
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="w-full pl-10 pr-10 py-2.5 bg-discord-main border border-discord-dark rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-discord-textMuted hover:text-discord-text hover:bg-discord-sidebar transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-red-400 text-sm">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="w-full mt-6 py-2.5 px-4 bg-discord-blurple hover:bg-discord-blurpleHover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
          >
            {isSubmitting || isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-8 mb-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-discord-dark" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-discord-sidebar text-discord-textMuted">또는</span>
          </div>
        </div>

        <GoogleButton label="Google로 로그인" />

        <div className="mt-8 text-center">
          <p className="text-sm text-discord-textMuted">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-discord-blurple hover:text-discord-blurple transition-colors">
              회원가입
            </Link>
          </p>
        </div>
      </AuthCard>
    </main>
  );
}
