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
import { execSync, spawn, ChildProcessWithoutNullStreams } from 'child_process';
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
const pressedKeycodes = new Set<number>();
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

interface OverlayVisemeWeights {
  aa: number;
  ih: number;
  ou: number;
  ee: number;
  oh: number;
}

interface OverlayRuntimeState {
  isBroadcasting: boolean;
  broadcastStreamId: string | null;
  isSpeaking: boolean;
  lipSyncEnabled: boolean;
  mouthOpen: number;
  visemeWeights: OverlayVisemeWeights;
  modelType: '2D' | '3D';
  characterName: string;
  characterImageUrl: string;
  vrmUrl: string;
  vrmThumbnailUrl: string;
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
    lipSyncEnabled: false,
    mouthOpen: 0,
    visemeWeights: { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 },
    modelType: '2D',
    characterName: 'AI',
    characterImageUrl: '',
    vrmUrl: '',
    vrmThumbnailUrl: '',
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

/**
 * 패키지(배포)본에서 동봉된 STT 사이드카 실행파일 경로.
 * - electron-builder extraResources 로 resourcesPath/stt/ 에 PyInstaller 산출물을 둔다.
 * - 존재하지 않으면 null (→ dev 처럼 python3 폴백).
 */
function resolveSttBinary(): string | null {
  const exe = process.platform === 'win32' ? 'stt_server.exe' : 'stt_server';
  const candidates = [
    path.join(process.resourcesPath, 'stt', exe),
    path.join(process.resourcesPath, 'stt', 'stt_server', exe),
    path.join(app.getAppPath(), '..', 'stt', exe),
    path.join(app.getAppPath(), '..', 'stt', 'stt_server', exe),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/**
 * 동봉된 Whisper 모델 디렉토리(resourcesPath/models/<name>).
 * - 존재하면 stt_server.py 가 오프라인(local_files_only)으로 로드.
 * - 없으면 빈 문자열 → 첫 실행 시 HF 다운로드.
 */
function resolveSttModelDir(): string {
  const modelName = process.env.SKU_SW_STT_MODEL ?? 'small';
  const candidate = path.join(process.resourcesPath, 'models', modelName);
  return existsSync(candidate) ? candidate : '';
}

function resolveOpenVinoModelDir(): string {
  const modelName = process.env.SKU_SW_STT_MODEL ?? 'small';
  const candidates = [
    path.join(process.resourcesPath, 'models', `whisper-${modelName}-ov`),
    path.join(process.resourcesPath, 'models', `whisper-${modelName}-int8-ov`),
    path.join(app.getAppPath(), '..', 'models', `whisper-${modelName}-ov`),
    path.join(app.getAppPath(), '..', 'models', `whisper-${modelName}-int8-ov`),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? '';
}

function sendSttResult(payload: { text: string; isFinal: boolean }) {
  mainWindow?.webContents.send('stt:result', payload);
}

function sendSttStatus(payload: { state: 'ready' | 'fatal' | 'restarting'; error?: string; engine?: string; device?: string }) {
  mainWindow?.webContents.send('stt:status', payload);
}

function sendGlobalPttEvent(type: 'start' | 'stop') {
  // 검증된 흐름:
  // main(uiohook) → preload(onGlobalPtt) → renderer(sttBackgroundService).
  // 실제 런타임 로그에서 START/STOP trigger와 preload/service 수신이 모두 확인되었고,
  // 숨김/백그라운드 상태에서도 전역 PTT 이벤트 자체는 이 채널로 전달된다.
  console.info('[ptt][main] sendGlobalPttEvent', type, { hasWindow: !!mainWindow });
  mainWindow?.webContents.send('stt:global-ptt', { type });
}

function isGlobalPttCombo(event: UiohookKeyboardEvent): boolean {
  void event;
  const { ctrlOrCmd, shift, alt, key } = appSettings.pttShortcut;
  const keycode = UiohookKey[key as keyof typeof UiohookKey];
  if (!keycode) return false;

  const hasPrimaryModifier = ctrlOrCmd
    ? pressedKeycodes.has(UiohookKey.Ctrl)
      || pressedKeycodes.has(UiohookKey.CtrlRight)
      || pressedKeycodes.has(UiohookKey.Meta)
      || pressedKeycodes.has(UiohookKey.MetaRight)
    : true;

  const hasShift = shift
    ? pressedKeycodes.has(UiohookKey.Shift) || pressedKeycodes.has(UiohookKey.ShiftRight)
    : true;

  const hasAlt = alt
    ? pressedKeycodes.has(UiohookKey.Alt) || pressedKeycodes.has(UiohookKey.AltRight)
    : true;

  return hasPrimaryModifier && hasShift && hasAlt && pressedKeycodes.has(keycode);
}

function startGlobalPttHook() {
  uIOhook.on('keydown', (event) => {
    pressedKeycodes.add(event.keycode);
    console.info('[ptt][main] keydown', {
      keycode: event.keycode,
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey,
      held: [...pressedKeycodes],
    });
    // macOS에서 modifier 플래그(ctrl/meta/shift)가 항상 안정적으로 보이지 않을 수 있어
    // event의 불리언 플래그보다 pressedKeycodes 집합을 기준으로 조합을 판정한다.
    if (!isGlobalPttCombo(event) || isGlobalPttHeld) return;
    isGlobalPttHeld = true;
    console.info('[ptt][main] START trigger');
    sendGlobalPttEvent('start');
  });

  uIOhook.on('keyup', (event) => {
    pressedKeycodes.delete(event.keycode);
    console.info('[ptt][main] keyup', {
      keycode: event.keycode,
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      shift: event.shiftKey,
      alt: event.altKey,
      held: [...pressedKeycodes],
    });
    if (!isGlobalPttHeld) return;

    // hold-to-talk 이므로 조합이 깨지는 첫 keyup에서만 STOP을 보낸다.
    // 실제 검증에서도 Cmd/Shift/M 중 어떤 키를 먼저 떼더라도 STOP 경로가 정상 동작했다.
    if (isGlobalPttCombo(event)) return;

    isGlobalPttHeld = false;
    console.info('[ptt][main] STOP trigger');
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

  // 패키지본은 public/ 이 asar 에 없으므로(dist 만 포함) 기존 public 경로는 항상 실패해
  // 시스템 기본 아이콘으로 폴백됐다. resolveAppIconPath() 로 라이브버디 로고(dist/icon.png 등)를
  // 찾아 트레이 아이콘으로 쓴다.
  const iconPath = resolveAppIconPath();
  const fallbackIcon = nativeImage.createFromNamedImage('NSStatusAvailable', [16, 16]);
  const trayIcon = iconPath
    ? nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 })
    : fallbackIcon;

  tray = new Tray(trayIcon);
  tray.setToolTip('Live Buddy');

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

function sanitizeVisemeWeights(value: unknown): OverlayVisemeWeights {
  const fallback = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback;
  const candidate = value as Record<string, unknown>;
  const keys: (keyof OverlayVisemeWeights)[] = ['aa', 'ih', 'ou', 'ee', 'oh'];
  const result = { ...fallback };
  for (const key of keys) {
    if (typeof candidate[key] === 'number' && Number.isFinite(candidate[key])) {
      result[key] = Math.min(1, Math.max(0, candidate[key]));
    }
  }
  return result;
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
      lipSyncEnabled: typeof runtimeCandidate.lipSyncEnabled === 'boolean'
        ? runtimeCandidate.lipSyncEnabled
        : DEFAULT_OVERLAY_STATE.runtime.lipSyncEnabled,
      mouthOpen: typeof runtimeCandidate.mouthOpen === 'number' && Number.isFinite(runtimeCandidate.mouthOpen)
        ? Math.min(1, Math.max(0, runtimeCandidate.mouthOpen))
        : DEFAULT_OVERLAY_STATE.runtime.mouthOpen,
      visemeWeights: sanitizeVisemeWeights(runtimeCandidate.visemeWeights),
      modelType: runtimeCandidate.modelType === '3D' || runtimeCandidate.modelType === '2D'
        ? runtimeCandidate.modelType
        : DEFAULT_OVERLAY_STATE.runtime.modelType,
      characterName: typeof runtimeCandidate.characterName === 'string'
        ? runtimeCandidate.characterName
        : DEFAULT_OVERLAY_STATE.runtime.characterName,
      characterImageUrl: typeof runtimeCandidate.characterImageUrl === 'string'
        ? runtimeCandidate.characterImageUrl
        : DEFAULT_OVERLAY_STATE.runtime.characterImageUrl,
      vrmUrl: typeof runtimeCandidate.vrmUrl === 'string'
        ? runtimeCandidate.vrmUrl
        : DEFAULT_OVERLAY_STATE.runtime.vrmUrl,
      vrmThumbnailUrl: typeof runtimeCandidate.vrmThumbnailUrl === 'string'
        ? runtimeCandidate.vrmThumbnailUrl
        : DEFAULT_OVERLAY_STATE.runtime.vrmThumbnailUrl,
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

const STT_REQUEST_TIMEOUT_MS = 25_000;
// fatal(예: faster-whisper 미설치) 이후 사용자가 의존성을 설치했을 수 있으므로,
// 이 쿨다운이 지난 새 요청은 데몬을 다시 스폰해 재확인한다(영구 고착 방지).
const STT_FATAL_RETRY_COOLDOWN_MS = 5_000;

interface PendingRequest {
  id: string;
  audioPath: string;
  resolve: (result: TranscribeResult) => void;
}

class STTManager {
  private child: ChildProcessWithoutNullStreams | null = null;
  private ready = false;
  private fatalError: string | null = null;
  private lastFatalAt = 0;
  private inFlight = new Map<string, PendingRequest>();
  /** ready 전에 들어온 요청 임시 보관 */
  private queue: PendingRequest[] = [];
  /** 줄 단위 파서 — stdout 데이터가 chunk 로 잘려도 라인 경계 복원 */
  private stdoutBuffer = '';
  private nextSeq = 0;
  private shuttingDown = false;
  private activeEngine: string | null = null;
  private activeDevice: string | null = null;

  start() {
    if (this.child) return;

    // 배포본: 동봉된 PyInstaller 바이너리 우선. dev/미동봉: 시스템 python3 + 스크립트.
    const binary = resolveSttBinary();
    let command = binary ?? 'python3';
    const args = binary ? [] : [resolveSttScriptPath()];
    const modelDir = resolveSttModelDir();
    const openVinoModelDir = resolveOpenVinoModelDir();

    // dev 모드에서 GUI 앱의 PATH는 쉘과 달라 python3를 못 찾을 수 있음.
    // 실제 python3 경로를 찾아서 명시적으로 사용.
    if (!binary) {
      try {
        command = execSync('which python3', { encoding: 'utf-8' }).trim();
      } catch {
        // which 실패 시 기존 'python3' 유지
      }
    }

    console.info(
      '[stt] spawning daemon:',
      command,
      args.join(' '),
      modelDir ? `(fw-model: ${modelDir})` : '(fw-model: download)',
      openVinoModelDir ? `(ov-model: ${openVinoModelDir})` : '(ov-model: auto)'
    );

    this.child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      // PYTHONUTF8/PYTHONIOENCODING: Windows(cp949) 에서 사이드카 stdout 이 cp949 로 나와
      // 한글 finalText 가 깨지는 것을 막는다(아래 setEncoding('utf-8') 와 짝). stt_server.py
      // 내부 reconfigure 와 이중 방어.
      env: {
        ...process.env,
        PYTHONUTF8: '1',
        PYTHONIOENCODING: 'utf-8',
        SKU_SW_STT_ENGINE: process.env.SKU_SW_STT_ENGINE ?? 'auto',
        SKU_SW_STT_DEVICE: process.env.SKU_SW_STT_DEVICE ?? 'auto',
        ...(modelDir ? { SKU_SW_STT_MODEL_DIR: modelDir } : {}),
        ...(openVinoModelDir ? { SKU_SW_STT_OPENVINO_MODEL_DIR: openVinoModelDir } : {}),
      },
    });

    this.child.stdout.setEncoding('utf-8');
    this.child.stdout.on('data', (chunk: string) => this.handleStdout(chunk));

    this.child.stderr.setEncoding('utf-8');
    this.child.stderr.on('data', (chunk: string) => {
      // 디버그용 stderr — Hugging Face 다운로드 진행 표시 등이 여기 옴
      console.warn('[stt-stderr]', chunk.trimEnd());
    });
    this.child.stdin.on('error', (err) => {
      console.error('[stt] stdin error:', err);
    });

    this.child.on('exit', (code, signal) => {
      console.warn(`[stt] daemon exited (code=${code}, signal=${signal})`);
      this.child = null;
      this.ready = false;
      this.activeEngine = null;
      this.activeDevice = null;
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
        console.info('[stt] daemon ready, model =', obj.model, 'engine =', obj.engine, 'device =', obj.device);
        this.ready = true;
        this.fatalError = null;
        this.activeEngine = typeof obj.engine === 'string' ? obj.engine : null;
        this.activeDevice = typeof obj.device === 'string' ? obj.device : null;
        this.flushQueue();
        sendSttStatus({ state: 'ready', engine: this.activeEngine ?? undefined, device: this.activeDevice ?? undefined });
        return;
      }
      if (obj.event === 'fatal') {
        const msg = typeof obj.error === 'string' ? obj.error : 'STT 데몬 시작 실패';
        console.error('[stt] fatal:', msg);
        this.fatalError = msg;
        this.lastFatalAt = Date.now();
        sendSttStatus({
          state: 'fatal',
          error: msg,
          engine: typeof obj.engine === 'string' ? obj.engine : this.activeEngine ?? undefined,
          device: typeof obj.device === 'string' ? obj.device : this.activeDevice ?? undefined,
        });
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

    // 실제 장애 원인 중 하나가 "renderer는 transcribe request를 찍었는데 응답이 영원히 오지 않음"이었기 때문에
    // main 프로세스에서도 요청 단위 timeout을 둬 inFlight가 영구 고착되지 않게 한다.
    let settled = false;
    const timer = setTimeout(() => {
      finish({ ok: false, error: `STT 응답이 ${STT_REQUEST_TIMEOUT_MS / 1000}초 내에 오지 않았습니다.` });
    }, STT_REQUEST_TIMEOUT_MS);

    const finish = (result: TranscribeResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      this.inFlight.delete(req.id);
      req.resolve(result);
    };

    const pending: PendingRequest = {
      ...req,
      resolve: finish,
    };

    this.inFlight.set(req.id, pending);
    const payload = JSON.stringify({ id: req.id, audio_path: req.audioPath }) + '\n';

    try {
      const accepted = this.child.stdin.write(payload, (err?: Error | null) => {
        if (err) {
          finish({ ok: false, error: `STT 요청 전송 실패: ${err.message}` });
        }
      });

      if (!accepted) {
        console.warn('[stt] stdin backpressure', {
          requestId: req.id,
          inFlight: this.inFlight.size,
        });
      }
    } catch (err) {
      finish({
        ok: false,
        error: err instanceof Error ? `STT 요청 전송 실패: ${err.message}` : 'STT 요청 전송 실패',
      });
    }
  }

  async transcribe(audioBuffer: ArrayBuffer, mimeType: string): Promise<TranscribeResult> {
    // temp 파일 작성 (데몬은 path 로 받음 — IPC 페이로드를 가볍게 유지)
    // 검증된 흐름:
    // renderer MediaRecorder(webm/opus) → main temp file → python sidecar(Faster Whisper) → 응답 JSON.
    // 이 경로에서 실제로 빈 transcript(너무 짧은 발화)와 정상 transcript 둘 다 확인되었다.
    const ext = getAudioExtension(mimeType);
    // 동시 transcribe 호출 시 같은 nextSeq로 path가 충돌해 한쪽 파일을 다른 쪽이 덮어쓰고
    // 먼저 끝난 응답이 unlink 하면 다른 쪽이 "audio not found" 로 실패하는 race 가 있었다.
    // seq 를 한 번에 capture 해서 path/id 가 동일 seq 를 공유하도록 보장.
    const seq = this.nextSeq++;
    const tempPath = path.join(os.tmpdir(), `sku-sw-stt-${Date.now()}-${seq}.${ext}`);
    await fs.writeFile(tempPath, Buffer.from(audioBuffer));

    const id = `req-${seq}`;

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

      // fatal 상태라도 사용자가 그 사이 의존성을 설치했을 수 있으므로,
      // 쿨다운이 지난 새 요청은 데몬을 다시 스폰해 재확인한다(앱 재시작 없이 복구).
      if (this.fatalError && !this.child) {
        if (Date.now() - this.lastFatalAt < STT_FATAL_RETRY_COOLDOWN_MS) {
          req.resolve({ ok: false, error: this.fatalError });
          return;
        }
        this.fatalError = null;
        this.queue.push(req);
        this.start();
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

  /** 사용자가 의존성 설치 후 "다시 시도"를 누를 때: fatal 초기화 + 데몬 재스폰 */
  retry() {
    console.info('[stt] manual retry requested');
    this.fatalError = null;
    this.lastFatalAt = 0;
    sendSttStatus({ state: 'restarting' });
    if (!this.child) this.start();
    return { ok: true };
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

  /**
   * 앱 종료(will-quit) 시 자식을 즉시 SIGKILL.
   * 자식(파이썬 데몬)은 부모가 app.exit 로 죽어도 살아남아 모델을 물고 고아가 되므로,
   * 강제 종료 직전에 동기적으로 죽여 orphan 을 막는다. (deferred 타이머에 의존하지 않음)
   */
  forceKill() {
    this.shuttingDown = true;
    const child = this.child;
    this.child = null;
    if (child && !child.killed) {
      try {
        child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
    }
  }
}

const sttManager = new STTManager();

// ============================================================
// BrowserWindow
// ============================================================

function resolveAppIconPath(): string | null {
  // dev 모드: __dirname = .../swproject/dist-electron, 한 단계 위에서 build/public 탐색
  // prod 모드: app.getAppPath() 기준으로도 탐색 (asar 안의 dist/icon.png 등)
  const candidates = [
    path.join(__dirname, '..', 'build', 'icon.png'),
    path.join(__dirname, '..', 'public', 'icon.png'),
    path.join(__dirname, '..', 'dist', 'icon.png'),
    path.join(app.getAppPath(), 'build', 'icon.png'),
    path.join(app.getAppPath(), 'public', 'icon.png'),
    path.join(app.getAppPath(), 'dist', 'icon.png'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function createWindow() {
  const iconPath = resolveAppIconPath();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: iconPath ?? undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // 배포본은 file:// 로 로드되어 WS 핸드셰이크에 표준 API 로 Authorization 헤더를 실을 수
  // 없다. FE 가 토큰을 accessToken 쿼리로 보내면, 여기서 쿼리의 accessToken 을 Authorization
  // 헤더로 변환해 준다(백엔드 JwtAuthFilter 는 헤더를 봄).
  // 배포본은 file:// 로 로드되어 모든 요청의 Origin 이 null 이 된다. 백엔드 WS 핸드셰이크는
  // origin allowlist 를 강제(http://localhost:5173 · https://dev.sku-sw.cloud 만 허용)하므로
  // null/file:// origin 은 거부되어 WS 가 1006 으로 실패한다.
  // 실측: origin=http://localhost:5173 → 101 / origin=null(file://) → 1006.
  // → sku-sw.cloud 요청의 Origin 을 허용된 값(https://dev.sku-sw.cloud)으로 교정한다.
  //   (file://electron-app 등 allowlist 에 없는 값은 거부되므로 반드시 허용값이어야 함.)
  // 또한 WS 핸드셰이크는 표준 API 로 Authorization 헤더를 못 싣는다 → 쿼리 accessToken 을
  // Authorization 헤더로도 변환해 준다(REST 는 axios 가 이미 헤더로 보냄).
  if (!isDev) {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      if (details.url.includes('sku-sw.cloud')) {
        details.requestHeaders['Origin'] = 'https://dev.sku-sw.cloud';
        try {
          const accessToken = new URL(details.url).searchParams.get('accessToken');
          if (accessToken && !details.requestHeaders['Authorization']) {
            details.requestHeaders['Authorization'] = `Bearer ${accessToken}`;
          }
        } catch {
          /* URL 파싱 실패 시 무시 */
        }
      }
      callback({ requestHeaders: details.requestHeaders });
    });
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.info('[window] renderer finished load');
  });

  // Cmd/Ctrl+R, F5 등 페이지 새로고침 단축키 차단 — 방송 중 WebSocket 연결이 끊겨 방송이 종료되는 것 방지
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const isReload =
      (input.key === 'r' && (input.control || input.meta)) ||
      input.key === 'F5' ||
      (input.key === 'R' && (input.control || input.meta));
    if (isReload) {
      event.preventDefault();
      console.info('[window] reload shortcut blocked');
    }
  });

  mainWindow.on('close', (event) => {
    if (isQuitting || !mainWindow) return;
    if (!appSettings.closeToTray) {
      // 트레이 상주 모드가 아닐 때 실제 종료가 시도됨.
      // 방송 중이라면 renderer 에 확인을 요청하고 종료를 보류한다.
      if (overlayState.runtime?.isBroadcasting) {
        event.preventDefault();
        mainWindow.webContents.send('broadcast:confirm-quit');
        return;
      }
      return;
    }
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
  // macOS dev 모드에서 dock 아이콘을 앱 로고로 교체.
  // 패키지 빌드에서는 build/icon.icns 가 Info.plist 경유로 자동 적용되므로
  // 여기서는 dev 환경에서의 기본 Electron 아이콘만 덮어쓴다.
  console.info('[dock-icon] platform=%s isDev=%s hasDock=%s', process.platform, isDev, Boolean(app.dock));
  if (process.platform === 'darwin' && isDev && app.dock) {
    const iconPath = resolveAppIconPath();
    console.info('[dock-icon] iconPath=%s', iconPath);
    if (iconPath) {
      const img = nativeImage.createFromPath(iconPath);
      console.info('[dock-icon] image empty=%s size=%j', img.isEmpty(), img.getSize());
      app.dock.setIcon(img);
      console.info('[dock-icon] setIcon called');
    }
  }

  // === IPC 핸들러 ===
  ipcMain.handle('app:version', () => app.getVersion());
  ipcMain.handle('app:platform', () => process.platform);
  ipcMain.handle('app-settings:get', () => appSettings);
  ipcMain.handle('app-settings:set', (_event, settings: unknown) => {
    appSettings = sanitizeAppSettings(settings);
    return { ok: true, settings: appSettings };
  });
  ipcMain.handle('shell:open-external', (_event, url: string) => shell.openExternal(url));
  // 전역 PTT(uiohook)가 키 이벤트를 받으려면 macOS 손쉬운 사용 권한이 필요하다.
  // renderer 가 권한 상태를 확인해(미부여 시) 안내 배너를 띄울 수 있게 노출한다.
  ipcMain.handle('app:accessibility-status', () =>
    process.platform === 'darwin'
      ? systemPreferences.isTrustedAccessibilityClient(false)
      : true
  );
  ipcMain.handle('app:open-accessibility-settings', () => {
    if (process.platform === 'darwin') {
      // prompt=true → 미부여 시 시스템 안내, 그리고 설정 패널 직접 오픈
      systemPreferences.isTrustedAccessibilityClient(true);
      return shell.openExternal(
        'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility'
      );
    }
    return Promise.resolve();
  });
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
  // renderer 가 방송 종료 후 실제 종료를 허용하도록 신호를 보냄
  ipcMain.on('app:quit-confirmed', () => {
    isQuitting = true;
    app.quit();
  });
  ipcMain.on('app:quit-cancelled', () => {
    // 사용자가 종료 확인 모달에서 취소를 누름 — 아무것도 안 함 (창 유지)
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
  ipcMain.handle('stt:retry', () => sttManager.retry());
  ipcMain.handle('stt:transcribe', async (_event, audioBuffer: ArrayBuffer, mimeType: string) => {
    const startedAt = Date.now();
    console.info('[stt] ipc transcribe request', {
      bytes: audioBuffer.byteLength,
      mimeType,
    });
    const result = await sttManager.transcribe(audioBuffer, mimeType);
    console.info('[stt] ipc transcribe response', {
      ok: result.ok,
      error: result.error,
      durationMs: Date.now() - startedAt,
    });
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

  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true);
      return;
    }
    callback(false);
  });

  // 창을 가장 먼저 띄운다.
  // 이전엔 createWindow() 가 whenReady 의 맨 끝(접근성 다이얼로그·전역 훅 초기화 뒤)이라,
  // 첫 실행 시 메인 창이 안 뜨고 트레이 아이콘을 눌러야 열리는 문제가 있었다(macOS).
  createWindow();

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
      const accessibilityNotice = {
        type: 'info' as const,
        title: '손쉬운 사용 권한 필요',
        message: '전역 PTT(Cmd/Ctrl+Shift+M)를 사용하려면 손쉬운 사용 권한이 필요합니다.',
        detail: '시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용에서\n"Electron" (개발 중) 또는 앱 이름을 활성화한 뒤 앱을 재시작해주세요.',
        buttons: ['확인'],
      };
      // 메인 창에 sheet 로 붙여서, 앱-모달 다이얼로그가 창 표시를 가로채지 않게 한다.
      if (mainWindow) {
        void dialog.showMessageBox(mainWindow, accessibilityNotice);
      } else {
        void dialog.showMessageBox(accessibilityNotice);
      }
    }
  }

  startGlobalPttHook();
  console.info('[shortcut] 전역 PTT 후킹 시작: Ctrl/Cmd+Shift+M (hold)');

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
  // 베스트-에포트 정리. 각 단계를 try/catch 로 격리해 하나가 실패해도 종료가 막히지 않게 한다.
  try {
    sttManager.shutdown();
  } catch (err) {
    console.warn('[quit] stt shutdown failed:', err);
  }
  try {
    tray?.destroy();
  } catch {
    /* ignore */
  }
  tray = null;
  try {
    obsManager.disconnect();
  } catch {
    /* ignore */
  }
  try {
    overlayServer?.close();
  } catch {
    /* ignore */
  }
  overlayServer = null;
  // NOTE: uIOhook.stop() 은 여기서 호출하지 않는다.
  // 손쉬운 사용 권한이 없어 전역 훅이 비정상(반쯤 초기화) 상태이면 stop() 이 동기 블록/예외를
  // 일으켜 before-quit 자체가 멈추고 종료가 영영 완료되지 않는 사례가 확인됐다(배포본이
  // SIGTERM 에도 안 죽고 SIGKILL 이 필요했음). 네이티브 훅 스레드 정리는 아래 will-quit 의
  // app.exit(0)(프로세스 강제 종료)에 맡긴다.
});

// 종료 보장 안전망:
// 네이티브 훅(uiohook)·HTTP 서버·자식 프로세스가 main 프로세스를 붙들어 정상 종료가 멈추는
// 것을 막는다. will-quit 까지 왔으면 자식을 즉시 죽이고 프로세스를 강제 종료한다.
let forcedExit = false;
app.on('will-quit', () => {
  if (forcedExit) return;
  forcedExit = true;
  try {
    sttManager.forceKill();
  } catch {
    /* ignore */
  }
  app.exit(0);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
