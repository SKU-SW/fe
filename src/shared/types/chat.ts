export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface ChatMessage {
  id: string;
  username: string;
  content: string;
  sentiment: Sentiment;
  timestamp: string;
}

export interface SentimentRatio {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentFlowPoint {
  timestamp: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface KeywordItem {
  keyword: string;
  count: number;
}

export interface ChatAnalyticsData {
  sentimentRatio: SentimentRatio;
  sentimentFlow: SentimentFlowPoint[];
  chatSpeed: number;
  topKeywords: KeywordItem[];
  filteredCount: number;
}
