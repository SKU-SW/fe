/**
 * @file 캐릭터 설정 섹션 조합 컨테이너
 * @created Sprint 3 - Character UI 이식
 * @updated 단순화: 기본 정보/외모/목소리/페르소나를 기본 노출하고 말투/성격만 고급 설정으로 접기
 * @dependsOn BasicInfoSection, PNGTuberSelector, PersonaPresetSection, VoicePersonalitySection
 * @usedBy src/features/character/components/CharacterForm.tsx
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CharacterConfig, CharacterSettingsResDto } from "@/shared/types/character";
import { getTriggerWordsValidationError } from "@/features/character/lib/triggerWords";
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
  // 고급 설정 펼침 상태: 기본 접혀 있음
  // 페르소나 프리셋만 고르면 말투/성격이 자동 매핑되므로, 대다수 사용자는 펼칠 필요 없음
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 저장 가능 여부 검증: 이름과 페르소나 프리셋만 필수
  // (외모/목소리는 아직 백엔드 프리셋 데이터가 없어 선택 불가 - 기본값으로 저장됨)
  const missingFields: string[] = [];
  if (!config.name.trim()) missingFields.push("캐릭터 이름");
  if (!config.broadcastPreset) missingFields.push("페르소나 프리셋");
  const triggerWordsError = getTriggerWordsValidationError(config.callWords);

  const canSave = missingFields.length === 0 && !triggerWordsError && !isSaving;

  return (
    <div className="space-y-6">
      {/* 기본 설정: 기본 정보 + 외모/목소리 + 페르소나 */}
      <BasicInfoSection config={config} onChange={onChange} />
      <PNGTuberSelector config={config} settings={settings} onChange={onChange} />
      <PersonaPresetSection config={config} onChange={onChange} />

      {/* 고급 설정 토글 */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-border-strong bg-surface-panel px-6 py-4 text-left transition-colors hover:bg-surface-hover"
        aria-expanded={showAdvanced}
        aria-controls="character-advanced-settings"
      >
        <div>
          <p className="text-sm font-semibold text-content-primary">고급 설정</p>
          <p className="mt-0.5 text-xs text-content-muted">
            페르소나 기본값 대신 말투와 성격을 직접 조정하고 싶을 때만 펼치세요
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-content-muted transition-transform ${
            showAdvanced ? "rotate-180" : ""
          }`}
        />
      </button>

      {showAdvanced && (
        <div id="character-advanced-settings" className="space-y-6">
          <VoicePersonalitySection config={config} onChange={onChange} />
        </div>
      )}

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
