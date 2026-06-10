/**
 * @file 방송 설정 훅 — 마운트 시 GET, 토글 변경 시 PATCH, 기본값 복원 mutator
 * @dependsOn src/features/settings/api/broadcastSettingsApi.ts
 * @dependsOn src/shared/stores/aiModeStore.ts (zustand sync)
 * @usedBy src/features/settings/components/BroadcastSettingsTab.tsx
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBroadcastSettings,
  initBroadcastSettings,
  updateAiProactive,
} from "@/features/settings/api/broadcastSettingsApi";
import { useAIModeStore } from "@/shared/stores/aiModeStore";

interface UseBroadcastSettingsReturn {
  /** 백엔드에서 받은 현재 값 (= zustand store와 동기화됨) */
  aiProactiveToChat: boolean;
  isLoading: boolean;
  isPending: boolean;
  error: string | null;
  /** AI 선제 반응 ON/OFF 변경 — optimistic + rollback */
  setAiProactive: (value: boolean) => Promise<void>;
  /** 기본값(aiProactiveToChat: true)으로 초기화 */
  resetToDefault: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useBroadcastSettings(): UseBroadcastSettingsReturn {
  const aiProactiveToChat = useAIModeStore((s) => s.toggles.proactiveReactionEnabled);
  const setToggle = useAIModeStore((s) => s.setToggle);

  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchOnce = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getBroadcastSettings();
      if (!mountedRef.current) return;
      setToggle("proactiveReactionEnabled", res.aiProactiveToChat);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      const status = (err as { response?: { status?: number } })?.response?.status;
      // 404: 설정 미존재 — 사용자가 init 누를 때까지 현재 store 값 유지
      if (status !== 404) {
        const message = err instanceof Error ? err.message : "방송 설정을 불러오지 못했습니다.";
        setError(message);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [setToggle]);

  useEffect(() => {
    void fetchOnce();
  }, [fetchOnce]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const setAiProactive = useCallback(async (value: boolean) => {
    setIsPending(true);
    setError(null);
    const prev = useAIModeStore.getState().toggles.proactiveReactionEnabled;
    setToggle("proactiveReactionEnabled", value); // optimistic
    try {
      const res = await updateAiProactive(value);
      if (!mountedRef.current) return;
      // 응답값으로 확정 sync (멱등이라 보통 그대로지만 안전)
      setToggle("proactiveReactionEnabled", res.aiProactiveToChat);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setToggle("proactiveReactionEnabled", prev); // rollback
      const message = err instanceof Error ? err.message : "AI 선제 반응 변경 실패";
      setError(message);
      throw err;
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }, [setToggle]);

  const resetToDefault = useCallback(async () => {
    setIsPending(true);
    setError(null);
    const prev = useAIModeStore.getState().toggles.proactiveReactionEnabled;
    try {
      const res = await initBroadcastSettings();
      if (!mountedRef.current) return;
      setToggle("proactiveReactionEnabled", res.aiProactiveToChat);
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      setToggle("proactiveReactionEnabled", prev);
      const message = err instanceof Error ? err.message : "방송 설정 초기화 실패";
      setError(message);
      throw err;
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }, [setToggle]);

  const refetch = useCallback(async () => {
    await fetchOnce();
  }, [fetchOnce]);

  return {
    aiProactiveToChat,
    isLoading,
    isPending,
    error,
    setAiProactive,
    resetToDefault,
    refetch,
  };
}
