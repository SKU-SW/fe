/**
 * @file 캐릭터(Character) 관련 타입 정의
 * @created Sprint 1 - Character 타입 정의 (기존 + Sprint 1에서 CreateCharacterRequest, UpdateCharacterRequest, CharacterSettingsResponse 추가)
 * @dependsOn 없음 (순수 타입 정의)
 * @usedBy src/features/character/api/characterApi.ts
 * @usedBy src/shared/stores/characterStore.ts
 */

/**
 * 캐릭터 성별
 */
export type Gender = 'male' | 'female';

/**
 * 말투 스타일
 * - friendly_informal: 친근한 반말
 * - polite_formal: 정중한 존댓말
 * - playful_informal:장난스러운 반말
 * - broadcast_exaggerated: 방송용 과장된 말투
 */
export type SpeechStyle =
  | 'friendly_informal'
  | 'polite_formal'
  | 'playful_informal'
  | 'broadcast_exaggerated';

/**
 * 성격 타입
 */
export type Personality = 'energetic' | 'calm' | 'humorous' | 'serious';

/**
 * 페르소나 (캐릭터의 전문 분야)
 */
export type Persona =
  | 'game_specialist'
  | 'humor_entertainment'
  | 'focused_serious'
  | 'chat_social';

/**
 * 채팅 민감도 레벨
 */
export type SensitivityLevel = 'high' | 'medium' | 'low';

/**
 * 캐릭터 기본 정보
 */
export interface CharacterInfo {
  gender: Gender;
  name: string;
  callSign: string;
  appearancePresetId: string;
  voicePresetId: string;
  speechStyle: SpeechStyle;
  personality: Personality;
  persona: Persona;
}

/**
 * 방송 설정 (채팅 민감도, TTS 등)
 */
export interface BroadcastSettings {
  chatSensitivity: SensitivityLevel;
  silenceIntervalSeconds: number;
  ttsSpeed: number;
  ttsVolume: number;
}

/**
 * 캐릭터 프리셋 (저장된 캐릭터 전체 정보)
 */
export interface CharacterPreset {
  id: string;
  name: string;
  info: CharacterInfo;
  broadcastSettings: BroadcastSettings;
  createdAt: string;
}

/**
 * 캐릭터 상태 (현재 선택된 캐릭터 + 프리셋 목록)
 */
export interface CharacterState {
  info: CharacterInfo | null;
  broadcastSettings: BroadcastSettings | null;
  presets: CharacterPreset[];
}

// [Sprint 1 수정] CreateCharacterRequest 추가
/**
 * 캐릭터 생성 요청 바디
 */
export interface CreateCharacterRequest {
  name: string;
  info: CharacterInfo;
  broadcastSettings: BroadcastSettings;
}

// [Sprint 1 수정] UpdateCharacterRequest 추가
/**
 * 캐릭터 수정 요청 바디
 * - 모든 필드가 optional이므로 부분 수정 가능
 */
export interface UpdateCharacterRequest {
  name?: string;
  info?: Partial<CharacterInfo>;
  broadcastSettings?: Partial<BroadcastSettings>;
}

// [Sprint 1 수정] CharacterSettingsResponse 추가
/**
 * 캐릭터 설정 옵션 응답 (프리셋 목록 등)
 * - 캐릭터 생성/수정 시 선택 가능한 옵션들을 서버에서 받아옴
 */
export interface CharacterSettingsResponse {
  genders: Gender[];
  speechStyles: SpeechStyle[];
  personalities: Personality[];
  personas: Persona[];
  sensitivityLevels: SensitivityLevel[];
  appearancePresets: { id: string; name: string; thumbnailUrl: string }[];
  voicePresets: { id: string; name: string; sampleUrl: string }[];
}
