/**
 * @file 방송(Broadcast) 관련 타입 정의 — Swagger 진실의 근원
 * @dependsOn 없음 (순수 타입)
 * @usedBy src/features/broadcast/api/*.ts
 * @usedBy src/shared/stores/aiModeStore.ts
 *
 * Backend Swagger (https://dev.sku-sw.cloud/v3/api-docs) 1:1 매핑:
 *   - BroadcastStartResDto, BroadcastTerminateResDto, BroadcastStatus
 *   - CurrentStreamInfoResDto                            (GET /stream/info)
 *   - BroadcastDialogueCursorItemResDto                  (대화 1건)
 *   - CursorSliceResponse<T>                             (페이징 wrapper)
 *   - BroadcastCharacterInfoResDto                       (방송 중 캐릭터)
 *   - CharacterPersonaInfoResDto, DialogueSubject enum
 */

// ============================================================
// 방송 시작/종료 (POST /stream/start, POST /stream/terminate)
// ============================================================

export type BroadcastStatus = "BROADCASTING" | "TERMINATED" | "ABNORMAL_TERMINATED";

export interface BroadcastStartResDto {
  broadcastStreamId: string;
  /** "2026-04-26-14:30:00" 같은 BE 고유 포맷 */
  broadcastStartedAt: string;
}

export interface BroadcastTerminateResDto {
  /** 필드명 주의: start 응답의 broadcastStreamId 와 다름 */
  terminatedBroadcastStreamId: string;
  broadcastStatus: BroadcastStatus;
  broadcastTerminatedAt: string;
}

// ============================================================
// 방송 캐릭터 정보 (GET /stream/info 응답의 일부)
// ============================================================

export type CharacterPresetType =
  | "FRIENDLY_CHATTER"
  | "HIGH_TENSION"
  | "PLAYFUL_TEASER"
  | "PROFESSIONAL_MANAGER"
  | "ROLEPLAY_EXPERT"
  | "CUSTOM";

export type CharacterSpeechStyle =
  | "FRIENDLY_INFORMAL"
  | "POLITE_FORMAL"
  | "PLAYFUL_INFORMAL"
  | "BROADCAST_EXAGGERATED";

export type CharacterPersonality = "ACTIVE" | "CALM" | "HUMOROUS" | "SERIOUS";

export type CharacterGender = "MALE" | "FEMALE";

export interface CharacterPersonaInfoResDto {
  presetType: CharacterPresetType;
  speechStyle: CharacterSpeechStyle;
  personality: CharacterPersonality;
}

export interface BroadcastCharacterInfoResDto {
  characterId: number;
  characterName: string;
  triggerWords: string[];
  gender: CharacterGender;
  voiceTypeId: number;
  characterImageUrl: string;
  characterPersona: CharacterPersonaInfoResDto;
}

// ============================================================
// 방송 대화 (GET /stream/info, GET /stream/info/dialogues)
// ============================================================

/** 발언 주체 — Swagger enum 그대로 (UPPER_SNAKE) */
export type DialogueSubject =
  | "STREAMER"
  | "AI_CHARACTER"
  | "VIEWER"
  | "DONATION"
  | "GAME_EVENT"
  | "SYSTEM_SUMMARY";

export interface BroadcastDialogueCursorItemResDto {
  /** cursor 페이징 기준이 되는 PK (단조 증가 가정) */
  cursorId: number;
  subject: DialogueSubject;
  content: string;
  /** "2026-04-25-18:00:15" — Date 로 파싱하려면 별도 파서 필요 */
  createdAt: string;
}

/** 커서 기반 무한 스크롤 응답 wrapper (Swagger Record) */
export interface CursorSliceResponse<T> {
  content: T[];
  size: number;
  hasNext: boolean;
  nextCursor: number;
}

/** GET /api/v1/stream/info 응답 */
export interface CurrentStreamInfoResDto {
  broadcastCharacterInfo: BroadcastCharacterInfoResDto;
  content: BroadcastDialogueCursorItemResDto[];
  size: number;
  hasNext: boolean;
  nextCursor: number;
}

/** GET /api/v1/stream/info/dialogues 쿼리 파라미터 */
export interface GetStreamDialoguesParams {
  size: number;
  cursorId: number;
  aiCharacterDialogue: boolean;
  streamerDialogue: boolean;
  viewerDialogue: boolean;
}
