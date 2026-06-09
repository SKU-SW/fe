/**
 * @file 방송 중 좌측 AI 캐릭터 초상
 *  - vrmUrl 이 주어지면 3D VRM 캔버스 렌더링 (백엔드 emotion → 표정, TTS 재생 중 → 입 모양)
 *  - 없으면 기존 2D 이미지/이니셜 fallback
 * @dependsOn src/shared/lib/vrmController.ts (VRM 씬 셋업/표정 적용)
 * @dependsOn src/shared/lib/emotionMapping.ts
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { resolveAssetUrl } from "@/shared/lib/utils";
import {
  applyBackendEmotion,
  setMouthOpen,
  setupVrmScene,
  startRenderLoop,
  type VrmSceneRefs,
} from "@/shared/lib/vrmController";
import type { StreamEmotion } from "@/shared/types/stream";
import type { SpeakingState } from "../types";

interface CharacterPortraitProps {
  imageUrl?: string | null;
  /** 주어지면 3D VRM 모드로 렌더. 아니면 imageUrl 기반 2D fallback */
  vrmUrl?: string | null;
  name?: string;
  speakingState?: SpeakingState;
  /** 백엔드 WS 가 보내는 현재 감정. 3D 모드에서 표정 변화에 사용 */
  emotion?: StreamEmotion;
  /** TTS 재생 중 여부. 3D 모드에서 입 모양 애니메이션 트리거 */
  isSpeaking?: boolean;
}

const STATE_LABEL: Record<SpeakingState, string> = {
  idle: "대기 중",
  listening: "듣는 중",
  speaking: "말하는 중",
};

const STATE_RING: Record<SpeakingState, string> = {
  idle: "ring-2 ring-border-strong",
  listening: "ring-2 ring-status-success",
  speaking: "ring-2 ring-brand",
};

const STATE_DOT: Record<SpeakingState, string> = {
  idle: "bg-content-muted",
  listening: "bg-status-success",
  speaking: "bg-brand",
};

export function CharacterPortrait({
  imageUrl,
  vrmUrl,
  name = "AI",
  speakingState = "idle",
  emotion,
  isSpeaking = false,
}: CharacterPortraitProps) {
  if (vrmUrl) {
    return (
      <VrmPortrait
        vrmUrl={vrmUrl}
        name={name}
        speakingState={speakingState}
        emotion={emotion}
        isSpeaking={isSpeaking}
      />
    );
  }

  return (
    <ImagePortrait imageUrl={imageUrl} name={name} speakingState={speakingState} />
  );
}

// ============================================================
// 2D 이미지 모드 (fallback)
// ============================================================

interface ImagePortraitProps {
  imageUrl?: string | null;
  name: string;
  speakingState: SpeakingState;
}

function ImagePortrait({ imageUrl, name, speakingState }: ImagePortraitProps) {
  const resolved = resolveAssetUrl(imageUrl ?? "");
  const fallbackChar = (name.charAt(0) || "A").toUpperCase();

  return (
    <PortraitFrame name={name} speakingState={speakingState}>
      <div
        className={`flex aspect-square w-full max-w-[160px] items-center justify-center overflow-hidden rounded-full bg-surface-raised transition-all ${STATE_RING[speakingState]}`}
      >
        {resolved ? (
          <img
            src={resolved}
            alt={`${name} 프로필`}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
            }}
          />
        ) : (
          <span className="text-5xl font-bold text-content-muted">{fallbackChar}</span>
        )}
      </div>
    </PortraitFrame>
  );
}

// ============================================================
// 3D VRM 모드
// ============================================================

interface VrmPortraitProps {
  vrmUrl: string;
  name: string;
  speakingState: SpeakingState;
  emotion?: StreamEmotion;
  isSpeaking: boolean;
}

function VrmPortrait({ vrmUrl, name, speakingState, emotion, isSpeaking }: VrmPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const refsRef = useRef<VrmSceneRefs | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // VRM 씬 셋업 (vrmUrl 변경 시 재로드)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let mounted = true;
    setLoadStatus("loading");
    setErrorMessage(null);

    setupVrmScene(canvas, vrmUrl)
      .then((refs) => {
        if (!mounted) {
          refs.dispose();
          return;
        }
        refsRef.current = refs;
        stopLoopRef.current = startRenderLoop(refs);
        setLoadStatus("ready");
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "알 수 없는 오류";
        console.error("[CharacterPortrait] VRM 로드 실패:", err);
        setErrorMessage(message);
        setLoadStatus("error");
      });

    return () => {
      mounted = false;
      stopLoopRef.current?.();
      refsRef.current?.dispose();
      refsRef.current = null;
    };
  }, [vrmUrl]);

  // 백엔드 emotion → 표정 변경 (idle 기본은 DEFAULT)
  useEffect(() => {
    if (loadStatus !== "ready" || !refsRef.current) return;
    applyBackendEmotion(refsRef.current, emotion ?? "DEFAULT");
  }, [emotion, loadStatus]);

  // TTS 재생 중 → 입 모양 sine 애니메이션, 종료 시 0
  useEffect(() => {
    if (loadStatus !== "ready") return;
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
  }, [isSpeaking, loadStatus]);

  return (
    <PortraitFrame name={name} speakingState={speakingState}>
      <div
        className={`relative aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl bg-transparent transition-all ${STATE_RING[speakingState]}`}
      >
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {loadStatus === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-content-muted">
            캐릭터 로딩 중...
          </div>
        )}
        {loadStatus === "error" && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <div className="rounded-md border border-status-danger/30 bg-status-danger/10 p-3 text-xs text-status-danger">
              <p className="font-bold">캐릭터 로드 실패</p>
              <p className="mt-1 break-all">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </PortraitFrame>
  );
}

// ============================================================
// 공통 프레임 (이름 + 상태 배지)
// ============================================================

interface PortraitFrameProps {
  name: string;
  speakingState: SpeakingState;
  children: ReactNode;
}

function PortraitFrame({ name, speakingState, children }: PortraitFrameProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 rounded-lg border border-border-strong bg-surface-panel p-10 shadow-sm transition-colors">
      {children}
      <div className="flex flex-col items-center gap-1.5">
        <h3 className="text-lg font-bold text-content-primary">{name}</h3>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3 py-1 text-sm font-medium text-content-muted transition-colors">
          <span className={`h-2 w-2 rounded-full ${STATE_DOT[speakingState]}`} />
          {STATE_LABEL[speakingState]}
        </div>
      </div>
    </div>
  );
}
