/**
 * @file Electron IPC 브리지 (preload 스크립트)
 * @created Sprint 1 - Electron preload 구현
 * @dependsOn 없음 (Electron 자체 모듈만 사용)
 * @related electron/main.ts (IPC 핸들러 정의)
 * @related electron/preload.d.ts (타입 정의)
 *
 * 역할:
 * - contextBridge를 통해 renderer 프로세스에 안전한 API 노출
 * - main 프로세스의 IPC 핸들러를 renderer에서 호출할 수 있게 함
 * - nodeIntegration=false이므로 preload를 통해서만 main과 통신 가능
 */

import { contextBridge, ipcRenderer } from 'electron';

type OverlayPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
type StreamEmotion = 'happy' | 'sad' | 'angry' | 'crying' | 'default';

interface OverlayBridgeState {
  settings: {
    enabled: boolean;
    position: OverlayPosition;
    scale: number;
    showBubble: boolean;
  };
  runtime: {
    isBroadcasting: boolean;
    broadcastStreamId: string | null;
    characterName: string;
    characterImageUrl: string;
    transcript: string;
    emotion: StreamEmotion;
    updatedAt: number;
  };
}

type STTResult = {
  text: string;
  isFinal: boolean;
};

/**
 * Renderer → Main IPC 통신 브리지
 * - window.electronAPI로 renderer에서 접근 가능
 * - 현재는 앱 버전/플랫폼 조회만 제공
 * - 필요시 IPC 채널 추가 (주석 참고)
 */
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  },
  obs: {
    detect: () => ipcRenderer.invoke('obs:detect'),
    launch: (obsPath: string) => ipcRenderer.invoke('obs:launch', obsPath),
    connectAndSetup: (overlayUrl: string) => ipcRenderer.invoke('obs:connect-and-setup', overlayUrl),
  },
  overlay: {
    getState: () => ipcRenderer.invoke('overlay:get-state'),
    setState: (state: OverlayBridgeState) => ipcRenderer.invoke('overlay:set-state', state),
  },
  stt: {
    start: () => ipcRenderer.invoke('stt:start'),
    stop: () => ipcRenderer.invoke('stt:stop'),
    transcribe: (audioBuffer: ArrayBuffer, mimeType: string) =>
      ipcRenderer.invoke('stt:transcribe', audioBuffer, mimeType),
    debugPush: (text: string) => ipcRenderer.invoke('stt:debug-push', text),
    onResult: (callback: (payload: STTResult) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: STTResult) => callback(payload);
      ipcRenderer.on('stt:result', listener);
      return () => ipcRenderer.removeListener('stt:result', listener);
    },
  },
});
