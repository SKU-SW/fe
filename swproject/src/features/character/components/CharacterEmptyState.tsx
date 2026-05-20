/**
 * @file 캐릭터가 없을 때 표시되는 빈 상태 UI (디스코드 테마)
 * @dependsOn lucide-react (PlusCircle, Sparkles)
 * @usedBy src/pages/CharacterPage.tsx
 */

import { PlusCircle, Sparkles } from "lucide-react";

interface CharacterEmptyStateProps {
  onCreateClick: () => void;
}

export function CharacterEmptyState({ onCreateClick }: CharacterEmptyStateProps) {
  return (
    <div className="h-full min-h-[520px] w-full bg-surface-base p-8 transition-colors">
      <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center rounded-lg border border-border-strong bg-surface-panel p-10 text-center transition-colors">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-brand/30 bg-brand/10">
          <Sparkles className="h-10 w-10 text-brand" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-content-primary">
          등록된 AI 캐릭터가 없습니다
        </h2>
        <p className="mb-8 max-w-xl leading-relaxed text-content-muted">
          방송을 함께할 AI 동료를 만들어보세요. 외모, 목소리, 페르소나를 조합해 방송 스타일에 맞는
          캐릭터를 빠르게 구성할 수 있습니다.
        </p>
        <button
          type="button"
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-hover active:scale-95"
        >
          <PlusCircle className="h-5 w-5" />
          AI 캐릭터 생성하기
        </button>
      </div>
    </div>
  );
}
