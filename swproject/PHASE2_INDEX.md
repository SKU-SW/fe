# Phase 2 Documentation Index

**Last Updated**: 2026-05-27 (Day 3 AM Complete)  
**Status**: ✅ Core service created, ready for Day 3 PM integration

---

## Quick Navigation

### 🚀 Start Here
- **[PHASE2_QUICK_START.md](./PHASE2_QUICK_START.md)** — Day 3 PM task (30 min)
  - Current status and next steps
  - Complete AppInitializer.tsx code to copy-paste
  - Verification checklist
  - Testing workflow
  - Common issues & fixes

### 📚 Comprehensive Guide
- **[PHASE2_IMPLEMENTATION.md](./PHASE2_IMPLEMENTATION.md)** — Full technical reference
  - Architecture overview
  - Key features (WebSocket, TTS, polling, callbacks)
  - Implementation checklist (Day 3 PM through Day 5 PM)
  - Risk mitigation strategies
  - Backwards compatibility confirmation
  - Files modified/created reference

### 📋 Completion Summary
- **[PHASE2_DAY3_SUMMARY.md](./PHASE2_DAY3_SUMMARY.md)** — What was done today
  - Deliverables (code + documentation)
  - Architecture overview
  - Key implementation details
  - Next steps with time estimates
  - Risk assessment
  - Build status

### 🔍 Previous Phase Documentation
- **[BROADCAST_WS_FLOW_INSPECTION.md](./BROADCAST_WS_FLOW_INSPECTION.md)** — Risk assessment (Phase 1)
  - 10 identified risks with mitigation strategies
  - WebSocket flow inspection
  - Extraction points for all three hooks
  - Risk map (HIGH/MEDIUM/LOW)

- **[BROADCAST_WS_QUICK_REFERENCE.md](./BROADCAST_WS_QUICK_REFERENCE.md)** — Visual diagrams (Phase 1)
  - WebSocket message flow diagrams
  - TTS queue flow
  - Polling flow
  - Extraction checklist

- **[STT_REFACTOR_IMPLEMENTATION_PLAN.md](./STT_REFACTOR_IMPLEMENTATION_PLAN.md)** — Phase 1 plan
  - File-level implementation plan
  - Phase 1-3 roadmap
  - Detailed task breakdown

---

## File Structure

### Code Files

#### Created (Day 3 AM)
```
src/services/broadcastWSBackgroundService.ts (500 lines)
├─ WebSocket lifecycle management
├─ TTS audio queue
├─ Viewer chat polling
├─ Callback registration
└─ State subscription hooks
```

#### To Modify (Day 3 PM onwards)
```
src/components/AppInitializer.tsx
├─ Phase 2 init
└─ STT→WebSocket callback wiring

src/features/broadcast/hooks/useStreamWS.ts
└─ Refactor to thin wrapper

src/features/broadcast/hooks/useTTSPlayer.ts
└─ Refactor to thin wrapper

src/features/broadcast/hooks/useViewerChatPolling.ts
└─ Refactor to no-op wrapper

src/pages/DashboardPage.tsx
├─ Register/unregister callbacks
└─ Remove direct polling call
```

#### Unchanged
```
src/services/sttBackgroundService.ts (Phase 1)
src/shared/stores/aiModeStore.ts
src/shared/stores/authStore.ts
src/shared/stores/overlayStore.ts
src/features/broadcast/api/streamApi.ts
```

### Documentation Files

#### Phase 2 (Day 3 AM)
```
PHASE2_QUICK_START.md (200+ lines)
├─ Day 3 PM task
├─ Complete code to copy-paste
├─ Verification checklist
└─ Testing workflow

PHASE2_IMPLEMENTATION.md (300+ lines)
├─ Architecture overview
├─ Key features
├─ Implementation checklist
├─ Risk mitigation
└─ Files reference

PHASE2_DAY3_SUMMARY.md (300+ lines)
├─ Completion summary
├─ Architecture overview
├─ Key implementation details
├─ Next steps
└─ Risk assessment
```

#### Phase 1 (Previous)
```
BROADCAST_WS_FLOW_INSPECTION.md (10KB)
├─ Risk assessment
├─ WebSocket flow inspection
└─ Extraction points

BROADCAST_WS_QUICK_REFERENCE.md (6KB)
├─ Visual diagrams
└─ Extraction checklist

STT_REFACTOR_IMPLEMENTATION_PLAN.md (17KB)
├─ File-level plan
├─ Phase 1-3 roadmap
└─ Task breakdown

STT_REFACTOR_SUMMARY_KO.md (7.9KB)
└─ Korean summary

STT_REFACTOR_CHECKLIST.md (11KB)
└─ Day-by-day checklist
```

---

## Timeline

### ✅ Phase 1: STT Service (Complete)
- Extracted STT logic from DashboardPage
- Created sttBackgroundService singleton
- Moved hotkey listener to service
- Simplified useSTT hook

### ✅ Phase 2: WebSocket/TTS/Polling (Day 3 AM Complete)
- Created broadcastWSBackgroundService singleton
- Extracted WebSocket logic
- Extracted TTS queue logic
- Extracted viewer polling logic
- Callback registration interface
- Ready for Day 3 PM integration

### ⏳ Phase 3: Backend Improvements (Deferred)
- Make broadcastStreamId optional in WebSocket URL
- Token refresh reconnect (requires subscribeWithSelector middleware)
- Backend API improvements

---

## Key Concepts

### Service Pattern
- **Singleton**: Module-level export, single instance per app
- **Non-React**: Uses Zustand `getState()` for state access
- **Persistent**: Survives page navigation
- **Callback-based**: UI integration via callback registration

### WebSocket Management
- **Auto-connect**: Triggered by broadcast start
- **Auto-disconnect**: Triggered by broadcast end
- **Auto-reconnect**: 3-second retry on network errors
- **Error handling**: Fatal vs transient errors

### TTS Queue
- **Persistent**: Stored in service, not hook
- **Auto-playback**: Starts immediately or queues
- **Dual decode**: Container format + raw PCM
- **Error recovery**: Continues on decode failure

### Viewer Polling
- **Continuous**: 3-second intervals
- **Cursor tracking**: No duplicates
- **Auto-stop**: On 404 (broadcast ended)
- **Direct writes**: aiModeStore.upsertDialogues()

### Callback Chain
```
STT hotkey → sttBackgroundService → AppInitializer callback
  → broadcastWSBackgroundService.sendChat()
  → WebSocket → Backend
  → VOICE_CHUNK/VOICE_TURN_COMPLETE/VOICE_EMOTION
  → broadcastWSBackgroundService callbacks
  → DashboardPage handlers
  → aiModeStore/overlayStore updates
```

---

## Risk Mitigation Summary

### HIGH (1)
- **WebSocket desync** → Service maintains single instance

### MEDIUM (8)
- **TTS queue loss** → Queue stored in service
- **Polling stop** → Polling timer stored in service
- **STT callback break** → AppInitializer wires callback chain
- **Token refresh lag** → Can be added in Phase 3
- **Callback/subscription leaks** → DashboardPage unregisters in cleanup
- **Reconnection loop** → Service disables on fatal errors
- **Race conditions** → Service uses refs + Zustand immutable updates
- **Overlay sync lag** → Service writes directly to overlayStore

### LOW (1)
- **Polling duplicates** → Cursor tracking prevents duplicates

---

## Next Steps

### Day 3 PM (30 min)
1. Read [PHASE2_QUICK_START.md](./PHASE2_QUICK_START.md)
2. Update `src/components/AppInitializer.tsx`
3. Copy-paste complete code from PHASE2_QUICK_START.md
4. Run verification checklist

### Day 4 AM (2 hours)
1. Refactor `useStreamWS.ts` → thin wrapper
2. Refactor `useTTSPlayer.ts` → thin wrapper
3. Refactor `useViewerChatPolling.ts` → no-op wrapper

### Day 4 PM (1 hour)
1. Update `src/pages/DashboardPage.tsx`
2. Register/unregister callbacks
3. Remove direct polling call

### Day 5 AM (2 hours)
1. Full E2E test
2. App start → broadcast → STT → WebSocket → TTS → overlay

### Day 5 PM (2 hours)
1. Bug fixes & cleanup
2. Memory leak checks
3. Error handling improvements

---

## Build Status

✅ **TypeScript compilation**: PASS  
✅ **Vite bundling**: PASS  
✅ **No errors or warnings**

```bash
npm run build
# ✓ tsc -b
# ✓ vite build
# ✓ dist/ generated (542.31 kB JS, 45.06 kB CSS)
```

---

## Backwards Compatibility

✅ All existing hooks/pages remain unchanged  
✅ No breaking changes to public APIs  
✅ Phase 1 STT service unaffected  
✅ Gradual migration path (hooks → thin wrappers)  

---

## Summary

**Phase 2 core service is complete and ready for integration.**

The service provides:
1. ✅ Singleton WebSocket management with auto-reconnect
2. ✅ Persistent TTS queue (survives page navigation)
3. ✅ Continuous viewer polling (3-second intervals)
4. ✅ Callback registration interface
5. ✅ Direct store writes (aiModeStore, overlayStore)
6. ✅ Full backwards compatibility

**Status**: ✅ Ready for Day 3 PM integration  
**Difficulty**: LOW  
**Effort**: 2-3 days total (Phase 2 + Phase 3 deferred)  
**Risk**: MEDIUM (all mitigatable)  

---

## Questions?

Refer to:
- **PHASE2_QUICK_START.md** for Day 3 PM task
- **PHASE2_IMPLEMENTATION.md** for detailed architecture
- **BROADCAST_WS_FLOW_INSPECTION.md** for risk assessment
- **BROADCAST_WS_QUICK_REFERENCE.md** for visual diagrams
