/**
 * @file Electron 메인 프로세스와 앱 설정 동기화 컴포넌트
 * @dependsOn src/shared/stores/appSettingsStore.ts
 * @usedBy src/main.tsx
 */

import { useEffect } from "react";
import { useAppSettingsStore } from "@/shared/stores/appSettingsStore";

export default function AppSettingsSync() {
  const syncToElectron = useAppSettingsStore((s) => s.syncToElectron);

  useEffect(() => {
    syncToElectron();
  }, [syncToElectron]);

  return null;
}
