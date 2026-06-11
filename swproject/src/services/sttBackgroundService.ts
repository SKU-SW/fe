/**
 * @file 전역 상주형 STT 서비스
 * @dependsOn window.electronAPI.stt.*
 * @dependsOn src/shared/stores/sttStore.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @dependsOn src/shared/stores/alarmStore.ts
 * @usedBy src/components/AppInitializer.tsx, src/features/stt/hooks/useSTT.ts
 */

import { useAlarmStore } from "@/shared/stores/alarmStore";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useSTTStore } from "@/shared/stores/sttStore";
import { broadcastWSBackgroundService } from "@/services/broadcastWSBackgroundService";

type FinalTranscriptHandler = (text: string) => Promise<void> | void;

const TRANSCRIBE_TIMEOUT_MS = 30_000;

class STTBackgroundService {
  private initialized = false;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private isStopping = false;
  private pendingStart = false;
  private pendingCancelAfterStart = false;
  private sessionId = 0;
  private finalTranscriptHandlers = new Set<FinalTranscriptHandler>();
  private unsubscribeGlobalPtt: (() => void) | null = null;
  private unsubscribeStatus: (() => void) | null = null;

  private get hasElectronSTTBridge() {
    return typeof window !== "undefined" && typeof window.electronAPI?.stt?.transcribe === "function";
  }

  private get isSupported() {
    return this.hasElectronSTTBridge && !!navigator.mediaDevices && typeof MediaRecorder !== "undefined";
  }

  init() {
    if (this.initialized) {
      console.info('[ptt][service] init skipped (already initialized)');
      this.syncSupportState();
      return;
    }

    this.initialized = true;
    console.info('[ptt][service] init');
    this.syncSupportState();

    const onGlobalPtt = window.electronAPI?.stt?.onGlobalPtt;
    if (typeof onGlobalPtt === "function") {
      // 검증된 이벤트 체인:
      // Electron main `stt:global-ptt` → preload `onGlobalPtt` → 여기서 start/stop 분기.
      // 실제 로그에서 CharacterPage 등 대시보드 외 화면에서도 이 경로가 정상 동작했다.
      this.unsubscribeGlobalPtt = onGlobalPtt((payload) => {
        console.info('[ptt][service] global event', payload, {
          sttEnabled: useAIModeStore.getState().toggles.sttEnabled,
          isListening: useSTTStore.getState().isListening,
          isBusy: useSTTStore.getState().isBusy,
        });
        if (!useAIModeStore.getState().toggles.sttEnabled) return;

        if (payload.type === "start") {
          void this.startListening();
          return;
        }

        void this.stopListening();
      });
    }

    // STT 데몬 상태 구독: ready 면 에러 해제, fatal 이면 안내 표시(설치 유도).
    const onStatus = window.electronAPI?.stt?.onStatus;
    if (typeof onStatus === "function") {
      this.unsubscribeStatus = onStatus((payload) => {
        const { setError } = useSTTStore.getState();
        if (payload.state === "ready") {
          setError(null);
        } else if (payload.state === "fatal") {
          setError(payload.error ?? "로컬 STT 데몬을 시작할 수 없습니다.");
        }
        // restarting 은 retrySTT() 에서 이미 에러를 지운 상태이므로 유지
      });
    }
  }

  dispose() {
    this.unsubscribeGlobalPtt?.();
    this.unsubscribeGlobalPtt = null;
    this.unsubscribeStatus?.();
    this.unsubscribeStatus = null;
    void this.cancelListening();
    useSTTStore.getState().reset();
    this.initialized = false;
  }

  /** 의존성 설치 후 "다시 시도": STT 데몬을 재스폰하고 기존 에러를 지운다. */
  async retrySTT() {
    const { setError } = useSTTStore.getState();
    const retry = window.electronAPI?.stt?.retry;
    if (typeof retry !== "function") {
      setError("Electron STT 브리지를 찾을 수 없습니다. Electron 앱을 다시 실행해주세요.");
      return;
    }
    setError(null);
    try {
      await retry();
    } catch {
      setError("STT 데몬 재시작에 실패했습니다.");
    }
  }

  subscribeFinalTranscript(handler: FinalTranscriptHandler): () => void {
    this.finalTranscriptHandlers.add(handler);
    return () => {
      this.finalTranscriptHandlers.delete(handler);
    };
  }

  private async notifyFinalTranscript(text: string) {
    for (const handler of this.finalTranscriptHandlers) {
      await handler(text);
    }
  }

  private syncSupportState() {
    const { setError, setIsSupported } = useSTTStore.getState();
    setIsSupported(this.isSupported);
    console.info('[ptt][service] support state', {
      hasElectronBridge: this.hasElectronSTTBridge,
      mediaDevices: !!navigator.mediaDevices,
      mediaRecorder: typeof MediaRecorder !== 'undefined',
      isSupported: this.isSupported,
    });

    if (!this.isSupported) {
      if (!this.hasElectronSTTBridge) {
        setError("Electron STT 브리지를 찾을 수 없습니다. Electron 앱으로 실행 중인지 확인해주세요.");
        useAlarmStore.getState().push("stt.start_failed");
        return;
      }
      setError("이 환경에서는 로컬 마이크 녹음을 지원하지 않습니다.");
      useAlarmStore.getState().push("stt.start_failed");
      return;
    }

    setError(null);
  }

  async startListening() {
    const { setError, setIsBusy, setIsListening } = useSTTStore.getState();
    const setCurrentTranscript = useAIModeStore.getState().setCurrentTranscript;

    console.info('[ptt][service] startListening called', {
      isSupported: this.isSupported,
      sttEnabled: useAIModeStore.getState().toggles.sttEnabled,
      hasRecorder: !!this.mediaRecorder,
      isBusy: useSTTStore.getState().isBusy,
      pendingStart: this.pendingStart,
    });

    this.syncSupportState();
    if (!this.isSupported) return;
    if (!useAIModeStore.getState().toggles.sttEnabled) return;

    // 중복 start 방지:
    // - isBusy: 이전 stop/transcribe가 아직 끝나지 않음
    // - pendingStart: getUserMedia/MediaRecorder 생성 중
    // - mediaRecorder: 이미 녹음 중
    if (useSTTStore.getState().isBusy) return;
    if (this.pendingStart) return;
    if (this.mediaRecorder) return;

    const interruptResult = broadcastWSBackgroundService.interruptCurrentResponse("STREAMER_SPEECH_START");
    if (interruptResult.ok) {
      console.info("[ptt][service] AI response interrupt requested", {
        turnNumber: interruptResult.turnNumber,
      });
    }

    setError(null);
    setIsBusy(false);
    setCurrentTranscript("");
    this.chunks = [];
    this.pendingStart = true;
    this.pendingCancelAfterStart = false;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(mediaStream, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      recorder.onerror = () => {
        useSTTStore.getState().setError("로컬 마이크 녹음 중 오류가 발생했습니다.");
        useSTTStore.getState().setIsListening(false);
      };

      recorder.start();
      this.sessionId += 1;
      this.mediaStream = mediaStream;
      this.mediaRecorder = recorder;
      setIsListening(true);
      this.pendingStart = false;
      console.info('[ptt][service] recorder started');

      // 사용자가 very short tap을 하면 start 직후 stop이 먼저 들어올 수 있다.
      // 이 경우 실제 런타임에서 `cancel after late recorder start`로 정상 회수되는 것을 확인했다.
      if (this.pendingCancelAfterStart) {
        console.info('[ptt][service] cancel after late recorder start');
        this.pendingCancelAfterStart = false;
        await this.cancelListening();
        return;
      }

      void window.electronAPI?.stt?.start?.().catch((err: unknown) => {
        console.warn("[stt] failed to notify main process about start:", err);
      });
    } catch (err: unknown) {
      this.pendingStart = false;
      this.pendingCancelAfterStart = false;
      console.error('[ptt][service] startListening failed', err);
      if (err instanceof DOMException) {
        if (err.name === "NotAllowedError") {
          setError("마이크 권한이 거부되었습니다. 시스템 설정에서 앱의 마이크 권한을 허용해주세요.");
          useAlarmStore.getState().push("stt.permission_denied");
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
      useAlarmStore.getState().push("stt.start_failed");
    }
  }

  async cancelListening() {
    if (this.pendingStart && !this.mediaRecorder) {
      this.pendingCancelAfterStart = true;
      return;
    }

    this.sessionId += 1;
    const recorder = this.mediaRecorder;
    const stream = this.mediaStream;

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
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.chunks = [];
    this.pendingStart = false;
    this.pendingCancelAfterStart = false;
    useSTTStore.getState().setIsListening(false);
    useSTTStore.getState().setIsBusy(false);
    useSTTStore.getState().setError(null);
    useAIModeStore.getState().setCurrentTranscript("");

    await window.electronAPI?.stt?.stop?.().catch((err: unknown) => {
      console.warn("[stt] failed to notify main process about cancel:", err);
    });
  }

  async stopListening() {
    console.info('[ptt][service] stopListening called', {
      isStopping: this.isStopping,
      hasRecorder: !!this.mediaRecorder,
      hasStream: !!this.mediaStream,
      pendingStart: this.pendingStart,
      isBusy: useSTTStore.getState().isBusy,
    });
    if (this.isStopping) return;

    // getUserMedia가 끝나기 전 STOP이 먼저 오면 즉시 실패시키지 않고
    // recorder 생성 직후 cancel하도록 예약한다. 짧은 탭/빠른 release 보호용.
    if (this.pendingStart && !this.mediaRecorder) {
      this.pendingCancelAfterStart = true;
      return;
    }

    this.isStopping = true;

    const recorder = this.mediaRecorder;
    const stream = this.mediaStream;
    if (!recorder || !stream) {
      // 녹음기가 이미 정리된 상태에서 STOP만 늦게 들어오면 transcribe 단계로 갈 수 없으므로
      // 여기서 busy/listening/stopping 플래그를 모두 복구해 다음 PTT를 막지 않게 한다.
      useSTTStore.getState().setIsListening(false);
      useSTTStore.getState().setIsBusy(false);
      this.isStopping = false;
      return;
    }

    useSTTStore.getState().setIsBusy(true);

    const mimeType = recorder.mimeType || "audio/webm";

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

    stream.getTracks().forEach((track) => track.stop());
    this.mediaRecorder = null;
    this.mediaStream = null;
    this.pendingStart = false;
    this.pendingCancelAfterStart = false;
    useSTTStore.getState().setIsListening(false);

    const collected = this.chunks;
    this.chunks = [];

    if (collected.length === 0) {
      console.warn('[ptt][service] no collected audio chunks');
      useSTTStore.getState().setError("녹음된 음성이 없습니다. 다시 시도해주세요.");
      useSTTStore.getState().setIsBusy(false);
      this.isStopping = false;
      return;
    }

    useAIModeStore.getState().setCurrentTranscript("음성을 로컬 모델로 변환 중...");
    const activeSessionId = this.sessionId;

    try {
      const transcribe = window.electronAPI?.stt?.transcribe;
      if (typeof transcribe !== "function") {
        useSTTStore.getState().setError("Electron STT 브리지를 찾을 수 없습니다. Electron 앱을 다시 실행해주세요.");
        useAIModeStore.getState().setCurrentTranscript("");
        return;
      }

      const audioBlob = new Blob(collected, { type: mimeType });
      const audioBuffer = await audioBlob.arrayBuffer();
      console.info('[ptt][service] transcribe request', {
        chunkCount: collected.length,
        mimeType,
        bytes: audioBuffer.byteLength,
      });
      // renderer 쪽에서도 timeout을 둬 python/main 어디에서 멈추더라도
      // isStopping / isBusy가 영구 고착되지 않게 한다.
      const response = await Promise.race([
        transcribe(audioBuffer, mimeType),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(new Error(`로컬 STT 응답이 ${TRANSCRIBE_TIMEOUT_MS / 1000}초 내에 오지 않았습니다.`));
          }, TRANSCRIBE_TIMEOUT_MS);
        }),
      ]);

      if (activeSessionId !== this.sessionId) return;

      if (!response.ok) {
        useSTTStore.getState().setError(response.error ?? "로컬 STT 변환에 실패했습니다.");
        useAIModeStore.getState().setCurrentTranscript("");
        return;
      }

      const finalText = response.text?.trim() ?? "";
      console.info('[ptt][service] transcribe response', {
        ok: response.ok,
        finalText,
      });
      // very short tap처럼 오디오가 너무 짧으면 ok=true 이면서 빈 문자열이 올 수 있다.
      // 실제 검증에서 bytes≈2KB일 때 빈 transcript가 확인되었고, 이는 사용자 재시도 안내로 처리한다.
      if (!finalText) {
        useSTTStore.getState().setError("음성이 인식되지 않았습니다. 조금 더 길게 말한 뒤 다시 시도해주세요.");
        useAIModeStore.getState().setCurrentTranscript("");
        return;
      }

      useSTTStore.getState().setError(null);
      useAIModeStore.getState().setCurrentTranscript(finalText);
      await this.notifyFinalTranscript(finalText);
    } catch (err: unknown) {
      console.error('[ptt][service] stopListening failed', err);
      useSTTStore.getState().setError(
        err instanceof Error ? err.message : "로컬 STT 변환 중 예기치 않은 오류가 발생했습니다."
      );
    } finally {
      this.isStopping = false;
      useSTTStore.getState().setIsBusy(false);
      void window.electronAPI?.stt?.stop?.().catch((err: unknown) => {
        console.warn("[stt] failed to notify main process about stop:", err);
      });
    }
  }

  async pushDebugTranscript(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    useSTTStore.getState().setError(null);
    useAIModeStore.getState().setCurrentTranscript(trimmed);

    try {
      await this.notifyFinalTranscript(trimmed);
    } catch (err: unknown) {
      useSTTStore.getState().setError(err instanceof Error ? err.message : "텍스트 전송에 실패했습니다.");
    }
  }
}

export const sttBackgroundService = new STTBackgroundService();
