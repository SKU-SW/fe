/**
 * @file 채팅 분석 — AI 파트너 성향 카드 (읽기 전용 + 수동 제어)
 * @dependsOn src/features/stats/types.ts
 * @usedBy src/features/stats/components/LlmJudgmentPanel.tsx
 */

import { Sparkles, RotateCcw } from "lucide-react";
import type { AiTendency, TendencyVersion } from "@/features/stats/types";

interface BandwagonCardProps {
  tendency: AiTendency;
  selectedTendency: AiTendency;
  version: TendencyVersion;
  isPending: boolean;
  onApplyManual: (tendency: AiTendency) => void;
  onResetToAuto: () => void;
}

const TENDENCY_LABEL: Record<AiTendency, string> = {
  POSITIVE: "긍정",
  NEUTRAL: "중립",
  NEGATIVE: "비판",
};

const TENDENCY_COLOR: Record<AiTendency, string> = {
  POSITIVE: "text-status-success border-status-success/30 bg-status-success/10",
  NEUTRAL: "text-content-muted border-border-default bg-surface-raised",
  NEGATIVE: "text-status-danger border-status-danger/30 bg-status-danger/10",
};

const TENDENCY_EMOJI: Record<AiTendency, string> = {
  POSITIVE: "😊",
  NEUTRAL: "😐",
  NEGATIVE: "😠",
};

const TENDENCY_BUTTONS: { value: AiTendency; label: string }[] = [
  { value: "POSITIVE", label: "응원" },
  { value: "NEUTRAL", label: "중립" },
  { value: "NEGATIVE", label: "비판" },
];

export function BandwagonCard({
  tendency,
  selectedTendency,
  version,
  isPending,
  onApplyManual,
  onResetToAuto,
}: BandwagonCardProps) {
  // 수동 모드에서는 선택된 값 표시, 자동 모드에서는 백엔드 값 표시
  const displayTendency = version === "MANUAL" ? selectedTendency : tendency;

  return (
    <div className="rounded-xl border border-border-default bg-surface-base p-5 shadow-sm transition-colors">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/15 text-sm font-extrabold text-brand">
          ②
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-content-primary">AI 파트너 성향</p>
          <p className="text-xs text-content-muted">현재 반응 편향</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${
              version === "MANUAL"
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border-default bg-surface-raised text-content-muted"
            }`}
          >
            {version === "MANUAL" ? "수동" : "자동"}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${TENDENCY_COLOR[displayTendency]}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {TENDENCY_LABEL[displayTendency]}
          </span>
        </div>
      </div>

      <blockquote className="rounded-xl border border-border-strong bg-surface-panel p-4 text-center">
        <p className="text-3xl">{TENDENCY_EMOJI[displayTendency]}</p>
        <p className="mt-2 text-lg font-extrabold text-content-primary">
          {TENDENCY_LABEL[displayTendency]} 성향
        </p>
        <p className="mt-1 text-xs text-content-muted">
          {displayTendency === "POSITIVE"
            ? "긍정적인 반응을 보이고 있어요"
            : displayTendency === "NEGATIVE"
              ? "비판적인 반응을 보이고 있어요"
              : "중립적인 반응을 유지하고 있어요"}
        </p>
      </blockquote>

      {/* 수동 편승 제어 */}
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          {TENDENCY_BUTTONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onApplyManual(value)}
              disabled={isPending}
              className={`flex-1 rounded-lg border py-2 text-sm font-bold transition-colors disabled:opacity-50 ${
                version === "MANUAL" && selectedTendency === value
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border-default bg-surface-base text-content-secondary hover:bg-surface-hover"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onResetToAuto}
          disabled={version === "AUTO" || isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-base px-4 py-2 text-sm font-bold text-content-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          초기화 (자동 모드로 되돌리기)
        </button>
      </div>
    </div>
  );
}
