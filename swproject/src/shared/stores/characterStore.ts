/**
 * @file 캐릭터(Character) 상태 관리 Zustand Store
 * @created Sprint 1 - Character Store 구현 (Sprint 1에서 selectedId, addPreset, updatePreset, removePreset 추가)
 * @dependsOn src/shared/types/character.ts (CharacterInfo, BroadcastSettings, CharacterPreset)
 * @usedBy src/features/character/hooks/*.ts (모든 캐릭터 훅)
 * @usedBy src/app/(dashboard)/character/page.tsx (캐릭터 관리 페이지)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterInfo, BroadcastSettings, CharacterPreset } from '@/shared/types/character';

/**
 * 캐릭터 Store 인터페이스
 * - info: 현재 선택된 캐릭터의 정보
 * - broadcastSettings: 현재 선택된 캐릭터의 방송 설정
 * - presets: 저장된 캐릭터 프리셋 목록
 * - selectedId: [Sprint 1 수정] 현재 선택된 캐릭터의 ID (토글 선택용)
 */
interface CharacterStore {
  info: CharacterInfo | null;
  broadcastSettings: BroadcastSettings | null;
  presets: CharacterPreset[];
  selectedId: string | null; // [Sprint 1 수정] 선택된 캐릭터 ID (토글 선택/해제용)
  setInfo: (info: CharacterInfo) => void;
  setBroadcastSettings: (settings: BroadcastSettings) => void;
  setPresets: (presets: CharacterPreset[]) => void;
  setSelectedId: (id: string | null) => void;
  /** [Sprint 1 수정] 새 프리셋을 목록에 추가 */
  addPreset: (preset: CharacterPreset) => void;
  /** [Sprint 1 수정] 기존 프리셋을 부분 업데이트 */
  updatePreset: (id: string, preset: Partial<CharacterPreset>) => void;
  /** [Sprint 1 수정] 프리셋을 목록에서 제거 */
  removePreset: (id: string) => void;
  /** 모든 캐릭터 상태 초기화 */
  reset: () => void;
}

/**
 * 캐릭터 상태 Store
 * - zustand persist 미들웨어로 localStorage에 자동 저장 (key: 'character-storage')
 * - selectedId: 캐릭터 목록에서 하나를 선택/해제할 때 사용 (토글 방식)
 */
export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      info: null,
      broadcastSettings: null,
      presets: [],
      selectedId: null, // [Sprint 1 수정] 초기값 추가
      setInfo: (info) => set({ info }),
      setBroadcastSettings: (broadcastSettings) => set({ broadcastSettings }),
      setPresets: (presets) => set({ presets }),
      setSelectedId: (selectedId) => set({ selectedId }),
      // [Sprint 1 수정] 새 프리셋 추가 - 기존 목록에 append
      addPreset: (preset) => set((state) => ({ presets: [...state.presets, preset] })),
      // [Sprint 1 수정] 기존 프리셋 업데이트 - ID 매칭으로 부분 병합
      updatePreset: (id, preset) =>
        set((state) => ({
          presets: state.presets.map((p) => (p.id === id ? { ...p, ...preset } : p)),
        })),
      // [Sprint 1 수정] 프리셋 제거 - ID 매칭으로 필터링
      removePreset: (id) =>
        set((state) => ({ presets: state.presets.filter((p) => p.id !== id) })),
      reset: () => set({ info: null, broadcastSettings: null, presets: [], selectedId: null }),
    }),
    { name: 'character-storage' }
  )
);
