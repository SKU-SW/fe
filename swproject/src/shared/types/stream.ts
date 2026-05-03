/**
 * @file 방송(Stream) 관련 프론트엔드 타입 정의
 * @usedBy src/shared/stores/aiModeStore.ts
 * @usedBy src/pages/OverlayPage.tsx
 */

export type StreamEmotion = "happy" | "sad" | "angry" | "crying" | "default";

export type DialogueSpeaker = "streamer" | "ai";

export interface StreamDialogue {
  id: string;
  cursorId: number | null;
  speaker: DialogueSpeaker;
  text: string;
  emotion: StreamEmotion;
  timestamp: string;
}

export interface StreamInfo {
  broadcastStreamId: string;
  broadcastStartedAt: string;
}
