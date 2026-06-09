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
type StreamEmotion = 'DEFAULT' | 'TALKING' | 'HAPPY' | 'ANGRY' | 'TIRED' | 'SAD' | 'FEAR';

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
    isSpeaking: boolean;
    modelType: '2D' | '3D';
    characterName: string;
    characterImageUrl: string;
    vrmUrl: string;
    vrmThumbnailUrl: string;
    emotionImageMap: Partial<Record<StreamEmotion, string>>;
    transcript: string;
    emotion: StreamEmotion;
    updatedAt: number;
  };
}

type STTResult = {
  text: string;
  isFinal: boolean;
};

type GlobalPttPayload = {
  type: 'start' | 'stop';
};

type AppSettingsPayload = {
  closeToTray: boolean;
  pttShortcut: {
    ctrlOrCmd: boolean;
    shift: boolean;
    alt: boolean;
    key: string;
  };
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
  appSettings: {
    get: () => ipcRenderer.invoke('app-settings:get'),
    set: (settings: AppSettingsPayload) => ipcRenderer.invoke('app-settings:set', settings),
  },
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
    // 전역 PTT(Cmd/Ctrl+Shift+M hold) 이벤트 구독
    onGlobalPtt: (callback: (payload: GlobalPttPayload) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: GlobalPttPayload) => {
        console.info('[ptt][preload] received', payload);
        callback(payload);
      };
      ipcRenderer.on('stt:global-ptt', listener);
      return () => ipcRenderer.removeListener('stt:global-ptt', listener);
    },
  },
  // 방송 중 앱 종료 확인 — main 이 close 시점에 전송, renderer 가 모달 표시 후 응답
  broadcast: {
    onConfirmQuit: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('broadcast:confirm-quit', listener);
      return () => ipcRenderer.removeListener('broadcast:confirm-quit', listener);
    },
    confirmQuit: () => ipcRenderer.send('app:quit-confirmed'),
    cancelQuit: () => ipcRenderer.send('app:quit-cancelled'),
  },
});
