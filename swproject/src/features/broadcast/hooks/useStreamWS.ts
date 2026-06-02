/**
 * @file 방송 WebSocket 상태/송신 thin wrapper 훅
 * @dependsOn src/services/broadcastWSBackgroundService.ts
 * @dependsOn src/features/broadcast/hooks/useBroadcastWSState.ts
 * @usedBy legacy callers that still import useStreamWS
 *
 * 주의:
 *   실제 WebSocket 연결 생명주기와 기본 응답 처리는
 *   `broadcastWSBackgroundService` 가 전역 상주 형태로 담당한다.
 *   이 훅은 resident 서비스 상태를 React에서 읽고, 필요 시 화면 전용 callback만 붙이는 얇은 브리지다.
 */

import { useEffect } from "react";
import { broadcastWSBackgroundService } from "@/services/broadcastWSBackgroundService";
import { useBroadcastWSState } from "./useBroadcastWSState";
import type { StreamWsErrorCode, VoiceChunk, VoiceTurnComplete } from "@/shared/types/broadcastWs";
import type { StreamEmotion } from "@/shared/types/stream";

interface UseStreamWSOptions {
  onVoiceChunk?: (chunk: VoiceChunk) => void;
  onVoiceTurnComplete?: (turn: VoiceTurnComplete) => void;
  onEmotionChange?: (emotion: StreamEmotion) => void;
  onError?: (message: string, code?: StreamWsErrorCode) => void;
}

interface UseStreamWSReturn {
  isConnected: boolean;
  error: string | null;
  diagnostic: string | null;
  sendChat: (text: string) => { ok: boolean; reason?: string };
}

export function useStreamWS(options: UseStreamWSOptions = {}): UseStreamWSReturn {
  const state = useBroadcastWSState();

  useEffect(() => {
    const callbackKeys: Array<keyof UseStreamWSOptions> = [];
    const callbacks = {
      onVoiceChunk: options.onVoiceChunk,
      onVoiceTurnComplete: options.onVoiceTurnComplete,
      onEmotionChange: options.onEmotionChange,
      onError: options.onError,
    };

    (Object.keys(callbacks) as Array<keyof typeof callbacks>).forEach((key) => {
      if (callbacks[key]) {
        callbackKeys.push(key);
      }
    });

    if (callbackKeys.length > 0) {
      broadcastWSBackgroundService.registerCallbacks(callbacks);
    }

    return () => {
      if (callbackKeys.length > 0) {
        broadcastWSBackgroundService.unregisterCallbacks(callbackKeys);
      }
    };
  }, [options.onEmotionChange, options.onError, options.onVoiceChunk, options.onVoiceTurnComplete]);

  return {
    isConnected: state.isConnected,
    error: state.error,
    diagnostic: state.diagnostic,
    sendChat: (text: string) => broadcastWSBackgroundService.sendChat(text),
  };
}
