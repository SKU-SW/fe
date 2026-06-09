/**
 * @file 치지직 연동 모달 — SettingsPage / 방송 시작 게이트 공용
 * @created Sprint Chzzk - 치지직 연동 UI
 * @dependsOn src/features/auth/hooks/useChzzkConnect.ts
 * @usedBy src/pages/SettingsPage.tsx, src/pages/DashboardPage.tsx(방송 시작 게이트)
 * 백엔드 callback 이 chzzk-success.html 로 redirect 되도록 변경된 상태를 가정합니다.
 *
 * mode:
 * - "connect": SettingsPage에서 직접 "연동하기" 클릭 시
 * - "gate-not-linked": 방송 시작 시 미연동 상태
 * - "gate-expired": 방송 시작 시 refresh token 만료
 */

import { AlertTriangle, CheckCircle2, ExternalLink, LoaderCircle, XCircle } from "lucide-react";
import { useMemo } from "react";
import { useChzzkConnect } from "@/features/auth/hooks/useChzzkConnect";

export type ChzzkConnectModalMode = "connect" | "gate-not-linked" | "gate-expired";

interface ChzzkConnectModalProps {
  mode: ChzzkConnectModalMode;
  onSuccess: () => void;
  onCancel: () => void;
  authUrlOverride?: string;
}

export function ChzzkConnectModal({ mode, onSuccess, onCancel, authUrlOverride }: ChzzkConnectModalProps) {
  const { connect, cancel, isConnecting, isWaitingForUser, error } = useChzzkConnect({
    onConnected: onSuccess,
  });

  const { title, message } = useMemo(() => {
    if (mode === "gate-not-linked") {
      return {
        title: "방송을 시작하려면 치지직 연동이 필요해요",
        message:
          "Live Buddy가 방송 정보와 채팅을 읽으려면 치지직 계정 연동이 필요합니다. " +
          "아래 버튼을 누르면 시스템 브라우저에서 치지직 인증창이 열립니다.",
      };
    }
    if (mode === "gate-expired") {
      return {
        title: "치지직 연동이 만료되었어요",
        message:
          "치지직 인증 정보가 만료되어 방송을 시작할 수 없습니다. " +
          "30일마다 한 번씩 재연동이 필요합니다. 지금 다시 연결해 주세요.",
      };
    }
    return {
      title: "치지직 계정 연동",
      message:
        "치지직 계정을 연동하면 방송 정보와 채팅을 자동으로 가져올 수 있습니다. " +
        "아래 버튼을 누르면 시스템 브라우저에서 치지직 인증창이 열립니다.",
    };
  }, [mode]);

  const handleCancel = () => {
    cancel();
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chzzk-connect-title"
      onClick={handleCancel}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border-default bg-surface-panel shadow-2xl transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border-default px-6 py-4">
          <div className="flex items-center gap-2">
            {mode === "gate-expired" ? (
              <AlertTriangle className="h-5 w-5 text-status-warning" />
            ) : (
              <ExternalLink className="h-5 w-5 text-brand" />
            )}
            <h2 id="chzzk-connect-title" className="text-base font-semibold text-content-primary">
              {title}
            </h2>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-border-default bg-surface-base p-4 transition-colors">
            <p className="text-sm leading-6 text-content-secondary">{message}</p>
          </div>

          {isWaitingForUser && (
            <div className="rounded-lg border border-brand/30 bg-brand/5 p-4">
              <div className="flex items-start gap-3">
                <LoaderCircle className="mt-0.5 h-5 w-5 animate-spin text-brand" />
                <div className="text-sm leading-6 text-content-secondary">
                  <p className="font-semibold text-content-primary">치지직 인증 대기 중</p>
                  <p className="mt-1 text-xs text-content-muted">
                    치지직 인증을 마치면 브라우저에 "연동 완료" 페이지가 표시됩니다.<br />
                    그 페이지를 본 뒤 이 창으로 돌아오세요.<br />
                    연동 상태는 자동으로 반영되며, 브라우저 창은 잠시 후 자동으로 닫힐 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && !isWaitingForUser && (
            <div className="rounded-lg border border-status-danger/30 bg-status-danger/10 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 h-5 w-5 text-status-danger" />
                <p className="text-sm leading-6 text-status-danger">{error}</p>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border-default bg-surface-base p-4 text-xs leading-5 text-content-muted transition-colors">
            <p className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-status-success" />
              연동 후에도 Live Buddy 계정으로 계속 로그인합니다. 치지직 정보는 방송 시작 시에만 사용됩니다.
            </p>
            <p className="mt-2 text-content-muted">
              · Access Token 1일 / Refresh Token 30일 자동 관리<br />
              · 30일 후 재연동 알림이 표시됩니다
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-default bg-surface-base px-6 py-4 transition-colors">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md border border-border-default bg-surface-panel px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void connect(authUrlOverride)}
            disabled={isConnecting}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                연결 중…
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                치지직 연동하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
