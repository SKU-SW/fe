/**
 * @file OBS 오버레이 설정 및 런타임 상태 Store
 * @dependsOn zustand
 * @usedBy src/pages/OverlayPage.tsx, src/pages/DashboardPage.tsx
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  OverlayPosition,
  OverlayRuntimeState,
  OverlaySettings,
} from "@/shared/types/overlay";
import type { StreamEmotion } from "@/shared/types/stream";
import { readOverlayBridgeState, writeOverlayBridgeState } from "@/shared/lib/overlayBridge";

interface OverlayStore {
  settings: OverlaySettings;
  runtime: OverlayRuntimeState;
  setEnabled: (enabled: boolean) => void;
  setPosition: (position: OverlayPosition) => void;
  setScale: (scale: number) => void;
  setShowBubble: (showBubble: boolean) => void;
  updateRuntime: (runtime: Partial<OverlayRuntimeState>) => void;
  clearRuntime: () => void;
  setTranscript: (transcript: string, emotion?: StreamEmotion) => void;
}

export const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  enabled: true,
  position: "bottom-right",
  scale: 1,
  showBubble: true,
};

export const DEFAULT_OVERLAY_RUNTIME: OverlayRuntimeState = {
  isBroadcasting: false,
  broadcastStreamId: null,
  isSpeaking: false,
  characterName: "AI",
  characterImageUrl: "",
  emotionImageMap: {},
  transcript: "",
  emotion: "DEFAULT",
  updatedAt: 0,
};

function clampScale(scale: number): number {
  return Math.min(1.5, Math.max(0.5, Number.isFinite(scale) ? scale : 1));
}

function syncOverlayBridge(settings: OverlaySettings, runtime: OverlayRuntimeState) {
  writeOverlayBridgeState({ settings, runtime });
}

function getBridgeRuntime(fallback: OverlayRuntimeState): OverlayRuntimeState {
  return readOverlayBridgeState()?.runtime ?? fallback;
}

export const useOverlayStore = create<OverlayStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_OVERLAY_SETTINGS,
      runtime: DEFAULT_OVERLAY_RUNTIME,
      setEnabled: (enabled) =>
        set((state) => {
          const settings = { ...state.settings, enabled };
          syncOverlayBridge(settings, getBridgeRuntime(state.runtime));
          return { settings };
        }),
      setPosition: (position) =>
        set((state) => {
          const settings = { ...state.settings, position };
          syncOverlayBridge(settings, getBridgeRuntime(state.runtime));
          return { settings };
        }),
      setScale: (scale) =>
        set((state) => {
          const settings = { ...state.settings, scale: clampScale(scale) };
          syncOverlayBridge(settings, getBridgeRuntime(state.runtime));
          return { settings };
        }),
      setShowBubble: (showBubble) =>
        set((state) => {
          const settings = { ...state.settings, showBubble };
          syncOverlayBridge(settings, getBridgeRuntime(state.runtime));
          return { settings };
        }),
       updateRuntime: (runtime) =>
         set((state) => {
           const nextRuntime = {
             ...state.runtime,
             ...runtime,
             updatedAt: Date.now(),
           };
           syncOverlayBridge(state.settings, nextRuntime);
           return { runtime: nextRuntime };
         }),
      clearRuntime: () =>
        set((state) => {
          const runtime = {
            ...DEFAULT_OVERLAY_RUNTIME,
            updatedAt: Date.now(),
          };
          syncOverlayBridge(state.settings, runtime);
          return { runtime };
        }),
      setTranscript: (transcript, emotion = "DEFAULT") =>
        set((state) => {
          const runtime = {
            ...state.runtime,
            transcript,
            emotion,
            updatedAt: Date.now(),
          };
          syncOverlayBridge(state.settings, runtime);
          return { runtime };
        }),
    }),
    {
      name: "overlay-storage",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
