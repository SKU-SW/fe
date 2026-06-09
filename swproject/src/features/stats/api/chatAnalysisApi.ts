/**
 * @file 채팅 분석 REST API — 방송 중 채팅 통계 조회
 * @dependsOn src/shared/lib/axios.ts (apiClient)
 * @usedBy src/features/stats/hooks/useChatAnalysis.ts
 *
 * Backend:
 *   GET /api/v1/stream/chat/stats?statsCriteria=1&timeRange=1
 *   200 → BroadcastChatStatsResDto
 *   404 → 방송 진행 중 아님 (isBroadcastInactive)
 */

import apiClient from "@/shared/lib/axios";
import type {
  BroadcastChatStatsResDto,
  BroadcastChatStatsFilter,
  BroadcastTendencyUpdateReqDto,
  BroadcastTendencyUpdateResDto,
} from "@/features/stats/types";

const BASE = "/api/v1/stream/chat";

/**
 * 방송 채팅 통계 조회
 * - statsCriteria: 집계 간격 (1 | 5 | 10 분)
 * - timeRange: 조회 범위 (1 | 3 시간 | 0 = 전체)
 * - 404: 활성 방송 없음 (호출 측에서 처리)
 */
export async function getBroadcastChatStats(
  filter: BroadcastChatStatsFilter,
): Promise<BroadcastChatStatsResDto> {
  const res = await apiClient.get<BroadcastChatStatsResDto>(`${BASE}/stats`, {
    params: {
      statsCriteria: filter.statsCriteria,
      timeRange: filter.timeRange,
    },
  });
  return res.data;
}

/**
 * AI 파트너 성향 수동 변경 (AUTO <-> MANUAL 전환 포함)
 * - version: "MANUAL" + tendency 지정 → 수동 모드로 전환하며 성향 설정
 * - version: "AUTO" → 자동 모드로 복귀
 */
export async function updateCharacterTendency(
  body: BroadcastTendencyUpdateReqDto,
): Promise<BroadcastTendencyUpdateResDto> {
  const res = await apiClient.patch<BroadcastTendencyUpdateResDto>(
    "/api/v1/stream/character/tendency",
    body,
  );
  return res.data;
}
