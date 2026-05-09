import { useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquareText, Gamepad2, ShieldAlert, BarChart3, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1e1f22] bg-[#313338] px-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[#f2f3f5]">
          <Icon className="h-5 w-5 text-[#949ba4]" />
          <h2 className="text-base font-bold">{title}</h2>
        </div>
        <div className="h-4 w-[1px] bg-[#3f4147]" />
        <p className="text-sm font-medium text-[#949ba4]">{description}</p>
      </div>

      <div className="flex items-center gap-4 text-sm font-medium text-[#949ba4]">
        <button
          type="button"
          className="relative hover:text-[#dbdee1] transition-colors"
          aria-label="알림"
        >
          알림
          <span className="absolute -top-1 -right-2.5 h-2 w-2 bg-[#f23f42] rounded-full" />
        </button>

        <button
          type="button"
          className="hover:text-[#dbdee1] transition-colors"
          aria-label="설정"
        >
          설정
        </button>
      </div>
    </header>
  );
}
