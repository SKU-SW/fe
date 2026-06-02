/**
 * @file 캐릭터 외모/목소리 선택 섹션
 * @created Sprint 3 - Character UI 이식
 * @updated Backend Swagger spec alignment
 * @dependsOn src/shared/types/character.ts (CharacterConfig, CharacterSettingsResDto)
 * @usedBy src/features/character/components/CharacterSettings.tsx
 */

import { useEffect, useMemo } from "react";
import { ImageOff } from "lucide-react";
import type {
  CharacterConfig,
  CharacterImageResDto,
  CharacterSettingsResDto,
  UiGender,
} from "@/shared/types/character";

function pickDefaultCharacterImage(
  images: CharacterImageResDto[],
): CharacterImageResDto | null {
  if (images.length === 0) return null;
  return images.find((img) => img.name?.toLowerCase() === "default") ?? images[0];
}

interface PNGTuberSelectorProps {
  config: CharacterConfig;
  settings: CharacterSettingsResDto | null;
  onChange: (config: CharacterConfig) => void;
}

export function PNGTuberSelector({ config, settings, onChange }: PNGTuberSelectorProps) {
  const characterImages = useMemo(() => settings?.characterImages ?? [], [settings?.characterImages]);
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

  const groupedImages = useMemo(() => {
    const male = characterImages.filter((img) => img.gender === "MALE");
    const female = characterImages.filter((img) => img.gender === "FEMALE");
    return { male, female };
  }, [characterImages]);

  const currentAppearanceGender: UiGender = config.gender;

  // 설정 로드 후 외모가 미선택 상태이면 현재 성별의 첫 항목으로 자동 선택
  useEffect(() => {
    if (!config.model2D.presetId && groupedImages[currentAppearanceGender].length > 0) {
      const firstImage = pickDefaultCharacterImage(groupedImages[currentAppearanceGender]);
      if (firstImage) {
        onChange({ ...config, model2D: { presetId: String(firstImage.imageId) } });
      }
    }
  }, [config, groupedImages, currentAppearanceGender, onChange]);

  const selectAppearanceGender = (gender: UiGender) => {
    const firstImage = pickDefaultCharacterImage(groupedImages[gender]);
    onChange({
      ...config,
      gender,
      model2D: { presetId: firstImage ? String(firstImage.imageId) : null },
    });
  };

  return (
    <section className="space-y-6 rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/15 text-xs font-bold text-brand">
          1
        </div>
        <h3 className="text-lg font-semibold text-content-primary">외모</h3>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm font-medium text-content-secondary">외모</label>
          <div className="rounded-lg bg-surface-raised p-1 transition-colors">
            {(["female", "male"] as UiGender[]).map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => selectAppearanceGender(gender)}
                className={`rounded-lg px-4 py-1.5 text-sm ${
                  currentAppearanceGender === gender
                    ? "bg-surface-active text-content-primary"
                    : "text-content-muted hover:text-content-primary"
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
                    ? "border-brand bg-brand/10"
                    : "border-border-default bg-surface-panel hover:border-border-strong"
                }`}
              >
                <div className="mb-2 h-24 w-full overflow-hidden rounded-lg border border-border-default bg-surface-raised transition-colors">
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
                  <div className="hidden h-full items-center justify-center text-content-muted">
                    <ImageOff className="h-6 w-6" />
                  </div>
                </div>
                <p className="truncate text-sm font-medium text-content-primary">{image.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-default bg-surface-base p-6 text-center text-sm text-content-muted transition-colors">
            외모 프리셋이 아직 준비되지 않았습니다. 기본값으로 저장됩니다.
          </div>
        )}
      </div>

    </section>
  );
}
