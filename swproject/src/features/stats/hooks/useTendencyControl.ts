/**
 * @file AI 파트너 성향 수동 제어 훅 — AUTO/MANUAL 전환 및 성향 직접 지정
 * @dependsOn src/features/stats/api/chatAnalysisApi.ts (updateCharacterTendency)
 * @usedBy src/pages/ChatAnalysisPage.tsx
 */

import { useCallback, useState } from "react";
import { updateCharacterTendency } from "@/features/stats/api/chatAnalysisApi";
import type { AiTendency, TendencyVersion } from "@/features/stats/types";

interface UseTendencyControlReturn {
  version: TendencyVersion;
  selectedTendency: AiTendency;
  isPending: boolean;
  error: string | null;
  applyManual: (tendency: AiTendency) => Promise<void>;
  resetToAuto: () => Promise<void>;
}

export function useTendencyControl(): UseTendencyControlReturn {
  const [version, setVersion] = useState<TendencyVersion>("AUTO");
  const [selectedTendency, setSelectedTendency] = useState<AiTendency>("NEUTRAL");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyManual = useCallback(async (tendency: AiTendency) => {
    setIsPending(true);
    setError(null);
    const prev = version;
    const prevTendency = selectedTendency;
    setVersion("MANUAL");
    setSelectedTendency(tendency); // 즉시 UI 업데이트
    try {
      await updateCharacterTendency({ version: "MANUAL", tendency });
    } catch (err: unknown) {
      setVersion(prev);
      setSelectedTendency(prevTendency); // 롤백
      setError(err instanceof Error ? err.message : "편승 변경 실패");
    } finally {
      setIsPending(false);
    }
  }, [version, selectedTendency]);

  const resetToAuto = useCallback(async () => {
    setIsPending(true);
    setError(null);
    const prev = version;
    setVersion("AUTO");
    try {
      await updateCharacterTendency({ version: "AUTO" });
    } catch (err: unknown) {
      setVersion(prev);
      setError(err instanceof Error ? err.message : "편승 초기화 실패");
    } finally {
      setIsPending(false);
    }
  }, [version]);

  return { version, selectedTendency, isPending, error, applyManual, resetToAuto };
}
