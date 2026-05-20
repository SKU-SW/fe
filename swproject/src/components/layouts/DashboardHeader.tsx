/**
 * @file 대시보드 상단 헤더 및 테마 토글
 * @usedBy src/components/layouts/DashboardLayout.tsx
 */

import { useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquareText, Gamepad2, ShieldAlert, BarChart3, Settings, Moon, Sun } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { isDarkTheme, useThemeStore } from '@/shared/stores/themeStore';

interface PageInfo {
  icon: LucideIcon;
  title: string;
  description: string;
}

const PAGE_INFO: Record<string, PageInfo> = {
  '/dashboard': { icon: LayoutDashboard, title: '대시보드', description: '실시간 방송 제어 및 모니터링' },
  '/character': { icon: Users, title: 'AI 캐릭터', description: '캐릭터 페르소나 관리' },
  '/chat-analysis': { icon: MessageSquareText, title: '채팅 분석', description: '실시간 채팅 감정·반응 분석' },
  '/game': { icon: Gamepad2, title: '게임 연동', description: '게임 이벤트 기반 AI 반응' },
  '/safety': { icon: ShieldAlert, title: '안전관리', description: 'LLM 유해 단어 필터 설정' },
  '/stats': { icon: BarChart3, title: '방송 통계', description: '방송 성과 및 시청자 분석' },
  '/settings': { icon: Settings, title: '설정', description: '앱 환경설정' },
};

const DEFAULT_PAGE: PageInfo = { icon: LayoutDashboard, title: 'Dashboard', description: 'AI 스트리머 파트너' };

function resolvePageInfo(pathname: string): PageInfo {
  if (PAGE_INFO[pathname]) return PAGE_INFO[pathname];
  const match = Object.keys(PAGE_INFO)
    .filter((key) => pathname.startsWith(key + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_INFO[match] : DEFAULT_PAGE;
}

export default function DashboardHeader() {
  const { pathname } = useLocation();
  const { icon: Icon, title, description } = resolvePageInfo(pathname);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = isDarkTheme(theme);
  const ThemeIcon = isDark ? Sun : Moon;
  const nextThemeLabel = isDark ? '라이트 모드로 전환' : '다크 모드로 전환';

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-border-strong bg-surface-raised px-4 shadow-sm transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-content-primary">
          <Icon className="h-5 w-5 text-content-muted" />
          <h2 className="text-lg font-bold">{title}</h2>
        </div>
        <div className="h-4 w-[1px] bg-border-subtle" />
        <p className="text-base font-medium text-content-muted">{description}</p>
      </div>

      <div className="flex items-center gap-3 text-base font-medium text-content-muted">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-strong bg-surface-panel text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary"
          aria-label={nextThemeLabel}
          title={nextThemeLabel}
        >
          <ThemeIcon className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="relative transition-colors hover:text-content-primary"
          aria-label="알림"
        >
          알림
          <span className="absolute -top-1 -right-2.5 h-2 w-2 rounded-full bg-status-danger" />
        </button>

        <button
          type="button"
          className="transition-colors hover:text-content-primary"
          aria-label="설정"
        >
          설정
        </button>
      </div>
    </header>
  );
}
