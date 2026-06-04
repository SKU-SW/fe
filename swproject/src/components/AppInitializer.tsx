/**
 * @file 앱 전역 런타임 초기화 컴포넌트
 * @dependsOn src/services/sttBackgroundService.ts
 * @dependsOn src/services/broadcastWSBackgroundService.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @dependsOn src/shared/stores/characterStore.ts
 * @dependsOn src/shared/stores/overlayStore.ts
 * @usedBy src/main.tsx
 */

import { useCallback, useEffect } from "react";
import { useBroadcastWSState, useStreamInfo } from "@/features/broadcast/hooks";
import { useCharacter } from "@/features/character/hooks/useCharacter";
import { sttBackgroundService } from "@/services/sttBackgroundService";
import { broadcastWSBackgroundService } from "@/services/broadcastWSBackgroundService";
import { buildEmotionImageMap } from "@/shared/lib/characterEmotionImages";
import { resolveAssetUrl } from "@/shared/lib/utils";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useCharacterStore } from "@/shared/stores/characterStore";
import { useOverlayStore } from "@/shared/stores/overlayStore";

const STREAMING_AI_DIALOGUE_ID = "streaming-ai-pending";

export default function AppInitializer() {
  const sttEnabled = useAIModeStore((s) => s.toggles.sttEnabled);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const { character } = useCharacter(selectedCharacterId);
  const currentTranscript = useAIModeStore((s) => s.currentTranscript);
  const currentEmotion = useAIModeStore((s) => s.currentEmotion);
  const isBroadcasting = useAIModeStore((s) => s.mode === "broadcasting");
  const updateOverlayRuntime = useOverlayStore((s) => s.updateRuntime);
  const { isPlayingTTS } = useBroadcastWSState();
  const { characterInfo } = useStreamInfo({ size: 1 });

  const overlayCharacterName = characterInfo?.characterName ?? character?.characterName ?? "AI";
  const overlayCharacterImageUrl =
    resolveAssetUrl(characterInfo?.characterImageUrl) || resolveAssetUrl(character?.characterImageUrl);
  const overlayEmotionImageMap = buildEmotionImageMap(overlayCharacterImageUrl);

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
          text: trimmed,
          emotion: "DEFAULT",
          timestamp: new Date().toISOString(),
        },
      ],
      null
    );
  }, []);

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
    });

    const unsubscribe = sttBackgroundService.subscribeFinalTranscript(handleFinalTranscript);

    return () => {
      unsubscribe();
      broadcastWSBackgroundService.unregisterCallbacks([
        "onVoiceChunk",
        "onVoiceTurnComplete",
        "onEmotionChange",
        "onVoiceInterrupted",
        "onBufferedStreamerTextFlushed",
        "onError",
      ]);
      broadcastWSBackgroundService.dispose();
      sttBackgroundService.dispose();
    };
  }, [handleFinalTranscript]);

  useEffect(() => {
    if (!sttEnabled) {
      void sttBackgroundService.cancelListening();
    }
  }, [sttEnabled]);

  useEffect(() => {
    updateOverlayRuntime({
      isBroadcasting,
      broadcastStreamId: useAIModeStore.getState().broadcastStreamId,
      isSpeaking: isBroadcasting ? isPlayingTTS : false,
      characterName: overlayCharacterName,
      characterImageUrl: overlayCharacterImageUrl,
      emotionImageMap: overlayEmotionImageMap,
      transcript: isBroadcasting ? currentTranscript : "",
      emotion: isBroadcasting ? currentEmotion : "DEFAULT",
    });
  }, [
    currentEmotion,
    currentTranscript,
    isBroadcasting,
    isPlayingTTS,
    overlayCharacterImageUrl,
    overlayCharacterName,
    overlayEmotionImageMap,
    updateOverlayRuntime,
  ]);

  return null;
}
