/**
 * @file 캐릭터 기본 정보 입력 섹션
 * @created Sprint 3 - Character UI 이식
 * @dependsOn src/shared/types/character.ts (CharacterConfig)
 * @usedBy src/features/character/components/CharacterSettings.tsx
 */

import { useState } from "react";
import { MessageCircle, User, X } from "lucide-react";
import type { CharacterConfig } from "@/shared/types/character";

interface BasicInfoSectionProps {
  config: CharacterConfig;
  onChange: (config: CharacterConfig) => void;
}

const MAX_CALL_WORDS = 3;

export function BasicInfoSection({ config, onChange }: BasicInfoSectionProps) {
  const [callWordInput, setCallWordInput] = useState("");

  const reachedMax = config.callWords.length >= MAX_CALL_WORDS;

  const addCallWord = () => {
    if (reachedMax) return;
    const trimmed = callWordInput.trim();
    if (!trimmed || config.callWords.includes(trimmed)) {
      return;
    }
    onChange({ ...config, callWords: [...config.callWords, trimmed] });
    setCallWordInput("");
  };

  const removeCallWord = (word: string) => {
    onChange({
      ...config,
      callWords: config.callWords.filter((callWord) => callWord !== word),
    });
  };

  return (
    <section className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-6">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">기본 정보</h3>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">AI 캐릭터 이름</label>
        <input
          type="text"
          value={config.name}
          onChange={(event) => onChange({ ...config, name: event.target.value })}
          placeholder="예: 아리, 도우미, 짝꿍"
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">
            호출어 등록 <span className="text-xs text-slate-500">(최대 {MAX_CALL_WORDS}개)</span>
          </label>
          <span className="text-xs text-slate-500">
            {config.callWords.length} / {MAX_CALL_WORDS}
          </span>
        </div>

        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={callWordInput}
            onChange={(event) => setCallWordInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCallWord();
              }
            }}
            disabled={reachedMax}
            placeholder={reachedMax ? "최대 개수에 도달했습니다" : "예: AI야, 도와줘"}
            className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={addCallWord}
            disabled={reachedMax || !callWordInput.trim()}
            className="rounded-lg bg-indigo-600 px-6 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            추가
          </button>
        </div>

        {config.callWords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {config.callWords.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => removeCallWord(word)}
                title="클릭하여 삭제"
                className="group relative flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/20 px-3 py-1.5 transition hover:border-red-500/40 hover:bg-red-500/15"
              >
                <MessageCircle className="h-3 w-3 text-indigo-300 transition group-hover:opacity-0" />
                <X className="absolute left-3 h-3 w-3 text-red-400 opacity-0 transition group-hover:opacity-100" />
                <span className="text-sm text-indigo-200 transition group-hover:text-red-300">{word}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
