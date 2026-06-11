/**
 * @file 3D VRM 런타임 URL 복구 헬퍼
 * @dependsOn src/shared/lib/utils.ts
 * @dependsOn src/shared/stores/characterAppearanceStore.ts
 * @dependsOn src/shared/types/broadcast.ts
 * @dependsOn src/shared/types/character.ts
 * @usedBy src/components/AppInitializer.tsx
 * @usedBy src/pages/DashboardPage.tsx
 */

import { resolveAssetUrl } from "@/shared/lib/utils";
import type { AppearanceRecord } from "@/shared/stores/characterAppearanceStore";
import type { BroadcastCharacterInfoResDto } from "@/shared/types/broadcast";
import type { CharacterDetailResDto, CharacterImageResDto, CharacterModelType, CharacterSettingsResDto, VrmPresetResDto } from "@/shared/types/character";

interface ResolveVrmRuntimeOptions {
  appearance?: AppearanceRecord;
  character?: CharacterDetailResDto | null;
  broadcastCharacter?: BroadcastCharacterInfoResDto | null;
  settings?: CharacterSettingsResDto | null;
}

interface ResolvedVrmRuntime {
  modelType: CharacterModelType;
  characterImageUrl: string;
  vrmUrl: string;
  vrmThumbnailUrl: string;
}

function sameResolvedUrl(left: string | null | undefined, right: string | null | undefined): boolean {
  const a = resolveAssetUrl(left ?? "");
  const b = resolveAssetUrl(right ?? "");
  return !!a && !!b && a === b;
}

function findMatchedVrmPreset(
  settings: CharacterSettingsResDto | null | undefined,
  appearance: AppearanceRecord | undefined,
  character: CharacterDetailResDto | null | undefined,
  broadcastCharacter: BroadcastCharacterInfoResDto | null | undefined,
): VrmPresetResDto | null {
  const presets = settings?.vrmPresets ?? [];
  if (presets.length === 0) return null;

  const targetId = appearance?.modelType === "3D" ? appearance.targetId : null;
  if (targetId) {
    const matchedByTarget = presets.find((preset) => (preset.characterVrmId ?? preset.presetId) === targetId || preset.presetId === targetId);
    if (matchedByTarget) return matchedByTarget;
  }

  if (character?.vrmPresetId) {
    const matchedByPresetId = presets.find(
      (preset) => preset.characterVrmId === character.vrmPresetId || preset.presetId === character.vrmPresetId,
    );
    if (matchedByPresetId) return matchedByPresetId;
  }

  const directVrmUrl = appearance?.vrmUrl ?? character?.vrmUrl ?? null;
  if (directVrmUrl) {
    const matchedByVrmUrl = presets.find((preset) => sameResolvedUrl(preset.vrmUrl, directVrmUrl));
    if (matchedByVrmUrl) return matchedByVrmUrl;
  }

  const thumbnailCandidate =
    appearance?.vrmThumbnailUrl ?? character?.vrmThumbnailUrl ?? broadcastCharacter?.characterImageUrl ?? character?.characterImageUrl ?? null;
  if (thumbnailCandidate) {
    const matchedByThumbnail = presets.find((preset) => sameResolvedUrl(preset.thumbnailUrl, thumbnailCandidate));
    if (matchedByThumbnail) return matchedByThumbnail;
  }

  return null;
}

function findMatchedImage(
  settings: CharacterSettingsResDto | null | undefined,
  appearance: AppearanceRecord | undefined,
  character: CharacterDetailResDto | null | undefined,
  broadcastCharacter: BroadcastCharacterInfoResDto | null | undefined,
): CharacterImageResDto | null {
  const images = settings?.characterImages ?? [];
  if (images.length === 0) return null;

  const imageId = appearance?.modelType === "2D"
    ? appearance.targetId
    : (character?.characterImageId ?? null);
  if (imageId) {
    const matchedById = images.find((image) => image.imageId === imageId);
    if (matchedById) return matchedById;
  }

  const imageUrlCandidate =
    broadcastCharacter?.characterImageUrl ?? character?.characterImageUrl ?? null;
  if (imageUrlCandidate) {
    const matchedByUrl = images.find((image) => sameResolvedUrl(image.imageUrl, imageUrlCandidate));
    if (matchedByUrl) return matchedByUrl;
  }

  return null;
}

export function resolveVrmRuntime({
  appearance,
  character,
  broadcastCharacter,
  settings,
}: ResolveVrmRuntimeOptions): ResolvedVrmRuntime {
  const matchedPreset = findMatchedVrmPreset(settings, appearance, character, broadcastCharacter);
  // appearance가 명시적으로 3D를 지정했거나, character가 3D이고 appearance가 2D를 강제하지 않은 경우
  const appearanceForces2D = appearance?.modelType === "2D";
  const shouldUse3D = !appearanceForces2D && (appearance?.modelType === "3D" || character?.modelType === "3D");
  const matchedImage = shouldUse3D ? null : findMatchedImage(settings, appearance, character, broadcastCharacter);
  const characterImageUrl = shouldUse3D
    ? resolveAssetUrl(broadcastCharacter?.characterImageUrl) || resolveAssetUrl(character?.characterImageUrl) || resolveAssetUrl(matchedPreset?.thumbnailUrl)
    : resolveAssetUrl(matchedImage?.imageUrl)
      || resolveAssetUrl(broadcastCharacter?.characterImageUrl)
      || resolveAssetUrl(character?.characterImageUrl);
  const vrmUrl =
    shouldUse3D
      ? resolveAssetUrl(appearance?.vrmUrl ?? "") || resolveAssetUrl(character?.vrmUrl) || resolveAssetUrl(matchedPreset?.vrmUrl)
      : "";
  const vrmThumbnailUrl =
    shouldUse3D
      ? resolveAssetUrl(appearance?.vrmThumbnailUrl ?? "") || resolveAssetUrl(character?.vrmThumbnailUrl) || resolveAssetUrl(matchedPreset?.thumbnailUrl) || resolveAssetUrl(characterImageUrl)
      : "";
  const modelType: CharacterModelType =
    vrmUrl || shouldUse3D
      ? "3D"
      : "2D";

  return {
    modelType,
    characterImageUrl,
    vrmUrl,
    vrmThumbnailUrl,
  };
}
