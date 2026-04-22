/**
 * @file 캐릭터 실시간 미리보기 패널
 * @created Sprint 3 - Character UI 이식
 * @dependsOn src/shared/types/character.ts (CharacterConfig)
 * @usedBy src/features/character/components/CharacterForm.tsx
 */

import { CheckCircle, Mic, Tag, Volume2 } from "lucide-react";
import type { CharacterConfig } from "@/shared/types/character";

interface CharacterPreviewProps {
  config: CharacterConfig;
}

const SPEECH_LABEL: Record<CharacterConfig["speechStyle"], string> = {
  casual: "친근한 반말",
  polite: "깍듯한 존댓말",
  playful: "장난기 섞인 반말",
  dramatic: "방송용 과장체",
};

const PERSONALITY_LABEL: Record<CharacterConfig["personality"], string> = {
  energetic: "활발함",
  calm: "차분함",
  humorous: "유머러스",
  serious: "진지함",
};

export function CharacterPreview({ config }: CharacterPreviewProps) {
  return (
    <aside className="sticky top-0 h-screen overflow-y-auto border-l border-slate-700 bg-slate-900 p-6">
      <h3 className="text-lg font-semibold text-white">실시간 미리보기</h3>
      <p className="mb-5 text-xs text-slate-400">설정 변경이 즉시 반영됩니다.</p>

      <div className="mb-5 rounded-xl border border-blue-500/40 bg-slate-800 p-5">
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="mb-3 flex h-24 w-24 items-center justify-center rounded-xl border border-slate-600 bg-slate-700 text-3xl">
            {config.gender === "male" ? "M" : "F"}
          </div>
          <p className="text-lg font-semibold text-white">{config.name || "캐릭터 이름"}</p>
          {config.callWords.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5">
              {config.callWords.slice(0, 3).map((word) => (
                <span key={word} className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                  "{word}"
                </span>
              ))}
            </div>
          )}
        </div>

        {config.broadcastPreset && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-blue-500/10 p-2 text-xs text-blue-300">
            <Tag className="h-3.5 w-3.5" />
            <span>{config.broadcastPreset}</span>
          </div>
        )}
      </div>

      <div className="mb-5 rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-green-300" />
          <h4 className="text-sm font-semibold text-white">대화 미리보기</h4>
        </div>
        <div className="space-y-2 text-sm">
          <div className="rounded-lg bg-slate-700 p-2 text-slate-200">
            <div className="mb-1 flex items-center gap-1 text-xs text-slate-400">
              <Mic className="h-3 w-3" />
              스트리머
            </div>
            {config.callWords[0] ?? "AI야"}
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/20 p-2 text-blue-100">
            <div className="mb-1 flex items-center gap-1 text-xs text-blue-200">
              <Volume2 className="h-3 w-3" />
              {config.name || "AI"}
            </div>
            {SPEECH_LABEL[config.speechStyle]} 톤으로 답변합니다.
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-300" />
          <h4 className="text-sm font-semibold text-white">설정 요약</h4>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-200">
            {config.gender === "male" ? "남성" : "여성"}
          </span>
          <span className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-200">
            {SPEECH_LABEL[config.speechStyle]}
          </span>
          <span className="rounded border border-slate-600 bg-slate-700 px-2 py-1 text-slate-200">
            {PERSONALITY_LABEL[config.personality]}
          </span>
        </div>
      </div>
    </aside>
  );
}
