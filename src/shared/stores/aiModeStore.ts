import { create } from 'zustand';

export type AIMode = 'broadcasting' | 'idle' | 'gaming';
export type ReactionStrategy = 'cheer' | 'normal' | 'critical';

interface AIModeStore {
  mode: AIMode;
  reactionStrategy: ReactionStrategy;
  isAutoStrategy: boolean;
  setMode: (mode: AIMode) => void;
  setReactionStrategy: (strategy: ReactionStrategy) => void;
  setIsAutoStrategy: (isAuto: boolean) => void;
}

export const useAIModeStore = create<AIModeStore>()((set) => ({
  mode: 'idle',
  reactionStrategy: 'normal',
  isAutoStrategy: true,
  setMode: (mode) => set({ mode }),
  setReactionStrategy: (reactionStrategy) => set({ reactionStrategy }),
  setIsAutoStrategy: (isAutoStrategy) => set({ isAutoStrategy }),
}));
