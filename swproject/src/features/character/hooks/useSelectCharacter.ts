/**
 * @file 캐릭터 선택/해제 훅 - useSelectCharacter
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/api/characterApi.ts (selectCharacter)
 * @dependsOn src/shared/stores/characterStore.ts (selectedCharacterId, setSelectedCharacterId)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { selectCharacter } from '@/features/character/api/characterApi';
import { useCharacterStore } from '@/shared/stores/characterStore';
import type { CharacterSelectResDto } from '@/shared/types/character';

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
  const setSelectedCharacter = useCharacterStore((s) => s.setSelectedCharacter);

  const select = useCallback(
    async (characterId: number, isSelected: boolean) => {
      setIsPending(true);
      setError(null);
      try {
        const result = await selectCharacter(characterId, { isSelected });
        // 선택 상태에 따라 store 업데이트
        if (isSelected) {
          // BE 응답이 비정상(누락/null/타입 어긋남) 인 경우 요청한 characterId 로 fallback.
          // - BE 가 정상이면 result.selectedCharacterId === characterId 일 것
          // - 어긋나면 콘솔 경고 후 요청 ID 우선 (FE 의도와 BE 진실 사이의 안전망)
          const returnedId = result.selectedCharacterId;
          if (typeof returnedId !== 'number' || returnedId !== characterId) {
            console.warn(
              '[useSelectCharacter] PATCH 응답의 selectedCharacterId 가 요청과 다릅니다.',
              { requested: characterId, returned: returnedId }
            );
          }
          setSelectedCharacterId(typeof returnedId === 'number' ? returnedId : characterId);
        } else {
          setSelectedCharacterId(null);
        }
        return result;
      } catch (err: unknown) {
        const message = getAxiosErrorMessage(err, '캐릭터 선택에 실패했습니다.');
        const axiosErr = err as AxiosError;
        const status = axiosErr.response?.status;
        if (import.meta.env.DEV) {
          console.error('[useSelectCharacter] PATCH /api/v1/characters/:id 실패', {
            characterId,
            isSelected,
            status,
            data: axiosErr.response?.data,
            message,
          });
        }
        if (status === 404 && useCharacterStore.getState().selectedCharacterId === characterId) {
          setSelectedCharacterId(null);
          setSelectedCharacter(null);
        }
        setError(message);
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [setSelectedCharacter, setSelectedCharacterId]
  );

  return { select, isPending, error };
}
