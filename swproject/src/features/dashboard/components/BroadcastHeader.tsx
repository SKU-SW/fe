/**
 * @file 방송 중 대시보드 상단 헤더
 * Discord Style Header
 * @usedBy src/pages/DashboardPage.tsx
 */

import { Activity, ScrollText } from "lucide-react";

interface BroadcastHeaderProps {
  /** 대화 기록 로그 패널 열림 여부 */
  logOpen: boolean;
  /** 토글 클릭 핸들러 */
  onToggleLog: () => void;
}

export function BroadcastHeader({ logOpen, onToggleLog }: BroadcastHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-discord-dark pb-3 mb-2">
      <div className="flex items-center gap-2 text-sm font-medium text-discord-textMuted">
        <Activity className="h-4 w-4 animate-pulse text-discord-success" />
        <span>AI가 방송 상황을 모니터링하고 있어요</span>
      </div>

      {/* 우측 상단 대화 기록 토글 버튼 */}
      <button
        type="button"
        onClick={onToggleLog}
        className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-bold transition ${
          logOpen
            ? "bg-discord-active text-discord-textHover"
            : "bg-discord-dark text-discord-textMuted hover:bg-[#3f4147] hover:text-discord-textHover"
        }`}
        aria-pressed={logOpen}
      >
        <ScrollText className="h-4 w-4" />
        <span>대화 로그</span>
      </button>
    </div>
  );
}
