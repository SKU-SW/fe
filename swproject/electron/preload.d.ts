/**
 * @file Electron preload 타입 정의
 * @created Sprint 1 - Electron preload 타입 정의
 * @dependsOn 없음 (순수 타입 정의)
 * @related electron/preload.ts (실제 구현)
 *
 * 역할:
 * - window.electronAPI의 타입을 TypeScript에 알림
 * - renderer 코드에서 window.electronAPI를 타입 안전하게 사용 가능
 */

/**
 * Electron IPC API 인터페이스
 * - preload.ts에서 contextBridge로 노출하는 메서드들과 일치해야 함
 */
interface ElectronAPI {
  /** 앱 버전 조회 (main: app.getVersion()) */
  getAppVersion: () => Promise<string>;
  /** 실행 플랫폼 조회 (main: process.platform) */
  getPlatform: () => Promise<string>;
  appSettings: {
    get: () => Promise<{
      closeToTray: boolean;
      pttShortcut: {
        ctrlOrCmd: boolean;
        shift: boolean;
        alt: boolean;
        key: string;
      };
    }>;
    set: (settings: {
      closeToTray: boolean;
      pttShortcut: {
        ctrlOrCmd: boolean;
        shift: boolean;
        alt: boolean;
        key: string;
      };
    }) => Promise<{ ok: boolean; settings: {
      closeToTray: boolean;
      pttShortcut: {
        ctrlOrCmd: boolean;
        shift: boolean;
        alt: boolean;
        key: string;
      };
    } }>;
  };
  shell: {
    openExternal: (url: string) => Promise<void>;
  };
  obs: {
    detect: () => Promise<{ found: boolean; path: string | null }>;
    launch: (obsPath: string) => Promise<{ ok: boolean; error?: string }>;
    connectAndSetup: (overlayUrl: string) => Promise<{
      ok: boolean;
      status: 'setup_ok' | 'not_found' | 'auth_required' | 'timeout' | 'setup_failed';
      error?: string;
      diagnostics?: {
        host: string;
        port: number;
        configPath: string;
        configSource: 'portable' | 'standard' | 'default';
        configFound: boolean;
        serverEnabled: boolean;
        authRequired: boolean;
        passwordConfigured: boolean;
        obsExecutablePath: string | null;
      };
    }>;
  };
  overlay: {
    getState: () => Promise<import('../src/shared/types/overlay').OverlayBridgeState>;
    setState: (state: import('../src/shared/types/overlay').OverlayBridgeState) => Promise<{
      ok: boolean;
      state: import('../src/shared/types/overlay').OverlayBridgeState;
    }>;
  };
  stt: {
    start: () => Promise<{ ok: boolean }>;
    stop: () => Promise<{ ok: boolean }>;
    transcribe: (audioBuffer: ArrayBuffer, mimeType: string) => Promise<{ ok: boolean; text?: string; error?: string }>;
    debugPush: (text: string) => Promise<{ ok: boolean }>;
    /** 의존성 설치 후 STT 데몬을 재스폰(fatal 복구). */
    retry: () => Promise<{ ok: boolean }>;
    onResult: (callback: (payload: { text: string; isFinal: boolean }) => void) => () => void;
    /** STT 데몬 상태(ready/fatal/restarting) 구독. 반환값은 cleanup 함수. */
    onStatus: (callback: (payload: { state: 'ready' | 'fatal' | 'restarting'; error?: string }) => void) => () => void;
    /** 전역 PTT(Cmd/Ctrl+Shift+M hold) 이벤트 구독. 반환값은 cleanup 함수. */
    onGlobalPtt: (callback: (payload: { type: 'start' | 'stop' }) => void) => () => void;
  };
  /** 방송 중 앱 종료 확인 — main 이 close 시점에 전송, renderer 가 모달 표시 후 응답 */
  broadcast: {
    onConfirmQuit: (callback: () => void) => () => void;
    confirmQuit: () => void;
    cancelQuit: () => void;
  };
}

/**
 * Window 인터페이스 확장
 * - 전역 window 객체에 electronAPI 속성 추가
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
