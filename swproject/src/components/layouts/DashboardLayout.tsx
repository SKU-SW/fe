/**
 * @file 대시보드 레이아웃 (인증 가드 + 사이드바 네비게이션)
 * @migrated Next.js App Router → React Router
 * @change next/link → react-router-dom Link, useRouter → useNavigate, children → Outlet
 * @updated Sprint 2 - 다크 테마 통일, 헤더/사이드바 개선
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';

/**
 * 대시보드 레이아웃 컴포넌트
 * - 인증 가드: accessToken이 없으면 /login으로 리다이렉트
 * - 다크 테마 사이드바 + 개선된 헤더 + Outlet(페이지 콘텐츠) 구조
 * - 반응형: 모바일에서 사이드바 토글 기능 (향후 구현)
 */
export default function DashboardLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);

  // 인증 가드: accessToken이 없으면 /login으로 리다이렉트
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-950 overflow-hidden">
      {/* 사이드바 네비게이션 (뷰포트 높이에 고정) */}
      <DashboardSidebar />

      {/* 메인 영역: 헤더 + 페이지 콘텐츠 (이 안에서만 스크롤) */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        {/* 헤더: 라우트별 페이지 타이틀/설명 + 알림 + 설정 */}
        <DashboardHeader />

        {/* React Router Outlet for nested routes */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
