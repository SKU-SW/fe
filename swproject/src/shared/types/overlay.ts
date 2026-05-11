/**
 * @file OBS 오버레이 상태/설정 타입
 * @usedBy src/shared/stores/overlayStore.ts
 * @usedBy src/shared/lib/overlayBridge.ts
 * @usedBy src/pages/OverlayPage.tsx
 */

import type { StreamEmotion } from "@/shared/types/stream";

export type OverlayPosition =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export interface OverlaySettings {
  enabled: boolean;
  position: OverlayPosition;
  scale: number;
  showBubble: boolean;
}

export interface OverlayRuntimeState {
  isBroadcasting: boolean;
  broadcastStreamId: string | null;
  characterName: string;
  characterImageUrl: string;
  transcript: string;
  emotion: StreamEmotion;
  updatedAt: number;
}

export interface OverlayBridgeState {
  settings: OverlaySettings;
  runtime: OverlayRuntimeState;
}
