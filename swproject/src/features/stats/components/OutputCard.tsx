/**
 * @file 방송 통계 LLM 판단 현황 - 출력 예정 카드
 * @dependsOn src/features/stats/types.ts
 * @usedBy src/features/stats/components/LlmJudgmentPanel.tsx
 */

import { Volume2 } from "lucide-react";
import type { OutputState } from "@/features/stats/types";

interface OutputCardProps {
  output: OutputState;
}

export function OutputCard({ output }: OutputCardProps) {
  const progress = Math.max(0, Math.min(100, (output.nextReactionSeconds / 8) * 100));

  return (
    <div className="rounded-xl border border-border-default bg-surface-base p-5 shadow-sm transition-colors">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-sm font-extrabold text-brand">
          ③
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-content-primary">출력 예정 (Output)</p>
          <p className="text-xs text-content-muted">다음 멘트</p>
        </div>
        {output.ttsReady && (
          <span className="inline-flex items-center gap-1 rounded-full border border-status-success/30 bg-status-success/10 px-2.5 py-1 text-xs font-bold text-status-success">
            <Volume2 className="h-3.5 w-3.5" />
            TTS 준비됨
          </span>
        )}
      </div>

      <blockquote className="rounded-xl border border-border-strong bg-surface-panel p-4 text-sm font-medium leading-relaxed text-content-primary shadow-inner">
        “{output.nextLine}”
      </blockquote>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-semibold text-content-muted">
        <span>목표 감정: <b className="text-content-primary">{output.targetEmotion}</b></span>
        <span>확신도: <b className="text-brand">{output.confidencePercent}%</b></span>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-border-default bg-surface-panel p-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-content-muted">다음 반응까지</p>
          <p className="mt-1 text-sm font-semibold text-content-secondary">실시간 카운트다운</p>
        </div>
        <div className="relative h-16 w-16 rounded-full bg-surface-raised">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(rgb(var(--color-brand)) ${progress}%, rgb(var(--color-border-default) / 0.25) 0)`,
            }}
          />
          <div className="absolute inset-1 flex items-center justify-center rounded-full bg-surface-panel">
            <span className="text-lg font-extrabold text-content-primary">{output.nextReactionSeconds}초</span>
          </div>
        </div>
      </div>
    </div>
  );
}
