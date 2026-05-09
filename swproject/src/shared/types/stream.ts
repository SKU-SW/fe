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

export type StreamEmotion = "happy" | "sad" | "angry" | "crying" | "default";

/** UI 에서 다루는 화자 종류 — 백엔드 4종 subject 와 1:1 매핑 (대소문자만 다름) */
export type DialogueSpeaker = "streamer" | "ai" | "viewer" | "system";

export interface StreamDialogue {
  /** dedup 키 — 백엔드 cursorId 기반 (`String(cursorId)`) */
  id: string;
  /** 정렬·페이징 기준. 백엔드 응답이면 항상 number, 로컬 임시 삽입 시 null */
  cursorId: number | null;
  speaker: DialogueSpeaker;
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
