/**
 * @file 캐릭터 목록 조회 훅 - useCharacters
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/api/characterApi.ts (getCharacters)
 * @dependsOn src/shared/stores/characterStore.ts (setCharacters, characters)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { getCharacters } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type { CharacterListItemResDto } from '@/shared/types/character';

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

  const fetchCharacters = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getCharacters();
      // API 결과를 store에 저장하여 다른 컴포넌트와 공유
      setCharacters(response.content);
      setHasNext(response.hasNext);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '캐릭터 목록을 불러오지 못했습니다.';
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
