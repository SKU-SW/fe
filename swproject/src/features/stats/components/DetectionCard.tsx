/**
 * @file 채팅 분석 — 여론 감지 카드 (긍/중/부 3분할 막대 + 집계)
 * @dependsOn src/features/stats/types.ts
 * @usedBy src/features/stats/components/LlmJudgmentPanel.tsx
 */

import type { PublicOpinion } from "@/features/stats/types";

interface DetectionCardProps {
  opinion: PublicOpinion;
}

export function DetectionCard({ opinion }: DetectionCardProps) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-base p-5 shadow-sm transition-colors">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-sm font-extrabold text-brand">
          ①
        </span>
        <div>
          <p className="text-sm font-bold text-content-primary">여론 감지</p>
          <p className="text-xs text-content-muted">전체 채팅 {opinion.totalChatCount.toLocaleString()}개</p>
        </div>
      </div>

      {/* 3분할 막대 */}
      <div className="relative h-5 overflow-hidden rounded-full bg-surface-raised">
        {opinion.positiveRatio > 0 && (
          <div
            className="absolute inset-y-0 left-0"
            style={{
              width: `${opinion.positiveRatio}%`,
              background: "linear-gradient(90deg, #4f46e5 0%, #2563eb 65%, #60a5fa 100%)",
            }}
          />
        )}
        {opinion.neutralRatio > 0 && (
          <div
            className="absolute inset-y-0"
            style={{
              left: `${opinion.positiveRatio}%`,
              width: `${opinion.neutralRatio}%`,
              background: "linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%)",
            }}
          />
        )}
      </div>

      {/* 범례 + 수치 */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
        <div>
          <span className="text-blue-600">● 긍정</span>
          <p className="mt-0.5 text-content-primary">
            {opinion.positiveRatio.toFixed(1)}%
          </p>
          <p className="text-content-muted">{opinion.positiveChatCount.toLocaleString()}개</p>
        </div>
        <div>
          <span className="text-slate-400">● 중립</span>
          <p className="mt-0.5 text-content-primary">
            {opinion.neutralRatio.toFixed(1)}%
          </p>
          <p className="text-content-muted">{opinion.neutralChatCount.toLocaleString()}개</p>
        </div>
        <div>
          <span className="text-red-500">● 부정</span>
          <p className="mt-0.5 text-content-primary">
            {opinion.negativeRatio.toFixed(1)}%
          </p>
          <p className="text-content-muted">{opinion.negativeChatCount.toLocaleString()}개</p>
        </div>
      </div>
    </div>
  );
}
