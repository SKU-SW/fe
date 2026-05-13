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
];

const MODE_LABEL: Record<AIMode, string> = {
  broadcasting: '방송 중',
  idle: '대기',
  gaming: '게임 중',
};

const MODE_DOT_CLASS: Record<AIMode, string> = {
  broadcasting: 'bg-red-500',
  gaming: 'bg-purple-500',
  idle: 'bg-discord-textMuted',
};

export default function DashboardSidebar({ isCollapsed, onToggleCollapse }: { isCollapsed: boolean; onToggleCollapse: () => void }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();

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

  const mainItems = NAV_ITEMS.filter((item) => item.group === 'main');
  const settingsItems = NAV_ITEMS.filter((item) => item.group === 'settings');

  return (
    <aside 
      className={`h-full ${isCollapsed ? 'w-20' : 'w-64'} shrink-0 flex flex-col bg-discord-sidebar border-r border-[#1e1f22] transition-all duration-300 z-10 relative`}
    >
      {/* 1. 상단 로고 및 타이틀 영역 */}
      <div className="h-16 flex items-center shrink-0 border-b border-[#1e1f22] relative">
        <Link 
          to="/dashboard" 
          className={`flex items-center gap-3 transition-colors group overflow-hidden ${
            isCollapsed ? 'mx-auto p-2 rounded-lg hover:bg-white/5' : 'pl-5 pr-4 py-2 w-full hover:bg-white/5 mx-2 rounded-lg'
          }`}
          title={isCollapsed ? '대시보드로 이동' : undefined}
        >
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-7 h-7 rounded-md object-cover shadow-sm group-hover:scale-105 transition-transform shrink-0" 
          />
          {!isCollapsed && (
            <span className="text-[14.5px] font-extrabold text-[#f2f3f5] tracking-tight whitespace-nowrap">
              AI streamer partner
            </span>
          )}
        </Link>

        {/* 접기/펼치기 토글 버튼 (플로팅) */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-discord-sidebar border border-[#1e1f22] rounded-full flex items-center justify-center text-discord-textMuted hover:text-discord-textHover z-20 shadow-md transition-colors"
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
            className="absolute bg-[#404249]/80 rounded-md pointer-events-none z-0"
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
            <p className="relative z-10 px-3 pt-3 pb-2 text-[11px] font-bold text-discord-textMuted/70 uppercase tracking-wider select-none whitespace-nowrap">
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
                    ? 'text-[#f2f3f5] font-semibold'
                    : 'text-[#b5bac1] font-medium hover:text-[#dbdee1] hover:bg-white/5'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-[#f2f3f5]' : 'text-[#80848e]'}`} />
                {!isCollapsed && <span className="ml-3 text-[14.5px] tracking-wide whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}

          {!isCollapsed && (
            <p className="relative z-10 px-3 pt-6 pb-2 text-[11px] font-bold text-discord-textMuted/70 uppercase tracking-wider select-none whitespace-nowrap">
              설정 및 도구
            </p>
          )}
          {isCollapsed && <div className="h-6 border-t border-[#1e1f22] my-2 mx-2" />}

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
                    ? 'text-[#f2f3f5] font-semibold'
                    : 'text-[#b5bac1] font-medium hover:text-[#dbdee1] hover:bg-white/5'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-[#f2f3f5]' : 'text-[#80848e]'}`} />
                {!isCollapsed && <span className="ml-3 text-[14.5px] tracking-wide whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 3. AI 모드 상태 */}
      <div className={`px-5 py-3.5 bg-[#232428] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-t border-[#1e1f22]`}>
        <div className="flex items-center gap-2.5 min-w-0" title={isCollapsed ? MODE_LABEL[mode] : undefined}>
          <span className={`block h-2.5 w-2.5 rounded-full shrink-0 ${MODE_DOT_CLASS[mode]} shadow-sm`} />
          {!isCollapsed && <span className="text-sm font-semibold text-[#f2f3f5] tracking-wide truncate">{MODE_LABEL[mode]}</span>}
        </div>
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 shrink-0">
            {isPaused && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-discord-blurple uppercase">정지</span>
            )}
            {isPTTActive && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-discord-success uppercase">PTT</span>
            )}
          </div>
        )}
      </div>

      {/* 4. 장치 토글 */}
      <div className={`flex items-center justify-center p-3 bg-[#232428] ${isCollapsed ? 'flex-col gap-2' : 'gap-3 w-full'}`}>
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
      <div className="relative p-3 bg-[#232428]">
        <button
          type="button"
          onClick={() => setShowUserMenu((v) => !v)}
          className={`w-full flex items-center gap-3 rounded-md py-1.5 hover:bg-white/5 transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}
          title={isCollapsed ? user?.name || 'User' : undefined}
        >
          <div className="h-8 w-8 rounded-full bg-[#5865F2] flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[13px] font-bold text-[#f2f3f5] truncate">{user?.name || 'User'}</p>
              <p className="text-[11px] text-[#949ba4] truncate">{user?.email || 'user@example.com'}</p>
            </div>
          )}
        </button>

        {showUserMenu && (
          <div className={`absolute z-50 bottom-full mb-2 rounded-lg bg-[#111214] border border-[#1e1f22] p-1.5 shadow-xl ${isCollapsed ? 'left-full ml-2 w-40' : 'left-3 right-3'}`}>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-[13px] font-medium text-[#f23f42] hover:bg-[#f23f42] hover:text-white disabled:opacity-50 transition-colors"
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
      className={`flex items-center justify-center rounded-md transition-colors ${isCollapsed ? 'py-2.5 w-full' : 'w-10 h-10'} ${active ? 'bg-[#313338] text-[#23a559] hover:bg-[#3f4147]' : 'bg-[#313338] text-[#f23f42] hover:bg-[#3f4147]'}`}
    >
      {active ? iconOn : iconOff}
    </button>
  );
}
