/**
 * @file 캐릭터 삭제 훅 - useDeleteCharacter
 * @created Sprint 1 - Character 훅 구현
 * @dependsOn src/features/character/api/characterApi.ts (deleteCharacter)
 * @dependsOn src/shared/stores/characterStore.ts (selectedId, setSelectedId, removePreset)
 * @usedBy src/app/(dashboard)/character/page.tsx
 */

'use client';

import { useState, useCallback } from 'react';
import { deleteCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';

/**
 * useDeleteCharacter 훅 반환 타입
 */
interface UseDeleteCharacterReturn {
  /** 캐릭터 삭제 함수 - 성공 시 true, 실패 시 false 반환 */
  remove: (characterId: string) => Promise<boolean>;
  /** 삭제 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 캐릭터 삭제 훅
 * - API 호출 성공 시:
 *   1. characterStore에서 프리셋 제거 (removePreset)
 *   2. 삭제된 캐릭터가 선택된 상태였다면 selectedId를 null로 초기화
 *      (선택된 캐릭터가 삭제되면 UI에서 선택 상태가 깨지지 않도록)
 * - 실패 시 false 반환
 */
export function useDeleteCharacter(): UseDeleteCharacterReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedId = useCharacterStore((s) => s.selectedId);
  const setSelectedId = useCharacterStore((s) => s.setSelectedId);
  const removePreset = useCharacterStore((s) => s.removePreset);

  const remove = useCallback(
    async (characterId: string) => {
      setIsPending(true);
      setError(null);
      try {
        await deleteCharacter(characterId);
        // store에서 프리셋 제거
        removePreset(characterId);
        // [중요] 삭제된 캐릭터가 현재 선택되어 있었다면 selectedId 초기화
        // 이렇게 하지 않으면 UI에서 "선택된 캐릭터"가 존재하지 않는 ID를 참조하게 됨
        if (selectedId === characterId) {
          setSelectedId(null);
        }
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '캐릭터 삭제에 실패했습니다.';
        setError(message);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [removePreset, selectedId, setSelectedId]
  );

  return { remove, isPending, error };
}
