/**
 * @file 방송 WebSocket 클라이언트 훅 — STT 텍스트 송신 + LLM/TTS 응답 수신
 * @dependsOn src/shared/stores/aiModeStore.ts (broadcastStreamId)
 * @dependsOn src/shared/stores/authStore.ts (accessToken)
 * @dependsOn src/shared/types/broadcastWs.ts
 * @usedBy src/pages/DashboardPage.tsx
 *
 * Notion WS 스펙(2026-04):
 *   - URL: ${VITE_WS_URL}/api/v1/stream/ws?broadcastStreamId=...&accessToken=...
 *   - FE → BE (text JSON): { "message": "..." }
 *   - BE → FE: text JSON 또는 binary(raw PCM) + text JSON 페어
 *       · VOICE_EMOTION         : 감정 단독 (오디오 없음)
 *       · VOICE_CHUNK           : TTS 청크 — 직전 binary 와 페어
 *       · VOICE_TURN_COMPLETE   : 턴 종료 (오디오 없음, 누적 voiceText + cursorId)
 *   - 에러 (text): { "error": "ERROR", "message": "..." } → 서버 close
 *
 * 재연결: code 1000/1008 → 중지, OPEN 전 1006(handshake 실패) → 중지, 그 외 3초 재시도.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useAuthStore } from "@/shared/stores/authStore";
import type {
  StreamWsClientMessage,
  StreamWsErrorCode,
  StreamWsVoiceEvent,
  VoiceChunk,
  VoiceTurnComplete,
} from "@/shared/types/broadcastWs";
import type { StreamEmotion } from "@/shared/types/stream";

const WS_PATH = "/api/v1/stream/ws";
const RECONNECT_DELAY_MS = 3000;
const RESPONSE_TIMEOUT_MS = 5000;

interface UseStreamWSOptions {
  /** TTS 청크 도착 (binary + VOICE_CHUNK 페어) — 재생 + 부분 자막 갱신 */
  onVoiceChunk?: (chunk: VoiceChunk) => void;
  /** 턴 종료 — dialogue 확정 (cursorId, 누적 voiceText) */
  onVoiceTurnComplete?: (turn: VoiceTurnComplete) => void;
  /** 감정 단독 변경 알림 (VOICE_EMOTION) */
  onEmotionChange?: (emotion: StreamEmotion) => void;
  /** 서버 에러 frame 수신 시 호출. code 가 없는 레거시 frame 도 있을 수 있음. */
  onError?: (message: string, code?: StreamWsErrorCode) => void;
}

interface UseStreamWSReturn {
  isConnected: boolean;
  error: string | null;
  diagnostic: string | null;
  /** 채팅(STT 텍스트) 송신. */
  sendChat: (text: string) => { ok: boolean; reason?: string };
}

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

export function useStreamWS(options: UseStreamWSOptions = {}): UseStreamWSReturn {
  const accessToken = useAuthStore((s) => s.accessToken);
  const broadcastStreamId = useAIModeStore((s) => s.broadcastStreamId);
  const clearBroadcast = useAIModeStore((s) => s.clearBroadcast);

  const wsRef = useRef<WebSocket | null>(null);
  /** binary 프레임 임시 보관 — VOICE_CHUNK 도착 시 FIFO 로 페어링 */
  const pendingAudiosRef = useRef<Blob[]>([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const intentionalCloseRef = useRef<WeakSet<WebSocket>>(new WeakSet());

  const onVoiceChunkRef = useRef(options.onVoiceChunk);
  const onVoiceTurnCompleteRef = useRef(options.onVoiceTurnComplete);
  const onEmotionChangeRef = useRef(options.onEmotionChange);
  const onErrorRef = useRef(options.onError);
  useEffect(() => {
    onVoiceChunkRef.current = options.onVoiceChunk;
  }, [options.onVoiceChunk]);
  useEffect(() => {
    onVoiceTurnCompleteRef.current = options.onVoiceTurnComplete;
  }, [options.onVoiceTurnComplete]);
  useEffect(() => {
    onEmotionChangeRef.current = options.onEmotionChange;
  }, [options.onEmotionChange]);
  useEffect(() => {
    onErrorRef.current = options.onError;
  }, [options.onError]);

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  const clearResponseTimer = useCallback(() => {
    if (responseTimerRef.current) {
      clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }
  }, []);

  const wsUrl = useMemo(() => {
    if (!accessToken || !broadcastStreamId) return null;
    const base = import.meta.env.VITE_WS_URL ?? "wss://dev.sku-sw.cloud";
    const params = new URLSearchParams({
      broadcastStreamId,
      accessToken,
    });
    return `${base}${WS_PATH}?${params.toString()}`;
  }, [accessToken, broadcastStreamId]);

  /** Text 프레임 처리 — eventType 분기 + 페어링 */
  const handleTextFrame = useCallback(
    (raw: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        console.warn("[stream-ws] non-JSON text frame ignored:", raw);
        return;
      }
      if (!parsed || typeof parsed !== "object") return;
      const obj = parsed as Record<string, unknown>;

      // 에러 frame
      if (obj.error === "ERROR" && typeof obj.message === "string") {
        clearResponseTimer();
        const msg = obj.message;
        const code =
          typeof obj.code === "string" ? (obj.code as StreamWsErrorCode) : undefined;
        setError(code ? `[${code}] ${msg}` : msg);
        onErrorRef.current?.(msg, code);

        // 코드별 재연결 정책 — 노션 공통 에러 코드 기준
        // UNAUTHORIZED/FORBIDDEN/NOT_FOUND: 인증/리소스 문제 → 재연결 무의미
        // CONFLICT/INVALID_REQUEST: 요청 자체 문제 → 재시도해도 같음
        // INTERNAL_SERVER_ERROR: BE 일시 장애 → 기본 재연결 허용
        if (
          code === "UNAUTHORIZED" ||
          code === "FORBIDDEN" ||
          code === "NOT_FOUND" ||
          code === "CONFLICT" ||
          code === "INVALID_REQUEST"
        ) {
          shouldReconnectRef.current = false;
          if (code === "UNAUTHORIZED" || code === "FORBIDDEN" || code === "NOT_FOUND") {
            clearBroadcast();
          }
          return;
        }

        // 레거시 폴백 — code 가 없을 때 message 키워드로 방송 종료 판단
        if (!code) {
          const lowerMsg = msg.toLowerCase();
          if (
            lowerMsg.includes("broadcast") ||
            lowerMsg.includes("stream") ||
            lowerMsg.includes("방송")
          ) {
            shouldReconnectRef.current = false;
            clearBroadcast();
          }
        }
        return;
      }

      const evt = obj as unknown as StreamWsVoiceEvent;
      switch (evt.eventType) {
        case "VOICE_EMOTION": {
          clearResponseTimer();
          setDiagnostic(`감정 변경: ${evt.emotion}`);
          onEmotionChangeRef.current?.(evt.emotion);
          return;
        }
        case "VOICE_CHUNK": {
          // 직전 binary 와 페어
          const audio = pendingAudiosRef.current.shift();
          if (!audio) {
            console.warn(
              "[stream-ws] VOICE_CHUNK received without preceding binary frame"
            );
            return;
          }
          clearResponseTimer();
          // voiceText 는 null 가능 — 자막 누적 시 빈 문자열로 표시
          const previewText = evt.voiceText ?? "";
          setDiagnostic(
            `청크 수신: emotion=${evt.emotion}, text="${previewText.slice(0, 30)}${previewText.length > 30 ? "…" : ""}"`
          );
          onVoiceChunkRef.current?.({
            audio,
            voiceText: evt.voiceText,
            emotion: evt.emotion,
          });
          return;
        }
        case "VOICE_TURN_COMPLETE": {
          clearResponseTimer();
          setDiagnostic(
            `턴 종료: cursorId=${evt.broadcastDialogueCursorId}, text="${evt.voiceText.slice(0, 30)}${evt.voiceText.length > 30 ? "…" : ""}"`
          );
          onVoiceTurnCompleteRef.current?.({
            voiceText: evt.voiceText,
            emotion: evt.emotion,
            cursorId: evt.broadcastDialogueCursorId,
          });
          return;
        }
        default:
          console.warn("[stream-ws] unrecognized text frame:", obj);
      }
    },
    [clearBroadcast, clearResponseTimer]
  );

  const connect = useCallback(() => {
    if (!wsUrl) return;
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;

    setError(null);
    setDiagnostic(`연결 시도: ${wsUrl}`);
    pendingAudiosRef.current = [];
    clearResponseTimer();

    const ws = new WebSocket(wsUrl);
    ws.binaryType = "blob";
    wsRef.current = ws;
    let opened = false;

    ws.onopen = () => {
      if (wsRef.current !== ws) return;
      opened = true;
      console.info("[stream-ws] connected");
      setIsConnected(true);
      setDiagnostic(`연결 성공: ${wsUrl}`);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (wsRef.current !== ws) return;
      if (event.data instanceof Blob) {
        if (pendingAudiosRef.current.length >= 50) {
          console.warn("[stream-ws] pending audio queue full — dropping oldest frame");
          pendingAudiosRef.current.shift();
        }
        pendingAudiosRef.current.push(event.data);
        clearResponseTimer();
        setDiagnostic(
          `오디오 바이너리 수신: pending=${pendingAudiosRef.current.length}, size=${event.data.size}B`
        );
        return;
      }
      if (typeof event.data === "string") {
        handleTextFrame(event.data);
      }
    };

    ws.onerror = () => {
      if (wsRef.current !== ws) return;
      if (intentionalCloseRef.current.has(ws)) return;
      clearResponseTimer();
      console.error("[stream-ws] error event");
      setError("WebSocket 통신 오류가 발생했습니다.");
      setDiagnostic(`error event 발생: ${wsUrl}`);
    };

    ws.onclose = (event: CloseEvent) => {
      if (wsRef.current !== ws) return;
      console.info(`[stream-ws] closed (code=${event.code}, reason="${event.reason}")`);
      clearResponseTimer();
      setIsConnected(false);
      wsRef.current = null;
      const wasIntentional = intentionalCloseRef.current.has(ws);
      intentionalCloseRef.current.delete(ws);

      if (wasIntentional) {
        setDiagnostic("연결 정리됨: 클라이언트 cleanup");
        return;
      }
      setDiagnostic(
        `연결 종료: code=${event.code}, reason=${event.reason || "(없음)"}, wasClean=${String(event.wasClean)}`
      );

      if (!shouldReconnectRef.current) return;

      if (event.code === 1000 || event.code === 1008) {
        shouldReconnectRef.current = false;
        return;
      }

      if (event.code === 1006 && !event.wasClean && !opened) {
        shouldReconnectRef.current = false;
        setError(
          "방송 채널 연결에 실패했습니다. 진행 중 방송이 없거나 인증이 만료되었을 수 있습니다."
        );
        setDiagnostic("연결 중단: WebSocket handshake 실패로 재연결을 중지했습니다.");
        clearBroadcast();
        return;
      }

      reconnectTimerRef.current = setTimeout(() => {
        if (shouldReconnectRef.current) connect();
      }, RECONNECT_DELAY_MS);
    };
  }, [clearBroadcast, clearResponseTimer, wsUrl, handleTextFrame]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    clearResponseTimer();
    const ws = wsRef.current;
    if (wsRef.current === ws) {
      wsRef.current = null;
    }
    pendingAudiosRef.current = [];
    setIsConnected(false);
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      intentionalCloseRef.current.add(ws);
      try {
        ws.close(1000, "Client disconnect");
      } catch {
        intentionalCloseRef.current.delete(ws);
      }
    }
  }, [clearResponseTimer]);

  useEffect(() => {
    if (!wsUrl) {
      setDiagnostic(
        !accessToken
          ? "연결 대기: accessToken 없음"
          : !broadcastStreamId
            ? "연결 대기: broadcastStreamId 없음"
            : "연결 대기: wsUrl 없음"
      );
      disconnect();
      return;
    }
    shouldReconnectRef.current = true;
    connect();
    return () => {
      disconnect();
    };
  }, [accessToken, broadcastStreamId, wsUrl, connect, disconnect]);

  const sendChat = useCallback(
    (text: string): { ok: boolean; reason?: string } => {
      const ws = wsRef.current;
      if (!ws) {
        const reason = "소켓 인스턴스가 없습니다.";
        setError(reason);
        setDiagnostic(`송신 실패: ${reason}`);
        return { ok: false, reason };
      }
      if (ws.readyState !== WebSocket.OPEN) {
        const reason = `소켓 상태가 OPEN이 아닙니다 (${readyStateLabel(ws.readyState)}).`;
        setError(reason);
        setDiagnostic(`송신 실패: ${reason}`);
        return { ok: false, reason };
      }
      const trimmed = text.trim();
      if (!trimmed) {
        return { ok: false, reason: "전송할 텍스트가 비어 있습니다." };
      }

      // Notion 스펙: { "message": "..." } — type 필드 없음.
      const payload: StreamWsClientMessage = { message: trimmed };
      try {
        ws.send(JSON.stringify(payload));
        clearResponseTimer();
        responseTimerRef.current = setTimeout(() => {
          setDiagnostic(
            `응답 대기 시간 초과: ${RESPONSE_TIMEOUT_MS / 1000}초 내 서버 응답 없음`
          );
        }, RESPONSE_TIMEOUT_MS);
        setError(null);
        setDiagnostic(
          `송신 성공 후 응답 대기 중: ${trimmed.slice(0, 40)}${trimmed.length > 40 ? "…" : ""}`
        );
        return { ok: true };
      } catch (e) {
        console.error("[stream-ws] send failed:", e);
        const reason = e instanceof Error ? e.message : "WebSocket send 실패";
        setError(reason);
        setDiagnostic(`송신 예외: ${reason}`);
        return { ok: false, reason };
      }
    },
    [clearResponseTimer]
  );

  return { isConnected, error, diagnostic, sendChat };
}
