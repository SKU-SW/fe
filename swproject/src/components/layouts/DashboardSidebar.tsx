/**
 * @file 대시보드 사이드바 컴포넌트
 * @updated 슬라이드(Collapse) 기능 부활 및 아이콘 추가, 마이크/스피커 축소 모드 UI 개선
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquareText,
  BarChart3,
  ShieldAlert,
  Gamepad2,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/shared/stores/authStore';
import { useLogout } from '@/features/auth/hooks';
import { useAIModeStore, AIMode } from '@/shared/stores/aiModeStore';
import { usePlatform } from '@/shared/hooks/usePlatform';
import { ChzzkStatusBadge } from '@/features/auth/components/ChzzkStatusBadge';

interface NavItem {
  href: string;
  label: string;
  group: 'main' | 'settings';
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: '대시보드', group: 'main', icon: LayoutDashboard },
  { href: '/character', label: 'AI 캐릭터', group: 'main', icon: Users },
  { href: '/chat-analysis', label: '채팅 분석', group: 'main', icon: MessageSquareText },
  { href: '/stats', label: '방송 통계', group: 'main', icon: BarChart3 },
  { href: '/safety', label: '안전 관리', group: 'settings', icon: ShieldAlert },
  { href: '/game', label: '게임 연동', group: 'settings', icon: Gamepad2 },
  { href: '/vrm-test', label: '3D 캐릭터 테스트', group: 'settings', icon: Sparkles },
  { href: '/settings', label: '설정', group: 'settings', icon: Settings },
];

const MODE_LABEL: Record<AIMode, string> = {
  broadcasting: '방송 중',
  idle: '대기',
  gaming: '게임 중',
};

const MODE_DOT_CLASS: Record<AIMode, string> = {
  broadcasting: 'bg-status-danger',
  gaming: 'bg-brand',
  idle: 'bg-content-muted',
};

export default function DashboardSidebar({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean; onToggleCollapse: () => void }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const platform = usePlatform();
  // macOS hiddenInset 타이틀바의 traffic light 가 좌상단을 차지하므로
  // 사이드바 로고 영역을 더 크게 잡아 시각적으로 겹치지 않게 한다.
  // 윈도우/리눅스는 시스템 타이틀바가 위에 있어 별도 보정 불필요.
  const isMac = platform === 'darwin';

  const user = useAuthStore((s) => s.user);
  const { logout, isPending } = useLogout();
  const mode = useAIModeStore((s) => s.mode);
  const isPaused = useAIModeStore((s) => s.isPaused);
  const isPTTActive = useAIModeStore((s) => s.isPTTActive);
  const sttEnabled = useAIModeStore((s) => s.toggles.sttEnabled);
  const ttsEnabled = useAIModeStore((s) => s.toggles.ttsEnabled);
  const setToggle = useAIModeStore((s) => s.setToggle);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const isActive = useCallback((href: string) => location.pathname.startsWith(href), [location.pathname]);

  // Mac 스타일 슬라이딩 인디케이터 상태 및 참조
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState({ top: 0, height: 0, opacity: 0 });

  // 메뉴 변경 및 축소/확장 시 인디케이터 재계산
  useEffect(() => {
    const activeItem = NAV_ITEMS.find((item) => isActive(item.href));
    if (activeItem && itemRefs.current[activeItem.href]) {
      const activeEl = itemRefs.current[activeItem.href];
      if (activeEl) {
        setIndicator({
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight,
          opacity: 1,
        });
      }
    } else {
      setIndicator((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [isActive, isCollapsed, location.pathname]);

  useEffect(() => {
    if (isCollapsed && showUserMenu) {
      setShowUserMenu(false);
    }
  }, [isCollapsed, showUserMenu]);

  const mainItems = NAV_ITEMS.filter((item) => item.group === 'main');
  const settingsItems = NAV_ITEMS.filter((item) => item.group === 'settings');

  return (
    <aside 
      className={`relative z-20 flex h-full shrink-0 flex-col border-r border-border-strong bg-surface-sidebar shadow-2xl transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* 1. 상단 로고 및 타이틀 영역 (macOS 는 traffic light 회피용으로 h-24 사용) */}
      <div className={`relative flex ${isMac ? 'h-24' : 'h-16'} shrink-0 items-center border-b border-border-strong bg-surface-sidebar`}>
        <Link 
          to="/dashboard" 
          className={`flex items-center gap-3 transition-colors group overflow-hidden ${
            isCollapsed ? 'mx-auto rounded-lg p-2 hover:bg-surface-hover/70' : 'mx-2 w-full rounded-lg py-2 pl-5 pr-4 hover:bg-surface-hover/70'
          }`}
          title={isCollapsed ? '대시보드로 이동' : undefined}
        >
          <img 
            src="/icon.png" 
            alt="Logo" 
            className="h-10 w-10 rounded-lg object-cover shadow-sm transition-transform shrink-0 group-hover:scale-105" 
          />
          {!isCollapsed && (
            <span className="whitespace-nowrap text-[15.5px] font-extrabold tracking-tight text-content-primary">
              Live Buddy
            </span>
          )}
        </Link>

        {/* 접기/펼치기 토글 버튼 (플로팅) */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          className="absolute -right-3 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border-strong bg-surface-sidebar text-content-muted shadow-lg transition-colors hover:bg-surface-hover hover:text-content-primary"
          aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. 네비게이션 메뉴 */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden" aria-label="메인 네비게이션">
        <div ref={navRef} className="relative flex flex-col px-3 py-2">
          {/* 슬라이딩 백그라운드 인디케이터 */}
          <div
            className="pointer-events-none absolute z-0 rounded-md border border-border-default bg-surface-active/90"
            style={{
              top: `${indicator.top}px`,
              left: '12px', // px-3
              right: '12px',
              height: `${indicator.height}px`,
              opacity: indicator.opacity,
              transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          />

          {!isCollapsed && (
            <p className="relative z-10 select-none whitespace-nowrap px-3 pb-2 pt-3 text-[11px] font-bold uppercase tracking-wider text-content-muted/70">
              메인 메뉴
            </p>
          )}
          {isCollapsed && <div className="h-4" />}

          {mainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                ref={(el) => { itemRefs.current[item.href] = el; }}
                title={isCollapsed ? item.label : undefined}
                className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center py-3' : 'px-3 py-2.5'} mb-0.5 rounded-md transition-colors ${
                  active
                    ? 'font-semibold text-content-primary'
                    : 'font-medium text-content-secondary hover:bg-surface-hover/70 hover:text-content-primary'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-content-primary' : 'text-content-muted'}`} />
                {!isCollapsed && <span className="ml-3 text-[15.5px] tracking-wide whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}

          {!isCollapsed && (
            <p className="relative z-10 select-none whitespace-nowrap px-3 pb-2 pt-6 text-[11px] font-bold uppercase tracking-wider text-content-muted/70">
              설정 및 도구
            </p>
          )}
          {isCollapsed && <div className="mx-2 my-2 h-6 border-t border-border-strong" />}

          {settingsItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                ref={(el) => { itemRefs.current[item.href] = el; }}
                title={isCollapsed ? item.label : undefined}
                className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center py-3' : 'px-3 py-2.5'} mb-0.5 rounded-md transition-colors ${
                  active
                    ? 'font-semibold text-content-primary'
                    : 'font-medium text-content-secondary hover:bg-surface-hover/70 hover:text-content-primary'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-content-primary' : 'text-content-muted'}`} />
                {!isCollapsed && <span className="ml-3 text-[15.5px] tracking-wide whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 3. AI 모드 상태 */}
      <div className={`flex items-center border-t border-border-strong bg-surface-sidebar px-5 py-3.5 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-2.5 min-w-0" title={isCollapsed ? MODE_LABEL[mode] : undefined}>
          <span className={`block h-2.5 w-2.5 rounded-full shrink-0 ${MODE_DOT_CLASS[mode]} shadow-sm`} />
          {!isCollapsed && <span className="truncate text-base font-semibold tracking-wide text-content-primary">{MODE_LABEL[mode]}</span>}
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 shrink-0">
            {isPaused && (
              <span className="rounded bg-status-warning/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-status-warning">정지</span>
            )}
            {isPTTActive && (
              <span className="rounded bg-status-success/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-status-success">PTT</span>
            )}
          </div>
        )}
      </div>

      {/* 4. 장치 토글 */}
      <div className={`flex items-center justify-center bg-surface-sidebar p-2 ${isCollapsed ? 'flex-col gap-2' : 'w-full gap-2 px-4'}`}>
        <DeviceToggleButton
          label="MIC"
          active={sttEnabled}
          isCollapsed={isCollapsed}
          iconOn={<Mic className="w-[18px] h-[18px]" />}
          iconOff={<MicOff className="w-[18px] h-[18px]" />}
          onClick={() => setToggle('sttEnabled', !sttEnabled)}
        />
        <DeviceToggleButton
          label="SPK"
          active={ttsEnabled}
          isCollapsed={isCollapsed}
          iconOn={<Volume2 className="w-[18px] h-[18px]" />}
          iconOff={<VolumeX className="w-[18px] h-[18px]" />}
          onClick={() => setToggle('ttsEnabled', !ttsEnabled)}
        />
      </div>

      {/* 5. 사용자 프로필 메뉴 */}
      <div className="relative border-t border-border-strong bg-surface-sidebar p-2">
        <button
          type="button"
          onClick={() => setShowUserMenu((v) => !v)}
          className={`flex w-full items-center gap-2.5 rounded-md py-1.5 transition-colors hover:bg-surface-hover/70 ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}
          title={isCollapsed ? user?.name || 'User' : undefined}
        >
          <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-active text-content-primary shadow-sm transition-colors">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            {isCollapsed && (
              <span className="absolute -bottom-1 -right-1">
                <ChzzkStatusBadge variant="icon" />
              </span>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-sm font-bold text-content-primary">{user?.name || 'User'}</p>
              <div className="mt-0.5">
                <ChzzkStatusBadge variant="compact" />
              </div>
            </div>
          )}
        </button>

        {showUserMenu && (
          <div className={`absolute bottom-full z-50 mb-2 rounded-lg border border-border-strong bg-surface-panel p-1.5 shadow-xl ${isCollapsed ? 'left-full ml-2 w-40' : 'left-3 right-3'}`}>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium text-status-danger transition-colors hover:bg-status-danger hover:text-content-inverse disabled:opacity-50"
            >
              {!isCollapsed && <LogOut className="w-4 h-4" />}
              {isPending ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

interface DeviceToggleButtonProps {
  label: string;
  active: boolean;
  isCollapsed: boolean;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  onClick: () => void;
}

function DeviceToggleButton({ label, active, isCollapsed, iconOn, iconOff, onClick }: DeviceToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={`${label} ${active ? '켜짐' : '꺼짐'}`}
      className={`flex items-center justify-center rounded-md transition-colors ${isCollapsed ? 'w-full py-2.5' : 'h-9 w-9'} ${active ? 'bg-transparent text-content-primary hover:bg-surface-hover/70' : 'bg-transparent text-content-muted hover:bg-surface-hover/70'}`}
    >
      {active ? iconOn : iconOff}
    </button>
  );
}
