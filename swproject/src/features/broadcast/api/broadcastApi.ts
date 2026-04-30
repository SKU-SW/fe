/**
 * @file 방송(Broadcast) API 호출 함수
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @dependsOn src/shared/types/broadcast.ts
 * @usedBy src/features/broadcast/hooks/*
 *
 * Backend Swagger:
 *   - POST /api/v1/stream/start?characterId={id}  (Bearer)
 *   - POST /api/v1/stream/terminate                (Bearer)
 */

import apiClient from "@/shared/lib/axios";
import type { BroadcastStartResDto, BroadcastTerminateResDto } from "@/shared/types/broadcast";

const STREAM_BASE = "/api/v1/stream";

/**
 * 방송 시작
 * - characterId 는 query string. body 는 없음.
 * - 200: { broadcastStreamId, broadcastStartedAt }
 * - 400: 잘못된 요청 / 이미 방송 중
 * - 404: 캐릭터 없음
 * - 401/403: 인증/권한
 */
export async function startBroadcast(characterId: number): Promise<BroadcastStartResDto> {
  const res = await apiClient.post<BroadcastStartResDto>(`${STREAM_BASE}/start`, null, {
    params: { characterId },
  });
  return res.data;
}

/**
 * 방송 종료
 * - 현재 로그인 사용자의 진행 중인 방송을 종료. body 없음.
 * - 200: { terminatedBroadcastStreamId, broadcastStatus, broadcastTerminatedAt }
 * - 404: 진행 중인 방송 없음
 */
export async function terminateBroadcast(): Promise<BroadcastTerminateResDto> {
  const res = await apiClient.post<BroadcastTerminateResDto>(`${STREAM_BASE}/terminate`);
  return res.data;
}
