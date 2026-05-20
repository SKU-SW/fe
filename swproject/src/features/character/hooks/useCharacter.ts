/**
 * @file 단일 캐릭터 조회 훅 - useCharacter
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/api/characterApi.ts (getCharacter)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { getCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import { normalizeCharacterImageUrlToDefault } from '@/shared/lib/characterEmotionImages';
import type { CharacterDetailResDto } from '@/shared/types/character';

function getAxiosErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string; error?: string } | string>;
  const responseData = axiosErr?.response?.data;

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    const message = responseData.message ?? responseData.error;
    if (message) return message;
  }

  return err instanceof Error ? err.message : fallback;
}

/**
 * useCharacter 훅 반환 타입
 */
interface UseCharacterReturn {
  /** 조회된 캐릭터 정보 (characterId가 null이면 null) */
  character: CharacterDetailResDto | null;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
  /** 수동 재조회 함수 */
  refetch: () => Promise<void>;
}

/**
 * 단일 캐릭터 조회 훅
 * - characterId가 null이면 API 호출을 건너뜀
 * - 로컬 state로 관리 (store와 분리 - 단일 조회용)
 */
export function useCharacter(characterId: number | null): UseCharacterReturn {
  const [character, setCharacter] = useState<CharacterDetailResDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSelectedCharacter = useCharacterStore((s) => s.setSelectedCharacter);
  const setCharacterDetail = useCharacterStore((s) => s.setCharacterDetail);

  const fetchCharacter = useCallback(async () => {
    if (characterId === null) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCharacter(characterId);
      // BE 가 단일 조회 응답에서 잘못된 감정 파일명(Angry.png 등) 을 줄 때 Default 로 정규화
      const normalized: CharacterDetailResDto = {
        ...data,
        characterImageUrl: normalizeCharacterImageUrlToDefault(data.characterImageUrl),
      };
      setCharacter(normalized);
      setCharacterDetail(normalized);
      if (normalized.isSelected) {
        setSelectedCharacter(normalized);
      }
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, '캐릭터 정보를 불러오지 못했습니다.');
      if (import.meta.env.DEV) {
        const axiosErr = err as AxiosError;
        console.error('[useCharacter] GET /api/v1/characters/:id 실패', {
          characterId,
          status: axiosErr.response?.status,
          data: axiosErr.response?.data,
          message,
        });
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [characterId, setSelectedCharacter]);

  // characterId 변경 시 자동 조회
  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  return { character, isLoading, error, refetch: fetchCharacter };
}
