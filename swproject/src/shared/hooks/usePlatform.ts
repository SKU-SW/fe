/**
 * @file 현재 실행 플랫폼(Electron host OS) 감지 훅
 * @dependsOn window.electronAPI.getPlatform
 * @usedBy src/components/layouts/DashboardSidebar.tsx
 *
 * Electron preload 가 노출한 getPlatform() 을 마운트 시 1회 호출하여 결과를 보관.
 * 브라우저(비 Electron) 환경에서는 "unknown" 으로 폴백한다.
 *
 * 사용 예:
 *   const isMac = usePlatform() === "darwin";
 */

import { useEffect, useState } from "react";

export type Platform = "darwin" | "win32" | "linux" | "unknown";

function isKnownPlatform(value: string): value is Platform {
  return value === "darwin" || value === "win32" || value === "linux";
}

export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const getPlatform = window.electronAPI?.getPlatform;
    if (typeof getPlatform !== "function") return;

    let cancelled = false;
    void getPlatform()
      .then((value) => {
        if (cancelled) return;
        setPlatform(isKnownPlatform(value) ? value : "unknown");
      })
      .catch(() => {
        // Electron API 호출 실패 시 unknown 유지
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return platform;
}
