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

// ============================================================
// 방송 통계 (캘린더 + 일별 상세) — /api/v1/broadcast/stats/*
// ============================================================

export type BroadcastStatus = "BROADCASTING" | "TERMINATED" | "ABNORMAL_TERMINATED";

export type CharacterGender = "MALE" | "FEMALE";

export type CharacterPersona =
  | "FRIENDLY_CHATTER"
  | "HIGH_TENSION"
  | "PLAYFUL_TEASER"
  | "PROFESSIONAL_MANAGER"
  | "ROLEPLAY_EXPERT";

export type DialogueSubject =
  | "STREAMER"
  | "AI_CHARACTER"
  | "VIEWER"
  | "DONATION"
  | "GAME_EVENT"
  | "SYSTEM_SUMMARY";

/** 월별 방송 리스트의 한 항목 — 캘린더 셀에 표시할 단위 */
export interface BroadcastMonthInfo {
  day: number;
  broadcastId: number;
  characterId: number;
  characterName: string;
  broadcastStatus: BroadcastStatus;
  /** "HH:MM:SS" 형식 — startedAt ~ terminatedAt(또는 현재) 차이 */
  broadcastTime: string;
}

/** GET /api/v1/broadcast/stats/month 응답 */
export interface BroadcastMonthResDto {
  broadcastMonthInfoList: BroadcastMonthInfo[];
  broadcastYear: number;
  broadcastMonth: number;
}

/** 방송 분석 타임라인 한 구간 */
export interface BroadcastTimeLine {
  content: string;
  /** "yyyy-MM-dd HH:mm:ss" */
  startTime: string;
  endTime: string;
}

/** 방송 유행어 항목 */
export type CatchPhraseSubject = "STREAMER" | "VIEWER";

export interface BroadcastCatchPhrase {
  content: string;
  subject: CatchPhraseSubject;
  situationAnalysis: string;
}

/** 일별 방송 분석 결과 — 분석 완료 전이면 null */
export interface BroadcastAnalysisResult {
  majorContent: string;
  majorMoodWithViewers: string;
  summary: string;
  totalAnalysis: string;
  catchPhrases: BroadcastCatchPhrase[];
  timeLines: BroadcastTimeLine[];
}

export interface BroadcastDialogue {
  cursorId: number;
  subject: DialogueSubject;
  content: string;
  /** "yyyy-MM-dd-HH:mm:ss" (대시 separator) */
  createdAt: string;
}

export interface BroadcastDayCharacterInfo {
  name: string;
  gender: CharacterGender;
  imageUrl: string;
  persona: CharacterPersona;
  triggerWords: string[];
}

export interface BroadcastDayBroadcastInfo {
  streamId: string;
  status: BroadcastStatus;
  /** "yyyy-MM-dd-HH:mm:ss" */
  startedAt: string;
  terminatedAt: string;
  lastFiveBroadcastDialogues: BroadcastDialogue[];
  analysisResult: BroadcastAnalysisResult | null;
}

export interface BroadcastDayChatAnalysisInfo {
  publicOpinion: PublicOpinion;
  aiPartnerTendency: AiTendency;
  /** 일별 통계는 10분 간격으로 고정 그룹핑 */
  sentimentFlow: SentimentFlowPoint[];
  topKeywords: string[];
}

/** GET /api/v1/broadcast/stats/day 응답 */
export interface BroadcastDayStatsResDto {
  characterInfo: BroadcastDayCharacterInfo;
  broadcastInfo: BroadcastDayBroadcastInfo;
  chatAnalysisInfo: BroadcastDayChatAnalysisInfo;
}
