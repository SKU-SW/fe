/**
 * @file 캐릭터 생성 훅 - useCreateCharacter
 * @created Sprint 1 - Character 훅 구현
 * @dependsOn src/features/character/api/characterApi.ts (createCharacter)
 * @dependsOn src/shared/stores/characterStore.ts (addPreset)
 * @usedBy src/app/(dashboard)/character/page.tsx
 */

'use client';

import { useState, useCallback } from 'react';
import { createCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type { CreateCharacterRequest, CharacterPreset } from '@/shared/types/character';

/**
 * useCreateCharacter 훅 반환 타입
 */
interface UseCreateCharacterReturn {
  /** 캐릭터 생성 함수 - 성공 시 CharacterPreset 반환, 실패 시 null */
  create: (data: CreateCharacterRequest) => Promise<CharacterPreset | null>;
  /** 생성 요청 진행 중 여부 */
  isPending: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
}

/**
 * 캐릭터 생성 훅
 * - API 호출 성공 시 characterStore에 프리셋 추가 (addPreset)
 * - 실패 시 null 반환 (에러를 throw하지 않음 - 호출 측에서 null 체크)
 */
export function useCreateCharacter(): UseCreateCharacterReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addPreset = useCharacterStore((s) => s.addPreset);

  const create = useCallback(
    async (data: CreateCharacterRequest) => {
      setIsPending(true);
      setError(null);
      try {
        const character = await createCharacter(data);
        // 생성 성공: store에 프리셋 추가하여 UI 즉시 반영
        addPreset(character);
        return character;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '캐릭터 생성에 실패했습니다.';
        setError(message);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [addPreset]
  );

  return { create, isPending, error };
}
