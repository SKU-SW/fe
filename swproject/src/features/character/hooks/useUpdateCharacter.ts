/**
 * @file 캐릭터 수정 훅 - useUpdateCharacter
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/api/characterApi.ts (updateCharacter)
 * @dependsOn src/shared/stores/characterStore.ts (updateCharacter)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useCallback } from 'react';
import { updateCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type { CharacterUpdateReqDto, CharacterDetailResDto, CharacterListItemResDto } from '@/shared/types/character';

/**
 * useUpdateCharacter 훅 반환 타입
 */
interface UseUpdateCharacterReturn {
  /** 캐릭터 수정 함수 - 성공 시 CharacterDetailResDto 반환, 실패 시 null */
  update: (characterId: number, data: CharacterUpdateReqDto) => Promise<CharacterDetailResDto | null>;
  /** 수정 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 캐릭터 수정 훅
 * - API 호출 성공 시 characterStore에서 해당 캐릭터 업데이트
 * - CharacterUpdateReqDto는 모든 필드가 필수
 * - 실패 시 null 반환
 */
export function useUpdateCharacter(): UseUpdateCharacterReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateCharacterInStore = useCharacterStore((s) => s.updateCharacter);
  const setSelectedCharacter = useCharacterStore((s) => s.setSelectedCharacter);

  const update = useCallback(
    async (characterId: number, data: CharacterUpdateReqDto) => {
      setIsPending(true);
      setError(null);
      try {
        const character = await updateCharacter(characterId, data);
        // 수정 성공: store에서 해당 캐릭터 업데이트
        const listItem: Partial<CharacterListItemResDto> = {
          characterName: character.characterName,
          triggerWords: character.triggerWords,
          gender: character.gender,
          voiceTypeId: character.voiceTypeId,
          characterImageUrl: character.characterImageUrl,
          characterPersona: character.characterPersona,
          isSelected: character.isSelected,
        };
        updateCharacterInStore(characterId, listItem);
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
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [setSelectedCharacter, updateCharacterInStore]
  );

  return { update, isPending, error };
}
