/**
 * @file 캐릭터(Character) 관련 타입 정의
 * @created Sprint 1 - Character 타입 정의
 * @updated Backend Swagger spec alignment
 * @dependsOn 없음 (순수 타입 정의)
 * @usedBy src/features/character/api/characterApi.ts
 * @usedBy src/shared/stores/characterStore.ts
 */

// ============================================================
// Backend API Types (UPPER_SNAKE_CASE - Swagger spec)
// ============================================================

/**
 * 캐릭터 성별 (backend)
 */
export type Gender = "MALE" | "FEMALE";

/**
 * 캐릭터 모델 타입 — 프론트 UI 친화형 ("2D" / "3D")
 * 백엔드 스웨거는 `characterAppearanceType: "TWO_D" | "THREE_D"` 를 사용.
 * 변환은 toBackendAppearance / fromBackendAppearance 헬퍼로 처리.
 */
export type CharacterModelType = "2D" | "3D";

/**
 * 캐릭터 외형 타입 (백엔드 raw enum) — Swagger CharacterAppearanceType
 */
export type CharacterAppearanceType = "TWO_D" | "THREE_D";

/** UI ("2D"|"3D") → 백엔드 ("TWO_D"|"THREE_D") */
export function toBackendAppearance(m: CharacterModelType): CharacterAppearanceType {
  return m === "3D" ? "THREE_D" : "TWO_D";
}

/** 백엔드 → UI */
export function fromBackendAppearance(
  a: CharacterAppearanceType | undefined,
): CharacterModelType {
  return a === "THREE_D" ? "3D" : "2D";
}

/**
 * 프리셋 타입 (backend)
 */
export type PresetType =
  | "FRIENDLY_CHATTER"
  | "HIGH_TENSION"
  | "PLAYFUL_TEASER"
  | "PROFESSIONAL_MANAGER"
  | "ROLEPLAY_EXPERT";

/**
 * 말투 스타일 (backend)
 */
export type SpeechStyle =
  | "FRIENDLY_INFORMAL"
  | "POLITE_FORMAL"
  | "PLAYFUL_INFORMAL"
  | "BROADCAST_EXAGGERATED";

/**
 * 성격 타입 (backend)
 */
export type Personality = "ACTIVE" | "CALM" | "HUMOROUS" | "SERIOUS";

/**
 * 연령대 (backend)
 */
export type AgeGroup = "SENIOR" | "MIDDLE_AGED" | "YOUNG_ADULT" | "TEENAGER";

// ============================================================
// Persona (공통)
// ============================================================

/**
 * 캐릭터 페르소나 요청
 */
export interface CharacterPersonaReqDto {
  presetType: PresetType;
}

/**
 * 캐릭터 페르소나 응답
 */
export interface CharacterPersonaResDto {
  presetType: PresetType;
}

// ============================================================
// Character Detail / List
// ============================================================

/**
 * 캐릭터 상세 응답
 * - backend CharacterDetailResDto 매칭
 */
export interface CharacterDetailResDto {
  characterId: number;
  characterName: string;
  triggerWords: string[];
  gender: Gender;
  characterImageUrl: string | null;
  characterPersona: CharacterPersonaResDto;
  isSelected: boolean;

  // 백엔드가 추가로 줄 수 있는 필드 (optional). 현재 Swagger 응답엔 미포함.
  characterAppearanceType?: CharacterAppearanceType;
  characterImageId?: number | null;
  vrmPresetId?: number | null;
  vrmUrl?: string | null;
  vrmThumbnailUrl?: string | null;

  /** API 어댑터에서 characterAppearanceType 기반으로 채움 (UI 친화형) */
  modelType?: CharacterModelType;
}

/**
 * 캐릭터 목록 항목 응답
 */
export interface CharacterListItemResDto {
  characterId: number;
  characterName: string;
  triggerWords: string[];
  gender: Gender;
  characterImageUrl: string | null;
  characterPersona?: CharacterPersonaResDto;
  isSelected: boolean;

  // 백엔드 향후 확장 (optional)
  characterAppearanceType?: CharacterAppearanceType;
  characterImageId?: number | null;
  vrmPresetId?: number | null;
  vrmUrl?: string | null;
  vrmThumbnailUrl?: string | null;

  /** API 어댑터에서 채움 (UI 친화형) */
  modelType?: CharacterModelType;
}

// ============================================================
// SliceResponse (페이지네이션)
// ============================================================

/**
 * 슬라이스 페이지네이션 응답
 */
export interface SliceResponse<T> {
  content: T[];
  page: number;
  size: number;
  hasNext: boolean;
}

// ============================================================
// Character Create / Update
// ============================================================

/**
 * 캐릭터 생성 요청 — 백엔드 Swagger CharacterCreateReqDto 와 1:1.
 * - characterAppearanceType: TWO_D | THREE_D
 * - targetId: 2D 면 imageId, 3D 면 characterVrmId 를 통합 송신
 */
export interface CharacterCreateReqDto {
  characterAppearanceType: CharacterAppearanceType;
  characterName: string;
  triggerWords: string[];
  gender: Gender;
  targetId: number;
  characterPersona: CharacterPersonaReqDto;
}

/**
 * 캐릭터 수정 요청 — 생성과 동일 스키마
 */
export type CharacterUpdateReqDto = CharacterCreateReqDto;

// ============================================================
// Character Select
// ============================================================

/**
 * 캐릭터 선택 요청
 */
export interface CharacterSelectReqDto {
  isSelected: boolean;
}

/**
 * 캐릭터 선택 응답
 */
export interface CharacterSelectResDto {
  selectedCharacterId: number;
  deselectedCharacterId: number | null;
}

// ============================================================
// Character Settings
// ============================================================

/**
 * 캐릭터 이미지 응답
 *
 * Phase 2 (감정별 이미지) — BE 확장 대기 중:
 *   - 현재 스키마: imageUrl (단일) — DEFAULT 감정에 매핑.
 *   - 향후 BE 가 노출할 가능성 있는 형태:
 *       a) imageUrlHappy / imageUrlAngry / ... (감정별 필드 추가)
 *       b) emotionImages: Record<StreamEmotion, string>
 *       c) 별도 엔드포인트 GET /character/{id}/emotion-images
 *   - 확정되면 이 인터페이스에 optional 필드를 추가하고 OverlayRuntimeState.emotionImageMap 에 어댑팅.
 */
export interface CharacterImageResDto {
  imageId: number;
  gender: Gender;
  name: string;
  imageUrl: string;
  // === Phase 2 placeholder (BE 확장 시 활성화) ===
  // imageUrlHappy?: string;
  // imageUrlAngry?: string;
  // imageUrlTired?: string;
  // imageUrlSad?: string;
  // imageUrlFear?: string;
  // imageUrlTalking?: string;
  // 또는 통합 맵:
  // emotionImages?: Partial<Record<StreamEmotion, string>>;
}

/**
 * 3D VRM 프리셋 응답
 * 백엔드 Swagger 의 CharacterVrmResDto 는 { characterVrmId, vrmUrl } 만 줌.
 * gender / name / thumbnailUrl 은 백엔드 확장 시 채워지는 optional.
 * presetId 는 프론트 어댑터에서 characterVrmId 와 동기화되는 alias.
 */
export interface VrmPresetResDto {
  /** 백엔드 raw 식별자 */
  characterVrmId: number;
  vrmUrl: string;

  // 백엔드 확장 대기 (현재 응답엔 없음)
  gender?: Gender;
  name?: string;
  thumbnailUrl?: string;

  /** 프론트 alias — 어댑터가 characterVrmId 와 동기화 */
  presetId?: number;
}

/**
 * 캐릭터 설정 옵션 응답
 * - backend CharacterSettingsResDto 매칭 (personaPresetTypes)
 * - 프론트는 presetTypes / availableModelTypes alias 도 추가로 채움
 */
export interface CharacterSettingsResDto {
  characterImages: CharacterImageResDto[];
  vrmPresets?: VrmPresetResDto[];

  /** 백엔드 raw 필드 */
  personaPresetTypes?: PresetType[];

  /** 프론트 alias (어댑터가 personaPresetTypes 와 동기화) */
  presetTypes?: PresetType[];

  /** 프론트 추정 (vrmPresets 유무 기반) */
  availableModelTypes?: CharacterModelType[];
}

// ============================================================
// UI-Internal Types (폼 상태 및 컴포넌트 전용)
// ============================================================

/**
 * UI 전용 성별 (lowercase - 폼 내부 사용)
 */
export type UiGender = "male" | "female";

/**
 * UI 전용 말투 스타일 (폼 내부 사용)
 */
export type UiSpeechStyle =
  | "friendly_informal"
  | "polite_formal"
  | "playful_informal"
  | "broadcast_exaggerated";

/**
 * UI 전용 성격 타입 (폼 내부 사용)
 */
export type UiPersonality = "energetic" | "calm" | "humorous" | "serious";

/**
 * 페르소나 (UI 전용) - BroadcastPreset과 1:1 매핑 (5개 페르소나 프리셋 카드)
 */
export type Persona =
  | "neighbor"
  | "high_tension"
  | "teaser"
  | "manager"
  | "immersive"
  | "custom";

/**
 * 채팅 민감도 레벨 (UI 전용)
 */
export type SensitivityLevel = "high" | "medium" | "low";

/**
 * 캐릭터 기본 정보 (UI 내부용)
 */
export interface CharacterInfo {
  modelType: CharacterModelType;
  gender: UiGender;
  name: string;
  /** 표시용 호출어 합본 문자열 (예: "강희야, 야, 친구야"). 입력/저장 용도로 쓰지 말 것 — triggerWords 사용 */
  callSign: string;
  /** 호출어 원본 배열 (BE triggerWords 와 1:1) — 입력 폼/수정/저장 시 반드시 이 필드 사용 */
  triggerWords: string[];
  appearancePresetId: string;
  /** 백엔드 characterImageUrl - 캐릭터 카드 아바타 표시용 */
  imageUrl?: string;
  vrmPresetId?: string;
  vrmUrl?: string;
  vrmThumbnailUrl?: string;
  voicePresetId: string;
  speechStyle: UiSpeechStyle;
  personality: UiPersonality;
  persona: Persona;
}

/**
 * 방송 설정 (UI 내부용)
 */
export interface BroadcastSettings {
  chatSensitivity: SensitivityLevel;
  silenceIntervalSeconds: number;
  ttsSpeed: number;
  ttsVolume: number;
}

/**
 * 캐릭터 프리셋 (UI 내부용 - 저장된 캐릭터 전체 정보)
 */
export interface CharacterPreset {
  id: string;
  name: string;
  info: CharacterInfo;
  broadcastSettings: BroadcastSettings;
  createdAt: string;
}

/**
 * 캐릭터 생성 요청 (UI 내부용)
 */
export interface CreateCharacterRequest {
  name: string;
  info: CharacterInfo;
  broadcastSettings: BroadcastSettings;
}

/**
 * 캐릭터 수정 요청 (UI 내부용)
 */
export interface UpdateCharacterRequest {
  name?: string;
  info?: Partial<CharacterInfo>;
  broadcastSettings?: Partial<BroadcastSettings>;
}

/**
 * 캐릭터 설정 옵션 응답 (UI 내부용)
 */
export interface CharacterSettingsResponse {
  genders: UiGender[];
  speechStyles: UiSpeechStyle[];
  personalities: UiPersonality[];
  personas: Persona[];
  sensitivityLevels: SensitivityLevel[];
  appearancePresets: { id: string; name: string; thumbnailUrl: string }[];
  voicePresets: { id: string; name: string; sampleUrl: string }[];
}

/**
 * 캐릭터 방송 프리셋 (UI 전용) - 백엔드 PresetType과 1:1 매핑
 * - neighbor: 동네 친구 → FRIENDLY_CHATTER
 * - high_tension: 텐션 폭발 → HIGH_TENSION
 * - teaser: 깐족 요정 → PLAYFUL_TEASER
 * - manager: 전문 매니저 → PROFESSIONAL_MANAGER
 * - immersive: 과몰입 장인 → ROLEPLAY_EXPERT
 */
export type BroadcastPreset = "neighbor" | "high_tension" | "teaser" | "manager" | "immersive" | "custom";

/**
 * 캐릭터 폼 말투 스타일 (UI 전용)
 */
export type CharacterFormSpeechStyle = "casual" | "polite" | "playful" | "dramatic";

/**
 * 캐릭터 생성/수정 폼 상태 (UI 전용)
 */
export interface CharacterConfig {
  name: string;
  callWords: string[];
  gender: "male" | "female";
  voiceId?: string;
  modelType: CharacterModelType;
  model2D: { presetId: string | null };
  model3D: {
    presetId: string | null;
    vrmUrl?: string | null;
    thumbnailUrl?: string | null;
  };
  speechStyle: CharacterFormSpeechStyle;
  personality: "energetic" | "calm" | "humorous" | "serious";
  broadcastPreset: BroadcastPreset | null;
  conversationRounds: number;
  autoEndConditions: {
    onStreamerSpeak: boolean;
    onTimeout: boolean;
    timeoutSeconds: number;
  };
  pauseChatAnalysis: boolean;
  ptt: {
    enabled: boolean;
    shortcutKey: string;
    mode: "hold" | "toggle";
    showFeedback: boolean;
  };
}
