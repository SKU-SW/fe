/**
 * @file 방송 중 앱 종료 확인 모달
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @dependsOn src/features/broadcast/api/broadcastApi.ts
 * @usedBy src/components/AppInitializer.tsx
 *
 * Electron main 이 창 닫기를 시도할 때 방송 중이면 renderer 에게
 * `broadcast:confirm-quit` 이벤트를 보낸다. 이 모달이 뜨고,
 * 사용자가 "방송 종료 후 나가기"를 누르면 terminate API 호출 후
 * `app:quit-confirmed` IPC 로 실제 종료를 허용한다.
 */

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { terminateBroadcast } from "@/features/broadcast/api/broadcastApi";

interface BroadcastQuitConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** 기본: "방송이 진행 중입니다". 네트워크 끊김 등 다른 상황에서는 커스텀 메시지 사용 */
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export function BroadcastQuitConfirmModal({
  open,
  onConfirm,
  onCancel,
  title = "방송이 진행 중입니다",
  description = "앱을 종료하면 방송도 함께 종료됩니다. 정말 종료하시겠습니까?",
  confirmLabel = "방송 종료 후 나가기",
}: BroadcastQuitConfirmModalProps) {
  const [isTerminating, setIsTerminating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleTerminateAndQuit = async () => {
    setIsTerminating(true);
    setError(null);
    try {
      await terminateBroadcast();
      useAIModeStore.getState().clearBroadcast();
      onConfirm();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "방송 종료에 실패했습니다. 다시 시도해주세요.";
      setError(message);
      setIsTerminating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-border-strong bg-surface-panel p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-danger/10">
            <AlertTriangle className="h-5 w-5 text-status-danger" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-content-primary">{title}</h3>
            <p className="mt-1 text-sm text-content-secondary">{description}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-content-muted transition-colors hover:bg-surface-hover hover:text-content-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-status-danger">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isTerminating}
            className="rounded-md border border-border-default bg-surface-base px-4 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleTerminateAndQuit}
            disabled={isTerminating}
            className="rounded-md bg-status-danger px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-status-danger/90 disabled:opacity-50"
          >
            {isTerminating ? "종료 중..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
