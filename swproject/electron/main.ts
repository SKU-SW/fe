/**
 * @file Electron 메인 프로세스
 * @created Sprint 1 - Electron 앱 기본 구조 구현
 * @dependsOn 없음 (Electron 자체 모듈만 사용)
 * @related electron/preload.ts (IPC 브리지)
 *
 * 아키텍처:
 * - 개발 모드: Next.js dev 서버(localhost:3000)를 로드
 *   (Next.js dev 서버는 외부에서 `npm run dev`로 실행)
 * - 프로덕션 모드: 빌드된 정적 파일(out/index.html)을 로드
 * - 보안: contextIsolation=true, nodeIntegration=false
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

// 개발 모드 여부
// NODE_ENV === 'development' 또는 패키징되지 않은 상태면 개발 모드로 간주
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

/**
 * 메인 윈도우 생성
 * - macOS: hiddenInset 타이틀바 스타일 (네이티브 느낌)
 * - 보안: preload 스크립트로만 IPC 통신 허용 (nodeIntegration 비활성화)
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // 컨텍스트 분리: renderer에서 node API 직접 접근 불가
      nodeIntegration: false,   // Node.js 통합 비활성화 (보안)
    },
    titleBarStyle: 'hiddenInset', // macOS 네이티브 타이틀바
    show: false,  // ready-to-show 이후에 표시 (깜빡임 방지)
  });

  // 개발 모드: Next.js dev 서버 연결
  // 프로덕션: 빌드된 정적 파일 로드
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  // 콘텐츠 준비 완료 시 윈도우 표시 (화면 깜빡임 방지)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 윈도우 닫힘 시 참조 해제
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron 초기화 완료 시
app.whenReady().then(async () => {
  // IPC 핸들러 등록 (필요시 확장)
  // renderer → main 통신 채널
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:platform', () => process.platform);

  createWindow();

  // macOS: dock 아이콘 클릭 시 윈도우 재생성
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 윈도우가 닫혔을 때
// macOS는 앱이 종료되지 않음 (dock에 상주)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
