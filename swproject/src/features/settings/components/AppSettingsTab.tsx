/**
 * @file 앱 설정 탭 — 연동 계정, 테마, 상주 실행, PTT 단축키
 * @dependsOn src/shared/stores/themeStore.ts
 * @dependsOn src/shared/stores/appSettingsStore.ts
 * @dependsOn src/features/auth/hooks/useChzzkStatus.ts
 * @dependsOn src/features/auth/components/ChzzkConnectModal.tsx
 * @usedBy src/pages/SettingsPage.tsx
 */

import {
  Check,
  CheckCircle2,
  ExternalLink,
  Keyboard,
  Link2,
  LoaderCircle,
  MonitorCog,
  RotateCcw,
  Unlink,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PTT_SHORTCUT,
  formatPttShortcut,
  HOTKEY_KEY_OPTIONS,
  type PttShortcutSettings,
  useAppSettingsStore,
} from "@/shared/stores/appSettingsStore";
import { THEME_OPTIONS, useThemeStore } from "@/shared/stores/themeStore";
import { disconnectChzzk } from "@/features/auth/api/authApi";
import { getChzzkModalMode, isChzzkExpired, isChzzkReady } from "@/features/auth/lib/chzzkStatus";
import { useChzzkStatus } from "@/features/auth/hooks/useChzzkStatus";
import {
  ChzzkConnectModal,
  type ChzzkConnectModalMode,
} from "@/features/auth/components/ChzzkConnectModal";

export function AppSettingsTab() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const closeToTray = useAppSettingsStore((s) => s.closeToTray);
  const pttShortcut = useAppSettingsStore((s) => s.pttShortcut);
  const setCloseToTray = useAppSettingsStore((s) => s.setCloseToTray);
  const setPttShortcut = useAppSettingsStore((s) => s.setPttShortcut);

  const { status, isLoading, error, refetch } = useChzzkStatus();
  const [chzzkModalMode, setChzzkModalMode] = useState<ChzzkConnectModalMode | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const [pttDraft, setPttDraft] = useState<PttShortcutSettings>(pttShortcut);
  const [showResetNotice, setShowResetNotice] = useState(false);

  useEffect(() => {
    setPttDraft(pttShortcut);
    setShowResetNotice(false);
  }, [pttShortcut]);

  const isPttDirty = useMemo(
    () => JSON.stringify(pttDraft) !== JSON.stringify(pttShortcut),
    [pttDraft, pttShortcut]
  );
  const isPttValid = pttDraft.ctrlOrCmd || pttDraft.shift || pttDraft.alt;

  const handlePttSave = () => {
    if (!isPttDirty || !isPttValid) return;
    setPttShortcut(pttDraft);
    setShowResetNotice(false);
  };

  const handlePttCancel = () => {
    setPttDraft(pttShortcut);
    setShowResetNotice(false);
  };

  const handlePttResetDefault = () => {
    setPttDraft(DEFAULT_PTT_SHORTCUT);
    setShowResetNotice(true);
  };

  const handleDisconnect = async () => {
    if (!window.confirm("치지직 연동을 해제하시겠어요? 방송을 시작하려면 다시 연동해야 합니다.")) {
      return;
    }
    setIsDisconnecting(true);
    setDisconnectError(null);
    try {
      await disconnectChzzk();
      await refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "치지직 연동 해제에 실패했습니다.";
      setDisconnectError(message);
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 연동 계정 */}
      <section className="rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
        <div className="mb-5 flex items-start gap-4">
          <div className="rounded-xl bg-brand/10 p-3 text-brand">
            <Link2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-content-primary">연동 계정</h2>
            <p className="mt-1 text-sm text-content-muted">
              방송 시작과 채팅 분석을 위해 치지직 계정을 연동하세요.
              인증은 30일마다 한 번씩 갱신해야 합니다.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-surface-raised p-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-content-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              연동 상태 확인 중…
            </div>
          ) : error ? (
            <div className="rounded-md border border-status-danger/30 bg-status-danger/10 p-3 text-sm text-status-danger">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <img
                    src="/icons/chzzk.png"
                    alt="치지직"
                    className="h-10 w-10 shrink-0 rounded-lg"
                    draggable={false}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-content-primary">치지직</p>
                      {isChzzkExpired(status) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/10 px-2 py-0.5 text-xs font-medium text-status-warning">
                          <LoaderCircle className="h-3 w-3" />
                          인증 만료
                        </span>
                      ) : isChzzkReady(status) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-status-success/10 px-2 py-0.5 text-xs font-medium text-status-success">
                          <CheckCircle2 className="h-3 w-3" />
                          연동됨
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-surface-panel px-2 py-0.5 text-xs font-medium text-content-muted">
                          미연동
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-content-muted">
                      {isChzzkExpired(status)
                        ? "치지직 인증이 만료되었습니다. 다시 연동해야 방송을 시작할 수 있습니다."
                        : isChzzkReady(status)
                          ? "연동되었습니다. 방송을 시작할 수 있습니다."
                          : "방송 정보·채팅을 가져오려면 연동이 필요합니다."}
                    </p>
                  </div>
                </div>

                {isChzzkReady(status) ? (
                  <button
                    type="button"
                    onClick={() => void handleDisconnect()}
                    disabled={isDisconnecting}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border-default bg-surface-panel px-3 py-2 text-sm font-medium text-content-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isDisconnecting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4" />
                    )}
                    연동 해제
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setChzzkModalMode(getChzzkModalMode(status))}
                    className="inline-flex shrink-0 items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-content-inverse transition-colors hover:bg-brand-hover"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {isChzzkExpired(status) ? "치지직 재연동하기" : "치지직 연동하기"}
                  </button>
                )}
              </div>

              {disconnectError && (
                <div className="rounded-md border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs leading-5 text-status-danger">
                  {disconnectError}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 테마 선택 */}
      <section className="rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-content-primary">테마 선택</h2>
          <p className="mt-1 text-sm text-content-muted">
            기본 다크/라이트 테마와 함께, 샘플 테마로 봄 테마를 추가했습니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {THEME_OPTIONS.map((option) => {
            const selected = theme === option.name;

            return (
              <button
                key={option.name}
                type="button"
                onClick={() => setTheme(option.name)}
                className={`relative rounded-xl border p-4 text-left transition-colors ${
                  selected
                    ? "border-brand bg-brand/10"
                    : "border-border-default bg-surface-raised hover:border-border-strong hover:bg-surface-hover"
                }`}
                aria-pressed={selected}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-2">
                    <ThemePreviewSwatch themeName={option.name} />
                  </div>
                  {selected && (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-content-inverse">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>

                <p className="text-lg font-semibold text-content-primary">{option.label}</p>
                <p className="mt-1 text-sm text-content-muted">{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 상주 실행 */}
      <section className="rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
        <div className="mb-5 flex items-start gap-4">
          <div className="rounded-xl bg-brand/10 p-3 text-brand">
            <MonitorCog className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-content-primary">상주 실행</h2>
            <p className="mt-1 text-sm text-content-muted">
              창을 닫았을 때 앱을 종료하지 않고 트레이/메뉴바에 상주하도록 설정합니다.
            </p>
          </div>
        </div>

        <label className="flex items-start justify-between gap-4 rounded-xl border border-border-default bg-surface-raised p-4">
          <div>
            <p className="text-base font-semibold text-content-primary">닫기 버튼을 누르면 트레이로 보내기</p>
            <p className="mt-1 text-sm text-content-muted">
              활성화하면 창은 숨겨지고 앱은 계속 실됩니다. 트레이 메뉴에서 다시 열거나 종료할 수 있습니다.
            </p>
          </div>
          <input
            type="checkbox"
            checked={closeToTray}
            onChange={(e) => setCloseToTray(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-border-default bg-surface-base text-brand focus:ring-1 focus:ring-brand focus:ring-offset-0"
          />
        </label>
      </section>

      {/* 전역 PTT 단축키 */}
      <section className="rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
        <div className="mb-5 flex items-start gap-4">
          <div className="rounded-xl bg-brand/10 p-3 text-brand">
            <Keyboard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-content-primary">전역 Push-to-Talk 단축키</h2>
            <p className="mt-1 text-sm text-content-muted">
              백그라운드에서도 동작하는 PTT 조합입니다. 누르고 있는 동안만 녹음되고, 떼면 변환됩니다.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border-default bg-surface-raised p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border-default bg-surface-panel p-4">
              <p className="text-sm text-content-muted">적용 중</p>
              <p className="mt-1 text-lg font-semibold text-content-primary">
                {formatPttShortcut(pttShortcut)}
              </p>
            </div>
            <div className="rounded-lg border border-border-default bg-surface-panel p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-content-muted">미리보기</p>
                {isPttDirty && (
                  <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    저장 전
                  </span>
                )}
              </div>
              <p className="mt-1 text-lg font-semibold text-content-primary">
                {formatPttShortcut(pttDraft)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="rounded-lg border border-border-default bg-surface-panel p-4">
              <p className="text-sm font-semibold text-content-primary">주 키</p>
              <select
                value={pttDraft.key}
                onChange={(e) => {
                  setPttDraft((prev) => ({
                    ...prev,
                    key: e.target.value as (typeof HOTKEY_KEY_OPTIONS)[number],
                  }));
                  setShowResetNotice(false);
                }}
                className="mt-2 w-full rounded-lg border border-border-default bg-surface-base px-3 py-2 text-sm text-content-primary outline-none focus:border-brand"
              >
                {HOTKEY_KEY_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-lg border border-border-default bg-surface-panel p-4">
              <p className="text-sm font-semibold text-content-primary">보조 키</p>
              <div className="mt-3 space-y-3 text-sm text-content-secondary">
                <ToggleRow
                  label="Ctrl/Cmd"
                  checked={pttDraft.ctrlOrCmd}
                  onChange={(checked) => {
                    setPttDraft((prev) => ({ ...prev, ctrlOrCmd: checked }));
                    setShowResetNotice(false);
                  }}
                />
                <ToggleRow
                  label="Shift"
                  checked={pttDraft.shift}
                  onChange={(checked) => {
                    setPttDraft((prev) => ({ ...prev, shift: checked }));
                    setShowResetNotice(false);
                  }}
                />
                <ToggleRow
                  label="Alt"
                  checked={pttDraft.alt}
                  onChange={(checked) => {
                    setPttDraft((prev) => ({ ...prev, alt: checked }));
                    setShowResetNotice(false);
                  }}
                />
              </div>
            </div>
          </div>

          {!isPttValid && (
            <p className="mt-4 text-sm text-status-warning">
              Ctrl/Cmd · Shift · Alt 중 최소 하나는 선택해야 합니다.
            </p>
          )}

          {showResetNotice && (
            <div className="mt-4 rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm text-content-muted">
              기본값을 미리 적용했습니다. 저장을 눌러야 실제로 반영됩니다.
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handlePttCancel}
              disabled={!isPttDirty}
              className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-panel px-3 py-2 text-sm font-medium text-content-secondary hover:border-border-strong hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handlePttResetDefault}
              className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-panel px-3 py-2 text-sm font-medium text-content-secondary hover:border-border-strong hover:bg-surface-hover"
            >
              <RotateCcw className="h-4 w-4" />
              기본값 복원
            </button>
            <button
              type="button"
              onClick={handlePttSave}
              disabled={!isPttDirty || !isPttValid}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-content-inverse hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              저장
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-brand/20 bg-brand/5 p-3 text-xs text-content-muted">
            최소 하나의 보조 키가 필요합니다. 현재 기본값은 {formatPttShortcut(DEFAULT_PTT_SHORTCUT)} 입니다.
          </div>
        </div>
      </section>

      {chzzkModalMode && (
        <ChzzkConnectModal
          mode={chzzkModalMode}
          onSuccess={() => {
            setChzzkModalMode(null);
            void refetch();
          }}
          onCancel={() => setChzzkModalMode(null)}
        />
      )}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border-default bg-surface-base text-brand focus:ring-1 focus:ring-brand focus:ring-offset-0"
      />
    </label>
  );
}

function ThemePreviewSwatch({ themeName }: { themeName: string }) {
  const toneClass =
    themeName === "dark"
      ? ["bg-[#111214]", "bg-[#232428]", "bg-[#5865F2]"]
      : themeName === "spring"
      ? ["bg-[#fff9f4]", "bg-[#faefe8]", "bg-[#d8627d]"]
      : ["bg-[#fafbfc]", "bg-[#f0f4f8]", "bg-[#4f46e5]"];

  return (
    <div className="flex items-center gap-1.5">
      {toneClass.map((tone) => (
        <span key={tone} className={`h-6 w-6 rounded-md border border-black/10 ${tone}`} />
      ))}
    </div>
  );
}
