/**
 * @file 방송(Stream) FE 내부 모델 — store/UI 가 사용
 * @usedBy src/shared/stores/aiModeStore.ts
 * @usedBy src/pages/DashboardPage.tsx
 * @usedBy src/pages/OverlayPage.tsx
 *
 * 백엔드 DTO(`shared/types/broadcast.ts`)와 FE 모델은 1:1 이 아닙니다.
 *   - 백엔드: subject = 'STREAMER' | 'AI_CHARACTER' | 'VIEWER' | 'SYSTEM_SUMMARY'
 *   - FE:    speaker = 'streamer' | 'ai' | 'viewer' | 'system'
 *   - 변환은 features/broadcast/api/streamApi.ts 의 adapter 에서 수행.
 */

/**
 * AI 캐릭터 감정 — 백엔드 enum 과 1:1 (UPPER_SNAKE).
 *   - DEFAULT: 평상시
 *   - TALKING: 말하는 중 (lip-sync 등 시각 강조)
 *   - HAPPY / ANGRY / TIRED / SAD / FEAR: 감정 상태
 * Notion WS 스펙: VOICE_EMOTION / VOICE_CHUNK / VOICE_TURN_COMPLETE 의 emotion 필드.
 */
export type StreamEmotion =
  | "DEFAULT"
  | "TALKING"
  | "HAPPY"
  | "ANGRY"
  | "TIRED"
  | "SAD"
  | "FEAR";

/** UI 에서 다루는 화자 종류 — 백엔드 subject 를 화면 친화형으로 매핑 */
export type DialogueSpeaker = "streamer" | "ai" | "viewer" | "system" | "system_summary";

export type DialogueSubjectKind = "STREAMER" | "AI_CHARACTER" | "VIEWER" | "DONATION" | "GAME_EVENT" | "SYSTEM_SUMMARY";

export interface StreamDialogue {
  /** dedup 키 — 백엔드 cursorId 기반 (`String(cursorId)`) */
  id: string;
  /** 정렬·페이징 기준. 백엔드 응답이면 항상 number, 로컬 임시 삽입 시 null */
  cursorId: number | null;
  speaker: DialogueSpeaker;
  subject: DialogueSubjectKind;
  text: string;
  /** 향후 WebSocket emotion 채널로 채워질 예정. 현재는 'default' */
  emotion: StreamEmotion;
  /** 백엔드 createdAt 원본 문자열 ("2026-04-25-18:00:15"). UI 표시 시 파싱 */
  timestamp: string;
}

export interface StreamInfo {
  broadcastStreamId: string;
  broadcastStartedAt: string;
}
