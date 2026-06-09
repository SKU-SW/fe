/**
 * @file 방송 채팅 분석 데이터 모델 (REST API 기반)
 * @dependsOn 없음
 * @usedBy src/features/stats/api/chatAnalysisApi.ts, src/features/stats/components/*
 */

/** 여론 집계 */
export interface PublicOpinion {
  positiveChatCount: number;
  neutralChatCount: number;
  negativeChatCount: number;
  totalChatCount: number;
  positiveRatio: number;
  neutralRatio: number;
  negativeRatio: number;
}

/** AI 파트너 편향 성향 */
export type AiTendency = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

/** 감정 흐름 시계열 포인트 */
export interface SentimentFlowPoint {
  timeLabel: string;
  positiveRatio: number;
  neutralRatio: number;
  negativeRatio: number;
}

/** 채팅 분석 스냅샷 (GET /api/v1/stream/chat/stats 응답) */
export interface BroadcastChatStatsResDto {
  publicOpinion: PublicOpinion;
  aiPartnerTendency: AiTendency;
  sentimentFlow: SentimentFlowPoint[];
  topKeywords: string[];
}

/** 채팅 분석 필터 */
export interface BroadcastChatStatsFilter {
  statsCriteria: 1 | 5 | 10;
  timeRange: 1 | 3 | 0;
}

/** 성향 제어 버전 (AUTO: AI 자동 / MANUAL: 수동 지정) */
export type TendencyVersion = "AUTO" | "MANUAL";

/** 성향 수동 변경 요청 DTO */
export interface BroadcastTendencyUpdateReqDto {
  version: TendencyVersion;
  tendency?: AiTendency;
}

/** 성향 수동 변경 응답 DTO */
export interface BroadcastTendencyUpdateResDto {
  prevVersion: TendencyVersion;
  prevTendency: AiTendency;
}
