/**
 * @file 방송 과거 대화 커서 페이징 훅
 * @dependsOn src/features/broadcast/api/streamApi.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy src/pages/DashboardPage.tsx
 */

import { useCallback, useRef, useState } from "react";
import { adaptDialogue, getStreamDialoguesByCursor } from "@/features/broadcast/api/streamApi";
import { useAIModeStore } from "@/shared/stores/aiModeStore";

interface SubjectFilters {
  ai: boolean;
  streamer: boolean;
  viewer: boolean;
}

interface UseStreamDialoguesPaginationOptions {
  subjectFilters: SubjectFilters;
  pageSize?: number;
}

interface UseStreamDialoguesPaginationReturn {
  hasNext: boolean;
  isLoading: boolean;
  loadMore: () => Promise<void>;
}

export function useStreamDialoguesPagination({
  subjectFilters,
  pageSize = 30,
}: UseStreamDialoguesPaginationOptions): UseStreamDialoguesPaginationReturn {
  const nextCursor = useAIModeStore((s) => s.nextCursor);
  const hasNext = useAIModeStore((s) => s.hasNextDialogues);
  const prependDialogues = useAIModeStore((s) => s.prependDialogues);
  const [isLoading, setIsLoading] = useState(false);
  const lastRequestedCursorRef = useRef<number | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasNext || nextCursor == null) return;
    if (lastRequestedCursorRef.current === nextCursor) return;

    lastRequestedCursorRef.current = nextCursor;
    setIsLoading(true);
    try {
      const response = await getStreamDialoguesByCursor({
        size: pageSize,
        cursorId: nextCursor,
        aiCharacterDialogue: subjectFilters.ai,
        streamerDialogue: subjectFilters.streamer,
        viewerDialogue: subjectFilters.viewer,
      });

      const items = response.content
        .map(adaptDialogue)
        .sort((a, b) => (a.cursorId ?? 0) - (b.cursorId ?? 0));

      prependDialogues(items, response.nextCursor, response.hasNext);
    } finally {
      setIsLoading(false);
    }
  }, [hasNext, isLoading, nextCursor, pageSize, prependDialogues, subjectFilters.ai, subjectFilters.streamer, subjectFilters.viewer]);

  return {
    hasNext,
    isLoading,
    loadMore,
  };
}
