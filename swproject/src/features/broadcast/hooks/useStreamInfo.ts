/**
 * @file 대시보드 진입 시 현재 방송 정보 + 최신 대화 N개를 받아 store 에 채우는 훅
 * @dependsOn src/features/broadcast/api/streamApi.ts (getStreamInfo, adaptDialogue)
 * @dependsOn src/shared/stores/aiModeStore.ts (upsertDialogues)
 * @usedBy src/pages/DashboardPage.tsx
 *
 * 동작:
 *   1) mode === 'broadcasting' 으로 전환되면 1회 GET /stream/info?size=30
 *   2) DTO 를 FE StreamDialogue 로 변환 후 store.upsertDialogues 로 적재
 *   3) 응답의 broadcastCharacterInfo 는 로컬 state 로 노출 (AI 캐릭터 사이드 정보 표시용)
 *   4) refetch 함수 제공 — 폴링 또는 사용자 수동 새로고침 가능
 *
 * 비고:
 *   - 새 dialogue 의 실시간 push 는 WebSocket 채널이 배포되면 그쪽 hook 에서 처리.
 *   - 404 (진행 중 방송 없음) 는 정상 케이스 — 에러 표시하지 않음.
 */

import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { adaptDialogue, getStreamInfo } from "@/features/broadcast/api/streamApi";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import type { BroadcastCharacterInfoResDto } from "@/shared/types/broadcast";

interface UseStreamInfoOptions {
  /** 한 번에 가져올 최신 대화 수 (default 30) */
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

export function useStreamInfo(options: UseStreamInfoOptions = {}): UseStreamInfoReturn {
  const { size = 30 } = options;
  const isBroadcasting = useAIModeStore((s) => s.mode === "broadcasting");
  /** broadcastStreamId 도 watch — 캐릭터 전환으로 streamId 가 바뀌면 새 방송 정보를 다시 fetch */
  const broadcastStreamId = useAIModeStore((s) => s.broadcastStreamId);
  const upsertDialogues = useAIModeStore((s) => s.upsertDialogues);

  const [characterInfo, setCharacterInfo] = useState<BroadcastCharacterInfoResDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnce = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getStreamInfo(size);
      const dialogues = res.content.map(adaptDialogue);
      upsertDialogues(dialogues, res.nextCursor);
      setCharacterInfo(res.broadcastCharacterInfo);
    } catch (err: unknown) {
      const msg = deriveMessage(err);
      if (msg) setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [size, upsertDialogues]);

  useEffect(() => {
    if (!isBroadcasting || !broadcastStreamId) {
      // 방송 끝났으면 캐릭터 정보도 클리어
      setCharacterInfo(null);
      return;
    }
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
  }, [isBroadcasting, broadcastStreamId, fetchOnce]);

  return { characterInfo, isLoading, error, refetch: fetchOnce };
}
