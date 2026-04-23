/**
 * @file 대시보드 채팅/활동 로그 API 호출 함수
 * @created Sprint 2 - Dashboard API Integration
 * @dependsOn src/shared/lib/axios.ts
 * @usedBy src/features/dashboard/hooks/useDashboardChatStream.ts, src/features/dashboard/hooks/useDashboardActivityLogs.ts
 */

import axios from "axios";
import apiClient from "@/shared/lib/axios";

export interface DashboardChatMessageDto {
  id?: string | number;
  messageId?: string | number;
  username?: string;
  user?: string;
  sender?: string;
  nickname?: string;
  message?: string;
  text?: string;
  content?: string;
  emotion?: string;
  sentiment?: string;
  timestamp?: string;
  createdAt?: string;
}

export interface DashboardActivityLogDto {
  id?: string | number;
  logId?: string | number;
  type?: string;
  category?: string;
  level?: string;
  severity?: string;
  message?: string;
  description?: string;
  timestamp?: string;
  createdAt?: string;
}

const CHAT_ENDPOINT_CANDIDATES = [
  "/api/v1/dashboard/chat/messages",
  "/api/v1/chat/messages",
  "/api/v1/chats/messages",
] as const;

const ACTIVITY_ENDPOINT_CANDIDATES = [
  "/api/v1/dashboard/activity-logs",
  "/api/v1/activity-logs",
  "/api/v1/dashboard/logs",
] as const;

const DEFAULT_LIMIT = 30;

function extractArrayPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.content)) {
      return record.content as T[];
    }
    if (Array.isArray(record.items)) {
      return record.items as T[];
    }
    if (Array.isArray(record.data)) {
      return record.data as T[];
    }
  }

  return [];
}

async function getFromCandidates<T>(
  candidates: readonly string[],
  params: { limit?: number }
): Promise<T[]> {
  const limit = params.limit ?? DEFAULT_LIMIT;

  let lastError: unknown;
  for (const endpoint of candidates) {
    try {
      const res = await apiClient.get<unknown>(endpoint, {
        params: { limit },
      });
      return extractArrayPayload<T>(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error("대시보드 API 엔드포인트를 찾을 수 없습니다.");
}

export async function getDashboardChatMessages(params?: { limit?: number }): Promise<DashboardChatMessageDto[]> {
  return getFromCandidates<DashboardChatMessageDto>(CHAT_ENDPOINT_CANDIDATES, {
    limit: params?.limit,
  });
}

export async function getDashboardActivityLogs(params?: { limit?: number }): Promise<DashboardActivityLogDto[]> {
  return getFromCandidates<DashboardActivityLogDto>(ACTIVITY_ENDPOINT_CANDIDATES, {
    limit: params?.limit,
  });
}
