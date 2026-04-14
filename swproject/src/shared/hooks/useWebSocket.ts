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

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      onOpen?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: T = JSON.parse(event.data as string);
        onMessage(data);
      } catch {
        // JSON 파싱 실패 시 무시
      }
    };

    ws.onclose = () => {
      onClose?.();
      // 3초 후 재연결
      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled) connect();
      }, 3000);
    };

    ws.onerror = (event: Event) => {
      onError?.(event);
    };
  }, [url, onMessage, onOpen, onClose, onError, enabled]);

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
