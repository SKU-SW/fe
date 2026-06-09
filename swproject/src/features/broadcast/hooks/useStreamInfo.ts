/**
 * @file 대시보드 진입 시 현재 방송 정보와 최신 대화를 가져오는 훅
 * @dependsOn src/features/broadcast/api/streamApi.ts (getStreamInfo, adaptDialogue)
 * @dependsOn src/shared/stores/aiModeStore.ts (clearDialogues, setDialogues)
 * @usedBy src/pages/DashboardPage.tsx
 *
 * 동작:
 *   1) mode === 'broadcasting' 으로 전환되면 채팅 화면을 비움
 *   2) GET /stream/info?size=30 으로 현재 방송 정보 + 최신 대화 가져오기
 *   3) 응답의 content 를 store.dialogues 에 반영하고 nextCursor / hasNext 를 저장
 *   4) broadcastCharacterInfo 는 로컬 state 로 노출 (AI 캐릭터 사이드 정보 표시용)
 *   5) refetch 함수 제공 — 폴링 또는 사용자 수동 새로고침 가능
 *
 * 비고:
 *   - 새 dialogue 의 실시간 push 는 WebSocket 채널이 배포되면 그쪽 hook 에서 처리.
 *   - 404 (진행 중 방송 없음) 는 서버 조회 불일치 가능성이 있어 UI 에러 없이 무시.
 */

import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { adaptDialogue, getStreamInfo } from "@/features/broadcast/api/streamApi";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { normalizeCharacterImageUrlToDefault } from "@/shared/lib/characterEmotionImages";
import type { BroadcastCharacterInfoResDto } from "@/shared/types/broadcast";

const STREAM_INFO_NOT_FOUND_RETRY_COUNT = 3;
const STREAM_INFO_NOT_FOUND_RETRY_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

interface UseStreamInfoOptions {
  /** 현재 방송 정보 + 최신 대화 조회 크기. Swagger 기본은 10, FE 기본은 30. */
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

function adaptBroadcastCharacterInfo(raw: BroadcastCharacterInfoResDto): BroadcastCharacterInfoResDto {
  return {
    ...raw,
    characterImageUrl: normalizeCharacterImageUrlToDefault(raw.characterImageUrl),
  };
}

export function useStreamInfo(options: UseStreamInfoOptions = {}): UseStreamInfoReturn {
  const { size = 30 } = options;
  const isBroadcasting = useAIModeStore((s) => s.mode === "broadcasting");
  /** broadcastStreamId 도 watch — 캐릭터 전환으로 streamId 가 바뀌면 새 방송 정보를 다시 fetch */
  const broadcastStreamId = useAIModeStore((s) => s.broadcastStreamId);
  const broadcastStartedAt = useAIModeStore((s) => s.broadcastStartedAt);
  const clearDialogues = useAIModeStore((s) => s.clearDialogues);
  const setDialogues = useAIModeStore((s) => s.setDialogues);

  const [characterInfo, setCharacterInfo] = useState<BroadcastCharacterInfoResDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnce = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      for (let attempt = 0; attempt <= STREAM_INFO_NOT_FOUND_RETRY_COUNT; attempt += 1) {
        try {
          const res = await getStreamInfo(size);
          const info = res.broadcastCharacterInfo ? adaptBroadcastCharacterInfo(res.broadcastCharacterInfo) : null;
          const dialogues = res.content
            .map(adaptDialogue)
            .sort((a, b) => (a.cursorId ?? 0) - (b.cursorId ?? 0));

          setDialogues(dialogues, res.nextCursor, res.hasNext);
          setCharacterInfo(
            info
              ? {
                ...info,
                  characterImageUrl: normalizeCharacterImageUrlToDefault(info.characterImageUrl),
                }
              : null,
          );
          return;
        } catch (err: unknown) {
          const isNotFound = statusOf(err) === 404;
          const shouldRetry404 =
            isNotFound &&
            attempt < STREAM_INFO_NOT_FOUND_RETRY_COUNT &&
            useAIModeStore.getState().mode === "broadcasting" &&
            useAIModeStore.getState().broadcastStreamId === broadcastStreamId;

          if (shouldRetry404) {
            await delay(STREAM_INFO_NOT_FOUND_RETRY_DELAY_MS);
            continue;
          }

          if (isNotFound) {
            setCharacterInfo(null);
            clearDialogues();
          }
          const msg = deriveMessage(err);
          if (msg) setError(msg);
          return;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [broadcastStreamId, broadcastStartedAt, clearDialogues, setDialogues, size]);

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
