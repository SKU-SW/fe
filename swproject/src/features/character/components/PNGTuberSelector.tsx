/**
 * @file 캐릭터 외모/목소리 선택 섹션
 * @created Sprint 3 - Character UI 이식
 * @updated Backend Swagger spec alignment
 * @dependsOn src/shared/types/character.ts (CharacterConfig, CharacterSettingsResDto)
 * @usedBy src/features/character/components/CharacterSettings.tsx
 */

import { useEffect, useMemo } from "react";
import { Cpu, ImageOff, MonitorSmartphone, ScanFace } from "lucide-react";
import type {
  CharacterModelType,
  CharacterConfig,
  CharacterImageResDto,
  CharacterSettingsResDto,
  UiGender,
  VrmPresetResDto,
} from "@/shared/types/character";
import { resolveAssetUrl } from "@/shared/lib/utils";

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

function pickDefaultVrmPreset(presets: VrmPresetResDto[]): VrmPresetResDto | null {
  if (presets.length === 0) return null;
  return presets.find((preset) => preset.name?.toLowerCase().includes("기본")) ?? presets[0];
}

function vrmTargetIdOf(preset: VrmPresetResDto | null | undefined): string | null {
  if (!preset) return null;
  return String(preset.characterVrmId ?? preset.presetId ?? "");
}

export function PNGTuberSelector({ config, settings, onChange }: PNGTuberSelectorProps) {
  const characterImages = useMemo(() => settings?.characterImages ?? [], [settings?.characterImages]);
  const availableModelTypes = useMemo<CharacterModelType[]>(() => {
    const raw = settings?.availableModelTypes;
    if (raw && raw.length > 0) return raw;
    return ["2D"];
  }, [settings?.availableModelTypes]);
  const vrmPresets = useMemo(() => settings?.vrmPresets ?? [], [settings?.vrmPresets]);

  /**
   * CharacterImageResDto 의 imageUrl 을 절대 URL 로 변환.
   * (이전엔 백엔드 호환을 위해 imageUrl1 fallback 이 있었으나 신 스키마에서 제거됨)
   */
  const getImageUrl = (image: (typeof characterImages)[0]): string =>
    resolveAssetUrl(image.imageUrl);

  const groupedImages = useMemo(() => {
    const male = characterImages.filter((img) => img.gender === "MALE");
    const female = characterImages.filter((img) => img.gender === "FEMALE");
    return { male, female };
  }, [characterImages]);

  const groupedVrmPresets = useMemo(() => {
    // 백엔드가 VRM 프리셋에 gender 필드를 안 주면(현재 Swagger 기준)
    // 양쪽 성별 모두에 전체 목록을 노출 — 사용자가 직접 선택.
    const hasGender = vrmPresets.some((preset) => preset.gender);
    if (!hasGender) {
      return { male: vrmPresets, female: vrmPresets };
    }
    const male = vrmPresets.filter((preset) => preset.gender === "MALE");
    const female = vrmPresets.filter((preset) => preset.gender === "FEMALE");
    return { male, female };
  }, [vrmPresets]);

  const currentAppearanceGender: UiGender = config.gender;
  const currentVrmPresets = groupedVrmPresets[currentAppearanceGender];

  // 설정 로드 후 외모가 미선택 상태이면 현재 성별의 첫 항목으로 자동 선택
  useEffect(() => {
    if (config.modelType !== "2D") return;
    if (!config.model2D.presetId && groupedImages[currentAppearanceGender].length > 0) {
      const firstImage = pickDefaultCharacterImage(groupedImages[currentAppearanceGender]);
      if (firstImage) {
        onChange({ ...config, model2D: { presetId: String(firstImage.imageId) } });
      }
    }
  }, [config, groupedImages, currentAppearanceGender, onChange]);

  useEffect(() => {
    if (config.modelType !== "3D") return;
    if (!config.model3D.presetId && currentVrmPresets.length > 0) {
      const firstPreset = pickDefaultVrmPreset(currentVrmPresets);
      if (firstPreset) {
        onChange({
          ...config,
          model3D: {
            presetId: vrmTargetIdOf(firstPreset),
            vrmUrl: firstPreset.vrmUrl,
            thumbnailUrl: firstPreset.thumbnailUrl,
          },
        });
      }
    }
  }, [config, currentVrmPresets, onChange]);

  const selectAppearanceGender = (gender: UiGender) => {
    const firstImage = pickDefaultCharacterImage(groupedImages[gender]);
    const firstVrmPreset = pickDefaultVrmPreset(groupedVrmPresets[gender]);
    onChange({
      ...config,
      gender,
      model2D: { presetId: firstImage ? String(firstImage.imageId) : null },
      model3D: {
        presetId: vrmTargetIdOf(firstVrmPreset),
        vrmUrl: firstVrmPreset?.vrmUrl ?? null,
        thumbnailUrl: firstVrmPreset?.thumbnailUrl ?? null,
      },
    });
  };

  const selectModelType = (modelType: CharacterModelType) => {
    if (modelType === config.modelType) return;
    if (modelType === "2D") {
      const firstImage = pickDefaultCharacterImage(groupedImages[currentAppearanceGender]);
      onChange({
        ...config,
        modelType,
        model2D: { presetId: config.model2D.presetId ?? (firstImage ? String(firstImage.imageId) : null) },
      });
      return;
    }

    const firstPreset = pickDefaultVrmPreset(currentVrmPresets);
    onChange({
      ...config,
      modelType,
      model3D: {
        presetId: config.model3D.presetId ?? vrmTargetIdOf(firstPreset),
        vrmUrl: config.model3D.vrmUrl ?? firstPreset?.vrmUrl ?? null,
        thumbnailUrl: config.model3D.thumbnailUrl ?? firstPreset?.thumbnailUrl ?? null,
      },
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

      <div className="rounded-xl border border-border-default bg-surface-base p-4">
        <div className="flex flex-wrap items-center gap-2">
          {availableModelTypes.map((modelType) => (
            <button
              key={modelType}
              type="button"
              onClick={() => selectModelType(modelType)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                config.modelType === modelType
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border-default bg-surface-panel text-content-secondary hover:border-border-strong hover:text-content-primary"
              }`}
            >
              {modelType === "2D" ? <MonitorSmartphone className="h-4 w-4" /> : <ScanFace className="h-4 w-4" />}
              {modelType}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border-default bg-surface-panel p-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-content-muted">2D 추천</p>
            <p className="mt-1 text-sm text-content-secondary">저사양 PC, 안정적인 방송, 빠른 로딩이 중요하면 2D가 적합합니다.</p>
          </div>
          <div className="rounded-lg border border-border-default bg-surface-panel p-3">
            <div className="flex items-center gap-2 text-content-primary">
              <Cpu className="h-4 w-4 text-brand" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-content-muted">3D 권장 사양</p>
            </div>
            <p className="mt-1 text-sm text-content-secondary">
              브라우저 하드웨어 가속 ON, 메모리 8GB 이상, 최근 5년 내 내장/외장 GPU 환경을 권장합니다.
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-content-secondary">
              {config.modelType === "2D" ? "2D 외모" : "3D VRM 프리셋"}
            </label>
            <p className="mt-1 text-xs text-content-muted">
              {config.modelType === "2D"
                ? "기존 PNG 캐릭터 흐름을 사용합니다."
                : "S3에 등록된 VRM 프리셋을 선택합니다. 방송/오버레이에서 동일 모델로 렌더링됩니다."}
            </p>
          </div>
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

        {config.modelType === "2D" ? (
          groupedImages[currentAppearanceGender].length > 0 ? (
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
          )
        ) : currentVrmPresets.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {currentVrmPresets.map((preset) => {
              const thumbnailUrl = resolveAssetUrl(preset.thumbnailUrl);
              return (
                <button
                  key={preset.presetId}
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      model3D: {
                        presetId: vrmTargetIdOf(preset),
                        vrmUrl: preset.vrmUrl,
                        thumbnailUrl: preset.thumbnailUrl,
                      },
                    })
                  }
                  className={`rounded-xl border p-3 text-left transition ${
                    config.model3D.presetId === vrmTargetIdOf(preset)
                      ? "border-brand bg-brand/10"
                      : "border-border-default bg-surface-panel hover:border-border-strong"
                  }`}
                >
                  <div className="mb-2 flex h-24 w-full items-center justify-center overflow-hidden rounded-lg border border-border-default bg-surface-raised transition-colors">
                    {thumbnailUrl ? (
                      <img
                        src={thumbnailUrl}
                        alt={preset.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className="hidden h-full items-center justify-center text-content-muted">
                      <ImageOff className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-content-primary">{preset.name}</p>
                    <span className="rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                      VRM
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border-default bg-surface-base p-6 text-center text-sm text-content-muted transition-colors">
            3D VRM 프리셋이 아직 준비되지 않았습니다. 백엔드 설정 응답에 vrmPresets 가 추가되면 선택할 수 있습니다.
          </div>
        )}
      </div>

    </section>
  );
}
