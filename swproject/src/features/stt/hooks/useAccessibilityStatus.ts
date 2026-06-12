/**
 * @file macOS 손쉬운 사용(Accessibility) 권한 상태 훅
 * @dependsOn window.electronAPI.system.*
 * @usedBy src/pages/DashboardPage.tsx
 *
 * 전역 PTT(uiohook)는 이 권한이 있어야 다른 창 포커스 중에도 키 이벤트를 받는다.
 * 미부여 시 안내 배너를 띄우기 위한 상태/액션을 제공한다. 창 포커스 복귀 때마다
 * 재확인해서, 사용자가 시스템 설정에서 켜고 돌아오면 배너가 자동으로 사라지게 한다.
 */

import { useCallback, useEffect, useState } from "react";

interface AccessibilityStatus {
  /** 권한 부여됨(또는 macOS 가 아니어서 불필요). null = 아직 확인 전. */
  trusted: boolean | null;
  /** 현재 플랫폼이 macOS 인지. null = 아직 확인 전. */
  isMac: boolean | null;
  recheck: () => void;
  openSettings: () => void;
}

export function useAccessibilityStatus(): AccessibilityStatus {
  const [trusted, setTrusted] = useState<boolean | null>(null);
  const [isMac, setIsMac] = useState<boolean | null>(null);

  const recheck = useCallback(() => {
    const system = window.electronAPI?.system;
    if (!system?.getAccessibilityStatus) {
      // Electron 브리지가 없으면(웹 등) 안내 불필요 → trusted 취급.
      setTrusted(true);
      setIsMac(false);
      return;
    }
    void system.getAccessibilityStatus().then(setTrusted).catch(() => setTrusted(true));
  }, []);

  useEffect(() => {
    void window.electronAPI?.getPlatform?.()
      .then((p) => setIsMac(p === "darwin"))
      .catch(() => setIsMac(false));
    recheck();

    const onFocus = () => recheck();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [recheck]);

  const openSettings = useCallback(() => {
    void window.electronAPI?.system?.openAccessibilitySettings?.().catch(() => {
      /* ignore */
    });
  }, []);

  return { trusted, isMac, recheck, openSettings };
}
