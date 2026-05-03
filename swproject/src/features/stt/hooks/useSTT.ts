/**
 * @file 실제 마이크 입력 기반 STT 훅
 * @dependsOn 브라우저 SpeechRecognition API
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useCallback, useEffect, useState } from "react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";

interface UseSTTReturn {
  isListening: boolean;
  currentTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  pushDebugTranscript: (text: string) => Promise<void>;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0?: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = {
  results: Iterable<SpeechRecognitionResultLike>;
};

type SpeechRecognitionErrorEventLike = {
  error: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function useSTT(): UseSTTReturn {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTranscript = useAIModeStore((s) => s.currentTranscript);
  const setCurrentTranscript = useAIModeStore((s) => s.setCurrentTranscript);
  const [recognition, setRecognition] = useState<SpeechRecognitionLike | null>(null);
  const isSupported = typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!isSupported) {
      setError("이 환경에서는 브라우저 음성인식을 지원하지 않습니다.");
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    const instance = new Recognition() as SpeechRecognitionLike;
    instance.lang = "ko-KR";
    instance.continuous = true;
    instance.interimResults = true;

    instance.onresult = (event: SpeechRecognitionEventLike) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setCurrentTranscript(transcript);
    };

    instance.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === "not-allowed") {
        setError("마이크 권한이 거부되었습니다. 시스템 설정에서 마이크 권한을 허용해주세요.");
      } else {
        setError(`음성인식 오류: ${event.error}`);
      }
      setIsListening(false);
    };

    instance.onend = () => {
      setIsListening(false);
    };

    setRecognition(instance);

    return () => {
      instance.onresult = null;
      instance.onerror = null;
      instance.onend = null;
      instance.stop();
    };
  }, [isSupported, setCurrentTranscript]);

  const startListening = useCallback(async () => {
    if (!recognition) {
      setError("음성인식 초기화에 실패했습니다.");
      return;
    }
    setError(null);
    setCurrentTranscript("");
    recognition.start();
    setIsListening(true);
  }, [recognition, setCurrentTranscript]);

  const stopListening = useCallback(async () => {
    recognition?.stop();
    if (currentTranscript === "") {
      setCurrentTranscript("");
    }
    setIsListening(false);
  }, [recognition, currentTranscript, setCurrentTranscript]);

  const pushDebugTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setCurrentTranscript(text.trim());
  }, [setCurrentTranscript]);

  useEffect(() => {
    return () => {
      if (isListening) {
        recognition?.stop();
        setIsListening(false);
      }
    };
  }, [isListening, recognition]);

  return {
    isListening,
    currentTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    pushDebugTranscript,
  };
}
