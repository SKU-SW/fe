/**
 * @file 앱 설정 페이지
 * @dependsOn src/shared/stores/themeStore.ts
 * @dependsOn src/shared/stores/appSettingsStore.ts
 * @usedBy src/App.tsx
 */

import { Check, Keyboard, MonitorCog, Palette, RotateCcw } from "lucide-react";
import {
  DEFAULT_PTT_SHORTCUT,
  formatPttShortcut,
  HOTKEY_KEY_OPTIONS,
  useAppSettingsStore,
} from "@/shared/stores/appSettingsStore";
import { THEME_OPTIONS, useThemeStore } from "@/shared/stores/themeStore";

export default function SettingsPage() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const closeToTray = useAppSettingsStore((s) => s.closeToTray);
  const pttShortcut = useAppSettingsStore((s) => s.pttShortcut);
  const setCloseToTray = useAppSettingsStore((s) => s.setCloseToTray);
  const updatePttShortcut = useAppSettingsStore((s) => s.updatePttShortcut);
  const resetPttShortcut = useAppSettingsStore((s) => s.resetPttShortcut);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <section className="rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-brand/10 p-3 text-brand">
            <Palette className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-content-primary">설정</h1>
            <p className="mt-2 text-base text-content-muted">
              앱 테마, 상주 동작, 전역 PTT 단축키를 조정할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

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
              활성화하면 창은 숨겨지고 앱은 계속 실행됩니다. 트레이 메뉴에서 다시 열거나 종료할 수 있습니다.
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-content-muted">현재 단축키</p>
              <p className="mt-1 text-lg font-semibold text-content-primary">{formatPttShortcut(pttShortcut)}</p>
            </div>
            <button
              type="button"
              onClick={resetPttShortcut}
              className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-panel px-3 py-2 text-sm font-medium text-content-secondary hover:border-border-strong hover:bg-surface-hover"
            >
              <RotateCcw className="h-4 w-4" />
              기본값 복원
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="rounded-lg border border-border-default bg-surface-panel p-4">
              <p className="text-sm font-semibold text-content-primary">주 키</p>
              <select
                value={pttShortcut.key}
                onChange={(e) => updatePttShortcut({ key: e.target.value as (typeof HOTKEY_KEY_OPTIONS)[number] })}
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
                  checked={pttShortcut.ctrlOrCmd}
                  onChange={(checked) => updatePttShortcut({ ctrlOrCmd: checked })}
                />
                <ToggleRow
                  label="Shift"
                  checked={pttShortcut.shift}
                  onChange={(checked) => updatePttShortcut({ shift: checked })}
                />
                <ToggleRow
                  label="Alt"
                  checked={pttShortcut.alt}
                  onChange={(checked) => updatePttShortcut({ alt: checked })}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-brand/20 bg-brand/5 p-3 text-xs text-content-muted">
            최소 하나의 보조 키가 필요합니다. 현재 기본값은 {formatPttShortcut(DEFAULT_PTT_SHORTCUT)} 입니다.
          </div>
        </div>
      </section>
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
