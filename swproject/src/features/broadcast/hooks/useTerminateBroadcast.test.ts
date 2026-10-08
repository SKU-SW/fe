/** @file Broadcast termination behavior across server success, absence and failure. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useTerminateBroadcast } from './useTerminateBroadcast';
import { terminateBroadcast } from '@/features/broadcast/api/broadcastApi';
import { useAIModeStore } from '@/shared/stores/aiModeStore';
import { useAlarmStore } from '@/shared/stores/alarmStore';

vi.mock('@/features/broadcast/api/broadcastApi', () => ({ terminateBroadcast: vi.fn() }));
afterEach(cleanup);
beforeEach(() => {
  vi.mocked(terminateBroadcast).mockReset();
  useAIModeStore.getState().resetToDefaults();
  useAlarmStore.getState().clearAll();
  useAIModeStore.getState().setBroadcast('stream-1', '2026-10-08T10:00:00Z');
  useAIModeStore.getState().setCurrentTranscript('Previous character');
  useAIModeStore.getState().setEmotion('HAPPY');
  useAIModeStore.getState().upsertDialogues([{
    id: '1', cursorId: 1, speaker: 'ai', subject: 'AI_CHARACTER', text: 'Old reply',
    emotion: 'HAPPY', timestamp: '2026-10-08T10:01:00Z',
  }], 1, true);
});

it('clears the broadcast and previous character dialogue after successful termination', async () => {
  vi.mocked(terminateBroadcast).mockResolvedValue({
    terminatedBroadcastStreamId: 'stream-1', broadcastStatus: 'TERMINATED', broadcastTerminatedAt: '2026-10-08T11:00:00Z',
  });
  const { result } = renderHook(useTerminateBroadcast);
  await act(async () => { await result.current.terminate(); });
  expect(useAIModeStore.getState()).toMatchObject({
    mode: 'idle', broadcastStreamId: null, broadcastStartedAt: null,
    dialogues: [], currentTranscript: '', currentEmotion: 'DEFAULT', nextCursor: null, hasNextDialogues: false,
  });
  expect(useAlarmStore.getState().entries[0].key).toBe('broadcast.ended');
  expect(result.current).toMatchObject({ isPending: false, error: null });
});

it('treats an already missing broadcast (404) as locally terminated', async () => {
  vi.mocked(terminateBroadcast).mockRejectedValue({ response: { status: 404 } });
  const { result } = renderHook(useTerminateBroadcast);
  await act(async () => { await result.current.terminate(); });
  expect(useAIModeStore.getState()).toMatchObject({ mode: 'idle', broadcastStreamId: null, dialogues: [], currentTranscript: '' });
  expect(result.current).toMatchObject({ isPending: false, error: null });
});

it('retains the active session and exposes a server failure so termination can be retried', async () => {
  vi.mocked(terminateBroadcast).mockRejectedValue({ response: { status: 500 } });
  const { result } = renderHook(useTerminateBroadcast);
  await act(async () => { await result.current.terminate(); });
  expect(useAIModeStore.getState().broadcastStreamId).toBe('stream-1');
  expect(useAIModeStore.getState().dialogues).toHaveLength(1);
  expect(result.current.error).toBe('서버 오류로 방송을 종료하지 못했습니다.');
  expect(result.current.isPending).toBe(false);
  expect(useAlarmStore.getState().entries).toHaveLength(0);
});

it('does not terminate the broadcast when its view unmounts', () => {
  const { unmount } = renderHook(useTerminateBroadcast);
  unmount();
  expect(terminateBroadcast).not.toHaveBeenCalled();
  expect(useAIModeStore.getState().broadcastStreamId).toBe('stream-1');
});
