/**
 * @file OBS 준비 게이트 모달
 * @created Sprint OBS Gate
 * @dependsOn lucide-react
 * @usedBy src/pages/CharacterPage.tsx
 */

import { AlertTriangle, CheckCircle2, Copy, ExternalLink, LoaderCircle, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { ObsDiagnostics, ObsLaunchStatus } from "@/features/broadcast/hooks/useObsLaunch";

interface ObsGateModalProps {
  obsStatus: ObsLaunchStatus;
  obsError: string | null;
  obsDiagnostics: ObsDiagnostics | null;
  overlayUrl: string;
  onRetry: () => void;
  onConfirmManualReady: () => void;
  onForceStart: () => void;
  onCancel: () => void;
}

function ChecklistItem({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border-default bg-surface-base p-3 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-border-default bg-surface-panel text-brand focus:ring-1 focus:ring-brand focus:ring-offset-0"
      />
      <div>
        <p className="text-sm font-semibold text-content-primary">{title}</p>
        <p className="mt-1 text-xs leading-5 text-content-muted">{description}</p>
      </div>
    </label>
  );
}

export function ObsGateModal({
  obsStatus,
  obsError,
  obsDiagnostics,
  overlayUrl,
  onRetry,
  onConfirmManualReady,
  onForceStart,
  onCancel,
}: ObsGateModalProps) {
  const [checkedObsRunning, setCheckedObsRunning] = useState(false);
  const [checkedOverlayAdded, setCheckedOverlayAdded] = useState(false);

  const isBusy = obsStatus === "connecting" || obsStatus === "detecting" || obsStatus === "launching";
  const isReady = obsStatus === "setup_ok";
  const canStartManually = checkedObsRunning && checkedOverlayAdded;
  const configSourceLabel = obsDiagnostics?.configSource === "portable"
    ? "portable OBS 설정"
    : obsDiagnostics?.configSource === "standard"
      ? "기본 OBS 설정"
      : "기본값(설정 파일 미발견)";

  const message = useMemo(() => {
    if (obsStatus === "not_found") {
      return "OBS Studio가 설치되어 있지 않습니다. 먼저 설치한 뒤 아래 체크리스트를 따라 수동으로 연결해주세요.";
    }
    if (obsStatus === "timeout") {
      return "OBS가 실행 중이지 않거나 응답하지 않습니다. OBS를 직접 실행한 뒤 다시 시도하거나 수동 연결을 진행해주세요.";
    }
    if (obsStatus === "auth_required") {
      return "OBS WebSocket 비밀번호가 설정되어 있습니다. OBS → 도구 → WebSocket 서버 설정에서 비밀번호를 확인한 뒤 다시 시도하거나 URL을 직접 추가해주세요.";
    }
    if (obsStatus === "setup_failed" || obsStatus === "error") {
      return "자동 브라우저 소스 설정에 실패했습니다. 아래 URL을 OBS 브라우저 소스로 직접 추가한 뒤 체크리스트를 완료해주세요.";
    }
    if (isReady) {
      return "OBS에 오버레이 브라우저 소스가 자동으로 추가됐어요. 이제 OBS 창에서 오버레이 위치·크기를 정리한 뒤, 준비되면 아래 '방송 시작'을 눌러주세요. (이 창은 직접 시작할 때까지 닫히지 않습니다)";
    }
    return "OBS와 브라우저 소스 연결을 자동으로 준비하는 중입니다. 잠시만 기다려주세요…";
  }, [isReady, obsStatus]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="obs-gate-title"
      onClick={onCancel}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border-default bg-surface-panel shadow-2xl transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-default px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-brand" />
            <h2 id="obs-gate-title" className="text-base font-semibold text-content-primary">
              OBS 연결 확인
            </h2>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="rounded-lg border border-border-default bg-surface-base p-4 transition-colors">
            <div className="flex items-start gap-3">
              {isBusy ? (
                <LoaderCircle className="mt-0.5 h-5 w-5 animate-spin text-brand" />
              ) : isReady ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-status-success" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 text-status-warning" />
              )}
              <p className="text-sm leading-6 text-content-secondary">{message}</p>
            </div>
            {obsError && !isBusy && (
              <div className="mt-3 rounded-md border border-status-danger/20 bg-status-danger/10 px-3 py-2 text-xs leading-5 text-status-danger">
                <span className="font-semibold">실패 원인:</span> {obsError}
              </div>
            )}
            {obsDiagnostics && !isBusy && (
              <div className="mt-3 rounded-md border border-border-default bg-surface-panel px-3 py-3 text-xs leading-5 text-content-muted transition-colors">
                <p><span className="font-semibold text-content-primary">연결 대상:</span> {obsDiagnostics.host}:{obsDiagnostics.port}</p>
                <p><span className="font-semibold text-content-primary">설정 파일:</span> {obsDiagnostics.configPath}</p>
                <p><span className="font-semibold text-content-primary">설정 소스:</span> {configSourceLabel}</p>
                <p><span className="font-semibold text-content-primary">서버 활성화:</span> {obsDiagnostics.serverEnabled ? "켜짐" : "꺼짐"}</p>
                <p><span className="font-semibold text-content-primary">인증 필요:</span> {obsDiagnostics.authRequired ? "예" : "아니오"}</p>
                {obsDiagnostics.authRequired && (
                  <p><span className="font-semibold text-content-primary">비밀번호 감지:</span> {obsDiagnostics.passwordConfigured ? "있음" : "없음"}</p>
                )}
                {obsDiagnostics.obsExecutablePath && (
                  <p><span className="font-semibold text-content-primary">OBS 실행 경로:</span> {obsDiagnostics.obsExecutablePath}</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border-default bg-surface-base p-4 transition-colors">
            <p className="text-xs leading-5 text-content-muted">
              배포 후에도 OBS 자동 연결은 서버가 아니라 <span className="font-semibold text-content-primary">현재 이 PC의 로컬 OBS</span>를 대상으로 동작합니다.
            </p>
          </div>

          <div className="rounded-lg border border-border-default bg-surface-base p-4 transition-colors">
            <p className="text-sm font-semibold text-content-primary">오버레이 URL</p>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-border-default bg-surface-panel px-3 py-2 text-xs text-content-muted transition-colors">
              <code className="min-w-0 flex-1 truncate">{overlayUrl}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(overlayUrl).catch(() => undefined)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-brand transition-colors hover:bg-surface-hover"
              >
                <Copy className="h-3.5 w-3.5" />
                복사
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-content-muted">
              자동 연결이 되면 이 주소가 OBS 브라우저 소스로 <span className="font-semibold text-content-primary">자동 추가</span>됩니다.
              직접 추가할 때만 이 주소를 복사해 사용하세요. <span className="font-semibold text-content-primary">(배포본에서는 5174 포트가 정상입니다)</span>
            </p>
          </div>

          {isReady && (
            <div className="rounded-lg border border-status-success/30 bg-status-success/10 p-4">
              <p className="text-sm font-semibold text-content-primary">방송 시작 전, OBS에서 확인하세요</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-5 text-content-secondary">
                <li>OBS 창으로 이동합니다.</li>
                <li>방송용 씬에 오버레이 브라우저 소스가 추가됐는지 확인합니다.</li>
                <li>오버레이의 위치와 크기를 원하는 대로 조정합니다.</li>
                <li>모두 준비되면 아래 <span className="font-semibold text-content-primary">방송 시작</span>을 누릅니다.</li>
              </ol>
            </div>
          )}

          {!isReady && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-content-primary">자동 연결이 안 될 때 — 수동 연결 체크리스트</p>
              <ChecklistItem
                title="1. OBS Studio가 현재 실행 중입니다"
                description="OBS를 직접 실행하고, 방송에 사용할 씬을 열어둔 상태인지 확인해주세요."
                checked={checkedObsRunning}
                onChange={setCheckedObsRunning}
              />
              <ChecklistItem
                title="2. 위 오버레이 URL을 OBS 브라우저 소스로 추가했습니다"
                description="OBS에서 소스 + → 브라우저 → URL 칸에 위 주소를 붙여넣고, 화면에 오버레이가 보이는지 확인해주세요."
                checked={checkedOverlayAdded}
                onChange={setCheckedOverlayAdded}
              />
              <p className="text-xs leading-5 text-content-muted">두 항목을 모두 체크하면 아래 '방송 시작' 버튼이 활성화됩니다.</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border-default bg-surface-base px-6 py-4 transition-colors">
          {!isReady && (
            <button
              type="button"
              onClick={() => window.electronAPI?.shell?.openExternal("https://obsproject.com/download").catch(() => undefined)}
              className="inline-flex items-center gap-2 rounded-md border border-border-default bg-surface-panel px-3 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
            >
              <ExternalLink className="h-4 w-4" />
              OBS 다운로드
            </button>
          )}
          {!isReady && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isBusy}
              className="rounded-md border border-border-default bg-surface-panel px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              다시 시도
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border-default bg-surface-panel px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-hover"
          >
            취소
          </button>
          {!isReady && (
            <button
              type="button"
              onClick={onForceStart}
              className="rounded-md border border-status-warning/30 bg-status-warning/10 px-4 py-2 text-sm font-semibold text-status-warning transition-colors hover:bg-status-warning/20"
            >
              OBS 없이 시작
            </button>
          )}
          <button
            type="button"
            onClick={onConfirmManualReady}
            disabled={!isReady && !canStartManually}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            방송 시작
          </button>
        </div>
      </div>
    </div>
  );
}
