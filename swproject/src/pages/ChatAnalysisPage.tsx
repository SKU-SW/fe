/**
 * @file 채팅 분석 페이지 — 방송 중 채팅 감정 분석 + AI 성향 + 키워드
 * @dependsOn src/features/stats/hooks/useChatAnalysis.ts, src/features/stats/components/*
 * @usedBy src/App.tsx
 *
 * 본 페이지는 방송 진행 중 보는 실시간 모니터링 화면이다.
 * 사후 집계/회고는 별도의 /stats 경로(StatsPage) 에서 담당한다.
 */

import { useState, useEffect } from "react";
import { RefreshCw, AlertCircle, Radio } from "lucide-react";
import {
  LlmJudgmentPanel,
  RealtimeKeywordList,
  SentimentFlowChart,
} from "@/features/stats/components";
import { useChatAnalysis } from "@/features/stats/hooks/useChatAnalysis";
import { useTendencyControl } from "@/features/stats/hooks/useTendencyControl";

function formatUpdatedAt(value: number): string {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function ChatAnalysisPage() {
  const {
    data,
    filter,
    setFilter,
    isLoading,
    error,
    isBroadcastInactive,
    lastFetchedAt,
    refetch,
  } = useChatAnalysis();
  const {
    version,
    selectedTendency,
    isPending: tendencyPending,
    applyManual,
    resetToAuto,
  } = useTendencyControl();

  const STALE_THRESHOLD_MS = 60_000;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const isStale = lastFetchedAt > 0 && (now - lastFetchedAt) >= STALE_THRESHOLD_MS;

  // 방송 비활성화 상태
  if (isBroadcastInactive) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Radio className="h-16 w-16 text-content-muted/40" />
        <h2 className="mt-4 text-xl font-extrabold text-content-primary">방송이 진행 중이 아닙니다</h2>
        <p className="mt-2 text-sm text-content-muted">
          활성 방송이 없어 채팅 분석 데이터를 불러올 수 없습니다.
        </p>
        <button
          type="button"
          onClick={refetch}
          disabled={isLoading}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-base px-4 py-2 text-sm font-bold text-content-secondary transition-colors hover:bg-surface-raised disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          다시 확인
        </button>
      </div>
    );
  }

  // 에러 상태
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-status-danger/60" />
        <h2 className="mt-4 text-xl font-extrabold text-content-primary">데이터를 불러올 수 없습니다</h2>
        <p className="mt-2 text-sm text-content-muted">{error}</p>
        <button
          type="button"
          onClick={refetch}
          disabled={isLoading}
          className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-base px-4 py-2 text-sm font-bold text-content-secondary transition-colors hover:bg-surface-raised disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          다시 시도
        </button>
      </div>
    );
  }

  // 로딩 중 (첫 fetch)
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="h-12 w-12 animate-spin text-content-muted/40" />
        <p className="mt-4 text-sm text-content-muted">채팅 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-raised px-3 py-1 text-xs font-bold text-content-muted">
              <Radio className="h-3.5 w-3.5 text-status-success" />
              Live · {formatUpdatedAt(lastFetchedAt)} 갱신
            </span>
            <button
              type="button"
              onClick={refetch}
              disabled={isLoading}
              aria-label="새로고침"
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
                isStale
                  ? "border-brand/60 bg-brand/10 text-brand animate-pulse"
                  : "border-border-default bg-surface-raised text-content-secondary hover:bg-surface-hover"
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "갱신 중..." : "새로고침"}
            </button>
          </div>
          <p className="mt-3 text-sm text-content-muted">
            실시간 채팅 감정 분석, AI 파트너 성향, TOP 키워드를 한 화면에서 확인합니다.
          </p>
        </div>
      </div>

      <LlmJudgmentPanel
        opinion={data.publicOpinion}
        tendency={data.aiPartnerTendency}
        selectedTendency={selectedTendency}
        version={version}
        isPending={tendencyPending}
        onApplyManual={applyManual}
        onResetToAuto={resetToAuto}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <SentimentFlowChart
          points={data.sentimentFlow}
          filter={filter}
          onChangeFilter={setFilter}
        />
        <RealtimeKeywordList keywords={data.topKeywords} />
      </div>
    </div>
  );
}
