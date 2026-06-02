/**
 * @file TTS 오디오 재생 큐 훅 — WebAudio 기반 raw PCM / 컨테이너 듀얼 디코드
 * @deprecated Phase 2 완료: TTS 재생 로직이 broadcastWSBackgroundService로 이동됨.
 *             대신 broadcastWSBackgroundService.enqueueTTS(blob)를 직접 호출하거나,
 *             useBroadcastWSState()의 isPlayingTTS 상태를 구독하세요.
 *             본 훅은 backwards compatibility를 위해 유지되며, 더 이상 사용되지 않습니다.
 * @dependsOn 없음 (브라우저 WebAudio API)
 * @usedBy (deprecated — 더 이상 사용되지 않음)
 *
 * 동작:
 *   - enqueue(blob) 호출 시 큐에 적재
 *   - 재생 중이 아니면 즉시 재생, 재생 중이면 끝난 후 다음 항목 자동 재생
 *   - enabled=false 면 enqueue 가 즉시 무시
 *   - stop() 으로 큐 비우고 현재 재생 중지
 *
 * 디코드 전략 (노션 스펙: binary 는 "raw PCM"):
 *   1) AudioContext.decodeAudioData 로 먼저 시도 — MP3/Opus/WAV 같은 컨테이너면 통과
 *   2) 실패 시 raw PCM 으로 간주: 16-bit signed little-endian, mono, sampleRate=PCM_SAMPLE_RATE
 *      → Int16 → Float32 변환 → AudioBuffer 생성 → 재생
 *   3) 둘 다 실패 시 onerror 로 다음 항목 진행
 *
 * Raw PCM 파라미터:
 *   - sampleRate: 환경변수 VITE_TTS_PCM_SAMPLE_RATE (기본 24000Hz)
 *   - bitDepth: 16-bit signed little-endian (TTS 표준)
 *   - channels: mono (1)
 *   BE 가 다른 파라미터로 보내면 환경변수로 조정.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const PCM_SAMPLE_RATE = Number(
  import.meta.env.VITE_TTS_PCM_SAMPLE_RATE ?? 24000
);
const PCM_CHANNELS = 1;

interface UseTTSPlayerOptions {
  onEvent?: (message: string) => void;
}

interface UseTTSPlayerReturn {
  /** Blob 을 큐에 추가 — enabled=false 면 무시 */
  enqueue: (audio: Blob) => void;
  /** 현재 재생 중지 + 큐 비우기 */
  stop: () => void;
  /** 현재 TTS 재생 여부 */
  isPlaying: boolean;
}

/**
 * raw 16-bit signed little-endian PCM ArrayBuffer 를 AudioBuffer 로 변환.
 * - 짝수 바이트(샘플 단위) 보장. 홀수면 마지막 1바이트 무시.
 */
function rawPcmToAudioBuffer(
  ctx: AudioContext,
  buffer: ArrayBuffer
): AudioBuffer {
  const view = new DataView(buffer);
  const sampleCount = Math.floor(buffer.byteLength / 2);
  const audioBuffer = ctx.createBuffer(
    PCM_CHANNELS,
    sampleCount,
    PCM_SAMPLE_RATE
  );
  const channel = audioBuffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    const sample = view.getInt16(i * 2, /* littleEndian */ true);
    // Int16 → Float32 [-1, 1)
    channel[i] = sample < 0 ? sample / 0x8000 : sample / 0x7fff;
  }
  return audioBuffer;
}

export function useTTSPlayer(
  enabled: boolean,
  options: UseTTSPlayerOptions = {}
): UseTTSPlayerReturn {
  const queueRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isPlayingRef = useRef(false);
  const onEventRef = useRef(options.onEvent);
  const enabledRef = useRef(enabled);
  const [isPlaying, setIsPlaying] = useState(false);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(() => {
    onEventRef.current = options.onEvent;
  }, [options.onEvent]);

  const ensureContext = useCallback((): AudioContext | null => {
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      return audioCtxRef.current;
    }
    try {
      const Ctx: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      return ctx;
    } catch (e) {
      console.error("[tts] AudioContext 생성 실패:", e);
      onEventRef.current?.(
        `AudioContext 생성 실패: ${e instanceof Error ? e.message : "알 수 없는 오류"}`
      );
      return null;
    }
  }, []);

  const cleanupCurrent = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.onended = null;
        currentSourceRef.current.disconnect();
      } catch {
        /* ignore */
      }
      currentSourceRef.current = null;
    }
    isPlayingRef.current = false;
  }, []);

  const decodeBlob = useCallback(
    async (blob: Blob, ctx: AudioContext): Promise<AudioBuffer> => {
      const arrayBuffer = await blob.arrayBuffer();
      // 1) 컨테이너 포맷 우선 시도 (MP3/Opus/WAV 등)
      try {
        // decodeAudioData 는 buffer 를 detach 할 수 있으므로 복사본 사용
        return await ctx.decodeAudioData(arrayBuffer.slice(0));
      } catch {
        // 2) raw PCM 폴백 — 노션 스펙 기본 경로
        return rawPcmToAudioBuffer(ctx, arrayBuffer);
      }
    },
    []
  );

  const playNext = useCallback(() => {
    if (isPlayingRef.current) return;
    if (!enabledRef.current) return;

    const next = queueRef.current.shift();
    if (!next) return;

    const ctx = ensureContext();
    if (!ctx) return;

    isPlayingRef.current = true;
    setIsPlaying(true);
    onEventRef.current?.("TTS 재생 시도 중...");

    // suspend 상태면 resume (자동재생 정책 우회)
    const resume =
      ctx.state === "suspended" ? ctx.resume() : Promise.resolve();

    resume
      .then(() => decodeBlob(next, ctx))
      .then((audioBuffer) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        currentSourceRef.current = source;
        source.onended = () => {
          onEventRef.current?.("TTS 재생 완료");
          cleanupCurrent();
          if (queueRef.current.length === 0) {
            setIsPlaying(false);
          }
          playNext();
        };
        source.start();
      })
      .catch((err) => {
        console.warn("[tts] decode/play 실패:", err);
        onEventRef.current?.(
          `TTS 디코드/재생 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
        );
        cleanupCurrent();
        if (queueRef.current.length === 0) {
          setIsPlaying(false);
        }
        playNext();
      });
  }, [cleanupCurrent, decodeBlob, ensureContext]);

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
    const hadPlayback =
      !!currentSourceRef.current || queueRef.current.length > 0;
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        /* ignore: already stopped */
      }
    }
    cleanupCurrent();
    queueRef.current = [];
    setIsPlaying(false);
    if (hadPlayback) {
      onEventRef.current?.("TTS 정지 및 큐 비움");
    }
  }, [cleanupCurrent]);

  // unmount 시 정리 — AudioContext 는 close
  useEffect(() => {
    return () => {
      stop();
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {
          /* ignore */
        });
      }
      audioCtxRef.current = null;
    };
  }, [stop]);

  return { enqueue, stop, isPlaying };
}
