/**
 * @file 채팅 분석 — LLM 판단 현황 패널 (여론 감지 + AI 파트너 성향)
 * @dependsOn src/features/stats/components/DetectionCard.tsx, BandwagonCard.tsx
 * @usedBy src/pages/ChatAnalysisPage.tsx
 */

import { Brain } from "lucide-react";
import type { PublicOpinion, AiTendency, TendencyVersion } from "@/features/stats/types";
import { DetectionCard } from "./DetectionCard";
import { BandwagonCard } from "./BandwagonCard";

interface LlmJudgmentPanelProps {
  opinion: PublicOpinion;
  tendency: AiTendency;
  selectedTendency: AiTendency;
  version: TendencyVersion;
  isPending: boolean;
  onApplyManual: (tendency: AiTendency) => void;
  onResetToAuto: () => void;
}

export function LlmJudgmentPanel({
  opinion,
  tendency,
  selectedTendency,
  version,
  isPending,
  onApplyManual,
  onResetToAuto,
}: LlmJudgmentPanelProps) {
  return (
    <section className="rounded-2xl border border-border-strong bg-surface-panel p-5 shadow-sm transition-colors">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-content-primary">LLM 판단 현황</h2>
          <p className="text-sm text-content-muted">채팅 흐름을 분석하여 반응 결정</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DetectionCard opinion={opinion} />
        <BandwagonCard
          tendency={tendency}
          selectedTendency={selectedTendency}
          version={version}
          isPending={isPending}
          onApplyManual={onApplyManual}
          onResetToAuto={onResetToAuto}
        />
      </div>
    </section>
  );
}
