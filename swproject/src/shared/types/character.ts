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
 * 프리셋 타입 (backend)
 */
export type PresetType =
  | "FRIENDLY_CHATTER"
  | "HIGH_TENSION"
  | "PLAYFUL_TEASER"
  | "PROFESSIONAL_MANAGER"
  | "ROLEPLAY_EXPERT"
  | "CUSTOM";

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
  speechStyle: SpeechStyle;
  personality: Personality;
}

/**
 * 캐릭터 페르소나 응답
 */
export interface CharacterPersonaResDto {
  presetType: PresetType;
  speechStyle: SpeechStyle;
  personality: Personality;
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
  voiceTypeId: number;
  characterImageUrl: string;
  characterPersona: CharacterPersonaResDto;
  isSelected: boolean;
}

/**
 * 캐릭터 목록 항목 응답
 */
export interface CharacterListItemResDto {
  characterId: number;
  characterName: string;
  triggerWords: string[];
  gender: Gender;
  voiceTypeId: number;
  characterImageUrl: string;
  isSelected: boolean;
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
 * 캐릭터 생성 요청
 * - backend CharacterCreateReqDto 매칭
 */
export interface CharacterCreateReqDto {
  characterName: string;
  triggerWords: string[];
  gender: Gender;
  voiceTypeId: number;
  characterImageId: number;
  characterPersona: CharacterPersonaReqDto;
}

/**
 * 캐릭터 수정 요청
 * - backend CharacterUpdateReqDto 매칭 (모든 필드 필수)
 */
export interface CharacterUpdateReqDto {
  characterName: string;
  triggerWords: string[];
  gender: Gender;
  voiceTypeId: number;
  characterImageId: number;
  characterPersona: CharacterPersonaReqDto;
}

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
 * 음성 타입 응답
 */
export interface VoiceTypeResDto {
  voiceTypeId: number;
  label: string | null;
  gender: Gender;
  ageGroup: AgeGroup;
  testUrl: string;
}

/**
 * 캐릭터 이미지 응답
 */
export interface CharacterImageResDto {
  imageId: number;
  gender: Gender;
  name: string;
  imageUrl: string;
  imageUrl1?: string; // 서버 호환용 (imageUrl1 필드)
}

/**
 * 캐릭터 설정 옵션 응답
 * - backend CharacterSettingsResDto 매칭
 */
export interface CharacterSettingsResDto {
  voiceTypes: VoiceTypeResDto[];
  characterImages: CharacterImageResDto[];
  presetTypes: string[];
  speechStyles: string[];
  personalities: string[];
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
  | "immersive";

/**
 * 채팅 민감도 레벨 (UI 전용)
 */
export type SensitivityLevel = "high" | "medium" | "low";

/**
 * 캐릭터 기본 정보 (UI 내부용)
 */
export interface CharacterInfo {
  gender: UiGender;
  name: string;
  /** 표시용 호출어 합본 문자열 (예: "강희야, 야, 친구야"). 입력/저장 용도로 쓰지 말 것 — triggerWords 사용 */
  callSign: string;
  /** 호출어 원본 배열 (BE triggerWords 와 1:1) — 입력 폼/수정/저장 시 반드시 이 필드 사용 */
  triggerWords: string[];
  appearancePresetId: string;
  /** 백엔드 characterImageUrl - 캐릭터 카드 아바타 표시용 */
  imageUrl?: string;
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
export type BroadcastPreset = "neighbor" | "high_tension" | "teaser" | "manager" | "immersive";

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
  model2D: { presetId: string | null };
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
