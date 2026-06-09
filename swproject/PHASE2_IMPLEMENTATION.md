# Phase 2 Implementation: broadcastWSBackgroundService

**Status**: ✅ Core service created (Day 3 AM complete)  
**File**: `src/services/broadcastWSBackgroundService.ts` (~500 lines)  
**Next**: Day 3 PM - Wire STT→WebSocket callback chain in AppInitializer

---

## Overview

**broadcastWSBackgroundService** is a singleton service that extracts WebSocket, TTS queue, and viewer polling logic from DashboardPage into a truly resident background architecture. It manages:

1. **WebSocket lifecycle** (connect/disconnect/reconnect with token refresh)
2. **TTS audio queue** (enqueue/playback/cleanup, survives page navigation)
3. **Viewer chat polling** (3-second intervals, continues when DashboardPage unmounts)
4. **Callback registration** (onVoiceChunk, onVoiceTurnComplete, onEmotionChange, onViewerChat)
5. **State subscriptions** (authStore.accessToken, aiModeStore.broadcastStreamId for auto-reconnect)

---

## Architecture

### Service Initialization Flow

```
AppInitializer.tsx (Phase 2)
  ↓
broadcastWSBackgroundService.init()
  ├─ Subscribe to authStore.accessToken → reconnect on token refresh
  ├─ Subscribe to aiModeStore.broadcastStreamId → connect/disconnect on broadcast start/end
  └─ Ready for callback registration
```

### Callback Chain (STT → WebSocket → Store)

```
sttBackgroundService.onFinalTranscript(text)
  ↓
DashboardPage.handleFinalTranscript(text)
  ↓
broadcastWSBackgroundService.sendChat(text)
  ↓
WebSocket → Backend
  ↓
Backend response (VOICE_CHUNK/VOICE_TURN_COMPLETE/VOICE_EMOTION)
  ↓
broadcastWSBackgroundService.handleTextFrame()
  ↓
Registered callbacks (onVoiceChunk, onVoiceTurnComplete, onEmotionChange)
  ↓
DashboardPage handlers (handleVoiceChunk, handleVoiceTurnComplete, handleEmotionChange)
  ↓
aiModeStore.upsertDialogues() / overlayStore.updateRuntime()
```

---

## Key Features

### 1. WebSocket Management

**File**: `src/services/broadcastWSBackgroundService.ts` (lines 150-350)

- **Auto-connect**: Triggered by `aiModeStore.broadcastStreamId` change
- **Auto-disconnect**: Triggered by `aiModeStore.broadcastStreamId = null`
- **Auto-reconnect**: 3-second retry on network errors (code 1006, etc.)
- **Token refresh**: Subscribes to `authStore.accessToken` → calls `reconnect()` on token change
- **Error handling**: Distinguishes between fatal errors (UNAUTHORIZED, NOT_FOUND) and transient errors
- **Message format**: Sends `{ "message": "..." }` (Notion spec, no type field)
- **Binary pairing**: Matches binary frames with VOICE_CHUNK text frames

**Public API**:
```typescript
sendChat(text: string): { ok: boolean; reason?: string }
```

### 2. TTS Queue Management

**File**: `src/services/broadcastWSBackgroundService.ts` (lines 352-430)

- **Persistent queue**: Survives DashboardPage unmount (stored in service, not hook)
- **Auto-playback**: Starts immediately if not playing, queues if playing
- **Dual decode**: Tries container format (MP3/Opus/WAV) first, falls back to raw PCM
- **Raw PCM spec**: 16-bit signed little-endian, mono, sampleRate from `VITE_TTS_PCM_SAMPLE_RATE` (default 24000Hz)
- **AudioContext management**: Lazy-creates, resumes on suspend, closes on service dispose
- **Error recovery**: Continues to next item on decode failure

**Public API**:
```typescript
enqueueTTS(audio: Blob): void
```

### 3. Viewer Chat Polling

**File**: `src/services/broadcastWSBackgroundService.ts` (lines 432-480)

- **Continuous polling**: Runs every 3 seconds while broadcast is active
- **Cursor tracking**: Remembers latest viewer cursorId to avoid duplicates
- **Auto-stop**: Stops on 404 (broadcast ended) and calls `clearBroadcast()`
- **Store integration**: Calls `aiModeStore.upsertDialogues()` directly
- **Callback notification**: Calls `onViewerChat` callback for UI updates

**Triggered by**: `aiModeStore.broadcastStreamId` change (auto-start/stop)

### 4. Callback Registration

**File**: `src/services/broadcastWSBackgroundService.ts` (lines 130-145)

```typescript
interface BroadcastWSCallbacks {
  onVoiceChunk?: (chunk: VoiceChunk) => void;
  onVoiceTurnComplete?: (turn: VoiceTurnComplete) => void;
  onEmotionChange?: (emotion: StreamEmotion) => void;
  onViewerChat?: (dialogues: any[]) => void;
  onError?: (message: string, code?: StreamWsErrorCode) => void;
}

registerCallbacks(callbacks: BroadcastWSCallbacks): void
unregisterCallbacks(keys: (keyof BroadcastWSCallbacks)[]): void
```

**Usage in DashboardPage**:
```typescript
useEffect(() => {
  broadcastWSBackgroundService.registerCallbacks({
    onVoiceChunk: handleVoiceChunk,
    onVoiceTurnComplete: handleVoiceTurnComplete,
    onEmotionChange: handleEmotionChange,
  });
  return () => {
    broadcastWSBackgroundService.unregisterCallbacks([
      'onVoiceChunk',
      'onVoiceTurnComplete',
      'onEmotionChange',
    ]);
  };
}, [handleVoiceChunk, handleVoiceTurnComplete, handleEmotionChange]);
```

### 5. State Subscriptions

**File**: `src/services/broadcastWSBackgroundService.ts` (lines 180-210)

- **authStore.accessToken**: Triggers `reconnect()` on token refresh (Phase 3 backend support)
- **aiModeStore.broadcastStreamId**: Triggers `connect()` on broadcast start, `disconnect()` on broadcast end

```typescript
// In init():
this.unsubscribeAuthToken = useAuthStore.subscribe(
  (state) => state.accessToken,
  (newToken, oldToken) => {
    if (newToken && oldToken && newToken !== oldToken) {
      this.reconnect();
    }
  }
);
```

---

## Implementation Checklist (Day 3 PM onwards)

### Day 3 PM: Wire STT→WebSocket Callback Chain

**File**: `src/components/AppInitializer.tsx`

```typescript
// Phase 2 addition (after Phase 1 STT service init)
useEffect(() => {
  broadcastWSBackgroundService.init();

  const unsubscribeSTT = sttBackgroundService.subscribeFinalTranscript(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Wire STT final transcript → WebSocket sendChat
    const result = broadcastWSBackgroundService.sendChat(trimmed);
    if (!result.ok) {
      console.warn("[app-init] sendChat failed:", result.reason);
    }
  });

  return () => {
    unsubscribeSTT();
    broadcastWSBackgroundService.dispose();
  };
}, []);
```

### Day 3 Eve: Token Refresh Reconnect

**Status**: ✅ Already implemented in service (lines 180-188)

The service subscribes to `authStore.accessToken` and calls `reconnect()` on token change. No additional work needed.

### Day 4 AM: Refactor useStreamWS Hook

**File**: `src/features/broadcast/hooks/useStreamWS.ts`

**Goal**: Remove WebSocket logic, keep state subscription, delegate to service

```typescript
export function useStreamWS(options: UseStreamWSOptions = {}): UseStreamWSReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnostic, setDiagnostic] = useState<string | null>(null);

  useEffect(() => {
    // Register callbacks with service
    broadcastWSBackgroundService.registerCallbacks({
      onVoiceChunk: options.onVoiceChunk,
      onVoiceTurnComplete: options.onVoiceTurnComplete,
      onEmotionChange: options.onEmotionChange,
      onError: options.onError,
    });

    // Subscribe to service state changes
    const unsubscribe = broadcastWSBackgroundService.subscribeState((state) => {
      setIsConnected(state.isConnected);
      setError(state.error);
      setDiagnostic(state.diagnostic);
    });

    return () => {
      unsubscribe();
      broadcastWSBackgroundService.unregisterCallbacks([
        'onVoiceChunk',
        'onVoiceTurnComplete',
        'onEmotionChange',
        'onError',
      ]);
    };
  }, [options]);

  const sendChat = useCallback(
    (text: string) => broadcastWSBackgroundService.sendChat(text),
    []
  );

  return { isConnected, error, diagnostic, sendChat };
}
```

### Day 4 AM: Refactor useTTSPlayer Hook

**File**: `src/features/broadcast/hooks/useTTSPlayer.ts`

**Goal**: Remove audio queue logic, keep isPlaying state, delegate to service

```typescript
export function useTTSPlayer(
  enabled: boolean,
  options: UseTTSPlayerOptions = {}
): UseTTSPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const unsubscribe = broadcastWSBackgroundService.subscribeState((state) => {
      setIsPlaying(state.isPlayingTTS);
    });
    return () => unsubscribe();
  }, []);

  const enqueue = useCallback(
    (audio: Blob) => {
      if (!enabled) {
        console.debug("[tts] disabled, dropping audio Blob");
        return;
      }
      broadcastWSBackgroundService.enqueueTTS(audio);
    },
    [enabled]
  );

  const stop = useCallback(() => {
    // Service doesn't expose stop() yet, but can be added if needed
    console.debug("[tts] stop requested (service-level stop not yet exposed)");
  }, []);

  return { enqueue, stop, isPlaying };
}
```

### Day 4 AM: Optional - Refactor useViewerChatPolling Hook

**File**: `src/features/broadcast/hooks/useViewerChatPolling.ts`

**Option A** (Recommended): Keep as no-op wrapper for backwards compatibility

```typescript
export function useViewerChatPolling({
  enabled = true,
  size = 30,
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
}: UseViewerChatPollingOptions = {}) {
  // Polling is now handled by broadcastWSBackgroundService
  // This hook is kept for backwards compatibility but does nothing
  console.debug("[viewer-chat-polling] polling now handled by background service");
}
```

**Option B**: Remove entirely and update DashboardPage imports

### Day 4 PM: Update DashboardPage

**File**: `src/pages/DashboardPage.tsx`

**Changes**:
1. Remove direct `useStreamWS` initialization (already done via service)
2. Register/unregister callbacks in `useEffect`
3. Keep all handler logic (handleVoiceChunk, handleVoiceTurnComplete, handleEmotionChange)
4. Remove `useViewerChatPolling` call (now service-managed)
5. Keep `useTTSPlayer` call (thin wrapper around service)

```typescript
export default function DashboardPage() {
  // ... existing state ...

  // Register callbacks with service
  useEffect(() => {
    broadcastWSBackgroundService.registerCallbacks({
      onVoiceChunk: handleVoiceChunk,
      onVoiceTurnComplete: handleVoiceTurnComplete,
      onEmotionChange: handleEmotionChange,
    });

    return () => {
      broadcastWSBackgroundService.unregisterCallbacks([
        'onVoiceChunk',
        'onVoiceTurnComplete',
        'onEmotionChange',
      ]);
    };
  }, [handleVoiceChunk, handleVoiceTurnComplete, handleEmotionChange]);

  // Keep useStreamWS for state subscription (thin wrapper)
  const { isConnected: wsConnected, error: wsError, sendChat } = useStreamWS({
    onVoiceChunk: handleVoiceChunk,
    onVoiceTurnComplete: handleVoiceTurnComplete,
    onEmotionChange: handleEmotionChange,
  });

  // Keep useTTSPlayer for state subscription (thin wrapper)
  const { enqueue: enqueueTTS, isPlaying: isTtsPlaying } = useTTSPlayer(toggles.ttsEnabled);

  // Remove useViewerChatPolling (now service-managed)
  // const { ... } = useViewerChatPolling({ ... });

  // ... rest of component ...
}
```

### Day 4 PM: Integration Test

**Scenario**: WebSocket persists across page navigation

```typescript
// 1. Start broadcast on DashboardPage
// 2. WebSocket connects, polling starts
// 3. Navigate to CharacterPage
// 4. WebSocket stays connected, TTS queue continues, polling continues
// 5. Navigate back to DashboardPage
// 6. Callbacks re-register, UI updates resume
// 7. Send message via STT → WebSocket → AI response → TTS plays
```

### Day 5 AM: Full End-to-End Test

**Scenario**: Complete broadcast workflow

```
1. App start → AppInitializer.init() → broadcastWSBackgroundService.init()
2. DashboardPage mount → useStreamWS/useTTSPlayer hooks subscribe to service state
3. STT hotkey press → sttBackgroundService.startListening()
4. User speaks → sttBackgroundService.stopListening() → onFinalTranscript callback
5. AppInitializer callback → broadcastWSBackgroundService.sendChat(text)
6. WebSocket sends message → Backend processes → AI response
7. Backend sends VOICE_CHUNK (binary + text) → service.handleTextFrame()
8. service.onVoiceChunk callback → DashboardPage.handleVoiceChunk()
9. handleVoiceChunk → enqueueTTS(audio) → service.playNextTTS()
10. Audio plays → overlayStore.updateRuntime({ isSpeaking: true })
11. Backend sends VOICE_TURN_COMPLETE → service.onVoiceTurnComplete callback
12. handleVoiceTurnComplete → aiModeStore.upsertDialogues() → UI updates
13. Page navigation → callbacks unregister, service continues
14. Page return → callbacks re-register, UI syncs with service state
```

### Day 5 PM: Bug Fixes & Cleanup

- [ ] Memory leak checks (unsubscribe cleanup)
- [ ] Error handling improvements (error state tracking in service)
- [ ] Diagnostic logging (state change notifications)
- [ ] Edge cases (rapid token refresh, broadcast restart, network flaps)

---

## Risk Mitigation

### HIGH Risk: WebSocket Desync

**Mitigation**: Service maintains single WebSocket instance, auto-reconnects on token refresh

### MEDIUM Risk: TTS Queue Loss

**Mitigation**: Queue stored in service (not hook), survives page navigation

### MEDIUM Risk: Polling Stop

**Mitigation**: Polling timer stored in service, continues when DashboardPage unmounts

### MEDIUM Risk: STT Callback Break

**Mitigation**: AppInitializer wires STT→WebSocket callback chain, independent of DashboardPage

### MEDIUM Risk: Token Refresh Lag

**Mitigation**: Service subscribes to authStore.accessToken, reconnects immediately on change

### MEDIUM Risk: Callback/Subscription Leaks

**Mitigation**: DashboardPage unregisters callbacks in useEffect cleanup, service disposes in AppInitializer cleanup

### MEDIUM Risk: Reconnection Loop

**Mitigation**: Service tracks `shouldReconnectRef`, disables on fatal errors (UNAUTHORIZED, NOT_FOUND, handshake failure)

### MEDIUM Risk: Race Conditions

**Mitigation**: Service uses refs for state (not useState), Zustand for store writes (immutable updates)

### MEDIUM Risk: Overlay Sync Lag

**Mitigation**: Service writes directly to overlayStore.updateRuntime(), no intermediate state

---

## Backwards Compatibility

✅ **Phase 1 STT service**: Unchanged, still exports `sttBackgroundService`  
✅ **useStreamWS hook**: Kept as thin wrapper, no breaking changes  
✅ **useTTSPlayer hook**: Kept as thin wrapper, no breaking changes  
✅ **useViewerChatPolling hook**: Kept as no-op wrapper, no breaking changes  
✅ **DashboardPage**: Existing callback handlers unchanged, just re-registered with service  

---

## Files Modified/Created

### Created
- ✅ `src/services/broadcastWSBackgroundService.ts` (500 lines)

### To Modify (Day 3 PM onwards)
- `src/components/AppInitializer.tsx` (add Phase 2 init + STT→WebSocket wiring)
- `src/features/broadcast/hooks/useStreamWS.ts` (refactor to thin wrapper)
- `src/features/broadcast/hooks/useTTSPlayer.ts` (refactor to thin wrapper)
- `src/features/broadcast/hooks/useViewerChatPolling.ts` (keep as no-op or remove)
- `src/pages/DashboardPage.tsx` (register/unregister callbacks)

### Unchanged
- `src/services/sttBackgroundService.ts` (Phase 1, no changes)
- `src/shared/stores/aiModeStore.ts` (service writes via upsertDialogues)
- `src/shared/stores/authStore.ts` (service subscribes for token refresh)
- `src/shared/stores/overlayStore.ts` (service writes via updateRuntime)
- `src/features/broadcast/api/streamApi.ts` (service calls getStreamInfo)

---

## Summary

**broadcastWSBackgroundService** is now ready for integration. It provides:

1. ✅ Singleton WebSocket management with auto-reconnect
2. ✅ Persistent TTS queue (survives page navigation)
3. ✅ Continuous viewer polling (3-second intervals)
4. ✅ Callback registration interface (onVoiceChunk, onVoiceTurnComplete, onEmotionChange, onViewerChat)
5. ✅ State subscriptions (authStore.accessToken, aiModeStore.broadcastStreamId)
6. ✅ Direct store writes (aiModeStore.upsertDialogues, overlayStore.updateRuntime)

**Next step**: Day 3 PM - Wire STT→WebSocket callback chain in AppInitializer.tsx
