/**
 * @file 방송 통계 상단 LLM 판단 현황 패널
 * @dependsOn src/features/stats/components/DetectionCard.tsx, OutputCard.tsx
 * @usedBy src/pages/StatsPage.tsx
 */

import { Brain } from "lucide-react";
import type { StatsSnapshot } from "@/features/stats/types";
import { DetectionCard } from "./DetectionCard";
import { OutputCard } from "./OutputCard";

interface LlmJudgmentPanelProps {
  snapshot: StatsSnapshot;
}

export function LlmJudgmentPanel({ snapshot }: LlmJudgmentPanelProps) {
  return (
    <section className="rounded-2xl border border-border-strong bg-surface-panel p-5 shadow-sm transition-colors">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-content-primary">LLM 판단 현황</h2>
          <p className="text-sm text-content-muted">채팅 흐름을 분석하여 반응 결정</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetectionCard sentiment={snapshot.sentiment} />
        <OutputCard output={snapshot.output} />
      </div>
    </section>
  );
}
