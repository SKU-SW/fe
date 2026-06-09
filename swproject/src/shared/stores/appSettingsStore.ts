/**
 * @file 앱 전역 설정 저장소 (트레이/전역 PTT 단축키)
 * @dependsOn zustand
 * @usedBy src/pages/SettingsPage.tsx, src/main.tsx
 */

import { create } from "zustand";

export const APP_SETTINGS_STORAGE_KEY = "sku-sw-app-settings";

export const HOTKEY_KEY_OPTIONS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  "Space",
  "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
] as const;

export type HotkeyKey = (typeof HOTKEY_KEY_OPTIONS)[number];

export interface PttShortcutSettings {
  ctrlOrCmd: boolean;
  shift: boolean;
  alt: boolean;
  key: HotkeyKey;
}

export interface AppSettingsPayload {
  closeToTray: boolean;
  pttShortcut: PttShortcutSettings;
}

export const DEFAULT_PTT_SHORTCUT: PttShortcutSettings = {
  ctrlOrCmd: true,
  shift: true,
  alt: false,
  key: "M",
};

export const DEFAULT_APP_SETTINGS: AppSettingsPayload = {
  closeToTray: true,
  pttShortcut: DEFAULT_PTT_SHORTCUT,
};

function isHotkeyKey(value: unknown): value is HotkeyKey {
  return typeof value === "string" && HOTKEY_KEY_OPTIONS.includes(value as HotkeyKey);
}

function sanitizeShortcut(value: unknown): PttShortcutSettings {
  const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const ctrlOrCmd = candidate.ctrlOrCmd !== false;
  const shift = typeof candidate.shift === "boolean" ? candidate.shift : DEFAULT_PTT_SHORTCUT.shift;
  const alt = typeof candidate.alt === "boolean" ? candidate.alt : DEFAULT_PTT_SHORTCUT.alt;
  const key = isHotkeyKey(candidate.key) ? candidate.key : DEFAULT_PTT_SHORTCUT.key;

  const hasAnyModifier = ctrlOrCmd || shift || alt;

  return {
    ctrlOrCmd: hasAnyModifier ? ctrlOrCmd : true,
    shift,
    alt,
    key,
  };
}

function resolveInitialAppSettings(): AppSettingsPayload {
  if (typeof window === "undefined") {
    return DEFAULT_APP_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_SETTINGS;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return {
      closeToTray: parsed.closeToTray !== false,
      pttShortcut: sanitizeShortcut(parsed.pttShortcut),
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function formatPttShortcut(shortcut: PttShortcutSettings): string {
  const parts = [
    shortcut.ctrlOrCmd ? "Ctrl/Cmd" : null,
    shortcut.shift ? "Shift" : null,
    shortcut.alt ? "Alt" : null,
    shortcut.key === "Space" ? "Space" : shortcut.key,
  ].filter(Boolean);

  return parts.join(" + ");
}

function persistAndSync(settings: AppSettingsPayload) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 저장 실패 시 무시
  }

  void window.electronAPI?.appSettings?.set?.(settings).catch(() => {
    // Electron 환경이 아니거나 동기화 실패 시 무시
  });
}

interface AppSettingsStore extends AppSettingsPayload {
  setCloseToTray: (enabled: boolean) => void;
  setPttShortcut: (shortcut: PttShortcutSettings) => void;
  updatePttShortcut: (patch: Partial<PttShortcutSettings>) => void;
  resetPttShortcut: () => void;
  syncToElectron: () => void;
}

export const useAppSettingsStore = create<AppSettingsStore>((set, get) => ({
  ...resolveInitialAppSettings(),
  setCloseToTray: (enabled) => {
    const next = { ...get(), closeToTray: enabled };
    persistAndSync(next);
    set({ closeToTray: enabled });
  },
  setPttShortcut: (shortcut) => {
    const nextShortcut = sanitizeShortcut(shortcut);
    const next = { ...get(), pttShortcut: nextShortcut };
    persistAndSync(next);
    set({ pttShortcut: nextShortcut });
  },
  updatePttShortcut: (patch) => {
    const nextShortcut = sanitizeShortcut({ ...get().pttShortcut, ...patch });
    const next = { ...get(), pttShortcut: nextShortcut };
    persistAndSync(next);
    set({ pttShortcut: nextShortcut });
  },
  resetPttShortcut: () => {
    const next = { ...get(), pttShortcut: DEFAULT_PTT_SHORTCUT };
    persistAndSync(next);
    set({ pttShortcut: DEFAULT_PTT_SHORTCUT });
  },
  syncToElectron: () => {
    const { closeToTray, pttShortcut } = get();
    persistAndSync({ closeToTray, pttShortcut });
  },
}));
