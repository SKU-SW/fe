/**
 * @file 대시보드 헤더 컴포넌트
 * @created Sprint 2 - Dashboard Header
 * @dependsOn useAuthStore, useLogout
 * @usedBy DashboardLayout
 * 
 * 사용자 정보, 알림, 설정, 드롭다운 메뉴를 포함한 헤더
 */

import { useState } from 'react';
import { Bell, Settings, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/authStore';
import { useLogout } from '@/features/auth/hooks';

interface DashboardHeaderProps {
  pageTitle?: string;
}

export default function DashboardHeader({ pageTitle = 'Dashboard' }: DashboardHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { logout, isPending } = useLogout();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 shadow-lg">
      {/* 좌측: 페이지 타이틀 */}
      <div>
        <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
        <p className="text-xs text-slate-400">AI 스트리머 파트너</p>
      </div>

      {/* 우측: 알림 + 설정 + 사용자 메뉴 */}
      <div className="flex items-center gap-4">
        {/* 알림 벨 */}
        <button
          type="button"
          className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          aria-label="알림"
        >
          <Bell className="h-5 w-5" />
          {/* 알림 배지 (향후) */}
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* 설정 */}
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          aria-label="설정"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* 사용자 드롭다운 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="사용자 메뉴"
            aria-expanded={showUserMenu}
            aria-haspopup="true"
          >
            {/* 아바타 */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400">{user?.email || 'user@example.com'}</p>
            </div>
          </button>

          {/* 드롭다운 메뉴 */}
          {showUserMenu && (
            <div 
              className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-800 border border-slate-700 shadow-lg z-50"
              role="menu"
            >
              <a
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                role="menuitem"
              >
                <User className="h-4 w-4" />
                프로필
              </a>
              <a
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                role="menuitem"
              >
                <Settings className="h-4 w-4" />
                설정
              </a>
              <hr className="border-slate-700 my-1" />
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                disabled={isPending}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 disabled:opacity-50 transition-colors"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                {isPending ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
