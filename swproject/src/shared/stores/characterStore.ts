/**
 * @file 캐릭터(Character) 상태 관리 Zustand Store
 * @created Sprint 1 - Character Store 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/shared/types/character.ts (CharacterDetailResDto, CharacterListItemResDto)
 * @usedBy src/features/character/hooks/*.ts (모든 캐릭터 훅)
 * @usedBy src/pages/CharacterPage.tsx (캐릭터 관리 페이지)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterDetailResDto, CharacterListItemResDto } from '@/shared/types/character';

/**
 * 캐릭터 Store 인터페이스
 * - characters: 캐릭터 목록
 * - selectedCharacterId: 현재 선택된 캐릭터 ID
 * - selectedCharacter: 현재 선택된 캐릭터 상세 정보
 */
interface CharacterStore {
  characters: CharacterListItemResDto[];
  selectedCharacterId: number | null;
  selectedCharacter: CharacterDetailResDto | null;
  setCharacters: (characters: CharacterListItemResDto[]) => void;
  setSelectedCharacterId: (id: number | null) => void;
  setSelectedCharacter: (character: CharacterDetailResDto | null) => void;
  /** 새 캐릭터를 목록에 추가 */
  addCharacter: (character: CharacterListItemResDto) => void;
  /** 기존 캐릭터를 부분 업데이트 */
  updateCharacter: (characterId: number, character: Partial<CharacterListItemResDto>) => void;
  /** 캐릭터를 목록에서 제거 */
  removeCharacter: (characterId: number) => void;
  /** 모든 캐릭터 상태 초기화 */
  reset: () => void;
}

/**
 * 캐릭터 상태 Store
 * - zustand persist 미들웨어로 localStorage에 자동 저장 (key: 'character-storage')
 */
export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      characters: [],
      selectedCharacterId: null,
      selectedCharacter: null,
      setCharacters: (characters) => set({ characters }),
      setSelectedCharacterId: (selectedCharacterId) => set({ selectedCharacterId }),
      setSelectedCharacter: (selectedCharacter) => set({ selectedCharacter }),
      addCharacter: (character) => set((state) => ({ characters: [...state.characters, character] })),
      updateCharacter: (characterId, character) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.characterId === characterId ? { ...c, ...character } : c
          ),
        })),
      removeCharacter: (characterId) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.characterId !== characterId),
        })),
      reset: () => set({ characters: [], selectedCharacterId: null, selectedCharacter: null }),
    }),
    {
      name: 'character-storage',
      partialize: (state) => ({
        characters: state.characters,
        selectedCharacterId: state.selectedCharacterId,
        selectedCharacter: state.selectedCharacter,
      }),
    }
  )
);
