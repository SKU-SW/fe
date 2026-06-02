/**
 * @file STT 전역 런타임 상태 저장소
 * @dependsOn zustand
 * @usedBy src/features/stt/hooks/useSTT.ts, src/services/sttBackgroundService.ts, src/pages/DashboardPage.tsx
 */

import { create } from "zustand";

interface STTStore {
  isListening: boolean;
  isSupported: boolean;
  isBusy: boolean;
  error: string | null;
  setIsListening: (isListening: boolean) => void;
  setIsSupported: (isSupported: boolean) => void;
  setIsBusy: (isBusy: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useSTTStore = create<STTStore>((set) => ({
  isListening: false,
  isSupported: false,
  isBusy: false,
  error: null,
  setIsListening: (isListening) => set({ isListening }),
  setIsSupported: (isSupported) => set({ isSupported }),
  setIsBusy: (isBusy) => set({ isBusy }),
  setError: (error) => set({ error }),
  reset: () => set({ isListening: false, isSupported: false, isBusy: false, error: null }),
}));
