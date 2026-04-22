import { PipelineStatusBar } from "./chat-analysis/PipelineStatusBar";
import { AIJudgementPanel } from "./chat-analysis/AIJudgementPanel";
import { SentimentFlowChart } from "./chat-analysis/SentimentFlowChart";
import { RealtimeKeywordPanel } from "./chat-analysis/RealtimeKeywordPanel";
import { AIResponseHistory } from "./chat-analysis/AIResponseHistory";

export function ChatAnalysis() {
  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full bg-slate-950">
      {/* 상단 파이프라인 상태 바 */}
      <PipelineStatusBar />

      {/* 페이지 제목 */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">AI 의사결정 시각화</h2>
        <p className="text-slate-400 text-sm">
          LLM 기반 채팅 분석부터 음성 반응까지 AI의 실시간 판단 과정
        </p>
      </div>

      {/* 메인: AI 판단 현황 패널 */}
      <AIJudgementPanel />

      {/* 중앙: 감정 흐름 그래프 + 실시간 키워드 */}
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3">
          <SentimentFlowChart />
        </div>
        <div className="col-span-2">
          <RealtimeKeywordPanel />
        </div>
      </div>

      {/* 하단: AI 반응 이력 */}
      <AIResponseHistory />
    </div>
  );
}