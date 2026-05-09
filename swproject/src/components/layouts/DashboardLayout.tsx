/**
 * @file 대시보드 레이아웃 (인증 가드 + 사이드바 네비게이션)
 * @updated Discord-style theme (No icons, solid specific dark colors)
 */

import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/authStore';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';

export default function DashboardLayout() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const handleMainClick = () => {
    if (!isCollapsed) {
      setIsCollapsed(true);
    }
  };

  const handleSidebarClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  };

  return (
    <div className="flex h-screen bg-discord-main overflow-hidden text-discord-text">
      {/* 사이드바 네비게이션 */}
      <div onClick={handleSidebarClick} className="h-full flex shrink-0 cursor-default">
        <DashboardSidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0" onClick={handleMainClick}>
        {/* 헤더 */}
        <DashboardHeader />

        {/* React Router Outlet */}
        <main className="flex-1 overflow-auto p-6 cursor-default">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
