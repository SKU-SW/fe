/**
 * @file 방송 종료 훅
 * @dependsOn src/features/broadcast/api/broadcastApi.ts (terminateBroadcast)
 * @dependsOn src/shared/stores/aiModeStore.ts (clearBroadcast)
 * @usedBy src/pages/CharacterPage.tsx
 *
 * 동작:
 *   1) terminateBroadcast() 호출 (body 없음)
 *   2) 성공 → aiModeStore.clearBroadcast() 로 mode='idle' + streamId 초기화
 *   3) 404 (서버에 진행 중 방송 없음) → 로컬 상태도 정리하고 정상 종료로 간주
 *   4) 그 외 실패 → setError 로 노출
 */

import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import { terminateBroadcast } from "@/features/broadcast/api/broadcastApi";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import type { BroadcastTerminateResDto } from "@/shared/types/broadcast";

interface UseTerminateBroadcastReturn {
  /** 성공 시 응답 DTO, 실패 시 null */
  terminate: () => Promise<BroadcastTerminateResDto | null>;
  isPending: boolean;
  error: string | null;
}

function deriveMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ message?: string }>;
  const status = axiosErr?.response?.status;
  const serverMessage = axiosErr?.response?.data?.message;
  if (serverMessage) return serverMessage;
  switch (status) {
    case 401:
      return "인증이 만료되었습니다.";
    case 403:
      return "방송 종료 권한이 없습니다.";
    case 500:
      return "서버 오류로 방송을 종료하지 못했습니다.";
    default:
      return err instanceof Error ? err.message : "방송 종료에 실패했습니다.";
  }
}

export function useTerminateBroadcast(): UseTerminateBroadcastReturn {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearBroadcast = useAIModeStore((s) => s.clearBroadcast);

  const terminate = useCallback(async (): Promise<BroadcastTerminateResDto | null> => {
    setIsPending(true);
    setError(null);
    try {
      const res = await terminateBroadcast();
      clearBroadcast();
      return res;
    } catch (err: unknown) {
      const status = (err as AxiosError)?.response?.status;
      // 서버는 진행 중 방송 없다고 하지만 클라는 broadcasting 인 경우:
      // 로컬을 서버 진실에 맞춰 idle 로 정리. 사용자에겐 에러로 보이지 않음.
      if (status === 404) {
        clearBroadcast();
        return null;
      }
      setError(deriveMessage(err));
      return null;
    } finally {
      setIsPending(false);
    }
  }, [clearBroadcast]);

  return { terminate, isPending, error };
}
