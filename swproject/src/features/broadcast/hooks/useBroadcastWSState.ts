/**
 * @file 전역 상주형 방송 WS 서비스 상태 구독 훅
 * @dependsOn react
 * @dependsOn src/services/broadcastWSBackgroundService.ts
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useSyncExternalStore } from "react";
import { broadcastWSBackgroundService } from "@/services/broadcastWSBackgroundService";

export function useBroadcastWSState() {
  return useSyncExternalStore(
    (listener) => broadcastWSBackgroundService.subscribeState(listener),
    () => broadcastWSBackgroundService.getSnapshot(),
    () => broadcastWSBackgroundService.getSnapshot()
  );
}
