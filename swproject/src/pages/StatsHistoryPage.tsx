/**
 * @file 날짜별 방송 통계 placeholder 페이지
 * @dependsOn src/features/stats/components/StatsHistoryEmptyCard.tsx
 * @usedBy src/App.tsx
 */

import { AlertCircle } from "lucide-react";
import { StatsHistoryEmptyCard } from "@/features/stats/components";

const HISTORY_ITEMS = [
  { date: "2026-05-29", title: "저녁 소통 방송", summary: "평균 긍정 73% · 주요 키워드: 잘한다, 화이팅, 레전드" },
  { date: "2026-05-28", title: "스토리 게임 플레이", summary: "평균 긍정 68% · 주요 키워드: 몰입, 대단해, ㅋㅋㅋ" },
  { date: "2026-05-27", title: "랭크 도전 방송", summary: "평균 긍정 61% · 주요 키워드: 나이스, 아쉽다, 집중" },
  { date: "2026-05-26", title: "신규 콘텐츠 테스트", summary: "평균 긍정 79% · 주요 키워드: 굿, 오케이, 미쳤다" },
  { date: "2026-05-25", title: "주말 하이라이트", summary: "평균 긍정 75% · 주요 키워드: 멋지다, 가보자, 오" },
  { date: "2026-05-24", title: "시청자 참여 방송", summary: "평균 긍정 71% · 주요 키워드: 화이팅, 레전드, 진짜" },
];

export default function StatsHistoryPage() {
  const handleCardClick = () => {
    window.alert("DB 연동 후 활성화 예정");
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-content-muted">방송 종료 후 저장될 통계 기록을 미리 보여주는 placeholder입니다.</p>

      <div className="rounded-2xl border border-status-warning/30 bg-status-warning/10 p-4 text-status-warning">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold leading-relaxed">
            이 페이지는 DB 연동 전 placeholder 입니다. 방송 종료 시 자동 저장되도록 백엔드 연동 예정.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {HISTORY_ITEMS.map((item) => (
          <StatsHistoryEmptyCard
            key={item.date}
            date={item.date}
            title={item.title}
            summary={item.summary}
            onClick={handleCardClick}
          />
        ))}
      </div>
    </div>
  );
}
