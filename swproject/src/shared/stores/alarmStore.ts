/**
 * @file 전역 알람 로그 저장소
 * @dependsOn zustand, zustand/middleware
 * @dependsOn src/shared/constants/alarmMessages.ts
 * @usedBy src/components/layouts/DashboardHeader.tsx
 * @usedBy src/features/alarm/components/AlarmPanel.tsx
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  formatAlarm,
  type AlarmKey,
  type AlarmSeverity,
} from "@/shared/constants/alarmMessages";

const DEFAULT_MAX_ENTRIES = 200;
const REPEAT_WINDOW_MS = 30_000;
const REPEAT_SUFFIX_REGEX = / \((\d+)회\)$/;

export interface AlarmEntry {
  id: string;
  key: AlarmKey;
  text: string;
  severity: AlarmSeverity;
  createdAt: number;
  read: boolean;
}

interface AlarmStore {
  entries: AlarmEntry[];
  maxEntries: number;
  push: (key: AlarmKey, vars?: Record<string, string | number>) => void;
  markAllRead: () => void;
  clearAll: () => void;
  unreadCount: () => number;
}

function makeAlarmId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readRepeatCount(text: string, baseText: string): number {
  if (text === baseText) return 1;
  const match = text.match(REPEAT_SUFFIX_REGEX);
  if (!match) return 1;
  const withoutSuffix = text.replace(REPEAT_SUFFIX_REGEX, "");
  if (withoutSuffix !== baseText) return 1;
  return Number(match[1]) || 1;
}

function toRepeatedText(baseText: string, count: number): string {
  return count <= 1 ? baseText : `${baseText} (${count}회)`;
}

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set, get) => ({
      entries: [],
      maxEntries: DEFAULT_MAX_ENTRIES,
      push: (key, vars) => {
        const { severity, text } = formatAlarm(key, vars);
        const createdAt = Date.now();

        set((state) => {
          const [lastEntry, ...restEntries] = state.entries;
          if (
            lastEntry &&
            lastEntry.key === key &&
            createdAt - lastEntry.createdAt < REPEAT_WINDOW_MS
          ) {
            const nextCount = readRepeatCount(lastEntry.text, text) + 1;
            return {
              entries: [
                {
                  ...lastEntry,
                  text: toRepeatedText(text, nextCount),
                  severity,
                  createdAt,
                  read: false,
                },
                ...restEntries,
              ],
            };
          }

          const nextEntries = [
            {
              id: makeAlarmId(),
              key,
              text,
              severity,
              createdAt,
              read: false,
            },
            ...state.entries,
          ].slice(0, state.maxEntries);

          return { entries: nextEntries };
        });
      },
      markAllRead: () => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.read ? entry : { ...entry, read: true }
          ),
        }));
      },
      clearAll: () => set({ entries: [] }),
      unreadCount: () => get().entries.filter((entry) => !entry.read).length,
    }),
    {
      name: "alarm-storage",
      partialize: (state) => ({
        entries: state.entries,
        maxEntries: state.maxEntries,
      }),
    }
  )
);
