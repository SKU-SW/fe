/**
 * @file 캐릭터 목록 조회 훅 - useCharacters
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/api/characterApi.ts (getCharacters)
 * @dependsOn src/shared/stores/characterStore.ts (setCharacters, characters)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { getCharacters, getCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import { normalizeCharacterImageUrlToDefault } from '@/shared/lib/characterEmotionImages';
import type { CharacterListItemResDto } from '@/shared/types/character';

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
 * useCharacters 훅 반환 타입
 */
interface UseCharactersReturn {
  /** 캐릭터 목록 */
  characters: CharacterListItemResDto[];
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
  /** hasNext 페이지네이션 플래그 */
  hasNext: boolean;
  /** 수동 재조회 함수 */
  refetch: () => Promise<void>;
}

/**
 * 캐릭터 목록 조회 훅
 * - 마운트 시 자동으로 캐릭터 목록을 API에서 가져옴
 * - 조회 결과를 characterStore.characters에 저장 (전역 상태 공유)
 * - refetch로 수동 재조회 가능 (삭제 후 목록 갱신 등)
 */
export function useCharacters(): UseCharactersReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const characters = useCharacterStore((s) => s.characters);
  const setCharacters = useCharacterStore((s) => s.setCharacters);
  const setCharacterDetail = useCharacterStore((s) => s.setCharacterDetail);

  const fetchCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Swagger: page 는 1-based (백엔드 정렬 기준)
      const response = await getCharacters(1, 10);
      setCharacters(response.content);
      setHasNext(response.hasNext);

      // 목록 API가 characterPersona를 생략하는 경우 대비: 상세를 병렬 조회해 캐시에 저장
      void Promise.all(
        response.content.map(async (item) => {
          try {
            const detail = await getCharacter(item.characterId);
            setCharacterDetail({
              ...detail,
              characterImageUrl: normalizeCharacterImageUrlToDefault(detail.characterImageUrl),
            });
          } catch {
            // 개별 실패는 무시 — 목록 렌더링을 막지 않음
          }
        })
      );
    } catch (err: unknown) {
      const message = getAxiosErrorMessage(err, '캐릭터 목록을 불러오지 못했습니다.');
      if (import.meta.env.DEV) {
        const axiosErr = err as AxiosError;
        console.error('[useCharacters] GET /api/v1/characters 실패', {
          status: axiosErr.response?.status,
          data: axiosErr.response?.data,
          message,
        });
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setCharacters]);

  // 마운트 시 자동 조회
  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  return { characters, isLoading, error, hasNext, refetch: fetchCharacters };
}
