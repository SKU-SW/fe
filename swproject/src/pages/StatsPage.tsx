/**
 * @file 방송 통계 페이지 — 날짜별 방송 캘린더 + 클릭 시 일별 통계 모달
 * @dependsOn src/features/stats/components/BroadcastCalendar.tsx
 * @usedBy src/App.tsx
 *
 * 진행 중 실시간 모니터링은 /chat-analysis (ChatAnalysisPage) 에서 처리한다.
 */

import { BroadcastCalendar } from "@/features/stats/components";

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-content-muted">
        날짜별로 어떤 캐릭터로 방송했는지 한눈에 확인합니다. 셀의 방송 항목을 클릭하면 해당 방송의 상세 통계가 표시됩니다.
      </p>

      <BroadcastCalendar />
    </div>
  );
}
