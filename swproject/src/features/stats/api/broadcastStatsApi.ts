/**
 * @file 방송 통계 REST API — 월별 캘린더 + 일별 상세
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @usedBy src/features/stats/hooks/useBroadcastMonth.ts
 * @usedBy src/features/stats/hooks/useBroadcastDayStats.ts
 *
 * Backend:
 *   GET /api/v1/broadcast/stats/month?year=YYYY&month=M  → BroadcastMonthResDto
 *   GET /api/v1/broadcast/stats/day?broadcastId=...      → BroadcastDayStatsResDto
 *     404 → 본인 방송 아니거나 존재하지 않는 방송
 */

import apiClient from "@/shared/lib/axios";
import type {
  BroadcastMonthResDto,
  BroadcastDayStatsResDto,
} from "@/features/stats/types";

const BASE = "/api/v1/broadcast/stats";

export async function getBroadcastMonth(params: {
  year: number;
  month: number;
}): Promise<BroadcastMonthResDto> {
  const res = await apiClient.get<BroadcastMonthResDto>(`${BASE}/month`, {
    params: { year: params.year, month: params.month },
  });
  return res.data;
}

export async function getBroadcastDayStats(
  broadcastId: number,
): Promise<BroadcastDayStatsResDto> {
  const res = await apiClient.get<BroadcastDayStatsResDto>(`${BASE}/day`, {
    params: { broadcastId },
  });
  return res.data;
}
