/**
 * @file 캐릭터 외모/목소리 선택 섹션
 * @created Sprint 3 - Character UI 이식
 * @updated Backend Swagger spec alignment
 * @dependsOn src/shared/types/character.ts (CharacterConfig, CharacterSettingsResDto)
 * @usedBy src/features/character/components/CharacterSettings.tsx
 */

import { useMemo } from "react";
import { Mic, PlayCircle } from "lucide-react";
import type { CharacterConfig, CharacterSettingsResDto, UiGender } from "@/shared/types/character";

interface PNGTuberSelectorProps {
  config: CharacterConfig;
  settings: CharacterSettingsResDto | null;
  onChange: (config: CharacterConfig) => void;
}

export function PNGTuberSelector({ config, settings, onChange }: PNGTuberSelectorProps) {
  const characterImages = settings?.characterImages ?? [];
  const voiceTypes = settings?.voiceTypes ?? [];

  const groupedImages = useMemo(() => {
    const male = characterImages.filter((img) => img.gender === "MALE");
    const female = characterImages.filter((img) => img.gender === "FEMALE");
    return { male, female };
  }, [characterImages]);

  const groupedVoices = useMemo(() => {
    const male = voiceTypes.filter((v) => v.gender === "MALE");
    const female = voiceTypes.filter((v) => v.gender === "FEMALE");
    return {
      male: male.length > 0 ? male : voiceTypes,
      female: female.length > 0 ? female : voiceTypes,
    };
  }, [voiceTypes]);

  const currentAppearanceGender: UiGender = config.gender;
  const currentVoiceGender: UiGender = config.voiceId
    ? groupedVoices.female.some((voice) => String(voice.voiceTypeId) === config.voiceId)
      ? "female"
      : "male"
    : "female";

  const selectAppearanceGender = (gender: UiGender) => {
    const firstImage = groupedImages[gender][0];
    onChange({
      ...config,
      gender,
      model2D: { presetId: firstImage ? String(firstImage.imageId) : null },
    });
  };

  const selectVoiceGender = (gender: UiGender) => {
    const firstVoice = groupedVoices[gender][0];
    onChange({
      ...config,
      voiceId: firstVoice ? String(firstVoice.voiceTypeId) : undefined,
    });
  };

  return (
    <section className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-300">
          1
        </div>
        <h3 className="text-lg font-semibold text-white">외모 및 목소리</h3>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">외모</label>
          <div className="rounded-lg bg-slate-900 p-1">
            {(["female", "male"] as UiGender[]).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => selectAppearanceGender(gender)}
                className={`rounded-md px-4 py-1.5 text-sm ${
                  currentAppearanceGender === gender
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {gender === "female" ? "여성" : "남성"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {groupedImages[currentAppearanceGender].map((image) => (
            <button
              key={image.imageId}
              type="button"
              onClick={() => onChange({ ...config, model2D: { presetId: String(image.imageId) } })}
              className={`rounded-xl border p-3 text-left transition ${
                config.model2D.presetId === String(image.imageId)
                  ? "border-blue-500 bg-blue-500/20"
                  : "border-slate-600 bg-slate-900 hover:border-slate-500"
              }`}
            >
              <div className="mb-2 h-16 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                <div className="flex h-full items-center justify-center text-xs text-slate-400">미리보기</div>
              </div>
              <p className="truncate text-sm font-medium text-slate-200">{image.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">목소리</label>
          <div className="rounded-lg bg-slate-900 p-1">
            {(["female", "male"] as UiGender[]).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => selectVoiceGender(gender)}
                className={`rounded-md px-4 py-1.5 text-sm ${
                  currentVoiceGender === gender
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {gender === "female" ? "여성" : "남성"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {groupedVoices[currentVoiceGender].map((voice) => (
            <button
              key={voice.voiceTypeId}
              type="button"
              onClick={() => onChange({ ...config, voiceId: String(voice.voiceTypeId) })}
              className={`rounded-xl border p-3 text-left transition ${
                config.voiceId === String(voice.voiceTypeId)
                  ? "border-blue-500 bg-blue-500/20"
                  : "border-slate-600 bg-slate-900 hover:border-slate-500"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <Mic className="h-4 w-4 text-slate-300" />
                <PlayCircle className="h-4 w-4 text-slate-400" />
              </div>
              <p className="truncate text-sm font-medium text-slate-200">{voice.label}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
