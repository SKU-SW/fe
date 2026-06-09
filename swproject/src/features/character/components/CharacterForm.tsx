/**
 * @file 캐릭터 생성/수정 폼 레이아웃
 * @created Sprint 3 - Character UI 이식
 * @dependsOn CharacterSettings
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { CharacterConfig, CharacterPreset, CharacterSettingsResDto } from "@/shared/types/character";
import { normalizeTriggerWords } from "@/features/character/lib/triggerWords";
import { CharacterSettings } from "./CharacterSettings";

const DEFAULT_CONFIG: CharacterConfig = {
  name: "",
  callWords: [],
  gender: "female",
  voiceId: undefined,
  modelType: "2D",
  model2D: { presetId: null },
  model3D: { presetId: null, vrmUrl: null, thumbnailUrl: null },
  speechStyle: "casual",
  personality: "energetic",
  broadcastPreset: null,
  conversationRounds: 1,
  autoEndConditions: {
    onStreamerSpeak: true,
    onTimeout: true,
    timeoutSeconds: 10,
  },
  pauseChatAnalysis: true,
  ptt: {
    enabled: false,
    shortcutKey: "",
    mode: "hold",
    showFeedback: true,
  },
};

interface CharacterFormProps {
  mode: "create" | "edit";
  initialData?: CharacterPreset | null;
  settings: CharacterSettingsResDto | null;
  isSaving?: boolean;
  error?: string | null;
  onBack: () => void;
  onSave: (config: CharacterConfig) => Promise<void>;
}

function toConfig(data?: CharacterPreset | null): CharacterConfig {
  if (!data) {
    return DEFAULT_CONFIG;
  }

  // 호출어는 반드시 원본 배열(triggerWords) 에서 복원해야 한다.
  // - 이전 구현: callWords = [callSign]  → callSign 이 콤마 합본 문자열이라 1원소(콤마 포함) 배열로 망가짐
  //   → 수정 후 저장 시 BE 에 "강희야, 야, 친구야" 통문자열이 1원소 배열로 전송 → 호출어 매칭 영구 실패
  // - 현재: triggerWords 배열을 그대로 복사. 빈 배열이거나 누락이면 callSign split 으로 fallback.
  const callWords = normalizeTriggerWords(data.info.triggerWords, data.info.callSign);

  return {
    ...DEFAULT_CONFIG,
    name: data.info.name,
    callWords,
    gender: data.info.gender,
    voiceId: data.info.voicePresetId,
    modelType: data.info.modelType ?? "2D",
    model2D: { presetId: data.info.appearancePresetId || null },
    model3D: {
      presetId: data.info.vrmPresetId || null,
      vrmUrl: data.info.vrmUrl ?? null,
      thumbnailUrl: data.info.vrmThumbnailUrl ?? null,
    },
    speechStyle:
      data.info.speechStyle === "friendly_informal"
        ? "casual"
        : data.info.speechStyle === "polite_formal"
          ? "polite"
          : data.info.speechStyle === "playful_informal"
            ? "playful"
            : "dramatic",
    personality: data.info.personality,
    // Persona와 BroadcastPreset이 동일한 키 체계를 쓰므로 직접 매핑
    // custom은 UI에서 제거되었으므로 null로 정규화
    broadcastPreset: data.info.persona === "custom" ? null : data.info.persona,
  };
}

export function CharacterForm({ mode, initialData, settings, isSaving, error, onBack, onSave }: CharacterFormProps) {
  const initialConfig = useMemo(() => toConfig(initialData), [initialData]);
  const [config, setConfig] = useState<CharacterConfig>(initialConfig);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  return (
    <div className="flex h-full min-h-[640px] flex-col overflow-hidden bg-surface-base transition-colors">
      <div className="border-b border-border-strong px-8 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-content-muted transition-colors hover:text-content-primary"
        >
          <ArrowLeft className="h-5 w-5" />
          목록으로 돌아가기
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-2 text-2xl font-bold text-content-primary">
              {mode === "create" ? "AI 캐릭터 생성" : "AI 캐릭터 수정"}
            </h2>
            <p className="mb-6 text-sm text-content-muted">방송 스타일에 맞는 AI 동료의 정체성을 설정하세요.</p>

            {error && (
              <div className="mb-4 rounded-md border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger">
                <p className="font-medium">저장 실패</p>
                <p className="mt-1 opacity-80">{error}</p>
              </div>
            )}

            <CharacterSettings
              config={config}
              settings={settings}
              onChange={setConfig}
              onCancel={onBack}
              onSave={() => void onSave(config)}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
