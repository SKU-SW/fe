import { contextBridge, ipcRenderer } from 'electron';

// Renderer → Main IPC 통신 브리지
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),
  // 필요시 IPC 채널 추가
  // sendMessage: (channel: string, data: unknown) => ipcRenderer.invoke(channel, data),
});
