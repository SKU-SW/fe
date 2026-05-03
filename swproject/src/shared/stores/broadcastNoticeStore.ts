/**
 * @file 방송 시작 안내 스킵 상태 Store
 * @dependsOn zustand
 * @usedBy src/pages/CharacterPage.tsx
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BroadcastNoticeStore {
  skippedCharacterIds: string[];
  shouldSkipNotice: (characterId: string) => boolean;
  skipNoticeForCharacter: (characterId: string) => void;
  resetSkippedNotices: () => void;
}

export const useBroadcastNoticeStore = create<BroadcastNoticeStore>()(
  persist(
    (set, get) => ({
      skippedCharacterIds: [],
      shouldSkipNotice: (characterId) => get().skippedCharacterIds.includes(characterId),
      skipNoticeForCharacter: (characterId) =>
        set((state) => ({
          skippedCharacterIds: state.skippedCharacterIds.includes(characterId)
            ? state.skippedCharacterIds
            : [...state.skippedCharacterIds, characterId],
        })),
      resetSkippedNotices: () => set({ skippedCharacterIds: [] }),
    }),
    {
      name: "broadcast-notice-storage",
      partialize: (state) => ({ skippedCharacterIds: state.skippedCharacterIds }),
    }
  )
);
