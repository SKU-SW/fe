/**
 * @file 캐릭터(Character) 상태 관리 Zustand Store
 * @created Sprint 1 - Character Store 구현
 * @updated Backend Swagger spec alignment
 * @updated characterImageUrl 정규화 — BE 단일 조회 응답이 잘못된 감정 파일명을 줄 때 Default 로 강제 치환
 * @dependsOn src/shared/types/character.ts (CharacterDetailResDto, CharacterListItemResDto)
 * @dependsOn src/shared/lib/characterEmotionImages.ts (normalizeCharacterImageUrlToDefault)
 * @usedBy src/features/character/hooks/*.ts (모든 캐릭터 훅)
 * @usedBy src/pages/CharacterPage.tsx (캐릭터 관리 페이지)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterDetailResDto, CharacterListItemResDto } from '@/shared/types/character';
import { normalizeCharacterImageUrlToDefault } from '@/shared/lib/characterEmotionImages';

/**
 * 캐릭터 Store 인터페이스
 * - characters: 캐릭터 목록
 * - selectedCharacterId: 현재 선택된 캐릭터 ID
 * - selectedCharacter: 현재 선택된 캐릭터 상세 정보
 * - characterDetailsMap: 상세 조회 캐시 (characterId → CharacterDetailResDto)
 */
interface CharacterStore {
  characters: CharacterListItemResDto[];
  selectedCharacterId: number | null;
  selectedCharacter: CharacterDetailResDto | null;
  characterDetailsMap: Record<number, CharacterDetailResDto>;
  setCharacters: (characters: CharacterListItemResDto[]) => void;
  setSelectedCharacterId: (id: number | null) => void;
  setSelectedCharacter: (character: CharacterDetailResDto | null) => void;
  /** 단일 캐릭터 상세를 캐시에 저장 */
  setCharacterDetail: (character: CharacterDetailResDto) => void;
  /** 새 캐릭터를 목록에 추가 */
  addCharacter: (character: CharacterListItemResDto) => void;
  /** 기존 캐릭터를 부분 업데이트 */
  updateCharacter: (characterId: number, character: Partial<CharacterListItemResDto>) => void;
  /** 캐릭터를 목록에서 제거 */
  removeCharacter: (characterId: number) => void;
  /** 모든 캐릭터 상태 초기화 */
  reset: () => void;
}

// ============================================================
// 정규화 헬퍼 — characterImageUrl 이 감정 파일명(Angry.png 등)으로 와도 Default.png 로 변환
// BE 단일 조회 응답 불일치 대응. 모든 set 진입 지점에서 호출.
// ============================================================

function normalizeListItem(item: CharacterListItemResDto): CharacterListItemResDto {
  if (!item.characterImageUrl) return item;
  const normalized = normalizeCharacterImageUrlToDefault(item.characterImageUrl);
  return normalized === item.characterImageUrl ? item : { ...item, characterImageUrl: normalized };
}

function normalizeDetail(item: CharacterDetailResDto): CharacterDetailResDto {
  if (!item.characterImageUrl) return item;
  const normalized = normalizeCharacterImageUrlToDefault(item.characterImageUrl);
  return normalized === item.characterImageUrl ? item : { ...item, characterImageUrl: normalized };
}

/**
 * 캐릭터 상태 Store
 * - zustand persist 미들웨어로 localStorage에 자동 저장 (key: 'character-storage')
 * - characterImageUrl 은 set / hydrate 시점에 항상 Default.png 로 정규화 — UI 가 일관된 표시 유지
 */
export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      characters: [],
      selectedCharacterId: null,
      selectedCharacter: null,
      characterDetailsMap: {},
      setCharacters: (characters) =>
        set({ characters: characters.map(normalizeListItem) }),
      setSelectedCharacterId: (selectedCharacterId) => set({ selectedCharacterId }),
      setSelectedCharacter: (selectedCharacter) =>
        set({ selectedCharacter: selectedCharacter ? normalizeDetail(selectedCharacter) : null }),
      setCharacterDetail: (character) =>
        set((state) => ({
          characterDetailsMap: {
            ...state.characterDetailsMap,
            [character.characterId]: normalizeDetail(character),
          },
        })),
      addCharacter: (character) =>
        set((state) => ({ characters: [...state.characters, normalizeListItem(character)] })),
      updateCharacter: (characterId, character) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.characterId === characterId
              ? normalizeListItem({ ...c, ...character })
              : c
          ),
        })),
      removeCharacter: (characterId) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.characterId !== characterId),
        })),
      reset: () => set({ characters: [], selectedCharacterId: null, selectedCharacter: null, characterDetailsMap: {} }),
    }),
    {
      name: 'character-storage',
      partialize: (state) => ({
        characters: state.characters,
        selectedCharacterId: state.selectedCharacterId,
        selectedCharacter: state.selectedCharacter,
        characterDetailsMap: state.characterDetailsMap,
      }),
      // hydrate 시점에 stale 데이터(localStorage 에 이미 Angry 로 저장된 항목) 도 즉시 정규화
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.characters = state.characters.map(normalizeListItem);
        if (state.selectedCharacter) {
          state.selectedCharacter = normalizeDetail(state.selectedCharacter);
        }
        if (state.characterDetailsMap) {
          const normalized: Record<number, CharacterDetailResDto> = {};
          for (const [key, detail] of Object.entries(state.characterDetailsMap)) {
            normalized[Number(key)] = normalizeDetail(detail as CharacterDetailResDto);
          }
          state.characterDetailsMap = normalized;
        }
      },
    }
  )
);
