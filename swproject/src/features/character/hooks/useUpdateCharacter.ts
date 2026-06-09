/**
 * @file 캐릭터 수정 훅 - useUpdateCharacter
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment - PUT /api/v1/characters/:id 이 CharacterDetailResDto 를 반환
 * @dependsOn src/features/character/api/characterApi.ts (updateCharacter)
 * @dependsOn src/shared/stores/characterStore.ts (updateCharacter)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useCallback } from 'react';
import { updateCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type {
  CharacterUpdateReqDto,
  CharacterListItemResDto,
  CharacterDetailResDto,
} from '@/shared/types/character';

/**
 * useUpdateCharacter 훅 반환 타입
 */
interface UseUpdateCharacterReturn {
  /** 캐릭터 수정 함수 - 성공 시 갱신된 CharacterDetailResDto 반환 */
  update: (characterId: number, data: CharacterUpdateReqDto) => Promise<CharacterDetailResDto>;
  /** 수정 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 캐릭터 수정 훅
 * - PUT 응답으로 받은 CharacterDetailResDto 로 store 즉시 갱신 (별도 GET 재조회 불필요)
 * - CharacterUpdateReqDto 는 모든 필드가 필수
 */
export function useUpdateCharacter(): UseUpdateCharacterReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateCharacterInStore = useCharacterStore((s) => s.updateCharacter);
  const setSelectedCharacter = useCharacterStore((s) => s.setSelectedCharacter);
  const setCharacterDetail = useCharacterStore((s) => s.setCharacterDetail);

  const update = useCallback(
    async (characterId: number, data: CharacterUpdateReqDto): Promise<CharacterDetailResDto> => {
      setIsPending(true);
      setError(null);
      try {
        const character = await updateCharacter(characterId, data);
        // store 의 목록 아이템 갱신
        const listItem: Partial<CharacterListItemResDto> = {
          characterName: character.characterName,
          triggerWords: character.triggerWords,
          gender: character.gender,
          characterAppearanceType: character.characterAppearanceType,
          modelType: character.modelType,
          characterImageId: character.characterImageId,
          characterImageUrl: character.characterImageUrl,
          vrmPresetId: character.vrmPresetId,
          vrmUrl: character.vrmUrl,
          vrmThumbnailUrl: character.vrmThumbnailUrl,
          characterPersona: character.characterPersona,
          isSelected: character.isSelected,
        };
        updateCharacterInStore(characterId, listItem);
        setCharacterDetail(character);
        if (character.isSelected) {
          setSelectedCharacter(character);
        }
        return character;
      } catch (err: unknown) {
        const axiosErr = err as import('axios').AxiosError<{ message?: string }>;
        const message =
          axiosErr?.response?.data?.message ??
          (err instanceof Error ? err.message : '캐릭터 수정에 실패했습니다.');
        console.error('[useUpdateCharacter] 실패:', err);
        setError(message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [setCharacterDetail, setSelectedCharacter, updateCharacterInStore]
  );

  return { update, isPending, error };
}
