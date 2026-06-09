/**
 * @file 채팅 분석 — 실시간 키워드 리스트 (rank + keyword)
 * @dependsOn 없음
 * @usedBy src/pages/ChatAnalysisPage.tsx
 */

import { Hash } from "lucide-react";

interface RealtimeKeywordListProps {
  keywords: string[];
}

export function RealtimeKeywordList({ keywords }: RealtimeKeywordListProps) {
  return (
    <section className="rounded-2xl border border-border-strong bg-surface-panel p-5 shadow-sm transition-colors">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/15 text-brand">
            <Hash className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-extrabold text-content-primary">실시간 키워드</h2>
        </div>
        <span className="rounded-full border border-border-default bg-surface-raised px-3 py-1 text-xs font-bold text-content-muted">
          TOP {keywords.length}
        </span>
      </div>

      <div className="space-y-1">
        {keywords.map((keyword, index) => (
          <div
            key={`${index}-${keyword}`}
            className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-base px-3 py-2.5 transition-colors hover:bg-surface-hover/60"
          >
            <span className="w-6 text-sm font-extrabold text-content-muted">#{index + 1}</span>
            <span className="truncate text-sm font-bold text-content-primary">{keyword}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
