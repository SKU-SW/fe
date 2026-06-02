/**
 * @file 방송 통계 mock snapshot 생성 및 tick 서비스
 * @dependsOn src/features/stats/types.ts
 * @usedBy src/features/stats/hooks/useStatsMock.ts
 */

import type { KeywordEntry, ReactionMode, SentimentFlowPoint, StatsSnapshot } from "@/features/stats/types";

export type StatsTickKind = "fast" | "slow";

const KEYWORD_POOL = [
  "잘한다",
  "멋지다",
  "화이팅",
  "ㅋㅋㅋ",
  "대단해",
  "오",
  "굿",
  "오케이",
  "레전드",
  "나이스",
  "아쉽다",
  "진짜",
  "미쳤다",
  "집중",
  "가보자",
];

const NEXT_LINES = [
  "오~ 지금 그 플레이 진짜 깔끔했는데요? 채팅에서도 다들 감탄하고 있어요!",
  "이 흐름이면 분위기 완전히 가져올 수 있겠는데요. 한 번만 더 집중해봅시다!",
  "채팅 반응이 좋아요. 지금처럼만 차분하게 이어가면 됩니다.",
  "방금 판단은 꽤 괜찮았어요. 다음 장면도 기대해볼 만합니다!",
  "지금은 무리하지 말고 템포를 살짝 잡는 게 좋아 보여요.",
  "좋아요, 응원 분위기가 확실히 올라오고 있어요. 계속 밀어붙여봅시다!",
  "시청자들이 지금 포인트를 정확히 보고 있네요. 이 장면은 살려야 합니다.",
  "방금 장면은 하이라이트 후보입니다. 채팅도 바로 반응하고 있어요!",
];

const MODE_LABEL: Record<ReactionMode, string> = {
  cheer: "응원/격려",
  criticism: "비판/견제",
  silence: "침묵/관망",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function createInitialFlow(now = Date.now()): SentimentFlowPoint[] {
  const transitions: Record<number, ReactionMode> = {
    3: "cheer",
    7: "criticism",
    10: "cheer",
  };

  return Array.from({ length: 12 }, (_, index) => {
    const timestamp = formatTime(new Date(now - (11 - index) * 5 * 60_000));
    const positive = clamp(58 + index * 2 + randomInt(-5, 6), 45, 86);
    return {
      timestamp,
      positivePercent: positive,
      negativePercent: 100 - positive,
      modeTransition: transitions[index] ?? null,
    };
  });
}

function createInitialKeywords(): KeywordEntry[] {
  const counts = [87, 64, 52, 48, 42, 37, 33, 29, 24, 20];
  const changes = [12, 8, 0, 5, 3, -2, 4, 0, -3, 2];

  return KEYWORD_POOL.slice(0, 10).map((keyword, index) => ({
    rank: index + 1,
    keyword,
    trend: changes[index] > 0 ? "up" : changes[index] < 0 ? "down" : "flat",
    change: changes[index],
    count: counts[index],
  }));
}

function updateKeywords(prev: KeywordEntry[]): KeywordEntry[] {
  const usedKeywords = new Set<string>();
  const next = prev.map((entry) => {
    const shouldSwapKeyword = Math.random() < 0.18;
    const availableKeywords = KEYWORD_POOL.filter((keyword) => !usedKeywords.has(keyword));
    const keyword = shouldSwapKeyword && availableKeywords.length > 0
      ? sample(availableKeywords)
      : entry.keyword;
    usedKeywords.add(keyword);

    const change = randomInt(-5, 5);
    const trend: KeywordEntry["trend"] = change > 0 ? "up" : change < 0 ? "down" : "flat";

    return {
      ...entry,
      keyword,
      change,
      count: clamp(entry.count + change, 8, 99),
      trend,
    };
  });

  return next
    .sort((a, b) => b.count - a.count)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function nextReactionMode(positivePercent: number): ReactionMode {
  if (positivePercent >= 62) return "cheer";
  if (positivePercent <= 42) return "criticism";
  return Math.random() < 0.22 ? "silence" : "cheer";
}

export function createInitialSnapshot(): StatsSnapshot {
  return {
    sentiment: {
      positivePercent: 73,
      negativePercent: 27,
      currentMode: "cheer",
    },
    decision: {
      mode: "cheer",
      isAuto: true,
    },
    output: {
      ttsReady: true,
      nextLine: NEXT_LINES[0],
      targetEmotion: MODE_LABEL.cheer,
      confidencePercent: 92,
      nextReactionSeconds: 8,
    },
    sentimentFlow: createInitialFlow(),
    keywords: createInitialKeywords(),
    updatedAt: Date.now(),
  };
}

export function tickSnapshot(prev: StatsSnapshot, kind: StatsTickKind): StatsSnapshot {
  if (kind === "fast") {
    const nextSeconds = prev.output.nextReactionSeconds <= 0 ? 8 : prev.output.nextReactionSeconds - 1;
    const shouldRefreshLine = prev.output.nextReactionSeconds <= 0;

    return {
      ...prev,
      output: {
        ...prev.output,
        nextLine: shouldRefreshLine ? sample(NEXT_LINES) : prev.output.nextLine,
        nextReactionSeconds: nextSeconds,
      },
      updatedAt: Date.now(),
    };
  }

  const positivePercent = clamp(prev.sentiment.positivePercent + randomInt(-3, 3), 35, 88);
  const negativePercent = 100 - positivePercent;
  const mode = prev.decision.isAuto ? nextReactionMode(positivePercent) : prev.decision.mode;
  const lastMode = prev.sentiment.currentMode;
  const transition = mode !== lastMode ? mode : Math.random() < 0.2 ? mode : null;
  const flowPositive = clamp(positivePercent + randomInt(-5, 5), 25, 92);

  return {
    ...prev,
    sentiment: {
      positivePercent,
      negativePercent,
      currentMode: mode,
    },
    decision: {
      ...prev.decision,
      mode,
    },
    output: {
      ...prev.output,
      nextLine: sample(NEXT_LINES),
      targetEmotion: MODE_LABEL[mode],
      confidencePercent: clamp(prev.output.confidencePercent + randomInt(-4, 3), 76, 97),
    },
    sentimentFlow: [
      ...prev.sentimentFlow.slice(1),
      {
        timestamp: formatTime(new Date()),
        positivePercent: flowPositive,
        negativePercent: 100 - flowPositive,
        modeTransition: transition,
      },
    ],
    keywords: updateKeywords(prev.keywords),
    updatedAt: Date.now(),
  };
}
