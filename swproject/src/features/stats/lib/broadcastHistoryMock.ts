/**
 * @file 방송 히스토리 캘린더용 mock 데이터 — 백엔드 일자별 통계 API 도입 전까지 사용
 * @usedBy src/features/stats/components/BroadcastCalendar.tsx
 */

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface BroadcastHistoryEntry {
  /** YYYY-MM-DD */
  date: string;
  title: string;
  /** 방송에 사용한 캐릭터 이름 */
  characterName: string;
  /** 0~100 */
  positiveRatio: number;
  neutralRatio: number;
  negativeRatio: number;
  totalChats: number;
  durationMinutes: number;
  topKeywords: string[];
}

export const BROADCAST_HISTORY_MOCK: BroadcastHistoryEntry[] = [
  {
    date: "2026-06-08",
    title: "월요일 소통 방송",
    characterName: "지형",
    positiveRatio: 72, neutralRatio: 22, negativeRatio: 6,
    totalChats: 1284, durationMinutes: 142,
    topKeywords: ["ㅋㅋㅋ", "나이스", "굿", "오케이", "레전드"],
  },
  {
    date: "2026-06-07",
    title: "주말 랭크 도전",
    characterName: "형준",
    positiveRatio: 58, neutralRatio: 30, negativeRatio: 12,
    totalChats: 1820, durationMinutes: 211,
    topKeywords: ["집중", "화이팅", "아쉽다", "진짜", "ㅋㅋㅋ"],
  },
  {
    date: "2026-06-05",
    title: "신규 콘텐츠 테스트",
    characterName: "지형",
    positiveRatio: 79, neutralRatio: 17, negativeRatio: 4,
    totalChats: 980, durationMinutes: 95,
    topKeywords: ["미쳤다", "굿", "오", "대박", "재밌다"],
  },
  {
    date: "2026-06-02",
    title: "스토리 게임 플레이",
    characterName: "형준",
    positiveRatio: 64, neutralRatio: 28, negativeRatio: 8,
    totalChats: 1402, durationMinutes: 178,
    topKeywords: ["몰입", "대단해", "오", "ㅋㅋㅋ", "신난다"],
  },
  {
    date: "2026-06-02",
    title: "저녁 소통 방송",
    characterName: "지형",
    positiveRatio: 73, neutralRatio: 21, negativeRatio: 6,
    totalChats: 1156, durationMinutes: 128,
    topKeywords: ["잘한다", "화이팅", "레전드", "오", "굿"],
  },
  {
    date: "2026-05-29",
    title: "저녁 소통 방송",
    characterName: "형준",
    positiveRatio: 73, neutralRatio: 21, negativeRatio: 6,
    totalChats: 1156, durationMinutes: 128,
    topKeywords: ["잘한다", "화이팅", "레전드", "오", "굿"],
  },
  {
    date: "2026-05-28",
    title: "시청자 참여 방송",
    characterName: "지형",
    positiveRatio: 71, neutralRatio: 22, negativeRatio: 7,
    totalChats: 1340, durationMinutes: 165,
    topKeywords: ["화이팅", "레전드", "진짜", "ㅋㅋㅋ", "굿"],
  },
  {
    date: "2026-05-26",
    title: "주중 하이라이트",
    characterName: "형준",
    positiveRatio: 35, neutralRatio: 28, negativeRatio: 37,
    totalChats: 1612, durationMinutes: 198,
    topKeywords: ["아쉽다", "엥", "진짜", "ㅋㅋㅋ", "ㅠㅠ"],
  },
  {
    date: "2026-05-24",
    title: "주말 게릴라",
    characterName: "지형",
    positiveRatio: 68, neutralRatio: 25, negativeRatio: 7,
    totalChats: 1108, durationMinutes: 122,
    topKeywords: ["나이스", "아쉽다", "집중", "ㅋㅋㅋ", "굿"],
  },
];

export function dominantSentiment(entry: BroadcastHistoryEntry): SentimentLabel {
  const entries: Array<[SentimentLabel, number]> = [
    ["positive", entry.positiveRatio],
    ["neutral", entry.neutralRatio],
    ["negative", entry.negativeRatio],
  ];
  return entries.reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0];
}
