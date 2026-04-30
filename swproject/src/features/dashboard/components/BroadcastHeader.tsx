/**
 * @file 방송 중 대시보드 상단 헤더
 * - 좌측: AI가 방송 흐름을 수집 중이라는 상태 텍스트
 * - 우측: 실시간 대화 기록 로그 페이지 토글 버튼
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
    <div className="flex items-center justify-between gap-4 px-1 py-2">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Activity className="h-4 w-4 animate-pulse text-emerald-400" />
        <span>AI 캐릭터가 방송 흐름을 계속 수집 중입니다…</span>
      </div>

      <button
        type="button"
        onClick={onToggleLog}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
          logOpen
            ? "border-indigo-500/40 bg-indigo-500/15 text-indigo-200"
            : "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
        }`}
        aria-pressed={logOpen}
        aria-label="실시간 대화 기록 로그 페이지 토글"
      >
        <ScrollText className="h-4 w-4" />
        <span>대화 기록</span>
        <span
          className={`ml-1 inline-block h-2 w-2 rounded-full transition ${
            logOpen ? "bg-indigo-300" : "bg-slate-600"
          }`}
          aria-hidden
        />
      </button>
    </div>
  );
}
