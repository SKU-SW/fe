/**
 * @file 방송 시작 훅 (자동 복구 포함)
 * @dependsOn src/features/broadcast/api/broadcastApi.ts (startBroadcast, terminateBroadcast)
 * @dependsOn src/shared/stores/aiModeStore.ts (setBroadcast)
 * @usedBy src/pages/CharacterPage.tsx
 *
 * 동작:
 *   1) startBroadcast(characterId) 호출
 *   2) 성공 → aiModeStore.setBroadcast(streamId, startedAt) — 원자적 mode/streamId 셋
 *   3) 실패 시:
 *      - HTTP 400 (이미 방송 중) → 자동 복구 시도:
 *          a. terminateBroadcast() 한 번 호출 (호출자가 이미 select() 로 selectedCharacterId 를
 *             타깃 캐릭터로 동기화한 상태이므로, BE 가 그 캐릭터의 leftover BROADCASTING 행을 정리)
 *          b. 다시 startBroadcast(characterId) 호출
 *          c. 두 번째 시도도 실패하면 원본 에러 메시지로 fallback
 *      - 그 외 → setError + null 반환
 *
 * 자동 복구 배경:
 *   - BE 의 terminate 는 user.selectedCharacterId 기준만 청소하므로,
 *     사용자가 캐릭터를 바꿔가며 시작/종료를 반복하면 이전 캐릭터의 BROADCASTING 행이 leftover 로 남음.
 *   - 호출자(CharacterPage.performStart) 가 start 직전에 select() 로 selectedCharacterId 를
 *     타깃 캐릭터로 맞춰주므로, 여기서 terminate 한 번만 호출하면 정확히 그 캐릭터의 leftover 만 정리됨.
 *   - 평상시(충돌 없음) 에는 1번만 호출되고 추가 비용 0.
 */

import { useCallback, useState } from "react";
import type { AxiosError } from "axios";
import { startBroadcast, terminateBroadcast } from "@/features/broadcast/api/broadcastApi";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import type { BroadcastStartResDto } from "@/shared/types/broadcast";

interface UseStartBroadcastReturn {
  /** 성공 시 응답 DTO, 실패 시 null. 에러는 error 필드로도 확인 가능 */
  start: (characterId: number) => Promise<BroadcastStartResDto | null>;
  isPending: boolean;
  error: string | null;
}

function statusOf(err: unknown): number | undefined {
  return (err as AxiosError)?.response?.status;
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

/**
 * leftover 정리용 terminate 호출.
 * - 200: leftover 가 있었고 정리됨
 * - 404: 진행 중 방송 없음 (이미 깨끗) — 정상 케이스로 간주
 * - 그 외: 복구 실패로 간주하여 throw
 */
async function tryTerminateLeftover(): Promise<void> {
  try {
    await terminateBroadcast();
  } catch (err) {
    if (statusOf(err) === 404) return; // 깨끗한 상태
    throw err;
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
        // 400 = "이미 방송 중" 추정. 자동 복구 1회만 시도.
        if (statusOf(err) === 400) {
          try {
            await tryTerminateLeftover();
            const retryRes = await startBroadcast(characterId);
            setBroadcast(retryRes.broadcastStreamId, retryRes.broadcastStartedAt);
            // 복구 성공 — 사용자에게 에러 표시하지 않음
            return retryRes;
          } catch (retryErr: unknown) {
            // 복구 실패 — 원본 에러 메시지보다 더 구체적인 안내로 fallback
            setError(
              deriveMessage(retryErr) +
                " (자동 복구를 시도했으나 실패했습니다. 페이지 새로고침 후 다시 시도해주세요.)"
            );
            return null;
          }
        }

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
