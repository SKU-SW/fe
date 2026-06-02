/**
 * @file 치지직 연동 상태 조회 훅 - useChzzkStatus
 * @created Sprint Chzzk - 치지직 연동 UI
 * @dependsOn src/features/auth/api/authApi.ts (getChzzkStatus)
 * @usedBy src/pages/SettingsPage.tsx, src/features/broadcast/components/ChzzkGateModal.tsx
 *
 * 백엔드 GET /api/v1/auth/chzzk/status 가 아직 미구현이므로
 * 404 / 네트워크 에러 시 mock 응답을 사용한다 (콘솔 경고 출력).
 * 백엔드가 준비되면 자동으로 실제 응답으로 전환된다.
 */

import { useCallback, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { getChzzkStatus } from '@/features/auth/api/authApi';
import type { ChzzkStatusResponse } from '@/shared/types/auth';

const MOCK_STATUS: ChzzkStatusResponse = {
  linked: false,
  chzzkAccessTokenExpiresAt: null,
  chzzkRefreshTokenExpiresAt: null,
};

interface UseChzzkStatusReturn {
  status: ChzzkStatusResponse | null;
  isLoading: boolean;
  error: string | null;
  /** 강제 재조회 — 외부 브라우저에서 연동 완료 후 호출 */
  refetch: () => Promise<void>;
  /** 백엔드 미구현 fallback 상태인지 — UI에서 "백엔드 준비 중" 표시용 */
  isMock: boolean;
}

export function useChzzkStatus(): UseChzzkStatusReturn {
  const [status, setStatus] = useState<ChzzkStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getChzzkStatus();
      setStatus(response);
      setIsMock(false);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const httpStatus = axiosErr?.response?.status;

      // 백엔드 status API 미구현 시 mock 응답 사용
      if (httpStatus === 404 || httpStatus === undefined) {
        console.warn('[chzzk-status] 백엔드 GET /api/v1/auth/chzzk/status 미구현 — mock 응답 사용');
        setStatus(MOCK_STATUS);
        setIsMock(true);
        return;
      }

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

  return { status, isLoading, error, refetch: fetchStatus, isMock };
}
