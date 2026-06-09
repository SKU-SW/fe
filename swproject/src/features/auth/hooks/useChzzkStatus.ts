/**
 * @file 치지직 연동 상태 조회 훅 - useChzzkStatus
 * @created Sprint Chzzk - 치지직 연동 UI
 * @updated Backend Swagger spec alignment - authorized/accessTokenExpired/refreshTokenExpired
 * @dependsOn src/features/auth/api/authApi.ts (getChzzkStatus)
 * @dependsOn src/shared/stores/alarmStore.ts
 * @usedBy src/pages/SettingsPage.tsx, src/features/auth/components/ChzzkStatusBadge.tsx
 *
 * GET /api/v1/user/chzzk 를 조회해
 * authorized (연동 여부), accessTokenExpired, refreshTokenExpired 상태를 반환한다.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { getChzzkStatus } from '@/features/auth/api/authApi';
import { useAlarmStore } from '@/shared/stores/alarmStore';
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
  const pushAlarm = useAlarmStore((s) => s.push);
  const prevAuthorizedRef = useRef<boolean | null>(null);
  const prevExpiredRef = useRef<boolean | null>(null);

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

  useEffect(() => {
    if (!status) return;

    if (prevAuthorizedRef.current === false && status.authorized) {
      pushAlarm('chzzk.linked');
    }

    if (prevAuthorizedRef.current === true && !status.authorized) {
      pushAlarm('chzzk.unlinked');
    }

    if (prevExpiredRef.current === false && status.refreshTokenExpired) {
      pushAlarm('chzzk.expired');
    }

    prevAuthorizedRef.current = status.authorized;
    prevExpiredRef.current = status.refreshTokenExpired;
  }, [pushAlarm, status]);

  return { status, isLoading, error, refetch: fetchStatus };
}
