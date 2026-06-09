/**
 * @file 캐릭터별 2D/3D 외형 정보 로컬 캐시
 * @dependsOn zustand
 * @dependsOn src/shared/types/character.ts
 * @usedBy src/features/character/api/characterApi.ts
 * @usedBy src/features/broadcast/hooks/useStreamInfo.ts
 * @usedBy src/components/AppInitializer.tsx
 * @usedBy src/pages/CharacterPage.tsx
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CharacterModelType } from "@/shared/types/character";

export interface AppearanceRecord {
  modelType: CharacterModelType;
  targetId: number;
  vrmUrl?: string | null;
  vrmThumbnailUrl?: string | null;
  updatedAt: number;
}

interface CharacterAppearanceStore {
  records: Record<number, AppearanceRecord>;
  setAppearance: (characterId: number, record: AppearanceRecord) => void;
  removeAppearance: (characterId: number) => void;
  getAppearance: (characterId: number) => AppearanceRecord | undefined;
  clearAll: () => void;
}

function isValidCharacterId(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function sanitizeRecords(records: unknown): Record<number, AppearanceRecord> {
  if (!records || typeof records !== "object") return {};

  const next: Record<number, AppearanceRecord> = {};
  for (const [key, value] of Object.entries(records as Record<string, AppearanceRecord>)) {
    const numericKey = Number(key);
    if (!Number.isFinite(numericKey) || numericKey <= 0) continue;
    if (!value || typeof value !== "object") continue;
    next[numericKey] = value;
  }
  return next;
}

export const useCharacterAppearanceStore = create<CharacterAppearanceStore>()(
  persist(
    (set, get) => ({
      records: {},
      setAppearance: (characterId, record) => {
        if (!isValidCharacterId(characterId)) {
          if (import.meta.env.DEV) {
            console.warn("[characterAppearanceStore] invalid characterId ignored:", characterId, record);
          }
          return;
        }
        set((state) => ({
          records: {
            ...state.records,
            [characterId]: record,
          },
        }));
      },
      removeAppearance: (characterId) =>
        set((state) => {
          const next = { ...state.records };
          delete next[characterId];
          return { records: next };
        }),
      getAppearance: (characterId) => (isValidCharacterId(characterId) ? get().records[characterId] : undefined),
      clearAll: () => set({ records: {} }),
    }),
    {
      name: "character-appearance-storage",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.records = sanitizeRecords(state.records);
      },
    },
  ),
);
