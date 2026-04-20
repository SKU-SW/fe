/**
 * @file 캐릭터 수정 훅 - useUpdateCharacter
 * @created Sprint 1 - Character 훅 구현
 * @dependsOn src/features/character/api/characterApi.ts (updateCharacter)
 * @dependsOn src/shared/stores/characterStore.ts (updatePreset)
 * @usedBy src/app/(dashboard)/character/page.tsx
 */

'use client';

import { useState, useCallback } from 'react';
import { updateCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type { UpdateCharacterRequest, CharacterPreset } from '@/shared/types/character';

/**
 * useUpdateCharacter 훅 반환 타입
 */
interface UseUpdateCharacterReturn {
  /** 캐릭터 수정 함수 - 성공 시 CharacterPreset 반환, 실패 시 null */
  update: (characterId: string, data: UpdateCharacterRequest) => Promise<CharacterPreset | null>;
  /** 수정 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 캐릭터 수정 훅
 * - API 호출 성공 시 characterStore에서 해당 프리셋 업데이트 (updatePreset)
 * - UpdateCharacterRequest는 partial이므로 필요한 필드만 수정 가능
 * - 실패 시 null 반환
 */
export function useUpdateCharacter(): UseUpdateCharacterReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updatePreset = useCharacterStore((s) => s.updatePreset);

  const update = useCallback(
    async (characterId: string, data: UpdateCharacterRequest) => {
      setIsPending(true);
      setError(null);
      try {
        const character = await updateCharacter(characterId, data);
        // 수정 성공: store에서 해당 프리셋 업데이트
        updatePreset(characterId, character);
        return character;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '캐릭터 수정에 실패했습니다.';
        setError(message);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [updatePreset]
  );

  return { update, isPending, error };
}
