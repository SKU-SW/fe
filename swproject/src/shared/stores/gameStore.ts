/**
 * @file 게임 연동 스토어
 * @created Game Integration - gameStore
 * @dependsOn src/shared/types/game.ts
 * @usedBy src/pages/GamePage.tsx
 *
 * - triggerSettings, reactionSpeed: persist (사용자 설정)
 * - isGameRunning, gameState: 런타임 only (게임 종료 시 초기화)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AIReactionSpeed, GameEventTriggerSettings, LolAllGameData } from '@/shared/types/game';

const DEFAULT_TRIGGERS: GameEventTriggerSettings = {
  kill: true,
  death: true,
  assist: false,
  multi_kill: true,
  objective: false,
  victory: true,
  defeat: true,
};

interface GameStore {
  // 사용자 설정 (persist)
  triggerSettings: GameEventTriggerSettings;
  reactionSpeed: AIReactionSpeed;
  // 런타임 상태 (ephemeral)
  isGameRunning: boolean;
  gameState: LolAllGameData | null;
  // 액션
  setTrigger: (key: keyof GameEventTriggerSettings, value: boolean) => void;
  setReactionSpeed: (speed: AIReactionSpeed) => void;
  setIsGameRunning: (v: boolean) => void;
  setGameState: (state: LolAllGameData | null) => void;
  resetRuntime: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      triggerSettings: DEFAULT_TRIGGERS,
      reactionSpeed: 'normal',
      isGameRunning: false,
      gameState: null,

      setTrigger: (key, value) =>
        set((s) => ({ triggerSettings: { ...s.triggerSettings, [key]: value } })),
      setReactionSpeed: (speed) => set({ reactionSpeed: speed }),
      setIsGameRunning: (isGameRunning) => set({ isGameRunning }),
      setGameState: (gameState) => set({ gameState }),
      resetRuntime: () => set({ isGameRunning: false, gameState: null }),
    }),
    {
      name: 'game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        triggerSettings: s.triggerSettings,
        reactionSpeed: s.reactionSpeed,
      }),
    }
  )
);
