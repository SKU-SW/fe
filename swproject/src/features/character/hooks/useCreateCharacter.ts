/**
 * @file 캐릭터 생성 훅 - useCreateCharacter
 * @updated Backend Swagger spec alignment - POST /api/v1/characters 응답이 CharacterDetailResDto
 * @dependsOn src/features/character/api/characterApi.ts (createCharacter)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { createCharacter } from '@/features/character/api/characterApi';
import type { CharacterCreateReqDto, CharacterDetailResDto } from '@/shared/types/character';

interface UseCreateCharacterReturn {
  /** 생성된 캐릭터 상세 정보 반환 (성공 시) */
  create: (data: CharacterCreateReqDto) => Promise<CharacterDetailResDto>;
  isPending: boolean;
  error: string | null;
}

export function useCreateCharacter(): UseCreateCharacterReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: CharacterCreateReqDto): Promise<CharacterDetailResDto> => {
      setIsPending(true);
      setError(null);
      try {
        return await createCharacter(data);
      } catch (err: unknown) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        const message =
          axiosErr?.response?.data?.message ??
          (err instanceof Error ? err.message : '캐릭터 생성에 실패했습니다.');
        console.error('[useCreateCharacter] 실패:', err);
        setError(message);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    []
  );

  return { create, isPending, error };
}
