/**
 * @file 캐릭터 선택/해제 토글 훅 - useSelectCharacter
 * @created Sprint 1 - Character 훅 구현
 * @dependsOn src/features/character/api/characterApi.ts (selectCharacter)
 * @dependsOn src/shared/stores/characterStore.ts (selectedId, setSelectedId)
 * @usedBy src/app/(dashboard)/character/page.tsx
 */

'use client';

import { useState, useCallback } from 'react';
import { selectCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';

/**
 * useSelectCharacter 훅 반환 타입
 */
interface UseSelectCharacterReturn {
  /** 캐릭터 선택/해제 토글 함수 - 성공 시 true, 실패 시 false 반환 */
  select: (characterId: string) => Promise<boolean>;
  /** 선택 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 캐릭터 선택/해제 토글 훅
 * - API 호출 후 selectedId를 토글 방식으로 업데이트:
 *   - 이미 선택된 캐릭터를 다시 클릭하면 해제 (null)
 *   - 선택되지 않은 캐릭터를 클릭하면 선택 (characterId)
 * - 서버에는 항상 selectCharacter PATCH 요청을 보냄 (선택/해제 구분 없이)
 */
export function useSelectCharacter(): UseSelectCharacterReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedId = useCharacterStore((s) => s.selectedId);
  const setSelectedId = useCharacterStore((s) => s.setSelectedId);

  const select = useCallback(
    async (characterId: string) => {
      setIsPending(true);
      setError(null);
      try {
        await selectCharacter(characterId);
        // 토글 방식: 이미 선택된 캐릭터면 해제, 아니면 선택
        setSelectedId(selectedId === characterId ? null : characterId);
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '캐릭터 선택에 실패했습니다.';
        setError(message);
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [selectedId, setSelectedId]
  );

  return { select, isPending, error };
}
