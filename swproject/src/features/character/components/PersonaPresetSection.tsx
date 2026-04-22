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
    id: "gaming",
    label: "게임 특화",
    description: "리액션 중심, 하이라이트 반응 강화",
    speechStyle: "dramatic",
    personality: "energetic",
  },
  {
    id: "entertainment",
    label: "유머/예능",
    description: "티키타카와 밈 소화에 특화",
    speechStyle: "playful",
    personality: "humorous",
  },
  {
    id: "focused",
    label: "진중/집중",
    description: "정보 전달, 차분한 진행",
    speechStyle: "polite",
    personality: "serious",
  },
  {
    id: "chatty",
    label: "잡담/소통",
    description: "편안한 저스트 채팅 흐름",
    speechStyle: "casual",
    personality: "calm",
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              className={`rounded-xl border p-4 text-left transition ${
                isSelected
                  ? "border-blue-500 bg-blue-500/20"
                  : "border-slate-600 bg-slate-900 hover:border-slate-500"
              }`}
            >
              <p className={`text-sm font-semibold ${isSelected ? "text-blue-300" : "text-slate-100"}`}>
                {preset.label}
              </p>
              <p className="mt-1 text-xs text-slate-400">{preset.description}</p>
            </button>
          );
        })}
      </div>

      {selectedPreset && (
        <div className="flex gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
          <div className="text-sm text-slate-300">
            <p className="font-medium text-blue-300">{selectedPreset.label} 프리셋 적용됨</p>
            <p className="mt-1">
              추천 말투는 <span className="font-medium">{selectedPreset.speechStyle}</span>, 추천 성격은
              <span className="font-medium"> {selectedPreset.personality}</span> 입니다.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
