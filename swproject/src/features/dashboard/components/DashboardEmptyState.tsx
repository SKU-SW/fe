/**
 * @file 대시보드 빈 상태 - 방송 중이 아닐 때 안내
 * @usedBy src/pages/DashboardPage.tsx
 */

import { Link } from "react-router-dom";
import { Radio, ArrowRight } from "lucide-react";

export function DashboardEmptyState() {
  return (
    <div className="flex min-h-[480px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 rounded-full bg-slate-800/60 p-5">
        <Radio className="h-10 w-10 text-slate-500" />
      </div>

      <h2 className="text-2xl font-bold text-white">현재 방송 중이 아닙니다</h2>
      <p className="mt-2 max-w-md text-sm text-slate-400">
        AI 캐릭터를 선택하고 방송을 시작하면 여기에서 실시간 대화와 통계를 확인할 수 있어요.
      </p>

      <Link
        to="/character"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
      >
        AI 캐릭터로 이동
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
