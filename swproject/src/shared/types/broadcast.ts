/**
 * @file 방송(Broadcast) 관련 타입 정의
 * @dependsOn 없음 (순수 타입)
 * @usedBy src/features/broadcast/api/broadcastApi.ts
 * @usedBy src/shared/stores/aiModeStore.ts
 *
 * Backend Swagger 기준:
 *   - BroadcastStartResDto, BroadcastTerminateResDto, BroadcastStatus enum
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
 * POST /api/v1/stream/terminate 응답
 */
export interface BroadcastTerminateResDto {
  terminatedBroadcastStreamId: string;
  broadcastStatus: BroadcastStatus;
  broadcastTerminatedAt: string;
}
