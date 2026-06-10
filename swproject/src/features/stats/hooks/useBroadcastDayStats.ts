/**
 * @file 일별 방송 통계 조회 훅 — broadcastId 선택 시 fetch, null이면 idle
 * @dependsOn src/features/stats/api/broadcastStatsApi.ts
 * @usedBy src/features/stats/components/BroadcastCalendar.tsx
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { BroadcastDayStatsResDto } from "@/features/stats/types";
import { getBroadcastDayStats } from "@/features/stats/api/broadcastStatsApi";

interface UseBroadcastDayStatsReturn {
  data: BroadcastDayStatsResDto | null;
  isLoading: boolean;
  error: string | null;
  /** 본인 방송 아니거나 존재하지 않음 (404) */
  isNotFound: boolean;
  refetch: () => void;
}

export function useBroadcastDayStats(broadcastId: number | null): UseBroadcastDayStatsReturn {
  const [data, setData] = useState<BroadcastDayStatsResDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const mountedRef = useRef(true);

  const fetchOnce = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);
    setIsNotFound(false);
    try {
      const res = await getBroadcastDayStats(id);
      if (!mountedRef.current) return;
      setData(res);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setIsNotFound(true);
        setData(null);
      } else {
        const message = err instanceof Error ? err.message : "방송 통계를 불러오지 못했습니다.";
        setError(message);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (broadcastId === null) {
      setData(null);
      setError(null);
      setIsNotFound(false);
      setIsLoading(false);
      return;
    }
    void fetchOnce(broadcastId);
  }, [broadcastId, fetchOnce]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refetch = useCallback(() => {
    if (broadcastId !== null) void fetchOnce(broadcastId);
  }, [broadcastId, fetchOnce]);

  return { data, isLoading, error, isNotFound, refetch };
}
