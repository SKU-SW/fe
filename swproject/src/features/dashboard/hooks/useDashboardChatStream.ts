/**
 * @file 대시보드 채팅 실시간 스트림 훅
 * @created Sprint 2 - Dashboard API Integration
 * @dependsOn src/features/dashboard/api/dashboardApi.ts
 * @dependsOn src/shared/hooks/useWebSocket.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWebSocket } from "@/shared/hooks/useWebSocket";
import { useAIModeStore, ChatMessage, EmotionType } from "@/shared/stores/aiModeStore";
import { getDashboardChatMessages, DashboardChatMessageDto } from "@/features/dashboard/api/dashboardApi";

interface UseDashboardChatStreamOptions {
  /** false 일 때 폴링/WebSocket 모두 정지 (방송 중이 아닐 때 트래픽 차단용) */
  enabled?: boolean;
}

interface UseDashboardChatStreamReturn {
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  refetch: () => Promise<void>;
}

const POLLING_INTERVAL_MS = 5000;
const SUPPORTED_EMOTIONS: EmotionType[] = ["joy", "anger", "sadness", "fear", "surprise", "neutral"];

function toDate(value?: string): Date {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeEmotion(value?: string): EmotionType {
  if (!value) {
    return "neutral";
  }

  const lowered = value.toLowerCase();
  if (SUPPORTED_EMOTIONS.includes(lowered as EmotionType)) {
    return lowered as EmotionType;
  }

  if (lowered.includes("positive") || lowered.includes("joy")) {
    return "joy";
  }

  if (lowered.includes("negative") || lowered.includes("anger")) {
    return "anger";
  }

  return "neutral";
}

function toChatMessage(dto: DashboardChatMessageDto): ChatMessage {
  const rawId = dto.id ?? dto.messageId ?? `${Date.now()}-${Math.random()}`;
  const id = String(rawId);
  const username = dto.username ?? dto.user ?? dto.sender ?? dto.nickname ?? "익명";
  const message = dto.message ?? dto.text ?? dto.content ?? "";
  const timestamp = toDate(dto.timestamp ?? dto.createdAt);

  return {
    id,
    username,
    message,
    emotion: normalizeEmotion(dto.emotion ?? dto.sentiment),
    timestamp,
  };
}

export function useDashboardChatStream(
  options: UseDashboardChatStreamOptions = {}
): UseDashboardChatStreamReturn {
  const { enabled = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addChatMessage = useAIModeStore((s) => s.addChatMessage);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // 마운트 시 store에 이미 있는 메시지 ID를 seen에 등록.
  // - chatMessages 는 persist 대상이 아니지만 Zustand 자체는 메모리에 남아있어서,
  //   페이지 재진입 시 같은 메시지가 다시 푸시되면 중복 누적될 수 있음.
  useEffect(() => {
    const existing = useAIModeStore.getState().chatMessages;
    existing.forEach((m) => seenIdsRef.current.add(m.id));
  }, []);

  const wsUrl = useMemo(() => {
    const baseUrl = import.meta.env.VITE_WS_URL;
    if (!baseUrl) {
      return null;
    }

    try {
      return new URL("/ws/chat", baseUrl).toString();
    } catch {
      return `${baseUrl.replace(/\/$/, "")}/ws/chat`;
    }
  }, []);

  const pushMessages = useCallback(
    (items: DashboardChatMessageDto[]) => {
      items
        .map(toChatMessage)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .forEach((message) => {
          if (seenIdsRef.current.has(message.id)) {
            return;
          }

          seenIdsRef.current.add(message.id);
          addChatMessage(message);
        });
    },
    [addChatMessage]
  );

  const fetchLatestChats = useCallback(async () => {
    setError(null);
    try {
      const items = await getDashboardChatMessages({ limit: 30 });
      pushMessages(items);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "채팅 데이터를 불러오지 못했습니다.";
      setError(message);
    }
  }, [pushMessages]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await fetchLatestChats();
    setIsLoading(false);
  }, [fetchLatestChats]);

  useEffect(() => {
    if (!enabled) return;
    setIsLoading(true);
    fetchLatestChats().finally(() => {
      setIsLoading(false);
    });
  }, [enabled, fetchLatestChats]);

  useEffect(() => {
    if (!enabled) return;
    const timerId = setInterval(() => {
      fetchLatestChats();
    }, POLLING_INTERVAL_MS);

    return () => {
      clearInterval(timerId);
    };
  }, [enabled, fetchLatestChats]);

  const { isConnected } = useWebSocket<DashboardChatMessageDto | DashboardChatMessageDto[]>({
    url: wsUrl ?? "",
    enabled: enabled && Boolean(wsUrl),
    onMessage: (payload) => {
      const items = Array.isArray(payload) ? payload : [payload];
      pushMessages(items);
      setError(null);
    },
    onError: () => {
      setError((prev) => prev ?? "실시간 채팅 연결 중 오류가 발생했습니다. 폴링으로 계속 갱신합니다.");
    },
  });

  return {
    isLoading,
    error,
    isConnected,
    refetch,
  };
}
