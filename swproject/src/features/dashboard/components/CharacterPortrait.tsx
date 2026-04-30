/**
 * @file 방송 중 좌측 캐릭터 초상
 * - speakingState 따라 가벼운 시각 강조 (Phase 1: 정적, Phase 3: 이미지 교체로 확장 예정)
 * @usedBy src/pages/DashboardPage.tsx
 */

import { Mic } from "lucide-react";
import { resolveAssetUrl } from "@/shared/lib/utils";
import type { SpeakingState } from "../types";

interface CharacterPortraitProps {
  imageUrl?: string | null;
  /** 캐릭터 이름 (대체 텍스트 + fallback 글자용) */
  name?: string;
  speakingState?: SpeakingState;
}

const STATE_LABEL: Record<SpeakingState, string> = {
  idle: "대기",
  listening: "듣는 중",
  speaking: "말하는 중",
};

const STATE_RING: Record<SpeakingState, string> = {
  idle: "ring-1 ring-slate-700",
  listening: "ring-2 ring-emerald-500/60 shadow-lg shadow-emerald-500/10",
  speaking: "ring-2 ring-indigo-500/70 shadow-lg shadow-indigo-500/20",
};

export function CharacterPortrait({ imageUrl, name = "AI", speakingState = "idle" }: CharacterPortraitProps) {
  const resolved = resolveAssetUrl(imageUrl ?? "");
  const fallbackChar = (name.charAt(0) || "A").toUpperCase();

  return (
    <div className="flex h-full flex-col items-center justify-between gap-4 rounded-xl border border-slate-700/50 bg-slate-900/60 p-6">
      {/* 캐릭터 이미지 */}
      <div
        className={`flex aspect-square w-full max-w-[280px] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 transition-all ${STATE_RING[speakingState]}`}
      >
        {resolved ? (
          <img
            src={resolved}
            alt={`${name} 캐릭터 사진`}
            className="h-full w-full object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
            }}
          />
        ) : (
          <span className="text-6xl font-bold text-slate-600">{fallbackChar}</span>
        )}
      </div>

      {/* 상태 표시 */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            speakingState === "speaking"
              ? "bg-indigo-400 animate-pulse"
              : speakingState === "listening"
                ? "bg-emerald-400 animate-pulse"
                : "bg-slate-600"
          }`}
        />
        <span>{name}</span>
        <span className="text-slate-500">·</span>
        <span className="inline-flex items-center gap-1">
          {speakingState === "listening" && <Mic className="h-3 w-3" />}
          {STATE_LABEL[speakingState]}
        </span>
      </div>
    </div>
  );
}
