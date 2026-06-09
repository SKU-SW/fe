/**
 * @file OBS Studio 감지/실행 훅
 * @created Sprint OBS Phase 1
 * @dependsOn electron/preload.ts, electron/preload.d.ts
 * @dependsOn src/shared/stores/alarmStore.ts
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useCallback, useState } from "react";
import { useAlarmStore } from "@/shared/stores/alarmStore";

export interface ObsDiagnostics {
  host: string;
  port: number;
  configPath: string;
  configSource: "portable" | "standard" | "default";
  configFound: boolean;
  serverEnabled: boolean;
  authRequired: boolean;
  passwordConfigured: boolean;
  obsExecutablePath: string | null;
}

export type ObsLaunchStatus =
  | "idle"
  | "detecting"
  | "launching"
  | "launched"
  | "not_found"
  | "error"
  | "connecting"
  | "setup_ok"
  | "auth_required"
  | "timeout"
  | "setup_failed";

interface UseObsLaunchReturn {
  obsStatus: ObsLaunchStatus;
  obsError: string | null;
  obsDiagnostics: ObsDiagnostics | null;
  launchObs: (overlayUrl: string) => Promise<void>;
  resetObsStatus: () => void;
}

export function useObsLaunch(): UseObsLaunchReturn {
  const [obsStatus, setObsStatus] = useState<ObsLaunchStatus>("idle");
  const [obsError, setObsError] = useState<string | null>(null);
  const [obsDiagnostics, setObsDiagnostics] = useState<ObsDiagnostics | null>(null);
  const pushAlarm = useAlarmStore((s) => s.push);

  const launchObs = useCallback(async (overlayUrl: string) => {
    if (obsStatus === "detecting" || obsStatus === "launching" || obsStatus === "connecting") {
      return;
    }

    if (typeof window === "undefined" || !window.electronAPI?.obs?.connectAndSetup) {
      return;
    }

    try {
      setObsStatus("connecting");
      setObsError(null);
      setObsDiagnostics(null);
      const result = await window.electronAPI.obs.connectAndSetup(overlayUrl);
      setObsStatus(result.status);
      setObsError(result.error ?? null);
      setObsDiagnostics(result.diagnostics ?? null);
      if (result.status === "setup_ok") {
        pushAlarm("obs.connected");
      } else if (result.status === "not_found") {
        pushAlarm("obs.not_found");
      } else if (
        result.status === "auth_required" ||
        result.status === "timeout" ||
        result.status === "setup_failed" ||
        result.status === "error"
      ) {
        pushAlarm("obs.connect_failed");
      }
    } catch (err: unknown) {
      setObsStatus("setup_failed");
      setObsError(err instanceof Error ? err.message : "OBS 자동 설정 호출 중 예외가 발생했습니다.");
      setObsDiagnostics(null);
      pushAlarm("obs.connect_failed");
    }
  }, [obsStatus, pushAlarm]);

  const resetObsStatus = useCallback(() => {
    setObsStatus("idle");
    setObsError(null);
    setObsDiagnostics(null);
  }, []);

  return { obsStatus, obsError, obsDiagnostics, launchObs, resetObsStatus };
}
