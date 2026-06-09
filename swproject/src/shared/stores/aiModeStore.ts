/**
 * @file AI 모드 및 대시보드 상태 관리 Store
 * @created Sprint 2 - Dashboard Main
 * @dependsOn zustand
 * @usedBy src/pages/DashboardPage.tsx, src/features/dashboard/components/*
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StreamDialogue, StreamEmotion } from '@/shared/types/stream';

export type AIMode = 'broadcasting' | 'idle' | 'gaming';
export type ReactionStrategy = 'cheer' | 'normal' | 'critical';
export type EmotionType = 'joy' | 'anger' | 'sadness' | 'fear' | 'surprise' | 'neutral';

export interface PersonaSlot {
  id: string | null;
  name: string;
  isActive: boolean;
}

export interface SensitivitySettings {
  reactionSpeed: number;      // 0-100: 반응 속도
  emotionIntensity: number;   // 0-100: 감정 강도
  contextUnderstanding: number; // 0-100: 문맥 이해도
  creativity: number;          // 0-100: 창의성
}

export interface QuickToggles {
  sttEnabled: boolean;         // 음성인식 (STT)
  ttsEnabled: boolean;         // 음성출력 (TTS)
  chatReactionEnabled: boolean; // 채팅 반응
  proactiveReactionEnabled: boolean; // 선제적 반응
}

export interface DashboardStats {
  viewerCount: number;
  chatSpeed: number;           // 분당 채팅 수
  emotionRatios: Record<EmotionType, number>; // 감정 비율 (%)
  aiResponseRate: number;      // AI 응답률 (%)
  broadcastDuration: number;   // 방송 시간 (초)
  totalChats: number;
  aiResponses: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  emotion: EmotionType;
  timestamp: Date;
}

export interface ActivityLog {
  id: string;
  type: 'reaction' | 'system' | 'chat' | 'emotion' | 'persona';
  message: string;
  timestamp: Date;
  level?: 'info' | 'warning' | 'error';
}

interface AIModeStore {
  // === AI 모드 및 전략 ===
  mode: AIMode;
  reactionStrategy: ReactionStrategy;
  isAutoStrategy: boolean;

  // === 방송 세션 (백엔드 /api/v1/stream/start 응답으로 채워짐) ===
  /** 백엔드가 발급한 방송 스트림 ID — WebSocket 채널 식별자로도 사용 예정 */
  broadcastStreamId: string | null;
  /** 방송 시작 시간 (서버 응답 문자열 그대로 보관, 예: "2026-04-26-14:30:00") */
  broadcastStartedAt: string | null;

  // === 상단 컨트롤 ===
  isPaused: boolean;
  isPTTActive: boolean;
  personaSlots: PersonaSlot[];
  activePersonaIndex: number;

  // === 빠른 제어 토글 ===
  toggles: QuickToggles;

  // === AI 반응 설정 (슬라이더) ===
  sensitivity: SensitivitySettings;

  // === 실시간 상태 ===
  stats: DashboardStats;

  // === 채팅 모니터 ===
  chatMessages: ChatMessage[];

  // === AI 활동 로그 ===
  activityLogs: ActivityLog[];

  // === 방송 대화 / 오버레이 준비 상태 ===
  dialogues: StreamDialogue[];
  nextCursor: number | null;
  hasNextDialogues: boolean;
  currentEmotion: StreamEmotion;
  currentTranscript: string;

  // === 액션 함수들 ===
  setMode: (mode: AIMode) => void;
  /**
   * 방송 시작 시 사용 — 백엔드 응답으로 mode='broadcasting' + streamId/startedAt 을 원자적으로 셋
   */
  setBroadcast: (broadcastStreamId: string, broadcastStartedAt: string) => void;
  /**
   * 방송 종료 시 사용 — mode='idle' + streamId/startedAt 을 한 번에 클리어
   */
  clearBroadcast: () => void;
  setReactionStrategy: (strategy: ReactionStrategy) => void;
  setIsAutoStrategy: (isAuto: boolean) => void;

  togglePause: () => void;
  togglePTT: () => void;
  setActivePersona: (index: number) => void;
  updatePersonaSlot: (index: number, slot: Partial<PersonaSlot>) => void;

  setToggle: (key: keyof QuickToggles, value: boolean) => void;
  setSensitivity: (key: keyof SensitivitySettings, value: number) => void;

  updateStats: (stats: Partial<DashboardStats>) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChatMessages: () => void;
  addActivityLog: (log: ActivityLog) => void;
  clearActivityLogs: () => void;
  setDialogues: (items: StreamDialogue[], nextCursor: number | null, hasNextDialogues?: boolean) => void;
  appendDialogues: (items: StreamDialogue[], nextCursor: number | null, hasNextDialogues?: boolean) => void;
  prependDialogues: (items: StreamDialogue[], nextCursor: number | null, hasNextDialogues?: boolean) => void;
  upsertDialogues: (items: StreamDialogue[], nextCursor: number | null, hasNextDialogues?: boolean) => void;
  /** 특정 id 의 dialogue 만 제거. 스트리밍 중 임시 dialogue 정리에 사용. */
  removeDialogue: (id: string) => void;
  clearDialogues: () => void;
  setEmotion: (emotion: StreamEmotion) => void;
  setCurrentTranscript: (transcript: string) => void;

  // === 초기화 ===
  resetToDefaults: () => void;
}

const MAX_CHAT_MESSAGES = 100;
const MAX_ACTIVITY_LOGS = 50;
const MAX_DIALOGUES = 100;

function sortAndLimitDialogues(items: StreamDialogue[]): StreamDialogue[] {
  return [...items]
    .sort((a, b) => {
      const ta = new Date(a.timestamp).getTime();
      const tb = new Date(b.timestamp).getTime();
      if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;

      // timestamp 가 같거나 파싱 불가하면 서버 cursorId 로 안정 정렬한다.
      if (a.cursorId == null && b.cursorId == null) return a.id.localeCompare(b.id);
      if (a.cursorId == null) return 1;
      if (b.cursorId == null) return -1;
      return a.cursorId - b.cursorId;
    })
    .slice(-MAX_DIALOGUES);
}

function mergeDialogues(existing: StreamDialogue[], incoming: StreamDialogue[]): StreamDialogue[] {
  const map = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => map.set(item.id, item));
  return sortAndLimitDialogues([...map.values()]);
}

const DEFAULT_SENSITIVITY: SensitivitySettings = {
  reactionSpeed: 50,
  emotionIntensity: 50,
  contextUnderstanding: 50,
  creativity: 50,
};

const DEFAULT_TOGGLES: QuickToggles = {
  sttEnabled: true,
  ttsEnabled: true,
  chatReactionEnabled: true,
  proactiveReactionEnabled: false,
};

const DEFAULT_PERSONA_SLOTS: PersonaSlot[] = [
  { id: null, name: '슬롯 1', isActive: false },
  { id: null, name: '슬롯 2', isActive: false },
  { id: null, name: '슬롯 3', isActive: false },
  { id: null, name: '슬롯 4', isActive: false },
];

const DEFAULT_STATS: DashboardStats = {
  viewerCount: 0,
  chatSpeed: 0,
  emotionRatios: {
    joy: 0,
    anger: 0,
    sadness: 0,
    fear: 0,
    surprise: 0,
    neutral: 0,
  },
  aiResponseRate: 0,
  broadcastDuration: 0,
  totalChats: 0,
  aiResponses: 0,
};

export const useAIModeStore = create<AIModeStore>()(
  persist(
    (set) => ({
      // === 초기 상태 ===
      mode: 'idle',
      reactionStrategy: 'normal',
      isAutoStrategy: true,

      broadcastStreamId: null,
      broadcastStartedAt: null,

      isPaused: false,
      isPTTActive: false,
      personaSlots: DEFAULT_PERSONA_SLOTS,
      activePersonaIndex: 0,

      toggles: DEFAULT_TOGGLES,
      sensitivity: DEFAULT_SENSITIVITY,

      stats: DEFAULT_STATS,
      chatMessages: [],
      activityLogs: [],
      dialogues: [],
      nextCursor: null,
      hasNextDialogues: false,
      currentEmotion: 'DEFAULT',
      currentTranscript: '',

      // === AI 모드 및 전략 ===
      setMode: (mode) => set({ mode }),
      /**
       * 새 방송 세션 시작.
       * - mode/streamId/startedAt 셋팅과 동시에 이전 세션의 dialogues/activityLogs/currentEmotion/currentTranscript 를 비움.
       *   (캐릭터 전환 후 이전 캐릭터의 채팅 기록이 잔재로 남는 버그 방지)
       */
      setBroadcast: (broadcastStreamId, broadcastStartedAt) =>
        set({
          mode: 'broadcasting',
          broadcastStreamId,
          broadcastStartedAt,
          dialogues: [],
          nextCursor: null,
          hasNextDialogues: false,
          activityLogs: [],
          currentEmotion: 'DEFAULT',
          currentTranscript: '',
        }),
      /**
       * 방송 종료 — 세션 관련 모든 휘발성 데이터 같이 정리.
       * (mode/streamId 만 비우고 dialogues 가 남아있으면 다음 세션에 잔재로 노출됨)
       */
      clearBroadcast: () =>
        set({
          mode: 'idle',
          broadcastStreamId: null,
          broadcastStartedAt: null,
          dialogues: [],
          nextCursor: null,
          hasNextDialogues: false,
          activityLogs: [],
          currentEmotion: 'DEFAULT',
          currentTranscript: '',
        }),
      setReactionStrategy: (reactionStrategy) => set({ reactionStrategy }),
      setIsAutoStrategy: (isAutoStrategy) => set({ isAutoStrategy }),

      // === 상단 컨트롤 ===
      togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
      togglePTT: () => set((state) => ({ isPTTActive: !state.isPTTActive })),
      setActivePersona: (activePersonaIndex) => set({ activePersonaIndex }),
      updatePersonaSlot: (index, slot) =>
        set((state) => ({
          personaSlots: state.personaSlots.map((p, i) =>
            i === index ? { ...p, ...slot } : p
          ),
        })),

      // === 빠른 제어 토글 ===
      setToggle: (key, value) =>
        set((state) => ({
          toggles: { ...state.toggles, [key]: value },
        })),

      // === AI 반응 설정 ===
      setSensitivity: (key, value) =>
        set((state) => ({
          sensitivity: { ...state.sensitivity, [key]: value },
        })),

      // === 실시간 상태 ===
      updateStats: (stats) =>
        set((state) => ({
          stats: { ...state.stats, ...stats },
        })),

      // === 채팅 모니터 ===
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages.slice(-(MAX_CHAT_MESSAGES - 1)), message], // 최대 100개 유지
        })),
      clearChatMessages: () => set({ chatMessages: [] }),

      // === AI 활동 로그 ===
      addActivityLog: (log) =>
        set((state) => ({
          activityLogs: [...state.activityLogs.slice(-(MAX_ACTIVITY_LOGS - 1)), log], // 최대 50개 유지
        })),
      clearActivityLogs: () => set({ activityLogs: [] }),

      // === 방송 대화 / 오버레이 ===
      setDialogues: (items, nextCursor, hasNextDialogues = false) =>
        set({
          dialogues: sortAndLimitDialogues(items),
          nextCursor,
          hasNextDialogues,
        }),
      appendDialogues: (items, nextCursor, hasNextDialogues = false) =>
        set((state) => {
          return {
            dialogues: mergeDialogues(state.dialogues, items),
            nextCursor: nextCursor ?? state.nextCursor,
            hasNextDialogues,
          };
        }),
      prependDialogues: (items, nextCursor, hasNextDialogues = false) =>
        set((state) => {
          return {
            dialogues: mergeDialogues(items, state.dialogues),
            nextCursor: nextCursor ?? state.nextCursor,
            hasNextDialogues,
          };
        }),
      upsertDialogues: (items, nextCursor, hasNextDialogues) =>
        set((state) => {
          return {
            dialogues: mergeDialogues(state.dialogues, items),
            nextCursor: nextCursor ?? state.nextCursor,
            hasNextDialogues: hasNextDialogues ?? state.hasNextDialogues,
          };
        }),
      removeDialogue: (id) =>
        set((state) => ({
          dialogues: state.dialogues.filter((item) => item.id !== id),
        })),
      clearDialogues: () => set({ dialogues: [], nextCursor: null, hasNextDialogues: false }),
      setEmotion: (currentEmotion) => set({ currentEmotion }),
      setCurrentTranscript: (currentTranscript) => set({ currentTranscript }),

      // === 초기화 ===
      resetToDefaults: () =>
        set({
          mode: 'idle',
          broadcastStreamId: null,
          broadcastStartedAt: null,
          reactionStrategy: 'normal',
          isAutoStrategy: true,
          isPaused: false,
          isPTTActive: false,
          personaSlots: DEFAULT_PERSONA_SLOTS,
          activePersonaIndex: 0,
          toggles: DEFAULT_TOGGLES,
          sensitivity: DEFAULT_SENSITIVITY,
          stats: DEFAULT_STATS,
          chatMessages: [],
          activityLogs: [],
          dialogues: [],
          nextCursor: null,
          hasNextDialogues: false,
          currentEmotion: 'DEFAULT',
          currentTranscript: '',
        }),
    }),
    {
      name: 'ai-mode-storage',
      partialize: (state) => ({
        // 영구 저장할 상태만 선택
        reactionStrategy: state.reactionStrategy,
        isAutoStrategy: state.isAutoStrategy,
        toggles: state.toggles,
        sensitivity: state.sensitivity,
        personaSlots: state.personaSlots,
        activePersonaIndex: state.activePersonaIndex,
        // 실시간 데이터는 저장하지 않음
        // stats, chatMessages, activityLogs 제외
      }),
    }
  )
);
