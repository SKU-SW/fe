/**
 * @file 캐릭터 기본 정보 입력 섹션
 * @dependsOn src/shared/types/character.ts (CharacterConfig)
 * @usedBy src/features/character/components/CharacterSettings.tsx
 *
 * 호출어 검증 규칙 (BE 의 contains 매칭 폭주 방지):
 *   - 빈 입력 금지
 *   - 콤마/공백 다중 입력 금지 (1회 1단어)
 *   - 정확 중복 금지
 *   - 부분 문자열 충돌 금지 (양방향) — "하람아" 와 "아" 처럼 한쪽이 다른 쪽을 포함하면 거부
 *     이유: BE 매칭이 normalizedMessage.contains(triggerWord) 라 "아" 가 등록되면
 *           거의 모든 발화에 매칭됨 → LLM 폭주
 *   - 1글자 호출어는 등록 가능하지만 인라인 경고 표시 (사용자 책임)
 */

import { useRef, useState } from "react";
import { AlertTriangle, MessageCircle, User, X } from "lucide-react";
import type { CharacterConfig } from "@/shared/types/character";

interface BasicInfoSectionProps {
  config: CharacterConfig;
  onChange: (config: CharacterConfig) => void;
}

const MAX_CALL_WORDS = 3;

/**
 * 새 호출어가 기존 호출어와 부분 문자열 관계인지 검사 (양방향).
 * - existing.includes(candidate): 기존이 새 것을 포함 → 새 것은 더 짧은 부분 문자열
 * - candidate.includes(existing): 새 것이 기존을 포함 → 기존이 더 짧은 부분 문자열
 * 둘 다 BE contains 매칭에서 충돌 발생.
 */
function findConflictingWord(candidate: string, existing: string[]): string | null {
  for (const word of existing) {
    if (word.includes(candidate) || candidate.includes(word)) {
      return word;
    }
  }
  return null;
}

export function BasicInfoSection({ config, onChange }: BasicInfoSectionProps) {
  const [callWordInput, setCallWordInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  /**
   * IME 조합 상태 추적 (한글/일본어/중국어 등)
   * - composition 중에는 input.value 가 마지막 글자 미반영 상태
   * - Enter 또는 추가 버튼 클릭이 그 시점에 들어오면 짧은 글자로 거부됨
   * - useState 대신 useRef 사용 — 비동기 리렌더 race 방지 (handler 실행 즉시 최신값 보장)
   */
  const isComposingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reachedMax = config.callWords.length >= MAX_CALL_WORDS;

  const addCallWord = () => {
    if (reachedMax) return;
    // IME 조합 중이면 input.value 가 미완성 상태 — input element 의 value 를 직접 읽어 최신화
    // (React state 보다 DOM value 가 우선 — composition 중에는 React state 가 늦게 업데이트됨)
    const sourceValue = inputRef.current?.value ?? callWordInput;
    const trimmed = sourceValue.trim();

    if (!trimmed) {
      setError("호출어를 입력해주세요.");
      return;
    }

    if (/[,，\s]/.test(trimmed)) {
      setError("호출어 한 개씩 입력해주세요. 콤마나 공백은 사용할 수 없습니다.");
      return;
    }

    if (config.callWords.includes(trimmed)) {
      setError("이미 등록된 호출어입니다.");
      return;
    }

    const conflict = findConflictingWord(trimmed, config.callWords);
    if (conflict) {
      setError(
        `"${conflict}" 와 충돌합니다. 한쪽이 다른 쪽을 포함하면 호출어 매칭이 폭주할 수 있어요.`
      );
      return;
    }

    onChange({ ...config, callWords: [...config.callWords, trimmed] });
    setCallWordInput("");
    setError(null);
  };

  const removeCallWord = (word: string) => {
    onChange({
      ...config,
      callWords: config.callWords.filter((callWord) => callWord !== word),
    });
    // 삭제하면 충돌 가능성 변하므로 에러 초기화
    setError(null);
  };

  return (
    <section className="space-y-6 rounded-lg border border-discord-dark bg-discord-sidebar p-6">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-discord-blurple" />
        <h3 className="text-lg font-semibold text-discord-textHover">기본 정보</h3>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-discord-text">AI 캐릭터 이름</label>
        <input
          type="text"
          value={config.name}
          onChange={(event) => onChange({ ...config, name: event.target.value })}
          placeholder="예: 아리, 도우미, 짝꿍"
          className="w-full rounded-md border border-discord-dark bg-discord-main px-4 py-2 text-discord-textHover placeholder-discord-textMuted focus:border-discord-blurple focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-discord-text">
            호출어 등록{" "}
            <span className="text-xs text-discord-textMuted">(최대 {MAX_CALL_WORDS}개)</span>
          </label>
          <span className="text-xs text-discord-textMuted">
            {config.callWords.length} / {MAX_CALL_WORDS}
          </span>
        </div>

        <div className="mb-2 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={callWordInput}
            onChange={(event) => {
              setCallWordInput(event.target.value);
              if (error) setError(null);
            }}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={(event) => {
              isComposingRef.current = false;
              // composition 종료 후 최종 값을 React state 에 동기화 (브라우저별 timing 차이 보정)
              setCallWordInput((event.target as HTMLInputElement).value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              // 한글 IME 조합 중인 Enter 는 무시 — 다중 가드 (브라우저별 차이)
              //   1. isComposingRef: composition start/end 로 추적한 ref
              //   2. event.nativeEvent.isComposing: 모던 브라우저 표준 속성
              //   3. event.keyCode === 229: IME 처리 중인 모든 키 (legacy 안전망)
              if (
                isComposingRef.current ||
                event.nativeEvent.isComposing ||
                event.keyCode === 229
              ) {
                return;
              }
              event.preventDefault();
              addCallWord();
            }}
            disabled={reachedMax}
            placeholder={reachedMax ? "최대 개수에 도달했습니다" : "예: XX야"}
            className="flex-1 rounded-md border border-discord-dark bg-discord-main px-4 py-2 text-discord-textHover placeholder-discord-textMuted focus:border-discord-blurple focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => {
              // 추가 버튼 클릭 시 IME 조합 중이면 잠시 대기 (조합 종료 → addCallWord)
              // - 마우스 클릭으로 입력란이 blur 되면 자동으로 compositionEnd 발화
              // - 안전을 위해 직접 blur 호출 후 다음 tick 에 addCallWord
              if (isComposingRef.current) {
                inputRef.current?.blur();
                setTimeout(() => {
                  inputRef.current?.focus();
                  addCallWord();
                }, 0);
                return;
              }
              addCallWord();
            }}
            disabled={reachedMax || !callWordInput.trim()}
            className="rounded-md bg-discord-blurple px-6 py-2 font-semibold text-white transition-colors hover:bg-discord-blurpleHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            추가
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-3 flex items-start gap-1.5 text-xs text-discord-warning"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {config.callWords.some((w) => w.length < 2) && (
          <p
            role="status"
            className="mb-3 flex items-start gap-1.5 rounded-md border border-discord-warning/30 bg-discord-warning/10 px-3 py-2 text-xs text-discord-warning"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              1글자 호출어는 일반 단어와 충돌해 의도치 않은 발화에서도 매칭될 수 있습니다.
              자주 LLM이 호출되어 비용이 늘 수 있어요.
            </span>
          </p>
        )}

        {config.callWords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {config.callWords.map((word) => (
              <button
                key={word}
                type="button"
                onClick={() => removeCallWord(word)}
                title="클릭하여 삭제"
                className="group relative flex items-center gap-2 rounded-md border border-discord-blurple/30 bg-discord-blurple/15 px-3 py-1.5 transition-colors hover:border-discord-danger/40 hover:bg-discord-danger/15"
              >
                <MessageCircle className="h-3 w-3 text-discord-blurple transition-opacity group-hover:opacity-0" />
                <X className="absolute left-3 h-3 w-3 text-discord-danger opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="text-sm text-discord-blurple transition-colors group-hover:text-discord-danger">
                  {word}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
