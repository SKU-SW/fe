/**
 * @file 치지직 연동 시작 훅 - useChzzkConnect
 * @created Sprint Chzzk - 치지직 연동 UI
 * @updated Backend Swagger spec alignment - authorized boolean instead of linked
 * @dependsOn src/features/auth/api/authApi.ts (getChzzkAuthUrl)
 * @dependsOn electron/preload.ts (electronAPI.shell.openExternal)
 * @usedBy src/features/auth/components/ChzzkConnectModal.tsx
 *
 * 흐름:
 * 1. getChzzkAuthUrl() → 백엔드가 chzzk OAuth URL 반환 (state는 Redis 저장)
 * 2. shell.openExternal()로 시스템 브라우저에 URL 열기
 * 3. 사용자가 치지직 인증 → 백엔드 callback 처리 → User 엔티티에 토큰 저장
 * 4. 5초 간격으로 status 폴링 → authorized=true 되면 onConnected 콜백 호출
 * 5. POLL_TIMEOUT_MS 초과 시 timeout 처리 (사용자가 인증을 취소했을 수 있음)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import { getChzzkAuthUrl, getChzzkStatus } from '@/features/auth/api/authApi';

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

interface UseChzzkConnectOptions {
  /** 연동 완료 감지 시 호출 — 보통 status refetch 트리거 */
  onConnected?: () => void;
}

interface UseChzzkConnectReturn {
  /** 연동 시작 — chzzk URL 받고 외부 브라우저에 열기 + polling 시작 */
  connect: () => Promise<void>;
  /** 진행 중인 polling 중단 (사용자가 모달을 닫는 등) */
  cancel: () => void;
  /** chzzk URL 요청 또는 polling 중 */
  isConnecting: boolean;
  /** 외부 브라우저는 열렸고 사용자 인증 대기 중 */
  isWaitingForUser: boolean;
  error: string | null;
}

export function useChzzkConnect(options?: UseChzzkConnectOptions): UseChzzkConnectReturn {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWaitingForUser, setIsWaitingForUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollDeadlineRef = useRef<number>(0);
  const onConnectedRef = useRef(options?.onConnected);

  // 콜백 reference 최신화 — 콜백이 매 렌더 새로 생성되어도 polling은 영향 없도록
  useEffect(() => {
    onConnectedRef.current = options?.onConnected;
  }, [options?.onConnected]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setIsWaitingForUser(false);
  }, []);

  const cancel = useCallback(() => {
    stopPolling();
    setIsConnecting(false);
    setError(null);
  }, [stopPolling]);

  // 언마운트 시 polling 정리
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // 1. 백엔드에서 chzzk OAuth URL 받기
      const { authUrl } = await getChzzkAuthUrl();

      // 2. 외부 브라우저로 열기 (Electron shell.openExternal)
      const electronAPI = window.electronAPI;
      if (!electronAPI?.shell?.openExternal) {
        throw new Error('Electron API를 사용할 수 없습니다. 앱을 재시작해 주세요.');
      }
      await electronAPI.shell.openExternal(authUrl);

       // 3. 폴링 시작 — 사용자가 치지직 인증을 완료하면 status가 authorized=true 로 바뀜
      setIsWaitingForUser(true);
      pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;

      pollTimerRef.current = setInterval(async () => {
        if (Date.now() > pollDeadlineRef.current) {
          stopPolling();
          setIsConnecting(false);
          setError('치지직 인증 응답 대기 시간이 초과되었습니다. 다시 시도해 주세요.');
          return;
        }

        try {
          const status = await getChzzkStatus();
          if (status.authorized) {
            stopPolling();
            setIsConnecting(false);
            onConnectedRef.current?.();
          }
        } catch (pollErr: unknown) {
          const pollMessage = pollErr instanceof Error ? pollErr.message : "unknown polling error";
          console.warn(`[chzzk-connect] status polling failed, retrying: ${pollMessage}`);
        }
      }, POLL_INTERVAL_MS);
    } catch (err: unknown) {
      const message = (err as AxiosError<{ message?: string }>)?.response?.data?.message
        ?? (err instanceof Error ? err.message : '치지직 연동을 시작할 수 없습니다.');
      setError(message);
      setIsConnecting(false);
      stopPolling();
    }
  }, [stopPolling]);

  return { connect, cancel, isConnecting, isWaitingForUser, error };
}
