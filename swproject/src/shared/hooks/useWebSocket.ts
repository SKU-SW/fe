/**
 * @file WebSocket 연결 관리 커스텀 훅
 * @created Sprint 2 - Dashboard Main
 * @dependsOn react
 * @usedBy src/features/hooks
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface UseWebSocketOptions<T> {
  url: string;
  onMessage: (data: T) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  sendMessage: (data: unknown) => void;
  disconnect: () => void;
  isConnected: boolean;
}

export function useWebSocket<T>({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  enabled = true,
}: UseWebSocketOptions<T>): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);

  // 콜백을 ref에 저장하여 매 렌더마다 connect가 재생성되는 것을 방지
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onOpenRef.current = onOpen; }, [onOpen]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    shouldReconnectRef.current = true;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      onOpenRef.current?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: T = JSON.parse(event.data as string);
        onMessageRef.current(data);
      } catch (parseError) {
        // JSON 파싱 실패 시 에러 콜백 호출
        onErrorRef.current?.(new Event('message-parse-error'));
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      onCloseRef.current?.();
      // shouldReconnectRef가 true일 때만 재연결
      if (!shouldReconnectRef.current || !enabled) return;
      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled) connect();
      }, 3000);
    };

    ws.onerror = (event: Event) => {
      onErrorRef.current?.(event);
    };
  }, [url, enabled]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { sendMessage, disconnect, isConnected };
}
