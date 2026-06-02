/**
 * @file 페르소나 프리셋 선택 섹션
 * @created Sprint 3 - Character UI 이식
 * @updated Voice playback on preset card click
 * @dependsOn src/shared/types/character.ts (CharacterConfig)
 * @dependsOn src/shared/constants/character.ts (PERSONA_VOICE_MAP)
 * @usedBy src/features/character/components/CharacterSettings.tsx
 */

import { useEffect, useRef, useState } from "react";
import { Info, Play, StopCircle } from "lucide-react";
import type { CharacterConfig } from "@/shared/types/character";
import { PERSONA_VOICE_MAP } from "@/shared/constants/character";

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

  // 음성 샘플 재생 상태
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingPresetId, setPlayingPresetId] = useState<string | null>(null);

  const getVoiceSamplePath = (presetId: string) => {
    const voiceEntry = PERSONA_VOICE_MAP[presetId];
    if (!voiceEntry) return null;
    const voiceName = config.gender === "male" ? voiceEntry.male : voiceEntry.female;
    return `${import.meta.env.BASE_URL}voice_samples/${voiceName}.wav`;
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingPresetId(null);
  };

  const handlePresetClick = (presetId: string) => {
    // 먼저 프리셋 선택
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    onChange({
      ...config,
      broadcastPreset: preset.id,
      speechStyle: preset.speechStyle,
      personality: preset.personality,
    });

    const wavPath = getVoiceSamplePath(presetId);
    if (!wavPath) return;

    // 같은 프리셋 다시 클릭 시 토글 (재생/정지)
    if (playingPresetId === presetId) {
      stopAudio();
      return;
    }

    stopAudio();
    const audio = new Audio(wavPath);
    audio.onended = () => setPlayingPresetId(null);
    audio.onerror = () => setPlayingPresetId(null);
    audio.play().catch(() => setPlayingPresetId(null));
    audioRef.current = audio;
    setPlayingPresetId(presetId);
  };

  // 컴포넌트 언마운트 시 재생 중인 오디오 정리
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <section className="space-y-5 rounded-lg border border-border-strong bg-surface-panel p-6 transition-colors">
      <h3 className="text-lg font-semibold text-content-primary">페르소나 프리셋</h3>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {PRESETS.map((preset) => {
          const isSelected = config.broadcastPreset === preset.id;
          const isPlaying = playingPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset.id)}
              className={`rounded-md border px-3 py-2.5 text-center transition-colors ${
                isSelected
                  ? "border-brand bg-brand/10"
                  : "border-border-default bg-surface-base hover:border-border-strong hover:bg-surface-hover"
              }`}
            >
              <p
                className={`text-sm font-semibold ${
                  isSelected ? "text-brand" : "text-content-primary"
                }`}
              >
                {preset.label}
              </p>
              {isSelected && (
                <span
                  className="mt-1 inline-flex items-center gap-1 text-xs text-content-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlaying) {
                      stopAudio();
                    } else {
                      const wavPath = getVoiceSamplePath(preset.id);
                      if (wavPath) {
                        stopAudio();
                        const audio = new Audio(wavPath);
                        audio.onended = () => setPlayingPresetId(null);
                        audio.onerror = () => setPlayingPresetId(null);
                        audio.play().catch(() => setPlayingPresetId(null));
                        audioRef.current = audio;
                        setPlayingPresetId(preset.id);
                      }
                    }
                  }}
                >
                  {isPlaying ? <StopCircle className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  {isPlaying ? "정지" : "샘플"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedPreset ? (
        <div className="rounded-md border border-brand/30 bg-brand/10 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-base font-semibold text-brand">{selectedPreset.label}</p>
                <p className="mt-0.5 text-xs font-medium text-brand/80">
                  {selectedPreset.tagline}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-content-secondary">{selectedPreset.description}</p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 rounded-md border border-brand/30 bg-brand/15 px-2 py-1 text-xs text-brand">
                  말투 · {selectedPreset.speechLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-status-success/30 bg-status-success/15 px-2 py-1 text-xs text-status-success">
                  성격 · {selectedPreset.personalityLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border-default bg-surface-base px-4 py-3 text-center text-xs text-content-muted transition-colors">
          위에서 프리셋을 선택하면 상세 설명이 표시됩니다.
        </p>
      )}
    </section>
  );
}
