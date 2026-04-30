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
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <AuthCard title="회원가입" subtitle="AI 스트리머 파트너 플랫폼에 오신 것을 환영합니다">
        {apiError && (
          <div
            className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            role="alert"
          >
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 협업 메모: 로그인 페이지와 동일한 인풋 스타일/간격을 유지합니다. */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-slate-300">이름</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
              <input
                {...register('name')}
                id="name"
                type="text"
                autoComplete="name"
                placeholder="홍길동"
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            {errors.name && (
              <p id="name-error" className="text-red-400 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">이메일</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-red-400 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">비밀번호</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-red-400 text-sm">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-300">비밀번호 확인</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 pointer-events-none" />
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                aria-pressed={showConfirm}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-error" className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="w-full mt-6 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
          >
            {isSubmitting || isPending ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div className="mt-8 mb-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-900 text-slate-400">또는 소셜 계정으로 간편 가입</span>
          </div>
        </div>

        <GoogleButton label="Google로 회원가입" />

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              로그인
            </Link>
          </p>
        </div>
      </AuthCard>
    </main>
  );
}
