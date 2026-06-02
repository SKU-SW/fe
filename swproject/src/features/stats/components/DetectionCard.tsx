/**
 * @file 방송 통계 LLM 판단 현황 - 감지 카드
 * @dependsOn src/features/stats/types.ts
 * @usedBy src/features/stats/components/LlmJudgmentPanel.tsx
 */

import type { SentimentSnapshot } from "@/features/stats/types";

interface DetectionCardProps {
  sentiment: SentimentSnapshot;
}

const MODE_LABEL = {
  cheer: "응원",
  criticism: "비판",
  silence: "침묵",
};

export function DetectionCard({ sentiment }: DetectionCardProps) {
  const markerLeft = `${sentiment.positivePercent}%`;

  return (
    <div className="rounded-xl border border-border-default bg-surface-base p-5 shadow-sm transition-colors">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-sm font-extrabold text-brand">
          ①
        </span>
        <div>
          <p className="text-sm font-bold text-content-primary">감지 (Detection)</p>
          <p className="text-xs text-content-muted">현재 여론 방향</p>
        </div>
      </div>

      <div className="relative pt-7">
        <div
          className="absolute top-0 -translate-x-1/2 rounded-full border border-brand/30 bg-surface-raised px-2.5 py-1 text-xs font-bold text-brand shadow-sm"
          style={{ left: markerLeft }}
        >
          {MODE_LABEL[sentiment.currentMode]}
        </div>
        <div className="relative h-4 overflow-hidden rounded-full bg-surface-raised">
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${sentiment.positivePercent}%`,
              background: "linear-gradient(90deg, #4f46e5 0%, #2563eb 65%, #60a5fa 100%)",
            }}
          />
          <div
            className="absolute inset-y-0 right-0"
            style={{
              width: `${sentiment.negativePercent}%`,
              background: "linear-gradient(90deg, #fca5a5 0%, #ef4444 100%)",
            }}
          />
          <div
            className="absolute inset-y-0 w-px bg-content-inverse/80 shadow-[0_0_0_1px_rgba(15,23,42,0.14)]"
            style={{ left: `${sentiment.positivePercent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm font-bold">
        <span className="text-brand">긍정 {sentiment.positivePercent}%</span>
        <span className="text-status-danger">부정 {sentiment.negativePercent}%</span>
      </div>
    </div>
  );
}
