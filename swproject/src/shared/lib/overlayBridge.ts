/**
 * @file OBS Browser Source와 앱 화면 사이에서 오버레이 상태를 공유하는 브릿지
 * @dependsOn src/shared/types/overlay.ts
 * @usedBy src/pages/DashboardPage.tsx, src/pages/OverlayPage.tsx
 */

import type { OverlayBridgeState } from "@/shared/types/overlay";

const OVERLAY_STATE_KEY = "sku-sw-overlay-bridge-state";
const OVERLAY_EVENT_NAME = "sku-sw-overlay-bridge-update";
const OVERLAY_STATE_SERVER_URL = "http://127.0.0.1:5174/overlay-state";
const OVERLAY_STATE_POLL_INTERVAL_MS = 200;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function writeOverlayBridgeState(state: OverlayBridgeState) {
  const storage = getStorage();
  if (!storage || typeof window === "undefined") return;
  const serialized = JSON.stringify(state);
  storage.setItem(OVERLAY_STATE_KEY, serialized);
  window.dispatchEvent(
    new CustomEvent<OverlayBridgeState>(OVERLAY_EVENT_NAME, { detail: state })
  );
  void window.electronAPI?.overlay?.setState(state).catch((err) => {
    console.warn("[overlayBridge] IPC setState failed:", err);
  });
}

export function readOverlayBridgeState(): OverlayBridgeState | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(OVERLAY_STATE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OverlayBridgeState;
  } catch {
    return null;
  }
}

export async function readOverlayStateServer(): Promise<OverlayBridgeState | null> {
  if (typeof fetch !== "function") return null;
  try {
    const res = await fetch(OVERLAY_STATE_SERVER_URL, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json() as OverlayBridgeState;
  } catch {
    return null;
  }
}

export function subscribeOverlayBridgeState(
  callback: (state: OverlayBridgeState) => void
): () => void {
  if (typeof window === "undefined") return () => undefined;

  let lastSerialized = "";
  let polling = false;

  const emitIfChanged = (state: OverlayBridgeState) => {
    const serialized = JSON.stringify(state);
    if (serialized === lastSerialized) return;
    lastSerialized = serialized;
    callback(state);
  };

  const handleCustomEvent = (event: Event) => {
    const custom = event as CustomEvent<OverlayBridgeState>;
    if (custom.detail) emitIfChanged(custom.detail);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== OVERLAY_STATE_KEY || !event.newValue) return;
    try {
      emitIfChanged(JSON.parse(event.newValue) as OverlayBridgeState);
    } catch {
      // ignore malformed bridge payload
    }
  };

  const pollOverlayStateServer = () => {
    if (polling) return;
    polling = true;
    readOverlayStateServer()
      .then((state) => {
        if (state) emitIfChanged(state);
      })
      .finally(() => {
        polling = false;
      });
  };

  window.addEventListener(OVERLAY_EVENT_NAME, handleCustomEvent);
  window.addEventListener("storage", handleStorage);
  pollOverlayStateServer();
  const intervalId = window.setInterval(pollOverlayStateServer, OVERLAY_STATE_POLL_INTERVAL_MS);

  return () => {
    window.removeEventListener(OVERLAY_EVENT_NAME, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
    window.clearInterval(intervalId);
  };
}
