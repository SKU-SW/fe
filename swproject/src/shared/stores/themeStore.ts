/**
 * @file 앱 전역 테마 상태 저장소
 * @created Theme System
 * @dependsOn zustand
 * @usedBy src/App.tsx, src/components/layouts/DashboardHeader.tsx
 */

import { create } from "zustand";

export const THEME_OPTIONS = [
  {
    name: "dark",
    label: "다크",
    description: "어두운 작업 환경에 맞춘 기본 테마",
    appearance: "dark",
  },
  {
    name: "light",
    label: "라이트",
    description: "밝은 배경과 또렷한 경계의 기본 테마",
    appearance: "light",
  },
  {
    name: "spring",
    label: "봄",
    description: "따뜻한 크림·로즈 톤의 부드러운 테마",
    appearance: "light",
  },
] as const;

export const DEFAULT_THEME_NAME = "dark";

export type ThemeOption = (typeof THEME_OPTIONS)[number];
export type ThemeName = ThemeOption["name"];

const THEME_STORAGE_KEY = "sku-sw-theme";

function isKnownThemeName(value: string | null | undefined): value is ThemeName {
  return value != null && THEME_OPTIONS.some((option) => option.name === value);
}

function getThemeAppearance(theme: ThemeName): ThemeOption["appearance"] {
  return THEME_OPTIONS.find((option) => option.name === theme)?.appearance ?? "light";
}

export function isDarkTheme(theme: ThemeName) {
  return getThemeAppearance(theme) === "dark";
}

function resolveInitialTheme(): ThemeName {
  if (typeof document !== "undefined") {
    const currentTheme = document.documentElement.dataset.theme;
    if (isKnownThemeName(currentTheme)) {
      return currentTheme;
    }
  }

  if (typeof window !== "undefined") {
    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (isKnownThemeName(storedTheme)) {
        return storedTheme;
      }
    } catch {
      // localStorage 접근 실패 시 기본값 사용
    }
  }

  return DEFAULT_THEME_NAME;
}

export function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") return;

  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", isDarkTheme(theme));
  document.documentElement.style.colorScheme = isDarkTheme(theme) ? "dark" : "light";

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // 저장 실패 시 무시
    }
  }
}

interface ThemeStore {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: resolveInitialTheme(),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = isDarkTheme(get().theme) ? "light" : "dark";
    applyTheme(nextTheme);
    set({ theme: nextTheme });
  },
}));
