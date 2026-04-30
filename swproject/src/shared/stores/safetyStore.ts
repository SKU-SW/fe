/**
 * @file 안전관리(유해 단어 필터) 상태 관리 Zustand Store
 * @created 안전관리 페이지 신설
 * @usedBy src/pages/SafetyPage.tsx
 *
 * LLM이 필터링할 유해 단어 목록을 저장합니다. localStorage에 자동 저장.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SafetyStore {
  /** 유해 단어 목록 (입력 순서 유지, 중복 없음) */
  words: string[];
  /** 단어 추가 (trim + 중복 시 무시). 추가 성공 여부 반환 */
  addWord: (word: string) => boolean;
  /** 단어 제거 */
  removeWord: (word: string) => void;
  /** 모든 단어 삭제 */
  clearWords: () => void;
}

export const useSafetyStore = create<SafetyStore>()(
  persist(
    (set, get) => ({
      words: [],
      addWord: (word) => {
        const trimmed = word.trim();
        if (!trimmed) return false;
        if (get().words.includes(trimmed)) return false;
        set((state) => ({ words: [...state.words, trimmed] }));
        return true;
      },
      removeWord: (word) =>
        set((state) => ({ words: state.words.filter((w) => w !== word) })),
      clearWords: () => set({ words: [] }),
    }),
    { name: 'safety-storage' }
  )
);
