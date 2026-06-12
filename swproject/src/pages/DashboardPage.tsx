/**
 * @file 대시보드 메인 페이지
 * @updated Swagger 정렬 - 죽은 dashboard 폴링 코드 제거, /api/v1/stream/info 기반으로 재작성
 * @updated store.dialogues 를 ConversationStream 으로 매핑 (4종 subject → 3종 speaker)
 * @updated CharacterPortrait speakingState 를 STT isListening 기반으로 변경
 * @dependsOn src/features/dashboard/components/* (UI 컴포넌트)
 * @dependsOn src/features/broadcast/hooks/useStreamInfo (방송 진입 시 dialogue fetch)
 * @dependsOn src/features/stt/hooks (마이크 입력 → 텍스트)
 * @dependsOn src/shared/stores/aiModeStore.ts (mode/toggles/dialogues/activityLogs)
 * @dependsOn src/shared/stores/characterStore.ts (selectedCharacterId)
 * @dependsOn src/features/character/hooks/useCharacter.ts (선택된 캐릭터 상세)
 * @usedBy src/App.tsx
 *
 * 레이아웃:
 *   - mode === 'broadcasting' 이면 풀 대시보드 (헤더/초상/대화/컨트롤/KPI 4개)
 *   - 그 외엔 빈 상태 (캐릭터 페이지로 가는 CTA)
 */

import { useEffect, useMemo, useState } from "react";
import { Activity, Mic, MicOff, Users, MessageSquare, Sparkles, KeyRound } from "lucide-react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useCharacterStore } from "@/shared/stores/characterStore";
import { useCharacter } from "@/features/character/hooks";
import { resolveVrmRuntime } from "@/shared/lib/vrmRuntime";
import { useCharacterAppearanceStore } from "@/shared/stores/characterAppearanceStore";
import { useCharacterSettingsStore } from "@/shared/stores/characterSettingsStore";
import { useBroadcastWSState, useStreamDialoguesPagination, useStreamInfo, useViewerChatPolling } from "@/features/broadcast/hooks";
import { useSTT, useAccessibilityStatus } from "@/features/stt/hooks";
import { resolveAssetUrl } from "@/shared/lib/utils";
import { formatPttShortcut, useAppSettingsStore } from "@/shared/stores/appSettingsStore";
import {
  ActivityLogPanel,
  BroadcastControls,
  BroadcastHeader,
  CharacterPortrait,
  ConversationStream,
  DashboardEmptyState,
  KpiCard,
} from "@/features/dashboard/components";
import type {
  ConversationFilterState,
  ConversationMessage,
  ConversationSpeaker,
} from "@/features/dashboard/types";
import type { StreamDialogue } from "@/shared/types/stream";
import type { CharacterModelType } from "@/shared/types/character";
import { useChatAnalysis } from "@/features/stats/hooks/useChatAnalysis";
import type { PublicOpinion } from "@/features/stats/types";
import { useBroadcastSettings } from "@/features/settings/hooks/useBroadcastSettings";

// ============================================================
// 헬퍼 — BE DTO 표현을 UI 모델로 변환
// ============================================================

/**
 * 백엔드 timestamp 포맷 파서.
 * - BE 가 주는 형식: "YYYY-MM-DD-HH:MM:SS" (대시 4개로 구분되는 비표준)
 * - JS Date 가 직접 못 파싱하므로 정규식으로 분해 후 로컬 타임존 Date 생성
 * - 파싱 실패 시 ISO 표준 시도, 그래도 실패하면 현재 시각 fallback
 */
function parseDialogueTimestamp(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})-(\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if (m) {
    const [, y, mo, d, h, mi, se] = m;
    return new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(h),
      Number(mi),
      Number(se)
    );
  }
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}

/** StreamDialogue.speaker → ConversationStream 컴포넌트 표시 타입 매핑 */
const SPEAKER_MAP: Record<StreamDialogue["speaker"], ConversationSpeaker> = {
  streamer: "streamer",
  ai: "ai",
  viewer: "chat",
  system: "chat",
  system_summary: "ai",
};

const SUBJECT_MAP: Record<StreamDialogue["speaker"], ConversationMessage["subject"]> = {
  streamer: "streamer",
  ai: "ai",
  viewer: "viewer",
  system: "donation",
  system_summary: "system_summary",
};

const SUBJECT_KIND_TO_CONVERSATION: Record<StreamDialogue["subject"], ConversationMessage["subject"]> = {
  STREAMER: "streamer",
  AI_CHARACTER: "ai",
  VIEWER: "viewer",
  DONATION: "donation",
  GAME_EVENT: "game_event",
  SYSTEM_SUMMARY: "system_summary",
};

// ============================================================
// 페이지 컴포넌트
// ============================================================

export default function DashboardPage() {
  const mode = useAIModeStore((s) => s.mode);
  const stats = useAIModeStore((s) => s.stats);
  const currentEmotion = useAIModeStore((s) => s.currentEmotion);
  const toggles = useAIModeStore((s) => s.toggles);
  // selector 로 isPaused 를 구독해야 토글 변경 시 BroadcastControls 가 리렌더됨
  const isPaused = useAIModeStore((s) => s.isPaused);
  const setToggle = useAIModeStore((s) => s.setToggle);
  const togglePause = useAIModeStore((s) => s.togglePause);
  const dialogues = useAIModeStore((s) => s.dialogues);
  const activityLogs = useAIModeStore((s) => s.activityLogs);
  // 방송 설정(선제 반응) — 실 API. zustand는 내부에서 sync 됨.
  const { aiProactiveToChat, setAiProactive, isPending: isProactivePending } = useBroadcastSettings();
  const {
    characterInfo,
    error: streamInfoError,
    refetch: refetchStreamInfo,
  } = useStreamInfo({ size: 30 });
  const characterSettings = useCharacterSettingsStore((s) => s.settings);

  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const { character } = useCharacter(selectedCharacterId);
  const appearance = useCharacterAppearanceStore((s) =>
    characterInfo?.characterId
      ? s.getAppearance(characterInfo.characterId)
      : character?.characterId
        ? s.getAppearance(character.characterId)
        : undefined
  );
  const overlayCharacterName = character?.characterName ?? "AI";
  const resolvedVrmRuntime = resolveVrmRuntime({
    appearance,
    character,
    broadcastCharacter: characterInfo,
    settings: characterSettings,
  });
  const overlayCharacterImageUrl = resolvedVrmRuntime.characterImageUrl || resolveAssetUrl(character?.characterImageUrl);
  const overlayCharacterModelType = resolvedVrmRuntime.modelType;
  const overlayCharacterVrmUrl = resolvedVrmRuntime.vrmUrl;

  const {
    isConnected: wsConnected,
    error: wsError,
    isPlayingTTS,
  } = useBroadcastWSState();
  const streamCharacterImageUrl = resolveAssetUrl(characterInfo?.characterImageUrl);
  const effectiveCharacterVrmUrl = overlayCharacterVrmUrl;
  const effectiveModelType: CharacterModelType = overlayCharacterModelType;
  const effectiveCharacterImageUrl = streamCharacterImageUrl || overlayCharacterImageUrl;
  const effectiveEmotionImageMap = useMemo(
    () => buildEmotionImageMap(effectiveCharacterImageUrl),
    [effectiveCharacterImageUrl]
  );
  useEmotionImagePreload(effectiveEmotionImageMap);

  // 마이크 입력 → 로컬 STT (Faster Whisper 데몬)
  const {
    isListening,
    error: sttError,
    retrySTT,
  } = useSTT();

  // 전역 PTT(다른 창 포커스 중 단축키)용 손쉬운 사용 권한 상태
  const { trusted: accessibilityTrusted, isMac, openSettings: openAccessibilitySettings } =
    useAccessibilityStatus();

  // 로컬 UI 상태
  const [logOpen, setLogOpen] = useState(false);
  const [filter, setFilter] = useState<ConversationFilterState>({
    streamer: true,
    ai: true,
    chat: true,
  });
  const { hasNext, isLoading: isLoadingMore, loadMore } = useStreamDialoguesPagination({
    subjectFilters: {
      ai: filter.ai,
      streamer: filter.streamer,
      viewer: filter.chat,
    },
    pageSize: 30,
  });
  const [micNoticeDismissed, setMicNoticeDismissed] = useState(false);

  useEffect(() => {
    if (toggles.sttEnabled) {
      setMicNoticeDismissed(false);
    }
  }, [toggles.sttEnabled]);

  const isBroadcasting = mode === "broadcasting";

  // 시청자 채팅 polling 은 대시보드 체류 + 방송 중일 때만. (전역 폴링 금지 — 서버 부하/로그 절감)
  useViewerChatPolling(isBroadcasting);

  // store.dialogues (BE 진실의 근원) → ConversationStream 의 통합 메시지 모델로 변환
  const conversationMessages = useMemo<ConversationMessage[]>(
    () =>
      dialogues.map((d) => ({
        id: d.id,
        speaker: SPEAKER_MAP[d.speaker],
        subject: SUBJECT_KIND_TO_CONVERSATION[d.subject] ?? SUBJECT_MAP[d.speaker],
        text: d.text,
        timestamp: parseDialogueTimestamp(d.timestamp),
        // username: BE BroadcastDialogueCursorItemResDto 에 viewer 닉네임 필드 없음 → undefined
      })),
    [dialogues]
  );

  // 방송 중이 아닐 때
  if (!isBroadcasting) {
    return (
      <div className="px-0 py-0">
        <DashboardEmptyState />
      </div>
    );
  }

  // 방송 중일 때
  return (
    <div className="flex flex-col gap-6 px-0 py-0">
      <BroadcastHeader logOpen={logOpen} onToggleLog={() => setLogOpen((v) => !v)} />

      {!toggles.sttEnabled && !micNoticeDismissed && (
        <MicWarningBanner
          onEnable={() => setToggle("sttEnabled", true)}
          onDismiss={() => setMicNoticeDismissed(true)}
        />
      )}

      {toggles.sttEnabled && isMac === true && accessibilityTrusted === false && (
        <AccessibilityWarningBanner onOpenSettings={openAccessibilitySettings} />
      )}

      {streamInfoError && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-border-default bg-surface-panel px-3 py-2 text-xs text-content-secondary shadow-sm"
        >
          <span>{streamInfoError}</span>
          <button
            type="button"
            onClick={() => void refetchStreamInfo()}
            className="rounded border border-border-strong px-2 py-0.5 font-semibold text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary"
          >
            다시 시도
          </button>
        </div>
      )}

      {wsError && (
        <div
          role="status"
          className="rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
        >
          {wsError}
        </div>
      )}

      {sttError && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
        >
          <span className="min-w-0 flex-1">{sttError}</span>
          <button
            type="button"
            onClick={() => void retrySTT()}
            className="shrink-0 rounded-md border border-status-danger/40 px-2.5 py-1 font-medium text-status-danger transition-colors hover:bg-status-danger/15"
          >
            다시 시도
          </button>
        </div>
      )}

      <PttIndicator
        sttEnabled={toggles.sttEnabled}
        wsConnected={wsConnected}
        isListening={isListening}
      />

      {/* 메인: 좌(초상) / 우(대화 스트림) — 2 컬럼 */}
      <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-[minmax(320px,400px)_1fr]">
        <CharacterPortrait
          imageUrl={overlayCharacterImageUrl}
          vrmUrl={effectiveModelType === "3D" ? effectiveCharacterVrmUrl : null}
          name={overlayCharacterName}
          speakingState={isPlayingTTS ? "speaking" : isListening ? "listening" : "idle"}
          emotion={currentEmotion}
          isSpeaking={isPlayingTTS}
        />

        <div className="h-[420px] flex flex-col lg:h-[500px]">
          <ConversationStream
            chatLogOn={toggles.chatReactionEnabled}
            onToggleChatLog={() => setToggle("chatReactionEnabled", !toggles.chatReactionEnabled)}
            messages={conversationMessages}
            filter={filter}
            onFilterChange={setFilter}
            hasMore={hasNext}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => void loadMore()}
          />
        </div>
      </div>

      {/* 컨트롤 바 */}
      <BroadcastControls
        sttOn={toggles.sttEnabled}
        proactiveOn={aiProactiveToChat}
        ttsOn={toggles.ttsEnabled}
        chatLogOn={toggles.chatReactionEnabled}
        aiOn={!isPaused}
        onToggleStt={() => setToggle("sttEnabled", !toggles.sttEnabled)}
        onToggleProactive={() => {
          if (isProactivePending) return;
          void setAiProactive(!aiProactiveToChat);
        }}
        onToggleTts={() => setToggle("ttsEnabled", !toggles.ttsEnabled)}
        onToggleChatLog={() => setToggle("chatReactionEnabled", !toggles.chatReactionEnabled)}
        onToggleAi={togglePause}
      />

      {/* KPI 4개 카드 */}
      <KpiGrid stats={stats} />

      <ActivityLogPanel open={logOpen} logs={activityLogs} onClose={() => setLogOpen(false)} />
    </div>
  );
}

// ============================================================
// 보조 컴포넌트 (페이지 내부)
// ============================================================

/**
 * Push-to-Talk 안내 인디케이터
 * - sttEnabled OFF: 표시 안 함 (사용자가 일부러 끈 상태)
 * - WS 연결 중: "연결 대기" 회색
 * - 듣는 중: 빨간 펄스
 * - 평상시: 현재 설정된 단축키 안내
 */
function PttIndicator({
  sttEnabled,
  wsConnected,
  isListening,
}: {
  sttEnabled: boolean;
  wsConnected: boolean;
  isListening: boolean;
}) {
  const pttShortcut = useAppSettingsStore((s) => s.pttShortcut);

  if (!sttEnabled) return null;

  if (isListening) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 bg-transparent px-2 py-1 text-xs font-medium text-status-danger"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-danger opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-danger" />
        </span>
        듣는 중... (키를 떼면 전송됩니다)
      </div>
    );
  }

  if (!wsConnected) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 bg-transparent px-2 py-1 text-xs font-medium text-content-muted"
      >
        <span className="h-2 w-2 rounded-full bg-content-muted" />
        방송 채널 연결 중...
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-transparent px-2 py-1 text-xs font-medium text-content-muted"
    >
      <Mic className="h-3.5 w-3.5" />
      <kbd className="rounded border border-border-strong bg-surface-active px-1.5 py-0.5 font-mono text-xs text-content-primary">
        {formatPttShortcut(pttShortcut)}
      </kbd>
      <span>을 누르고 있는 동안 말하면 AI 캐릭터에게 전달됩니다.</span>
    </div>
  );
}

function MicWarningBanner({ onEnable, onDismiss }: { onEnable: () => void; onDismiss: () => void }) {
  return (
    <div className="rounded-md border border-border-default bg-surface-panel/90 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded bg-surface-raised p-2 text-content-muted">
            <MicOff className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-content-secondary">마이크가 꺼져 있습니다</p>
            <p className="mt-1 text-xs text-content-muted">
              현재 상태에서는 스트리머 음성을 입력받지 못해 호출어 감지와 음성인식 기반 반응을 수행할
              수 없습니다. 방송 흐름을 따라가려면 마이크를 켜주세요.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-lg bg-surface-raised px-3 py-1.5 text-xs font-medium text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-primary"
          >
            나중에
          </button>
          <button
            type="button"
            onClick={onEnable}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-content-inverse transition-colors hover:bg-brand-hover"
          >
            마이크 켜기
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 손쉬운 사용 권한 안내 배너
 * - macOS 에서 전역 PTT(uiohook)는 손쉬운 사용 권한이 있어야 다른 창 포커스 중에도 동작한다.
 * - 미부여 시 노출. 단, 앱 창이 떠 있는 동안은 인앱 PTT 폴백(useInAppPtt)이 그대로 동작하므로
 *   "지금도 앱 안에서는 단축키가 동작한다"는 점을 함께 안내해 혼란을 줄인다.
 */
function AccessibilityWarningBanner({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="rounded-md border border-status-warning/30 bg-status-warning/10 p-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded bg-status-warning/15 p-2 text-status-warning">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-content-secondary">전역 단축키 권한이 필요합니다</p>
            <p className="mt-1 text-xs text-content-muted">
              다른 창(OBS·게임 등)에 포커스가 있는 동안에도 PTT 단축키로 말하려면 macOS{" "}
              <span className="font-semibold">손쉬운 사용</span> 권한이 필요합니다. 재설치 후에는
              기존 항목을 지우고 다시 추가해야 할 수 있습니다.
              <br />
              <span className="text-content-secondary">
                이 앱 창이 떠 있는 동안에는 권한 없이도 단축키가 그대로 동작합니다.
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-content-inverse transition-colors hover:bg-brand-hover"
          >
            권한 설정 열기
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 헬퍼 — 채팅 분석 KPI 표시 변환
// ============================================================

function formatDominantSentiment(
  opinion: PublicOpinion,
): { value: string; hint: string } {
  const entries: [string, number][] = [
    ["긍정", opinion.positiveRatio],
    ["중립", opinion.neutralRatio],
    ["부정", opinion.negativeRatio],
  ];
  const dominant = entries.reduce((best, curr) =>
    curr[1] > best[1] ? curr : best,
  );
  return {
    value: `${dominant[0]} ${Math.round(dominant[1])}%`,
    hint: `최근 10분 · 총 ${opinion.totalChatCount.toLocaleString()}건`,
  };
}

function formatChatSpeed(
  opinion: PublicOpinion,
): { value: string; hint: string } {
  const perMinute = Math.round(opinion.totalChatCount / 10);
  return {
    value: `${perMinute}개/분`,
    hint: `최근 10분 · 총 ${opinion.totalChatCount.toLocaleString()}건`,
  };
}

function resolveFallback(
  isLoading: boolean,
  isBroadcastInactive: boolean,
  hasError: boolean,
): { value: string; hint: string } {
  if (isBroadcastInactive) return { value: "—", hint: "방송 대기 중" };
  if (hasError) return { value: "—", hint: "데이터를 불러올 수 없습니다" };
  if (isLoading) return { value: "—", hint: "불러오는 중..." };
  return { value: "—", hint: "—" };
}

function KpiGrid({ stats }: { stats: ReturnType<typeof useAIModeStore.getState>["stats"] }) {
  const {
    data: chatStats,
    isLoading: isChatStatsLoading,
    isBroadcastInactive: isChatStatsInactive,
    error: chatStatsError,
  } = useChatAnalysis();

  const opinion = chatStats?.publicOpinion ?? null;
  const fallback = resolveFallback(isChatStatsLoading, isChatStatsInactive, Boolean(chatStatsError));
  const chatSpeedDisplay = opinion ? formatChatSpeed(opinion) : fallback;
  const sentimentDisplay = opinion ? formatDominantSentiment(opinion) : fallback;

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
        value={chatSpeedDisplay.value}
        hint={chatSpeedDisplay.hint}
        tag="리그오브레전드"
        tone="indigo"
      />
      <KpiCard
        icon={Sparkles}
        label="실시간 감정 비율"
        value={sentimentDisplay.value}
        hint={sentimentDisplay.hint}
        tone="rose"
      />
    </div>
  );
}
import { buildEmotionImageMap } from "@/shared/lib/characterEmotionImages";
import { useEmotionImagePreload } from "@/shared/hooks/useEmotionImagePreload";
