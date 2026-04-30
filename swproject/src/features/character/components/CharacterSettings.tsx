/**
 * @file 캐릭터 설정 섹션 조합 컨테이너
 * @created Sprint 3 - Character UI 이식
 * @updated 단순화: 페르소나 프리셋 + 기본정보만 노출, 외모/목소리/말투/성격은 "고급 조정"으로 접기
 * @dependsOn BasicInfoSection, PNGTuberSelector, PersonaPresetSection, VoicePersonalitySection
 * @usedBy src/features/character/components/CharacterForm.tsx
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
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
  // 고급 조정 펼침 상태: 기본 접혀 있음
  // 페르소나 프리셋만 고르면 말투/성격이 자동 매핑되므로, 대다수 사용자는 펼칠 필요 없음
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 저장 가능 여부 검증: 이름과 페르소나 프리셋만 필수
  // (외모/목소리는 아직 백엔드 프리셋 데이터가 없어 선택 불가 - 기본값으로 저장됨)
  const missingFields: string[] = [];
  if (!config.name.trim()) missingFields.push("캐릭터 이름");
  if (!config.broadcastPreset) missingFields.push("페르소나 프리셋");

  const canSave = missingFields.length === 0 && !isSaving;

  return (
    <div className="space-y-6">
      {/* 필수: 기본 정보 + 페르소나 */}
      <BasicInfoSection config={config} onChange={onChange} />
      <PersonaPresetSection config={config} onChange={onChange} />

      {/* 고급 조정 토글 */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 px-6 py-4 text-left transition hover:border-slate-600 hover:bg-slate-800"
        aria-expanded={showAdvanced}
        aria-controls="character-advanced-settings"
      >
        <div>
          <p className="text-sm font-semibold text-white">고급 조정</p>
          <p className="mt-0.5 text-xs text-slate-400">
            외모 / 목소리 / 말투 / 성격을 직접 바꾸고 싶을 때만 펼치세요
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
            showAdvanced ? "rotate-180" : ""
          }`}
        />
      </button>

      {showAdvanced && (
        <div id="character-advanced-settings" className="space-y-6">
          <PNGTuberSelector config={config} settings={settings} onChange={onChange} />
          <VoicePersonalitySection config={config} onChange={onChange} />
        </div>
      )}

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
