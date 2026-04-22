/**
 * @file 캐릭터 생성/수정 폼 레이아웃
 * @created Sprint 3 - Character UI 이식
 * @dependsOn CharacterSettings, CharacterPreview
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { CharacterConfig, CharacterPreset, CharacterSettingsResDto } from "@/shared/types/character";
import { CharacterPreview } from "./CharacterPreview";
import { CharacterSettings } from "./CharacterSettings";

const DEFAULT_CONFIG: CharacterConfig = {
  name: "",
  callWords: [],
  gender: "female",
  voiceId: undefined,
  model2D: { presetId: null },
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
  onBack: () => void;
  onSave: (config: CharacterConfig) => Promise<void>;
}

function toConfig(data?: CharacterPreset | null): CharacterConfig {
  if (!data) {
    return DEFAULT_CONFIG;
  }

  return {
    ...DEFAULT_CONFIG,
    name: data.info.name,
    callWords: data.info.callSign ? [data.info.callSign] : [],
    gender: data.info.gender,
    voiceId: data.info.voicePresetId,
    model2D: { presetId: data.info.appearancePresetId || null },
    speechStyle:
      data.info.speechStyle === "friendly_informal"
        ? "casual"
        : data.info.speechStyle === "polite_formal"
          ? "polite"
          : data.info.speechStyle === "playful_informal"
            ? "playful"
            : "dramatic",
    personality: data.info.personality,
    broadcastPreset:
      data.info.persona === "game_specialist"
        ? "gaming"
        : data.info.persona === "humor_entertainment"
          ? "entertainment"
          : data.info.persona === "focused_serious"
            ? "focused"
            : "chatty",
  };
}

export function CharacterForm({ mode, initialData, settings, isSaving, onBack, onSave }: CharacterFormProps) {
  const initialConfig = useMemo(() => toConfig(initialData), [initialData]);
  const [config, setConfig] = useState<CharacterConfig>(initialConfig);

  return (
    <div className="flex h-full min-h-[640px] flex-col overflow-hidden bg-slate-950">
      <div className="border-b border-slate-800 px-8 py-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
          목록으로 돌아가기
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-2 text-2xl font-semibold text-white">
              {mode === "create" ? "AI 캐릭터 생성" : "AI 캐릭터 수정"}
            </h2>
            <p className="mb-6 text-sm text-slate-400">방송 스타일에 맞는 AI 동료의 정체성을 설정하세요.</p>
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
        <div className="hidden w-[400px] md:block">
          <CharacterPreview config={config} />
        </div>
      </div>
    </div>
  );
}
