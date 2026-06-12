/**
 * @file 대시보드 체류 중에만 시청자 채팅 polling 을 켜는 훅
 * @dependsOn src/services/broadcastWSBackgroundService.ts
 * @usedBy src/pages/DashboardPage.tsx
 *
 * 시청자 채팅 polling(/stream/info 3초 주기)은 대시보드 채팅 목록 표시 전용이다.
 * 전역 resident 서비스(WS/TTS/STT)와 달리 다른 페이지에서까지 돌릴 이유가 없어,
 * 대시보드가 마운트되어 있고 방송 중일 때만 켜고 떠나면 끈다(서버 부하/로그 절감).
 */

import { useEffect } from "react";
import { broadcastWSBackgroundService } from "@/services/broadcastWSBackgroundService";

export function useViewerChatPolling(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    broadcastWSBackgroundService.startViewerChatPolling();
    return () => {
      broadcastWSBackgroundService.stopViewerChatPolling();
    };
  }, [enabled]);
}
