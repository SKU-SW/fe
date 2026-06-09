/**
 * @file 방송 설정 탭 — AI 선제 반응 토글
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy src/pages/SettingsPage.tsx
 */

import { Sparkles } from "lucide-react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";

export function BroadcastSettingsTab() {
  const proactiveEnabled = useAIModeStore((s) => s.toggles.proactiveReactionEnabled);
  const setToggle = useAIModeStore((s) => s.setToggle);

  return (
    <div className="space-y-6">
      {/* AI 선제 반응 */}
      <section className="rounded-xl border border-border-strong bg-surface-panel p-6 transition-colors">
        <div className="mb-5 flex items-start gap-4">
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

        <label className="flex items-start justify-between gap-4 rounded-xl border border-border-default bg-surface-raised p-4">
          <div>
            <p className="text-base font-semibold text-content-primary">선제 반응 활성화</p>
            <p className="mt-1 text-sm text-content-muted">
              방송 중 일정 조건(채팅 분위기 변화 등)에서 AI가 자발적으로 발화합니다.
            </p>
          </div>
          <input
            type="checkbox"
            checked={proactiveEnabled}
            onChange={(e) => setToggle("proactiveReactionEnabled", e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-border-default bg-surface-base text-brand focus:ring-1 focus:ring-brand focus:ring-offset-0"
          />
        </label>
      </section>
    </div>
  );
}
