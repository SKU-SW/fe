/**
 * @file 캐릭터 관리 페이지
 * @created Sprint 3 - Character UI 이식 및 페이지 연동
 * @updated Backend Swagger spec alignment
 * @updated Sprint 4 - 방송 시작 동의 모달 + 방송 상태(aiMode) 연동, 캐릭터 10개 한도 가드
 * @updated 방송 시작/종료를 백엔드 API(/stream/start, /stream/terminate)와 연결
 * @updated OBS 준비 체크리스트 패널 추가
 * @dependsOn src/features/character/hooks/index.ts
 * @dependsOn src/features/character/components/index.ts
 * @dependsOn src/features/broadcast/hooks (useStartBroadcast, useTerminateBroadcast, useObsLaunch)
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
import { getTriggerWordsValidationError, normalizeTriggerWords } from "@/features/character/lib/triggerWords";
import { useBroadcastNoticeStore } from "@/shared/stores/broadcastNoticeStore";
import { useCharacterStore } from "@/shared/stores/characterStore";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useOverlayStore } from "@/shared/stores/overlayStore";
import { MAX_CHARACTERS_PER_USER } from "@/shared/constants/character";
import { resolveAssetUrl } from "@/shared/lib/utils";
import type {
  CharacterConfig,
  CharacterFormSpeechStyle,
  CharacterPreset,
  CharacterListItemResDto,
  CharacterDetailResDto,
  CharacterCreateReqDto,
  CharacterUpdateReqDto,
  CharacterSettingsResDto,
  Persona,
  SpeechStyle,
  Personality,
  PresetType,
  Gender,
  BroadcastPreset,
} from "@/shared/types/character";

type CharacterView = "dashboard" | "create" | "edit";

// ============================================================
// UI 매핑 함수들 (CharacterConfig → Backend DTO)
// ============================================================

function mapUiSpeechStyleToBackend(style: CharacterFormSpeechStyle): SpeechStyle {
  switch (style) {
    case "casual": return "FRIENDLY_INFORMAL";
    case "polite": return "POLITE_FORMAL";
    case "playful": return "PLAYFUL_INFORMAL";
    case "dramatic": return "BROADCAST_EXAGGERATED";
  }
}

function mapUiPersonalityToBackend(p: "energetic" | "calm" | "humorous" | "serious"): Personality {
  switch (p) {
    case "energetic": return "ACTIVE";
    case "calm": return "CALM";
    case "humorous": return "HUMOROUS";
    case "serious": return "SERIOUS";
  }
}

function mapBroadcastPresetToPresetType(preset: BroadcastPreset | null): PresetType {
  switch (preset) {
    case "neighbor": return "FRIENDLY_CHATTER";
    case "high_tension": return "HIGH_TENSION";
    case "teaser": return "PLAYFUL_TEASER";
    case "manager": return "PROFESSIONAL_MANAGER";
    case "immersive": return "ROLEPLAY_EXPERT";
    case "custom": return "CUSTOM";
    default: return "CUSTOM";
  }
}

function mapUiGenderToBackend(g: "male" | "female"): Gender {
  return g === "male" ? "MALE" : "FEMALE";
}

/**
 * 문자열을 양의 정수로 안전 변환
 * - "1", "2" 등 숫자 문자열 → 숫자
 * - "undefined", "null", "" 등 비숫자 → fallback
 * - NaN/0/음수 → fallback
 */
function toPositiveIntOrFallback(value: string | undefined | null, fallback: number): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** CharacterConfig → CharacterCreateReqDto */
function toBackendCreatePayload(config: CharacterConfig): CharacterCreateReqDto {
  const triggerWords = normalizeTriggerWords(config.callWords);
  return {
    characterName: config.name.trim() || "새 AI 캐릭터",
    triggerWords,
    gender: mapUiGenderToBackend(config.gender),
    voiceTypeId: toPositiveIntOrFallback(config.voiceId, 1),
    characterImageId: toPositiveIntOrFallback(config.model2D.presetId, 1),
    characterPersona: {
      presetType: mapBroadcastPresetToPresetType(config.broadcastPreset),
      speechStyle: mapUiSpeechStyleToBackend(config.speechStyle),
      personality: mapUiPersonalityToBackend(config.personality),
    },
  };
}

/** CharacterConfig → CharacterUpdateReqDto */
function toBackendUpdatePayload(config: CharacterConfig): CharacterUpdateReqDto {
  const triggerWords = normalizeTriggerWords(config.callWords);
  return {
    characterName: config.name.trim() || "새 AI 캐릭터",
    triggerWords,
    gender: mapUiGenderToBackend(config.gender),
    voiceTypeId: toPositiveIntOrFallback(config.voiceId, 1),
    characterImageId: toPositiveIntOrFallback(config.model2D.presetId, 1),
    characterPersona: {
      presetType: mapBroadcastPresetToPresetType(config.broadcastPreset),
      speechStyle: mapUiSpeechStyleToBackend(config.speechStyle),
      personality: mapUiPersonalityToBackend(config.personality),
    },
  };
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
    case "CUSTOM": return "custom";
    default: return "custom";
  }
}

function mapBackendSpeechStyleToUi(style: SpeechStyle): CharacterPreset["info"]["speechStyle"] {
  switch (style) {
    case "FRIENDLY_INFORMAL": return "friendly_informal";
    case "POLITE_FORMAL": return "polite_formal";
    case "PLAYFUL_INFORMAL": return "playful_informal";
    case "BROADCAST_EXAGGERATED": return "broadcast_exaggerated";
  }
}

function mapBackendPersonalityToUi(p: Personality): CharacterPreset["info"]["personality"] {
  switch (p) {
    case "ACTIVE": return "energetic";
    case "CALM": return "calm";
    case "HUMOROUS": return "humorous";
    case "SERIOUS": return "serious";
  }
}

/** number를 안전하게 문자열로 변환 (null/undefined → 빈 문자열) */
function safeIdToString(value: number | null | undefined): string {
  return value != null && Number.isFinite(value) ? String(value) : "";
}

/** UI CharacterPreset으로 변환 (목록 표시용) */
function toCharacterPreset(item: CharacterListItemResDto): CharacterPreset {
  // 원본 배열 — triggerWords 로 보존하여 수정/저장 시 손실 방지
  const triggerWords = normalizeTriggerWords(item.triggerWords);
  const persona = item.characterPersona;
  return {
    id: String(item.characterId),
    name: item.characterName,
    info: {
      gender: item.gender === "MALE" ? "male" : "female",
      name: item.characterName,
      // callSign 은 표시용 합본. 원본은 triggerWords 에서 가져갈 것
      callSign: triggerWords.join(", ") || "AI",
      triggerWords,
      appearancePresetId: "",
      imageUrl: item.characterImageUrl,
      voicePresetId: safeIdToString(item.voiceTypeId),
      speechStyle: persona ? mapBackendSpeechStyleToUi(persona.speechStyle) : "friendly_informal",
      personality: persona ? mapBackendPersonalityToUi(persona.personality) : "energetic",
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
  const detailImageUrl = resolveAssetUrl(detail.characterImageUrl);
  const matchedImage = settings?.characterImages.find((image) => {
    const imageUrl = resolveAssetUrl(image.imageUrl1 ?? image.imageUrl);
    return imageUrl === detailImageUrl;
  });
  return {
    id: String(detail.characterId),
    name: detail.characterName,
    info: {
      gender: detail.gender === "MALE" ? "male" : "female",
      name: detail.characterName,
      callSign: triggerWords.join(", ") || "AI",
      triggerWords,
      appearancePresetId: matchedImage ? String(matchedImage.imageId) : "",
      imageUrl: detail.characterImageUrl,
      voicePresetId: safeIdToString(detail.voiceTypeId),
      speechStyle: mapBackendSpeechStyleToUi(persona.speechStyle),
      personality: mapBackendPersonalityToUi(persona.personality),
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
  const [pendingBroadcastId, setPendingBroadcastId] = useState<string | null>(null);
  const [obsGatePending, setObsGatePending] = useState<number | null>(null);
  const [recentlyUpdatedCharacter, setRecentlyUpdatedCharacter] = useState<CharacterDetailResDto | null>(null);
  const [pageNotice, setPageNotice] = useState<{ tone: "error" | "info"; message: string } | null>(null);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const shouldSkipBroadcastNotice = useBroadcastNoticeStore((s) => s.shouldSkipNotice);
  const skipNoticeForCharacter = useBroadcastNoticeStore((s) => s.skipNoticeForCharacter);
  const aiMode = useAIModeStore((s) => s.mode);
  const updateOverlayRuntime = useOverlayStore((s) => s.updateRuntime);
  const clearOverlayRuntime = useOverlayStore((s) => s.clearRuntime);
  const storedSelectedCharacter = useCharacterStore((s) => s.selectedCharacter);

  // 방송 중 캐릭터 ID는 별도 저장하지 않고 aiModeStore.mode + 선택된 캐릭터로 도출
  // - 단일 진실 원천(single source of truth)으로 두 store 동기화 비용 제거
  // - 방송 중에는 다른 캐릭터 선택을 막으므로 selectedCharacterId 가 곧 방송 주체와 일치
  const broadcastingId = aiMode === "broadcasting" && selectedCharacterId
    ? String(selectedCharacterId)
    : null;

  const { characters: apiCharacters, refetch, isLoading: isLoadingCharacters, error: charactersError } = useCharacters();
  const { character: apiCharacter } = useCharacter(view === "edit" && selectedCharacterId ? selectedCharacterId : null);
  const { settings } = useCharacterSettings(true);
  const { create, isPending: isCreating, error: createError } = useCreateCharacter();
  const { update, isPending: isUpdating, error: updateError } = useUpdateCharacter();
  const { remove, isPending: isDeleting } = useDeleteCharacter();
  const { select, isPending: isSelecting } = useSelectCharacter();
  const { start: startBroadcastApi, isPending: isStartingBroadcast, error: startBroadcastError } = useStartBroadcast();
  const { terminate: terminateBroadcastApi, isPending: isTerminatingBroadcast, error: terminateBroadcastError } = useTerminateBroadcast();
  const { obsStatus, obsError, obsDiagnostics, launchObs, resetObsStatus } = useObsLaunch();
  const overlayUrl = useMemo(() => {
    if (import.meta.env.DEV) return "http://localhost:5173/#/overlay";
    return "http://127.0.0.1:5174/#/overlay";
  }, []);

  useEffect(() => {
    if (startBroadcastError) {
      setPageNotice({ tone: "error", message: startBroadcastError });
    }
  }, [startBroadcastError]);
  useEffect(() => {
    if (terminateBroadcastError) {
      setPageNotice({ tone: "error", message: terminateBroadcastError });
    }
  }, [terminateBroadcastError]);
  // API 응답을 UI CharacterPreset으로 변환
  const characters = useMemo(
    () => apiCharacters.map((item) => {
      if (storedSelectedCharacter && storedSelectedCharacter.characterId === item.characterId) {
        return detailToPreset(storedSelectedCharacter, settings as CharacterSettingsResDto | null);
      }
      return toCharacterPreset(item);
    }),
    [apiCharacters, settings, storedSelectedCharacter]
  );

  const selectedCharacter = useMemo<CharacterPreset | null>(() => {
    if (recentlyUpdatedCharacter && selectedCharacterId === recentlyUpdatedCharacter.characterId) {
      return detailToPreset(recentlyUpdatedCharacter, settings as CharacterSettingsResDto | null);
    }
    if (apiCharacter) {
      return detailToPreset(apiCharacter, settings as CharacterSettingsResDto | null);
    }
    if (!selectedCharacterId) {
      return null;
    }
    return characters.find((item) => item.id === String(selectedCharacterId)) ?? null;
  }, [apiCharacter, characters, recentlyUpdatedCharacter, selectedCharacterId, settings]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log('[CharacterPage] selectedCharacter render source:', {
      selectedCharacterId,
      recentlyUpdatedCharacter: recentlyUpdatedCharacter
        ? {
            characterId: recentlyUpdatedCharacter.characterId,
            characterPersona: recentlyUpdatedCharacter.characterPersona,
          }
        : null,
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
  }, [apiCharacter, recentlyUpdatedCharacter, selectedCharacter, selectedCharacterId]);

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
      const payload = toBackendCreatePayload(config);
      const created = await create(payload);
      if (created) {
        await refetch(); // 목록 새로고침: 생성된 캐릭터 포함 전체 목록 재조회
        await select(created.characterId, true);
        setView("dashboard");
      }
    },
    [apiCharacters.length, create, select, refetch]
  );

  const handleUpdate = useCallback(
    async (config: CharacterConfig) => {
      const triggerWordsError = getTriggerWordsValidationError(normalizeTriggerWords(config.callWords));
      if (triggerWordsError) {
        setPageNotice({ tone: "error", message: triggerWordsError });
        return;
      }
      if (!selectedCharacterId) {
        return;
      }
      const payload = toBackendUpdatePayload(config);
      const updated = await update(selectedCharacterId, payload);
      if (updated) {
        setRecentlyUpdatedCharacter(updated);
        await refetch(); // 수정 후 목록 새로고침
        setView("dashboard");
      }
    },
    [selectedCharacterId, update, refetch]
  );

  const handleDelete = useCallback(
    async (characterId: string) => {
      const id = Number(characterId);
      const deleted = await remove(id);
      if (deleted) {
        await refetch();
      }
    },
    [remove, refetch]
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
       await select(cid, true);
       const started = await startBroadcastApi(cid);
       if (!started) return;

       const broadcastCharacter = apiCharacters.find((item) => item.characterId === cid);
       const overlayUpdate = {
         isBroadcasting: true,
         broadcastStreamId: started.broadcastStreamId,
         characterName: broadcastCharacter?.characterName ?? "AI",
         characterImageUrl: resolveAssetUrl(broadcastCharacter?.characterImageUrl),
         transcript: "",
         emotion: "default" as const,
       };
       console.log("[CharacterPage] Broadcasting started, updating overlay runtime:", overlayUpdate);
       updateOverlayRuntime(overlayUpdate);
     },
     [apiCharacters, select, startBroadcastApi, updateOverlayRuntime]
   );

  const enterObsGate = useCallback((cid: number) => {
    void select(cid, true);
    setObsGatePending(cid);
    void launchObs(overlayUrl);
  }, [launchObs, overlayUrl, select]);

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
        enterObsGate(cid);
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

  /** 모달에서 시작 버튼 확정 */
  const handleBroadcastConfirm = useCallback(
    async (dontShowAgain: boolean) => {
      if (!pendingBroadcastId) return;
      if (dontShowAgain) {
        skipNoticeForCharacter(pendingBroadcastId);
      }
      const cid = Number(pendingBroadcastId);
      setPendingBroadcastId(null);
      enterObsGate(cid);
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
        onBack={() => setView("dashboard")}
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
        onBack={() => setView("dashboard")}
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
          setView("create");
        }}
        onEditClick={(id) => {
          // 수정 전 해당 캐릭터를 선택 상태로 설정
          const cid = Number(id);
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
          ? "border-discord-danger/30 bg-discord-danger/10 text-discord-danger"
          : "border-discord-blurple/30 bg-discord-blurple/10 text-discord-blurple"
      }`}
      role="alert"
    >
      <p className="leading-6">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-current transition-colors hover:bg-white/10"
      >
        닫기
      </button>
    </div>
  );
}
