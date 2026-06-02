/**
 * @file 방송 통계 mock snapshot React hook
 * @dependsOn src/features/stats/lib/statsMockService.ts
 * @usedBy src/pages/StatsPage.tsx
 */

import { useEffect, useState } from "react";
import type { StatsSnapshot } from "@/features/stats/types";
import {
  createInitialSnapshot,
  tickSnapshot,
} from "@/features/stats/lib/statsMockService";

interface UseStatsMockReturn {
  snapshot: StatsSnapshot;
}

export function useStatsMock(): UseStatsMockReturn {
  const [snapshot, setSnapshot] = useState(() => createInitialSnapshot());

  useEffect(() => {
    const fastTimer = window.setInterval(() => {
      setSnapshot((prev) => tickSnapshot(prev, "fast"));
    }, 1000);

    const slowTimer = window.setInterval(() => {
      setSnapshot((prev) => tickSnapshot(prev, "slow"));
    }, 30_000);

    return () => {
      window.clearInterval(fastTimer);
      window.clearInterval(slowTimer);
    };
  }, []);

  return { snapshot };
}
