import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

// 개발 모드 여부
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let nextProcess: ChildProcess | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset', // macOS 네이티브 타이틀바
    show: false,
  });

  // 개발 모드: Next.js dev 서버 연결
  // 프로덕션: 빌드된 정적 파일 로드
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 개발 모드에서 Next.js dev 서버 시작
function startNextDevServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const nextPath = path.join(app.getAppPath(), 'node_modules', '.bin', 'next');
    nextProcess = spawn('npx', ['next', 'dev', '-p', '3000'], {
      cwd: app.getAppPath(),
      shell: true,
      stdio: 'inherit',
    });

    // Next.js 서버가 준비될 때까지 대기
    const checkServer = setInterval(() => {
      fetch('http://localhost:3000')
        .then(() => {
          clearInterval(checkServer);
          resolve();
        })
        .catch(() => {
          // 서버 아직 준비 안됨
        });
    }, 500);

    nextProcess.on('error', (err) => {
      clearInterval(checkServer);
      reject(err);
    });

    // 타임아웃 (30초)
    setTimeout(() => {
      clearInterval(checkServer);
      resolve(); // 일단 진행 (서버가 느리게 시작될 수 있음)
    }, 30000);
  });
}

app.whenReady().then(async () => {
  // IPC 핸들러 등록 (필요시 확장)
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:platform', () => process.platform);

  if (isDev) {
    await startNextDevServer();
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // 개발 모드에서 Next.js 프로세스 정리
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
});
