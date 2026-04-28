/**
 * @file 캐릭터 관리 페이지
 * @created Sprint 3 - Character UI 이식 및 페이지 연동
 * @updated Backend Swagger spec alignment
 * @updated Sprint 4 - 방송 시작 동의 모달 + 방송 상태(aiMode) 연동, 캐릭터 10개 한도 가드
 * @dependsOn src/features/character/hooks/index.ts
 * @dependsOn src/features/character/components/index.ts
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
import { useCharacterStore } from "@/shared/stores/characterStore";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { MAX_CHARACTERS_PER_USER } from "@/shared/constants/character";
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

/** 방송 시작 시 사용자가 "다시 받지 않기"를 체크한 경우 저장되는 localStorage 키 */
const BROADCAST_NOTICE_SKIP_KEY = "broadcast-notice-skip";

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
  return {
    characterName: config.name.trim() || "새 AI 캐릭터",
    triggerWords: config.callWords.length > 0 ? [...config.callWords] : [config.name.trim() || "AI"],
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
  return {
    characterName: config.name.trim() || "새 AI 캐릭터",
    triggerWords: config.callWords.length > 0 ? [...config.callWords] : [config.name.trim() || "AI"],
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
    default: return "neighbor";
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
  return {
    id: String(item.characterId),
    name: item.characterName,
    info: {
      gender: item.gender === "MALE" ? "male" : "female",
      name: item.characterName,
      callSign: (item.triggerWords ?? []).join(", ") || "AI",
      appearancePresetId: "",
      imageUrl: item.characterImageUrl,
      voicePresetId: safeIdToString(item.voiceTypeId),
      speechStyle: "friendly_informal",
      personality: "energetic",
      persona: "neighbor", // 목록 API는 persona 미포함, 기본값 사용
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
function detailToPreset(detail: CharacterDetailResDto): CharacterPreset {
  const persona = detail.characterPersona;
  return {
    id: String(detail.characterId),
    name: detail.characterName,
    info: {
      gender: detail.gender === "MALE" ? "male" : "female",
      name: detail.characterName,
      callSign: detail.triggerWords[0] ?? "AI",
      appearancePresetId: "",
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
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const aiMode = useAIModeStore((s) => s.mode);
  const setAIMode = useAIModeStore((s) => s.setMode);

  // 방송 중 캐릭터 ID는 별도 저장하지 않고 aiModeStore.mode + 선택된 캐릭터로 도출
  // - 단일 진실 원천(single source of truth)으로 두 store 동기화 비용 제거
  // - 방송 중에는 다른 캐릭터 선택을 막으므로 selectedCharacterId 가 곧 방송 주체와 일치
  const broadcastingId = aiMode === "broadcasting" && selectedCharacterId
    ? String(selectedCharacterId)
    : null;

  const { characters: apiCharacters, refetch, isLoading: isLoadingCharacters, error: charactersError } = useCharacters();
  const { character: apiCharacter } = useCharacter(view === "edit" && selectedCharacterId ? selectedCharacterId : null);
  const { settings } = useCharacterSettings(view === "create" || view === "edit");
  const { create, isPending: isCreating, error: createError } = useCreateCharacter();
  const { update, isPending: isUpdating, error: updateError } = useUpdateCharacter();
  const { remove, isPending: isDeleting } = useDeleteCharacter();
  const { select, isPending: isSelecting } = useSelectCharacter();

  // API 응답을 UI CharacterPreset으로 변환
  const characters = useMemo(
    () => apiCharacters.map(toCharacterPreset),
    [apiCharacters]
  );

  const selectedCharacter = useMemo<CharacterPreset | null>(() => {
    if (apiCharacter) {
      return detailToPreset(apiCharacter);
    }
    if (!selectedCharacterId) {
      return null;
    }
    return characters.find((item) => item.id === String(selectedCharacterId)) ?? null;
  }, [apiCharacter, characters, selectedCharacterId]);

  // 첫 캐릭터 자동 선택: selectedCharacterId가 비어있고 목록이 존재할 때만 한 번 수행
  // (characters 참조가 매 렌더마다 바뀌므로, 의존성에서 제외해 루프 방지)
  useEffect(() => {
    if (selectedCharacterId || apiCharacters.length === 0) return;
    const firstId = apiCharacters[0].characterId;
    void select(firstId, true);
  }, [selectedCharacterId, apiCharacters, select]);

  const handleCreate = useCallback(
    async (config: CharacterConfig) => {
      // 방어 체크: 대시보드 버튼이 비활성화되어 있어도, 직접 view 전환 등으로 우회될 수 있어 한 번 더 검증
      if (apiCharacters.length >= MAX_CHARACTERS_PER_USER) {
        window.alert(`AI 캐릭터는 최대 ${MAX_CHARACTERS_PER_USER}개까지 생성할 수 있습니다.`);
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
      if (!selectedCharacterId) {
        return;
      }
      const payload = toBackendUpdatePayload(config);
      const updated = await update(selectedCharacterId, payload);
      if (updated) {
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
   * 방송 시작 버튼 클릭 핸들러
   * 동작 순서:
   *   1) 이미 방송 중이면 무시 (UI에서도 비활성화되지만 이중 방어)
   *   2) 클릭한 캐릭터가 현재 선택된 캐릭터와 다르면 먼저 선택 처리 (broadcastingId 일관성 보장)
   *   3) "다시 받지 않기"가 저장돼 있으면 모달 스킵하고 즉시 방송 시작
   *      그렇지 않으면 동의 모달을 띄움 (pendingBroadcastId 설정)
   */
  const handleBroadcastStart = useCallback(
    (characterId: string) => {
      if (aiMode === "broadcasting") return;

      // localStorage 접근은 시크릿 모드 등에서 throw 할 수 있으므로 try/catch
      const skipNotice = (() => {
        try {
          return localStorage.getItem(BROADCAST_NOTICE_SKIP_KEY) === "true";
        } catch {
          return false;
        }
      })();

      // 다른 카드의 방송 시작 버튼을 눌렀을 수도 있으므로 해당 캐릭터를 선택 상태로 정렬
      const cid = Number(characterId);
      if (selectedCharacterId !== cid) {
        void select(cid, true);
      }

      if (skipNotice) {
        setAIMode("broadcasting");
      } else {
        setPendingBroadcastId(characterId);
      }
    },
    [aiMode, select, selectedCharacterId, setAIMode]
  );

  /** 모달에서 시작 버튼 확정 */
  const handleBroadcastConfirm = useCallback(
    (dontShowAgain: boolean) => {
      if (dontShowAgain) {
        try {
          localStorage.setItem(BROADCAST_NOTICE_SKIP_KEY, "true");
        } catch {
          // localStorage 사용 불가 환경(시크릿 모드 등)에서는 무시
        }
      }
      setPendingBroadcastId(null);
      setAIMode("broadcasting");
    },
    [setAIMode]
  );

  /** 모달 취소 */
  const handleBroadcastCancel = useCallback(() => {
    setPendingBroadcastId(null);
  }, []);

  /** 방송 종료 */
  const handleBroadcastStop = useCallback(() => {
    setAIMode("idle");
  }, [setAIMode]);

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
            window.alert(`AI 캐릭터는 최대 ${MAX_CHARACTERS_PER_USER}개까지 생성할 수 있습니다.`);
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
        onViewDetails={(id) => {
          // 상세보기: 해당 캐릭터 선택 후 대시보드에 표시
          const cid = Number(id);
          void select(cid, true);
        }}
      />

      {pendingBroadcastId && (
        <BroadcastConfirmModal
          characterName={pendingCharacterName}
          onConfirm={handleBroadcastConfirm}
          onCancel={handleBroadcastCancel}
        />
      )}
    </>
  );
}
