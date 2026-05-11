/**
 * @file 방송 WebSocket 클라이언트 훅 — Faster Whisper STT 텍스트 송신 + LLM/TTS 응답 수신
 * @dependsOn src/shared/stores/aiModeStore.ts (broadcastStreamId)
 * @dependsOn src/shared/stores/authStore.ts (accessToken)
 * @dependsOn src/shared/types/broadcastWs.ts
 * @usedBy src/pages/DashboardPage.tsx
 *
 * Backend contract (SKU-SW/be 레포 분석 결과):
 *   - URL: ${VITE_WS_URL}/api/v1/stream/ws?broadcastStreamId=...&accessToken=...
 *   - FE → BE: { type: "CHAT", message: text } JSON 1 프레임
 *   - BE → FE: 항상 페어 도착
 *       1) Binary 프레임 (TTS 오디오 Blob)
 *       2) Text 프레임 ({ characterId, voiceText, broadcastDialogueCursorId })
 *     순서 server 측 synchronized 보장. FE 는 binary 를 큐에 쌓고 metadata 도착 시 페어링.
 *   - 에러: { error: "ERROR", message: "..." } text 후 server close.
 *   - Ping: 30초마다 server 가 보냄 → 브라우저 자동 Pong 응답 (FE 코드 불필요).
 *
 * 재연결 정책:
 *   - close code 1000 (normal), 1008 (policy) → 재연결 안 함 (인증 실패/방송 종료/정책 위반)
 *   - 그 외 (네트워크 단절 등) → 3초 후 자동 재연결
 *   - broadcastStreamId 또는 accessToken 이 사라지면(idle 전환/로그아웃) 즉시 close.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useAuthStore } from "@/shared/stores/authStore";
import type {
  StreamWsClientMessage,
  VoiceResponse,
} from "@/shared/types/broadcastWs";

const WS_PATH = "/api/v1/stream/ws";
const RECONNECT_DELAY_MS = 3000;
const RESPONSE_TIMEOUT_MS = 5000;

interface UseStreamWSOptions {
  /** 음성 + 메타데이터 페어 도착 시 호출 — dialogue 추가 + TTS 재생 트리거 용 */
  onVoiceResponse?: (response: VoiceResponse) => void;
  /** 서버 에러 frame 수신 시 호출 (사용자 알림 등) */
  onError?: (message: string) => void;
}

interface UseStreamWSReturn {
  isConnected: boolean;
  /** 마지막 서버 에러 메시지 (없으면 null) */
  error: string | null;
  /** 디버깅용 연결 상태 상세 정보 */
  diagnostic: string | null;
  /** 채팅(STT 텍스트) 송신. 실패 사유를 함께 반환. */
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
  /** binary 프레임 임시 보관 — metadata 도착 시 FIFO 로 페어링 */
  const pendingAudiosRef = useRef<Blob[]>([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 명시적 disconnect (모드/토큰 사라질 때) 시 자동 재연결 차단 */
  const shouldReconnectRef = useRef(true);
  /** cleanup 등 의도된 close 인지 추적 — dev StrictMode 가짜 에러 노이즈 제거용 */
  const intentionalCloseRef = useRef<WeakSet<WebSocket>>(new WeakSet());

  // 콜백을 ref 에 저장 — connect 가 매 렌더마다 재생성되지 않도록
  const onVoiceResponseRef = useRef(options.onVoiceResponse);
  const onErrorRef = useRef(options.onError);
  useEffect(() => {
    onVoiceResponseRef.current = options.onVoiceResponse;
  }, [options.onVoiceResponse]);
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

  // URL 빌드 — 둘 중 하나라도 없으면 null (즉 연결 안 함)
  const wsUrl = useMemo(() => {
    if (!accessToken || !broadcastStreamId) return null;
    const base = import.meta.env.VITE_WS_URL ?? "wss://dev.sku-sw.cloud";
    const params = new URLSearchParams({
      broadcastStreamId,
      accessToken,
    });
    return `${base}${WS_PATH}?${params.toString()}`;
  }, [accessToken, broadcastStreamId]);

  /** Text 프레임 처리: 에러 vs voice metadata 분기 + 페어링 */
  const handleTextFrame = useCallback((raw: string) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn("[stream-ws] non-JSON text frame ignored:", raw);
      return;
    }
    if (!parsed || typeof parsed !== "object") return;
    const obj = parsed as Record<string, unknown>;

    // 에러 frame: { error: "ERROR", message: "..." }
    if (obj.error === "ERROR" && typeof obj.message === "string") {
      clearResponseTimer();
      const msg = obj.message;
      setError(msg);
      onErrorRef.current?.(msg);

      const lowerMsg = msg.toLowerCase();
      if (
        lowerMsg.includes("broadcast") ||
        lowerMsg.includes("stream") ||
        lowerMsg.includes("방송")
      ) {
        // 서버가 진행 중 방송 없음/세션 불일치류 에러를 보낸 경우 stale local 상태를 정리한다.
        shouldReconnectRef.current = false;
        clearBroadcast();
      }
      return;
    }

    // 음성 메타데이터: { characterId, voiceText, broadcastDialogueCursorId }
    if (
      typeof obj.voiceText === "string" &&
      typeof obj.broadcastDialogueCursorId === "number"
    ) {
      // 가장 오래된 pending Blob 과 페어링 (FIFO)
      const audio = pendingAudiosRef.current.shift();
      if (!audio) {
        // 서버는 binary→text 순서 보장하므로 여기 도달하면 프레임 누락이거나 순서 어긋남
        console.warn(
          "[stream-ws] voice metadata received without preceding binary frame — server contract assumes binary-first"
        );
        return;
      }
      const response: VoiceResponse = {
        audio,
        voiceText: obj.voiceText,
        cursorId: obj.broadcastDialogueCursorId,
        characterId: typeof obj.characterId === "number" ? obj.characterId : 0,
      };
      clearResponseTimer();
      setDiagnostic(
        `음성 응답 수신: cursorId=${response.cursorId}, text=${response.voiceText.slice(0, 40)}${response.voiceText.length > 40 ? "…" : ""}`
      );
      onVoiceResponseRef.current?.(response);
      return;
    }

    console.warn("[stream-ws] unrecognized text frame:", obj);
  }, [clearBroadcast, clearResponseTimer]);

  /** WebSocket 연결 (close 후 재시도 시에도 동일 함수 호출) */
  const connect = useCallback(() => {
    if (!wsUrl) return;
    // 이미 살아있으면 중복 연결 방지
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
      if (wsRef.current !== ws) {
        console.debug("[stream-ws] stale onopen ignored");
        return;
      }
      opened = true;
      console.info("[stream-ws] connected");
      setIsConnected(true);
      setDiagnostic(`연결 성공: ${wsUrl}`);
    };

    ws.onmessage = (event: MessageEvent) => {
      if (wsRef.current !== ws) {
        console.debug("[stream-ws] stale onmessage ignored");
        return;
      }
      if (event.data instanceof Blob) {
        // 음성 frame — 페어 metadata 도착할 때까지 큐에 보관
        if (pendingAudiosRef.current.length >= 10) {
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
      if (wsRef.current !== ws) {
        console.debug("[stream-ws] stale onerror ignored");
        return;
      }
      if (intentionalCloseRef.current.has(ws)) {
        console.debug("[stream-ws] onerror ignored for intentional close");
        return;
      }
      clearResponseTimer();
      console.error("[stream-ws] error event");
      setError("WebSocket 통신 오류가 발생했습니다.");
      setDiagnostic(`error event 발생: ${wsUrl}`);
    };

    ws.onclose = (event: CloseEvent) => {
      if (wsRef.current !== ws) {
        console.debug("[stream-ws] stale onclose ignored");
        return;
      }
      console.info(
        `[stream-ws] closed (code=${event.code}, reason="${event.reason}")`
      );
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

      // 1000=normal, 1008=policy violation (인증/세션 교체/정책 등) → 재연결 안 함
      if (event.code === 1000 || event.code === 1008) {
        shouldReconnectRef.current = false;
        return;
      }

      // 브라우저는 WS handshake 401/403/404 를 code=1006 으로만 노출할 수 있다.
      // OPEN 되기 전 실패한 경우는 인증/방송 세션 불일치로 보고 재연결 루프를 중지한다.
      if (event.code === 1006 && !event.wasClean && !opened) {
        shouldReconnectRef.current = false;
        setError("방송 채널 연결에 실패했습니다. 진행 중 방송이 없거나 인증이 만료되었을 수 있습니다.");
        setDiagnostic("연결 중단: WebSocket handshake 실패로 재연결을 중지했습니다.");
        clearBroadcast();
        return;
      }

      // 그 외 (1006 등 비정상 단절) → 3초 후 재연결
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
        /* ignore */
      }
    }
  }, [clearResponseTimer]);

  // wsUrl 변화에 따라 connect/disconnect
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

  const sendChat = useCallback((text: string): { ok: boolean; reason?: string } => {
    const ws = wsRef.current;
    if (!ws) {
      const reason = "소켓 인스턴스가 없습니다.";
      console.warn("[stream-ws] sendChat called but socket missing");
      setError(reason);
      setDiagnostic(`송신 실패: ${reason}`);
      return { ok: false, reason };
    }
    if (ws.readyState !== WebSocket.OPEN) {
      const reason = `소켓 상태가 OPEN이 아닙니다 (${readyStateLabel(ws.readyState)}).`;
      console.warn("[stream-ws] sendChat called but not OPEN", ws.readyState);
      setError(reason);
      setDiagnostic(`송신 실패: ${reason}`);
      return { ok: false, reason };
    }
    const trimmed = text.trim();
    if (!trimmed) {
      return { ok: false, reason: "전송할 텍스트가 비어 있습니다." };
    }

    const payload: StreamWsClientMessage = { type: "CHAT", message: trimmed };
    try {
      ws.send(JSON.stringify(payload));
      clearResponseTimer();
      responseTimerRef.current = setTimeout(() => {
        setDiagnostic(`응답 대기 시간 초과: ${RESPONSE_TIMEOUT_MS / 1000}초 내 서버 응답 없음`);
      }, RESPONSE_TIMEOUT_MS);
      setError(null);
      setDiagnostic(`송신 성공 후 응답 대기 중: ${trimmed.slice(0, 40)}${trimmed.length > 40 ? "…" : ""}`);
      return { ok: true };
    } catch (e) {
      console.error("[stream-ws] send failed:", e);
      const reason = e instanceof Error ? e.message : "WebSocket send 실패";
      setError(reason);
      setDiagnostic(`송신 예외: ${reason}`);
      return { ok: false, reason };
    }
  }, [clearResponseTimer]);

  return { isConnected, error, diagnostic, sendChat };
}
