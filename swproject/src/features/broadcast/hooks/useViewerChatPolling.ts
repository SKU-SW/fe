/**
 * @file 대시보드 체류 중 시청자 채팅 polling 레거시 호환 훅
 * @deprecated Phase 2 완료: viewer polling은 broadcastWSBackgroundService가 전역으로 자동 관리함.
 *             이 훅은 중복 polling을 막기 위해 의도적으로 no-op wrapper로 유지된다.
 * @usedBy (deprecated — 더 이상 사용되지 않음)
 */

import { useEffect } from "react";

interface UseViewerChatPollingOptions {
  enabled?: boolean;
  size?: number;
  intervalMs?: number;
}

export function useViewerChatPolling(_options: UseViewerChatPollingOptions = {}) {
  useEffect(() => {
    return () => undefined;
  }, []);
}
