/**
 * @file 캐릭터 선택/해제 훅 - useSelectCharacter
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/api/characterApi.ts (selectCharacter)
 * @dependsOn src/shared/stores/characterStore.ts (selectedCharacterId, setSelectedCharacterId)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useCallback } from 'react';
import { selectCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type { CharacterSelectResDto } from '@/shared/types/character';

/**
 * useSelectCharacter 훅 반환 타입
 */
interface UseSelectCharacterReturn {
  /** 캐릭터 선택/해제 함수 - 성공 시 CharacterSelectResDto 반환, 실패 시 null */
  select: (characterId: number, isSelected: boolean) => Promise<CharacterSelectResDto | null>;
  /** 선택 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 캐릭터 선택/해제 훅
 * - API 호출: PATCH /api/v1/characters/:characterId with { isSelected: boolean }
 * - 성공 시 CharacterSelectResDto 반환 (selectedCharacterId, deselectedCharacterId)
 * - store의 selectedCharacterId를 업데이트
 */
export function useSelectCharacter(): UseSelectCharacterReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSelectedCharacterId = useCharacterStore((s) => s.setSelectedCharacterId);

  const select = useCallback(
    async (characterId: number, isSelected: boolean) => {
      setIsPending(true);
      setError(null);
      try {
        const result = await selectCharacter(characterId, { isSelected });
        // 선택 상태에 따라 store 업데이트
        setSelectedCharacterId(isSelected ? result.selectedCharacterId : null);
        return result;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '캐릭터 선택에 실패했습니다.';
        setError(message);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [setSelectedCharacterId]
  );

  return { select, isPending, error };
}
