/**
 * @file 방송 통계 페이지 — 종료된 방송의 집계 데이터 + LLM 피드백 (Phase 2 예정)
 * @dependsOn react-router-dom
 * @usedBy src/App.tsx
 *
 * 본 페이지는 사후 회고/집계 통계를 담당한다.
 * 진행 중 실시간 모니터링은 /chat-analysis (ChatAnalysisPage) 에서 처리한다.
 *
 * Phase 2 에서 구현 예정:
 * - 최근 방송 카드 리스트 (날짜/캐릭터/지속시간/평균 감정)
 * - 방송 클릭 시 상세: KPI · 감정 흐름 timeline · TOP 키워드 · LLM 피드백
 * - GET /api/v1/broadcasts/{id}/feedback BE 엔드포인트 연동
 */

import { BarChart3, History, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-content-muted">
        종료된 방송의 집계 데이터와 AI 분석 피드백을 확인할 수 있는 페이지입니다.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <PreviewCard
          icon={BarChart3}
          title="방송 KPI · 감정 흐름"
          description="총 채팅 수, AI 응답률, 평균 감정 비율, 시간대별 여론 추이를 한 눈에 확인합니다."
        />
        <PreviewCard
          icon={MessageSquareText}
          title="AI 방송 피드백"
          description="Gemini 기반으로 잘된 점·개선할 점·다음 방송 전략을 자동 분석해 제시합니다."
        />
      </div>

      <div className="rounded-2xl border border-border-strong bg-surface-panel p-6 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-base font-bold text-content-primary">지난 방송 미리보기</p>
            <p className="mt-1 text-sm text-content-muted">
              현재는 BE 연동 전 placeholder 카드만 표시됩니다.
            </p>
          </div>
          <Link
            to="/stats/history"
            className="inline-flex items-center gap-2 rounded-xl border border-border-strong bg-surface-raised px-4 py-2.5 text-sm font-bold text-content-primary transition-colors hover:bg-surface-hover"
          >
            <History className="h-4 w-4 text-brand" />
            지난 방송 보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}

interface PreviewCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function PreviewCard({ icon: Icon, title, description }: PreviewCardProps) {
  return (
    <div className="rounded-2xl border border-border-strong bg-surface-panel p-5 transition-colors">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-brand/10 p-2.5 text-brand">
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-bold text-content-primary">{title}</p>
          <p className="text-sm leading-relaxed text-content-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}
