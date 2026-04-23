/**
 * @file 대시보드 AI 활동 로그 조회 훅
 * @created Sprint 2 - Dashboard API Integration
 * @dependsOn src/features/dashboard/api/dashboardApi.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAIModeStore, ActivityLog } from "@/shared/stores/aiModeStore";
import { getDashboardActivityLogs, DashboardActivityLogDto } from "@/features/dashboard/api/dashboardApi";

interface UseDashboardActivityLogsReturn {
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const POLLING_INTERVAL_MS = 8000;

function toDate(value?: string): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeType(value?: string): ActivityLog["type"] {
  const lowered = (value ?? "").toLowerCase();

  if (lowered.includes("reaction") || lowered.includes("response")) {
    return "reaction";
  }
  if (lowered.includes("chat")) {
    return "chat";
  }
  if (lowered.includes("emotion") || lowered.includes("sentiment")) {
    return "emotion";
  }
  if (lowered.includes("persona") || lowered.includes("character")) {
    return "persona";
  }
  return "system";
}

function normalizeLevel(value?: string): ActivityLog["level"] {
  const lowered = (value ?? "").toLowerCase();
  if (lowered.includes("error") || lowered.includes("fatal")) {
    return "error";
  }
  if (lowered.includes("warn")) {
    return "warning";
  }
  return "info";
}

function toActivityLog(dto: DashboardActivityLogDto): ActivityLog {
  const rawId = dto.id ?? dto.logId ?? `${Date.now()}-${Math.random()}`;
  const id = String(rawId);
  const type = normalizeType(dto.type ?? dto.category);
  const level = normalizeLevel(dto.level ?? dto.severity);
  const message = dto.message ?? dto.description ?? "활동 로그";
  const timestamp = toDate(dto.timestamp ?? dto.createdAt);

  return {
    id,
    type,
    level,
    message,
    timestamp,
  };
}

export function useDashboardActivityLogs(): UseDashboardActivityLogsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addActivityLog = useAIModeStore((s) => s.addActivityLog);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const pushLogs = useCallback(
    (items: DashboardActivityLogDto[]) => {
      items
        .map(toActivityLog)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .forEach((log) => {
          if (seenIdsRef.current.has(log.id)) {
            return;
          }

          seenIdsRef.current.add(log.id);
          addActivityLog(log);
        });
    },
    [addActivityLog]
  );

  const fetchLogs = useCallback(async () => {
    setError(null);
    try {
      const items = await getDashboardActivityLogs({ limit: 30 });
      pushLogs(items);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "활동 로그를 불러오지 못했습니다.";
      setError(message);
    }
  }, [pushLogs]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchLogs();
    setIsLoading(false);
  }, [fetchLogs]);

  useEffect(() => {
    setIsLoading(true);
    fetchLogs().finally(() => {
      setIsLoading(false);
    });
  }, [fetchLogs]);

  useEffect(() => {
    const timerId = setInterval(() => {
      fetchLogs();
    }, POLLING_INTERVAL_MS);

    return () => {
      clearInterval(timerId);
    };
  }, [fetchLogs]);

  return {
    isLoading,
    error,
    refetch,
  };
}
