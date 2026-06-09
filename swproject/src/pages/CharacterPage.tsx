/**
 * @file 캐릭터 관리 페이지
 * @created Sprint 3 - Character UI 이식 및 페이지 연동
 * @updated Backend Swagger spec alignment
 * @updated Sprint 4 - 방송 시작 동의 모달 + 방송 상태(aiMode) 연동, 캐릭터 10개 한도 가드
 * @updated 방송 시작/종료를 백엔드 API(/stream/start, /stream/terminate)와 연결
 * @updated OBS 준비 체크리스트 패널 추가
 * @updated 치지직 게이트(미연동/만료) 추가 및 방송 시작 전 선행 검증
 * @dependsOn src/features/character/hooks/index.ts
 * @dependsOn src/features/character/components/index.ts
 * @dependsOn src/features/broadcast/hooks (useStartBroadcast, useTerminateBroadcast, useObsLaunch)
 * @dependsOn src/features/auth/api/authApi.ts (getChzzkStatus)
 * @dependsOn src/features/auth/components/ChzzkConnectModal.tsx
 * @dependsOn src/shared/stores/aiModeStore.ts (방송 mode 동기화)
 * @dependsOn src/shared/constants/character.ts (MAX_CHARACTERS_PER_USER)
 * @usedBy src/App.tsx
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useCharacters,
  useCharacter,
  useCharacterSettings,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useSelectCharacter,
} from "@/features/character/hooks";
import { BroadcastConfirmModal, CharacterDashboard, CharacterForm } from "@/features/character/components";
import { ObsGateModal } from "@/features/broadcast/components";
import { useObsLaunch, useStartBroadcast, useTerminateBroadcast } from "@/features/broadcast/hooks";
import { getChzzkStatus } from "@/features/auth/api/authApi";
import {
  isChzzkAuthExpiredMessage,
  isChzzkExpired,
  isChzzkLinked,
} from "@/features/auth/lib/chzzkStatus";
import {
  ChzzkConnectModal,
  type ChzzkConnectModalMode,
} from "@/features/auth/components/ChzzkConnectModal";
import { getTriggerWordsValidationError, normalizeTriggerWords } from "@/features/character/lib/triggerWords";
import { useBroadcastNoticeStore } from "@/shared/stores/broadcastNoticeStore";
import { useCharacterStore } from "@/shared/stores/characterStore";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useOverlayStore } from "@/shared/stores/overlayStore";
import { useAlarmStore } from "@/shared/stores/alarmStore";
import { useCharacterAppearanceStore } from "@/shared/stores/characterAppearanceStore";
import { MAX_CHARACTERS_PER_USER } from "@/shared/constants/character";
import { resolveAssetUrl } from "@/shared/lib/utils";
import {
  toBackendAppearance,
  type CharacterConfig,
  type CharacterPreset,
  type CharacterListItemResDto,
  type CharacterDetailResDto,
  type CharacterCreateReqDto,
  type CharacterUpdateReqDto,
  type CharacterSettingsResDto,
  type CharacterModelType,
  type Persona,
  type PresetType,
  type Gender,
  type BroadcastPreset,
} from "@/shared/types/character";

type CharacterView = "dashboard" | "create" | "edit";

// ============================================================
// UI 매핑 함수들 (CharacterConfig → Backend DTO)
// ============================================================

function mapBroadcastPresetToPresetType(preset: BroadcastPreset | null): PresetType {
  switch (preset) {
    case "neighbor": return "FRIENDLY_CHATTER";
    case "high_tension": return "HIGH_TENSION";
    case "teaser": return "PLAYFUL_TEASER";
    case "manager": return "PROFESSIONAL_MANAGER";
    case "immersive": return "ROLEPLAY_EXPERT";
    case "custom": throw new Error("현재 API에서는 커스텀 페르소나를 지원하지 않습니다.");
    default: throw new Error("페르소나 프리셋이 선택되지 않았습니다.");
  }
}

function mapUiGenderToBackend(g: "male" | "female"): Gender {
  return g === "male" ? "MALE" : "FEMALE";
}

/**
 * 문자열을 양의 정수로 안전 변환
 * - "1", "2" 등 숫자 문자열 → 숫자
 * - "undefined", "null", "" 등 비숫자 → null
 * - NaN/0/음수 → null
 */
function toPositiveInt(value: string | undefined | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function modelTypeOf(modelType: CharacterModelType | undefined): CharacterModelType {
  return modelType === "3D" ? "3D" : "2D";
}

/**
 * CharacterConfig → CharacterCreateReqDto (Swagger 스키마)
 * - characterAppearanceType: "TWO_D" | "THREE_D"
 * - targetId: 2D 면 imageId, 3D 면 characterVrmId 통합 송신
 */
function toBackendCreatePayload(config: CharacterConfig): CharacterCreateReqDto {
  const triggerWords = normalizeTriggerWords(config.callWords);
  const modelType = modelTypeOf(config.modelType);
  const targetId =
    modelType === "3D"
      ? toPositiveInt(config.model3D.presetId)
      : toPositiveInt(config.model2D.presetId);

  if (!targetId) {
    throw new Error(
      modelType === "3D"
        ? "3D VRM 프리셋을 다시 선택해주세요."
        : "2D 외모를 다시 선택해주세요."
    );
  }

  return {
    characterAppearanceType: toBackendAppearance(modelType),
    characterName: config.name.trim() || "새 AI 캐릭터",
    triggerWords,
    gender: mapUiGenderToBackend(config.gender),
    targetId,
    characterPersona: {
      presetType: mapBroadcastPresetToPresetType(config.broadcastPreset),
    },
  };
}

/** CharacterConfig → CharacterUpdateReqDto (생성과 동일 스키마) */
function toBackendUpdatePayload(config: CharacterConfig): CharacterUpdateReqDto {
  return toBackendCreatePayload(config);
}

// ============================================================
// Backend DTO → UI CharacterPreset 매핑
// ============================================================

function mapBackendPersonaToUi(presetType: string): Persona {
  switch (presetType) {
    case "FRIENDLY_CHATTER": return "neighbor";
    case "HIGH_TENSION": return "high_tension";
    case "PLAYFUL_TEASER": return "teaser";
    case "PROFESSIONAL_MANAGER": return "manager";
    case "ROLEPLAY_EXPERT": return "immersive";
    default: return "neighbor";
  }
}

function findMatchedImage(
  settings: CharacterSettingsResDto | null,
  imageId: number | null | undefined,
  imageUrl: string | null | undefined,
  gender: "MALE" | "FEMALE"
) {
  const images = settings?.characterImages ?? [];
  if (imageId) {
    const matchedById = images.find((image) => image.imageId === imageId);
    if (matchedById) return matchedById;
  }

  const resolvedImageUrl = resolveAssetUrl(imageUrl);
  if (resolvedImageUrl) {
    const matchedByUrl = images.find((image) => resolveAssetUrl(image.imageUrl) === resolvedImageUrl);
    if (matchedByUrl) return matchedByUrl;
  }

  return images.find((image) => image.gender === gender && image.name?.toLowerCase() === "default")
    ?? images.find((image) => image.gender === gender)
    ?? null;
}

function findMatchedVrm(
  settings: CharacterSettingsResDto | null,
  vrmPresetId: number | null | undefined,
  vrmUrl: string | null | undefined
) {
  const presets = settings?.vrmPresets ?? [];
  if (vrmPresetId) {
    const matchedById = presets.find((preset) => preset.presetId === vrmPresetId || preset.characterVrmId === vrmPresetId);
    if (matchedById) return matchedById;
  }

  const resolvedVrmUrl = resolveAssetUrl(vrmUrl);
  if (resolvedVrmUrl) {
    const matchedByUrl = presets.find((preset) => resolveAssetUrl(preset.vrmUrl) === resolvedVrmUrl);
    if (matchedByUrl) return matchedByUrl;
  }

  return presets[0] ?? null;
}

/** UI CharacterPreset으로 변환 (목록 표시용) */
function toCharacterPreset(item: CharacterListItemResDto, settings: CharacterSettingsResDto | null): CharacterPreset {
  // 원본 배열 — triggerWords 로 보존하여 수정/저장 시 손실 방지
  const triggerWords = normalizeTriggerWords(item.triggerWords);
  const persona = item.characterPersona;
  const modelType = modelTypeOf(item.modelType);
  const matchedImage = findMatchedImage(settings, item.characterImageId, item.characterImageUrl, item.gender);
  const matchedVrm = findMatchedVrm(settings, item.vrmPresetId, item.vrmUrl);
  return {
    id: String(item.characterId),
    name: item.characterName,
    info: {
      modelType,
      gender: item.gender === "MALE" ? "male" : "female",
      name: item.characterName,
      // callSign 은 표시용 합본. 원본은 triggerWords 에서 가져갈 것
      callSign: triggerWords.join(", ") || "AI",
      triggerWords,
      appearancePresetId: item.characterImageId
        ? String(item.characterImageId)
        : matchedImage
          ? String(matchedImage.imageId)
          : "",
      imageUrl: modelType === "2D"
        ? (matchedImage?.imageUrl ?? item.characterImageUrl ?? "")
        : (item.vrmThumbnailUrl ?? matchedVrm?.thumbnailUrl ?? ""),
      vrmPresetId: item.vrmPresetId
        ? String(item.vrmPresetId)
        : matchedVrm
          ? String(matchedVrm.presetId ?? matchedVrm.characterVrmId)
          : "",
      vrmUrl: item.vrmUrl ?? undefined,
      vrmThumbnailUrl: item.vrmThumbnailUrl ?? matchedVrm?.thumbnailUrl ?? undefined,
      voicePresetId: "",
      speechStyle: "friendly_informal",
      personality: "energetic",
      persona: persona ? mapBackendPersonaToUi(persona.presetType) : "neighbor",
    },
    broadcastSettings: {
      chatSensitivity: "medium",
      silenceIntervalSeconds: 10,
      ttsSpeed: 1,
      ttsVolume: 1,
    },
    createdAt: "",
  };
}

/** UI CharacterPreset으로 변환 (상세 표시용) */
function detailToPreset(detail: CharacterDetailResDto, settings: CharacterSettingsResDto | null): CharacterPreset {
  const persona = detail.characterPersona;
  // 상세 API 도 triggerWords 가 배열로 옴 — 첫 원소만 쓰지 말고 전체 보존
  const triggerWords = normalizeTriggerWords(detail.triggerWords);
  const modelType = modelTypeOf(detail.modelType);
  const matchedImage = findMatchedImage(settings, detail.characterImageId, detail.characterImageUrl, detail.gender);
  const matchedVrm = findMatchedVrm(settings, detail.vrmPresetId, detail.vrmUrl);
  return {
    id: String(detail.characterId),
    name: detail.characterName,
    info: {
      modelType,
      gender: detail.gender === "MALE" ? "male" : "female",
      name: detail.characterName,
      callSign: triggerWords.join(", ") || "AI",
      triggerWords,
      appearancePresetId: detail.characterImageId
        ? String(detail.characterImageId)
        : matchedImage
          ? String(matchedImage.imageId)
          : "",
      imageUrl: modelType === "2D"
        ? (matchedImage?.imageUrl ?? detail.characterImageUrl ?? "")
        : (detail.vrmThumbnailUrl ?? matchedVrm?.thumbnailUrl ?? ""),
      vrmPresetId: detail.vrmPresetId
        ? String(detail.vrmPresetId)
        : matchedVrm
          ? String(matchedVrm.presetId)
          : "",
      vrmUrl: detail.vrmUrl ?? matchedVrm?.vrmUrl ?? undefined,
      vrmThumbnailUrl: detail.vrmThumbnailUrl ?? matchedVrm?.thumbnailUrl ?? undefined,
      voicePresetId: "",
      speechStyle: "friendly_informal",
      personality: "energetic",
      persona: mapBackendPersonaToUi(persona.presetType),
    },
    broadcastSettings: {
      chatSensitivity: "medium",
      silenceIntervalSeconds: 10,
      ttsSpeed: 1,
      ttsVolume: 1,
    },
    createdAt: "",
  };
}

// ============================================================
// 페이지 컴포넌트
// ============================================================

export default function CharacterPage() {
  const [view, setView] = useState<CharacterView>("dashboard");
  const [editingCharacterId, setEditingCharacterId] = useState<number | null>(null);
  const [pendingBroadcastId, setPendingBroadcastId] = useState<string | null>(null);
  const [obsGatePending, setObsGatePending] = useState<number | null>(null);
  const [chzzkGatePending, setChzzkGatePending] = useState<number | null>(null);
  const [chzzkGateMode, setChzzkGateMode] = useState<ChzzkConnectModalMode | null>(null);
  const [pageNotice, setPageNotice] = useState<{ tone: "error" | "info"; message: string } | null>(null);
  const pushAlarm = useAlarmStore((s) => s.push);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const shouldSkipBroadcastNotice = useBroadcastNoticeStore((s) => s.shouldSkipNotice);
  const skipNoticeForCharacter = useBroadcastNoticeStore((s) => s.skipNoticeForCharacter);
  const aiMode = useAIModeStore((s) => s.mode);
  const clearOverlayRuntime = useOverlayStore((s) => s.clearRuntime);
  const setAppearance = useCharacterAppearanceStore((s) => s.setAppearance);
  const removeAppearance = useCharacterAppearanceStore((s) => s.removeAppearance);
  const storedSelectedCharacter = useCharacterStore((s) => s.selectedCharacter);
  const characterDetailsMap = useCharacterStore((s) => s.characterDetailsMap);

  // 방송 중 캐릭터 ID는 별도 저장하지 않고 aiModeStore.mode + 선택된 캐릭터로 도출
  // - 단일 진실 원천(single source of truth)으로 두 store 동기화 비용 제거
  // - 방송 중에는 다른 캐릭터 선택을 막으므로 selectedCharacterId 가 곧 방송 주체와 일치
  const broadcastingId = aiMode === "broadcasting" && selectedCharacterId
    ? String(selectedCharacterId)
    : null;

  const { characters: apiCharacters, refetch, isLoading: isLoadingCharacters, error: charactersError } = useCharacters();
  const { character: apiCharacter } = useCharacter(view === "edit" ? editingCharacterId : null);
  const { settings } = useCharacterSettings(true);
  const { create, isPending: isCreating, error: createError } = useCreateCharacter();
  const { update, isPending: isUpdating, error: updateError } = useUpdateCharacter();
  const { remove, isPending: isDeleting } = useDeleteCharacter();
  const { select, isPending: isSelecting, error: selectError } = useSelectCharacter();
  const {
    start: startBroadcastApi,
    isPending: isStartingBroadcast,
    error: startBroadcastError,
    chzzkAuthUrl,
  } = useStartBroadcast();
  const { terminate: terminateBroadcastApi, isPending: isTerminatingBroadcast, error: terminateBroadcastError } = useTerminateBroadcast();
  const { obsStatus, obsError, obsDiagnostics, launchObs, resetObsStatus } = useObsLaunch();
  const overlayUrl = useMemo(() => {
    if (import.meta.env.DEV) return "http://localhost:5173/#/overlay";
    return "http://127.0.0.1:5174/#/overlay";
  }, []);

  useEffect(() => {
    if (startBroadcastError) {
      if (isChzzkAuthExpiredMessage(startBroadcastError)) {
        if (selectedCharacterId) {
          setChzzkGatePending(selectedCharacterId);
        }
        setChzzkGateMode("gate-expired");
      }
      setPageNotice({ tone: "error", message: startBroadcastError });
    }
  }, [selectedCharacterId, startBroadcastError]);
  useEffect(() => {
    if (terminateBroadcastError) {
      setPageNotice({ tone: "error", message: terminateBroadcastError });
    }
  }, [terminateBroadcastError]);
  useEffect(() => {
    if (selectError) {
      setPageNotice({ tone: "error", message: selectError });
    }
  }, [selectError]);
  // API 응답을 UI CharacterPreset으로 변환
  // 우선순위: characterDetailsMap > storedSelectedCharacter > toCharacterPreset(목록 폴백)
  // - storedSelectedCharacter 는 persist 잔재/직전 update 응답으로 stale 할 수 있음
  // - 상세 캐시가 있으면 그 값을 우선 사용해 3D→2D 전환 직후 표시 불일치 방지
  const characters = useMemo(
    () => apiCharacters.map((item) => {
      const cachedDetail = characterDetailsMap[item.characterId];
      if (cachedDetail) {
        return detailToPreset(cachedDetail, settings as CharacterSettingsResDto | null);
      }
      if (storedSelectedCharacter && storedSelectedCharacter.characterId === item.characterId) {
        return detailToPreset(storedSelectedCharacter, settings as CharacterSettingsResDto | null);
      }
      return toCharacterPreset(item, settings as CharacterSettingsResDto | null);
    }),
    [apiCharacters, characterDetailsMap, settings, storedSelectedCharacter]
  );

  const selectedCharacter = useMemo<CharacterPreset | null>(() => {
    if (apiCharacter) {
      return detailToPreset(apiCharacter, settings as CharacterSettingsResDto | null);
    }
    const targetId = view === "edit" ? editingCharacterId : selectedCharacterId;
    if (!targetId) {
      return null;
    }
    return characters.find((item) => item.id === String(targetId)) ?? null;
  }, [apiCharacter, characters, editingCharacterId, selectedCharacterId, settings, view]);

  const resolveAppearanceRecord = useCallback((config: CharacterConfig) => {
    const modelType = modelTypeOf(config.modelType);
    const targetId =
      modelType === "3D"
        ? toPositiveInt(config.model3D.presetId)
        : toPositiveInt(config.model2D.presetId);

    if (!targetId) return null;

    const matchedVrm =
      modelType === "3D"
        ? settings?.vrmPresets?.find((preset) => {
            const presetId = preset.characterVrmId ?? preset.presetId;
            return Number(presetId) === targetId;
          })
        : undefined;

    return {
      modelType,
      targetId,
      vrmUrl: modelType === "3D" ? (matchedVrm?.vrmUrl ?? config.model3D.vrmUrl ?? null) : null,
      vrmThumbnailUrl: modelType === "3D" ? (matchedVrm?.thumbnailUrl ?? config.model3D.thumbnailUrl ?? null) : null,
      updatedAt: Date.now(),
    };
  }, [settings?.vrmPresets]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('[CharacterPage] selectedCharacter render source:', {
      selectedCharacterId,
      editingCharacterId,
      apiCharacter: apiCharacter
        ? {
            characterId: apiCharacter.characterId,
            characterPersona: apiCharacter.characterPersona,
          }
        : null,
      selectedCharacter: selectedCharacter
        ? {
            id: selectedCharacter.id,
            persona: selectedCharacter.info.persona,
            personality: selectedCharacter.info.personality,
            speechStyle: selectedCharacter.info.speechStyle,
          }
        : null,
    });
  }, [apiCharacter, editingCharacterId, selectedCharacter, selectedCharacterId]);

  // 첫 캐릭터 자동 선택: selectedCharacterId가 비어있고 목록이 존재할 때만 한 번 수행
  // (characters 참조가 매 렌더마다 바뀌므로, 의존성에서 제외해 루프 방지)
  useEffect(() => {
    if (selectedCharacterId || apiCharacters.length === 0) return;
    const firstId = apiCharacters[0].characterId;
    void select(firstId, true);
  }, [selectedCharacterId, apiCharacters, select]);

  const handleCreate = useCallback(
    async (config: CharacterConfig) => {
      const triggerWordsError = getTriggerWordsValidationError(normalizeTriggerWords(config.callWords));
      if (triggerWordsError) {
        setPageNotice({ tone: "error", message: triggerWordsError });
        return;
      }
      // 방어 체크: 대시보드 버튼이 비활성화되어 있어도, 직접 view 전환 등으로 우회될 수 있어 한 번 더 검증
      if (apiCharacters.length >= MAX_CHARACTERS_PER_USER) {
        setPageNotice({
          tone: "info",
          message: `AI 캐릭터는 최대 ${MAX_CHARACTERS_PER_USER}개까지 생성할 수 있습니다.`,
        });
        setView("dashboard");
        return;
      }
      if (!config.broadcastPreset || config.broadcastPreset === "custom") {
        setPageNotice({
          tone: "error",
          message: config.broadcastPreset === "custom"
            ? "현재 API에서는 커스텀 페르소나를 지원하지 않습니다. 기본 프리셋 중 하나를 선택해주세요."
            : "페르소나 프리셋을 선택해주세요.",
        });
        return;
      }
      const payload = toBackendCreatePayload(config);
      try {
        const created = await create(payload);
        const appearance = resolveAppearanceRecord(config);
        if (appearance) {
          setAppearance(created.characterId, appearance);
        }
        await refetch(); // 목록 새로고침: 생성된 캐릭터 포함 전체 목록 재조회
        setEditingCharacterId(null);
        setView("dashboard");
      } catch (err: unknown) {
        if (err instanceof Error) {
          setPageNotice({ tone: "error", message: err.message });
        }
      }
    },
    [apiCharacters.length, create, refetch, resolveAppearanceRecord, setAppearance, settings]
  );

  const handleUpdate = useCallback(
    async (config: CharacterConfig) => {
      const triggerWordsError = getTriggerWordsValidationError(normalizeTriggerWords(config.callWords));
      if (triggerWordsError) {
        setPageNotice({ tone: "error", message: triggerWordsError });
        return;
      }
      const targetCharacterId = editingCharacterId ?? selectedCharacterId;
      if (!targetCharacterId) {
        return;
      }
      if (!config.broadcastPreset || config.broadcastPreset === "custom") {
        setPageNotice({
          tone: "error",
          message: config.broadcastPreset === "custom"
            ? "현재 API에서는 커스텀 페르소나를 지원하지 않습니다. 기본 프리셋 중 하나를 선택해주세요."
            : "페르소나 프리셋을 선택해주세요.",
        });
        return;
      }
      const payload = toBackendUpdatePayload(config);
      try {
        await update(targetCharacterId, payload);
        const appearance = resolveAppearanceRecord(config);
        if (appearance) {
          setAppearance(targetCharacterId, appearance);
        }
        await refetch(); // 수정 후 목록 새로고침
        setEditingCharacterId(null);
        setView("dashboard");
        window.location.reload();
      } catch (err: unknown) {
        if (err instanceof Error) {
          setPageNotice({ tone: "error", message: err.message });
        }
      }
    },
    [editingCharacterId, refetch, resolveAppearanceRecord, selectedCharacterId, setAppearance, settings, update]
  );

  const handleDelete = useCallback(
    async (characterId: string) => {
      const id = Number(characterId);
      const deleted = await remove(id);
      if (deleted) {
        removeAppearance(id);
        await refetch();
      }
    },
    [refetch, remove, removeAppearance]
  );

  // === 방송 시작/종료 ===

  /**
   * 캐릭터 선택 동기화 후 백엔드 /stream/start 호출.
   * - 백엔드 스펙: "선택하지 않은 AI 캐릭터로 방송 시작 시 예외" — select 가 선행되어야 함.
   * - 이전엔 selectedCharacterId 가 cid 와 같으면 select 호출을 생략했으나,
   *   FE store 와 BE user.selectedCharacterId 가 어긋난 케이스 (persist 잔재 / 다른 세션 / 캐시 등)에서
   *   start 가 BROADCAST_CHARACTER_NOT_SELECTED 로 거부되는 문제가 발생.
   *   → 매번 select 를 호출해 BE 측 동기화를 강제 (추가 PATCH 1회 비용 < 정확성 이득).
   */
   const performStart = useCallback(
     async (cid: number) => {
       const selected = await select(cid, true);
       if (!selected) return;
       const started = await startBroadcastApi(cid);
       if (!started) return;
     },
     [select, startBroadcastApi]
   );

   const ensureChzzkReady = useCallback(async (cid: number): Promise<boolean> => {
     try {
       const status = await getChzzkStatus();
       if (!isChzzkLinked(status)) {
         setChzzkGatePending(cid);
         setChzzkGateMode("gate-not-linked");
         return false;
       }
       if (isChzzkExpired(status)) {
         setChzzkGatePending(cid);
         setChzzkGateMode("gate-expired");
         return false;
       }
       return true;
     } catch (err: unknown) {
       const message = err instanceof Error
         ? err.message
         : "치지직 연동 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.";
       setPageNotice({ tone: "error", message });
       return false;
     }
   }, []);

  const enterObsGate = useCallback(async (cid: number) => {
    const chzzkReady = await ensureChzzkReady(cid);
    if (!chzzkReady) return;

    const selected = await select(cid, true);
    if (!selected) return;
    setObsGatePending(cid);
    void launchObs(overlayUrl);
  }, [ensureChzzkReady, launchObs, overlayUrl, select]);

  /**
   * 방송 시작 버튼 클릭 핸들러
   * 동작 순서:
   *   1) 이미 방송 중이거나 시작 요청 진행 중이면 무시
   *   2) "다시 받지 않기" 저장된 캐릭터면 OBS 준비 게이트로 이동
   *   3) 그렇지 않으면 동의 모달 표시 + 모달 떠 있는 동안 백엔드 선택 동기화 미리 시작
   */
  const handleBroadcastStart = useCallback(
    (characterId: string) => {
      if (aiMode === "broadcasting" || isStartingBroadcast || obsGatePending !== null) return;

      const cid = Number(characterId);
      const skipNotice = shouldSkipBroadcastNotice(characterId);

      if (skipNotice) {
        void enterObsGate(cid);
        return;
      }

      if (selectedCharacterId !== cid) {
        void select(cid, true);
      }
      setPendingBroadcastId(characterId);
    },
    [aiMode, enterObsGate, isStartingBroadcast, obsGatePending, select, selectedCharacterId, shouldSkipBroadcastNotice]
  );

  useEffect(() => {
    if (obsGatePending === null) return;
    if (obsStatus !== "setup_ok") return;

    const cid = obsGatePending;
    setObsGatePending(null);
    void performStart(cid);
  }, [obsGatePending, obsStatus, performStart]);

  useEffect(() => {
    if (obsGatePending === null) return;
    if (obsStatus === "idle" || obsStatus === "connecting" || obsStatus === "setup_ok") return;

    if (obsStatus === "not_found") {
      pushAlarm("broadcast.start_failed.obs");
      return;
    }

    if (
      obsStatus === "auth_required" ||
      obsStatus === "timeout" ||
      obsStatus === "setup_failed" ||
      obsStatus === "error"
    ) {
      pushAlarm("obs.disconnected");
    }
  }, [obsGatePending, obsStatus, pushAlarm]);

  /** 모달에서 시작 버튼 확정 */
  const handleBroadcastConfirm = useCallback(
    async (dontShowAgain: boolean) => {
      if (!pendingBroadcastId) return;
      if (dontShowAgain) {
        skipNoticeForCharacter(pendingBroadcastId);
      }
      const cid = Number(pendingBroadcastId);
      setPendingBroadcastId(null);
      void enterObsGate(cid);
    },
    [enterObsGate, pendingBroadcastId, skipNoticeForCharacter]
  );

  /** 모달 취소 */
  const handleBroadcastCancel = useCallback(() => {
    setPendingBroadcastId(null);
  }, []);

  const handleObsRetry = useCallback(() => {
    void launchObs(overlayUrl);
  }, [launchObs, overlayUrl]);

  const handleObsGateCancel = useCallback(() => {
    setObsGatePending(null);
    resetObsStatus();
  }, [resetObsStatus]);

  const handleObsGateManualConfirm = useCallback(() => {
    if (obsGatePending === null) return;
    const cid = obsGatePending;
    setObsGatePending(null);
    void performStart(cid);
  }, [obsGatePending, performStart]);

  const handleObsGateForceStart = useCallback(() => {
    if (obsGatePending === null) return;
    const cid = obsGatePending;
    setObsGatePending(null);
    void performStart(cid);
  }, [obsGatePending, performStart]);

  const handleChzzkGateSuccess = useCallback(() => {
    if (chzzkGatePending === null) {
      setChzzkGateMode(null);
      return;
    }
    const cid = chzzkGatePending;
    setChzzkGatePending(null);
    setChzzkGateMode(null);
    void enterObsGate(cid);
  }, [chzzkGatePending, enterObsGate]);

  const handleChzzkGateCancel = useCallback(() => {
    setChzzkGatePending(null);
    setChzzkGateMode(null);
  }, []);

  /** 방송 종료 — 백엔드 /stream/terminate 호출, 성공 시 hook 내부에서 clearBroadcast() 처리 */
  const handleBroadcastStop = useCallback(async () => {
    if (isTerminatingBroadcast) return;
    await terminateBroadcastApi();
    clearOverlayRuntime();
    resetObsStatus();
  }, [clearOverlayRuntime, isTerminatingBroadcast, resetObsStatus, terminateBroadcastApi]);

  // 모달에 표시할 캐릭터 이름 (pendingBroadcastId 기준)
  const pendingCharacterName = useMemo(() => {
    if (!pendingBroadcastId) return "";
    return characters.find((c) => c.id === pendingBroadcastId)?.name ?? "";
  }, [characters, pendingBroadcastId]);

  // === 뷰 전환 로직 ===

  // 캐릭터 생성 폼
  if (view === "create") {
    return (
      <CharacterForm
        mode="create"
        settings={settings as CharacterSettingsResDto | null}
        isSaving={isCreating}
        error={createError}
        onBack={() => {
          setEditingCharacterId(null);
          setView("dashboard");
        }}
        onSave={handleCreate}
      />
    );
  }

  // 캐릭터 수정 폼
  if (view === "edit" && selectedCharacter) {
    return (
      <CharacterForm
        mode="edit"
        initialData={selectedCharacter}
        settings={settings as CharacterSettingsResDto | null}
        isSaving={isUpdating}
        error={updateError}
        onBack={() => {
          setEditingCharacterId(null);
          setView("dashboard");
        }}
        onSave={handleUpdate}
      />
    );
  }

  // 캐릭터 목록 대시보드
  return (
    <>
      {pageNotice && (
        <InlineNotice
          tone={pageNotice.tone}
          message={pageNotice.message}
          onClose={() => setPageNotice(null)}
        />
      )}

      <CharacterDashboard
        characters={characters}
        selectedId={selectedCharacterId ? String(selectedCharacterId) : null}
        isSelecting={isSelecting}
        isDeleting={isDeleting}
        isLoading={isLoadingCharacters}
        error={charactersError}
        broadcastingId={broadcastingId}
        onCreateClick={() => {
          if (apiCharacters.length >= MAX_CHARACTERS_PER_USER) {
            setPageNotice({
              tone: "info",
              message: `AI 캐릭터는 최대 ${MAX_CHARACTERS_PER_USER}개까지 생성할 수 있습니다.`,
            });
            return;
          }
          setEditingCharacterId(null);
          setView("create");
        }}
        onEditClick={(id) => {
          // 수정 전 해당 캐릭터를 선택 상태로 설정
          const cid = Number(id);
          setEditingCharacterId(cid);
          void select(cid, true);
          setView("edit");
        }}
        onDeleteClick={(id) => {
          void handleDelete(id);
        }}
        onSelectClick={(id) => {
          const cid = Number(id);
          const isCurrentlySelected = selectedCharacterId === cid;
          void select(cid, !isCurrentlySelected);
        }}
        onBroadcastClick={handleBroadcastStart}
        onStopBroadcastClick={handleBroadcastStop}
      />

      {pendingBroadcastId && (
        <BroadcastConfirmModal
          characterName={pendingCharacterName}
          onConfirm={handleBroadcastConfirm}
          onCancel={handleBroadcastCancel}
        />
      )}

      {obsGatePending !== null && (
        <ObsGateModal
          obsStatus={obsStatus}
          obsError={obsError}
          obsDiagnostics={obsDiagnostics}
          overlayUrl={overlayUrl}
          onRetry={handleObsRetry}
          onConfirmManualReady={handleObsGateManualConfirm}
          onForceStart={handleObsGateForceStart}
          onCancel={handleObsGateCancel}
        />
      )}

      {chzzkGateMode && (
        <ChzzkConnectModal
          mode={chzzkGateMode}
          authUrlOverride={chzzkGateMode === "gate-expired" ? chzzkAuthUrl ?? undefined : undefined}
          onSuccess={handleChzzkGateSuccess}
          onCancel={handleChzzkGateCancel}
        />
      )}
     </>
   );
}

function InlineNotice({
  tone,
  message,
  onClose,
}: {
  tone: "error" | "info";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`mb-4 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
        tone === "error"
          ? "border-status-danger/30 bg-status-danger/10 text-status-danger"
          : "border-brand/30 bg-brand/10 text-brand"
      }`}
      role="alert"
    >
      <p className="leading-6">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-current transition-colors hover:bg-current/10"
      >
        닫기
      </button>
    </div>
  );
}
