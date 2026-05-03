/**
 * @file 방송(Broadcast) 관련 타입 정의
 * @dependsOn 없음 (순수 타입)
 * @usedBy src/features/broadcast/api/broadcastApi.ts
 * @usedBy src/shared/stores/aiModeStore.ts
 *
 * Backend Notion/최신 계약 기준:
 *   - BroadcastStartResDto, BroadcastTerminateReqDto, BroadcastTerminateResDto, BroadcastStatus enum
 */

export type BroadcastStatus = "BROADCASTING" | "TERMINATED" | "ABNORMAL_TERMINATED";

/**
 * POST /api/v1/stream/start 응답
 * - broadcastStartedAt 예: "2026-04-26-14:30:00"
 */
export interface BroadcastStartResDto {
  broadcastStreamId: string;
  broadcastStartedAt: string;
}

/**
 * PATCH /api/v1/stream/termination 요청
 */
export interface BroadcastTerminateReqDto {
  broadcastStreamId: string;
}

/**
 * PATCH /api/v1/stream/termination 응답
 */
export interface BroadcastTerminateResDto {
  broadcastStreamId: string;
  broadcastStatus: BroadcastStatus;
  broadcastTerminatedAt: string;
}
