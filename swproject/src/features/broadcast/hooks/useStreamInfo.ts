/**
 * @file 대시보드 진입 시 현재 방송 정보만 확인하고 채팅 화면은 비우는 훅
 * @dependsOn src/features/broadcast/api/streamApi.ts (getStreamInfo, adaptDialogue)
 * @dependsOn src/shared/stores/aiModeStore.ts (clearDialogues)
 * @usedBy src/pages/DashboardPage.tsx
 *
 * 동작:
 *   1) mode === 'broadcasting' 으로 전환되면 채팅 화면을 비움
 *   2) GET /stream/info?size=1 로 현재 방송 정보만 확인
 *   3) 응답의 broadcastCharacterInfo 는 로컬 state 로 노출 (AI 캐릭터 사이드 정보 표시용)
 *   4) refetch 함수 제공 — 폴링 또는 사용자 수동 새로고침 가능
 *
 * 비고:
 *   - 새 dialogue 의 실시간 push 는 WebSocket 채널이 배포되면 그쪽 hook 에서 처리.
 *   - 404 (진행 중 방송 없음) 는 정상 케이스 — 로컬 방송 상태도 idle 로 정리.
 */

import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { getStreamInfo } from "@/features/broadcast/api/streamApi";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import type { BroadcastCharacterInfoResDto } from "@/shared/types/broadcast";

interface UseStreamInfoOptions {
  /** 현재 방송 정보 확인용 조회 크기. API 안전성을 위해 default 1. 채팅 화면은 별도로 비워둔다. */
  size?: number;
}

interface UseStreamInfoReturn {
  characterInfo: BroadcastCharacterInfoResDto | null;
  isLoading: boolean;
  error: string | null;
  /** 현재 방송 정보 다시 가져오기 (LLM/TTS WS 미배포 동안 새 응답 확인용) */
  refetch: () => Promise<void>;
}

function deriveMessage(err: unknown): string | null {
  const axiosErr = err as AxiosError<{ message?: string }>;
  const status = axiosErr?.response?.status;
  // 404 = 진행 중 방송 없음. 이는 정상 상태일 수 있어 에러로 표시하지 않음.
  if (status === 404) return null;
  const serverMessage = axiosErr?.response?.data?.message;
  if (serverMessage) return serverMessage;
  switch (status) {
    case 401:
      return "인증이 만료되었습니다.";
    case 403:
      return "방송 정보 조회 권한이 없습니다.";
    case 500:
      return "서버 오류로 방송 정보를 가져오지 못했습니다.";
    default:
      return err instanceof Error ? err.message : "방송 정보 조회에 실패했습니다.";
  }
}

function statusOf(err: unknown): number | undefined {
  return (err as AxiosError)?.response?.status;
}

export function useStreamInfo(options: UseStreamInfoOptions = {}): UseStreamInfoReturn {
  const { size = 1 } = options;
  const isBroadcasting = useAIModeStore((s) => s.mode === "broadcasting");
  /** broadcastStreamId 도 watch — 캐릭터 전환으로 streamId 가 바뀌면 새 방송 정보를 다시 fetch */
  const broadcastStreamId = useAIModeStore((s) => s.broadcastStreamId);
  const clearDialogues = useAIModeStore((s) => s.clearDialogues);
  const clearBroadcast = useAIModeStore((s) => s.clearBroadcast);

  const [characterInfo, setCharacterInfo] = useState<BroadcastCharacterInfoResDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnce = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getStreamInfo(size);
      setCharacterInfo(res.broadcastCharacterInfo);
    } catch (err: unknown) {
      if (statusOf(err) === 404) {
        // 서버 기준 진행 중 방송이 없으면 stale local broadcasting 상태를 정리한다.
        setCharacterInfo(null);
        clearBroadcast();
      }
      const msg = deriveMessage(err);
      if (msg) setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [clearBroadcast, size]);

  useEffect(() => {
    if (!isBroadcasting || !broadcastStreamId) {
      // 방송 끝났으면 캐릭터 정보도 클리어
      setCharacterInfo(null);
      return;
    }
    clearDialogues();
    let cancelled = false;
    void (async () => {
      try {
        await fetchOnce();
      } finally {
        if (cancelled) {
          // 응답 도착 전에 unmount 되거나 streamId 가 또 바뀌면 결과 무시
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clearDialogues, isBroadcasting, broadcastStreamId, fetchOnce]);

  return { characterInfo, isLoading, error, refetch: fetchOnce };
}
