/**
 * @file 인증 화면 공용 카드 (로그인/회원가입 공통 레이아웃)
 * @updated 카드 상단 로고 추가 (사이드바와 일관)
 * @usedBy src/pages/auth/LoginPage.tsx, src/pages/auth/SignupPage.tsx
 */

import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden">
      <div className="p-8 pb-6 text-center">
        <img
          src="/logo.png"
          alt="AI streamer"
          className="mx-auto mb-4 h-12 w-12 rounded-xl shadow-md"
        />
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-400 text-sm">{subtitle}</p>
      </div>
      <div className="px-8 pb-8">{children}</div>
    </div>
  );
}
