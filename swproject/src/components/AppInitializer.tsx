/**
 * @file 앱 전역 런타임 초기화 컴포넌트
 * @dependsOn src/services/sttBackgroundService.ts
 * @dependsOn src/services/broadcastWSBackgroundService.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @dependsOn src/shared/stores/characterStore.ts
 * @dependsOn src/shared/stores/overlayStore.ts
 * @dependsOn src/shared/stores/alarmStore.ts
 * @usedBy src/main.tsx
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBroadcastWSState, useStreamInfo } from "@/features/broadcast/hooks";
import { useCharacter } from "@/features/character/hooks/useCharacter";
import { containsTriggerWord, normalizeTriggerWords } from "@/features/character/lib/triggerWords";
import { sttBackgroundService } from "@/services/sttBackgroundService";
import { broadcastWSBackgroundService } from "@/services/broadcastWSBackgroundService";
import { useInAppPtt } from "@/features/stt/hooks";
import { buildEmotionImageMap } from "@/shared/lib/characterEmotionImages";
import { resolveVrmRuntime } from "@/shared/lib/vrmRuntime";
import { useAlarmStore } from "@/shared/stores/alarmStore";
import { useCharacterAppearanceStore } from "@/shared/stores/characterAppearanceStore";
import { useCharacterSettingsStore } from "@/shared/stores/characterSettingsStore";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useCharacterStore } from "@/shared/stores/characterStore";
import { useOverlayStore } from "@/shared/stores/overlayStore";
import { BroadcastQuitConfirmModal } from "@/components/BroadcastQuitConfirmModal";

const STREAMING_AI_DIALOGUE_ID = "streaming-ai-pending";

// 호출어 매칭 후 이 시간 동안 들어오는 STT 발화는 호출어 없이도 통과시킨다.
// 매 발화마다 카운트가 갱신되며, 침묵이 길어지면 세션이 만료되어 다시 호출어가 필요해진다.
const ACTIVATION_TIMEOUT_MS = 30_000;

export default function AppInitializer() {
  // 인앱 PTT 폴백: 앱 창 포커스 시엔 손쉬운 사용 권한 없이도 단축키로 STT 트리거.
  useInAppPtt();

  const sttEnabled = useAIModeStore((s) => s.toggles.sttEnabled);
  const lipSyncEnabled = useAIModeStore((s) => s.toggles.lipSyncEnabled);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const { character } = useCharacter(selectedCharacterId);
  const currentTranscript = useAIModeStore((s) => s.currentTranscript);
  const currentEmotion = useAIModeStore((s) => s.currentEmotion);
  const isBroadcasting = useAIModeStore((s) => s.mode === "broadcasting");
  const updateOverlayRuntime = useOverlayStore((s) => s.updateRuntime);
  const { isConnected, error: wsError, isPlayingTTS, mouthOpen, visemeWeights } = useBroadcastWSState();
  const pushAlarm = useAlarmStore((s) => s.push);
  const { characterInfo } = useStreamInfo({ size: 1 });
  const characterSettings = useCharacterSettingsStore((s) => s.settings);
  const appearance = useCharacterAppearanceStore((s) =>
    characterInfo?.characterId
      ? s.getAppearance(characterInfo.characterId)
      : character?.characterId
        ? s.getAppearance(character.characterId)
        : undefined
  );
  const prevWsConnectedRef = useRef<boolean | null>(null);
  const prevWsErrorRef = useRef<string | null>(null);
  const [quitConfirmOpen, setQuitConfirmOpen] = useState(false);
  const [networkDisconnectOpen, setNetworkDisconnectOpen] = useState(false);

  // Electron main 이 방송 중 창 닫기를 시도하면 모달을 연다.
  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI?.broadcast?.onConfirmQuit) return;
    const unsubscribe = window.electronAPI.broadcast.onConfirmQuit(() => {
      setQuitConfirmOpen(true);
    });
    return unsubscribe;
  }, []);

  // 방송 중 페이지 새로고침/이탈 방지 (안전망 — Electron 단축키 차단을 보완)
  useEffect(() => {
    if (!isBroadcasting) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "방송이 진행 중입니다. 페이지를 벗어나면 방송이 종료됩니다.";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isBroadcasting]);

  const handleQuitConfirm = useCallback(() => {
    setQuitConfirmOpen(false);
    window.electronAPI?.broadcast?.confirmQuit();
  }, []);

  const handleQuitCancel = useCallback(() => {
    setQuitConfirmOpen(false);
    window.electronAPI?.broadcast?.cancelQuit();
  }, []);

  const handleNetworkDisconnectTerminate = useCallback(async () => {
    setNetworkDisconnectOpen(false);
    try {
      const { terminateBroadcast } = await import("@/features/broadcast/api/broadcastApi");
      await terminateBroadcast();
      useAIModeStore.getState().clearBroadcast();
    } catch {
      // terminate 패해도 로컬 상태는 정리
      useAIModeStore.getState().clearBroadcast();
    }
  }, []);

  const handleNetworkDisconnectKeepWaiting = useCallback(() => {
    setNetworkDisconnectOpen(false);
  }, []);
  const lastActiveAtRef = useRef<number | null>(null);

  const resolvedVrmRuntime = resolveVrmRuntime({
    appearance,
    character,
    broadcastCharacter: characterInfo,
    settings: characterSettings,
  });

  const overlayCharacterName = characterInfo?.characterName ?? character?.characterName ?? "AI";
  const overlayCharacterImageUrl = resolvedVrmRuntime.characterImageUrl;
  const overlayCharacterVrmUrl = resolvedVrmRuntime.vrmUrl;
  const overlayCharacterVrmThumbnailUrl = resolvedVrmRuntime.vrmThumbnailUrl;
  const effectiveOverlayModelType = resolvedVrmRuntime.modelType;
  const overlayEmotionImageMap =
    effectiveOverlayModelType === "2D" ? buildEmotionImageMap(overlayCharacterImageUrl) : {};
  const activeTriggerWords = useMemo(
    () => normalizeTriggerWords([
      ...(character?.triggerWords ?? []),
      ...(characterInfo?.triggerWords ?? []),
    ]),
    [character?.triggerWords, characterInfo?.triggerWords],
  );

  const handleFinalTranscript = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!useAIModeStore.getState().toggles.sttEnabled) {
      throw new Error("음성인식이 꺼져 있습니다. 토글을 다시 켜주세요.");
    }

    const { mode, broadcastStreamId } = useAIModeStore.getState();
    if (mode !== "broadcasting" || !broadcastStreamId) {
      useAIModeStore.getState().addActivityLog({
        id: `stt-skip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "system",
        message: "방송 채널이 활성화되지 않아 음성 전송을 건너뜁니다.",
        timestamp: new Date(),
        level: "warning",
      });
      return;
    }

    const now = Date.now();
    const hasTriggerWord = containsTriggerWord(trimmed, activeTriggerWords);
    const lastActiveAt = lastActiveAtRef.current;
    const isActiveSession =
      lastActiveAt !== null && now - lastActiveAt < ACTIVATION_TIMEOUT_MS;

    if (!hasTriggerWord && !isActiveSession) {
      if (import.meta.env.DEV) {
        console.info("[AppInitializer] trigger word required (session inactive)", {
          transcript: trimmed,
          activeTriggerWords,
          lastActiveAt,
          msSinceLastActive: lastActiveAt !== null ? now - lastActiveAt : null,
        });
      }
      useAIModeStore.getState().addActivityLog({
        id: `stt-callword-skip-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "system",
        message: activeTriggerWords.length > 0
          ? `호출어(${activeTriggerWords.join(", ")})로 다시 깨워주세요.`
          : "호출어 정보가 없어 음성 전송을 건너뜁니다.",
        timestamp: new Date(),
        level: "info",
      });
      return;
    }

    // 활성 세션 갱신 — 다음 발화까지의 타임아웃 카운트가 여기서부터 다시 시작된다.
    lastActiveAtRef.current = now;

    if (import.meta.env.DEV) {
      console.info("[AppInitializer] transcript accepted", {
        transcript: trimmed,
        via: hasTriggerWord ? "trigger-word" : "active-session",
        msSinceLastActive: lastActiveAt !== null ? now - lastActiveAt : null,
      });
    }

    // 2단계 resident 경로:
    // global PTT → STT 완료 → 여기서 WS 전송 + optimistic streamer dialogue 추가.
    // 백엔드 계약은 그대로 두고, 페이지 언마운트와 무관하게 프론트 런타임만 상주화한다.
    useAIModeStore.getState().addActivityLog({
      id: `stt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "system",
      message: `STT 인식: ${trimmed}`,
      timestamp: new Date(),
      level: "info",
    });

    if (broadcastWSBackgroundService.isAwaitingInterrupt()) {
      const bufferResult = broadcastWSBackgroundService.bufferStreamerText(trimmed);
      if (!bufferResult.ok) {
        throw new Error(bufferResult.reason ?? "AI 응답 중단 처리 중 발화를 버퍼링하지 못했습니다.");
      }

      useAIModeStore.getState().addActivityLog({
        id: `interrupt-buffer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "system",
        message: "AI 응답 중단 완료 후 발화를 전송하도록 대기 중입니다.",
        timestamp: new Date(),
        level: "info",
      });
      return;
    }

    const sendResult = broadcastWSBackgroundService.sendChat(trimmed);
    if (!sendResult.ok) {
      useAIModeStore.getState().addActivityLog({
        id: `stt-send-fail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "system",
        message: sendResult.reason ?? "LLM 전송에 실패했습니다. 잠시 후 다시 시도해주세요.",
        timestamp: new Date(),
        level: "warning",
      });
      return;
    }

    useAIModeStore.getState().upsertDialogues(
      [
        {
          id: `local-streamer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          cursorId: null,
          speaker: "streamer",
          subject: "STREAMER",
          text: trimmed,
          emotion: "DEFAULT",
          timestamp: new Date().toISOString(),
        },
      ],
      null
    );
  }, [activeTriggerWords]);

  useEffect(() => {
    console.info('[app-init] init start', {
      hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI,
      hasGlobalPtt: typeof window !== 'undefined' && typeof window.electronAPI?.stt?.onGlobalPtt === 'function',
      hasTranscribe: typeof window !== 'undefined' && typeof window.electronAPI?.stt?.transcribe === 'function',
    });
    // 앱 전체에서 STT/PTT를 페이지 비의존적으로 동작시키기 위한 전역 초기화 지점.
    // Dashboard 전용 훅/이벤트에 묶지 않고 main/preload에서 넘어오는 PTT를 여기서 한 번만 구독한다.
    broadcastWSBackgroundService.init();
    sttBackgroundService.init();

    broadcastWSBackgroundService.registerCallbacks({
      onVoiceChunk: ({ voiceText, emotion }) => {
        const safeText = voiceText ?? "";
        const prev = useAIModeStore.getState().currentTranscript;
        const next = prev ? `${prev}${safeText}` : safeText;
        useAIModeStore.getState().setCurrentTranscript(next);
        useAIModeStore.getState().setEmotion(emotion);

        const existing = useAIModeStore.getState().dialogues.find((item) => item.id === STREAMING_AI_DIALOGUE_ID);
        const nextText = `${existing?.text ?? ""}${safeText}`;
        if (nextText.length > 0) {
          useAIModeStore.getState().upsertDialogues(
            [
              {
                id: STREAMING_AI_DIALOGUE_ID,
                cursorId: null,
                speaker: "ai",
                subject: "AI_CHARACTER",
                text: nextText,
                emotion,
                timestamp: new Date().toISOString(),
              },
            ],
            null
          );
        }
      },
      onVoiceTurnComplete: ({ voiceText, emotion, cursorId }) => {
        useAIModeStore.getState().removeDialogue(STREAMING_AI_DIALOGUE_ID);
        useAIModeStore.getState().upsertDialogues(
          [
            {
              id: String(cursorId),
              cursorId,
              speaker: "ai",
              subject: "AI_CHARACTER",
              text: voiceText,
              emotion,
              timestamp: new Date().toISOString(),
            },
          ],
          cursorId
        );
        useAIModeStore.getState().setEmotion(emotion);
        useAIModeStore.getState().setCurrentTranscript(voiceText);
      },
      onEmotionChange: (emotion) => {
        useAIModeStore.getState().setEmotion(emotion);
      },
      onVoiceInterrupted: ({ voiceText, emotion, cursorId }) => {
        useAIModeStore.getState().removeDialogue(STREAMING_AI_DIALOGUE_ID);
        useAIModeStore.getState().upsertDialogues(
          [
            {
              id: String(cursorId),
              cursorId,
              speaker: "ai",
              subject: "AI_CHARACTER",
              text: voiceText,
              emotion,
              timestamp: new Date().toISOString(),
            },
          ],
          cursorId
        );
        useAIModeStore.getState().setEmotion(emotion);
        useAIModeStore.getState().setCurrentTranscript(voiceText);
        useAIModeStore.getState().addActivityLog({
          id: `voice-interrupted-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: "system",
          message: "AI 응답 중단됨",
          timestamp: new Date(),
          level: "info",
        });
      },
      onBufferedStreamerTextFlushed: (text) => {
        useAIModeStore.getState().upsertDialogues(
          [
            {
              id: `local-streamer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              cursorId: null,
              speaker: "streamer",
              subject: "STREAMER",
              text,
              emotion: "DEFAULT",
              timestamp: new Date().toISOString(),
            },
          ],
          null
        );
      },
      onError: (message, code) => {
        console.error("[broadcast-ws-service] server error:", code ? `[${code}]` : "", message);
      },
      onProlongedDisconnect: () => {
        setNetworkDisconnectOpen(true);
      },
    });

    return () => {
      broadcastWSBackgroundService.unregisterCallbacks([
        "onVoiceChunk",
        "onVoiceTurnComplete",
        "onEmotionChange",
        "onVoiceInterrupted",
        "onBufferedStreamerTextFlushed",
        "onError",
        "onProlongedDisconnect",
      ]);
      broadcastWSBackgroundService.dispose();
      sttBackgroundService.dispose();
    };
    // 서비스 init/콜백 등록은 1회만. handleFinalTranscript(트리거워드 변경 시 갱신)에
    // 묶으면 캐릭터 데이터 로드마다 WS/STT 가 dispose→재연결되는 churn 이 생긴다.
    // 최종 transcript 핸들러 구독은 아래 별도 effect 에서 가볍게 재구독한다.
  }, []);

  // 트리거워드 등으로 handleFinalTranscript 가 바뀌면 서비스 재시작 없이 핸들러만 교체.
  useEffect(() => {
    return sttBackgroundService.subscribeFinalTranscript(handleFinalTranscript);
  }, [handleFinalTranscript]);

  useEffect(() => {
    const prevConnected = prevWsConnectedRef.current;
    if (prevConnected === null) {
      prevWsConnectedRef.current = isConnected;
      return;
    }

    if (!prevConnected && isConnected) {
      pushAlarm(prevWsErrorRef.current ? "ws.reconnected" : "ws.connected");
    }

    if (prevConnected && !isConnected) {
      pushAlarm("ws.disconnected");
    }

    prevWsConnectedRef.current = isConnected;
  }, [isConnected, pushAlarm]);

  useEffect(() => {
    if (!wsError) {
      prevWsErrorRef.current = null;
      return;
    }

    if (wsError !== prevWsErrorRef.current) {
      pushAlarm("ws.reconnect_failed");
      prevWsErrorRef.current = wsError;
    }
  }, [pushAlarm, wsError]);

  useEffect(() => {
    if (!sttEnabled) {
      void sttBackgroundService.cancelListening();
    }
  }, [sttEnabled]);

  // 디버그 로그: 정체성 값(캐릭터/VRM)이 바뀔 때만 한 번씩 출력.
  // 매 frame fire 되던 visemeWeights/mouthOpen/transcript 변경엔 로깅하지 않는다.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log("[AppInitializer] overlay runtime source", {
      isBroadcasting,
      broadcastStreamId: useAIModeStore.getState().broadcastStreamId,
      characterInfo: characterInfo
        ? {
            characterId: characterInfo.characterId,
            characterName: characterInfo.characterName,
            characterImageUrl: characterInfo.characterImageUrl,
          }
        : null,
      character: character
        ? {
            characterId: character.characterId,
            modelType: character.modelType,
            characterImageUrl: character.characterImageUrl,
            vrmUrl: character.vrmUrl ?? null,
            vrmThumbnailUrl: character.vrmThumbnailUrl ?? null,
          }
        : null,
      appearance: appearance
        ? {
            modelType: appearance.modelType,
            targetId: appearance.targetId,
            vrmUrl: appearance.vrmUrl ?? null,
            vrmThumbnailUrl: appearance.vrmThumbnailUrl ?? null,
          }
        : null,
      resolved: {
        modelType: effectiveOverlayModelType,
        characterImageUrl: overlayCharacterImageUrl,
        vrmUrl: overlayCharacterVrmUrl,
        vrmThumbnailUrl: overlayCharacterVrmThumbnailUrl,
      },
    });
  }, [
    isBroadcasting,
    character?.characterId,
    character?.modelType,
    character?.vrmUrl,
    characterInfo?.characterId,
    appearance?.targetId,
    appearance?.modelType,
    effectiveOverlayModelType,
    overlayCharacterImageUrl,
    overlayCharacterVrmUrl,
    overlayCharacterVrmThumbnailUrl,
  ]);

  useEffect(() => {
    updateOverlayRuntime({
      isBroadcasting,
      broadcastStreamId: useAIModeStore.getState().broadcastStreamId,
      isSpeaking: isBroadcasting ? isPlayingTTS : false,
      lipSyncEnabled: isBroadcasting ? lipSyncEnabled : false,
      mouthOpen: isBroadcasting && lipSyncEnabled ? mouthOpen : 0,
      visemeWeights: isBroadcasting && lipSyncEnabled
        ? visemeWeights
        : { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 },
      modelType: effectiveOverlayModelType,
      characterName: overlayCharacterName,
      characterImageUrl: overlayCharacterImageUrl,
      vrmUrl: overlayCharacterVrmUrl,
      vrmThumbnailUrl: overlayCharacterVrmThumbnailUrl,
      emotionImageMap: overlayEmotionImageMap,
      transcript: isBroadcasting ? currentTranscript : "",
      emotion: isBroadcasting ? currentEmotion : "DEFAULT",
    });
  }, [
    currentEmotion,
    currentTranscript,
    isBroadcasting,
    isPlayingTTS,
    lipSyncEnabled,
    mouthOpen,
    visemeWeights,
    overlayCharacterImageUrl,
    overlayCharacterName,
    effectiveOverlayModelType,
    overlayCharacterVrmThumbnailUrl,
    overlayCharacterVrmUrl,
    overlayEmotionImageMap,
    updateOverlayRuntime,
  ]);

  return (
    <>
      <BroadcastQuitConfirmModal
        open={quitConfirmOpen}
        onConfirm={handleQuitConfirm}
        onCancel={handleQuitCancel}
      />
      <BroadcastQuitConfirmModal
        open={networkDisconnectOpen}
        onConfirm={handleNetworkDisconnectTerminate}
        onCancel={handleNetworkDisconnectKeepWaiting}
        title="네트워크 연결이 끊겼습니다"
        description="60초 이상 서버와 연결되지 않았습니다. 방송을 종료하시겠습니까? 계속 대기하려면 '취소'를 누르세요."
        confirmLabel="방송 종료하기"
      />
    </>
  );
}
