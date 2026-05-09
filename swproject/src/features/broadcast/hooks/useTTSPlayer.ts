/**
 * @file TTS 오디오 재생 큐 훅
 * @dependsOn 없음 (브라우저 Audio API 만 사용)
 * @usedBy src/pages/DashboardPage.tsx
 *
 * 동작:
 *   - enqueue(blob) 호출 시 큐에 적재
 *   - 재생 중이 아니면 즉시 재생, 재생 중이면 끝난 후 다음 항목 자동 재생
 *   - enabled=false 면 enqueue 가 즉시 무시 (사용자가 TTS 토글 OFF)
 *   - stop() 으로 큐 비우고 현재 재생 중지 (예: 방송 종료 시)
 *
 * 비고:
 *   - 백엔드는 binary frame 으로 raw 오디오 bytes 를 보냄. 포맷(MP3/Opus 등) 은 명시 안 됨.
 *   - 브라우저의 <audio> 가 자동 인식 가능한 표준 포맷으로 가정 (참고 클라이언트 동작 동일).
 *   - 인식 못 하면 onerror 발생 → 다음 항목으로 넘어감 (큐 멈추지 않음).
 */

import { useCallback, useEffect, useRef } from "react";

interface UseTTSPlayerOptions {
  onEvent?: (message: string) => void;
}

interface UseTTSPlayerReturn {
  /** Blob 을 큐에 추가 — enabled=false 면 무시 */
  enqueue: (audio: Blob) => void;
  /** 현재 재생 중지 + 큐 비우기 */
  stop: () => void;
}

export function useTTSPlayer(
  enabled: boolean,
  options: UseTTSPlayerOptions = {}
): UseTTSPlayerReturn {
  const queueRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const isPlayingRef = useRef(false);
  const onEventRef = useRef(options.onEvent);
  // enabled 를 ref 에 동기화 — playNext 가 재귀 호출되면서 최신 값 보게
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    onEventRef.current = options.onEvent;
  }, [options.onEvent]);

  const cleanupCurrent = useCallback(() => {
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
    audioRef.current = null;
    isPlayingRef.current = false;
  }, []);

  const playNext = useCallback(() => {
    if (isPlayingRef.current) return;
    if (!enabledRef.current) return;

    const next = queueRef.current.shift();
    if (!next) return;

    isPlayingRef.current = true;
    const url = URL.createObjectURL(next);
    currentUrlRef.current = url;
    const audio = new Audio(url);
    audioRef.current = audio;
    onEventRef.current?.("TTS 재생 시도 중...");

    audio.onended = () => {
      onEventRef.current?.("TTS 재생 완료");
      cleanupCurrent();
      playNext();
    };
    audio.onerror = () => {
      console.warn("[tts] audio decode/play failed, skipping to next");
      onEventRef.current?.("TTS 오디오 디코드/재생 실패");
      cleanupCurrent();
      playNext();
    };

    void audio.play().catch((err) => {
      // 자동재생 정책 거부 등
      console.warn("[tts] play() rejected:", err);
      onEventRef.current?.(
        `TTS play() 거부: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
      );
      cleanupCurrent();
      playNext();
    });
  }, [cleanupCurrent]);

  const enqueue = useCallback(
    (audio: Blob) => {
      if (!enabledRef.current) {
        console.debug("[tts] disabled, dropping audio Blob");
        onEventRef.current?.("TTS 비활성화 상태라 오디오를 버렸습니다");
        return;
      }
      queueRef.current.push(audio);
      onEventRef.current?.(`TTS 큐 적재: ${queueRef.current.length}개 대기 중`);
      playNext();
    },
    [playNext]
  );

  const stop = useCallback(() => {
    const hadPlayback = !!audioRef.current || queueRef.current.length > 0;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch {
        /* ignore */
      }
    }
    cleanupCurrent();
    queueRef.current = [];
    if (hadPlayback) {
      onEventRef.current?.("TTS 정지 및 큐 비움");
    }
  }, [cleanupCurrent]);

  // unmount 시 정리
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { enqueue, stop };
}
