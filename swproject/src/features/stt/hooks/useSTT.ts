/**
 * @file 실제 마이크 입력 기반 STT 훅 (Faster Whisper 사이드카 호출)
 * @dependsOn 브라우저 MediaRecorder API
 * @dependsOn window.electronAPI.stt.transcribe (Electron preload → main → python3 stt_server.py)
 * @dependsOn src/shared/stores/aiModeStore.ts (currentTranscript 저장)
 * @usedBy src/pages/DashboardPage.tsx
 *
 * 구조:
 *   1) startListening: 마이크 권한 받고 MediaRecorder.start() — chunk 들은 ref 에 누적
 *   2) stopListening:
 *      - recorder.stop() 은 dataavailable + stop 이벤트를 비동기로 발사하므로
 *        Promise 로 onstop 까지 await 한 뒤 chunksRef.current 를 읽음
 *      - 누적 chunk 를 Blob → ArrayBuffer 로 만들어 Electron IPC 로 전달
 *      - Faster Whisper 결과 텍스트를 store.currentTranscript 에 저장
 *      - onFinalTranscript 콜백이 있으면 최종 텍스트를 즉시 후속 파이프라인(예: LLM WS)으로 전달
 *
 * @bugfix 2026-05-06 chunks 를 React state 로 관리하던 이전 구현은
 *   stop() 직후 동기적으로 state 를 읽어 항상 빈 배열로 판정 → "녹음된 음성이 없습니다"
 *   에러로 IPC 호출에 도달하지 못함. ref + onstop Promise 패턴으로 교체.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";

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
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentTranscript = useAIModeStore((s) => s.currentTranscript);
  const setCurrentTranscript = useAIModeStore((s) => s.setCurrentTranscript);

  // ref 사용 이유: setState 비동기성을 우회해 onstop 직후 즉시 chunk 를 읽기 위함
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isStoppingRef = useRef(false);
  const sessionIdRef = useRef(0);
  const onFinalTranscriptRef = useRef(options.onFinalTranscript);

  useEffect(() => {
    onFinalTranscriptRef.current = options.onFinalTranscript;
  }, [options.onFinalTranscript]);

  const hasElectronSTTBridge =
    typeof window !== "undefined" &&
    typeof window.electronAPI?.stt?.transcribe === "function";

  const isSupported =
    hasElectronSTTBridge &&
    !!navigator.mediaDevices &&
    typeof MediaRecorder !== "undefined";

  useEffect(() => {
    if (!isSupported) {
      if (!hasElectronSTTBridge) {
        setError("Electron STT 브리지를 찾을 수 없습니다. Electron 앱으로 실행 중인지 확인해주세요.");
        return;
      }
      setError("이 환경에서는 로컬 마이크 녹음을 지원하지 않습니다.");
    }
  }, [hasElectronSTTBridge, isSupported]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError("이 환경에서는 로컬 마이크 녹음을 지원하지 않습니다.");
      return;
    }
    // 이미 녹음 중이면 무시 (이중 시작 방지)
    if (mediaRecorderRef.current) return;

    setError(null);
    setCurrentTranscript("");
    chunksRef.current = [];

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(mediaStream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("로컬 마이크 녹음 중 오류가 발생했습니다.");
        setIsListening(false);
      };

      recorder.start();
      sessionIdRef.current += 1;
      streamRef.current = mediaStream;
      mediaRecorderRef.current = recorder;
      setIsListening(true);
      void window.electronAPI.stt.start().catch((err: unknown) => {
        console.warn("[stt] failed to notify main process about start:", err);
      });
    } catch (err: unknown) {
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("마이크 권한이 거부되었습니다. 시스템 설정에서 앱의 마이크 권한을 허용해주세요.");
          return;
        }
        if (err.name === "NotFoundError") {
          setError("사용 가능한 마이크가 없습니다. 장치 연결 상태를 확인해주세요.");
          return;
        }
        if (err.name === "NotReadableError") {
          setError("마이크를 다른 앱이 사용 중이거나 읽을 수 없습니다.");
          return;
        }
      }
      setError(err instanceof Error ? err.message : "음성인식을 시작하지 못했습니다.");
    }
  }, [isSupported, setCurrentTranscript]);

  const cancelListening = useCallback(async () => {
    sessionIdRef.current += 1;
    const recorder = mediaRecorderRef.current;
    const stream = streamRef.current;

    if (recorder && recorder.state !== "inactive") {
      await new Promise<void>((resolve) => {
        const onStopOnce = () => {
          recorder.onstop = null;
          resolve();
        };
        recorder.onstop = onStopOnce;
        try {
          recorder.stop();
        } catch {
          onStopOnce();
        }
      });
    }

    stream?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    chunksRef.current = [];
    setIsListening(false);
    setCurrentTranscript("");
    setError(null);
    await window.electronAPI?.stt?.stop?.().catch((err: unknown) => {
      console.warn("[stt] failed to notify main process about cancel:", err);
    });
  }, [setCurrentTranscript]);

  const stopListening = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    const recorder = mediaRecorderRef.current;
    const stream = streamRef.current;
    if (!recorder || !stream) {
      setIsListening(false);
      isStoppingRef.current = false;
      return;
    }

    const mimeType = recorder.mimeType || "audio/webm";

    // recorder.stop() 은 dataavailable + stop 이벤트를 다음 task 에서 발사하므로
    // onstop 콜백을 Promise 로 감싸 마지막 chunk 까지 ref 에 누적된 뒤 진행한다.
    await new Promise<void>((resolve) => {
      const onStopOnce = () => {
        recorder.onstop = null;
        resolve();
      };
      recorder.onstop = onStopOnce;
      try {
        recorder.stop();
      } catch {
        // 이미 inactive 상태일 가능성 — 즉시 resolve
        onStopOnce();
      }
    });

    stream.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    setIsListening(false);

    const collected = chunksRef.current;
    chunksRef.current = [];

    if (collected.length === 0) {
      setError("녹음된 음성이 없습니다. 다시 시도해주세요.");
      return;
    }

    setCurrentTranscript("음성을 로컬 모델로 변환 중...");
    const activeSessionId = sessionIdRef.current;
    try {
      const transcribe = window.electronAPI?.stt?.transcribe;
      if (typeof transcribe !== "function") {
        setError("Electron STT 브리지를 찾을 수 없습니다. Electron 앱을 다시 실행해주세요.");
        setCurrentTranscript("");
        return;
      }

      const audioBlob = new Blob(collected, { type: mimeType });
      const audioBuffer = await audioBlob.arrayBuffer();
      const response = await transcribe(audioBuffer, mimeType);
      if (activeSessionId !== sessionIdRef.current) {
        return;
      }
      if (!response.ok) {
        setError(response.error ?? "로컬 STT 변환에 실패했습니다.");
        setCurrentTranscript("");
        return;
      }
      const finalText = response.text?.trim() ?? "";
      if (!finalText) {
        setError("음성이 인식되지 않았습니다. 조금 더 길게 말한 뒤 다시 시도해주세요.");
        setCurrentTranscript("");
        return;
      }
      setError(null);
      setCurrentTranscript(finalText);
      await onFinalTranscriptRef.current?.(finalText);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로컬 STT 변환 중 예기치 않은 오류가 발생했습니다.");
    } finally {
      isStoppingRef.current = false;
      void window.electronAPI?.stt?.stop?.().catch((err: unknown) => {
        console.warn("[stt] failed to notify main process about stop:", err);
      });
    }
  }, [setCurrentTranscript]);

  const pushDebugTranscript = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setError(null);
      setCurrentTranscript(trimmed);
      try {
        await onFinalTranscriptRef.current?.(trimmed);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "텍스트 전송에 실패했습니다.");
      }
    },
    [setCurrentTranscript]
  );

  // 언마운트 시 진행 중이던 녹음 정리
  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          /* ignore */
        }
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
      streamRef.current = null;
      chunksRef.current = [];
    };
  }, []);

  return {
    isListening,
    currentTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    cancelListening,
    pushDebugTranscript,
  };
}
