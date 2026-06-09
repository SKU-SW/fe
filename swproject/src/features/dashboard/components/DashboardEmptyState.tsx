/**
 * @file 대시보드 빈 상태 - 방송 중이 아닐 때 안내
 * @usedBy src/pages/DashboardPage.tsx
 */

import { Link } from "react-router-dom";
import { Radio, ArrowRight } from "lucide-react";
import { useState } from "react";
import { ChzzkStatusBadge } from "@/features/auth/components/ChzzkStatusBadge";
import { ChzzkConnectModal } from "@/features/auth/components/ChzzkConnectModal";
import { getChzzkModalMode } from "@/features/auth/lib/chzzkStatus";
import { useChzzkStatus } from "@/features/auth/hooks/useChzzkStatus";

export function DashboardEmptyState() {
  const [showChzzkModal, setShowChzzkModal] = useState(false);
  const { status, refetch } = useChzzkStatus();

  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 rounded-full border border-border-strong bg-surface-panel p-5 shadow-lg transition-colors">
        <Radio className="h-10 w-10 text-content-muted" />
      </div>

      <h2 className="text-3xl font-bold text-content-primary">현재 방송 중이 아닙니다</h2>
      <p className="mt-2 max-w-md text-base text-content-muted">
        AI 캐릭터를 선택하고 방송을 시작하면 여기에서 실시간 대화와 통계를 확인할 수 있어요.
      </p>

      <div className="mt-6 w-full max-w-md">
        <ChzzkStatusBadge
          variant="full"
          showCTA
          onConnectClick={() => setShowChzzkModal(true)}
        />
      </div>

      <Link
        to="/character"
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-base font-semibold text-content-inverse transition-colors hover:bg-brand-hover"
      >
        AI 캐릭터로 이동
        <ArrowRight className="h-4 w-4" />
      </Link>

      {showChzzkModal && (
        <ChzzkConnectModal
          mode={getChzzkModalMode(status)}
          onSuccess={() => {
            setShowChzzkModal(false);
            void refetch();
          }}
          onCancel={() => setShowChzzkModal(false)}
        />
      )}
    </div>
  );
}
