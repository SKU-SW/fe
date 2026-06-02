/**
 * @file 방송 통계 감정 흐름 Line chart
 * @dependsOn chart.js, react-chartjs-2, src/features/stats/types.ts
 * @usedBy src/pages/StatsPage.tsx
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
import type { ChartOptions, Plugin } from "chart.js";
import { Line } from "react-chartjs-2";
import type { SentimentFlowPoint } from "@/features/stats/types";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface SentimentFlowChartProps {
  points: SentimentFlowPoint[];
}

const MODE_COLOR = {
  cheer: "#2563eb",
  criticism: "#ef4444",
  silence: "#94a3b8",
};

const CHART_COLORS = {
  positive: "#2563eb",
  positiveFill: "rgba(37, 99, 235, 0.16)",
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

const transitionMarkerPlugin: Plugin<"line"> = {
  id: "transitionMarkerPlugin",
  afterDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const points = chart.data.datasets[0]?.data.map((_, index) => {
      const raw = chart.data.labels?.[index];
      return typeof raw === "string" ? raw : String(raw ?? "");
    }) ?? [];
    const transitions = (chart.options.plugins as { transitionPoints?: SentimentFlowPoint[] })?.transitionPoints ?? [];

    ctx.save();
    transitions.forEach((point) => {
      if (!point.modeTransition) return;
      const index = points.indexOf(point.timestamp);
      if (index < 0) return;
      const x = scales.x.getPixelForValue(index);
      const color = MODE_COLOR[point.modeTransition];

      ctx.beginPath();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.moveTo(x, chartArea.top + 6);
      ctx.lineTo(x, chartArea.bottom - 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, chartArea.top + 10, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  },
};

export function SentimentFlowChart({ points }: SentimentFlowChartProps) {
  const chartData = useMemo(() => ({
    labels: points.map((point) => point.timestamp),
    datasets: [
      {
        label: "긍정",
        data: points.map((point) => point.positivePercent),
        borderColor: CHART_COLORS.positive,
        backgroundColor: CHART_COLORS.positiveFill,
        pointBackgroundColor: CHART_COLORS.positive,
        pointBorderColor: CHART_COLORS.pointBorder,
        pointRadius: 3,
        pointHoverRadius: 5,
        segment: { borderColor: CHART_COLORS.positive },
        tension: 0.38,
        fill: true,
      },
      {
        label: "부정",
        data: points.map((point) => point.negativePercent),
        borderColor: CHART_COLORS.negative,
        backgroundColor: CHART_COLORS.negativeFill,
        pointBackgroundColor: CHART_COLORS.negative,
        pointBorderColor: CHART_COLORS.pointBorder,
        pointRadius: 3,
        pointHoverRadius: 5,
        segment: { borderColor: CHART_COLORS.negative },
        tension: 0.38,
        fill: true,
      },
    ],
  }), [points]);

  const options = useMemo<ChartOptions<"line"> & { plugins: { transitionPoints: SentimentFlowPoint[] } }>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 420 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      transitionPoints: points,
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
        ticks: { color: CHART_COLORS.tick, maxRotation: 0 },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: CHART_COLORS.grid },
        ticks: { color: CHART_COLORS.tick, stepSize: 20 },
      },
    },
  }), [points]);

  return (
    <section className="rounded-2xl border border-border-strong bg-surface-panel p-5 shadow-sm transition-colors">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-content-primary">감정 흐름 그래프</h2>
          <p className="mt-1 text-sm text-content-muted">5분 단위 여론 추이를 mock 데이터로 표시합니다.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-content-muted">
          <span className="text-blue-600">● 긍정</span>
          <span className="text-red-500">● 부정</span>
          <span className="text-border-strong">|</span>
          <span>모드 전환</span>
        </div>
      </div>

      <div className="h-[320px] rounded-xl border border-border-default bg-surface-base p-4">
        <Line data={chartData} options={options} plugins={[transitionMarkerPlugin]} />
      </div>
    </section>
  );
}
