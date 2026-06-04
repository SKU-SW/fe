/**
 * @file 치지직 연동 상태 조회 훅 - useChzzkStatus
 * @created Sprint Chzzk - 치지직 연동 UI
 * @updated Backend Swagger spec alignment - authorized/accessTokenExpired/refreshTokenExpired
 * @dependsOn src/features/auth/api/authApi.ts (getChzzkStatus)
 * @usedBy src/pages/SettingsPage.tsx, src/features/auth/components/ChzzkStatusBadge.tsx
 *
 * GET /api/v1/user/chzzk 를 조회해
 * authorized (연동 여부), accessTokenExpired, refreshTokenExpired 상태를 반환한다.
 */

import { useCallback, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { getChzzkStatus } from '@/features/auth/api/authApi';
import type { ChzzkStatusResponse } from '@/shared/types/auth';

interface UseChzzkStatusReturn {
  status: ChzzkStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  /** 강제 재조회 — 외부 브라우저에서 연동 완료 후 호출 */
  refetch: () => Promise<void>;
}

export function useChzzkStatus(): UseChzzkStatusReturn {
  const [status, setStatus] = useState<ChzzkStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getChzzkStatus();
      setStatus(response);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const message = axiosErr?.response?.data?.message
        ?? (err instanceof Error ? err.message : '치지직 연동 상태 조회에 실패했습니다.');
      setError(message);
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  return { status, isLoading, error, refetch: fetchStatus };
}
