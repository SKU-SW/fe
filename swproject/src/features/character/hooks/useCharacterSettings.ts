/**
 * @file 캐릭터 설정 프리셋 조회 훅 - useCharacterSettings
 * @created Sprint 1 - Character 훅 구현
 * @updated Backend Swagger spec alignment
 * @dependsOn src/features/character/api/characterApi.ts (getCharacterSettings)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import { getCharacterSettings } from '@/features/character/api/characterApi';
import type { CharacterSettingsResDto } from '@/shared/types/character';

/**
 * useCharacterSettings 훅 반환 타입
 */
interface UseCharacterSettingsReturn {
  /** 캐릭터 설정 옵션 (음성 타입, 캐릭터 이미지, 프리셋 타입, 말투, 성격 등) */
  settings: CharacterSettingsResDto | null;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 메시지 (실패 시) */
  error: string | null;
  /** 수동 재조회 함수 */
  refetch: () => Promise<void>;
}

/**
 * 캐릭터 설정 옵션 조회 훅
 * - enabled가 true일 때만 API 호출
 * - 캐릭터 생성/수정 시 선택 가능한 옵션 목록을 제공
 *   (음성 타입, 캐릭터 이미지, 프리셋 타입, 말투 스타일, 성격 타입)
 * - 로컬 state로 관리 (전역 store에 저장하지 않음 - 폼에서만 사용)
 */
export function useCharacterSettings(enabled = true): UseCharacterSettingsReturn {
  const [settings, setSettings] = useState<CharacterSettingsResDto | null>(null);
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

  // enabled가 true일 때만 자동 조회
  useEffect(() => {
    if (enabled) {
      void fetchSettings();
    }
  }, [fetchSettings, enabled]);

  return { settings, isLoading, error, refetch: fetchSettings };
}
