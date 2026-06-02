/**
 * @file 방송 통계 실시간 키워드 리스트
 * @dependsOn src/features/stats/types.ts
 * @usedBy src/pages/StatsPage.tsx
 */

import { Hash } from "lucide-react";
import type { KeywordEntry } from "@/features/stats/types";

interface RealtimeKeywordListProps {
  keywords: KeywordEntry[];
}

function formatTrend(entry: KeywordEntry): { icon: string; label: string; className: string } {
  if (entry.trend === "up") {
    return { icon: "↗", label: `+${entry.change}`, className: "text-status-success" };
  }
  if (entry.trend === "down") {
    return { icon: "↘", label: String(entry.change), className: "text-status-danger" };
  }
  return { icon: "-", label: "", className: "text-content-muted" };
}

export function RealtimeKeywordList({ keywords }: RealtimeKeywordListProps) {
  const maxCount = Math.max(...keywords.map((keyword) => keyword.count), 1);

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
          TOP 10 · 30초 단위 갱신
        </span>
      </div>

      <div className="space-y-2">
        {keywords.map((entry) => {
          const trend = formatTrend(entry);
          const progress = Math.max(8, Math.round((entry.count / maxCount) * 100));

          return (
            <div
              key={`${entry.rank}-${entry.keyword}`}
              className="grid grid-cols-[2.25rem_minmax(0,1fr)_3.5rem] items-center gap-3 rounded-xl border border-border-default bg-surface-base px-3 py-2.5 transition-colors hover:bg-surface-hover/60"
            >
              <span className="text-sm font-extrabold text-content-muted">#{entry.rank}</span>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-bold text-content-primary">{entry.keyword}</span>
                  <span className={`w-12 shrink-0 text-right text-xs font-extrabold ${trend.className}`}>
                    {trend.icon} {trend.label}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <span className="text-right text-sm font-extrabold text-content-primary">{entry.count}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
