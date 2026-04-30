/**
 * @file 실시간 대화 스트림 + 화자 타입 필터
 * - 메시지 타입(스트리머/AI/채팅)별 색상·정렬·아이콘 분기
 * - 상단 체크박스로 타입 필터링: OFF 시 슬라이드 아웃 애니메이션 (CSS only)
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useEffect, useRef } from "react";
import { Check, MessageCircle, Mic, User } from "lucide-react";
import type { ConversationFilterState, ConversationMessage, ConversationSpeaker } from "../types";

interface ConversationStreamProps {
  messages: ConversationMessage[];
  filter: ConversationFilterState;
  onFilterChange: (next: ConversationFilterState) => void;
}

export function ConversationStream({ messages, filter, onFilterChange }: ConversationStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 새 메시지 들어오면 자동 스크롤 (가장 최근 메시지 보이게)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-700/50 bg-slate-900/60">
      {/* 필터 체크박스 */}
      <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-2.5">
        <FilterChip
          label="AI 캐릭터"
          icon={<Mic className="h-3 w-3" />}
          active={filter.ai}
          onClick={() => onFilterChange({ ...filter, ai: !filter.ai })}
          accent="amber"
        />
        <FilterChip
          label="스트리머"
          icon={<User className="h-3 w-3" />}
          active={filter.streamer}
          onClick={() => onFilterChange({ ...filter, streamer: !filter.streamer })}
          accent="indigo"
        />
        <FilterChip
          label="채팅"
          icon={<MessageCircle className="h-3 w-3" />}
          active={filter.chat}
          onClick={() => onFilterChange({ ...filter, chat: !filter.chat })}
          accent="emerald"
        />
      </div>

      {/* 메시지 영역 */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-xs text-slate-500">아직 대화가 없습니다.</p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} hidden={!filter[m.speaker]} />
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================
// 메시지 버블
// ============================================================

const SPEAKER_ALIGN: Record<ConversationSpeaker, string> = {
  streamer: "self-end",
  chat: "self-end",
  ai: "self-start",
};

const SPEAKER_BUBBLE: Record<ConversationSpeaker, string> = {
  streamer: "bg-indigo-500/20 border-indigo-500/40 text-indigo-100",
  ai: "bg-amber-500/15 border-amber-500/30 text-amber-100",
  chat: "bg-emerald-500/15 border-emerald-500/30 text-emerald-100",
};

const SPEAKER_LABEL: Record<ConversationSpeaker, string> = {
  streamer: "스트리머",
  ai: "AI",
  chat: "채팅",
};

function MessageBubble({ message, hidden }: { message: ConversationMessage; hidden: boolean }) {
  const isRight = message.speaker !== "ai";

  return (
    <div
      className={`flex transition-all duration-300 ease-out ${
        hidden
          ? `pointer-events-none max-h-0 -my-1 opacity-0 ${isRight ? "translate-x-12" : "-translate-x-12"}`
          : "max-h-40 opacity-100 translate-x-0"
      } ${isRight ? "justify-end" : "justify-start"}`}
      aria-hidden={hidden}
    >
      <div className={`flex max-w-[85%] flex-col gap-0.5 ${SPEAKER_ALIGN[message.speaker]}`}>
        <span className="px-1 text-[10px] text-slate-500">
          {SPEAKER_LABEL[message.speaker]}
          {message.username && <> · {message.username}</>}
        </span>
        <div
          className={`rounded-xl border px-3 py-2 text-sm leading-relaxed ${SPEAKER_BUBBLE[message.speaker]}`}
        >
          {message.text}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 필터 칩
// ============================================================

const ACCENT_CLASSES = {
  amber: { on: "border-amber-500/40 bg-amber-500/15 text-amber-200", off: "border-slate-700 bg-slate-800/40 text-slate-500" },
  indigo: { on: "border-indigo-500/40 bg-indigo-500/15 text-indigo-200", off: "border-slate-700 bg-slate-800/40 text-slate-500" },
  emerald: { on: "border-emerald-500/40 bg-emerald-500/15 text-emerald-200", off: "border-slate-700 bg-slate-800/40 text-slate-500" },
} as const;

function FilterChip({
  label,
  icon,
  active,
  onClick,
  accent,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  accent: keyof typeof ACCENT_CLASSES;
}) {
  const cls = ACCENT_CLASSES[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
        active ? cls.on : cls.off
      }`}
      aria-pressed={active}
    >
      <span
        className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded border ${
          active ? "border-current bg-current/20" : "border-slate-600"
        }`}
      >
        {active && <Check className="h-3 w-3" />}
      </span>
      {icon}
      {label}
    </button>
  );
}
