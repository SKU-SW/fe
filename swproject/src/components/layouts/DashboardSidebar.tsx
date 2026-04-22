/**
 * @file 대시보드 사이드바 컴포넌트
 * @created Sprint 2 - Dashboard Sidebar
 * @dependsOn react-router-dom, lucide-react
 * @usedBy DashboardLayout
 * 
 * 아이콘, 활성 상태, 축소 기능을 포함한 사이드바
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
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  group: 'main' | 'settings';
}

const NAV_ITEMS: NavItem[] = [
  // Main
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
    href: '/proactive',
    label: '선제 반응',
    icon: <Shield className="h-5 w-5" />,
    group: 'main',
  },
  {
    href: '/game',
    label: '게임 연동',
    icon: <Gamepad2 className="h-5 w-5" />,
    group: 'main',
  },

  // Settings
  {
    href: '/stats',
    label: '방송 통계',
    icon: <BarChart3 className="h-5 w-5" />,
    group: 'settings',
  },
  {
    href: '/settings',
    label: '설정',
    icon: <Settings className="h-5 w-5" />,
    group: 'settings',
  },
];

interface DashboardSidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export default function DashboardSidebar({ onCollapse }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapse?.(newState);
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
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="text-lg font-bold text-white">SWproject</span>
          </div>
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
      <nav className="flex-1 px-3 py-4 space-y-1" aria-label="메인 네비게이션">
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
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isCollapsed ? item.label : undefined}
            aria-current={isActive(item.href) ? 'page' : undefined}
          >
            {item.icon}
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}

        {/* Settings 섹션 */}
        {!isCollapsed && <hr className="border-slate-800 my-4" />}
        {!isCollapsed && (
          <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">설정</p>
        )}
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
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

      {/* 버전 정보 (선택사항) */}
      {!isCollapsed && (
        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">v1.0.0</p>
        </div>
      )}
    </aside>
  );
}
