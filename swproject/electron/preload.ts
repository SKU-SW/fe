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

/**
 * Renderer → Main IPC 통신 브리지
 * - window.electronAPI로 renderer에서 접근 가능
 * - 현재는 앱 버전/플랫폼 조회만 제공
 * - 필요시 IPC 채널 추가 (주석 참고)
 */
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),
  // 필요시 IPC 채널 추가
  // sendMessage: (channel: string, data: unknown) => ipcRenderer.invoke(channel, data),
});
