/**
 * @file 캐릭터 설정 섹션 조합 컨테이너
 * @created Sprint 3 - Character UI 이식
 * @dependsOn BasicInfoSection, PNGTuberSelector, PersonaPresetSection, VoicePersonalitySection
 * @usedBy src/features/character/components/CharacterForm.tsx
 */

import type { CharacterConfig, CharacterSettingsResDto } from "@/shared/types/character";
import { BasicInfoSection } from "./BasicInfoSection";
import { PNGTuberSelector } from "./PNGTuberSelector";
import { PersonaPresetSection } from "./PersonaPresetSection";
import { VoicePersonalitySection } from "./VoicePersonalitySection";

interface CharacterSettingsProps {
  config: CharacterConfig;
  settings: CharacterSettingsResDto | null;
  onChange: (config: CharacterConfig) => void;
  onCancel?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function CharacterSettings({
  config,
  settings,
  onChange,
  onCancel,
  onSave,
  isSaving = false,
}: CharacterSettingsProps) {
  // 저장 가능 여부 검증: 이름과 페르소나 프리셋만 필수
  // (외모/목소리는 아직 백엔드 프리셋 데이터가 없어 선택 불가 - 기본값으로 저장됨)
  const missingFields: string[] = [];
  if (!config.name.trim()) missingFields.push("캐릭터 이름");
  if (!config.broadcastPreset) missingFields.push("페르소나 프리셋");

  const canSave = missingFields.length === 0 && !isSaving;

  return (
    <div className="space-y-6">
      <BasicInfoSection config={config} onChange={onChange} />
      <PNGTuberSelector config={config} settings={settings} onChange={onChange} />
      <PersonaPresetSection config={config} onChange={onChange} />
      <VoicePersonalitySection config={config} onChange={onChange} />

      {missingFields.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          다음 항목을 입력/선택해주세요: <span className="font-medium">{missingFields.join(", ")}</span>
        </div>
      )}

      <div className="mt-8 flex justify-end gap-3 border-t border-slate-700 pt-6 pb-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-2.5 font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="rounded-xl bg-indigo-600 px-8 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
