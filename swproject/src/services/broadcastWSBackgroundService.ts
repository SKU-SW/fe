/**
 * @file 전역 상주형 방송 WebSocket + TTS 큐 + 시청자 폴링 서비스
 * @created Phase 2 - WebSocket/TTS/Polling 추출
 * @dependsOn src/shared/stores/aiModeStore.ts (broadcastStreamId, dialogues, currentTranscript, emotion)
 * @dependsOn src/shared/stores/authStore.ts (accessToken)
 * @dependsOn src/shared/stores/overlayStore.ts (updateRuntime)
 * @dependsOn src/features/broadcast/api/streamApi.ts (getStreamInfo, adaptDialogue)
 * @usedBy src/components/AppInitializer.tsx (Phase 2 init)
 * @usedBy src/pages/DashboardPage.tsx (callback registration)
 *
 * 역할:
 *   1. WebSocket 생명주기 관리 (connect/disconnect/reconnect)
 *   2. TTS 오디오 큐 관리 (enqueue/playback/cleanup)
 *   3. 시청자 채팅 폴링 (3초 주기)
 *   4. 인증/방송 상태 변화 감시 (Zustand subscribe)
 *   5. 콜백 등록 인터페이스 (onVoiceChunk, onVoiceTurnComplete, onEmotionChange, onViewerChat)
 *
 * 특징:
 *   - 싱글톤 패턴 (module-level export)
 *   - DashboardPage 언마운트 후에도 WebSocket/TTS/폴링 지속
 *   - 페이지 네비게이션 중 음성 손실 방지 (TTS 큐 서비스 내 보관)
 *   - 토큰 갱신 시 자동 재연결 (authStore.accessToken 변화 감시)
 *   - 방송 종료 시 자동 정리 (aiModeStore.broadcastStreamId 변화 감시)
 */

import type { AxiosError } from "axios";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useAuthStore } from "@/shared/stores/authStore";
import { useOverlayStore } from "@/shared/stores/overlayStore";
import { adaptDialogue, getStreamInfo } from "@/features/broadcast/api/streamApi";
import {
  buildInterruptRequestMessage,
} from "@/shared/types/broadcastWs";
import type {
  StreamWsClientMessage,
  StreamWsErrorCode,
  StreamWsVoiceEvent,
  VoiceChunk,
  VoiceInterrupted,
  VoiceTurnComplete,
} from "@/shared/types/broadcastWs";
import type { StreamEmotion } from "@/shared/types/stream";

const WS_PATH = "/api/v1/stream/ws";
const RECONNECT_DELAY_MS = 3000;
const RESPONSE_TIMEOUT_MS = 5000;
const INTERRUPT_TIMEOUT_MS = 10_000;
const POLLING_INTERVAL_MS = 3000;
const PCM_SAMPLE_RATE = Number(
  import.meta.env.VITE_TTS_PCM_SAMPLE_RATE ?? 24000
);
const PCM_CHANNELS = 1;

// ============================================================
// 타입 정의
// ============================================================

interface BroadcastWSCallbacks {
  onVoiceChunk?: (chunk: VoiceChunk) => void;
  onVoiceTurnComplete?: (turn: VoiceTurnComplete) => void;
  onEmotionChange?: (emotion: StreamEmotion) => void;
  onVoiceInterrupted?: (interrupted: VoiceInterrupted) => void;
  onBufferedStreamerTextFlushed?: (text: string) => void;
  onViewerChat?: (dialogues: any[]) => void;
  onError?: (message: string, code?: StreamWsErrorCode) => void;
}

interface BroadcastWSServiceState {
  isConnected: boolean;
  error: string | null;
  diagnostic: string | null;
  isPlayingTTS: boolean;
}

interface QueuedTTSChunk {
  generation: number;
  audioBufferPromise: Promise<AudioBuffer | null>;
}

// ============================================================
// 유틸리티 함수
// ============================================================

function readyStateLabel(state: number): string {
  switch (state) {
    case WebSocket.CONNECTING:
      return "CONNECTING";
    case WebSocket.OPEN:
      return "OPEN";
    case WebSocket.CLOSING:
      return "CLOSING";
    case WebSocket.CLOSED:
      return "CLOSED";
    default:
      return `UNKNOWN(${state})`;
  }
}

/**
 * raw 16-bit signed little-endian PCM ArrayBuffer 를 AudioBuffer 로 변환.
 */
function rawPcmToAudioBuffer(
  ctx: AudioContext,
  buffer: ArrayBuffer
): AudioBuffer {
  const view = new DataView(buffer);
  const sampleCount = Math.floor(buffer.byteLength / 2);
  const audioBuffer = ctx.createBuffer(
    PCM_CHANNELS,
    sampleCount,
    PCM_SAMPLE_RATE
  );
  const channel = audioBuffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    const sample = view.getInt16(i * 2, /* littleEndian */ true);
    // Int16 → Float32 [-1, 1)
    channel[i] = sample < 0 ? sample / 0x8000 : sample / 0x7fff;
  }
  return audioBuffer;
}

function statusOf(err: unknown): number | undefined {
  return (err as AxiosError)?.response?.status;
}

// ============================================================
// 서비스 클래스
// ============================================================

class BroadcastWSBackgroundService {
  private initialized = false;
  private errorRef: string | null = null;
  private diagnosticRef: string | null = null;
  private streamingDialogueText = "";
  private snapshot: BroadcastWSServiceState = {
    isConnected: false,
    error: null,
    diagnostic: null,
    isPlayingTTS: false,
  };

  // WebSocket 상태
  private wsRef: WebSocket | null = null;
  private pendingAudiosRef: Blob[] = [];
  private reconnectTimerRef: ReturnType<typeof setTimeout> | null = null;
  private responseTimerRef: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnectRef = true;
  private intentionalCloseRef = new WeakSet<WebSocket>();

  // AI 응답 인터럽트 상태
  private currentTurnNumberRef: number | null = null;
  private interruptedTurnsRef = new Set<number>();
  private pendingInterruptTurnRef: number | null = null;
  private pendingInterruptTimerRef: ReturnType<typeof setTimeout> | null = null;
  private bufferedStreamerTextRef: string | null = null;

  // TTS 상태
  private audioCtxRef: AudioContext | null = null;
  private currentSourceRef: AudioBufferSourceNode | null = null;
  private scheduledSourcesRef = new Set<AudioBufferSourceNode>();
  private ttsQueueRef: QueuedTTSChunk[] = [];
  private isSchedulingTTSRef = false;
  private ttsNextStartTimeRef = 0;
  private ttsGenerationRef = 0;
  private isPlayingTTSRef = false;

  // 폴링 상태
  private pollingTimerRef: ReturnType<typeof setTimeout> | null = null;
  private pollingInFlightRef = false;
  private latestViewerCursorRef: number | null = null;

  // 콜백 등록
  private callbacksRef: BroadcastWSCallbacks = {};

  // Zustand 구독 정리
  private unsubscribeAuthToken: (() => void) | null = null;
  private unsubscribeBroadcastStreamId: (() => void) | null = null;

  // 상태 변화 알림 (UI 구독용)
  private stateListeners = new Set<(state: BroadcastWSServiceState) => void>();

  // ============================================================
  // 초기화 / 정리
  // ============================================================

  init() {
    if (this.initialized) {
      console.info("[broadcast-ws-service] init skipped (already initialized)");
      return;
    }

    this.initialized = true;
    console.info("[broadcast-ws-service] init");

    this.unsubscribeAuthToken = useAuthStore.subscribe((state, prevState) => {
      if (state.accessToken === prevState.accessToken) return;

      const hasBroadcast = !!useAIModeStore.getState().broadcastStreamId;
      if (!hasBroadcast) return;

      if (!state.accessToken) {
        this.disconnect();
        this.stopPolling();
        return;
      }

      this.reconnect();
    });

    this.unsubscribeBroadcastStreamId = useAIModeStore.subscribe((state, prevState) => {
      const nextStreamId = state.broadcastStreamId;
      const prevStreamId = prevState.broadcastStreamId;
      const nextTtsEnabled = state.toggles.ttsEnabled;
      const prevTtsEnabled = prevState.toggles.ttsEnabled;

      if (nextTtsEnabled !== prevTtsEnabled && !nextTtsEnabled) {
        this.stopTTS();
      }

      if (nextStreamId === prevStreamId) return;

      if (!nextStreamId) {
        this.streamingDialogueText = "";
        this.disconnect();
        this.stopPolling();
        this.stopTTS();
        return;
      }

      this.shouldReconnectRef = true;
      this.connect();
      this.startPolling();
    });

    if (!useAIModeStore.getState().toggles.ttsEnabled) {
      this.stopTTS();
    }

    if (useAuthStore.getState().accessToken && useAIModeStore.getState().broadcastStreamId) {
      this.shouldReconnectRef = true;
      this.connect();
      this.startPolling();
    }

    this.notifyStateChange();
  }

  dispose() {
    console.info("[broadcast-ws-service] dispose");
    this.disconnect();
    this.stopPolling();
    this.stopTTS();
    this.clearInterruptTimer();
    this.unsubscribeAuthToken?.();
    this.unsubscribeBroadcastStreamId?.();
    this.unsubscribeAuthToken = null;
    this.unsubscribeBroadcastStreamId = null;
    this.stateListeners.clear();
    this.errorRef = null;
    this.diagnosticRef = null;
    this.streamingDialogueText = "";
    this.currentTurnNumberRef = null;
    this.interruptedTurnsRef.clear();
    this.pendingInterruptTurnRef = null;
    this.bufferedStreamerTextRef = null;
    this.initialized = false;
  }

  // ============================================================
  // 상태 구독 (UI용)
  // ============================================================

  subscribeState(listener: (state: BroadcastWSServiceState) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  getSnapshot(): BroadcastWSServiceState {
    return this.snapshot;
  }

  private buildSnapshot(): BroadcastWSServiceState {
    return {
      isConnected: this.wsRef?.readyState === WebSocket.OPEN,
      error: this.errorRef,
      diagnostic: this.diagnosticRef,
      isPlayingTTS: this.isPlayingTTSRef,
    };
  }

  private notifyStateChange() {
    this.snapshot = this.buildSnapshot();
    const state = this.snapshot;
    for (const listener of this.stateListeners) {
      listener(state);
    }
  }

  // ============================================================
  // 콜백 등록
  // ============================================================

  registerCallbacks(callbacks: BroadcastWSCallbacks) {
    this.callbacksRef = { ...this.callbacksRef, ...callbacks };
  }

  unregisterCallbacks(keys: (keyof BroadcastWSCallbacks)[]) {
    for (const key of keys) {
      delete this.callbacksRef[key];
    }
  }

  // ============================================================
  // WebSocket 관리
  // ============================================================

  private getWsUrl(): string | null {
    const accessToken = useAuthStore.getState().accessToken;
    const broadcastStreamId = useAIModeStore.getState().broadcastStreamId;

    if (!accessToken || !broadcastStreamId) return null;

    const base = import.meta.env.VITE_WS_URL ?? "wss://dev.sku-sw.cloud";
    const params = new URLSearchParams({
      broadcastStreamId,
      accessToken,
    });
    return `${base}${WS_PATH}?${params.toString()}`;
  }

  private clearResponseTimer() {
    if (this.responseTimerRef) {
      clearTimeout(this.responseTimerRef);
      this.responseTimerRef = null;
    }
  }

  private clearInterruptTimer() {
    if (this.pendingInterruptTimerRef) {
      clearTimeout(this.pendingInterruptTimerRef);
      this.pendingInterruptTimerRef = null;
    }
  }

  isAwaitingInterrupt(): boolean {
    return this.pendingInterruptTurnRef !== null;
  }

  bufferStreamerText(text: string): { ok: boolean; reason?: string } {
    const trimmed = text.trim();
    if (!trimmed) return { ok: false, reason: "empty text" };
    if (this.pendingInterruptTurnRef === null) {
      return { ok: false, reason: "no pending interrupt" };
    }
    if (this.bufferedStreamerTextRef) {
      console.warn("[broadcast-ws-service] streamer text already buffered during interrupt", {
        pendingTurn: this.pendingInterruptTurnRef,
      });
      return { ok: false, reason: "streamer text already buffered" };
    }

    this.bufferedStreamerTextRef = trimmed;
    console.info("[broadcast-ws-service] streamer text buffered until interrupt completes", {
      pendingTurn: this.pendingInterruptTurnRef,
      text: trimmed,
    });
    return { ok: true };
  }

  private flushBufferedStreamerText() {
    const text = this.bufferedStreamerTextRef;
    this.bufferedStreamerTextRef = null;
    if (!text) return;

    const result = this.sendChat(text);
    if (!result.ok) {
      console.warn("[broadcast-ws-service] buffered streamer text send failed", result);
      return;
    }
    this.callbacksRef.onBufferedStreamerTextFlushed?.(text);
  }

  private handleInterruptTimeout() {
    const timedOutTurn = this.pendingInterruptTurnRef;
    console.warn("[broadcast-ws-service] VOICE_INTERRUPTED timeout", {
      turnNumber: timedOutTurn,
      buffered: !!this.bufferedStreamerTextRef,
    });
    if (timedOutTurn !== null) {
      this.interruptedTurnsRef.delete(timedOutTurn);
    }
    this.pendingInterruptTurnRef = null;
    this.clearInterruptTimer();
    this.flushBufferedStreamerText();
  }

  private handleVoiceInterrupted(evt: Extract<StreamWsVoiceEvent, { eventType: "VOICE_INTERRUPTED" }>) {
    if (this.pendingInterruptTurnRef !== null && evt.turnNumber !== this.pendingInterruptTurnRef) {
      console.warn("[broadcast-ws-service] VOICE_INTERRUPTED turn mismatch", {
        expected: this.pendingInterruptTurnRef,
        received: evt.turnNumber,
      });
    }

    this.clearResponseTimer();
    this.clearInterruptTimer();
    this.pendingAudiosRef = [];
    this.interruptedTurnsRef.delete(evt.turnNumber);
    if (this.pendingInterruptTurnRef !== null) {
      this.interruptedTurnsRef.delete(this.pendingInterruptTurnRef);
    }
    this.pendingInterruptTurnRef = null;
    this.currentTurnNumberRef = null;
    this.errorRef = null;
    this.diagnosticRef = `응답 중단: turn=${evt.turnNumber}, cursorId=${evt.broadcastDialogueCursorId}`;
    this.callbacksRef.onVoiceInterrupted?.({
      turnNumber: evt.turnNumber,
      voiceText: evt.voiceText,
      emotion: evt.emotion,
      cursorId: evt.broadcastDialogueCursorId,
    });
    this.notifyStateChange();
    this.flushBufferedStreamerText();
  }

  interruptCurrentResponse(reason: string): { ok: boolean; turnNumber: number | null; reason?: string } {
    const turnNumber = this.currentTurnNumberRef;
    if (turnNumber === null) {
      if (this.isPlayingTTSRef) {
        this.stopTTS();
        this.pendingAudiosRef = [];
      }
      return { ok: false, turnNumber: null, reason: "no active turn" };
    }
    if (this.pendingInterruptTurnRef !== null) {
      return { ok: false, turnNumber, reason: "already pending" };
    }

    this.stopTTS();
    this.pendingAudiosRef = [];
    this.clearResponseTimer();
    this.interruptedTurnsRef.add(turnNumber);

    const ws = this.wsRef;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("[broadcast-ws-service] interrupt skipped: websocket not open", {
        turnNumber,
        readyState: ws ? readyStateLabel(ws.readyState) : "NONE",
      });
      this.interruptedTurnsRef.delete(turnNumber);
      return { ok: false, turnNumber, reason: "ws not open" };
    }

    const payload: StreamWsClientMessage = {
      message: buildInterruptRequestMessage(turnNumber, reason),
    };

    try {
      ws.send(JSON.stringify(payload));
      this.pendingInterruptTurnRef = turnNumber;
      this.clearInterruptTimer();
      this.pendingInterruptTimerRef = setTimeout(
        () => this.handleInterruptTimeout(),
        INTERRUPT_TIMEOUT_MS
      );
      console.info("[broadcast-ws-service] interrupt sent", {
        turnNumber,
        reason,
      });
      return { ok: true, turnNumber };
    } catch (err: unknown) {
      this.interruptedTurnsRef.delete(turnNumber);
      console.warn(
        "[broadcast-ws-service] interrupt send failed:",
        err instanceof Error ? err.message : err
      );
      return { ok: false, turnNumber, reason: "interrupt send failed" };
    }
  }

  private handleTextFrame(raw: string) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn("[broadcast-ws-service] non-JSON text frame ignored:", raw);
      return;
    }
    if (!parsed || typeof parsed !== "object") return;
    const obj = parsed as Record<string, unknown>;

    if (typeof obj.status === "string" && typeof obj.message === "string") {
      const status = obj.status;
      const message = obj.message;
      this.diagnosticRef = `${status}: ${message}`;
      if (status === "GEMINI_CONNECTING") {
        this.errorRef = null;
      }
      this.notifyStateChange();
      return;
    }

    // 에러 frame
    if (obj.error === "ERROR" && typeof obj.message === "string") {
      this.clearResponseTimer();
      const msg = obj.message;
      const code =
        typeof obj.code === "string" ? (obj.code as StreamWsErrorCode) : undefined;
      this.callbacksRef.onError?.(msg, code);

      // 코드별 재연결 정책
      if (
        code === "UNAUTHORIZED" ||
        code === "FORBIDDEN" ||
        code === "NOT_FOUND" ||
        code === "CONFLICT" ||
        code === "INVALID_REQUEST"
      ) {
        this.shouldReconnectRef = false;
        if (code === "UNAUTHORIZED" || code === "FORBIDDEN" || code === "NOT_FOUND") {
          useAIModeStore.getState().clearBroadcast();
        }
        return;
      }

      // 레거시 폴백
      if (!code) {
        const lowerMsg = msg.toLowerCase();
        if (
          lowerMsg.includes("broadcast") ||
          lowerMsg.includes("stream") ||
          lowerMsg.includes("방송")
        ) {
          this.shouldReconnectRef = false;
          useAIModeStore.getState().clearBroadcast();
        }
      }
      return;
    }

    const evt = obj as unknown as StreamWsVoiceEvent;
    switch (evt.eventType) {
      case "VOICE_EMOTION": {
        this.currentTurnNumberRef = evt.turnNumber;
        if (this.interruptedTurnsRef.has(evt.turnNumber)) {
          console.debug("[broadcast-ws-service] dropping interrupted VOICE_EMOTION", {
            turnNumber: evt.turnNumber,
          });
          return;
        }
        this.clearResponseTimer();
        this.errorRef = null;
        this.diagnosticRef = `감정 변경: ${evt.emotion}`;
        this.callbacksRef.onEmotionChange?.(evt.emotion);
        this.notifyStateChange();
        return;
      }
      case "VOICE_CHUNK": {
        this.currentTurnNumberRef = evt.turnNumber;
        if (this.interruptedTurnsRef.has(evt.turnNumber)) {
          this.pendingAudiosRef.shift();
          console.debug("[broadcast-ws-service] dropping interrupted VOICE_CHUNK", {
            turnNumber: evt.turnNumber,
          });
          return;
        }

        const audio = this.pendingAudiosRef.shift();
        if (!audio) {
          console.warn(
            "[broadcast-ws-service] VOICE_CHUNK received without preceding binary frame"
          );
          return;
        }
        this.clearResponseTimer();
        console.info("[broadcast-ws-service] voice chunk received", {
          turnNumber: evt.turnNumber,
          text: evt.voiceText,
          emotion: evt.emotion,
          audioBytes: audio.size,
          pendingAudios: this.pendingAudiosRef.length,
        });
        this.errorRef = null;
        const previewText = evt.voiceText ?? "";
        this.diagnosticRef = `청크 수신: emotion=${evt.emotion}, text=\"${previewText.slice(0, 30)}${previewText.length > 30 ? "…" : ""}\"`;
        this.enqueueTTS(audio);
        this.callbacksRef.onVoiceChunk?.({
          audio,
          voiceText: evt.voiceText,
          emotion: evt.emotion,
        });
        this.notifyStateChange();
        return;
      }
      case "VOICE_TURN_COMPLETE": {
        this.currentTurnNumberRef = evt.turnNumber;
        if (this.interruptedTurnsRef.has(evt.turnNumber)) {
          this.interruptedTurnsRef.delete(evt.turnNumber);
          this.currentTurnNumberRef = null;
          console.debug("[broadcast-ws-service] dropping interrupted VOICE_TURN_COMPLETE", {
            turnNumber: evt.turnNumber,
          });
          return;
        }

        this.clearResponseTimer();
        console.info("[broadcast-ws-service] voice turn complete", {
          turnNumber: evt.turnNumber,
          cursorId: evt.broadcastDialogueCursorId,
          text: evt.voiceText,
          emotion: evt.emotion,
        });
        this.errorRef = null;
        this.diagnosticRef = `턴 종료: cursorId=${evt.broadcastDialogueCursorId}, text=\"${evt.voiceText.slice(0, 30)}${evt.voiceText.length > 30 ? "…" : ""}\"`;
        this.streamingDialogueText = "";
        this.callbacksRef.onVoiceTurnComplete?.({
          voiceText: evt.voiceText,
          emotion: evt.emotion,
          cursorId: evt.broadcastDialogueCursorId,
        });
        this.currentTurnNumberRef = null;
        this.notifyStateChange();
        return;
      }
      case "VOICE_INTERRUPTED": {
        this.currentTurnNumberRef = evt.turnNumber;
        console.info("[broadcast-ws-service] voice interrupted", {
          turnNumber: evt.turnNumber,
          cursorId: evt.broadcastDialogueCursorId,
          text: evt.voiceText,
          emotion: evt.emotion,
        });
        this.handleVoiceInterrupted(evt);
        return;
      }
      default:
        console.warn("[broadcast-ws-service] unrecognized text frame:", obj);
    }
  }

  private connect() {
    const wsUrl = this.getWsUrl();
    if (!wsUrl) {
      console.warn("[broadcast-ws-service] cannot connect: missing wsUrl");
      this.diagnosticRef = "연결 대기: accessToken 또는 broadcastStreamId 없음";
      this.notifyStateChange();
      return;
    }
    if (this.wsRef && this.wsRef.readyState !== WebSocket.CLOSED) {
      console.debug("[broadcast-ws-service] already connected or connecting");
      return;
    }

    console.info("[broadcast-ws-service] connecting to", wsUrl);
    this.errorRef = null;
    this.diagnosticRef = `연결 시도: ${wsUrl}`;
    this.pendingAudiosRef = [];
    this.clearResponseTimer();
    this.notifyStateChange();

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "blob";
    this.wsRef = ws;
    let opened = false;

    ws.onopen = () => {
      if (this.wsRef !== ws) return;
      opened = true;
      console.info("[broadcast-ws-service] connected");
      this.errorRef = null;
      this.diagnosticRef = `연결 성공: ${wsUrl}`;
      this.notifyStateChange();
    };

    ws.onmessage = (event: MessageEvent) => {
      if (this.wsRef !== ws) return;
      if (event.data instanceof Blob) {
        if (
          this.pendingInterruptTurnRef !== null &&
          this.currentTurnNumberRef !== null &&
          this.interruptedTurnsRef.has(this.currentTurnNumberRef)
        ) {
          console.debug("[broadcast-ws-service] dropping interrupted binary frame", {
            turnNumber: this.currentTurnNumberRef,
            bytes: event.data.size,
          });
          return;
        }

        if (this.pendingAudiosRef.length >= 50) {
          console.warn("[broadcast-ws-service] pending audio queue full — dropping oldest frame");
          this.pendingAudiosRef.shift();
        }
        this.pendingAudiosRef.push(event.data);
        this.clearResponseTimer();
        this.diagnosticRef = `오디오 바이너리 수신: pending=${this.pendingAudiosRef.length}, size=${event.data.size}B`;
        this.notifyStateChange();
        return;
      }
      if (typeof event.data === "string") {
        this.handleTextFrame(event.data);
      }
    };

    ws.onerror = () => {
      if (this.wsRef !== ws) return;
      if (this.intentionalCloseRef.has(ws)) return;
      this.clearResponseTimer();
      console.error("[broadcast-ws-service] error event");
      this.errorRef = "WebSocket 통신 오류가 발생했습니다.";
      this.diagnosticRef = "error event 발생";
      this.notifyStateChange();
    };

    ws.onclose = (event: CloseEvent) => {
      if (this.wsRef !== ws) return;
      console.info(
        `[broadcast-ws-service] closed (code=${event.code}, reason="${event.reason}")`
      );
      this.clearResponseTimer();
      this.wsRef = null;
      const wasIntentional = this.intentionalCloseRef.has(ws);
      this.intentionalCloseRef.delete(ws);

      if (wasIntentional) {
        console.debug("[broadcast-ws-service] intentional close");
        this.diagnosticRef = "연결 정리됨: 클라이언트 cleanup";
        this.notifyStateChange();
        return;
      }

      this.diagnosticRef = `연결 종료: code=${event.code}, reason=${event.reason || "(없음)"}, wasClean=${String(event.wasClean)}`;
      this.notifyStateChange();

      if (!this.shouldReconnectRef) {
        console.debug("[broadcast-ws-service] reconnect disabled");
        return;
      }

      if (event.code === 1000 || event.code === 1008 || event.code === 1011) {
        this.shouldReconnectRef = false;
        if (event.code === 1011) {
          this.errorRef = event.reason || "서버 내부 오류로 방송 채널이 종료되었습니다.";
          this.diagnosticRef = `재연결 중단: 서버 내부 오류(code=1011, reason=${event.reason || "(없음)"})`;
          this.notifyStateChange();
        }
        return;
      }

      if (event.code === 1006 && !event.wasClean && !opened) {
        this.shouldReconnectRef = false;
        console.error("[broadcast-ws-service] handshake failed, stopping reconnect");
        this.errorRef = "방송 채널 연결에 실패했습니다. 진행 중 방송이 없거나 인증이 만료되었을 수 있습니다.";
        this.diagnosticRef = "연결 중단: WebSocket handshake 실패로 재연결을 중지했습니다.";
        this.notifyStateChange();
        useAIModeStore.getState().clearBroadcast();
        return;
      }

      this.reconnectTimerRef = setTimeout(() => {
        if (this.shouldReconnectRef) this.connect();
      }, RECONNECT_DELAY_MS);
    };
  }

  private disconnect() {
    this.shouldReconnectRef = false;
    if (this.reconnectTimerRef) {
      clearTimeout(this.reconnectTimerRef);
      this.reconnectTimerRef = null;
    }
    this.clearResponseTimer();
    this.clearInterruptTimer();
    const ws = this.wsRef;
    if (this.wsRef === ws) {
      this.wsRef = null;
    }
    this.pendingAudiosRef = [];
    this.currentTurnNumberRef = null;
    this.interruptedTurnsRef.clear();
    this.pendingInterruptTurnRef = null;
    this.bufferedStreamerTextRef = null;
    this.diagnosticRef = "연결 정리됨: 클라이언트 disconnect";
    this.notifyStateChange();
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      this.intentionalCloseRef.add(ws);
      try {
        ws.close(1000, "Client disconnect");
      } catch {
        this.intentionalCloseRef.delete(ws);
      }
    }
  }

  private reconnect() {
    this.disconnect();
    this.shouldReconnectRef = true;
    this.connect();
  }

  sendChat(text: string): { ok: boolean; reason?: string } {
    const ws = this.wsRef;
    if (!ws) {
      const reason = "소켓 인스턴스가 없습니다.";
      this.errorRef = reason;
      this.diagnosticRef = `송신 실패: ${reason}`;
      this.notifyStateChange();
      return { ok: false, reason };
    }
    if (ws.readyState !== WebSocket.OPEN) {
      const reason = `소켓 상태가 OPEN이 아닙니다 (${readyStateLabel(ws.readyState)}).`;
      this.errorRef = reason;
      this.diagnosticRef = `송신 실패: ${reason}`;
      this.notifyStateChange();
      return { ok: false, reason };
    }
    const trimmed = text.trim();
    if (!trimmed) {
      return { ok: false, reason: "전송할 텍스트가 비어 있습니다." };
    }

    const payload: StreamWsClientMessage = { message: trimmed };
    try {
      ws.send(JSON.stringify(payload));
      console.info("[broadcast-ws-service] chat sent", {
        text: trimmed,
        readyState: readyStateLabel(ws.readyState),
      });
      this.errorRef = null;
      this.diagnosticRef = `송신 성공 후 응답 대기 중: ${trimmed.slice(0, 40)}${trimmed.length > 40 ? "…" : ""}`;
      this.clearResponseTimer();
      this.responseTimerRef = setTimeout(() => {
        console.warn("[broadcast-ws-service] response timeout", {
          text: trimmed,
          wsReadyState: this.wsRef ? readyStateLabel(this.wsRef.readyState) : "NONE",
          pendingAudios: this.pendingAudiosRef.length,
        });
        this.diagnosticRef = `응답 대기 시간 초과: ${RESPONSE_TIMEOUT_MS / 1000}초 내 서버 응답 없음`;
        this.notifyStateChange();
      }, RESPONSE_TIMEOUT_MS);
      this.notifyStateChange();
      return { ok: true };
    } catch (e) {
      console.error("[broadcast-ws-service] send failed:", e);
      const reason = e instanceof Error ? e.message : "WebSocket send 실패";
      this.errorRef = reason;
      this.diagnosticRef = `송신 예외: ${reason}`;
      this.notifyStateChange();
      return { ok: false, reason };
    }
  }

  // ============================================================
  // TTS 관리
  // ============================================================

  private ensureAudioContext(): AudioContext | null {
    if (this.audioCtxRef && this.audioCtxRef.state !== "closed") {
      return this.audioCtxRef;
    }
    try {
      const Ctx: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      this.audioCtxRef = ctx;
      return ctx;
    } catch (e) {
      console.error("[broadcast-ws-service] AudioContext creation failed:", e);
      return null;
    }
  }

  private cleanupCurrentTTSSource() {
    if (this.currentSourceRef) {
      try {
        this.currentSourceRef.onended = null;
        this.currentSourceRef.disconnect();
      } catch {
        /* ignore */
      }
      this.currentSourceRef = null;
    }
    this.isPlayingTTSRef = false;
    this.notifyStateChange();
  }

  private syncTTSPlaybackState() {
    this.isPlayingTTSRef =
      this.isSchedulingTTSRef ||
      this.scheduledSourcesRef.size > 0 ||
      this.ttsQueueRef.length > 0;
    this.notifyStateChange();
  }

  private async decodeBlob(blob: Blob, ctx: AudioContext): Promise<AudioBuffer> {
    const arrayBuffer = await blob.arrayBuffer();
    return rawPcmToAudioBuffer(ctx, arrayBuffer);
  }

  private async scheduleTTSQueue() {
    if (this.isSchedulingTTSRef) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const generation = this.ttsGenerationRef;

    this.isSchedulingTTSRef = true;
    this.syncTTSPlaybackState();

    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      while (this.ttsQueueRef.length > 0) {
        const next = this.ttsQueueRef.shift();
        if (!next) break;
        if (generation !== this.ttsGenerationRef || next.generation !== generation) {
          continue;
        }

        const audioBuffer = await next.audioBufferPromise;
        if (generation !== this.ttsGenerationRef || next.generation !== generation) {
          continue;
        }
        if (!audioBuffer) {
          continue;
        }
        if (ctx.state === "closed") {
          break;
        }

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        this.currentSourceRef = source;
        this.scheduledSourcesRef.add(source);

        source.onended = () => {
          if (generation !== this.ttsGenerationRef) return;
          this.scheduledSourcesRef.delete(source);
          if (this.currentSourceRef === source) {
            this.currentSourceRef = null;
          }
          if (this.scheduledSourcesRef.size === 0 && this.ttsQueueRef.length === 0) {
            this.ttsNextStartTimeRef = 0;
          }
          try {
            source.disconnect();
          } catch {
            /* ignore */
          }
          this.syncTTSPlaybackState();
        };

        const when = Math.max(ctx.currentTime, this.ttsNextStartTimeRef);
        this.ttsNextStartTimeRef = when + audioBuffer.duration;
        source.start(when);
      }
    } catch (err) {
      if (generation === this.ttsGenerationRef) {
        console.warn("[broadcast-ws-service] TTS schedule failed:", err);
      }
    } finally {
      if (generation === this.ttsGenerationRef) {
        this.isSchedulingTTSRef = false;
        if (this.scheduledSourcesRef.size === 0 && this.ttsQueueRef.length === 0) {
          this.ttsNextStartTimeRef = 0;
        }
        this.syncTTSPlaybackState();

        if (this.ttsQueueRef.length > 0) {
          void this.scheduleTTSQueue();
        }
      }
    }
  }

  enqueueTTS(audio: Blob) {
    if (!useAIModeStore.getState().toggles.ttsEnabled) {
      return;
    }

    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    const generation = this.ttsGenerationRef;
    const audioBufferPromise = this.decodeBlob(audio, ctx).catch((err) => {
      console.warn("[broadcast-ws-service] TTS decode failed:", err);
      return null;
    });

    this.ttsQueueRef.push({ generation, audioBufferPromise });
    this.syncTTSPlaybackState();
    void this.scheduleTTSQueue();
  }

  private stopTTS() {
    this.ttsGenerationRef += 1;
    this.ttsQueueRef = [];
    this.isSchedulingTTSRef = false;
    this.ttsNextStartTimeRef = 0;

    for (const source of this.scheduledSourcesRef) {
      try {
        source.onended = null;
        source.stop();
      } catch {
        /* ignore */
      }
      try {
        source.disconnect();
      } catch {
        /* ignore */
      }
    }
    this.scheduledSourcesRef.clear();

    if (this.currentSourceRef) {
      try {
        this.currentSourceRef.stop();
      } catch {
        /* ignore */
      }
    }
    this.cleanupCurrentTTSSource();
    const ctx = this.audioCtxRef;
    if (ctx && ctx.state !== "closed") {
      ctx.close().catch(() => {
        /* ignore */
      });
    }
    this.audioCtxRef = null;
    this.notifyStateChange();
  }

  // ============================================================
  // 폴링 관리
  // ============================================================

  private async pollViewerChat() {
    if (this.pollingInFlightRef) return;
    this.pollingInFlightRef = true;

    try {
      const res = await getStreamInfo(Math.max(1, 30));
      const viewerItems = res.content.filter((item) => item.subject === "VIEWER");
      const latestKnownCursor = this.latestViewerCursorRef;
      const newViewerItems =
        latestKnownCursor == null
          ? []
          : viewerItems.filter((item) => item.cursorId > latestKnownCursor);

      if (viewerItems.length > 0) {
        this.latestViewerCursorRef = Math.max(
          latestKnownCursor ?? 0,
          ...viewerItems.map((item) => item.cursorId)
        );
      }

      if (newViewerItems.length > 0) {
        const adaptedDialogues = newViewerItems.map(adaptDialogue);
        useAIModeStore.getState().upsertDialogues(adaptedDialogues, null);
        this.callbacksRef.onViewerChat?.(adaptedDialogues);
      }
    } catch (err: unknown) {
      if (statusOf(err) === 404) {
        console.warn("[broadcast-ws-service] polling: broadcast not found");
        this.stopPolling();
        useAIModeStore.getState().clearBroadcast();
        return;
      }
      console.warn(
        "[broadcast-ws-service] polling failed:",
        err instanceof Error ? err.message : err
      );
    } finally {
      this.pollingInFlightRef = false;
    }
  }

  private startPolling() {
    if (this.pollingTimerRef) return;
    console.info("[broadcast-ws-service] polling started");
    this.latestViewerCursorRef = null;

    this.pollingTimerRef = setInterval(() => {
      void this.pollViewerChat();
    }, POLLING_INTERVAL_MS);
  }

  private stopPolling() {
    if (this.pollingTimerRef) {
      clearInterval(this.pollingTimerRef);
      this.pollingTimerRef = null;
      console.info("[broadcast-ws-service] polling stopped");
    }
  }
}

// ============================================================
// 싱글톤 인스턴스 내보내기
// ============================================================

export const broadcastWSBackgroundService = new BroadcastWSBackgroundService();
