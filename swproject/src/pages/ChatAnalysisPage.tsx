/**
 * @file 채팅 분석 페이지 — 실시간 채팅 감정 분석 + LLM 판단 상태 + 키워드 추출
 * @dependsOn src/features/stats/hooks/useStatsMock.ts, src/features/stats/components/*
 * @usedBy src/App.tsx
 *
 * 본 페이지는 방송 진행 중 보는 실시간 모니터링 화면이다.
 * 사후 집계/회고는 별도의 /stats 경로(StatsPage) 에서 담당한다.
 */

import { RefreshCw } from "lucide-react";
import {
  LlmJudgmentPanel,
  RealtimeKeywordList,
  SentimentFlowChart,
} from "@/features/stats/components";
import { useStatsMock } from "@/features/stats/hooks/useStatsMock";

function formatUpdatedAt(value: number): string {
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function ChatAnalysisPage() {
  const { snapshot } = useStatsMock();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-raised px-3 py-1 text-xs font-bold text-content-muted">
            <RefreshCw className="h-3.5 w-3.5" />
            Mock live · {formatUpdatedAt(snapshot.updatedAt)} 갱신
          </p>
          <p className="mt-3 text-sm text-content-muted">
            실시간 채팅 감정 분석, LLM 반응 결정 상태, TOP 키워드를 한 화면에서 확인합니다.
          </p>
        </div>
      </div>

      <LlmJudgmentPanel snapshot={snapshot} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <SentimentFlowChart points={snapshot.sentimentFlow} />
        <RealtimeKeywordList keywords={snapshot.keywords} />
      </div>
    </div>
  );
}
