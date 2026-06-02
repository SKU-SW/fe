/**
 * @file 방송 통계 히스토리 placeholder 카드
 * @dependsOn 없음
 * @usedBy src/pages/StatsHistoryPage.tsx
 */

import { CalendarDays } from "lucide-react";

interface StatsHistoryEmptyCardProps {
  date: string;
  title: string;
  summary: string;
  onClick: () => void;
}

export function StatsHistoryEmptyCard({ date, title, summary, onClick }: StatsHistoryEmptyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-border-strong bg-surface-panel p-5 text-left shadow-sm transition-colors hover:bg-surface-hover"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <CalendarDays className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand">{date}</p>
          <h3 className="mt-1 text-lg font-extrabold text-content-primary">{title}</h3>
          <p className="mt-1 text-sm text-content-muted">{summary}</p>
        </div>
        <span className="rounded-full border border-border-default bg-surface-raised px-3 py-1 text-xs font-bold text-content-muted">
          준비중
        </span>
      </div>
    </button>
  );
}
