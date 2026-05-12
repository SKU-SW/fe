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
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-discord-dark bg-discord-main p-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-discord-dark bg-discord-sidebar text-discord-blurple focus:ring-1 focus:ring-discord-blurple focus:ring-offset-0"
      />
      <div>
        <p className="text-sm font-semibold text-discord-textHover">{title}</p>
        <p className="mt-1 text-xs leading-5 text-discord-textMuted">{description}</p>
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
      return "OBS 자동 연결과 브라우저 소스 준비가 완료되었습니다. 이제 방송을 시작할 수 있습니다.";
    }
    return "OBS와 브라우저 소스 연결을 자동으로 준비하는 중입니다.";
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
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-discord-dark bg-discord-sidebar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-discord-dark px-6 py-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-discord-blurple" />
            <h2 id="obs-gate-title" className="text-base font-semibold text-white">
              OBS 연결 확인
            </h2>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border border-discord-dark bg-discord-main p-4">
            <div className="flex items-start gap-3">
              {isBusy ? (
                <LoaderCircle className="mt-0.5 h-5 w-5 animate-spin text-discord-blurple" />
              ) : isReady ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-discord-success" />
              ) : (
                <XCircle className="mt-0.5 h-5 w-5 text-discord-warning" />
              )}
              <p className="text-sm leading-6 text-discord-text">{message}</p>
            </div>
            {obsError && !isBusy && (
              <div className="mt-3 rounded-md border border-discord-danger/20 bg-discord-danger/10 px-3 py-2 text-xs leading-5 text-discord-danger">
                <span className="font-semibold">실패 원인:</span> {obsError}
              </div>
            )}
            {obsDiagnostics && !isBusy && (
              <div className="mt-3 rounded-md border border-discord-dark bg-discord-sidebar px-3 py-3 text-xs leading-5 text-discord-textMuted">
                <p><span className="font-semibold text-discord-textHover">연결 대상:</span> {obsDiagnostics.host}:{obsDiagnostics.port}</p>
                <p><span className="font-semibold text-discord-textHover">설정 파일:</span> {obsDiagnostics.configPath}</p>
                <p><span className="font-semibold text-discord-textHover">설정 소스:</span> {configSourceLabel}</p>
                <p><span className="font-semibold text-discord-textHover">서버 활성화:</span> {obsDiagnostics.serverEnabled ? "켜짐" : "꺼짐"}</p>
                <p><span className="font-semibold text-discord-textHover">인증 필요:</span> {obsDiagnostics.authRequired ? "예" : "아니오"}</p>
                {obsDiagnostics.authRequired && (
                  <p><span className="font-semibold text-discord-textHover">비밀번호 감지:</span> {obsDiagnostics.passwordConfigured ? "있음" : "없음"}</p>
                )}
                {obsDiagnostics.obsExecutablePath && (
                  <p><span className="font-semibold text-discord-textHover">OBS 실행 경로:</span> {obsDiagnostics.obsExecutablePath}</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-discord-dark bg-discord-main p-4">
            <p className="text-xs leading-5 text-discord-textMuted">
              배포 후에도 OBS 자동 연결은 서버가 아니라 <span className="font-semibold text-discord-textHover">현재 이 PC의 로컬 OBS</span>를 대상으로 동작합니다.
            </p>
          </div>

          <div className="rounded-lg border border-discord-dark bg-discord-main p-4">
            <p className="text-sm font-semibold text-discord-textHover">오버레이 URL</p>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-discord-dark bg-discord-sidebar px-3 py-2 text-xs text-discord-textMuted">
              <code className="min-w-0 flex-1 truncate">{overlayUrl}</code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(overlayUrl).catch(() => undefined)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-discord-blurple transition-colors hover:bg-discord-hover"
              >
                <Copy className="h-3.5 w-3.5" />
                복사
              </button>
            </div>
            <p className="mt-2 text-xs leading-5 text-discord-textMuted">
              OBS에서 브라우저 소스를 추가할 때 위 주소를 그대로 넣으면 됩니다.
            </p>
          </div>

          {!isReady && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-discord-textHover">수동 연결 체크리스트</p>
              <ChecklistItem
                title="OBS Studio가 현재 실행 중입니다"
                description="OBS를 직접 실행한 뒤 현재 방송용 씬을 열어둔 상태인지 확인해주세요."
                checked={checkedObsRunning}
                onChange={setCheckedObsRunning}
              />
              <ChecklistItem
                title="오버레이 URL을 OBS 브라우저 소스에 추가했습니다"
                description="브라우저 소스를 만들고 위 URL을 입력한 뒤, 화면에 오버레이가 나오는지 확인해주세요."
                checked={checkedOverlayAdded}
                onChange={setCheckedOverlayAdded}
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-discord-dark bg-discord-main px-6 py-4">
          {!isReady && (
            <button
              type="button"
              onClick={() => window.electronAPI?.shell?.openExternal("https://obsproject.com/download").catch(() => undefined)}
              className="inline-flex items-center gap-2 rounded-md border border-discord-dark bg-discord-sidebar px-3 py-2 text-sm font-medium text-discord-textHover transition-colors hover:bg-discord-hover"
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
              className="rounded-md border border-discord-dark bg-discord-sidebar px-4 py-2 text-sm font-medium text-discord-textHover transition-colors hover:bg-discord-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              다시 시도
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-discord-dark bg-discord-sidebar px-4 py-2 text-sm font-medium text-discord-textHover transition-colors hover:bg-discord-hover"
          >
            취소
          </button>
          {!isReady && (
            <button
              type="button"
              onClick={onForceStart}
              className="rounded-md border border-discord-warning/30 bg-discord-warning/10 px-4 py-2 text-sm font-semibold text-discord-warning transition-colors hover:bg-discord-warning/20"
            >
              OBS 없이 시작
            </button>
          )}
          <button
            type="button"
            onClick={isReady ? onConfirmManualReady : onConfirmManualReady}
            disabled={!isReady && !canStartManually}
            className="rounded-md bg-discord-blurple px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-discord-blurpleHover disabled:cursor-not-allowed disabled:opacity-50"
          >
            방송 시작
          </button>
        </div>
      </div>
    </div>
  );
}
