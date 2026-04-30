/**
 * @file 페르소나 프리셋 선택 섹션
 * @created Sprint 3 - Character UI 이식
 * @dependsOn src/shared/types/character.ts (CharacterConfig)
 * @usedBy src/features/character/components/CharacterSettings.tsx
 */

import { Info, Zap } from "lucide-react";
import type { CharacterConfig } from "@/shared/types/character";

interface PersonaPresetSectionProps {
  config: CharacterConfig;
  onChange: (config: CharacterConfig) => void;
}

const PRESETS = [
  {
    id: "neighbor",
    label: "동네 친구",
    tagline: "저스트 채팅 / 소통 특화",
    description:
      "가장 무난하고 편안하게 오디오를 채워주는 든든한 국밥 같은 포지션입니다. 적당한 딴지와 밈으로 티키타카를 이어갑니다.",
    speechStyle: "casual",
    personality: "humorous",
    speechLabel: "친근한 반말",
    personalityLabel: "유머러스",
  },
  {
    id: "high_tension",
    label: "텐션 폭발",
    tagline: "리액션 / 하이라이트 특화",
    description:
      "텐션이 떨어질 때 방송 분위기를 멱살 잡고 끌어올려 주는 포지션입니다. 리액션이 크고 감정 표현이 풍부합니다.",
    speechStyle: "dramatic",
    personality: "energetic",
    speechLabel: "방송용 과장체",
    personalityLabel: "활발함",
  },
  {
    id: "teaser",
    label: "깐족 요정",
    tagline: "게임 특화 / 훈수 및 티배깅",
    description:
      "시청자들을 대신해서 스트리머를 긁거나 팩트 폭력을 날리는 얄미운 포지션입니다. 실수를 놓치지 않고 놀려 웃음을 유발합니다.",
    speechStyle: "playful",
    personality: "energetic",
    speechLabel: "장난기 섞인 반말",
    personalityLabel: "활발함",
  },
  {
    id: "manager",
    label: "전문 매니저",
    tagline: "정보 전달 / 차분한 진행",
    description:
      "선 넘는 채팅을 진정시키거나 게임 스토리를 조용히 요약해 주는 비서 같은 포지션입니다. 정보 전달이나 공지에 유용합니다.",
    speechStyle: "polite",
    personality: "calm",
    speechLabel: "깍듯한 존댓말",
    personalityLabel: "차분함",
  },
  {
    id: "immersive",
    label: "과몰입 장인",
    tagline: "스토리 게임 / 롤플레잉 특화",
    description:
      "게임 속 캐릭터나 세계관에 완전히 동화되어 진지하게 상황에 임하는 포지션입니다. 농담보다 분위기와 몰입감에 집중합니다.",
    speechStyle: "polite",
    personality: "serious",
    speechLabel: "깍듯한 존댓말",
    personalityLabel: "진지함",
  },
] as const;

export function PersonaPresetSection({ config, onChange }: PersonaPresetSectionProps) {
  const selectedPreset = PRESETS.find((preset) => preset.id === config.broadcastPreset);

  return (
    <section className="space-y-5 rounded-xl border border-slate-700 bg-slate-800 p-6">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-indigo-300" />
        <h3 className="text-lg font-semibold text-white">페르소나 프리셋</h3>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {PRESETS.map((preset) => {
          const isSelected = config.broadcastPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onChange({
                  ...config,
                  broadcastPreset: preset.id,
                  speechStyle: preset.speechStyle,
                  personality: preset.personality,
                })
              }
              className={`rounded-lg border px-3 py-2.5 text-center transition ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500/20 shadow-lg shadow-indigo-500/20"
                  : "border-slate-600 bg-slate-900 hover:border-slate-500 hover:bg-slate-800"
              }`}
            >
              <p className={`text-sm font-semibold ${isSelected ? "text-indigo-300" : "text-slate-100"}`}>
                {preset.label}
              </p>
            </button>
          );
        })}
      </div>

      {selectedPreset ? (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-base font-semibold text-indigo-200">{selectedPreset.label}</p>
                <p className="mt-0.5 text-xs font-medium text-indigo-300/80">{selectedPreset.tagline}</p>
              </div>

              <p className="text-sm leading-relaxed text-slate-300">{selectedPreset.description}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/30 bg-indigo-500/20 px-2 py-1 text-xs text-indigo-200">
                  말투 · {selectedPreset.speechLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/20 px-2 py-1 text-xs text-purple-200">
                  성격 · {selectedPreset.personalityLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-600 bg-slate-900/40 px-4 py-3 text-center text-xs text-slate-500">
          위에서 프리셋을 선택하면 상세 설명이 표시됩니다.
        </p>
      )}
    </section>
  );
}
