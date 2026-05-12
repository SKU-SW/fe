/**
 * @file OBS WebSocket v5 연결 및 브라우저 소스 설정 매니저
 * @created Sprint OBS Phase 2
 * @dependsOn ws, crypto, fs, net, os, path
 * @related electron/main.ts
 */

import crypto from "crypto";
import { existsSync } from "fs";
import { promises as fs } from "fs";
import net from "net";
import os from "os";
import path from "path";
import WebSocket from "ws";

const OBS_WS_HOST = "127.0.0.1";
const DEFAULT_OBS_WS_PORT = 4455;
const PROBE_TIMEOUT_MS = 600;
const CONNECT_RETRIES = 12;
const RETRY_INTERVAL_MS = 1500;
const OBS_STARTUP_SETTLE_MS = 3000;
const REQUEST_NOT_READY_CODE = 207;
const REQUEST_RETRY_COUNT = 6;
const REQUEST_RETRY_INITIAL_DELAY_MS = 250;
const REQUEST_RETRY_MAX_DELAY_MS = 1500;
const SETUP_RETRY_COUNT = 12;
const SETUP_RETRY_DELAY_MS = 750;
const BROWSER_SOURCE_NAME = "SKU-SW Overlay";
const BROWSER_SOURCE_KIND = "browser_source";
const BROWSER_SOURCE_CUSTOM_CSS = [
  "html, body {",
  "  background: rgba(0, 0, 0, 0) !important;",
  "  margin: 0 !important;",
  "  overflow: hidden !important;",
  "}",
  "#root {",
  "  background: rgba(0, 0, 0, 0) !important;",
  "}",
].join("\n");

interface ObsRequestError extends Error {
  code?: number;
  requestType?: string;
}

interface ObsHelloPayload {
  authentication?: {
    challenge: string;
    salt: string;
  };
}

interface ObsResponseData {
  requestId?: string;
  requestStatus?: {
    result: boolean;
    code: number;
    comment?: string;
  };
  responseData?: Record<string, unknown>;
}

interface ObsLaunchResult {
  ok: boolean;
  error?: string;
}

interface ObsWebSocketSettings {
  configPath: string;
  configSource: "portable" | "standard" | "default";
  serverEnabled: boolean;
  serverPort: number;
  authRequired: boolean;
  serverPassword: string | null;
}

interface ObsWebSocketConfigFile {
  server_enabled?: boolean;
  server_port?: number;
  auth_required?: boolean;
  server_password?: string;
}

export interface ObsSetupResult {
  ok: boolean;
  status: "setup_ok" | "not_found" | "auth_required" | "timeout" | "setup_failed";
  error?: string;
  diagnostics?: {
    host: string;
    port: number;
    configPath: string;
    configSource: "portable" | "standard" | "default";
    configFound: boolean;
    serverEnabled: boolean;
    authRequired: boolean;
    passwordConfigured: boolean;
    obsExecutablePath: string | null;
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sha256Base64(value: string): string {
  return crypto.createHash("sha256").update(value).digest("base64");
}

export class OBSManager {
  private socket: WebSocket | null = null;

  private buildDiagnostics(settings: ObsWebSocketSettings, obsExecutablePath: string | null, configFound: boolean) {
    return {
      host: OBS_WS_HOST,
      port: settings.serverPort,
      configPath: settings.configPath,
      configSource: settings.configSource,
      configFound,
      serverEnabled: settings.serverEnabled,
      authRequired: settings.authRequired,
      passwordConfigured: !!settings.serverPassword,
      obsExecutablePath,
    } as const;
  }

  async connectAndSetup(
    overlayUrl: string,
    launchFn: () => ObsLaunchResult,
    obsExecutablePath: string | null = null
  ): Promise<ObsSetupResult> {
    try {
      const { settings, configFound } = await this.readWebSocketSettings(obsExecutablePath);
      const diagnostics = this.buildDiagnostics(settings, obsExecutablePath, configFound);
      const portOpen = await this.probePort(settings.serverPort);

      if (!portOpen) {
        const launchResult = launchFn();
        if (!launchResult.ok) {
          return {
            ok: false,
            status: "not_found",
            error: launchResult.error ?? "OBS 실행 파일을 찾지 못했습니다.",
            diagnostics,
          };
        }
      }

      const ready = portOpen || await this.waitForObs(settings.serverPort);
      if (!ready) {
        if (!settings.serverEnabled) {
          return {
            ok: false,
            status: "timeout",
            error: "OBS WebSocket 서버가 비활성화되어 있습니다. OBS → 도구 → WebSocket 서버 설정에서 서버 활성화를 켜주세요.",
            diagnostics,
          };
        }

        return {
          ok: false,
          status: "timeout",
          error: `OBS WebSocket 서버가 포트 ${settings.serverPort}에서 준비되지 않았습니다. OBS → 도구 → WebSocket 서버 설정의 포트 값을 확인해주세요.`,
          diagnostics,
        };
      }

      if (!portOpen) {
        await sleep(OBS_STARTUP_SETTLE_MS);
      }

      const password = settings.authRequired ? settings.serverPassword : null;
      const ws = await this.connect(settings.serverPort, password);
      this.socket = ws;

      await this.sendRequestWithRetry(ws, "GetVersion");
      await this.setupBrowserSourceWithRetry(ws, overlayUrl);
      return { ok: true, status: "setup_ok", diagnostics };
    } catch (err: unknown) {
      const { settings, configFound } = await this.readWebSocketSettings(obsExecutablePath);
      const diagnostics = this.buildDiagnostics(settings, obsExecutablePath, configFound);

      if (err instanceof Error && err.message === "OBS_AUTH_REQUIRED") {
        return {
          ok: false,
          status: "auth_required",
          error: "OBS WebSocket 인증이 필요합니다.",
          diagnostics,
        };
      }

      if (this.isObsNotReadyError(err)) {
        return {
          ok: false,
          status: "timeout",
          error: "OBS가 아직 초기화 중입니다. 잠시 후 다시 시도해주세요.",
          diagnostics,
        };
      }

      return {
        ok: false,
        status: "setup_failed",
        error: err instanceof Error ? err.message : "OBS 자동 설정 중 오류가 발생했습니다.",
        diagnostics,
      };
    } finally {
      this.disconnect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private getStandardConfigPath(): string {
    if (process.platform === "darwin") {
      return path.join(os.homedir(), "Library/Application Support/obs-studio/plugin_config/obs-websocket/config.json");
    }

    if (process.platform === "win32") {
      const appData = process.env["APPDATA"] ?? path.join(os.homedir(), "AppData", "Roaming");
      return path.join(appData, "obs-studio", "plugin_config", "obs-websocket", "config.json");
    }

    return path.join(os.homedir(), ".config", "obs-studio", "plugin_config", "obs-websocket", "config.json");
  }

  private getPortableConfigPath(obsExecutablePath: string | null): string | null {
    if (process.platform !== "win32" || !obsExecutablePath) {
      return null;
    }

    const installDir = path.resolve(path.dirname(obsExecutablePath), "..", "..");
    const portableMarkerPath = [
      path.join(installDir, "portable_mode.txt"),
      path.join(installDir, "portable_mode"),
    ];

    return portableMarkerPath.some((filePath) => existsSync(filePath))
      ? path.join(installDir, "portable_config", "plugin_config", "obs-websocket", "config.json")
      : null;
  }

  private async readWebSocketSettings(
    obsExecutablePath: string | null
  ): Promise<{ settings: ObsWebSocketSettings; configFound: boolean }> {
    const portableConfigPath = this.getPortableConfigPath(obsExecutablePath);
    const configPath = portableConfigPath ?? this.getStandardConfigPath();
    const configSource = portableConfigPath ? "portable" : "standard";

    try {
      const content = await fs.readFile(configPath, "utf-8");
      const parsed = JSON.parse(content) as ObsWebSocketConfigFile;

      return {
        settings: {
          configPath,
          configSource,
          serverEnabled: typeof parsed.server_enabled === "boolean" ? parsed.server_enabled : true,
          serverPort: typeof parsed.server_port === "number" ? parsed.server_port : DEFAULT_OBS_WS_PORT,
          authRequired: typeof parsed.auth_required === "boolean" ? parsed.auth_required : true,
          serverPassword: typeof parsed.server_password === "string" && parsed.server_password.trim()
            ? parsed.server_password.trim()
            : null,
        },
        configFound: true,
      };
    } catch {
      return {
        settings: {
          configPath,
          configSource: "default",
          serverEnabled: true,
          serverPort: DEFAULT_OBS_WS_PORT,
          authRequired: true,
          serverPassword: null,
        },
        configFound: false,
      };
    }
  }

  private probePort(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = net.createConnection({ host: OBS_WS_HOST, port });
      let settled = false;

      const finish = (value: boolean) => {
        if (settled) return;
        settled = true;
        socket.removeAllListeners();
        socket.destroy();
        resolve(value);
      };

      socket.setTimeout(PROBE_TIMEOUT_MS);
      socket.once("connect", () => finish(true));
      socket.once("timeout", () => finish(false));
      socket.once("error", () => finish(false));
    });
  }

  private async waitForObs(port: number): Promise<boolean> {
    for (let i = 0; i < CONNECT_RETRIES; i += 1) {
      if (await this.probePort(port)) {
        return true;
      }
      await sleep(RETRY_INTERVAL_MS);
    }
    return false;
  }

  private connect(port: number, password: string | null): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://${OBS_WS_HOST}:${port}`);

      ws.once("error", (err) => reject(err));
      ws.on("message", (data) => {
        const raw = JSON.parse(data.toString()) as { op: number; d?: ObsHelloPayload | ObsResponseData };

        if (raw.op === 0) {
          const payload = raw.d as ObsHelloPayload | undefined;
          const authentication = payload?.authentication;
          if (authentication && !password) {
            ws.close();
            reject(new Error("OBS_AUTH_REQUIRED"));
            return;
          }

          const identify = {
            op: 1,
            d: {
              rpcVersion: 1,
              ...(authentication && password
                ? {
                    authentication: sha256Base64(
                      `${sha256Base64(`${password}${authentication.salt}`)}${authentication.challenge}`
                    ),
                  }
                : {}),
            },
          };
          ws.send(JSON.stringify(identify));
          return;
        }

        if (raw.op === 2) {
          resolve(ws);
        }
      });
    });
  }

  private sendRequest(
    ws: WebSocket,
    requestType: string,
    requestData: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID();

      const handleMessage = (data: WebSocket.RawData) => {
        const raw = JSON.parse(data.toString()) as { op: number; d?: ObsResponseData };
        if (raw.op !== 7 || raw.d?.requestId !== requestId) {
          return;
        }

        ws.off("message", handleMessage);

        if (!raw.d?.requestStatus?.result) {
          const error = new Error(raw.d?.requestStatus?.comment ?? `${requestType} 요청 실패`) as ObsRequestError;
          error.code = raw.d?.requestStatus?.code;
          error.requestType = requestType;
          reject(error);
          return;
        }

        resolve(raw.d?.responseData ?? {});
      };

      ws.on("message", handleMessage);
      ws.send(JSON.stringify({
        op: 6,
        d: {
          requestType,
          requestId,
          requestData,
        },
      }));
    });
  }

  private isObsNotReadyError(err: unknown): err is ObsRequestError {
    return err instanceof Error && (
      (err as ObsRequestError).code === REQUEST_NOT_READY_CODE
      || err.message.includes("OBS is not ready to perform the request")
    );
  }

  private async sendRequestWithRetry(
    ws: WebSocket,
    requestType: string,
    requestData: Record<string, unknown> = {}
  ): Promise<Record<string, unknown>> {
    let delayMs = REQUEST_RETRY_INITIAL_DELAY_MS;

    for (let attempt = 0; attempt < REQUEST_RETRY_COUNT; attempt += 1) {
      try {
        return await this.sendRequest(ws, requestType, requestData);
      } catch (err: unknown) {
        if (!this.isObsNotReadyError(err) || attempt === REQUEST_RETRY_COUNT - 1) {
          throw err;
        }

        await sleep(delayMs);
        delayMs = Math.min(delayMs * 2, REQUEST_RETRY_MAX_DELAY_MS);
      }
    }

    throw new Error(`${requestType} 요청이 재시도 한도를 초과했습니다.`);
  }

  private async setupBrowserSourceWithRetry(ws: WebSocket, overlayUrl: string): Promise<void> {
    for (let attempt = 0; attempt < SETUP_RETRY_COUNT; attempt += 1) {
      try {
        await this.setupBrowserSource(ws, overlayUrl);
        return;
      } catch (err: unknown) {
        if (!this.isObsNotReadyError(err) || attempt === SETUP_RETRY_COUNT - 1) {
          throw err;
        }

        await sleep(SETUP_RETRY_DELAY_MS);
      }
    }
  }

  private async getCurrentScene(ws: WebSocket): Promise<string> {
    const result = await this.sendRequestWithRetry(ws, "GetCurrentProgramScene");
    const sceneName = typeof result.currentProgramSceneName === "string" ? result.currentProgramSceneName : "";
    if (!sceneName) {
      const fallback = await this.sendRequestWithRetry(ws, "GetSceneList");
      const currentFromList = typeof fallback.currentProgramSceneName === "string" ? fallback.currentProgramSceneName : "";
      if (currentFromList) {
        return currentFromList;
      }

      const scenes = Array.isArray(fallback.scenes) ? fallback.scenes as Array<Record<string, unknown>> : [];
      const firstSceneName = scenes.find((scene) => typeof scene.sceneName === "string")?.sceneName;
      if (typeof firstSceneName === "string" && firstSceneName) {
        return firstSceneName;
      }

      throw new Error("OBS 현재 프로그램 씬을 찾지 못했습니다.");
    }
    return sceneName;
  }

  private async setupBrowserSource(ws: WebSocket, overlayUrl: string): Promise<void> {
    const sceneName = await this.getCurrentScene(ws);
    const response = await this.sendRequestWithRetry(ws, "GetInputList");
    const inputs = Array.isArray(response.inputs) ? response.inputs as Array<Record<string, unknown>> : [];
    const browserInputs = inputs.filter((input) => input.inputKind === BROWSER_SOURCE_KIND);

    for (const input of browserInputs) {
      const inputName = typeof input.inputName === "string" ? input.inputName : "";
      if (!inputName) continue;

      try {
        const settings = await this.sendRequestWithRetry(ws, "GetInputSettings", { inputName });
        const inputSettings = settings.inputSettings as Record<string, unknown> | undefined;
        if (typeof inputSettings?.url === "string" && inputSettings.url === overlayUrl) {
          // 사용자가 수동으로 넣은 브라우저 소스도 정상 상태로 간주
          return;
        }
      } catch {
        // 일부 입력이 조회 실패해도 다른 입력 탐색 계속
      }
    }

    const existing = inputs.find((input) => input.inputName === BROWSER_SOURCE_NAME);

    if (existing) {
      try {
        await this.sendRequestWithRetry(ws, "SetInputSettings", {
          inputName: BROWSER_SOURCE_NAME,
          inputSettings: {
            url: overlayUrl,
            width: 1920,
            height: 1080,
            custom_css: BROWSER_SOURCE_CUSTOM_CSS,
          },
          overlay: true,
        });
      } catch (err: unknown) {
        throw new Error(`OBS 브라우저 소스 업데이트 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
      }
      return;
    }

    try {
      await this.sendRequestWithRetry(ws, "CreateInput", {
        sceneName,
        inputName: BROWSER_SOURCE_NAME,
        inputKind: BROWSER_SOURCE_KIND,
        inputSettings: {
          url: overlayUrl,
          width: 1920,
          height: 1080,
          custom_css: BROWSER_SOURCE_CUSTOM_CSS,
        },
        sceneItemEnabled: true,
      });
    } catch (err: unknown) {
      throw new Error(`OBS 브라우저 소스 생성 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
    }
  }
}
