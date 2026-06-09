/**
 * @file 채팅 분석 스냅샷 훅 — REST polling, 404=방송없음, 필터 변경 시 즉시 재조회
 * @dependsOn src/features/stats/api/chatAnalysisApi.ts (getBroadcastChatStats)
 * @usedBy src/pages/ChatAnalysisPage.tsx
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  BroadcastChatStatsResDto,
  BroadcastChatStatsFilter,
  SentimentFlowPoint,
} from "@/features/stats/types";
import { getBroadcastChatStats } from "@/features/stats/api/chatAnalysisApi";

const POLL_INTERVAL_MS = 30_000;
const DEFAULT_FILTER: BroadcastChatStatsFilter = {
  statsCriteria: 1,
  timeRange: 1,
};

interface UseChatAnalysisReturn {
  data: BroadcastChatStatsResDto | null;
  filter: BroadcastChatStatsFilter;
  setFilter: (next: Partial<BroadcastChatStatsFilter>) => void;
  isLoading: boolean;
  error: string | null;
  isBroadcastInactive: boolean;
  lastFetchedAt: number;
  refetch: () => void;
}

export function useChatAnalysis(): UseChatAnalysisReturn {
  const [data, setData] = useState<BroadcastChatStatsResDto | null>(null);
  const [filter, setFilterState] = useState<BroadcastChatStatsFilter>(DEFAULT_FILTER);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBroadcastInactive, setIsBroadcastInactive] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<number>(0);
  const filterRef = useRef(filter);
  filterRef.current = filter;
  const mountedRef = useRef(true);
  // 감정 흐름 데이터 누적용 — 백엔드가 히스토리컬 스냅샷을 반환하므로
  // 프론트에서 시간순으로 포인트를 누적해서 차트에 표시한다.
  const sentimentFlowRef = useRef<SentimentFlowPoint[]>([]);

  const fetchOnce = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsBroadcastInactive(false);
    try {
      const res = await getBroadcastChatStats(filterRef.current);
      if (!mountedRef.current) return;

      // 감정 흐름 데이터 누적: 기존 포인트 + 새 포인트 (중복 제거)
      if (res.sentimentFlow && res.sentimentFlow.length > 0) {
        const existing = sentimentFlowRef.current;
        const existingLabels = new Set(existing.map((p) => p.timeLabel));
        const newPoints = res.sentimentFlow.filter((p) => !existingLabels.has(p.timeLabel));
        if (newPoints.length > 0) {
          sentimentFlowRef.current = [...existing, ...newPoints].sort((a, b) =>
            a.timeLabel.localeCompare(b.timeLabel),
          );
        }
        // 누적된 포인트로 응답 업데이트
        res.sentimentFlow = sentimentFlowRef.current;
      }

      setData(res);
      setLastFetchedAt(Date.now());
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setData(null);
        setIsBroadcastInactive(true);
        setError(null);
        // 방송 종료 시 누적 데이터 초기화
        sentimentFlowRef.current = [];
      } else {
        const message = err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.";
        setError(message);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  // 초기 fetch + filter 변경 시 즉시 refetch
  useEffect(() => {
    void fetchOnce();
  }, [fetchOnce, filter.statsCriteria, filter.timeRange]);

  // 30초 polling (방송 활성 중일 때만)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!isBroadcastInactive) {
        void fetchOnce();
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [fetchOnce, isBroadcastInactive]);

  useEffect(() => {
    // StrictMode의 mount→unmount→remount 사이클에서 ref 인스턴스가 재사용되므로
    // 매 mount 시 true로 리셋해주지 않으면 false인 채로 fetch 응답을 모두 무시하게 된다.
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const setFilter = useCallback((next: Partial<BroadcastChatStatsFilter>) => {
    setFilterState((prev) => ({ ...prev, ...next }));
    // 필터 변경 시 누적 데이터 초기화 (새 범위로 다시 시작)
    sentimentFlowRef.current = [];
  }, []);

  const refetch = useCallback(() => {
    void fetchOnce();
  }, [fetchOnce]);

  return {
    data,
    filter,
    setFilter,
    isLoading,
    error,
    isBroadcastInactive,
    lastFetchedAt,
    refetch,
  };
}
