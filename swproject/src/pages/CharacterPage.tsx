/**
 * @file 캐릭터 관리 페이지
 * @created Sprint 3 - Character UI 이식 및 페이지 연동
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/hooks/index.ts
 * @dependsOn src/features/character/components/index.ts
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
import { CharacterDashboard, CharacterForm } from "@/features/character/components";
import { useCharacterStore } from "@/shared/stores/characterStore";
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
    case "gaming": return "ROLEPLAY_EXPERT";
    case "entertainment": return "HIGH_TENSION";
    case "focused": return "PROFESSIONAL_MANAGER";
    case "chatty": return "FRIENDLY_CHATTER";
    default: return "CUSTOM";
  }
}

function mapUiGenderToBackend(g: "male" | "female"): Gender {
  return g === "male" ? "MALE" : "FEMALE";
}

/** CharacterConfig → CharacterCreateReqDto */
function toBackendCreatePayload(config: CharacterConfig): CharacterCreateReqDto {
  return {
    characterName: config.name.trim() || "새 AI 캐릭터",
    triggerWords: config.callWords.length > 0 ? [...config.callWords] : [config.name.trim() || "AI"],
    gender: mapUiGenderToBackend(config.gender),
    voiceTypeId: config.voiceId ? Number(config.voiceId) : 1,
    characterImageId: config.model2D.presetId ? Number(config.model2D.presetId) : 1,
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
    voiceTypeId: config.voiceId ? Number(config.voiceId) : 1,
    characterImageId: config.model2D.presetId ? Number(config.model2D.presetId) : 1,
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
    case "FRIENDLY_CHATTER": return "chat_social";
    case "HIGH_TENSION": return "humor_entertainment";
    case "PLAYFUL_TEASER": return "humor_entertainment";
    case "PROFESSIONAL_MANAGER": return "focused_serious";
    case "ROLEPLAY_EXPERT": return "game_specialist";
    default: return "game_specialist";
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
      voicePresetId: String(item.voiceTypeId),
      speechStyle: "friendly_informal",
      personality: "energetic",
      persona: "game_specialist", // 목록 API는 persona 미포함, 기본값 사용
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
      voicePresetId: String(detail.voiceTypeId),
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
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);

  const { characters: apiCharacters, refetch, isLoading: isLoadingCharacters, error: charactersError } = useCharacters();
  const { character: apiCharacter } = useCharacter(view === "edit" && selectedCharacterId ? selectedCharacterId : null);
  const { settings } = useCharacterSettings(view === "create" || view === "edit");
  const { create, isPending: isCreating } = useCreateCharacter();
  const { update, isPending: isUpdating } = useUpdateCharacter();
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

  useEffect(() => {
    if (!selectedCharacterId && characters.length > 0) {
      const firstId = Number(characters[0].id);
      void select(firstId, true);
    }
  }, [selectedCharacterId, characters, select]);

  const handleCreate = useCallback(
    async (config: CharacterConfig) => {
      const payload = toBackendCreatePayload(config);
      const created = await create(payload);
      if (created) {
        await refetch(); // 목록 새로고침: 생성된 캐릭터 포함 전체 목록 재조회
        await select(created.characterId, true);
        setView("dashboard");
      }
    },
    [create, select, refetch]
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

  // === 뷰 전환 로직 ===

  // 캐릭터 생성 폼
  if (view === "create") {
    return (
      <CharacterForm
        mode="create"
        settings={settings as CharacterSettingsResDto | null}
        isSaving={isCreating}
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
        onBack={() => setView("dashboard")}
        onSave={handleUpdate}
      />
    );
  }

  // 캐릭터 목록 대시보드
  return (
    <CharacterDashboard
      characters={characters}
      selectedId={selectedCharacterId ? String(selectedCharacterId) : null}
      isSelecting={isSelecting}
      isDeleting={isDeleting}
      isLoading={isLoadingCharacters}
      error={charactersError}
      onCreateClick={() => setView("create")}
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
      onViewDetails={(id) => {
        // 상세보기: 해당 캐릭터 선택 후 대시보드에 표시
        const cid = Number(id);
        void select(cid, true);
      }}
    />
  );
}
