/**
 * @file 대화 기록 초기화 확인 모달
 * "기존 기록값을 다 지우고 새로 시작합니다"
 * @usedBy src/pages/DashboardPage.tsx
 */

import { AlertTriangle, X } from "lucide-react";

interface ResetConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetConfirmModal({ onConfirm, onCancel }: ResetConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-confirm-title"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-border-default bg-surface-panel shadow-2xl transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border-default px-5 py-3.5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand" />
            <h2 id="reset-confirm-title" className="text-base font-semibold text-content-primary">
              기록 초기화
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-content-secondary">
            기존 기록값을 다 지우고 새로 시작합니다.
          </p>
          <p className="mt-2 text-xs text-content-muted">
            지워진 대화 기록은 복구할 수 없습니다.
          </p>
        </div>

        {/* 액션 */}
        <div className="flex items-center justify-end gap-2 border-t border-border-default bg-surface-base px-5 py-3.5 transition-colors">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border-default bg-surface-panel px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-status-danger px-4 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-status-danger-hover"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
