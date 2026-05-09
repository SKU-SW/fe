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
}

export function ConversationStream({ messages, filter, onFilterChange, chatLogOn, onToggleChatLog }: ConversationStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col rounded bg-[#2b2d31] border border-[#1e1f22]">
      {/* 상단 필터 및 전체 채팅 스위치 바 */}
      <div className="flex items-center justify-between border-b border-[#1e1f22] bg-transparent px-4 py-2">
        <div className="flex items-center gap-2">
          <FilterChip
            label="AI 캐릭터"
            active={filter.ai}
            onClick={() => onFilterChange({ ...filter, ai: !filter.ai })}
            colorClass="bg-[#949ba4]"
          />
          <FilterChip
            label="스트리머"
            active={filter.streamer}
            onClick={() => onFilterChange({ ...filter, streamer: !filter.streamer })}
            colorClass="bg-[#0ea5e9]"
          />
          <FilterChip
            label="시청자 채팅"
            active={filter.chat}
            onClick={() => onFilterChange({ ...filter, chat: !filter.chat })}
            colorClass="bg-[#4752c4]"
          />
        </div>

        {onToggleChatLog && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#949ba4]">
              전체 채팅
            </span>
            <button
              type="button"
              onClick={onToggleChatLog}
              role="switch"
              aria-checked={chatLogOn}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                chatLogOn ? "bg-[#23a559]" : "bg-[#4e5058]"
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
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm font-medium text-[#949ba4]">아직 대화가 없습니다.</p>
        ) : (
          messages.map((m) => (
            <MessageRow key={m.id} message={m} hidden={!filter[m.speaker]} />
          ))
        )}
      </div>
    </div>
  );
}

const SPEAKER_LABEL: Record<ConversationSpeaker, string> = {
  streamer: "스트리머",
  ai: "AI",
  chat: "채팅",
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
        <span className="mb-1 text-xs font-semibold text-[#949ba4] px-1">
          {message.username ? message.username : SPEAKER_LABEL[message.speaker]}
        </span>
        
        <div className={`flex items-end gap-2 ${isAI ? "flex-row" : "flex-row-reverse"}`}>
          {/* 말풍선 */}
          <div 
            className={`rounded-2xl px-4 py-2 text-sm text-white leading-relaxed break-words shadow-sm ${
              message.speaker === "ai"
                ? "bg-[#4e5058] rounded-tl-sm" // AI (회색)
                : message.speaker === "streamer"
                ? "bg-[#0ea5e9] rounded-tr-sm" // 스트리머 (하늘색)
                : "bg-[#4752c4] rounded-tr-sm" // 시청자 채팅 (진한 파란색)
            }`}
          >
            {message.text}
          </div>

          {/* 시간 표시 */}
          <span className="text-[10px] font-medium text-[#949ba4] shrink-0 mb-1">
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
      className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[13px] font-bold transition-colors ${
        active 
          ? "bg-[#404249] text-[#f2f3f5]" 
          : "bg-transparent text-[#949ba4] hover:bg-[#3f4147]"
      }`}
      aria-pressed={active}
    >
      <span className={`h-2 w-2 rounded-full ${active ? colorClass : "bg-[#4e5058]"}`} />
      {label}
    </button>
  );
}
