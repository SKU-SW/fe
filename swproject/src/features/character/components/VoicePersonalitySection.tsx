/**
 * @file 말투/성격 선택 섹션
 * @created Sprint 3 - Character UI 이식
 * @dependsOn src/shared/types/character.ts (CharacterConfig)
 * @usedBy src/features/character/components/CharacterSettings.tsx
 */

import { MessageSquare } from "lucide-react";
import type { CharacterConfig } from "@/shared/types/character";

interface VoicePersonalitySectionProps {
  config: CharacterConfig;
  onChange: (config: CharacterConfig) => void;
}

const SPEECH_STYLES = [
  { id: "casual", label: "친근한 반말", example: "오 진짜? 완전 멋진데!" },
  { id: "polite", label: "깍듯한 존댓말", example: "정말 훌륭하시네요!" },
  { id: "playful", label: "장난기 섞인 반말", example: "어머 대박ㅋㅋ 이게 되네?" },
  { id: "dramatic", label: "방송용 과장체", example: "와! 이건 레전드인데요?!" },
] as const;

const PERSONALITIES = [
  { id: "energetic", label: "활발함", example: "오 대박! 진짜요?!" },
  { id: "calm", label: "차분함", example: "좋네요, 안정적인 선택이에요." },
  { id: "humorous", label: "유머러스", example: "이건 좀 웃긴데요 ㅋㅋ" },
  { id: "serious", label: "진지함", example: "이 부분은 신중히 보죠." },
] as const;

export function VoicePersonalitySection({ config, onChange }: VoicePersonalitySectionProps) {
  return (
    <section className="space-y-6 rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-brand" />
        <h3 className="text-lg font-semibold text-content-primary">말투 및 성격</h3>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-content-secondary">말투 선택</label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {SPEECH_STYLES.map((style) => (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange({ ...config, speechStyle: style.id, broadcastPreset: "custom" })}
              className={`rounded-lg border p-4 text-left transition ${
                config.speechStyle === style.id
                  ? "border-brand bg-brand/10"
                  : "border-border-default bg-surface-panel hover:border-border-strong"
               }`}
            >
              <p className={`text-sm font-medium ${config.speechStyle === style.id ? "text-brand" : "text-content-primary"}`}>
                {style.label}
              </p>
              <p className="mt-1 text-xs italic text-content-muted">"{style.example}"</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-medium text-content-secondary">성격</label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PERSONALITIES.map((personality) => (
            <button
              key={personality.id}
              type="button"
              onClick={() => onChange({ ...config, personality: personality.id, broadcastPreset: "custom" })}
              className={`rounded-lg border p-4 text-left transition ${
                config.personality === personality.id
                  ? "border-brand bg-brand/10"
                  : "border-border-default bg-surface-panel hover:border-border-strong"
               }`}
            >
              <p
                className={`text-sm font-medium ${
                  config.personality === personality.id ? "text-brand" : "text-content-primary"
                }`}
              >
                {personality.label}
              </p>
              <p className="mt-1 text-xs italic text-content-muted">"{personality.example}"</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
