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
  stt: {
    start: () => Promise<{ ok: boolean }>;
    stop: () => Promise<{ ok: boolean }>;
    transcribe: (audioBuffer: ArrayBuffer, mimeType: string) => Promise<{ ok: boolean; text?: string; error?: string }>;
    debugPush: (text: string) => Promise<{ ok: boolean }>;
    onResult: (callback: (payload: { text: string; isFinal: boolean }) => void) => () => void;
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
