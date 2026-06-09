# Broadcast WebSocket Flow — Quick Reference

## Current State (DashboardPage-Bound)

```
┌──────────────────────────────────────────────────────────────┐
│                     DashboardPage                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ useStreamWS (line 274)                                  │ │
│  │ ├─ WebSocket lifecycle                                  │ │
│  │ ├─ Message handling (VOICE_CHUNK, VOICE_TURN_COMPLETE) │ │
│  │ ├─ Reconnection logic                                   │ │
│  │ └─ sendChat() callback                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ useTTSPlayer (line 123)                                 │ │
│  │ ├─ Audio queue management                               │ │
│  │ ├─ PCM decoding                                         │ │
│  │ ├─ WebAudio playback                                    │ │
│  │ └─ enqueue() callback                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ useViewerChatPolling (line 120)                         │ │
│  │ ├─ 3s polling timer                                     │ │
│  │ ├─ getStreamInfo() API calls                            │ │
│  │ └─ upsertDialogues() updates                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ useSTT (line 337)                                       │ │
│  │ ├─ Hotkey listener (REMOVED in Phase 1)                 │ │
│  │ ├─ MediaRecorder lifecycle                              │ │
│  │ └─ onFinalTranscript callback → sendChat()              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Callbacks (lines 157-284)                               │ │
│  │ ├─ handleVoiceChunk()                                   │ │
│  │ ├─ handleVoiceTurnComplete()                            │ │
│  │ ├─ handleEmotionChange()                                │ │
│  │ ├─ handleFinalTranscript()                              │ │
│  │ └─ sendStreamerMessage()                                │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ State Subscriptions                                     │ │
│  │ ├─ aiModeStore (mode, broadcastStreamId, toggles, ...) │ │
│  │ ├─ authStore (accessToken)                              │ │
│  │ ├─ characterStore (selectedCharacterId)                 │ │
│  │ └─ overlayStore (updateRuntime)                         │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              aiModeStore         overlayStore
            (dialogues,          (broadcast state)
             emotions,
             transcripts)
```

**Problem**: Everything unmounts when user navigates away from DashboardPage

---

## Target State (Resident Service)

```
┌──────────────────────────────────────────────────────────────┐
│                     AppInitializer                            │
│                  (App root level)                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ broadcastWSBackgroundService (SINGLETON)                │ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────┐   │ │
│  │ │ WebSocket Management (from useStreamWS)         │   │ │
│  │ │ ├─ wsRef: WebSocket | null                       │   │ │
│  │ │ ├─ connect()                                     │   │ │
│  │ │ ├─ disconnect()                                  │   │ │
│  │ │ ├─ handleTextFrame()                             │   │ │
│  │ │ ├─ sendChat(text)                                │   │ │
│  │ │ └─ Reconnection logic                            │   │ │
│  │ └──────────────────────────────────────────────────┘   │ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────┐   │ │
│  │ │ TTS Queue Management (from useTTSPlayer)        │   │ │
│  │ │ ├─ queueRef: Blob[]                              │   │ │
│  │ │ ├─ audioCtxRef: AudioContext | null              │   │ │
│  │ │ ├─ enqueue(audio)                                │   │ │
│  │ │ ├─ playNext()                                    │   │ │
│  │ │ └─ decodeBlob()                                  │   │ │
│  │ └──────────────────────────────────────────────────┘   │ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────┐   │ │
│  │ │ Viewer Chat Polling (from useViewerChatPolling) │   │ │
│  │ │ ├─ pollingTimer: ReturnType<setInterval>        │   │ │
│  │ │ ├─ latestViewerCursorRef: number | null         │   │ │
│  │ │ ├─ poll()                                        │   │ │
│  │ │ └─ getStreamInfo() calls                         │   │ │
│  │ └──────────────────────────────────────────────────┘   │ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────┐   │ │
│  │ │ Zustand Subscriptions                            │   │ │
│  │ │ ├─ authStore.subscribe(accessToken)              │   │ │
│  │ │ │  └─ Reconnect on token change                  │   │ │
│  │ │ └─ aiModeStore.subscribe(broadcastStreamId)      │   │ │
│  │ │    └─ Connect/disconnect on broadcast state      │   │ │
│  │ └──────────────────────────────────────────────────┘   │ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────┐   │ │
│  │ │ Callback Registration Interface                 │   │ │
│  │ │ ├─ onVoiceChunk?: (chunk: VoiceChunk) => void   │   │ │
│  │ │ ├─ onVoiceTurnComplete?: (turn: ...) => void    │   │ │
│  │ │ ├─ onEmotionChange?: (emotion: ...) => void     │   │ │
│  │ │ └─ onViewerChat?: (dialogues: ...) => void      │   │ │
│  │ └──────────────────────────────────────────────────┘   │ │
│  │                                                          │ │
│  │ ┌──────────────────────────────────────────────────┐   │ │
│  │ │ Lifecycle                                        │   │ │
│  │ │ ├─ initialize()                                  │   │ │
│  │ │ └─ cleanup()                                     │   │ │
│  │ └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              aiModeStore         overlayStore
            (service writes)     (service writes)
```

**Benefit**: Service persists across page navigation

---

## Data Flow: STT → WebSocket → AI Response

### Current (DashboardPage-Bound)
```
useSTT.onFinalTranscript
  ↓
handleFinalTranscript (DashboardPage)
  ├─ Check: toggles.sttEnabled
  ├─ sendStreamerMessage(text)
  │  ├─ sendChat(text) [from useStreamWS]
  │  │  └─ WebSocket.send({ message: text })
  │  └─ upsertDialogues([{ speaker: "streamer", text }])
  │     └─ aiModeStore.upsertDialogues()
  │
  └─ WebSocket receives: VOICE_CHUNK / VOICE_TURN_COMPLETE
     ├─ handleVoiceChunk()
     │  ├─ enqueueTTS(audio) [from useTTSPlayer]
     │  ├─ setCurrentTranscript(voiceText)
     │  ├─ setEmotion(emotion)
     │  ├─ upsertDialogues([{ speaker: "ai", text: accumulated }])
     │  └─ updateOverlayRuntime()
     │
     └─ handleVoiceTurnComplete()
        ├─ removeDialogue(STREAMING_AI_DIALOGUE_ID)
        ├─ upsertDialogues([{ speaker: "ai", text: voiceText, cursorId }])
        └─ updateOverlayRuntime()
```

### Target (Resident Service)
```
sttBackgroundService.onFinalTranscript
  ↓
broadcastWSBackgroundService.sendChat(text)
  ├─ WebSocket.send({ message: text })
  └─ Queue message if WS not connected
     ↓
WebSocket receives: VOICE_CHUNK / VOICE_TURN_COMPLETE
  ├─ Service.handleVoiceChunk()
  │  ├─ Service.enqueueTTS(audio)
  │  ├─ aiModeStore.setCurrentTranscript(voiceText)
  │  ├─ aiModeStore.setEmotion(emotion)
  │  ├─ aiModeStore.upsertDialogues([{ speaker: "ai", text: accumulated }])
  │  ├─ overlayStore.updateRuntime()
  │  └─ Call onVoiceChunk callback (if registered by DashboardPage)
  │
  └─ Service.handleVoiceTurnComplete()
     ├─ aiModeStore.removeDialogue(STREAMING_AI_DIALOGUE_ID)
     ├─ aiModeStore.upsertDialogues([{ speaker: "ai", text: voiceText, cursorId }])
     ├─ overlayStore.updateRuntime()
     └─ Call onVoiceTurnComplete callback (if registered by DashboardPage)
```

**Key Difference**: Service writes directly to stores, DashboardPage only registers callbacks for UI updates

---

## Extraction Checklist

### useStreamWS.ts (lines 70-404)
```
EXTRACT:
  ✓ wsRef, pendingAudiosRef, reconnectTimerRef, shouldReconnectRef
  ✓ connect(), disconnect(), handleTextFrame()
  ✓ sendChat()
  ✓ useEffect for connection lifecycle

KEEP:
  ✓ isConnected, error, diagnostic state
  ✓ Return type: UseStreamWSReturn
  ✓ Hook becomes thin wrapper
```

### useTTSPlayer.ts (lines 69-231)
```
EXTRACT:
  ✓ queueRef, audioCtxRef, currentSourceRef, isPlayingRef
  ✓ ensureContext(), cleanupCurrent(), decodeBlob()
  ✓ rawPcmToAudioBuffer()
  ✓ enqueue(), playNext()

KEEP:
  ✓ isPlaying state
  ✓ Return type: UseTTSPlayerReturn
  ✓ Hook becomes thin wrapper
```

### useViewerChatPolling.ts (lines 26-96)
```
EXTRACT:
  ✓ Entire polling logic
  ✓ latestViewerCursorRef, polling timer
  ✓ poll() function

KEEP:
  ✓ Nothing (can be removed entirely)
  ✓ Or: Keep as optional hook for backward compatibility
```

### DashboardPage.tsx
```
MODIFY:
  ✓ Register callbacks with service in useEffect
  ✓ Unregister callbacks in cleanup
  ✓ Remove direct WebSocket/TTS/polling logic

KEEP:
  ✓ UI rendering (ConversationStream, CharacterPortrait, etc.)
  ✓ State subscriptions (aiModeStore, overlayStore, etc.)
  ✓ Callback handlers (handleVoiceChunk, handleVoiceTurnComplete, etc.)
```

---

## State Dependencies

### Service Reads From
- `authStore.accessToken` (WebSocket URL)
- `aiModeStore.broadcastStreamId` (WebSocket URL)
- `aiModeStore.mode` (polling condition)

### Service Writes To
- `aiModeStore.dialogues` (upsertDialogues)
- `aiModeStore.currentTranscript` (setCurrentTranscript)
- `aiModeStore.currentEmotion` (setEmotion)
- `overlayStore.runtime` (updateOverlayRuntime)

### DashboardPage Reads From
- `aiModeStore.dialogues` (render ConversationStream)
- `aiModeStore.currentTranscript` (render transcript)
- `aiModeStore.currentEmotion` (render emotion)
- `overlayStore.runtime` (sync overlay)

---

## Risk Summary

| Risk | Severity | Mitigation |
|------|----------|-----------|
| WebSocket desync | 🔴 HIGH | Singleton + reconnect |
| TTS queue loss | 🟡 MEDIUM | Move to service |
| Viewer polling stops | 🟡 MEDIUM | Move to service |
| STT callback breaks | 🟡 MEDIUM | Queue messages |
| Overlay sync lag | 🟢 LOW | Service updates directly |
| Token refresh | 🟡 MEDIUM | Subscribe to authStore |
| Race conditions | 🟢 LOW | Zustand is safe |
| Callback leaks | 🟡 MEDIUM | Unregister in cleanup |
| Subscription leaks | 🟡 MEDIUM | Call unsubscribe() |
| Reconnection loop | 🟡 MEDIUM | Exponential backoff |

---

## Implementation Timeline

**Day 3 AM** (2-3h): Create broadcastWSBackgroundService.ts  
**Day 3 PM** (2-3h): Update AppInitializer.tsx  
**Day 4 AM** (2-3h): Refactor hooks (useStreamWS, useTTSPlayer, useViewerChatPolling)  
**Day 4 PM** (2-3h): Update DashboardPage + integration test  

---

**Status**: Ready for Phase 2 implementation  
**Effort**: 🟢 LOW (straightforward extraction)  
**Risk**: 🟡 MEDIUM (10 identified risks, all mitigatable)
