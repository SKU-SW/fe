/**
 * @file 방송 WebSocket 메시지 타입 — Notion WS 스펙 진실의 근원
 * @dependsOn src/shared/types/stream.ts (StreamEmotion)
 * @usedBy src/features/broadcast/hooks/useStreamWS.ts
 *
 * Notion 스펙(2026-04 기준):
 *   FE → BE (text frame, JSON):
 *     { "message": "..." }            // type 필드 없음
 *
 *   BE → FE: binary(raw PCM) + JSON text 페어 / 또는 메타 단독 (감정 알림 등)
 *     - VOICE_EMOTION: 감정 변경만 알림 (오디오 없음)
 *         { eventType: "VOICE_EMOTION", turnNumber, characterId,
 *           voiceText: null, emotion, broadcastDialogueCursorId: null }
 *     - VOICE_CHUNK: TTS 청크 — 직전 binary 프레임과 페어
 *         { eventType: "VOICE_CHUNK", voiceText, emotion, cursorId: null }
 *     - VOICE_TURN_COMPLETE: 턴 종료 — 누적 voiceText + 최종 cursorId
 *         { eventType: "VOICE_TURN_COMPLETE", voiceText, emotion,
 *           broadcastDialogueCursorId }
 *
 *   에러 (text frame): { error: "ERROR", message: "..." } 이후 서버 close
 */

import type { StreamEmotion } from "@/shared/types/stream";

// ============================================================
// FE → BE
// ============================================================

/** 클라이언트 채팅 송신 — Notion 스펙은 message 필드만. */
export interface StreamWsClientChatMessage {
  message: string;
}

export type StreamWsClientMessage = StreamWsClientChatMessage;

/** AI 응답 인터럽트 요청 — 기존 { message } 채널의 message 본문 prefix. */
export const AI_RESPONSE_INTERRUPT_PREFIX = "__AI_RESPONSE_INTERRUPT_REQUEST__:";

export function buildInterruptRequestMessage(
  turnNumber: number,
  reason: string
): string {
  return `${AI_RESPONSE_INTERRUPT_PREFIX}${JSON.stringify({ turnNumber, reason })}`;
}

// ============================================================
// BE → FE (text frames)
// ============================================================

/** 감정 변경 단독 알림 (오디오 페어 없음) */
export interface StreamWsVoiceEmotionEvent {
  eventType: "VOICE_EMOTION";
  turnNumber: number;
  characterId: number;
  voiceText: null;
  emotion: StreamEmotion;
  broadcastDialogueCursorId: null;
}

/** TTS 청크 — 직전 binary 프레임과 페어 (FIFO). voiceText 는 null 가능. */
export interface StreamWsVoiceChunkEvent {
  eventType: "VOICE_CHUNK";
  turnNumber: number;
  characterId: number;
  voiceText: string | null;
  emotion: StreamEmotion;
  broadcastDialogueCursorId: null;
}

/** 턴 종료 — 누적 voiceText + 최종 cursorId (오디오 없음) */
export interface StreamWsVoiceTurnCompleteEvent {
  eventType: "VOICE_TURN_COMPLETE";
  turnNumber: number;
  characterId: number;
  voiceText: string;
  emotion: StreamEmotion;
  broadcastDialogueCursorId: number;
}

/** 응답 중단 완료 — BE가 중단된 AI dialogue를 Redis에 저장한 뒤 전송. */
export interface StreamWsVoiceInterruptedEvent {
  eventType: "VOICE_INTERRUPTED";
  turnNumber: number;
  characterId: number;
  voiceText: string;
  emotion: StreamEmotion;
  broadcastDialogueCursorId: number;
}

export type StreamWsVoiceEvent =
  | StreamWsVoiceEmotionEvent
  | StreamWsVoiceChunkEvent
  | StreamWsVoiceTurnCompleteEvent
  | StreamWsVoiceInterruptedEvent;

/** 노션 공통 에러 코드 enum */
export type StreamWsErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR";

/** 에러 응답 (text frame, 이후 서버가 세션 close) */
export interface StreamWsErrorPayload {
  error: "ERROR";
  code?: StreamWsErrorCode;
  message: string;
}

// ============================================================
// FE 내부 페어링 결과
// ============================================================

/**
 * VOICE_CHUNK + 직전 binary(raw PCM) 페어 결과.
 * useStreamWS 가 onVoiceChunk 콜백으로 전달.
 * voiceText 는 null 가능 — 자막 누적 시 빈 문자열로 폴백할 것.
 */
export interface VoiceChunk {
  audio: Blob;
  voiceText: string | null;
  emotion: StreamEmotion;
}

/** VOICE_TURN_COMPLETE — 턴 종료 시 누적 voiceText/cursorId 확정 */
export interface VoiceTurnComplete {
  voiceText: string;
  emotion: StreamEmotion;
  cursorId: number;
}

/** VOICE_INTERRUPTED — 현재 AI 응답 turn이 중단되어 확정됨. */
export interface VoiceInterrupted {
  turnNumber: number;
  voiceText: string;
  emotion: StreamEmotion;
  cursorId: number;
}
