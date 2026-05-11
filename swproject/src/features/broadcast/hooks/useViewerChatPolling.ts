/**
 * @file 대시보드 체류 중 시청자 채팅(VIEWER) 최신 항목 polling 훅
 * @dependsOn src/features/broadcast/api/streamApi.ts (getStreamInfo, adaptDialogue)
 * @dependsOn src/shared/stores/aiModeStore.ts (upsertDialogues)
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useEffect, useRef } from "react";
import type { AxiosError } from "axios";
import { adaptDialogue, getStreamInfo } from "@/features/broadcast/api/streamApi";
import { useAIModeStore } from "@/shared/stores/aiModeStore";

const DEFAULT_POLL_INTERVAL_MS = 3000;

function statusOf(err: unknown): number | undefined {
  return (err as AxiosError)?.response?.status;
}

interface UseViewerChatPollingOptions {
  enabled?: boolean;
  /** 한 번 polling할 때 확인할 최신 대화 수. 전체 중 VIEWER만 걸러낸다. */
  size?: number;
  intervalMs?: number;
}

export function useViewerChatPolling({
  enabled = true,
  size = 30,
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
}: UseViewerChatPollingOptions = {}) {
  const isBroadcasting = useAIModeStore((s) => s.mode === "broadcasting");
  const broadcastStreamId = useAIModeStore((s) => s.broadcastStreamId);
  const upsertDialogues = useAIModeStore((s) => s.upsertDialogues);
  const clearBroadcast = useAIModeStore((s) => s.clearBroadcast);
  const latestViewerCursorRef = useRef<number | null>(null);

  useEffect(() => {
    latestViewerCursorRef.current = null;
  }, [broadcastStreamId]);

  useEffect(() => {
    if (!enabled || !isBroadcasting || !broadcastStreamId) return;

    let stopped = false;
    let inFlight = false;

    const poll = async () => {
      if (stopped || inFlight) return;
      inFlight = true;
      try {
        const res = await getStreamInfo(Math.max(1, size));
        if (stopped) return;

        const viewerItems = res.content.filter((item) => item.subject === "VIEWER");
        const latestKnownCursor = latestViewerCursorRef.current;
        const newViewerItems = latestKnownCursor == null
          ? []
          : viewerItems.filter((item) => item.cursorId > latestKnownCursor);

        if (viewerItems.length > 0) {
          latestViewerCursorRef.current = Math.max(
            latestKnownCursor ?? 0,
            ...viewerItems.map((item) => item.cursorId)
          );
        }

        if (newViewerItems.length > 0) {
          upsertDialogues(newViewerItems.map(adaptDialogue), null);
        }
      } catch (err: unknown) {
        if (statusOf(err) === 404) {
          // 서버 기준 진행 중 방송이 없으면 stale local broadcasting 상태를 정리하고 polling 을 멈춘다.
          stopped = true;
          clearBroadcast();
          return;
        }
        // polling 실패는 대시보드 전체 오류로 띄우지 않고 다음 주기에 재시도한다.
        console.warn(
          "[viewer-chat-polling] failed:",
          err instanceof Error ? err.message : err
        );
      } finally {
        inFlight = false;
      }
    };

    const timer = setInterval(() => {
      void poll();
    }, intervalMs);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [broadcastStreamId, clearBroadcast, enabled, intervalMs, isBroadcasting, size, upsertDialogues]);
}
