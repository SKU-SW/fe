/**
 * @file 대시보드 사이드바 컴포넌트
 * @created Sprint 2 - Dashboard Sidebar
 * @dependsOn react-router-dom, lucide-react, useAuthStore, useLogout, useAIModeStore
 * @usedBy DashboardLayout
 *
 * 아이콘 네비게이션 + 항상 보이는 AI 모드 상태 + 사용자 패널(footer)
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  MessageCircle,
  Shield,
  Gamepad2,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Mic,
  Pause,
  LogOut,
  User,
} from 'lucide-react';
import { useAuthStore } from '@/shared/stores/authStore';
import { useLogout } from '@/features/auth/hooks';
import { useAIModeStore, AIMode } from '@/shared/stores/aiModeStore';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  group: 'main' | 'settings';
}

// 사용 빈도 기준 정렬:
// - main: 매일/방송마다 보는 화면 (대시보드 = 시작점, AI 캐릭터 = 방송 시작 지점, 채팅 분석/통계 = 방송 중·후 확인)
// - tools: 가끔 만지는 보조 기능 (안전·게임 연동)
const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: '대시보드',
    icon: <LayoutDashboard className="h-5 w-5" />,
    group: 'main',
  },
  {
    href: '/character',
    label: 'AI 캐릭터',
    icon: <Zap className="h-5 w-5" />,
    group: 'main',
  },
  {
    href: '/chat-analysis',
    label: '채팅 분석',
    icon: <MessageCircle className="h-5 w-5" />,
    group: 'main',
  },
  {
    href: '/stats',
    label: '방송 통계',
    icon: <BarChart3 className="h-5 w-5" />,
    group: 'main',
  },

  {
    href: '/safety',
    label: '안전 관리',
    icon: <Shield className="h-5 w-5" />,
    group: 'settings',
  },
  {
    href: '/game',
    label: '게임 연동',
    icon: <Gamepad2 className="h-5 w-5" />,
    group: 'settings',
  },
];

const MODE_LABEL: Record<AIMode, string> = {
  broadcasting: '방송 중',
  idle: '대기',
  gaming: '게임 중',
};

// dot 색상: broadcasting=빨강(라이브), gaming=보라, idle=회색
const MODE_DOT_CLASS: Record<AIMode, string> = {
  broadcasting: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  gaming: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]',
  idle: 'bg-slate-500',
};

interface DashboardSidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export default function DashboardSidebar({ onCollapse }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

  const user = useAuthStore((s) => s.user);
  const { logout, isPending } = useLogout();
  const mode = useAIModeStore((s) => s.mode);
  const isPaused = useAIModeStore((s) => s.isPaused);
  const isPTTActive = useAIModeStore((s) => s.isPTTActive);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapse?.(newState);
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const isActive = (href: string) => location.pathname === href;

  const mainItems = NAV_ITEMS.filter((item) => item.group === 'main');
  const settingsItems = NAV_ITEMS.filter((item) => item.group === 'settings');

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300`}
    >
      {/* 로고 영역 */}
      <div className="px-6 py-5 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="AI streamer" className="h-8 w-8 rounded-lg" />
            <span className="text-lg font-bold text-white">AI streamer</span>
          </div>
        )}
        {isCollapsed && (
          <img src="/logo.png" alt="AI streamer" className="h-8 w-8 rounded-lg mx-auto" />
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label={isCollapsed ? '사이드바 확장' : '사이드바 축소'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="메인 네비게이션">
        {/* Main 섹션 */}
        {!isCollapsed && (
          <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">메인</p>
        )}
        {mainItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isCollapsed ? item.label : undefined}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            {item.icon}
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}

        {/* 보조 도구 섹션 */}
        {!isCollapsed && <hr className="border-slate-800 my-4" />}
        {!isCollapsed && (
          <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">도구</p>
        )}
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isCollapsed ? item.label : undefined}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            {item.icon}
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* AI 모드 상태 (항상 표시) */}
      <div
        className={`border-t border-slate-800 ${
          isCollapsed ? 'px-0 py-3 flex justify-center' : 'px-4 py-3'
        }`}
        title={isCollapsed ? `${MODE_LABEL[mode]}${isPaused ? ' · 일시정지' : ''}${isPTTActive ? ' · PTT' : ''}` : undefined}
        aria-label="AI 모드 상태"
      >
        {isCollapsed ? (
          <div className="relative">
            <span className={`block h-2.5 w-2.5 rounded-full ${MODE_DOT_CLASS[mode]}`} />
            {isPTTActive && (
              <Mic className="absolute -top-2 -right-2 h-3 w-3 text-emerald-400" />
            )}
            {isPaused && (
              <Pause className="absolute -bottom-2 -right-2 h-3 w-3 text-amber-400" />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`block h-2.5 w-2.5 rounded-full shrink-0 ${MODE_DOT_CLASS[mode]}`} />
              <span className="text-sm font-medium text-white truncate">{MODE_LABEL[mode]}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isPaused && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300"
                  aria-label="일시정지"
                >
                  <Pause className="h-3 w-3" />
                </span>
              )}
              {isPTTActive && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-300"
                  aria-label="PTT 활성"
                >
                  <Mic className="h-3 w-3" />
                  PTT
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 사용자 패널 (footer) */}
      <div className="relative border-t border-slate-800 p-2">
        <button
          type="button"
          onClick={() => setShowUserMenu((v) => !v)}
          className={`w-full flex items-center gap-3 rounded-lg p-2 hover:bg-slate-800 transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          aria-label="사용자 메뉴"
          aria-expanded={showUserMenu}
          aria-haspopup="true"
          title={isCollapsed ? user?.name || 'User' : undefined}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-sm font-medium text-white shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
              </div>
              <ChevronUp
                className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${
                  showUserMenu ? 'rotate-180' : ''
                }`}
              />
            </>
          )}
        </button>

        {showUserMenu && (
          <div
            className={`absolute z-50 rounded-lg bg-slate-800 border border-slate-700 shadow-lg py-1 ${
              isCollapsed
                ? 'left-full bottom-2 ml-2 w-48'
                : 'left-2 right-2 bottom-full mb-2'
            }`}
            role="menu"
          >
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400">
              <User className="h-4 w-4" />
              <span className="truncate">{user?.email || ''}</span>
            </div>
            <hr className="border-slate-700 my-1" />
            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              disabled={isPending}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 disabled:opacity-50 transition-colors"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              {isPending ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
