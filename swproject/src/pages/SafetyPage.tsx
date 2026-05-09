/**
 * @file 안전관리 페이지 - LLM 유해 단어 필터 관리
 * @dependsOn src/shared/stores/safetyStore.ts
 * @usedBy src/App.tsx (/safety 라우트)
 */

import { useRef, useState } from 'react';
import { Plus, X, Shield, AlertTriangle, Trash2 } from 'lucide-react';
import { useSafetyStore } from '@/shared/stores/safetyStore';

export default function SafetyPage() {
  const words = useSafetyStore((s) => s.words);
  const addWord = useSafetyStore((s) => s.addWord);
  const removeWord = useSafetyStore((s) => s.removeWord);
  const clearWords = useSafetyStore((s) => s.clearWords);

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const ok = addWord(input);
    if (!ok) {
      const trimmed = input.trim();
      setError(trimmed ? '이미 등록된 단어입니다.' : '단어를 입력해주세요.');
      return;
    }
    setInput('');
    setError(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* 안내 카드 */}
      <section className="rounded-xl border border-discord-dark bg-discord-sidebar p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">유해 단어 필터</h2>
            <p className="mt-1 text-sm text-discord-textMuted">
              여기에 등록된 단어가 채팅·발화에 포함되면 AI가 해당 내용을 필터링합니다.
              방송 중 노출되면 안 되는 욕설, 혐오 표현, 민감한 키워드 등을 추가하세요.
            </p>
          </div>
        </div>
      </section>

      {/* 단어 추가 */}
      <section className="rounded-xl border border-discord-dark bg-discord-sidebar p-5">
        <label htmlFor="safety-word-input" className="mb-2 block text-sm font-medium text-white">
          단어 추가
        </label>
        <div className="flex gap-2">
          <input
            id="safety-word-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="필터링할 단어를 입력하세요"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? 'safety-word-error' : undefined}
            className="flex-1 rounded-lg border border-discord-dark bg-discord-main px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <button
            type="button"
            onClick={submit}
            className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            추가
          </button>
        </div>
        {error && (
          <p
            id="safety-word-error"
            className="mt-2 flex items-center gap-1 text-xs text-red-400"
            role="alert"
          >
            <AlertTriangle className="h-3 w-3" />
            {error}
          </p>
        )}
      </section>

      {/* 단어 목록 */}
      <section className="rounded-xl border border-discord-dark bg-discord-sidebar p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">등록된 단어</h3>
            <span className="rounded-full bg-discord-sidebar px-2 py-0.5 text-xs text-discord-text">
              {words.length}
            </span>
          </div>
          {words.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-discord-textMuted hover:bg-discord-sidebar hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              전체 삭제
            </button>
          )}
        </div>

        {words.length === 0 ? (
          <div className="py-10 text-center text-sm text-discord-textMuted">
            등록된 유해 단어가 없습니다.
            <br />
            위 입력란에서 단어를 추가해주세요.
          </div>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="유해 단어 목록">
            {words.map((word) => (
              <li
                key={word}
                className="group flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 py-1 pl-3 pr-1.5 text-sm text-red-300"
              >
                <span className="break-all">{word}</span>
                <button
                  type="button"
                  onClick={() => removeWord(word)}
                  aria-label={`"${word}" 삭제`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-red-300/70 hover:bg-red-500/20 hover:text-red-100 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 전체 삭제 확인 모달 */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-confirm-title"
        >
          <div className="w-full max-w-sm rounded-xl border border-discord-dark bg-discord-sidebar p-5 shadow-xl">
            <h3 id="clear-confirm-title" className="text-base font-semibold text-white">
              모든 단어를 삭제할까요?
            </h3>
            <p className="mt-2 text-sm text-discord-textMuted">
              등록된 {words.length}개의 유해 단어가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-discord-text hover:bg-discord-sidebar transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  clearWords();
                  setShowClearConfirm(false);
                }}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
