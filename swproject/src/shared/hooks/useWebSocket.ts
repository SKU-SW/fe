'use client';

import { useEffect, useRef, useCallback } from 'react';

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

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      onOpenRef.current?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: T = JSON.parse(event.data as string);
        onMessageRef.current(data);
      } catch {
        // JSON 파싱 실패 시 무시
      }
    };

    ws.onclose = () => {
      onCloseRef.current?.();
      // 3초 후 재연결
      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled) connect();
      }, 3000);
    };

    ws.onerror = (event: Event) => {
      onErrorRef.current?.(event);
    };
  }, [url, enabled]); // 콜백 제거 — ref로 최신값 참조

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
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

  return { sendMessage, disconnect };
}
