/**
 * @file 대시보드 컴포넌트 공유 타입
 * @usedBy src/features/dashboard/components/*, src/pages/DashboardPage.tsx
 */

/** 대화 스트림 메시지의 화자 타입 */
export type ConversationSpeaker = "streamer" | "ai" | "chat";

/** 원본 방송 dialogue subject 를 UI 친화형으로 보존 */
export type ConversationSubject = "streamer" | "ai" | "viewer" | "donation" | "game_event" | "system_summary";

/** 대화 스트림 단일 메시지 */
export interface ConversationMessage {
  id: string;
  speaker: ConversationSpeaker;
  subject: ConversationSubject;
  /** 채팅(viewer)의 경우 닉네임, AI/스트리머는 비워둠 */
  username?: string;
  text: string;
  timestamp: Date;
}

/** 메시지 타입별 표시 ON/OFF 필터 */
export interface ConversationFilterState {
  streamer: boolean;
  ai: boolean;
  chat: boolean;
}

/** 캐릭터 초상의 발화 상태 */
export type SpeakingState = "idle" | "listening" | "speaking";
