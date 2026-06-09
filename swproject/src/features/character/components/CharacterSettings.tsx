/**
 * @file 캐릭터 설정 섹션 조합 컨테이너
 * @created Sprint 3 - Character UI 이식
 * @updated 단순화: 기본 정보/외모/페르소나, voice auto-resolution via CharacterPage
 * @dependsOn BasicInfoSection, PNGTuberSelector, PersonaPresetSection
 * @usedBy src/features/character/components/CharacterForm.tsx
 */

import type { CharacterConfig, CharacterSettingsResDto } from "@/shared/types/character";
import { getTriggerWordsValidationError } from "@/features/character/lib/triggerWords";
import { BasicInfoSection } from "./BasicInfoSection";
import { PNGTuberSelector } from "./PNGTuberSelector";
import { PersonaPresetSection } from "./PersonaPresetSection";

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
  const missingFields: string[] = [];
  if (!config.name.trim()) missingFields.push("캐릭터 이름");
  if (!config.broadcastPreset) missingFields.push("페르소나 프리셋");
  if (config.modelType === "2D" && !config.model2D.presetId) missingFields.push("2D 외모");
  if (config.modelType === "3D" && !config.model3D.presetId) missingFields.push("3D VRM 모델");
  const triggerWordsError = getTriggerWordsValidationError(config.callWords);

  const canSave = missingFields.length === 0 && !triggerWordsError && !isSaving;

  return (
    <div className="space-y-6">
      <BasicInfoSection config={config} onChange={onChange} />
      <PNGTuberSelector config={config} settings={settings} onChange={onChange} />
      <PersonaPresetSection config={config} onChange={onChange} />

      {missingFields.length > 0 && (
        <div className="rounded-xl border border-brand/30 bg-brand/10 p-4 text-sm text-brand">
          다음 항목을 입력/선택해주세요: <span className="font-medium">{missingFields.join(", ")}</span>
        </div>
      )}

      {triggerWordsError && (
        <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 text-sm text-status-warning">
          호출어 설정 확인: <span className="font-medium">{triggerWordsError}</span>
        </div>
      )}

      <div className="mt-8 flex justify-end gap-3 border-t border-border-strong pt-6 pb-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border-default bg-surface-panel px-6 py-2.5 font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="rounded-md bg-brand px-8 py-2.5 font-semibold text-content-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
