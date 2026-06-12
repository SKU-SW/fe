/**
 * @file 인앱 PTT 폴백 — 앱 창이 포커스된 동안 동작하는 push-to-talk
 * @dependsOn src/services/sttBackgroundService.ts
 * @dependsOn src/shared/stores/appSettingsStore.ts (pttShortcut)
 * @dependsOn src/shared/stores/aiModeStore.ts (toggles.sttEnabled)
 * @usedBy src/components/AppInitializer.tsx
 *
 * 왜 필요한가:
 *   전역 PTT(uiohook)는 macOS 손쉬운 사용 권한이 있어야 키 이벤트를 받는다. 미서명/ad-hoc
 *   배포본은 재설치마다 서명 신원이 바뀌어 권한이 무효화되기 쉽고, 그러면 전역 훅이 조용히
 *   죽어 STT 트리거 경로가 통째로 사라진다(무반응·무에러).
 *   이 훅은 앱 "창이 포커스된" 동안에는 일반 DOM keydown/keyup 으로 같은 단축키를 받아
 *   STT 를 직접 트리거한다 → 권한 없이도 항상 동작하는 폴백. 전역 훅과 공존해도
 *   sttBackgroundService 의 중복 start/stop 가드 덕분에 안전하다.
 */

import { useEffect } from "react";
import { sttBackgroundService } from "@/services/sttBackgroundService";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import {
  useAppSettingsStore,
  type PttShortcutSettings,
} from "@/shared/stores/appSettingsStore";

/** 설정된 hotkey 키(`M`, `Space`, `F1`...)를 KeyboardEvent.code 로 매핑. */
function shortcutKeyToCode(key: string): string {
  if (key === "Space") return "Space";
  if (/^F\d{1,2}$/.test(key)) return key; // F1~F12 는 event.code 가 동일
  return `Key${key.toUpperCase()}`; // A~Z → KeyA...
}

/** 포커스가 텍스트 입력 요소에 있으면 PTT 를 발동하지 않는다(타이핑 오발동 방지). */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

/** keydown 이벤트가 설정된 PTT 조합과 일치하는지. */
function matchesCombo(event: KeyboardEvent, shortcut: PttShortcutSettings): boolean {
  if (event.code !== shortcutKeyToCode(shortcut.key)) return false;
  if (shortcut.ctrlOrCmd && !(event.metaKey || event.ctrlKey)) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (shortcut.alt && !event.altKey) return false;
  return true;
}

/** keyup 으로 떨어진 키가 조합 구성요소(메인 키 또는 요구 modifier)인지. */
function isComboMemberKeyUp(event: KeyboardEvent, shortcut: PttShortcutSettings): boolean {
  if (event.code === shortcutKeyToCode(shortcut.key)) return true;
  const code = event.code;
  if (shortcut.ctrlOrCmd && (code === "MetaLeft" || code === "MetaRight" || code === "ControlLeft" || code === "ControlRight")) {
    return true;
  }
  if (shortcut.shift && (code === "ShiftLeft" || code === "ShiftRight")) return true;
  if (shortcut.alt && (code === "AltLeft" || code === "AltRight")) return true;
  return false;
}

export function useInAppPtt(): void {
  useEffect(() => {
    let held = false;

    const start = () => {
      if (held) return;
      held = true;
      console.info("[ptt][inapp] START (focused-window keydown)");
      void sttBackgroundService.startListening();
    };

    const stop = () => {
      if (!held) return;
      held = false;
      console.info("[ptt][inapp] STOP");
      void sttBackgroundService.stopListening();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!useAIModeStore.getState().toggles.sttEnabled) return;
      if (event.repeat) return; // hold 중 반복 keydown 무시
      if (isTypingTarget(event.target)) return;
      const shortcut = useAppSettingsStore.getState().pttShortcut;
      if (!matchesCombo(event, shortcut)) return;
      event.preventDefault();
      start();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (!held) return;
      const shortcut = useAppSettingsStore.getState().pttShortcut;
      // hold-to-talk: 조합을 깨는 첫 keyup(메인 키 또는 modifier release)에서 전송한다.
      if (isComboMemberKeyUp(event, shortcut)) {
        stop();
      }
    };

    // 창이 포커스를 잃으면(다른 앱으로 전환 등) keyup 을 못 받을 수 있으므로 안전하게 종료.
    const onBlur = () => stop();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      if (held) void sttBackgroundService.stopListening();
    };
  }, []);
}
