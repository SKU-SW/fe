/**
 * @file 날짜별 방송 통계 — 캘린더 골격 페이지 (백엔드 일자별 통계 API 연동 전)
 * @dependsOn src/features/stats/components/BroadcastCalendar.tsx
 * @dependsOn src/features/stats/lib/broadcastHistoryMock.ts
 * @usedBy src/App.tsx
 */

import { AlertCircle } from "lucide-react";
import { BroadcastCalendar } from "@/features/stats/components";
import { BROADCAST_HISTORY_MOCK } from "@/features/stats/lib/broadcastHistoryMock";

export default function StatsHistoryPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-content-muted">
        날짜별로 방송이 어떻게 진행됐는지 한눈에 확인합니다. 셀을 클릭하면 해당 방송의 통계가 우측에 표시됩니다.
      </p>

      <div className="rounded-2xl border border-status-warning/30 bg-status-warning/10 p-4 text-status-warning">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold leading-relaxed">
            현재 캘린더는 mock 데이터로 동작합니다. 백엔드 일자별 통계 API 연동 후 실제 방송 기록으로 자동 교체됩니다.
          </p>
        </div>
      </div>

      <BroadcastCalendar entries={BROADCAST_HISTORY_MOCK} />
    </div>
  );
}
