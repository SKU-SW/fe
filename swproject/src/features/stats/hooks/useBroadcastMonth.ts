/**
 * @file 월별 방송 기록 조회 훅 — 캘린더 셀 데이터 source
 * @dependsOn src/features/stats/api/broadcastStatsApi.ts
 * @usedBy src/features/stats/components/BroadcastCalendar.tsx
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  BroadcastMonthInfo,
  BroadcastMonthResDto,
} from "@/features/stats/types";
import { getBroadcastMonth } from "@/features/stats/api/broadcastStatsApi";

interface UseBroadcastMonthReturn {
  entries: BroadcastMonthInfo[];
  year: number;
  month: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBroadcastMonth(year: number, month: number): UseBroadcastMonthReturn {
  const [data, setData] = useState<BroadcastMonthResDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchOnce = useCallback(async (y: number, m: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getBroadcastMonth({ year: y, month: m });
      if (!mountedRef.current) return;
      setData(res);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : "방송 기록을 불러오지 못했습니다.";
      setError(message);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOnce(year, month);
  }, [fetchOnce, year, month]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refetch = useCallback(() => {
    void fetchOnce(year, month);
  }, [fetchOnce, year, month]);

  return {
    entries: data?.broadcastMonthInfoList ?? [],
    year: data?.broadcastYear ?? year,
    month: data?.broadcastMonth ?? month,
    isLoading,
    error,
    refetch,
  };
}
