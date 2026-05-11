/**
 * @file 캐릭터 설정 프리셋 Store — DB 캐릭터 이미지/음성 옵션 캐시
 * @dependsOn zustand
 * @dependsOn src/shared/types/character.ts
 * @usedBy src/features/character/hooks/useCharacterSettings.ts, src/pages/OverlayPage.tsx
 */

import { create } from "zustand";
import type { CharacterSettingsResDto } from "@/shared/types/character";

interface CharacterSettingsStore {
  settings: CharacterSettingsResDto | null;
  setSettings: (settings: CharacterSettingsResDto | null) => void;
}

export const useCharacterSettingsStore = create<CharacterSettingsStore>()((set) => ({
  settings: null,
  setSettings: (settings) => set({ settings }),
}));
