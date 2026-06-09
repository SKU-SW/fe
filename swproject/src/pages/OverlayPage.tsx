/**
 * @file OBS Browser Source용 AI 캐릭터 오버레이 페이지
 * @dependsOn src/shared/stores/overlayStore.ts
 * @dependsOn src/shared/lib/overlayBridge.ts
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Eye, EyeOff, Minus, Plus } from "lucide-react";
import { useOverlayStore } from "@/shared/stores/overlayStore";
import { useEmotionImagePreload } from "@/shared/hooks/useEmotionImagePreload";
import {
  applyBackendEmotion,
  setMouthOpen,
  setupVrmScene,
  startRenderLoop,
  type VrmSceneRefs,
} from "@/shared/lib/vrmController";
import {
  readOverlayStateServer,
  readOverlayBridgeState,
  subscribeOverlayBridgeState,
} from "@/shared/lib/overlayBridge";
import type {
  OverlayBridgeState,
  OverlayPosition,
  OverlayRuntimeState,
  OverlaySettings,
} from "@/shared/types/overlay";
import type { StreamEmotion } from "@/shared/types/stream";

const EMOTION_LABELS: Record<StreamEmotion, string> = {
  DEFAULT: "기본",
  TALKING: "말하는 중",
  HAPPY: "기쁨",
  ANGRY: "화남",
  TIRED: "지침",
  SAD: "슬픔",
  FEAR: "두려움",
};

const EMOTION_RING_CLASS: Record<StreamEmotion, string> = {
  DEFAULT: "drop-shadow-[0_0_18px_rgba(15,23,42,0.45)]",
  TALKING: "drop-shadow-[0_0_22px_rgba(99,102,241,0.55)]",
  HAPPY: "drop-shadow-[0_0_22px_rgba(250,204,21,0.55)]",
  ANGRY: "drop-shadow-[0_0_24px_rgba(239,68,68,0.6)] saturate-125",
  TIRED: "drop-shadow-[0_0_22px_rgba(148,163,184,0.5)] grayscale-[15%]",
  SAD: "drop-shadow-[0_0_22px_rgba(59,130,246,0.5)] grayscale-[15%]",
  FEAR: "drop-shadow-[0_0_22px_rgba(167,139,250,0.55)]",
};

const POSITION_CLASS: Record<OverlayPosition, string> = {
  "bottom-right": "items-end justify-end",
  "bottom-left": "items-end justify-start",
  "top-right": "items-start justify-end",
  "top-left": "items-start justify-start",
};

const POSITION_LABEL: Record<OverlayPosition, string> = {
  "bottom-right": "오른쪽 아래",
  "bottom-left": "왼쪽 아래",
  "top-right": "오른쪽 위",
  "top-left": "왼쪽 위",
};

const POSITIONS: OverlayPosition[] = ["bottom-right", "bottom-left", "top-right", "top-left"];
const FADE_DELAY_MS = 3000;
const FADE_DURATION_MS = 300;

function createDefaultBridgeState(settings: OverlaySettings): OverlayBridgeState {
  return {
    settings,
    runtime: {
      isBroadcasting: false,
      broadcastStreamId: null,
      isSpeaking: false,
      modelType: "2D",
      characterName: "AI",
      characterImageUrl: "",
      vrmUrl: "",
      vrmThumbnailUrl: "",
      emotionImageMap: {},
      transcript: "",
      emotion: "DEFAULT",
      updatedAt: 0,
    },
  };
}

function getHashSearchParams(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");
  if (queryIndex < 0) return new URLSearchParams(window.location.search);
  return new URLSearchParams(hash.slice(queryIndex + 1));
}

export default function OverlayPage() {
  const settings = useOverlayStore((s) => s.settings);
  const runtime = useOverlayStore((s) => s.runtime);
  const setEnabled = useOverlayStore((s) => s.setEnabled);
  const setPosition = useOverlayStore((s) => s.setPosition);
  const setScale = useOverlayStore((s) => s.setScale);
  const setShowBubble = useOverlayStore((s) => s.setShowBubble);
  const hashParams = getHashSearchParams();
  const isSettingsMode = hashParams.get("settings") === "1";
  const isPreviewMode = hashParams.get("preview") === "1";

  useEffect(() => {
    document.documentElement.classList.add("overlay-route");
    document.body.classList.add("overlay-route");
    return () => {
      document.documentElement.classList.remove("overlay-route");
      document.body.classList.remove("overlay-route");
    };
  }, []);

  const [bridgeState, setBridgeState] = useState<OverlayBridgeState>(() =>
    readOverlayBridgeState() ?? createDefaultBridgeState(settings)
  );

  useEffect(() => {
    const current = readOverlayBridgeState();
    if (current) {
      setBridgeState(current);
    }
    void readOverlayStateServer().then((serverState) => {
      if (serverState) {
        setBridgeState(serverState);
      }
    });
    const unsubscribe = subscribeOverlayBridgeState((state) => {
      setBridgeState(state);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isSettingsMode) {
      const bridgeRuntime = readOverlayBridgeState()?.runtime ?? runtime;
      setBridgeState({
        settings,
        runtime: {
          ...bridgeRuntime,
        },
      });
    }
  }, [
    isSettingsMode,
    runtime,
    settings,
  ]);

  const overlayUrl = useMemo(() => {
    if (import.meta.env.DEV) return "http://localhost:5173/#/overlay";
    return "http://127.0.0.1:5174/#/overlay";
  }, []);

  const copyOverlayUrl = async () => {
    try {
      await navigator.clipboard.writeText(overlayUrl);
    } catch {
      // clipboard 미지원 환경은 무시
    }
  };

  if (isSettingsMode) {
    return (
      <OverlaySettingsPanel
        overlayUrl={overlayUrl}
        settings={settings}
        onCopy={copyOverlayUrl}
        onEnabledChange={setEnabled}
        onPositionChange={setPosition}
        onScaleChange={setScale}
        onShowBubbleChange={setShowBubble}
      />
    );
  }

  return <OverlayCanvas state={bridgeState} preview={isPreviewMode} />;
}

function OverlayCanvas({ state, preview }: { state: OverlayBridgeState; preview: boolean }) {
  const { settings, runtime } = state;
  const previewRuntime: OverlayRuntimeState = preview
    ? {
        ...runtime,
        isBroadcasting: true,
        characterName: runtime.characterName || "AI 캐릭터",
        transcript: runtime.transcript || "오버레이 미리보기입니다. 방송 시작 후 AI 응답이 여기에 표시됩니다.",
        emotion: runtime.emotion || "DEFAULT",
      }
    : runtime;
  const [displayTranscript, setDisplayTranscript] = useState(previewRuntime.transcript);
  const [displayEmotion, setDisplayEmotion] = useState<StreamEmotion>(previewRuntime.emotion);
  const [bubbleVisible, setBubbleVisible] = useState(Boolean(previewRuntime.transcript));
  useEmotionImagePreload(previewRuntime.modelType === "2D" ? previewRuntime.emotionImageMap : {});

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    if (preview) {
      setDisplayTranscript(previewRuntime.transcript);
      setDisplayEmotion(previewRuntime.emotion);
      setBubbleVisible(Boolean(previewRuntime.transcript));
      return;
    }

    setDisplayTranscript(previewRuntime.transcript);
    setDisplayEmotion(previewRuntime.emotion);
    setBubbleVisible(Boolean(previewRuntime.transcript));

    if (previewRuntime.isSpeaking || !previewRuntime.transcript) {
      return () => {
        if (fadeTimer) clearTimeout(fadeTimer);
        if (clearTimer) clearTimeout(clearTimer);
      };
    }

    fadeTimer = setTimeout(() => {
      setBubbleVisible(false);
      setDisplayEmotion("DEFAULT");
      clearTimer = setTimeout(() => setDisplayTranscript(""), FADE_DURATION_MS);
    }, FADE_DELAY_MS);

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, [
    preview,
    previewRuntime.transcript,
    previewRuntime.emotion,
    previewRuntime.isSpeaking,
  ]);

  const displayRuntime: OverlayRuntimeState = {
    ...previewRuntime,
    transcript: displayTranscript,
    emotion: displayEmotion,
  };

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log("[OverlayPage] runtime", {
      preview,
      isBroadcasting: displayRuntime.isBroadcasting,
      modelType: displayRuntime.modelType,
      characterName: displayRuntime.characterName,
      characterImageUrl: displayRuntime.characterImageUrl,
      vrmUrl: displayRuntime.vrmUrl,
      vrmThumbnailUrl: displayRuntime.vrmThumbnailUrl,
      updatedAt: displayRuntime.updatedAt,
    });
  }, [
    displayRuntime.characterImageUrl,
    displayRuntime.characterName,
    displayRuntime.isBroadcasting,
    displayRuntime.modelType,
    displayRuntime.updatedAt,
    displayRuntime.vrmThumbnailUrl,
    displayRuntime.vrmUrl,
    preview,
  ]);

  const shouldShow = settings.enabled && previewRuntime.isBroadcasting;
  const resolvedCharacterImage = resolveCharacterImage(displayRuntime);
  const hasCharacterImage = resolvedCharacterImage.length > 0;

  return (
    <main className="fixed inset-0 overflow-hidden bg-transparent pointer-events-none z-50">
      {shouldShow && (
        <div className={`flex h-full w-full p-8 ${POSITION_CLASS[settings.position]}`}>
          <div
            className="pointer-events-none flex items-end gap-4 transition-transform duration-300"
            style={{ transform: `scale(${settings.scale})`, transformOrigin: transformOriginFor(settings.position) }}
          >
            {settings.showBubble && displayTranscript && (
              <div
                className={`mb-16 rounded-[22px] border border-white/25 bg-black/55 px-4 py-3 text-white shadow-2xl backdrop-blur-md transition-opacity duration-300 ${
                  bubbleVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  width: "360px",
                  minHeight: "84px",
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                  {previewRuntime.characterName} · {EMOTION_LABELS[displayEmotion]}
                </p>
                <p
                  className="mt-1.5 text-sm font-bold leading-snug"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  {displayTranscript}
                </p>
              </div>
            )}

            <div className="relative flex h-[420px] w-[320px] shrink-0 items-end justify-center">
              {displayRuntime.modelType === "3D" && displayRuntime.vrmUrl ? (
                <OverlayVrmCanvas
                  vrmUrl={displayRuntime.vrmUrl}
                  emotion={displayEmotion}
                  isSpeaking={displayRuntime.isSpeaking}
                />
              ) : hasCharacterImage ? (
                <img
                  src={resolvedCharacterImage}
                  alt={previewRuntime.characterName}
                  className={`max-h-full max-w-full object-contain transition-all duration-300 ${EMOTION_RING_CLASS[displayEmotion]}`}
                  draggable={false}
                />
              ) : preview ? (
                <div className="flex h-72 w-72 items-center justify-center rounded-[32px] border border-white/20 bg-slate-800/70 text-center text-white shadow-2xl backdrop-blur-md">
                  <div>
                    <p className="text-sm font-bold text-white/60">AI Character</p>
                    <p className="mt-2 text-3xl font-black">{previewRuntime.characterName}</p>
                    <p className="mt-2 text-sm text-white/60">캐릭터 이미지 대기 중</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function resolveCharacterImage(runtime: OverlayRuntimeState): string {
  const map = runtime.emotionImageMap ?? {};

  if (runtime.emotion !== "DEFAULT" && map[runtime.emotion]) {
    return map[runtime.emotion] as string;
  }

  return map.DEFAULT ?? runtime.characterImageUrl ?? "";
}

function OverlayVrmCanvas({
  vrmUrl,
  emotion,
  isSpeaking,
}: {
  vrmUrl: string;
  emotion: StreamEmotion;
  isSpeaking: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const refsRef = useRef<VrmSceneRefs | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  // VRM 씬 셋업 (vrmUrl 변경 시 재로드)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let mounted = true;
    setReady(false);

    setupVrmScene(canvas, vrmUrl)
      .then((refs) => {
        if (!mounted) {
          refs.dispose();
          return;
        }
        refsRef.current = refs;
        stopLoopRef.current = startRenderLoop(refs);
        setReady(true);
      })
      .catch((err: unknown) => {
        console.error("[Overlay] VRM 로드 실패:", err);
      });

    return () => {
      mounted = false;
      stopLoopRef.current?.();
      refsRef.current?.dispose();
      refsRef.current = null;
    };
  }, [vrmUrl]);

  // 백엔드 emotion → 표정 적용
  useEffect(() => {
    if (!ready || !refsRef.current) return;
    applyBackendEmotion(refsRef.current, emotion);
  }, [emotion, ready]);

  // TTS 재생 중 → 입 모양 sine 애니메이션, 종료 시 0
  useEffect(() => {
    if (!ready) return;
    if (!isSpeaking) {
      if (refsRef.current) setMouthOpen(refsRef.current, 0);
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (refsRef.current) {
        // 약 8Hz 의 입 벌림 패턴 (0~0.7 범위)
        const value = Math.max(0, Math.sin(now / 60) * 0.5 + 0.3);
        setMouthOpen(refsRef.current, value);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (refsRef.current) setMouthOpen(refsRef.current, 0);
    };
  }, [isSpeaking, ready]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ background: "transparent" }}
    />
  );
}

function transformOriginFor(position: OverlayPosition): string {
  switch (position) {
    case "bottom-left":
      return "bottom left";
    case "top-right":
      return "top right";
    case "top-left":
      return "top left";
    case "bottom-right":
    default:
      return "bottom right";
  }
}

function OverlaySettingsPanel({
  overlayUrl,
  settings,
  onCopy,
  onEnabledChange,
  onPositionChange,
  onScaleChange,
  onShowBubbleChange,
}: {
  overlayUrl: string;
  settings: OverlaySettings;
  onCopy: () => void;
  onEnabledChange: (enabled: boolean) => void;
  onPositionChange: (position: OverlayPosition) => void;
  onScaleChange: (scale: number) => void;
  onShowBubbleChange: (showBubble: boolean) => void;
}) {
  return (
    <main className="min-h-screen bg-[#313338] px-6 py-6 text-[#dbdee1]">
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-2xl border border-[#1e1f22] bg-[#2b2d31] p-5">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#949ba4]">OBS Overlay Settings</p>
          <h1 className="mt-2 text-2xl font-black text-[#f2f3f5]">AI 캐릭터 오버레이 설정</h1>
          <p className="mt-2 text-sm text-[#949ba4]">
            OBS Browser Source에는 아래 URL을 등록하세요. 방송 시작 시 캐릭터가 표시되고, 방송 종료 시 숨겨집니다.
          </p>
        </header>

        <section className="rounded-2xl border border-[#1e1f22] bg-[#2b2d31] p-5">
          <h2 className="text-sm font-black text-[#f2f3f5]">OBS Browser Source URL</h2>
          <div className="mt-3 flex flex-col gap-3 rounded-xl bg-[#1e1f22] p-3 sm:flex-row sm:items-center">
            <code className="flex-1 break-all text-sm text-[#dbdee1]">{overlayUrl}</code>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-3 py-2 text-sm font-bold text-white hover:bg-[#4752C4]"
            >
              <Copy className="h-4 w-4" />
              복사
            </button>
          </div>
          <p className="mt-3 text-xs font-bold text-[#949ba4]">
            테스트용 미리보기 URL: <code>{overlayUrl}?preview=1</code>
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#1e1f22] bg-[#2b2d31] p-5">
            <h2 className="text-sm font-black text-[#f2f3f5]">표시 상태</h2>
            <button
              type="button"
              onClick={() => onEnabledChange(!settings.enabled)}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${
                settings.enabled ? "bg-[#23a559] text-white" : "bg-[#4e5058] text-[#dbdee1]"
              }`}
            >
              {settings.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {settings.enabled ? "오버레이 ON" : "오버레이 OFF"}
            </button>

            <label className="mt-5 flex items-center gap-3 text-sm font-bold text-[#dbdee1]">
              <input
                type="checkbox"
                checked={settings.showBubble}
                onChange={(e) => onShowBubbleChange(e.target.checked)}
                className="h-4 w-4 rounded border-[#4e5058] bg-[#1e1f22]"
              />
              AI 대사 말풍선 표시
            </label>
          </div>

          <div className="rounded-2xl border border-[#1e1f22] bg-[#2b2d31] p-5">
            <h2 className="text-sm font-black text-[#f2f3f5]">크기</h2>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => onScaleChange(settings.scale - 0.1)}
                className="rounded-lg bg-[#1e1f22] p-2 text-[#dbdee1] hover:bg-[#3f4147]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={settings.scale}
                onChange={(e) => onScaleChange(Number(e.target.value))}
              />
              <button
                type="button"
                onClick={() => onScaleChange(settings.scale + 0.1)}
                className="rounded-lg bg-[#1e1f22] p-2 text-[#dbdee1] hover:bg-[#3f4147]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs font-bold text-[#949ba4]">현재 {Math.round(settings.scale * 100)}%</p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#1e1f22] bg-[#2b2d31] p-5">
          <h2 className="text-sm font-black text-[#f2f3f5]">위치 프리셋</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {POSITIONS.map((position) => (
              <button
                key={position}
                type="button"
                onClick={() => onPositionChange(position)}
                className={`rounded-xl border px-4 py-3 text-sm font-black transition ${
                  settings.position === position
                    ? "border-[#5865F2] bg-[#5865F2] text-white"
                    : "border-[#1e1f22] bg-[#1e1f22] text-[#dbdee1] hover:bg-[#3f4147]"
                }`}
              >
                {POSITION_LABEL[position]}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
