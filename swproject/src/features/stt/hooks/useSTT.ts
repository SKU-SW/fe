/**
 * @file 실제 마이크 입력 기반 STT 훅 (Faster Whisper 사이드카 호출)
 * @dependsOn src/services/sttBackgroundService.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @dependsOn src/shared/stores/sttStore.ts
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useEffect } from "react";
import { sttBackgroundService } from "@/services/sttBackgroundService";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useSTTStore } from "@/shared/stores/sttStore";

interface UseSTTReturn {
  isListening: boolean;
  currentTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  cancelListening: () => Promise<void>;
  pushDebugTranscript: (text: string) => Promise<void>;
}

interface UseSTTOptions {
  onFinalTranscript?: (text: string) => Promise<void> | void;
}

export function useSTT(options: UseSTTOptions = {}): UseSTTReturn {
  const isListening = useSTTStore((s) => s.isListening);
  const isSupported = useSTTStore((s) => s.isSupported);
  const error = useSTTStore((s) => s.error);
  const currentTranscript = useAIModeStore((s) => s.currentTranscript);

  useEffect(() => {
    if (!options.onFinalTranscript) return;
    return sttBackgroundService.subscribeFinalTranscript(options.onFinalTranscript);
  }, [options.onFinalTranscript]);

  return {
    isListening,
    currentTranscript,
    isSupported,
    error,
    startListening: () => sttBackgroundService.startListening(),
    stopListening: () => sttBackgroundService.stopListening(),
    cancelListening: () => sttBackgroundService.cancelListening(),
    pushDebugTranscript: (text: string) => sttBackgroundService.pushDebugTranscript(text),
  };
}
