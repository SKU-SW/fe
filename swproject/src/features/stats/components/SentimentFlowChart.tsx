/**
 * @file 채팅 분석 — 감정 흐름 Line chart (긍/중/부 3개 시계열)
 * @dependsOn chart.js, react-chartjs-2, src/features/stats/types.ts
 * @usedBy src/pages/ChatAnalysisPage.tsx
 */

import { useMemo } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import type { ChartOptions } from "chart.js";
import { Line } from "react-chartjs-2";
import type {
  SentimentFlowPoint,
  BroadcastChatStatsFilter,
} from "@/features/stats/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface SentimentFlowChartProps {
  points: SentimentFlowPoint[];
  /** 옵셔널 — 필터 제어가 없는 화면(일별 상세 등)에서는 생략 가능 */
  filter?: BroadcastChatStatsFilter;
  onChangeFilter?: (next: Partial<BroadcastChatStatsFilter>) => void;
  /** 헤더 부제목을 직접 지정하고 싶을 때 (예: "10분 간격 · 전체 방송 시간") */
  subtitle?: string;
}

const CHART_COLORS = {
  positive: "#2563eb",
  positiveFill: "rgba(37, 99, 235, 0.16)",
  neutral: "#94a3b8",
  neutralFill: "rgba(148, 163, 184, 0.16)",
  negative: "#ef4444",
  negativeFill: "rgba(239, 68, 68, 0.10)",
  pointBorder: "#f8fafc",
  grid: "rgba(37, 99, 235, 0.16)",
  tick: "#64748b",
  tooltipBg: "#f8fafc",
  tooltipBorder: "rgba(37, 99, 235, 0.22)",
  tooltipTitle: "#0f172a",
  tooltipBody: "#334155",
};

const CRITERIA_LABEL: Record<number, string> = { 1: "1분", 5: "5분", 10: "10분" };
const RANGE_LABEL: Record<number, string> = { 1: "1시간 이전", 3: "3시간 이전", 0: "전체 방송 시간" };

export function SentimentFlowChart({ points, filter, onChangeFilter, subtitle }: SentimentFlowChartProps) {
  const chartData = useMemo(() => ({
    labels: points.map((p) => p.timeLabel),
    datasets: [
      {
        label: "긍정",
        data: points.map((p) => p.positiveRatio),
        borderColor: CHART_COLORS.positive,
        backgroundColor: CHART_COLORS.positiveFill,
        pointBackgroundColor: CHART_COLORS.positive,
        pointBorderColor: CHART_COLORS.pointBorder,
        pointRadius: 2,
        pointHoverRadius: 4,
        tension: 0.38,
        fill: true,
      },
      {
        label: "중립",
        data: points.map((p) => p.neutralRatio),
        borderColor: CHART_COLORS.neutral,
        backgroundColor: CHART_COLORS.neutralFill,
        pointBackgroundColor: CHART_COLORS.neutral,
        pointBorderColor: CHART_COLORS.pointBorder,
        pointRadius: 2,
        pointHoverRadius: 4,
        borderDash: [4, 3],
        tension: 0.38,
        fill: true,
      },
      {
        label: "부정",
        data: points.map((p) => p.negativeRatio),
        borderColor: CHART_COLORS.negative,
        backgroundColor: CHART_COLORS.negativeFill,
        pointBackgroundColor: CHART_COLORS.negative,
        pointBorderColor: CHART_COLORS.pointBorder,
        pointRadius: 2,
        pointHoverRadius: 4,
        tension: 0.38,
        fill: true,
      },
    ],
  }), [points]);

  const options = useMemo<ChartOptions<"line">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 420 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.tooltipBorder,
        borderWidth: 1,
        titleColor: CHART_COLORS.tooltipTitle,
        bodyColor: CHART_COLORS.tooltipBody,
        padding: 10,
      },
    },
    scales: {
      x: {
        grid: { color: CHART_COLORS.grid },
        ticks: {
          color: CHART_COLORS.tick,
          maxRotation: 0,
          // 라벨이 너무 많으면 자동 솎아내기 (최대 8개)
          maxTicksLimit: 8,
          autoSkip: true,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: CHART_COLORS.grid },
        ticks: { color: CHART_COLORS.tick, stepSize: 20 },
      },
    },
  }), []);

  return (
    <section className="rounded-2xl border border-border-strong bg-surface-panel p-5 shadow-sm transition-colors">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-content-primary">감정 흐름 그래프</h2>
          <p className="mt-1 text-sm text-content-muted">
            {subtitle
              ?? (filter
                ? `${CRITERIA_LABEL[filter.statsCriteria]} 단위 · ${RANGE_LABEL[filter.timeRange]} 범위`
                : "10분 간격 · 전체 방송 시간")}
          </p>
        </div>

        {filter && onChangeFilter && (
          <div className="flex items-center gap-2 text-xs">
            <select
              value={filter.statsCriteria}
              onChange={(e) => onChangeFilter({ statsCriteria: Number(e.target.value) as 1 | 5 | 10 })}
              className="rounded-md border border-border-default bg-surface-base px-2 py-1.5 text-content-primary focus:border-brand focus:outline-none"
            >
              <option value={1}>1분 간격</option>
              <option value={5}>5분 간격</option>
              <option value={10}>10분 간격</option>
            </select>

            <select
              value={filter.timeRange}
              onChange={(e) => onChangeFilter({ timeRange: Number(e.target.value) as 1 | 3 | 0 })}
              className="rounded-md border border-border-default bg-surface-base px-2 py-1.5 text-content-primary focus:border-brand focus:outline-none"
            >
              <option value={1}>1시간 이전</option>
              <option value={3}>3시간 이전</option>
              <option value={0}>전체 방송 시간</option>
            </select>
          </div>
        )}
      </div>

      <div className="h-[320px] rounded-xl border border-border-default bg-surface-base p-4">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs font-bold text-content-muted">
        <span className="text-blue-600">● 긍정</span>
        <span className="text-slate-400">─ 중립</span>
        <span className="text-red-500">● 부정</span>
      </div>
    </section>
  );
}
