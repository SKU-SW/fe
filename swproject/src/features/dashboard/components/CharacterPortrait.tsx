/**
 * @file 방송 중 좌측 캐릭터 초상
 * - speakingState 따라 가벼운 시각 강조 (Discord-like theme)
 * @usedBy src/pages/DashboardPage.tsx
 */

import { resolveAssetUrl } from "@/shared/lib/utils";
import type { SpeakingState } from "../types";

interface CharacterPortraitProps {
  imageUrl?: string | null;
  name?: string;
  speakingState?: SpeakingState;
}

const STATE_LABEL: Record<SpeakingState, string> = {
  idle: "대기 중",
  listening: "듣는 중",
  speaking: "말하는 중",
};

// 디스코드 상태 테두리 색상
const STATE_RING: Record<SpeakingState, string> = {
  idle: "ring-2 ring-border-strong",
  listening: "ring-2 ring-status-success",
  speaking: "ring-2 ring-brand",
};

// 점 색상
const STATE_DOT: Record<SpeakingState, string> = {
  idle: "bg-content-muted",
  listening: "bg-status-success",
  speaking: "bg-brand",
};

export function CharacterPortrait({ imageUrl, name = "AI", speakingState = "idle" }: CharacterPortraitProps) {
  const resolved = resolveAssetUrl(imageUrl ?? "");
  const fallbackChar = (name.charAt(0) || "A").toUpperCase();

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 rounded-lg border border-border-strong bg-surface-panel p-10 shadow-sm transition-colors">
      {/* 캐릭터 이미지 (원형 프로필 느낌으로 변경) */}
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

      {/* 상태 텍스트 배지 */}
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
