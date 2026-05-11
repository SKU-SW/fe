/**
 * @file 캐릭터 외모/목소리 선택 섹션
 * @created Sprint 3 - Character UI 이식
 * @updated Backend Swagger spec alignment
 * @dependsOn src/shared/types/character.ts (CharacterConfig, CharacterSettingsResDto)
 * @usedBy src/features/character/components/CharacterSettings.tsx
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, PlayCircle, PauseCircle, ImageOff } from "lucide-react";
import type { CharacterConfig, CharacterSettingsResDto, UiGender } from "@/shared/types/character";

interface PNGTuberSelectorProps {
  config: CharacterConfig;
  settings: CharacterSettingsResDto | null;
  onChange: (config: CharacterConfig) => void;
}

export function PNGTuberSelector({ config, settings, onChange }: PNGTuberSelectorProps) {
  const characterImages = settings?.characterImages ?? [];
  const voiceTypes = settings?.voiceTypes ?? [];

  // 이미지 베이스 URL (환경변수에서 가져오기)
  const imageBaseUrl = import.meta.env.VITE_IMAGE_BASE_URL ?? '';

  /**
   * 상대 경로를 절대 URL로 변환
   * - 서버에서 "/character/..." 형태로 반환되면 VITE_IMAGE_BASE_URL과 결합
   * - 이미 절대 URL(http/https)이면 그대로 반환
   */
  const resolveAssetUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    // 상대 경로인 경우 베이스 URL과 결합
    const base = imageBaseUrl.replace(/\/$/, ''); // trailing slash 제거
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${base}${path}`;
  };

  /**
   * CharacterImageResDto에서 실제 이미지 URL 추출
   * - imageUrl1 필드가 있으면 우선 사용 (서버 호환)
   * - 없으면 imageUrl 사용
   */
  const getImageUrl = (image: (typeof characterImages)[0]): string => {
    const rawUrl = image.imageUrl1 ?? image.imageUrl;
    return resolveAssetUrl(rawUrl);
  };

  // 목소리 샘플 재생 상태 관리: 한 번에 하나만 재생되도록 ref로 audio 인스턴스 추적
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
  };

  const toggleVoiceSample = (voiceTypeId: number, testUrl: string) => {
    if (playingVoiceId === voiceTypeId) {
      stopAudio();
      return;
    }
    stopAudio();
    const resolvedUrl = resolveAssetUrl(testUrl);
    if (!resolvedUrl) return;
    const audio = new Audio(resolvedUrl);
    audio.onended = () => setPlayingVoiceId(null);
    audio.onerror = () => setPlayingVoiceId(null);
    audio.play().catch(() => setPlayingVoiceId(null));
    audioRef.current = audio;
    setPlayingVoiceId(voiceTypeId);
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

  // 설정 로드 후 외모/목소리가 미선택 상태이면 현재 성별의 첫 항목으로 자동 선택
  // (백엔드가 유효한 ID를 요구하므로, 하드코딩 1을 보내는 것보다 안전)
  // 두 선택을 하나의 onChange로 묶어야 stale closure 덮어쓰기 문제를 피할 수 있음
  useEffect(() => {
    const needsImage = !config.model2D.presetId && groupedImages[currentAppearanceGender].length > 0;
    const needsVoice = !config.voiceId && groupedVoices[currentVoiceGender].length > 0;
    if (!needsImage && !needsVoice) return;

    const firstImage = needsImage ? groupedImages[currentAppearanceGender][0] : null;
    const firstVoice = needsVoice ? groupedVoices[currentVoiceGender][0] : null;

    onChange({
      ...config,
      ...(firstImage ? { model2D: { presetId: String(firstImage.imageId) } } : {}),
      ...(firstVoice ? { voiceId: String(firstVoice.voiceTypeId) } : {}),
    });
  }, [config, groupedImages, groupedVoices, currentAppearanceGender, currentVoiceGender, onChange]);

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
    <section className="space-y-6 rounded-xl border border-discord-dark bg-discord-sidebar p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-discord-blurple/20 text-xs font-bold text-discord-blurple">
          1
        </div>
        <h3 className="text-lg font-semibold text-white">외모 및 목소리</h3>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm font-medium text-discord-text">외모</label>
          <div className="rounded-lg bg-discord-sidebar p-1">
            {(["female", "male"] as UiGender[]).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => selectAppearanceGender(gender)}
                className={`rounded-lg px-4 py-1.5 text-sm ${
                  currentAppearanceGender === gender
                    ? "bg-discord-hover text-white"
                    : "text-discord-textMuted hover:text-discord-textHover"
                }`}
              >
                {gender === "female" ? "여성" : "남성"}
              </button>
            ))}
          </div>
        </div>

        {groupedImages[currentAppearanceGender].length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {groupedImages[currentAppearanceGender].map((image) => (
              <button
                key={image.imageId}
                type="button"
                onClick={() => onChange({ ...config, model2D: { presetId: String(image.imageId) } })}
                className={`rounded-xl border p-3 text-left transition ${
                  config.model2D.presetId === String(image.imageId)
                    ? "border-discord-blurple bg-discord-blurple/15"
                    : "border-discord-dark bg-discord-sidebar hover:border-discord-active"
                }`}
              >
                <div className="mb-2 h-24 w-full overflow-hidden rounded-lg border border-discord-dark bg-discord-sidebar">
                  {(() => {
                    const imgUrl = getImageUrl(image);
                    return imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={image.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null;
                  })()}
                  <div className="hidden flex h-full items-center justify-center text-discord-textMuted">
                    <ImageOff className="h-6 w-6" />
                  </div>
                </div>
                <p className="truncate text-sm font-medium text-discord-textHover">{image.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-discord-dark bg-discord-main p-6 text-center text-sm text-discord-textMuted">
            외모 프리셋이 아직 준비되지 않았습니다. 기본값으로 저장됩니다.
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm font-medium text-discord-text">목소리</label>
          <div className="rounded-lg bg-discord-sidebar p-1">
            {(["female", "male"] as UiGender[]).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => selectVoiceGender(gender)}
                className={`rounded-lg px-4 py-1.5 text-sm ${
                  currentVoiceGender === gender
                    ? "bg-discord-hover text-white"
                    : "text-discord-textMuted hover:text-discord-textHover"
                }`}
              >
                {gender === "female" ? "여성" : "남성"}
              </button>
            ))}
          </div>
        </div>

        {groupedVoices[currentVoiceGender].length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {groupedVoices[currentVoiceGender].map((voice) => {
              const isPlaying = playingVoiceId === voice.voiceTypeId;
              return (
                <div
                  key={voice.voiceTypeId}
                  className={`rounded-xl border p-3 transition ${
                    config.voiceId === String(voice.voiceTypeId)
                      ? "border-discord-blurple bg-discord-blurple/15"
                      : "border-discord-dark bg-discord-sidebar hover:border-discord-active"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onChange({ ...config, voiceId: String(voice.voiceTypeId) })}
                    className="w-full text-left"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Mic className="h-4 w-4 text-discord-text" />
                      {voice.testUrl && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVoiceSample(voice.voiceTypeId, voice.testUrl);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleVoiceSample(voice.voiceTypeId, voice.testUrl);
                            }
                          }}
                          className="cursor-pointer text-discord-textMuted hover:text-discord-blurple transition-colors"
                          title={isPlaying ? "정지" : "샘플 듣기"}
                        >
                          {isPlaying ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-discord-textHover">
                      {voice.label ?? `Voice ${voice.voiceTypeId}`}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-discord-dark bg-discord-main p-6 text-center text-sm text-discord-textMuted">
            목소리 샘플이 아직 준비되지 않았습니다. 기본값으로 저장됩니다.
          </div>
        )}
      </div>
    </section>
  );
}
