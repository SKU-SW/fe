/**
 * @file 캐릭터 생성 훅 - useCreateCharacter
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/api/characterApi.ts (createCharacter)
 * @dependsOn src/shared/stores/characterStore.ts (addCharacter)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useCallback } from 'react';
import { createCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type { CharacterCreateReqDto, CharacterDetailResDto, CharacterListItemResDto } from '@/shared/types/character';

/**
 * useCreateCharacter 훅 반환 타입
 */
interface UseCreateCharacterReturn {
  /** 캐릭터 생성 함수 - 성공 시 CharacterDetailResDto 반환, 실패 시 null */
  create: (data: CharacterCreateReqDto) => Promise<CharacterDetailResDto | null>;
  /** 생성 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 캐릭터 생성 훅
 * - API 호출 성공 시 characterStore에 캐릭터 추가 (addCharacter)
 * - 실패 시 null 반환 (에러를 throw하지 않음 - 호출 측에서 null 체크)
 */
export function useCreateCharacter(): UseCreateCharacterReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addCharacter = useCharacterStore((s) => s.addCharacter);

  const create = useCallback(
    async (data: CharacterCreateReqDto) => {
      setIsPending(true);
      setError(null);
      try {
        const character = await createCharacter(data);
        // 생성 성공: store에 목록 항목 추가하여 UI 즉시 반영
        const listItem: CharacterListItemResDto = {
          characterId: character.characterId,
          characterName: character.characterName,
          triggerWords: character.triggerWords,
          gender: character.gender,
          voiceTypeId: character.voiceTypeId,
          characterImageUrl: character.characterImageUrl,
          isSelected: character.isSelected,
        };
        addCharacter(listItem);
        return character;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '캐릭터 생성에 실패했습니다.';
        setError(message);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [addCharacter]
  );

  return { create, isPending, error };
}
