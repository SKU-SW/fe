/**
 * @file 방송 WebSocket 메시지 타입 — Backend 진실의 근원 (SKU-SW/be 레포)
 * @dependsOn 없음 (순수 타입)
 * @usedBy src/features/broadcast/hooks/useStreamWS.ts
 *
 * Backend 코드 참조:
 *   - BroadcastMessageReqDto      → FE 송신 (text frame, JSON)
 *   - BroadcastVoiceMetadataResDto → BE 수신 (text frame, JSON)
 *   - BroadcastWebSocketErrorResDto → 에러 (text frame, JSON)
 *   - BinaryMessage (TTS 오디오)    → BE 수신 (binary frame)
 *
 * 메시지 흐름:
 *   FE → BE: { type: "CHAT", message: "..." } 텍스트 1프레임
 *   BE → FE: 음성(Binary) → 메타데이터(Text JSON) 순서로 항상 페어 도착
 *            (synchronized 보장, BroadcastWebSocketVoiceSender 참조)
 *   에러 시: { error: "ERROR", message: "..." } 텍스트 1프레임 후 close
 */

// ============================================================
// FE → BE
// ============================================================

/**
 * 클라이언트 채팅 송신.
 * - 서버 record 는 message 필드만 정의되어 있지만, 참고 구현(test-frontend) 이
 *   type: "CHAT" 도 함께 보내고 있어 동일 형태로 송신 (호환 안전).
 */
export interface StreamWsClientChatMessage {
  type: "CHAT";
  message: string;
}

export type StreamWsClientMessage = StreamWsClientChatMessage;

// ============================================================
// BE → FE
// ============================================================

/** 음성 메타데이터 (Binary 프레임 직후에 도착) */
export interface StreamWsVoiceMetadata {
  characterId: number;
  voiceText: string;
  broadcastDialogueCursorId: number;
}

/** 에러 응답 (text frame, 이후 서버가 세션 close) */
export interface StreamWsErrorPayload {
  error: "ERROR";
  message: string;
}

// ============================================================
// 페어링된 음성 응답 (FE 내부 구조)
// ============================================================

/**
 * Binary(음성) + Text(메타) 두 프레임을 페어링한 결과.
 * useStreamWS 가 onVoiceResponse 콜백으로 통째 전달.
 */
export interface VoiceResponse {
  audio: Blob;
  voiceText: string;
  cursorId: number;
  characterId: number;
}
