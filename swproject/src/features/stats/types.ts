/**
 * @file 방송 통계 mock 데이터 모델
 * @dependsOn 없음
 * @usedBy src/features/stats/lib/statsMockService.ts, src/features/stats/components/*
 */

export type ReactionMode = "cheer" | "criticism" | "silence";

export interface SentimentSnapshot {
  positivePercent: number;
  negativePercent: number;
  currentMode: ReactionMode;
}

export interface DecisionState {
  mode: ReactionMode;
  isAuto: boolean;
}

export interface OutputState {
  ttsReady: boolean;
  nextLine: string;
  targetEmotion: string;
  confidencePercent: number;
  nextReactionSeconds: number;
}

export interface SentimentFlowPoint {
  timestamp: string;
  positivePercent: number;
  negativePercent: number;
  modeTransition: ReactionMode | null;
}

export interface KeywordEntry {
  rank: number;
  keyword: string;
  trend: "up" | "down" | "flat";
  change: number;
  count: number;
}

export interface StatsSnapshot {
  sentiment: SentimentSnapshot;
  decision: DecisionState;
  output: OutputState;
  sentimentFlow: SentimentFlowPoint[];
  keywords: KeywordEntry[];
  updatedAt: number;
}
