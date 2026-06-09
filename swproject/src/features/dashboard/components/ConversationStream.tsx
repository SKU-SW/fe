/**
 * @file 실시간 대화 스트림 + 화자 타입 필터
 * KakaoTalk bubble style
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useEffect, useRef } from "react";
import type { ConversationFilterState, ConversationMessage, ConversationSpeaker } from "../types";

interface ConversationStreamProps {
  messages: ConversationMessage[];
  filter: ConversationFilterState;
  onFilterChange: (next: ConversationFilterState) => void;
  chatLogOn?: boolean;
  onToggleChatLog?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export function ConversationStream({
  messages,
  filter,
  onFilterChange,
  chatLogOn,
  onToggleChatLog,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}: ConversationStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border-strong bg-surface-panel shadow-sm transition-colors">
      {/* 상단 필터 및 전체 채팅 스위치 바 */}
      <div className="flex items-center justify-between border-b border-border-default bg-surface-raised/55 px-6 py-3">
        <div className="flex items-center gap-2">
          <FilterChip
            label="AI 캐릭터"
            active={filter.ai}
            onClick={() => onFilterChange({ ...filter, ai: !filter.ai })}
            colorClass="bg-chat-ai"
          />
          <FilterChip
            label="스트리머"
            active={filter.streamer}
            onClick={() => onFilterChange({ ...filter, streamer: !filter.streamer })}
            colorClass="bg-chat-streamer"
          />
          <FilterChip
            label="시청자 채팅"
            active={filter.chat}
            onClick={() => onFilterChange({ ...filter, chat: !filter.chat })}
            colorClass="bg-chat-viewer"
          />
        </div>

        {onToggleChatLog && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-content-muted">
              전체 채팅
            </span>
            <button
              type="button"
              onClick={onToggleChatLog}
              role="switch"
              aria-checked={chatLogOn}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                chatLogOn ? "bg-status-success" : "bg-surface-active"
              }`}
            >
              <span className="sr-only">전체 채팅</span>
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  chatLogOn ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* 메시지 영역 (카카오톡 말풍선 스타일) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="rounded border border-border-default px-3 py-1 text-xs font-semibold text-content-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingMore ? "불러오는 중..." : "이전 대화 더 보기"}
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <p className="py-12 text-center text-base font-medium text-content-muted">아직 대화가 없습니다.</p>
        ) : (
          <div className="flex min-h-full flex-col justify-end gap-4">
            {messages.map((m) => (
              <MessageRow key={m.id} message={m} hidden={!filter[m.speaker]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const SPEAKER_LABEL: Record<ConversationSpeaker, string> = {
  streamer: "스트리머",
  ai: "AI",
  chat: "시청자",
};

const SUBJECT_META: Record<ConversationMessage["subject"], { label: string; badgeClass: string }> = {
  streamer: { label: "스트리머", badgeClass: "bg-chat-streamer/15 text-chat-streamer" },
  ai: { label: "AI", badgeClass: "bg-chat-ai/15 text-chat-ai" },
  viewer: { label: "시청자", badgeClass: "bg-chat-viewer/15 text-chat-viewer" },
  donation: { label: "도네", badgeClass: "bg-status-warning/15 text-status-warning" },
  game_event: { label: "게임", badgeClass: "bg-status-success/15 text-status-success" },
  system_summary: { label: "요약", badgeClass: "bg-brand/15 text-brand" },
};

function formatTime(date: Date) {
  return date.toLocaleTimeString("ko-KR", { hour12: true, hour: "numeric", minute: "2-digit" });
}

function MessageRow({ message, hidden }: { message: ConversationMessage; hidden: boolean }) {
  if (hidden) return null;

  // 카카오톡 스타일: AI는 왼쪽, 스트리머/시청자는 오른쪽
  const isAI = message.speaker === "ai";
  
  return (
    <div className={`flex w-full ${isAI ? "justify-start" : "justify-end"}`}>
      <div className={`flex max-w-[75%] flex-col ${isAI ? "items-start" : "items-end"}`}>
        
        {/* 발화자 이름 표시 (채팅이면 유저명, 아니면 스피커 라벨) */}
        <div className="mb-1 flex items-center gap-2 px-1">
          <span className="text-sm font-semibold text-content-muted">
            {message.username ? message.username : SPEAKER_LABEL[message.speaker]}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SUBJECT_META[message.subject].badgeClass}`}>
            {SUBJECT_META[message.subject].label}
          </span>
        </div>
        
        <div className={`flex items-end gap-2 ${isAI ? "flex-row" : "flex-row-reverse"}`}>
          {/* 말풍선 */}
          <div 
            className={`rounded-2xl px-4 py-2 text-base leading-relaxed break-words text-content-inverse shadow-sm ${
              message.speaker === "ai"
                ? "bg-chat-ai rounded-tl-sm"
                : message.speaker === "streamer"
                ? "bg-chat-streamer rounded-tr-sm"
                : "bg-chat-viewer rounded-tr-sm"
            }`}
          >
            {message.text}
          </div>

          {/* 시간 표시 */}
          <span className="mb-1 shrink-0 text-[10px] font-medium text-content-muted">
            {formatTime(message.timestamp || new Date())}
          </span>
        </div>

      </div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  colorClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  colorClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-sm font-bold transition-colors ${
        active 
          ? "bg-surface-active text-content-primary" 
          : "bg-transparent text-content-muted hover:bg-surface-hover hover:text-content-primary"
      }`}
      aria-pressed={active}
    >
      <span className={`h-2 w-2 rounded-full ${active ? colorClass : "bg-surface-active"}`} />
      {label}
    </button>
  );
}
