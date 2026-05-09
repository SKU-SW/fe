/**
 * @file 방송 시작 전 주의사항 동의 모달
 * @created Sprint 4 - 방송 시작 동의 플로우
 * @dependsOn lucide-react
 * @usedBy src/pages/CharacterPage.tsx
 */

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface BroadcastConfirmModalProps {
  characterName: string;
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

/**
 * 방송 시작 전 주의사항을 안내하고 사용자의 동의를 받는 모달
 * - "다시 받지 않기" 체크박스를 통해 해당 캐릭터의 다음 방송부터 모달 생략 가능
 *   (캐릭터별로 별도 관리 — 다른 캐릭터에는 영향 없음)
 */
export function BroadcastConfirmModal({
  characterName,
  onConfirm,
  onCancel,
}: BroadcastConfirmModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="broadcast-confirm-title"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-discord-dark bg-discord-sidebar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-discord-dark px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-discord-blurple" />
            <h2 id="broadcast-confirm-title" className="text-base font-semibold text-white">
              주의사항
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-discord-textMuted transition hover:bg-discord-sidebar hover:text-discord-textHover"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm leading-relaxed text-discord-text">
            방송을 진행하는 동안에는 AI 캐릭터가 방송 흐름을 따라가기 위해
            <span className="font-semibold text-white"> 항상 스트리머의 목소리를 듣고 있습니다!</span>
          </p>

          <div className="rounded-lg border border-discord-dark bg-discord-sidebar p-3">
            <p className="text-xs leading-relaxed text-discord-textMuted">
              <span className="font-medium text-discord-text">Ctrl + M</span> 단축키를 눌러 마이크를 끄면
              AI 캐릭터는 당신의 목소리를 들을 수 없습니다.
            </p>
          </div>

          <p className="pt-1 text-sm font-medium text-white">
            <span className="text-discord-blurple">{characterName}</span> 캐릭터로 방송을 시작할까요?
          </p>

          {/* 다시 받지 않기 체크박스 */}
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-discord-textMuted select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-discord-dark bg-discord-sidebar text-discord-blurple focus:ring-1 focus:ring-discord-blurple focus:ring-offset-0"
            />
            이 캐릭터에 대해 다시 받지 않기
          </label>
        </div>

        {/* 액션 */}
        <div className="flex items-center justify-end gap-2 border-t border-discord-dark bg-discord-main px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-discord-dark bg-discord-sidebar px-4 py-2 text-sm font-medium text-discord-textHover transition-colors hover:bg-discord-hover"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onConfirm(dontShowAgain)}
            className="rounded-md bg-discord-blurple px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-discord-blurpleHover active:scale-95"
          >
            시작
          </button>
        </div>
      </div>
    </div>
  );
}
