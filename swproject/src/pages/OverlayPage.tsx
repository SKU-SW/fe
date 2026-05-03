/**
 * @file OBS 오버레이 페이지
 * @migrated Next.js App Router → React Router
 * @dependsOn src/shared/stores/aiModeStore.ts
 */

import { useMemo } from "react";
import { Copy, Radio } from "lucide-react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import type { StreamEmotion } from "@/shared/types/stream";

const EMOTION_LABELS: Record<StreamEmotion, string> = {
  happy: "기쁨",
  sad: "슬픔",
  angry: "화남",
  crying: "우는",
  default: "기본",
};

const EMOTION_CLASSES: Record<StreamEmotion, string> = {
  happy: "from-yellow-400/70 to-orange-500/70 border-yellow-300/50",
  sad: "from-blue-400/70 to-sky-600/70 border-sky-300/50",
  angry: "from-rose-500/70 to-red-700/70 border-rose-300/50",
  crying: "from-cyan-300/70 to-blue-500/70 border-cyan-200/50",
  default: "from-slate-500/70 to-slate-700/70 border-slate-300/40",
};

export default function OverlayPage() {
  const currentEmotion = useAIModeStore((s) => s.currentEmotion);
  const currentTranscript = useAIModeStore((s) => s.currentTranscript);
  const broadcastStreamId = useAIModeStore((s) => s.broadcastStreamId);

  const overlayUrl = useMemo(() => {
    if (typeof window === "undefined") return "http://localhost:5173/#/overlay";
    return `${window.location.origin}${window.location.pathname}#/overlay`;
  }, []);

  const copyOverlayUrl = async () => {
    try {
      await navigator.clipboard.writeText(overlayUrl);
    } catch {
      // clipboard 미지원 환경은 무시
    }
  };

  return (
    <div className="flex h-screen w-screen items-end justify-between bg-transparent p-6">
      <div className="pointer-events-none flex items-end gap-4">
        <div
          className={`flex h-72 w-72 items-end justify-center overflow-hidden rounded-[28px] border bg-gradient-to-b p-6 text-white shadow-2xl ${EMOTION_CLASSES[currentEmotion]}`}
        >
          <div className="w-full rounded-2xl bg-black/25 px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">OBS Overlay</p>
            <p className="mt-2 text-2xl font-bold">{EMOTION_LABELS[currentEmotion]}</p>
            <p className="mt-1 text-sm text-white/80">감정 이미지 placeholder</p>
          </div>
        </div>

        <div className="max-w-md rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-white shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-300">
            <Radio className="h-3.5 w-3.5" />
            실시간 상태
          </div>
          <p className="mt-2 text-sm font-semibold">현재 감정: {EMOTION_LABELS[currentEmotion]}</p>
          <p className="mt-2 text-sm text-white/80">
            {currentTranscript || "아직 표시할 스트리머 음성 텍스트가 없습니다."}
          </p>
          {broadcastStreamId && (
            <p className="mt-3 text-xs text-white/60">streamId: {broadcastStreamId}</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/45 p-4 text-white shadow-xl backdrop-blur-md">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">OBS Browser Source</p>
        <p className="mt-2 max-w-sm break-all text-sm text-white/85">{overlayUrl}</p>
        <button
          type="button"
          onClick={copyOverlayUrl}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
        >
          <Copy className="h-4 w-4" />
          URL 복사
        </button>
      </div>
    </div>
  );
}
