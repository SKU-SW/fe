/**
 * @file 대시보드 헤더 컴포넌트
 * @created Sprint 2 - Dashboard Header
 * @updated 사용자 메뉴를 사이드바 footer로 이동 → 헤더는 페이지 컨텍스트 전용
 * @updated 라우트별 타이틀/설명 자동 표시 (useLocation 기반)
 * @usedBy DashboardLayout
 */

import { Bell, Settings } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface PageInfo {
  title: string;
  description: string;
}

const PAGE_INFO: Record<string, PageInfo> = {
  '/dashboard': { title: '대시보드', description: '실시간 방송 제어 및 모니터링' },
  '/character': { title: 'AI 캐릭터', description: '캐릭터 페르소나 관리' },
  '/chat-analysis': { title: '채팅 분석', description: '실시간 채팅 감정·반응 분석' },
  '/game': { title: '게임 연동', description: '게임 이벤트 기반 AI 반응' },
  '/safety': { title: '안전관리', description: 'LLM 유해 단어 필터 설정' },
  '/stats': { title: '방송 통계', description: '방송 성과 및 시청자 분석' },
  '/settings': { title: '설정', description: '앱 환경설정' },
};

const DEFAULT_PAGE: PageInfo = { title: 'Dashboard', description: 'AI 스트리머 파트너' };

function resolvePageInfo(pathname: string): PageInfo {
  if (PAGE_INFO[pathname]) return PAGE_INFO[pathname];
  // 중첩 라우트 대비: prefix 매칭 (가장 긴 prefix 우선)
  const match = Object.keys(PAGE_INFO)
    .filter((key) => pathname.startsWith(key + '/'))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_INFO[match] : DEFAULT_PAGE;
}

export default function DashboardHeader() {
  const { pathname } = useLocation();
  const { title, description } = resolvePageInfo(pathname);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 shadow-lg">
      {/* 좌측: 페이지 타이틀 + 설명 */}
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-xs text-slate-400">{description}</p>
      </div>

      {/* 우측: 알림 + 설정 */}
      <div className="flex items-center gap-2">
        {/* 알림 벨 */}
        <button
          type="button"
          className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          aria-label="알림"
        >
          <Bell className="h-5 w-5" />
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
      </div>
    </header>
  );
}
