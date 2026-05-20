/**
 * @file 앱 설정 페이지
 * @dependsOn src/shared/stores/themeStore.ts
 * @usedBy src/App.tsx
 */

import { Check, Palette } from "lucide-react";
import { THEME_OPTIONS, useThemeStore } from "@/shared/stores/themeStore";

export default function SettingsPage() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

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
              앱의 테마와 표시 스타일을 조정할 수 있습니다. 지금은 테마 선택을 먼저 제공합니다.
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
    </div>
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
