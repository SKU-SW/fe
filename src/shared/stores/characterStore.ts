import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterInfo, BroadcastSettings, CharacterPreset } from '@/shared/types/character';

interface CharacterStore {
  info: CharacterInfo | null;
  broadcastSettings: BroadcastSettings | null;
  presets: CharacterPreset[];
  setInfo: (info: CharacterInfo) => void;
  setBroadcastSettings: (settings: BroadcastSettings) => void;
  setPresets: (presets: CharacterPreset[]) => void;
  reset: () => void;
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      info: null,
      broadcastSettings: null,
      presets: [],
      setInfo: (info) => set({ info }),
      setBroadcastSettings: (broadcastSettings) => set({ broadcastSettings }),
      setPresets: (presets) => set({ presets }),
      reset: () => set({ info: null, broadcastSettings: null, presets: [] }),
    }),
    { name: 'character-storage' }
  )
);
