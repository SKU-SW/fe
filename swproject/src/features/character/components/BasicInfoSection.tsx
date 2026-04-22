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

export function BasicInfoSection({ config, onChange }: BasicInfoSectionProps) {
  const [callWordInput, setCallWordInput] = useState("");

  const addCallWord = () => {
    const trimmed = callWordInput.trim();
    if (!trimmed || config.callWords.includes(trimmed)) {
      return;
    }
    onChange({ ...config, callWords: [...config.callWords, trimmed] });
    setCallWordInput("");
  };

  return (
    <section className="space-y-6 rounded-xl border border-slate-700 bg-slate-800 p-6">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">기본 정보</h3>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">AI 캐릭터 이름</label>
        <input
          type="text"
          value={config.name}
          onChange={(event) => onChange({ ...config, name: event.target.value })}
          placeholder="예: 아리, 도우미, 짝꿍"
          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">호출어 등록</label>
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
            placeholder="예: AI야, 도와줘"
            className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={addCallWord}
            className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
          >
            추가
          </button>
        </div>

        {config.callWords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {config.callWords.map((word) => (
              <div
                key={word}
                className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-1.5"
              >
                <MessageCircle className="h-3 w-3 text-blue-300" />
                <span className="text-sm text-blue-200">{word}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...config,
                      callWords: config.callWords.filter((callWord) => callWord !== word),
                    })
                  }
                  className="rounded p-0.5 hover:bg-blue-500/30"
                >
                  <X className="h-3 w-3 text-blue-300" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
