/**
 * @file 단일 캐릭터 조회 훅 - useCharacter
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/api/characterApi.ts (getCharacter)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { getCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type { CharacterDetailResDto } from '@/shared/types/character';

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

  const fetchCharacter = useCallback(async () => {
    if (characterId === null) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCharacter(characterId);
      setCharacter(data);
      if (data.isSelected) {
        setSelectedCharacter(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '캐릭터 정보를 불러오지 못했습니다.';
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
