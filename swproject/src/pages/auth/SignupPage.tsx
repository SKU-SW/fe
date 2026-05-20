/**
 * @file 회원가입 페이지
 * @migrated Next.js App Router → React Router
 * @updated 비밀번호 보기 토글, autoComplete, 자동 포커스 (LoginPage와 일관)
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSignup } from '@/features/auth/hooks';
import { signupSchema, type SignupFormData } from '@/features/auth/schemas/authSchemas';
import AuthCard from '@/features/auth/components/AuthCard';
import GoogleButton from '@/features/auth/components/GoogleButton';

export default function SignupPage() {
  const { signup, isPending, error: apiError } = useSignup();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    setFocus('name');
  }, [setFocus]);

  // 협업 메모: SignupFormData의 confirmPassword를 passwordConfirm으로 매핑하여
  // backend AuthRegisterEmailReqDto 스펙에 맞게 전달합니다.
  const onSubmit = async (data: SignupFormData) => {
    const { name, email, password, confirmPassword } = data;
    await signup({ name, email, password, passwordConfirm: confirmPassword });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base p-4 transition-colors">
      <AuthCard title="회원가입" subtitle="AI 스트리머 파트너 플랫폼에 오신 것을 환영합니다">
        {apiError && (
          <div
            className="mb-4 rounded-xl border border-status-danger/20 bg-status-danger/10 p-3 text-base text-status-danger"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 협업 메모: 로그인 페이지와 동일한 인풋 스타일/간격을 유지합니다. */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-base font-medium text-content-secondary">이름</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-content-muted" />
              <input
                {...register('name')}
                id="name"
                type="text"
                autoComplete="name"
                placeholder="홍길동"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className="w-full rounded-xl border border-border-default bg-surface-base py-2.5 pl-10 pr-3 text-base text-content-primary placeholder:text-content-muted transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
            </div>
            {errors.name && (
              <p id="name-error" className="text-base text-status-danger">{errors.name.message}</p>
            )}
          </div>

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
                autoComplete="new-password"
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

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-base font-medium text-content-secondary">비밀번호 확인</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-content-muted" />
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                className="w-full rounded-xl border border-border-default bg-surface-base py-2.5 pl-10 pr-10 text-base text-content-primary placeholder:text-content-muted transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showConfirm}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-error" className="text-base text-status-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="mt-6 w-full rounded-xl bg-brand px-4 py-2.5 text-base font-medium text-content-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting || isPending ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div className="mt-8 mb-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default" />
          </div>
          <div className="relative flex justify-center text-base">
            <span className="bg-surface-panel px-2 text-content-muted">또는 소셜 계정으로 간편 가입</span>
          </div>
        </div>

        <GoogleButton label="Google로 회원가입" />

        <div className="mt-8 text-center">
          <p className="text-base text-content-muted">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-brand transition-colors hover:text-brand-hover">
              로그인
            </Link>
          </p>
        </div>
      </AuthCard>
    </main>
  );
}
