/**
 * @file 일별 방송 통계 상세 모달 — 캐릭터/방송 분석/채팅 분석/대화 5개
 * @dependsOn src/features/stats/types.ts
 * @dependsOn src/features/stats/components/SentimentFlowChart.tsx
 * @usedBy src/features/stats/components/BroadcastCalendar.tsx
 */

import { useEffect } from "react";
import {
  AlertCircle,
  Hash,
  Hourglass,
  LoaderCircle,
  MessageSquare,
  RadioTower,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import type {
  AiTendency,
  BroadcastDayStatsResDto,
  CatchPhraseSubject,
  CharacterPersona,
  DialogueSubject,
} from "@/features/stats/types";
import { SentimentFlowChart } from "./SentimentFlowChart";

interface BroadcastDayDetailModalProps {
  data: BroadcastDayStatsResDto | null;
  isLoading: boolean;
  error: string | null;
  isNotFound: boolean;
  onClose: () => void;
}

const PERSONA_LABEL: Record<CharacterPersona, string> = {
  FRIENDLY_CHATTER: "친근한 수다쟁이",
  HIGH_TENSION: "텐션 폭발",
  PLAYFUL_TEASER: "장난꾸러기",
  PROFESSIONAL_MANAGER: "전문 매니저",
  ROLEPLAY_EXPERT: "롤플레이 전문가",
};

const SUBJECT_LABEL: Record<DialogueSubject, string> = {
  STREAMER: "스트리머",
  AI_CHARACTER: "AI 캐릭터",
  VIEWER: "시청자",
  DONATION: "후원",
  GAME_EVENT: "게임 이벤트",
  SYSTEM_SUMMARY: "시스템",
};

const SUBJECT_TONE_CLASS: Record<DialogueSubject, string> = {
  STREAMER: "border-brand/30 bg-brand/10 text-brand",
  AI_CHARACTER: "border-status-success/30 bg-status-success/10 text-status-success",
  VIEWER: "border-border-default bg-surface-raised text-content-secondary",
  DONATION: "border-status-warning/30 bg-status-warning/10 text-status-warning",
  GAME_EVENT: "border-border-default bg-surface-raised text-content-secondary",
  SYSTEM_SUMMARY: "border-border-default bg-surface-raised text-content-muted",
};

const TENDENCY_LABEL: Record<AiTendency, string> = {
  POSITIVE: "긍정 (응원)",
  NEUTRAL: "중립",
  NEGATIVE: "부정 (비판)",
};

const TENDENCY_TONE_CLASS: Record<AiTendency, string> = {
  POSITIVE: "border-status-success/30 bg-status-success/10 text-status-success",
  NEUTRAL: "border-border-default bg-surface-raised text-content-secondary",
  NEGATIVE: "border-status-danger/30 bg-status-danger/10 text-status-danger",
};

const CATCH_PHRASE_SUBJECT_LABEL: Record<CatchPhraseSubject, string> = {
  STREAMER: "스트리머",
  VIEWER: "시청자",
};

/** "yyyy-MM-dd-HH:mm:ss" 또는 "yyyy-MM-dd HH:mm:ss" → "HH:mm:ss" 추출 */
function extractTime(raw: string): string {
  if (!raw) return "";
  // 마지막 ':' 이전에 시간이 있음. "yyyy-MM-dd-HH:mm:ss" 형식 우선 시도.
  const parts = raw.split(/[\s]/);
  const tail = parts[parts.length - 1] ?? raw;
  // "yyyy-MM-dd-HH:mm:ss" 일 때 tail = 전체 → -HH:mm:ss 분리
  const dashCount = (tail.match(/-/g) ?? []).length;
  if (dashCount >= 3) {
    const idx = tail.lastIndexOf("-", tail.length - 1);
    // 끝의 HH:mm:ss 가 -로 붙은 경우 (yyyy-MM-dd-HH:mm:ss)
    const candidate = tail.slice(idx + 1);
    if (/^\d{2}:\d{2}:\d{2}$/.test(candidate)) return candidate;
  }
  return tail;
}

/** "yyyy-MM-dd-HH:mm:ss" → "yyyy-MM-dd" 추출 */
function extractDate(raw: string): string {
  if (!raw) return "";
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : raw;
}

export function BroadcastDayDetailModal({
  data,
  isLoading,
  error,
  isNotFound,
  onClose,
}: BroadcastDayDetailModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 flex max-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface-panel shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-default bg-surface-panel/95 px-5 py-4">
          <h2 className="text-lg font-extrabold text-content-primary">방송 통계 상세</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg border border-border-default bg-surface-raised p-1.5 text-content-secondary transition-colors hover:bg-surface-hover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoaderCircle className="h-10 w-10 animate-spin text-content-muted/40" />
              <p className="mt-3 text-sm text-content-muted">방송 통계를 불러오는 중...</p>
            </div>
          )}

          {!isLoading && isNotFound && (
            <DetailErrorState
              title="방송을 찾을 수 없습니다"
              description="본인 방송이 아니거나 이미 삭제된 방송입니다."
            />
          )}

          {!isLoading && error && !isNotFound && (
            <DetailErrorState title="데이터를 불러올 수 없습니다" description={error} />
          )}

          {!isLoading && data && <DetailBody data={data} />}
        </div>
      </div>
    </div>
  );
}

function DetailErrorState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-10 w-10 text-status-danger/60" />
      <h3 className="mt-3 text-base font-extrabold text-content-primary">{title}</h3>
      <p className="mt-1 text-sm text-content-muted">{description}</p>
    </div>
  );
}

function DetailBody({ data }: { data: BroadcastDayStatsResDto }) {
  const { characterInfo, broadcastInfo, chatAnalysisInfo } = data;
  const { analysisResult, status } = broadcastInfo;

  return (
    <>
      {status === "ABNORMAL_TERMINATED" && (
        <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/10 p-3 text-status-warning">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-xs font-bold leading-relaxed">
            비정상 종료된 방송입니다. 일부 통계나 분석 데이터가 누락되었을 수 있어요.
          </p>
        </div>
      )}

      {status === "BROADCASTING" && (
        <div className="flex items-start gap-2 rounded-xl border border-status-success/40 bg-status-success/10 p-3 text-status-success">
          <span className="mt-1 inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-status-success" />
          <p className="text-xs font-bold leading-relaxed">
            현재 진행 중인 방송입니다. 방송이 종료되면 최종 분석 결과가 채워집니다.
          </p>
        </div>
      )}

      <CharacterHeader characterInfo={characterInfo} broadcastInfo={broadcastInfo} />

      {analysisResult ? (
        <AnalysisSection analysisResult={analysisResult} />
      ) : (
        <section className="rounded-xl border border-border-default bg-surface-base p-4">
          <p className="text-sm text-content-muted">
            {status === "BROADCASTING"
              ? "방송이 종료된 후 분석 결과가 생성됩니다."
              : status === "ABNORMAL_TERMINATED"
                ? "비정상 종료로 인해 분석이 진행되지 않았을 수 있습니다."
                : "방송 분석이 아직 준비되지 않았습니다. 잠시 후 다시 확인해주세요."}
          </p>
        </section>
      )}

      <ChatAnalysisSection info={chatAnalysisInfo} />

      <DialoguesSection dialogues={broadcastInfo.lastFiveBroadcastDialogues} />
    </>
  );
}

function CharacterHeader({
  characterInfo,
  broadcastInfo,
}: {
  characterInfo: BroadcastDayStatsResDto["characterInfo"];
  broadcastInfo: BroadcastDayStatsResDto["broadcastInfo"];
}) {
  const dateLabel = extractDate(broadcastInfo.startedAt);
  const startTime = extractTime(broadcastInfo.startedAt);
  const endTime = extractTime(broadcastInfo.terminatedAt);

  return (
    <section className="flex flex-wrap items-start gap-4 rounded-xl border border-border-default bg-surface-base p-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border-default bg-surface-raised">
        {characterInfo.imageUrl ? (
          <img
            src={characterInfo.imageUrl}
            alt={characterInfo.name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <Sparkles className="h-8 w-8 text-content-muted" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-extrabold text-content-primary">{characterInfo.name}</h3>
          <span className="inline-flex items-center gap-1 rounded-full border border-border-default bg-surface-raised px-2 py-0.5 text-xs font-bold text-content-secondary">
            {characterInfo.gender === "MALE" ? "남성" : "여성"}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
            <Tag className="h-3 w-3" />
            {PERSONA_LABEL[characterInfo.persona] ?? characterInfo.persona}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-content-muted">
          <span className="inline-flex items-center gap-1">
            <RadioTower className="h-3.5 w-3.5" />
            {dateLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Hourglass className="h-3.5 w-3.5" />
            {startTime} ~ {endTime}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 ${
              broadcastInfo.status === "BROADCASTING"
                ? "border-status-success/40 bg-status-success/10 text-status-success"
                : broadcastInfo.status === "ABNORMAL_TERMINATED"
                  ? "border-status-warning/40 bg-status-warning/10 text-status-warning"
                  : "border-border-default bg-surface-raised text-content-muted"
            }`}
          >
            {broadcastInfo.status === "BROADCASTING" && (
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-status-success" />
            )}
            {broadcastInfo.status === "TERMINATED"
              ? "정상 종료"
              : broadcastInfo.status === "ABNORMAL_TERMINATED"
                ? "비정상 종료"
                : "방송 중 (LIVE)"}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-md border border-border-default bg-surface-raised px-2 py-0.5 font-mono text-[10px] tracking-tight text-content-muted"
            title={`방송 ID · ${broadcastInfo.streamId}`}
          >
            ID · {broadcastInfo.streamId}
          </span>
        </div>

        {characterInfo.triggerWords.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-content-muted">호출어</span>
            {characterInfo.triggerWords.map((word) => (
              <span
                key={word}
                className="rounded-full border border-border-default bg-surface-raised px-2 py-0.5 text-xs font-bold text-content-secondary"
              >
                {word}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AnalysisSection({
  analysisResult,
}: {
  analysisResult: NonNullable<BroadcastDayStatsResDto["broadcastInfo"]["analysisResult"]>;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border-default bg-surface-base p-4">
      <h3 className="flex items-center gap-2 text-base font-extrabold text-content-primary">
        <Sparkles className="h-4 w-4 text-brand" />
        방송 분석
      </h3>

      <AnalysisBlock title="주 컨텐츠" body={analysisResult.majorContent} />
      <AnalysisBlock title="시청자와 스트리머 분위기" body={analysisResult.majorMoodWithViewers} />
      <AnalysisBlock title="당일 방송 요약" body={analysisResult.summary} />
      <AnalysisBlock title="최종 분석" body={analysisResult.totalAnalysis} />

      {analysisResult.catchPhrases.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-content-muted">
            방송 유행어
          </p>
          <div className="space-y-2">
            {analysisResult.catchPhrases.map((phrase, index) => (
              <div
                key={`${phrase.content}-${index}`}
                className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">
                    {phrase.content}
                  </span>
                  <span className="text-xs font-semibold text-content-secondary">
                    {CATCH_PHRASE_SUBJECT_LABEL[phrase.subject]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-content-secondary">{phrase.situationAnalysis}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysisResult.timeLines.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-content-muted">
            방송 타임라인
          </p>
          <ol className="space-y-2">
            {analysisResult.timeLines.map((line, index) => (
              <li
                key={`${line.startTime}-${index}`}
                className="rounded-lg border border-border-default bg-surface-panel p-3"
              >
                <div className="flex items-baseline justify-between gap-3 text-xs font-bold text-content-muted">
                  <span>
                    {extractTime(line.startTime)} ~ {extractTime(line.endTime)}
                  </span>
                  <span>#{index + 1}</span>
                </div>
                <p className="mt-1 text-sm font-semibold leading-snug text-content-primary">
                  {line.content}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function AnalysisBlock({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-wider text-content-muted">{title}</p>
      <p className="text-sm leading-relaxed text-content-primary">{body}</p>
    </div>
  );
}

function ChatAnalysisSection({
  info,
}: {
  info: BroadcastDayStatsResDto["chatAnalysisInfo"];
}) {
  const { publicOpinion, aiPartnerTendency, sentimentFlow, topKeywords } = info;

  return (
    <section className="space-y-4 rounded-xl border border-border-default bg-surface-base p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-base font-extrabold text-content-primary">
          <MessageSquare className="h-4 w-4 text-brand" />
          채팅 분석 (방송 전체)
        </h3>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${TENDENCY_TONE_CLASS[aiPartnerTendency]}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI 성향 · {TENDENCY_LABEL[aiPartnerTendency]}
        </span>
      </div>

      <div className="rounded-lg border border-border-default bg-surface-panel p-3">
        <p className="mb-2 text-xs font-bold text-content-muted">
          여론 현황 · 총 {publicOpinion.totalChatCount.toLocaleString()}건
        </p>
        <div className="flex h-3 overflow-hidden rounded-full bg-surface-raised">
          <span className="bg-status-success" style={{ width: `${publicOpinion.positiveRatio}%` }} />
          <span className="bg-content-muted/40" style={{ width: `${publicOpinion.neutralRatio}%` }} />
          <span className="bg-status-danger" style={{ width: `${publicOpinion.negativeRatio}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[11px] font-bold">
          <span className="text-status-success">
            긍정 {publicOpinion.positiveChatCount.toLocaleString()}건 ({publicOpinion.positiveRatio.toFixed(1)}%)
          </span>
          <span className="text-content-muted">
            중립 {publicOpinion.neutralChatCount.toLocaleString()}건 ({publicOpinion.neutralRatio.toFixed(1)}%)
          </span>
          <span className="text-status-danger">
            부정 {publicOpinion.negativeChatCount.toLocaleString()}건 ({publicOpinion.negativeRatio.toFixed(1)}%)
          </span>
        </div>
      </div>

      {sentimentFlow.length > 0 && (
        <SentimentFlowChart points={sentimentFlow} subtitle="10분 간격 · 방송 전체" />
      )}

      {topKeywords.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-content-muted">
            <Hash className="h-3.5 w-3.5" />
            TOP {topKeywords.length} 키워드
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topKeywords.map((keyword, index) => (
              <span
                key={`${keyword}-${index}`}
                className="rounded-full border border-border-default bg-surface-panel px-2.5 py-1 text-xs font-bold text-content-secondary"
              >
                <span className="mr-1 text-content-muted">#{index + 1}</span>
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function DialoguesSection({
  dialogues,
}: {
  dialogues: BroadcastDayStatsResDto["broadcastInfo"]["lastFiveBroadcastDialogues"];
}) {
  if (dialogues.length === 0) return null;
  return (
    <section className="space-y-3 rounded-xl border border-border-default bg-surface-base p-4">
      <h3 className="text-base font-extrabold text-content-primary">최근 대화 5개</h3>
      <ul className="space-y-2">
        {dialogues.map((dlg) => (
          <li
            key={dlg.cursorId}
            className="rounded-lg border border-border-default bg-surface-panel p-3"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-bold">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${SUBJECT_TONE_CLASS[dlg.subject]}`}
              >
                {SUBJECT_LABEL[dlg.subject] ?? dlg.subject}
              </span>
              <span className="text-content-muted">{extractTime(dlg.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm leading-snug text-content-primary">{dlg.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
