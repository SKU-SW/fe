/**
 * @file 방송 설정 탭 — AI 선제 반응 토글 (실 API 연동) + 립싱크 실험 토글 (로컬)
 * @dependsOn src/features/settings/hooks/useBroadcastSettings.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy src/pages/SettingsPage.tsx
 */

import { AlertCircle, LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { useBroadcastSettings } from "@/features/settings/hooks/useBroadcastSettings";
import { useAIModeStore } from "@/shared/stores/aiModeStore";

export function BroadcastSettingsTab() {
  const {
    aiProactiveToChat,
    isLoading,
    isPending,
    error,
    setAiProactive,
    resetToDefault,
  } = useBroadcastSettings();

  const lipSyncEnabled = useAIModeStore((s) => s.toggles.lipSyncEnabled);
  const setToggle = useAIModeStore((s) => s.setToggle);

  const handleProactiveChange = async (next: boolean) => {
    try {
      await setAiProactive(next);
    } catch {
      // 에러는 hook 내부에서 setError로 처리됨
    }
  };

  const handleReset = async () => {
    if (!window.confirm("방송 설정을 기본값으로 되돌리시겠어요? (AI 선제 반응 = 켜짐)")) {
      return;
    }
    try {
      await resetToDefault();
    } catch {
      // 에러는 hook 내부에서 처리
    }
  };

  return (
    <div className="space-y-6">
      {/* AI 선제 반응 */}
      <section className="rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-brand/10 p-3 text-brand">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-content-primary">AI 선제 반응</h2>
              <p className="mt-1 text-sm text-content-muted">
                스트리머의 호출이 없어도 AI 캐릭터가 채팅·방송 흐름을 보고 먼저 반응합니다.
              </p>
            </div>
          </div>

          {isLoading && (
            <LoaderCircle className="mt-2 h-4 w-4 animate-spin text-content-muted" />
          )}
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-status-danger/30 bg-status-danger/10 p-3 text-xs font-bold text-status-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <label className="flex items-start justify-between gap-4 rounded-xl border border-border-default bg-surface-raised p-4">
          <div>
            <p className="text-base font-semibold text-content-primary">선제 반응 활성화</p>
            <p className="mt-1 text-sm text-content-muted">
              방송 중 일정 조건(채팅 분위기 변화 등)에서 AI가 자발적으로 발화합니다.
            </p>
          </div>
          <input
            type="checkbox"
            checked={aiProactiveToChat}
            onChange={(e) => void handleProactiveChange(e.target.checked)}
            disabled={isPending || isLoading}
            className="mt-1 h-5 w-5 rounded border-border-default bg-surface-base text-brand focus:ring-1 focus:ring-brand focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={isPending || isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-panel px-3 py-2 text-sm font-medium text-content-secondary hover:border-border-strong hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            기본값 복원
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
        <h2 className="text-xl font-semibold text-content-primary">립싱크 (실험)</h2>
        <p className="mt-1 text-sm text-content-muted">
          TTS 재생 오디오를 기준으로 3D 캐릭터 입 모양을 동기화합니다. 기본값은 OFF입니다.
        </p>

        <label className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-border-default bg-surface-raised p-4">
          <div>
            <p className="text-base font-semibold text-content-primary">TTS 기반 립싱크 활성화</p>
            <p className="mt-1 text-sm text-content-muted">
              안정성 점검 중인 실험 기능입니다. 문제가 있으면 즉시 OFF로 되돌리세요.
            </p>
          </div>
          <input
            type="checkbox"
            checked={lipSyncEnabled}
            onChange={(e) => setToggle("lipSyncEnabled", e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-border-default bg-surface-base text-brand focus:ring-1 focus:ring-brand focus:ring-offset-0"
          />
        </label>
      </section>
    </div>
  );
}
