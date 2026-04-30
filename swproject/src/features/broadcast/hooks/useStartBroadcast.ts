/**
 * @file 방송 시작 훅
 * @dependsOn src/features/broadcast/api/broadcastApi.ts (startBroadcast)
 * @dependsOn src/shared/stores/aiModeStore.ts (setBroadcast)
 * @usedBy src/pages/CharacterPage.tsx
 *
 * 동작:
 *   1) startBroadcast(characterId) 호출
 *   2) 성공 → aiModeStore.setBroadcast(streamId, startedAt) 로 mode 전환과 streamId 저장 원자적 처리
 *   3) 실패 → 사용자 친화 메시지를 setError 로 노출 (호출 측은 반환값 null 로 실패 판별)
 */

import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import { startBroadcast } from "@/features/broadcast/api/broadcastApi";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import type { BroadcastStartResDto } from "@/shared/types/broadcast";

interface UseStartBroadcastReturn {
  /** 성공 시 응답 DTO, 실패 시 null. 에러는 error 필드로도 확인 가능 */
  start: (characterId: number) => Promise<BroadcastStartResDto | null>;
  isPending: boolean;
  error: string | null;
}

function deriveMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ message?: string }>;
  const status = axiosErr?.response?.status;
  const serverMessage = axiosErr?.response?.data?.message;
  if (serverMessage) return serverMessage;
  switch (status) {
    case 400:
      return "이미 방송이 진행 중이거나 잘못된 요청입니다.";
    case 401:
      return "인증이 만료되었습니다. 다시 로그인해주세요.";
    case 403:
      return "방송 시작 권한이 없습니다.";
    case 404:
      return "캐릭터를 찾을 수 없습니다.";
    case 409:
      return "이미 다른 방송이 진행 중입니다.";
    case 500:
      return "서버 오류로 방송을 시작하지 못했습니다.";
    default:
      return err instanceof Error ? err.message : "방송 시작에 실패했습니다.";
  }
}

export function useStartBroadcast(): UseStartBroadcastReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setBroadcast = useAIModeStore((s) => s.setBroadcast);

  const start = useCallback(
    async (characterId: number): Promise<BroadcastStartResDto | null> => {
      setIsPending(true);
      setError(null);
      try {
        const res = await startBroadcast(characterId);
        setBroadcast(res.broadcastStreamId, res.broadcastStartedAt);
        return res;
      } catch (err: unknown) {
        setError(deriveMessage(err));
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [setBroadcast]
  );

  return { start, isPending, error };
}
