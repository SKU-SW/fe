/**
 * @file 대시보드 레이아웃 (인증 가드 + 사이드바 네비게이션)
 * @created Sprint 1 - Dashboard 레이아웃 구현
 * @dependsOn src/shared/stores/authStore.ts (accessToken - 인증 확인)
 * @dependsOn src/features/auth/hooks/useLogout.ts (useLogout 훅)
 * @usedBy src/app/(dashboard)/** (대시보드 하위 모든 페이지)
 *
 * 기능:
 * 1. 인증 가드: accessToken이 없으면 로그인 페이지로 리다이렉트
 * 2. 사이드바 네비게이션: 대시보드 하위 페이지 간 이동
 * 3. 헤더 로그아웃 버튼
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/shared/stores/authStore';
import { useLogout } from '@/features/auth/hooks';

/**
 * 사이드바 네비게이션 항목
 * - 2~3주차에 실제 페이지가 구현되면 활성화됨
 */
const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/character', label: 'AI 캐릭터 설정' },
  { href: '/chat-analysis', label: '채팅 분석' },
  { href: '/proactive', label: '선제 반응' },
  { href: '/game', label: '게임 연동' },
  { href: '/safety', label: '안전 관리' },
  { href: '/stats', label: '방송 통계' },
];

/**
 * 대시보드 레이아웃 컴포넌트
 * - 인증 가드: accessToken이 없으면 /login으로 리다이렉트
 * - 사이드바 + 헤더 + children(페이지 콘텐츠) 구조
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const { logout, isPending } = useLogout();

  // [인증 가드] 토큰이 없으면 로그인 페이지로 이동
  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken, router]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 네비게이션 */}
      <aside className="w-60 shrink-0 bg-white shadow-sm">
        <div className="px-6 py-5">
          <span className="text-lg font-bold text-indigo-600">SWproject</span>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 메인 영역: 헤더 + 페이지 콘텐츠 */}
      <div className="flex flex-1 flex-col">
        {/* 헤더: 타이틀 + 로그아웃 버튼 */}
        <header className="flex h-14 items-center justify-between border-b bg-white px-6 shadow-sm">
          <span className="text-sm text-gray-500">SWproject 대시보드</span>
          <button
            type="button"
            onClick={() => {
              void logout();
            }}
            disabled={isPending}
            className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 disabled:opacity-50"
          >
            {isPending ? '로그아웃 중...' : '로그아웃'}
          </button>
        </header>
        {/* 페이지 콘텐츠 */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
