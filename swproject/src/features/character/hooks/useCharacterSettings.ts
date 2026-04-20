/**
 * @file 캐릭터 설정 프리셋 조회 훅 - useCharacterSettings
 * @created Sprint 1 - Character 훅 구현
 * @dependsOn src/features/character/api/characterApi.ts (getCharacterSettings)
 * @usedBy 캐릭터 생성/수정 폼에서 선택 옵션을 표시할 때 사용
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getCharacterSettings } from '@/features/character/api/characterApi';
import type { CharacterSettingsResponse } from '@/shared/types/character';

/**
 * useCharacterSettings 훅 반환 타입
 */
interface UseCharacterSettingsReturn {
  /** 캐릭터 설정 옵션 (성별, 말투, 성격, 프리셋 목록 등) */
  settings: CharacterSettingsResponse | null;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
  /** 수동 재조회 함수 */
  refetch: () => Promise<void>;
}

/**
 * 캐릭터 설정 옵션 조회 훅
 * - 마운트 시 자동으로 설정 옵션을 API에서 가져옴
 * - 캐릭터 생성/수정 시 선택 가능한 옵션 목록을 제공
 *   (성별, 말투, 성격, 페르소나, 민감도, 외형 프리셋, 음성 프리셋)
 * - 로컬 state로 관리 (전역 store에 저장하지 않음 - 폼에서만 사용)
 */
export function useCharacterSettings(): UseCharacterSettingsReturn {
  const [settings, setSettings] = useState<CharacterSettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCharacterSettings();
      setSettings(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '설정 정보를 불러오지 못했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 마운트 시 자동 조회
  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  return { settings, isLoading, error, refetch: fetchSettings };
}
