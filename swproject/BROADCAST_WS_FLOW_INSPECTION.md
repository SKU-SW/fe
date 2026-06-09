# SKU-SW Broadcast WebSocket / AI Response Flow Inspection

**Date**: 2026-05-27  
**Scope**: Frontend-only broadcast WebSocket and AI response handling  
**Constraint**: No backend contract changes; read-only inspection

---

## 1️⃣ CURRENT FLOW MAP

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                        DashboardPage                             │
│  (ONLY page where WebSocket/AI responses are currently handled)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
          useStreamWS    useTTSPlayer  useViewerChatPolling
          (WebSocket)    (Audio)       (REST polling)
                │             │             │
                └─────────────┼─────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              aiModeStore         broadcastNoticeStore
            (dialogues,          (broadcast state)
             emotions,
             transcripts)
```

### Detailed STT → WebSocket → AI Response Flow

```
1. USER SPEAKS (Cmd/Ctrl+Shift+M held)
   │
   ├─ useSTT.startListening()
   │  └─ MediaRecorder.start()
   │
   └─ useSTT.stopListening()
      └─ Electron IPC: window.electronAPI.stt.transcribe(audioBuffer)
         └─ Faster Whisper daemon processes
            └─ Returns: { ok: true, text: "..." }
               │
               ▼
2. STT RESULT CALLBACK (handleFinalTranscript)
   │
   ├─ Check: toggles.sttEnabled === true
   │
   └─ sendStreamerMessage(text)
      │
      ├─ sendChat(text) via useStreamWS
      │  └─ WebSocket.send({ message: text })
      │     └─ BE receives on /api/v1/stream/ws
      │
      └─ upsertDialogues() — optimistic UI update
         └─ aiModeStore.upsertDialogues([{ speaker: "streamer", text, ... }])
            └─ ConversationStream renders immediately
               │
               ▼
3. BE PROCESSES & SENDS AI RESPONSE (async)
   │
   └─ WebSocket receives: VOICE_CHUNK / VOICE_TURN_COMPLETE / VOICE_EMOTION
      │
      ├─ handleVoiceChunk({ audio, voiceText, emotion })
      │  │
      │  ├─ enqueueTTS(audio)
      │  │  └─ useTTSPlayer.enqueue()
      │  │     └─ WebAudio API plays raw PCM
      │  │
      │  ├─ setCurrentTranscript(voiceText)
      │  │  └─ aiModeStore.setCurrentTranscript()
      │  │
      │  ├─ setEmotion(emotion)
      │  │  └─ aiModeStore.setEmotion()
      │  │
      │  ├─ upsertDialogues([{ id: STREAMING_AI_DIALOGUE_ID, text: accumulated, ... }])
      │  │  └─ ConversationStream shows typing effect
      │  │
      │  └─ updateOverlayRuntime({ transcript, emotion, ... })
      │     └─ overlayStore.updateRuntime()
      │
      ├─ handleVoiceTurnComplete({ voiceText, emotion, cursorId })
      │  │
      │  ├─ removeDialogue(STREAMING_AI_DIALOGUE_ID)
      │  │
      │  ├─ upsertDialogues([{ id: String(cursorId), cursorId, text: voiceText, ... }])
      │  │  └─ Finalize dialogue with server cursorId
      │  │
      │  └─ updateOverlayRuntime({ transcript: voiceText, emotion, ... })
      │
      └─ handleEmotionChange(emotion)
         └─ setEmotion(emotion)
            └─ aiModeStore.setEmotion()
               └─ CharacterPortrait re-renders with new emotion image

4. VIEWER CHAT POLLING (parallel, 3s interval)
   │
   └─ useViewerChatPolling()
      └─ getStreamInfo(size=100) every 3s
         └─ Filter VIEWER subject items
            └─ upsertDialogues(viewerItems)
               └─ ConversationStream shows viewer messages
```

---

## 2️⃣ PAGE DEPENDENCIES

### DashboardPage State/Store Subscriptions

| Store | Fields | Usage | Resident? |
|-------|--------|-------|-----------|
| `aiModeStore` | `mode`, `broadcastStreamId`, `toggles.sttEnabled`, `toggles.ttsEnabled`, `toggles.chatReactionEnabled`, `dialogues`, `activityLogs`, `currentTranscript`, `currentEmotion` | Render UI + WebSocket condition | ❌ No |
| `authStore` | `accessToken` | WebSocket URL construction | ❌ No |
| `characterStore` | `selectedCharacterId` | Fetch character info | ❌ No |
| `overlayStore` | `updateRuntime()` | Sync overlay state | ❌ No |

### Hook Dependencies

| Hook | Initialized | Depends On | Callbacks | Resident? |
|------|-------------|-----------|-----------|-----------|
| `useStreamWS` | DashboardPage line 274 | `accessToken`, `broadcastStreamId` | `onVoiceChunk`, `onVoiceTurnComplete`, `onEmotionChange` | ❌ No |
| `useTTSPlayer` | DashboardPage line 123 | `toggles.ttsEnabled` | None | ❌ No |
| `useViewerChatPolling` | DashboardPage line 120 | `mode`, `broadcastStreamId` | None | ❌ No |
| `useStreamInfo` | DashboardPage line 113 | `mode`, `broadcastStreamId` | None | ❌ No |
| `useSTT` | DashboardPage line 337 | None | `onFinalTranscript` | ❌ No |

### Critical Callback Chain

```
useSTT.onFinalTranscript
  ↓
handleFinalTranscript (DashboardPage)
  ↓
sendStreamerMessage (DashboardPage)
  ↓
sendChat (from useStreamWS)
  ↓
WebSocket.send({ message: text })
```

**Problem**: This entire chain is **page-bound**. If user navigates away from DashboardPage:
- useStreamWS unmounts → WebSocket disconnects
- useTTSPlayer unmounts → audio queue lost
- useViewerChatPolling unmounts → viewer chat stops
- useSTT unmounts → hotkey listener removed (already fixed in Phase 1)

---

## 3️⃣ BEST EXTRACTION POINTS FOR RESIDENT SERVICE

### Option A: Minimal Extraction (Recommended)
**Extract only WebSocket + TTS + Viewer polling into resident service**

**New Service**: `broadcastWSBackgroundService.ts`
```typescript
class BroadcastWSBackgroundService {
  // Extracted from useStreamWS
  private wsRef: WebSocket | null = null;
  private pendingAudiosRef: Blob[] = [];
  
  // Extracted from useTTSPlayer
  private ttsQueue: Blob[] = [];
  private audioCtx: AudioContext | null = null;
  
  // Extracted from useViewerChatPolling
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  
  // Callbacks registered by DashboardPage
  onVoiceChunk?: (chunk: VoiceChunk) => void;
  onVoiceTurnComplete?: (turn: VoiceTurnComplete) => void;
  onEmotionChange?: (emotion: StreamEmotion) => void;
  onViewerChat?: (dialogues: StreamDialogue[]) => void;
  
  initialize(): void {
    // Subscribe to authStore.accessToken
    // Subscribe to aiModeStore.broadcastStreamId
    // Start WebSocket connection
    // Start viewer polling
  }
  
  sendChat(text: string): { ok: boolean; reason?: string } {
    // Delegate to WebSocket
  }
  
  enqueueTTS(audio: Blob): void {
    // Add to queue, start playback
  }
  
  cleanup(): void {
    // Close WebSocket
    // Stop polling
    // Stop audio playback
  }
}
```

**Extraction Points**:
1. **useStreamWS** (lines 70-404)
   - Move: WebSocket lifecycle, message handling, reconnection logic
   - Keep in hook: UI state (isConnected, error, diagnostic)
   - Hook becomes: Wrapper that subscribes to service state

2. **useTTSPlayer** (lines 69-231)
   - Move: Audio queue, decoding, playback logic
   - Keep in hook: UI state (isPlaying)
   - Hook becomes: Wrapper that calls service.enqueueTTS()

3. **useViewerChatPolling** (lines 26-96)
   - Move: Polling timer, API calls, dialogue upsert
   - Keep in hook: None (can be fully resident)
   - Hook becomes: Optional (can be removed entirely)

### Option B: Full Extraction (Over-engineered)
**Extract everything including STT callback chain**

**Pros**: Complete decoupling from DashboardPage  
**Cons**: Requires new state store (sttStore, broadcastWSStore) + more complexity  
**Verdict**: Not recommended for Phase 2 (defer to Phase 3)

---

## 4️⃣ FRONTEND-ONLY RISKS

### Risk 1: WebSocket State Desynchronization
**Scenario**: User navigates DashboardPage → CharacterPage → DashboardPage
- Old WebSocket closes (unmount)
- New WebSocket opens (remount)
- **Risk**: Duplicate connections, lost messages during transition

**Mitigation**:
- Singleton service prevents duplicate connections
- Zustand store persists state across page navigation
- Reconnect logic handles token refresh

**Severity**: 🔴 HIGH (current issue)

---

### Risk 2: TTS Queue Loss During Navigation
**Scenario**: TTS audio is playing, user navigates away
- useTTSPlayer unmounts → queue cleared
- Audio stops mid-playback

**Mitigation**:
- Move queue to resident service
- Continue playback even if DashboardPage unmounts
- Hook only subscribes to isPlaying state

**Severity**: 🟡 MEDIUM (audio interruption)

---

### Risk 3: Viewer Chat Polling Stops
**Scenario**: User navigates away from DashboardPage
- useViewerChatPolling unmounts → polling stops
- Viewer messages don't appear when user returns

**Mitigation**:
- Move polling to resident service
- Continue polling even if DashboardPage unmounts
- Service updates aiModeStore.dialogues directly

**Severity**: 🟡 MEDIUM (missing viewer messages)

---

### Risk 4: STT → WebSocket Callback Chain Breaks
**Scenario**: STT result arrives, but WebSocket is disconnected
- handleFinalTranscript tries to call sendChat()
- WebSocket.send() fails silently

**Mitigation**:
- Service queues messages if WebSocket not connected
- Retry when WebSocket reconnects
- Or: Fail gracefully with user-facing error

**Severity**: 🟡 MEDIUM (message loss)

---

### Risk 5: Overlay State Sync Lag
**Scenario**: WebSocket updates emotion, but overlay not synced
- handleVoiceChunk updates overlayStore
- If DashboardPage unmounts, overlay updates stop

**Mitigation**:
- Service updates overlayStore directly
- No dependency on DashboardPage for overlay sync

**Severity**: 🟢 LOW (visual only, not functional)

---

### Risk 6: Token Refresh During WebSocket Send
**Scenario**: accessToken expires while sending message
- axios interceptor refreshes token
- WebSocket still has old token in URL

**Mitigation**:
- Service subscribes to authStore.accessToken changes
- Reconnect WebSocket with new token
- Queue messages during reconnection

**Severity**: 🟡 MEDIUM (auth failure)

---

### Risk 7: Race Condition: Multiple Dialogue Upserts
**Scenario**: WebSocket sends VOICE_CHUNK, viewer polling sends VIEWER message simultaneously
- Both call aiModeStore.upsertDialogues()
- Possible race condition in store update

**Mitigation**:
- Zustand handles concurrent updates safely (immutable)
- No additional synchronization needed
- But: Order of dialogues may be non-deterministic

**Severity**: 🟢 LOW (Zustand is thread-safe)

---

### Risk 8: Memory Leak: Service Callbacks Not Cleaned Up
**Scenario**: DashboardPage registers callback, unmounts without cleanup
- Service still holds reference to callback
- Callback closure captures stale state

**Mitigation**:
- Service provides unregister() method
- DashboardPage calls unregister() in useEffect cleanup
- Or: Use weak references (not practical in JS)

**Severity**: 🟡 MEDIUM (memory leak)

---

### Risk 9: Zustand Store Subscription Leak
**Scenario**: Service subscribes to authStore.accessToken, never unsubscribes
- Subscription persists even after service cleanup

**Mitigation**:
- Store subscription returns unsubscribe function
- Service calls unsubscribe() in cleanup()

**Severity**: 🟡 MEDIUM (memory leak)

---

### Risk 10: WebSocket Reconnection Loop
**Scenario**: Token is invalid, WebSocket keeps trying to reconnect
- Service reconnects every 3s indefinitely
- User sees "connecting..." forever

**Mitigation**:
- Implement exponential backoff
- Stop reconnecting after N failures
- Show user-facing error after timeout

**Severity**: 🟡 MEDIUM (UX issue)

---

## 5️⃣ MINIMAL REFACTORING CHECKLIST

### Files to Create
- [ ] `src/services/broadcastWSBackgroundService.ts` (~500 lines)
  - WebSocket lifecycle (from useStreamWS)
  - TTS queue management (from useTTSPlayer)
  - Viewer polling (from useViewerChatPolling)
  - Zustand subscriptions (authStore, aiModeStore)
  - Callback registration interface

### Files to Modify
- [ ] `src/components/AppInitializer.tsx` (Phase 2 addition)
  - Initialize broadcastWSBackgroundService
  - Register callbacks from DashboardPage

- [ ] `src/features/broadcast/hooks/useStreamWS.ts`
  - Remove WebSocket logic
  - Keep UI state (isConnected, error, diagnostic)
  - Delegate to service.sendChat()
  - Subscribe to service state

- [ ] `src/features/broadcast/hooks/useTTSPlayer.ts`
  - Remove audio queue/playback logic
  - Keep UI state (isPlaying)
  - Delegate to service.enqueueTTS()
  - Subscribe to service state

- [ ] `src/features/broadcast/hooks/useViewerChatPolling.ts`
  - Remove entirely (service handles it)
  - Or: Keep as optional hook for backward compatibility

- [ ] `src/pages/DashboardPage.tsx`
  - Register callbacks with service in useEffect
  - Unregister callbacks in cleanup
  - Remove direct WebSocket/TTS/polling logic

### Files NOT to Modify
- ✅ `src/shared/stores/aiModeStore.ts` (service writes to it)
- ✅ `src/shared/stores/authStore.ts` (service reads from it)
- ✅ `src/shared/stores/overlayStore.ts` (service writes to it)
- ✅ `src/shared/types/broadcastWs.ts` (no changes)
- ✅ `src/shared/types/stream.ts` (no changes)
- ✅ `src/features/broadcast/api/streamApi.ts` (no changes)

---

## 6️⃣ BACKEND CONTRACT ASSUMPTIONS

### Current Contracts (Must Not Change)

**WebSocket URL**:
```
${VITE_WS_URL}/api/v1/stream/ws?broadcastStreamId=...&accessToken=...
```
- Both params required (Phase 3 will make broadcastStreamId optional)
- No other query params

**WebSocket Messages (FE → BE)**:
```json
{ "message": "..." }
```
- No type field
- No other fields

**WebSocket Messages (BE → FE)**:
```json
{
  "eventType": "VOICE_CHUNK" | "VOICE_TURN_COMPLETE" | "VOICE_EMOTION",
  "voiceText": string | null,
  "emotion": "DEFAULT" | "TALKING" | "HAPPY" | "ANGRY" | "TIRED" | "SAD" | "FEAR",
  "broadcastDialogueCursorId": number | null,
  "turnNumber": number,
  "characterId": number
}
```
- Binary frames (raw PCM) paired with VOICE_CHUNK
- No changes to message structure

**REST API**:
```
GET /api/v1/stream/info?size=N
GET /api/v1/stream/info/dialogues?size&cursorId&...
```
- No changes to endpoints or params

---

## 7️⃣ EXTRACTION STRATEGY SUMMARY

### Phase 1 (Already Done)
✅ STT service extracted (sttBackgroundService.ts)  
✅ Hotkey listener moved to service  
✅ useSTT hook simplified to UI state only

### Phase 2 (Recommended Next)
🔄 WebSocket service extraction (broadcastWSBackgroundService.ts)
- Move WebSocket lifecycle from useStreamWS
- Move TTS queue from useTTSPlayer
- Move viewer polling from useViewerChatPolling
- Keep hooks as thin wrappers for UI state

**Extraction Points**:
1. **useStreamWS.ts** (lines 70-404)
   - Extract: connect(), disconnect(), handleTextFrame(), sendChat()
   - Keep: isConnected, error, diagnostic state

2. **useTTSPlayer.ts** (lines 69-231)
   - Extract: enqueue(), playNext(), decodeBlob(), rawPcmToAudioBuffer()
   - Keep: isPlaying state

3. **useViewerChatPolling.ts** (lines 26-96)
   - Extract: entire polling logic
   - Keep: nothing (can be removed)

### Phase 3 (Defer)
⏳ Backend improvements
- broadcastStreamId optional flow
- Token refresh event
- State polling removal

---

## 8️⃣ RISK MITIGATION CHECKLIST

| Risk | Mitigation | Effort |
|------|-----------|--------|
| WebSocket desync | Singleton service + reconnect logic | 🟢 Low |
| TTS queue loss | Move queue to service | 🟢 Low |
| Viewer polling stops | Move polling to service | 🟢 Low |
| STT callback breaks | Queue messages if WS disconnected | 🟡 Medium |
| Overlay sync lag | Service updates overlayStore directly | 🟢 Low |
| Token refresh | Subscribe to authStore, reconnect | 🟡 Medium |
| Race conditions | Zustand handles safely | 🟢 Low |
| Callback leaks | Unregister in cleanup | 🟢 Low |
| Subscription leaks | Call unsubscribe() in cleanup | 🟢 Low |
| Reconnection loop | Exponential backoff + timeout | 🟡 Medium |

---

## 9️⃣ IMPLEMENTATION ROADMAP

### Day 3 AM: Create broadcastWSBackgroundService.ts
- [ ] Copy WebSocket logic from useStreamWS
- [ ] Copy TTS logic from useTTSPlayer
- [ ] Copy polling logic from useViewerChatPolling
- [ ] Add Zustand subscriptions
- [ ] Add callback registration interface
- [ ] Add cleanup logic

### Day 3 PM: Update AppInitializer.tsx
- [ ] Initialize broadcastWSBackgroundService
- [ ] Register callbacks from DashboardPage

### Day 4 AM: Refactor hooks
- [ ] useStreamWS → thin wrapper
- [ ] useTTSPlayer → thin wrapper
- [ ] useViewerChatPolling → optional (can remove)

### Day 4 PM: Update DashboardPage
- [ ] Register callbacks with service
- [ ] Remove direct WebSocket/TTS/polling logic
- [ ] Test page navigation

---

## 🔟 CONCLUSION

**Current State**: WebSocket/AI response handling is **100% DashboardPage-dependent**

**Extraction Difficulty**: 🟢 **LOW** (straightforward move of existing logic)

**Risk Level**: 🟡 **MEDIUM** (10 identified risks, all mitigatable)

**Recommended Approach**: **Option A (Minimal Extraction)**
- Move WebSocket + TTS + polling to resident service
- Keep hooks as thin UI state wrappers
- No backend changes required
- Estimated effort: 2-3 days (Day 3-4)

**Key Insight**: The service doesn't need to be "smart" — it just needs to:
1. Maintain WebSocket connection across page navigation
2. Queue TTS audio and continue playback
3. Continue polling viewer chat
4. Provide callback interface for DashboardPage to register handlers

Everything else (state management, UI rendering) stays in DashboardPage.

---

**Status**: Ready for Phase 2 implementation  
**Next Step**: Create broadcastWSBackgroundService.ts on Day 3 AM
