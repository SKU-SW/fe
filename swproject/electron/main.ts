/**
 * @file Electron 메인 프로세스
 * @created Sprint 1 - Electron 앱 기본 구조 구현
 * @migrated Next.js dev 서버(3000) → Vite dev 서버(5173), out/ → dist/
 * @updated STT 사이드카를 데몬 모드로 전환 — 매 호출마다 spawn 하지 않고
 *          앱 시작 시 1번 띄워 두고 stdin/stdout 으로 line-delimited JSON IPC.
 * @dependsOn 없음 (Electron 자체 모듈만 사용)
 * @related electron/preload.ts (IPC 브리지)
 * @related electron/stt_server.py (Faster Whisper 데몬)
 *
 * 아키텍처:
 * - 개발 모드: Vite dev 서버(localhost:5173)를 로드
 * - 프로덕션 모드: 빌드된 정적 파일(dist/index.html)을 로드
 * - 보안: contextIsolation=true, nodeIntegration=false
 */

import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, session, shell, systemPreferences, Tray } from 'electron';
import { existsSync, promises as fs } from 'fs';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import http from 'http';
import os from 'os';
import path from 'path';
import { UiohookKey, type UiohookKeyboardEvent, uIOhook } from 'uiohook-napi';
import { OBSManager, type ObsSetupResult } from './obsManager';

const isDev = process.env.NODE_ENV === 'development';
const OVERLAY_SERVER_PORT = 5174;

let mainWindow: BrowserWindow | null = null;
let sttListening = false;
let overlayServer: http.Server | null = null;
let isQuitting = false;
let isGlobalPttHeld = false;
let tray: Tray | null = null;
const obsManager = new OBSManager();

interface AppSettingsPayload {
  closeToTray: boolean;
  pttShortcut: {
    ctrlOrCmd: boolean;
    shift: boolean;
    alt: boolean;
    key: string;
  };
}

const DEFAULT_APP_SETTINGS: AppSettingsPayload = {
  closeToTray: true,
  pttShortcut: {
    ctrlOrCmd: true,
    shift: true,
    alt: false,
    key: 'M',
  },
};

let appSettings: AppSettingsPayload = DEFAULT_APP_SETTINGS;

interface ObsDetectionResult {
  found: boolean;
  path: string | null;
}

interface ObsLaunchResult {
  ok: boolean;
  error?: string;
}

const STATIC_MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

type OverlayPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
type StreamEmotion = 'DEFAULT' | 'TALKING' | 'HAPPY' | 'ANGRY' | 'TIRED' | 'SAD' | 'FEAR';

interface OverlaySettings {
  enabled: boolean;
  position: OverlayPosition;
  scale: number;
  showBubble: boolean;
}

interface OverlayRuntimeState {
  isBroadcasting: boolean;
  broadcastStreamId: string | null;
  isSpeaking: boolean;
  characterName: string;
  characterImageUrl: string;
  emotionImageMap: Partial<Record<StreamEmotion, string>>;
  transcript: string;
  emotion: StreamEmotion;
  updatedAt: number;
}

interface OverlayBridgeState {
  settings: OverlaySettings;
  runtime: OverlayRuntimeState;
}

const DEFAULT_OVERLAY_STATE: OverlayBridgeState = {
  settings: {
    enabled: true,
    position: 'bottom-right',
    scale: 1,
    showBubble: true,
  },
  runtime: {
    isBroadcasting: false,
    broadcastStreamId: null,
    isSpeaking: false,
    characterName: 'AI',
    characterImageUrl: '',
    emotionImageMap: {},
    transcript: '',
    emotion: 'DEFAULT',
    updatedAt: 0,
  },
};

let overlayState: OverlayBridgeState = DEFAULT_OVERLAY_STATE;

function resolveSttScriptPath(): string {
  const candidates = [
    path.join(process.resourcesPath, 'electron/stt_server.py'),
    path.join(app.getAppPath(), 'electron/stt_server.py'),
    path.join(__dirname, '../electron/stt_server.py'),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[candidates.length - 1];
}

function sendSttResult(payload: { text: string; isFinal: boolean }) {
  mainWindow?.webContents.send('stt:result', payload);
}

function sendGlobalPttEvent(type: 'start' | 'stop') {
  mainWindow?.webContents.send('stt:global-ptt', { type });
}

function isGlobalPttCombo(event: UiohookKeyboardEvent): boolean {
  const { ctrlOrCmd, shift, alt, key } = appSettings.pttShortcut;
  const keycode = UiohookKey[key as keyof typeof UiohookKey];
  const hasRequiredPrimaryModifier = ctrlOrCmd ? (event.ctrlKey || event.metaKey) : true;
  const hasRequiredShift = shift ? event.shiftKey : true;
  const hasRequiredAlt = alt ? event.altKey : true;
  return Boolean(keycode) && hasRequiredPrimaryModifier && hasRequiredShift && hasRequiredAlt && event.keycode === keycode;
}

function startGlobalPttHook() {
  uIOhook.on('keydown', (event) => {
    if (!isGlobalPttCombo(event) || isGlobalPttHeld) return;
    isGlobalPttHeld = true;
    sendGlobalPttEvent('start');
  });

  uIOhook.on('keyup', (event) => {
    if (!isGlobalPttHeld) return;

    const isModifierRelease = event.keycode === UiohookKey.Ctrl
      || event.keycode === UiohookKey.CtrlRight
      || event.keycode === UiohookKey.Meta
      || event.keycode === UiohookKey.MetaRight
      || event.keycode === UiohookKey.Shift
      || event.keycode === UiohookKey.ShiftRight;

    if (event.keycode !== UiohookKey.M && !isModifierRelease) return;

    isGlobalPttHeld = false;
    sendGlobalPttEvent('stop');
  });

  uIOhook.start();
}

function sanitizeAppSettings(value: unknown): AppSettingsPayload {
  const candidate = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const pttShortcut = candidate.pttShortcut && typeof candidate.pttShortcut === 'object'
    ? candidate.pttShortcut as Record<string, unknown>
    : {};

  const ctrlOrCmd = pttShortcut.ctrlOrCmd !== false;
  const shift = typeof pttShortcut.shift === 'boolean' ? pttShortcut.shift : DEFAULT_APP_SETTINGS.pttShortcut.shift;
  const alt = typeof pttShortcut.alt === 'boolean' ? pttShortcut.alt : DEFAULT_APP_SETTINGS.pttShortcut.alt;
  const key = typeof pttShortcut.key === 'string' && pttShortcut.key in UiohookKey
    ? pttShortcut.key
    : DEFAULT_APP_SETTINGS.pttShortcut.key;

  return {
    closeToTray: candidate.closeToTray !== false,
    pttShortcut: {
      ctrlOrCmd: ctrlOrCmd || (!shift && !alt),
      shift,
      alt,
      key,
    },
  };
}

function createTray() {
  if (tray) return;

  const iconPath = path.join(app.getAppPath(), 'public', 'logo.png');
  const fallbackIcon = nativeImage.createFromNamedImage('NSStatusAvailable', [16, 16]);
  const trayIcon = existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 })
    : fallbackIcon;

  tray = new Tray(trayIcon);
  tray.setToolTip('SKU-SW');

  const openApp = () => {
    if (!mainWindow) {
      createWindow();
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  };

  tray.on('click', openApp);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '앱 열기', click: openApp },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() },
  ]));
}

function isOverlayPosition(value: unknown): value is OverlayPosition {
  return value === 'bottom-right' || value === 'bottom-left' || value === 'top-right' || value === 'top-left';
}

function isStreamEmotion(value: unknown): value is StreamEmotion {
  return value === 'DEFAULT'
    || value === 'TALKING'
    || value === 'HAPPY'
    || value === 'ANGRY'
    || value === 'TIRED'
    || value === 'SAD'
    || value === 'FEAR';
}

function isEmotionImageMap(value: unknown): value is Partial<Record<StreamEmotion, string>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, mapValue]) => isStreamEmotion(key) && typeof mapValue === 'string'
  );
}

function sanitizeOverlayState(value: unknown): OverlayBridgeState {
  const candidate = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const settingsCandidate = candidate.settings && typeof candidate.settings === 'object'
    ? candidate.settings as Record<string, unknown>
    : {};
  const runtimeCandidate = candidate.runtime && typeof candidate.runtime === 'object'
    ? candidate.runtime as Record<string, unknown>
    : {};

  const scale = typeof settingsCandidate.scale === 'number' && Number.isFinite(settingsCandidate.scale)
    ? Math.min(1.5, Math.max(0.5, settingsCandidate.scale))
    : DEFAULT_OVERLAY_STATE.settings.scale;

  return {
    settings: {
      enabled: typeof settingsCandidate.enabled === 'boolean'
        ? settingsCandidate.enabled
        : DEFAULT_OVERLAY_STATE.settings.enabled,
      position: isOverlayPosition(settingsCandidate.position)
        ? settingsCandidate.position
        : DEFAULT_OVERLAY_STATE.settings.position,
      scale,
      showBubble: typeof settingsCandidate.showBubble === 'boolean'
        ? settingsCandidate.showBubble
        : DEFAULT_OVERLAY_STATE.settings.showBubble,
    },
    runtime: {
      isBroadcasting: typeof runtimeCandidate.isBroadcasting === 'boolean'
        ? runtimeCandidate.isBroadcasting
        : DEFAULT_OVERLAY_STATE.runtime.isBroadcasting,
      broadcastStreamId: typeof runtimeCandidate.broadcastStreamId === 'string'
        ? runtimeCandidate.broadcastStreamId
        : null,
      isSpeaking: typeof runtimeCandidate.isSpeaking === 'boolean'
        ? runtimeCandidate.isSpeaking
        : DEFAULT_OVERLAY_STATE.runtime.isSpeaking,
      characterName: typeof runtimeCandidate.characterName === 'string'
        ? runtimeCandidate.characterName
        : DEFAULT_OVERLAY_STATE.runtime.characterName,
      characterImageUrl: typeof runtimeCandidate.characterImageUrl === 'string'
        ? runtimeCandidate.characterImageUrl
        : DEFAULT_OVERLAY_STATE.runtime.characterImageUrl,
      emotionImageMap: isEmotionImageMap(runtimeCandidate.emotionImageMap)
        ? runtimeCandidate.emotionImageMap
        : DEFAULT_OVERLAY_STATE.runtime.emotionImageMap,
      transcript: typeof runtimeCandidate.transcript === 'string'
        ? runtimeCandidate.transcript
        : DEFAULT_OVERLAY_STATE.runtime.transcript,
      emotion: isStreamEmotion(runtimeCandidate.emotion)
        ? runtimeCandidate.emotion
        : DEFAULT_OVERLAY_STATE.runtime.emotion,
      updatedAt: typeof runtimeCandidate.updatedAt === 'number' && Number.isFinite(runtimeCandidate.updatedAt)
        ? runtimeCandidate.updatedAt
        : Date.now(),
    },
  };
}

function sendOverlayJson(res: http.ServerResponse, statusCode: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(body);
}

function getStaticContentType(filePath: string): string {
  return STATIC_MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

async function sendStaticFile(res: http.ServerResponse, filePath: string, statusCode = 200) {
  const content = await fs.readFile(filePath);
  const isHtml = path.extname(filePath).toLowerCase() === '.html';
  const isHashedAsset = filePath.includes(`${path.sep}assets${path.sep}`);

  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': isHashedAsset ? 'public, max-age=31536000, immutable' : 'no-store',
    'Content-Type': getStaticContentType(filePath),
  });
  res.end(isHtml ? content.toString('utf-8') : content);
}

function startOverlayStateServer() {
  if (overlayServer) return;

  const distRoot = path.join(app.getAppPath(), 'dist');

  overlayServer = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      sendOverlayJson(res, 204, null);
      return;
    }

    const url = new URL(req.url ?? '/', `http://127.0.0.1:${OVERLAY_SERVER_PORT}`);
    if (req.method === 'GET' && url.pathname === '/overlay-state') {
      sendOverlayJson(res, 200, overlayState);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/health') {
      sendOverlayJson(res, 200, { ok: true });
      return;
    }

    if (req.method === 'GET') {
      const normalizedPath = url.pathname === '/' ? '/index.html' : url.pathname;
      const requestedFile = path.join(distRoot, normalizedPath.replace(/^\//, ''));
      const safeRoot = `${distRoot}${path.sep}`;
      const isSafePath = requestedFile === distRoot || requestedFile.startsWith(safeRoot);

      if (!isSafePath) {
        sendOverlayJson(res, 403, { message: 'Forbidden' });
        return;
      }

      try {
        await sendStaticFile(res, requestedFile);
        return;
      } catch (err: unknown) {
        const code = typeof err === 'object' && err && 'code' in err ? String(err.code) : '';
        if (code !== 'ENOENT') {
          sendOverlayJson(res, 500, { message: 'Static file read failed' });
          return;
        }
      }

      try {
        await sendStaticFile(res, path.join(distRoot, 'index.html'), 200);
        return;
      } catch {
        sendOverlayJson(res, 500, { message: 'Overlay app is not built' });
        return;
      }
    }

    sendOverlayJson(res, 404, { message: 'Not found' });
  });

  overlayServer.on('error', (err) => {
    console.warn('[overlay-state-server] failed:', err.message);
    overlayServer = null;
  });

  overlayServer.listen(OVERLAY_SERVER_PORT, '127.0.0.1', () => {
    console.info(`[overlay-state-server] listening on http://127.0.0.1:${OVERLAY_SERVER_PORT}`);
  });
}

function detectObs(): ObsDetectionResult {
  const candidates = process.platform === 'darwin'
    ? [
        '/Applications/OBS.app/Contents/MacOS/OBS',
        path.join(os.homedir(), 'Applications/OBS.app/Contents/MacOS/OBS'),
      ]
    : process.platform === 'win32'
      ? [
          'C:\\Program Files\\obs-studio\\bin\\64bit\\obs64.exe',
          'C:\\Program Files (x86)\\obs-studio\\bin\\64bit\\obs64.exe',
          path.join(process.env['LOCALAPPDATA'] ?? '', 'Programs\\obs-studio\\bin\\64bit\\obs64.exe'),
        ]
      : [];

  const resolvedPath = candidates.find((candidate) => candidate && existsSync(candidate)) ?? null;

  return {
    found: resolvedPath !== null,
    path: resolvedPath,
  };
}

function launchObs(obsPath: string): ObsLaunchResult {
  try {
    const proc = spawn(obsPath, [], {
      cwd: path.dirname(obsPath),
      detached: true,
      stdio: 'ignore',
    });
    proc.unref();

    return { ok: true };
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'OBS 실행에 실패했습니다.',
    };
  }
}

function getAudioExtension(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('mp4') || mimeType.includes('mpeg')) return 'mp4';
  if (mimeType.includes('wav')) return 'wav';
  return 'bin';
}

// ============================================================
// STT 데몬 매니저 (Faster Whisper sidecar)
// ============================================================

type TranscribeResult = { ok: boolean; text?: string; error?: string };

interface PendingRequest {
  id: string;
  audioPath: string;
  resolve: (result: TranscribeResult) => void;
}

class STTManager {
  private child: ChildProcessWithoutNullStreams | null = null;
  private ready = false;
  private fatalError: string | null = null;
  private inFlight = new Map<string, PendingRequest>();
  /** ready 전에 들어온 요청 임시 보관 */
  private queue: PendingRequest[] = [];
  /** 줄 단위 파서 — stdout 데이터가 chunk 로 잘려도 라인 경계 복원 */
  private stdoutBuffer = '';
  private nextSeq = 0;
  private shuttingDown = false;

  start() {
    if (this.child) return;
    const scriptPath = resolveSttScriptPath();
    console.info('[stt] spawning daemon:', scriptPath);

    this.child = spawn('python3', [scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    });

    this.child.stdout.setEncoding('utf-8');
    this.child.stdout.on('data', (chunk: string) => this.handleStdout(chunk));

    this.child.stderr.setEncoding('utf-8');
    this.child.stderr.on('data', (chunk: string) => {
      // 디버그용 stderr — Hugging Face 다운로드 진행 표시 등이 여기 옴
      console.warn('[stt-stderr]', chunk.trimEnd());
    });

    this.child.on('exit', (code, signal) => {
      console.warn(`[stt] daemon exited (code=${code}, signal=${signal})`);
      this.child = null;
      this.ready = false;
      // in-flight 요청 모두 reject
      for (const req of this.inFlight.values()) {
        req.resolve({
          ok: false,
          error: this.fatalError ?? 'STT 데몬이 종료되었습니다.',
        });
      }
      this.inFlight.clear();
      // 큐도 같이 정리
      for (const req of this.queue) {
        req.resolve({
          ok: false,
          error: this.fatalError ?? 'STT 데몬이 종료되었습니다.',
        });
      }
      this.queue = [];

      // 종료 중이 아니면 자동 재시작 (3초 후)
      if (!this.shuttingDown && !this.fatalError) {
        setTimeout(() => {
          if (!this.shuttingDown && !this.fatalError) this.start();
        }, 3000);
      }
    });

    this.child.on('error', (err) => {
      console.error('[stt] spawn error:', err);
      this.fatalError = err.message;
    });
  }

  private handleStdout(chunk: string) {
    this.stdoutBuffer += chunk;
    let idx;
    while ((idx = this.stdoutBuffer.indexOf('\n')) >= 0) {
      const line = this.stdoutBuffer.slice(0, idx).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(idx + 1);
      if (line) this.handleLine(line);
    }
  }

  private handleLine(line: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      console.warn('[stt] non-JSON line:', line);
      return;
    }
    if (!parsed || typeof parsed !== 'object') return;
    const obj = parsed as Record<string, unknown>;

    // 라이프사이클 이벤트
    if (typeof obj.event === 'string') {
      if (obj.event === 'ready') {
        console.info('[stt] daemon ready, model =', obj.model);
        this.ready = true;
        this.fatalError = null;
        this.flushQueue();
        return;
      }
      if (obj.event === 'fatal') {
        const msg = typeof obj.error === 'string' ? obj.error : 'STT 데몬 시작 실패';
        console.error('[stt] fatal:', msg);
        this.fatalError = msg;
        // 자식 종료 후 exit 핸들러가 큐/in-flight 정리함
        return;
      }
    }

    // 일반 응답 (id 매칭)
    const id = typeof obj.id === 'string' ? obj.id : null;
    if (!id) return;
    const req = this.inFlight.get(id);
    if (!req) return;
    this.inFlight.delete(id);
    req.resolve({
      ok: !!obj.ok,
      text: typeof obj.text === 'string' ? obj.text : undefined,
      error: typeof obj.error === 'string' ? obj.error : undefined,
    });
  }

  private flushQueue() {
    while (this.queue.length && this.child && this.ready) {
      const req = this.queue.shift()!;
      this.dispatch(req);
    }
  }

  private dispatch(req: PendingRequest) {
    if (!this.child) {
      req.resolve({ ok: false, error: 'STT 데몬이 실행 중이 아닙니다.' });
      return;
    }
    this.inFlight.set(req.id, req);
    const payload = JSON.stringify({ id: req.id, audio_path: req.audioPath }) + '\n';
    this.child.stdin.write(payload);
  }

  async transcribe(audioBuffer: ArrayBuffer, mimeType: string): Promise<TranscribeResult> {
    // temp 파일 작성 (데몬은 path 로 받음 — IPC 페이로드를 가볍게 유지)
    const ext = getAudioExtension(mimeType);
    const tempPath = path.join(os.tmpdir(), `sku-sw-stt-${Date.now()}-${this.nextSeq}.${ext}`);
    await fs.writeFile(tempPath, Buffer.from(audioBuffer));

    const id = `req-${this.nextSeq++}`;

    return new Promise<TranscribeResult>((resolve) => {
      const req: PendingRequest = {
        id,
        audioPath: tempPath,
        resolve: (result) => {
          // 응답 받은 뒤 (또는 reject 시) temp 파일 정리
          fs.unlink(tempPath).catch(() => undefined);
          resolve(result);
        },
      };

      // fatal 상태면 즉시 거절
      if (this.fatalError && !this.child) {
        req.resolve({ ok: false, error: this.fatalError });
        return;
      }

      // 데몬 미가동 → 시작 + 큐에 적재
      if (!this.child) {
        this.queue.push(req);
        this.start();
        return;
      }
      // 가동 중이지만 아직 ready 전 → 큐
      if (!this.ready) {
        this.queue.push(req);
        return;
      }

      this.dispatch(req);
    });
  }

  shutdown() {
    this.shuttingDown = true;
    if (!this.child) return;
    try {
      this.child.stdin.end();
    } catch {
      /* ignore */
    }
    // 3초 후에도 살아있으면 SIGTERM, 그 후 2초 더면 SIGKILL
    const child = this.child;
    setTimeout(() => {
      if (child && !child.killed) child.kill('SIGTERM');
    }, 3000);
    setTimeout(() => {
      if (child && !child.killed) child.kill('SIGKILL');
    }, 5000);
  }
}

const sttManager = new STTManager();

// ============================================================
// BrowserWindow
// ============================================================

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
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', (event) => {
    if (isQuitting || !mainWindow) return;
    if (!appSettings.closeToTray) return;
    // 트레이 상주 모드에서는 창을 실제로 닫지 않고 숨긴다.
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================================
// 앱 라이프사이클
// ============================================================

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
      return;
    }
    callback(false);
  });

  // STT 데몬 사전 부팅 — 사용자 첫 발화 전 모델 로딩 끝내두기
  sttManager.start();
  startOverlayStateServer();
  createTray();

  // macOS: 손쉬운 사용 권한 확인 및 요청
  // 전역 키 훅이 다른 앱 포커스 중에도 동작하려면 이 권한이 필요함
  // 개발 모드에서는 "Electron", 패키징 후에는 앱 이름으로 목록에 표시됨
  if (process.platform === 'darwin') {
    const trusted = systemPreferences.isTrustedAccessibilityClient(false);
    if (!trusted) {
      // prompt=true → 시스템 설정 열기 안내 다이얼로그 자동 표시
      systemPreferences.isTrustedAccessibilityClient(true);
      dialog.showMessageBox({
        type: 'info',
        title: '손쉬운 사용 권한 필요',
        message: '전역 PTT(Cmd/Ctrl+Shift+M)를 사용하려면 손쉬운 사용 권한이 필요합니다.',
        detail: '시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용에서\n"Electron" (개발 중) 또는 앱 이름을 활성화한 뒤 앱을 재시작해주세요.',
        buttons: ['확인'],
      });
    }
  }

  startGlobalPttHook();
  console.info('[shortcut] 전역 PTT 후킹 시작: Ctrl/Cmd+Shift+M (hold)');

  // === IPC 핸들러 ===
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:platform', () => process.platform);
  ipcMain.handle('app-settings:get', () => appSettings);
  ipcMain.handle('app-settings:set', (_event, settings: unknown) => {
    appSettings = sanitizeAppSettings(settings);
    return { ok: true, settings: appSettings };
  });
  ipcMain.handle('shell:open-external', (_event, url: string) => shell.openExternal(url));
  ipcMain.handle('obs:detect', () => detectObs());
  ipcMain.handle('obs:launch', (_event, obsPath: string) => launchObs(obsPath));
  ipcMain.handle('obs:connect-and-setup', async (_event, overlayUrl: string): Promise<ObsSetupResult> => {
    const detection = detectObs();

    return obsManager.connectAndSetup(overlayUrl, () => {
      if (!detection.found || !detection.path) {
        return { ok: false, error: 'OBS not found' };
      }
      return launchObs(detection.path);
    }, detection.path);
  });
  ipcMain.handle('overlay:get-state', () => overlayState);
  ipcMain.handle('overlay:set-state', (_event, state: unknown) => {
    overlayState = sanitizeOverlayState(state);
    return { ok: true, state: overlayState };
  });
  ipcMain.handle('stt:start', () => {
    sttListening = true;
    sendSttResult({ text: '음성인식 대기 중...', isFinal: false });
    return { ok: true };
  });
  ipcMain.handle('stt:stop', () => {
    sttListening = false;
    sendSttResult({ text: '', isFinal: true });
    return { ok: true };
  });
  ipcMain.handle('stt:transcribe', async (_event, audioBuffer: ArrayBuffer, mimeType: string) => {
    const result = await sttManager.transcribe(audioBuffer, mimeType);
    if (result.ok) {
      sendSttResult({ text: result.text ?? '', isFinal: true });
    }
    return result;
  });
  ipcMain.handle('stt:debug-push', (_event, text: string) => {
    if (!sttListening) {
      return { ok: false };
    }
    sendSttResult({ text, isFinal: true });
    return { ok: true };
  });

  createWindow();

  app.on('activate', () => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
      return;
    }

    if (mainWindow && mainWindow.isMinimized()) {
      mainWindow.restore();
      mainWindow.focus();
      return;
    }

    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  uIOhook.stop();
  tray?.destroy();
  tray = null;
  obsManager.disconnect();
  sttManager.shutdown();
  overlayServer?.close();
  overlayServer = null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
