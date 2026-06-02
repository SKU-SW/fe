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
import { Activity, Mic, MicOff, Users, MessageSquare, Sparkles } from "lucide-react";
import { useAIModeStore } from "@/shared/stores/aiModeStore";
import { useCharacterStore } from "@/shared/stores/characterStore";
import { useCharacter } from "@/features/character/hooks";
import { useBroadcastWSState, useStreamInfo } from "@/features/broadcast/hooks";
import { useSTT } from "@/features/stt/hooks";
import { resolveAssetUrl } from "@/shared/lib/utils";
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

/**
 * StreamDialogue.speaker(4종) → ConversationStream 컴포넌트가 받는 ConversationSpeaker(3종) 매핑.
 * - SYSTEM_SUMMARY 는 AI 측 발화의 일종으로 간주해 'ai' 로 매핑.
 *   향후 별도 system 카테고리가 필요하면 ConversationSpeaker 자체를 확장.
 */
const SPEAKER_MAP: Record<StreamDialogue["speaker"], ConversationSpeaker> = {
  streamer: "streamer",
  ai: "ai",
  viewer: "chat",
  system: "ai",
};

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
  const dialogues = useAIModeStore((s) => s.dialogues);
  const activityLogs = useAIModeStore((s) => s.activityLogs);

  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const { character } = useCharacter(selectedCharacterId);
  const overlayCharacterName = character?.characterName ?? "AI";
  const overlayCharacterImageUrl = resolveAssetUrl(character?.characterImageUrl);

  // 대시보드 진입 시 채팅 화면은 비우고, 현재 방송 정보만 확인한다.
  // 이후 새 dialogue 는 STT/WebSocket 응답과 viewer polling 으로 아래부터 쌓인다.
  const {
    characterInfo,
    error: streamInfoError,
    refetch: refetchStreamInfo,
  } = useStreamInfo({ size: 1 });
  const {
    isConnected: wsConnected,
    error: wsError,
  } = useBroadcastWSState();
  const streamCharacterImageUrl = resolveAssetUrl(characterInfo?.characterImageUrl);
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
  } = useSTT();

  // 로컬 UI 상태
  const [logOpen, setLogOpen] = useState(false);
  const [filter, setFilter] = useState<ConversationFilterState>({
    streamer: true,
    ai: true,
    chat: true,
  });
  const [micNoticeDismissed, setMicNoticeDismissed] = useState(false);

  useEffect(() => {
    if (toggles.sttEnabled) {
      setMicNoticeDismissed(false);
    }
  }, [toggles.sttEnabled]);

  const isBroadcasting = mode === "broadcasting";

  // store.dialogues (BE 진실의 근원) → ConversationStream 의 통합 메시지 모델로 변환
  const conversationMessages = useMemo<ConversationMessage[]>(
    () =>
      dialogues.map((d) => ({
        id: d.id,
        speaker: SPEAKER_MAP[d.speaker],
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
          className="rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-xs text-status-danger"
        >
          {sttError}
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
          name={overlayCharacterName}
          speakingState={isListening ? "listening" : "idle"}
        />

        <div className="h-[420px] flex flex-col lg:h-[500px]">
          <ConversationStream
            chatLogOn={toggles.chatReactionEnabled}
            onToggleChatLog={() => setToggle("chatReactionEnabled", !toggles.chatReactionEnabled)}
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
 * Push-to-Talk 안내 인디케이터 (Ctrl/Cmd+Shift+M Hold)
 * - sttEnabled OFF: 표시 안 함 (사용자가 일부러 끈 상태)
 * - WS 연결 중: "연결 대기" 회색
 * - 듣는 중: 빨간 펄스
 * - 평상시: "Ctrl/Cmd+Shift+M 누르고 말하기" 안내
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
        Ctrl/Cmd + Shift + M
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
        tone="indigo"
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
import { buildEmotionImageMap } from "@/shared/lib/characterEmotionImages";
import { useEmotionImagePreload } from "@/shared/hooks/useEmotionImagePreload";
