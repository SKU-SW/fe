/**
 * @file 캐릭터가 없을 때 표시되는 빈 상태 UI
 * @created Sprint 3 - Character UI 이식
 * @dependsOn lucide-react (PlusCircle, Sparkles)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { PlusCircle, Sparkles } from "lucide-react";

interface CharacterEmptyStateProps {
  onCreateClick: () => void;
}

export function CharacterEmptyState({ onCreateClick }: CharacterEmptyStateProps) {
  return (
    <div className="h-full min-h-[520px] w-full bg-slate-950 p-8">
      <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 p-10 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
          <Sparkles className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">등록된 AI 캐릭터가 없습니다</h2>
        <p className="mb-8 max-w-xl leading-relaxed text-slate-400">
          방송을 함께할 AI 동료를 만들어보세요. 외모, 목소리, 페르소나를 조합해 방송 스타일에 맞는
          캐릭터를 빠르게 구성할 수 있습니다.
        </p>
        <button
          type="button"
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
        >
          <PlusCircle className="h-5 w-5" />
          AI 캐릭터 생성하기
        </button>
      </div>
    </div>
  );
}
