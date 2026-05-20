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
  /** TTS 재생 중 여부 — 오버레이 페이드 타이머 제어용 */
  isSpeaking: boolean;
  characterName: string;
  /** 기본(DEFAULT) 이미지 — emotionImageMap 미존재 시 폴백 */
  characterImageUrl: string;
  /**
   * 감정별 캐릭터 이미지 매핑 (Phase 2).
   * - 비어 있는 키는 characterImageUrl 로 폴백.
   * - BE 가 CharacterImageResDto 에 감정별 필드를 노출하면 채워짐 (현재는 DEFAULT 만).
   */
  emotionImageMap: Partial<Record<StreamEmotion, string>>;
  transcript: string;
  emotion: StreamEmotion;
  updatedAt: number;
}

export interface OverlayBridgeState {
  settings: OverlaySettings;
  runtime: OverlayRuntimeState;
}
