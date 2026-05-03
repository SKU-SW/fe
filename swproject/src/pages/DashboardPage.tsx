/**
 * @file 대시보드 메인 페이지
 * @updated 실데이터 연결 (Phase C) - useDashboardChatStream / useDashboardActivityLogs 훅 호출,
 *          MOCK 제거, store.chatMessages 를 ConversationStream 으로, store.activityLogs 를 ActivityLogPanel 로 연결
 * @updated 백엔드 실시간 엔드포인트 배포 전이라 BACKEND_REALTIME_READY 로 폴링/WS 임시 차단
 * @updated STT/선제반응 토글 및 마이크 비활성 알림 배너 추가
 * @dependsOn src/features/dashboard/components/* (UI 컴포넌트)
 * @dependsOn src/features/dashboard/hooks/* (실시간 채팅/활동 로그 훅)
 * @dependsOn src/shared/stores/aiModeStore.ts (mode/toggles/stats/chatMessages/activityLogs)
 * @dependsOn src/shared/stores/characterStore.ts (selectedCharacterId)
 * @dependsOn src/features/character/hooks/useCharacter.ts (선택된 캐릭터 상세)
 * @usedBy src/App.tsx
 *
 * 레이아웃:
 *   - mode === 'broadcasting' 이면 풀 대시보드 (헤더/초상/대화/컨트롤/KPI 4개)
 *   - 그 외엔 빈 상태 (캐릭터 페이지로 가는 CTA)
 */

import { useEffect, useMemo, useState } from "react";
import { Activity, MicOff, Users, MessageSquare, Sparkles } from "lucide-react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useCharacterStore } from "@/shared/stores/characterStore";
import { useCharacter } from "@/features/character/hooks";
import { useDashboardChatStream } from "@/features/dashboard/hooks/useDashboardChatStream";
import { useDashboardActivityLogs } from "@/features/dashboard/hooks/useDashboardActivityLogs";
import {
  ActivityLogPanel,
  BroadcastControls,
  BroadcastHeader,
  CharacterPortrait,
  ConversationStream,
  DashboardEmptyState,
  KpiCard,
  ResetConfirmModal,
} from "@/features/dashboard/components";
import type { ConversationFilterState, ConversationMessage } from "@/features/dashboard/types";

/**
 * 백엔드 실시간 채팅/활동 로그 엔드포인트 준비 여부.
 * - false 이면 useDashboardChatStream / useDashboardActivityLogs 의 폴링·WebSocket 모두 정지.
 * - 현재 백엔드 Swagger 에는 /api/v1/stream/{start,terminate} 만 존재하고
 *   /stream/info, /stream/info/dialogues, /stream/dialogues(WS) 는 미구현.
 * - 배포되면 true 로 바꾸기만 하면 자동으로 흐름 시작.
 */
const BACKEND_REALTIME_READY = false;

// ============================================================
// 페이지 컴포넌트
// ============================================================

export default function DashboardPage() {
  const mode = useAIModeStore((s) => s.mode);
  const stats = useAIModeStore((s) => s.stats);
  const toggles = useAIModeStore((s) => s.toggles);
  // selector 로 isPaused 를 구독해야 토글 변경 시 BroadcastControls 가 리렌더됨
  const isPaused = useAIModeStore((s) => s.isPaused);
  const setToggle = useAIModeStore((s) => s.setToggle);
  const togglePause = useAIModeStore((s) => s.togglePause);
  const clearChatMessages = useAIModeStore((s) => s.clearChatMessages);
  const clearActivityLogs = useAIModeStore((s) => s.clearActivityLogs);

  // 실데이터: 시청자 채팅 + AI 활동 로그
  const chatMessages = useAIModeStore((s) => s.chatMessages);
  const activityLogs = useAIModeStore((s) => s.activityLogs);

  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const { character } = useCharacter(selectedCharacterId);

  // 방송 중 + 백엔드 실시간 준비 완료일 때만 폴링/WebSocket 가동.
  // BACKEND_REALTIME_READY 가 false 인 동안에는 훅이 호출되어도 내부에서 즉시 short-circuit.
  const isBroadcasting = mode === "broadcasting";
  const realtimeEnabled = isBroadcasting && BACKEND_REALTIME_READY;
  const { isConnected: chatConnected, error: chatError } = useDashboardChatStream({
    enabled: realtimeEnabled,
  });
  const { error: logsError } = useDashboardActivityLogs({ enabled: realtimeEnabled });

  // 로컬 UI 상태
  const [logOpen, setLogOpen] = useState(false);
  const [filter, setFilter] = useState<ConversationFilterState>({
    streamer: true,
    ai: true,
    chat: true,
  });
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [micNoticeDismissed, setMicNoticeDismissed] = useState(false);

  useEffect(() => {
    if (toggles.sttEnabled) {
      setMicNoticeDismissed(false);
    }
  }, [toggles.sttEnabled]);

  // store.chatMessages (시청자 채팅) → ConversationStream 의 통합 메시지 모델로 변환.
  // 현재 백엔드는 시청자 채팅만 제공하므로 speaker='chat' 으로 고정.
  // 스트리머/AI 발화 통합은 별도 엔드포인트 추가 후 작업 예정.
  const conversationMessages = useMemo<ConversationMessage[]>(
    () =>
      chatMessages.map((m) => ({
        id: m.id,
        speaker: "chat" as const,
        username: m.username,
        text: m.message,
        timestamp: m.timestamp,
      })),
    [chatMessages]
  );

  // 방송 중이 아닐 때
  if (!isBroadcasting) {
    return (
      <div className="px-6 py-8">
        <PageHeader />
        <DashboardEmptyState />
      </div>
    );
  }

  // 방송 중일 때
  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <PageHeader />

      <BroadcastHeader logOpen={logOpen} onToggleLog={() => setLogOpen((v) => !v)} />

      {!toggles.sttEnabled && !micNoticeDismissed && (
        <MicWarningBanner
          onEnable={() => setToggle("sttEnabled", true)}
          onDismiss={() => setMicNoticeDismissed(true)}
        />
      )}

      {!BACKEND_REALTIME_READY && (
        <div
          role="status"
          className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-xs text-slate-400"
        >
          실시간 채팅 / 활동 로그 엔드포인트가 아직 배포되지 않았습니다. 백엔드 준비 후 자동으로
          연결됩니다.
        </div>
      )}

      {BACKEND_REALTIME_READY && (chatError || logsError) && (
        <div
          role="status"
          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
        >
          {chatError ?? logsError}
        </div>
      )}

      {/* 메인: 좌(초상) / 우(대화 스트림) — 2 컬럼 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <CharacterPortrait
          imageUrl={character?.characterImageUrl}
          name={character?.characterName ?? "AI"}
          speakingState={chatConnected ? "listening" : "idle"}
        />

        <div className="min-h-[420px]">
          <ConversationStream
            messages={conversationMessages}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>
      </div>

      {/* 컨트롤 바 */}
      <BroadcastControls
        sttOn={toggles.sttEnabled}
        proactiveOn={toggles.proactiveReactionEnabled}
        ttsOn={toggles.ttsEnabled}
        chatLogOn={toggles.chatReactionEnabled}
        aiOn={!isPaused}
        onToggleStt={() => setToggle("sttEnabled", !toggles.sttEnabled)}
        onToggleProactive={() => setToggle("proactiveReactionEnabled", !toggles.proactiveReactionEnabled)}
        onToggleTts={() => setToggle("ttsEnabled", !toggles.ttsEnabled)}
        onToggleChatLog={() => setToggle("chatReactionEnabled", !toggles.chatReactionEnabled)}
        onToggleAi={togglePause}
        onResetRecords={() => setResetModalOpen(true)}
      />

      {/* KPI 4개 카드 */}
      <KpiGrid stats={stats} />

      <ActivityLogPanel open={logOpen} logs={activityLogs} onClose={() => setLogOpen(false)} />

      {resetModalOpen && (
        <ResetConfirmModal
          onCancel={() => setResetModalOpen(false)}
          onConfirm={() => {
            clearChatMessages();
            clearActivityLogs();
            setResetModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// 보조 컴포넌트 (페이지 내부)
// ============================================================

function PageHeader() {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-bold text-white">대시보드</h1>
      <p className="text-sm text-slate-400">AI 스트리머 동료 시스템 실시간 모니터링</p>
    </div>
  );
}

function MicWarningBanner({ onEnable, onDismiss }: { onEnable: () => void; onDismiss: () => void }) {
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/15 p-2 text-amber-300">
            <MicOff className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-100">마이크가 꺼져 있습니다</p>
            <p className="mt-1 text-xs leading-6 text-amber-200/90">
              현재 상태에서는 스트리머 음성을 입력받지 못해 호출어 감지와 음성인식 기반 반응을 수행할
              수 없습니다. 방송 흐름을 따라가려면 음성인식을 켜주세요.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-100 transition hover:bg-amber-500/10"
          >
            나중에
          </button>
          <button
            type="button"
            onClick={onEnable}
            className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-amber-300"
          >
            음성인식 켜기
          </button>
        </div>
      </div>
    </div>
  );
}

function KpiGrid({ stats }: { stats: ReturnType<typeof useAIModeStore.getState>["stats"] }) {
  // 감정 비율에서 가장 큰 항목 도출 (KPI 카드용 요약)
  const dominantEmotion = useMemo(() => {
    const ratios = stats.emotionRatios;
    let bestKey: keyof typeof ratios = "neutral";
    let bestValue = -1;
    (Object.keys(ratios) as Array<keyof typeof ratios>).forEach((k) => {
      if (ratios[k] > bestValue) {
        bestValue = ratios[k];
        bestKey = k;
      }
    });
    const labels: Record<keyof typeof ratios, string> = {
      joy: "긍정",
      anger: "분노",
      sadness: "슬픔",
      fear: "공포",
      surprise: "놀람",
      neutral: "중립",
    };
    return { label: labels[bestKey], value: Math.round(bestValue) };
  }, [stats.emotionRatios]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={Activity}
        label="AI 상태"
        value="활성화"
        hint="정상 작동 중"
        tone="emerald"
      />
      <KpiCard
        icon={Users}
        label="현재 시청자 수"
        value={stats.viewerCount.toLocaleString()}
        hint="—"
        tone="indigo"
      />
      <KpiCard
        icon={MessageSquare}
        label="채팅 속도"
        value={`${stats.chatSpeed}개/분`}
        hint="—"
        tag="리그오브레전드"
        tone="amber"
      />
      <KpiCard
        icon={Sparkles}
        label="실시간 감정 비율"
        value={`${dominantEmotion.label} ${dominantEmotion.value}%`}
        hint="—"
        tone="rose"
      />
    </div>
  );
}
