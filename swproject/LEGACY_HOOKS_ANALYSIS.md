# SKU-SW Frontend Resident-WS Migration: Legacy Hook Analysis

**Date**: 2026-05-27  
**Status**: Phase 2 service created, integration in progress  
**Scope**: Inspect legacy broadcast hooks after broadcastWSBackgroundService creation

---

## Executive Summary

✅ **Phase 2 integration is WELL-PROGRESSED**:
- AppInitializer.tsx: ✅ Fully updated with Phase 2 service init + callback wiring
- useBroadcastWSState.ts: ✅ New thin wrapper created (uses useSyncExternalStore)
- useStreamWS.ts: ✅ Already refactored to thin wrapper (delegates to service)
- useTTSPlayer.ts: ⚠️ Still legacy implementation (NOT USED anywhere)
- useViewerChatPolling.ts: ⚠️ Still legacy implementation (NOT USED anywhere)
- DashboardPage.tsx: ✅ Using only useBroadcastWSState (new wrapper), NOT legacy hooks

**Key Finding**: Legacy hooks (useTTSPlayer, useViewerChatPolling) are **DEAD CODE** — not imported or used anywhere in the codebase.

---

## (1) Remaining Legacy Usages

### Current Hook Imports in Codebase

**DashboardPage.tsx (line 25)**:
```typescript
import { useBroadcastWSState, useStreamInfo } from "@/features/broadcast/hooks";
```

**Analysis**:
- ✅ `useBroadcastWSState` — NEW thin wrapper (created for Phase 2)
- ✅ `useStreamInfo` — Unrelated to resident-WS migration (fetches stream metadata)
- ❌ `useStreamWS` — NOT imported
- ❌ `useTTSPlayer` — NOT imported
- ❌ `useViewerChatPolling` — NOT imported

**Broadcast hooks index.ts (lines 5-12)**:
```typescript
export { useStartBroadcast } from "./useStartBroadcast";
export { useTerminateBroadcast } from "./useTerminateBroadcast";
export { useStreamInfo } from "./useStreamInfo";
export { useStreamWS } from "./useStreamWS";           // ← Exported but not used
export { useTTSPlayer } from "./useTTSPlayer";         // ← Exported but not used
export { useViewerChatPolling } from "./useViewerChatPolling"; // ← Exported but not used
export { useObsLaunch } from "./useObsLaunch";
export { useBroadcastWSState } from "./useBroadcastWSState";
```

### Hook-by-Hook Status

| Hook | File | Status | Used? | Notes |
|------|------|--------|-------|-------|
| `useStreamWS` | useStreamWS.ts | ✅ Thin wrapper | ❌ No | Delegates to service.registerCallbacks() + service.sendChat() |
| `useTTSPlayer` | useTTSPlayer.ts | ⚠️ Legacy | ❌ No | Still has old implementation (local queue + AudioContext) |
| `useViewerChatPolling` | useViewerChatPolling.ts | ⚠️ Legacy | ❌ No | Still has old implementation (local polling timer) |
| `useBroadcastWSState` | useBroadcastWSState.ts | ✅ New wrapper | ✅ Yes | Uses useSyncExternalStore + service.subscribeState() |
| `useStreamInfo` | useStreamInfo.ts | ✅ Unrelated | ✅ Yes | Fetches stream metadata (not part of resident-WS) |
| `useStartBroadcast` | useStartBroadcast.ts | ✅ Unrelated | ✅ Yes | Starts broadcast (not part of resident-WS) |
| `useTerminateBroadcast` | useTerminateBroadcast.ts | ✅ Unrelated | ✅ Yes | Terminates broadcast (not part of resident-WS) |
| `useObsLaunch` | useObsLaunch.ts | ✅ Unrelated | ✅ Yes | Launches OBS (not part of resident-WS) |

---

## (2) Which Are Safe to Leave

### Safe to Keep (No Changes Needed)

**1. useStreamWS.ts** ✅
- **Status**: Already refactored to thin wrapper
- **Current implementation**: Delegates to service
- **Why safe**: 
  - Maintains backwards compatibility (same API)
  - Not used anywhere, but safe to keep for future callers
  - Properly delegates to service.registerCallbacks() + service.sendChat()
- **Action**: LEAVE AS-IS (already correct)

**2. useBroadcastWSState.ts** ✅
- **Status**: New thin wrapper (created for Phase 2)
- **Current implementation**: Uses useSyncExternalStore + service.subscribeState()
- **Why safe**:
  - Properly integrates with service
  - Used by DashboardPage for state subscription
  - Correct implementation
- **Action**: LEAVE AS-IS (already correct)

**3. useStreamInfo.ts** ✅
- **Status**: Unrelated to resident-WS migration
- **Why safe**: Fetches stream metadata, not part of WebSocket/TTS/polling
- **Action**: LEAVE AS-IS (no changes needed)

**4. useStartBroadcast.ts, useTerminateBroadcast.ts, useObsLaunch.ts** ✅
- **Status**: Unrelated to resident-WS migration
- **Why safe**: Broadcast lifecycle management, not part of WebSocket/TTS/polling
- **Action**: LEAVE AS-IS (no changes needed)

---

## (3) Which Should Be Converted or Marked Legacy

### DEAD CODE: useTTSPlayer.ts ⚠️

**Current Status**:
- Still has old implementation (local queue + AudioContext)
- NOT imported or used anywhere in codebase
- Exported from index.ts but no callers

**Recommendation**: **MARK AS LEGACY + DEPRECATE**

**Action**:
```typescript
/**
 * @file TTS 오디오 재생 큐 훅 — DEPRECATED (Phase 2)
 * @deprecated Use broadcastWSBackgroundService.enqueueTTS() instead
 * @see src/services/broadcastWSBackgroundService.ts
 * 
 * 주의: 이 훅은 더 이상 사용되지 않습니다.
 * TTS 재생은 이제 broadcastWSBackgroundService가 전역 상주 형태로 관리합니다.
 * 
 * 마이그레이션 경로:
 *   OLD: const { enqueue } = useTTSPlayer(enabled);
 *        enqueue(blob);
 *   NEW: broadcastWSBackgroundService.enqueueTTS(blob);
 */
```

**Why deprecate instead of delete**:
- Maintains backwards compatibility for any external callers
- Clear migration path for future developers
- Can be removed in Phase 3 cleanup

### DEAD CODE: useViewerChatPolling.ts ⚠️

**Current Status**:
- Still has old implementation (local polling timer)
- NOT imported or used anywhere in codebase
- Exported from index.ts but no callers

**Recommendation**: **MARK AS LEGACY + DEPRECATE**

**Action**:
```typescript
/**
 * @file 대시보드 체류 중 시청자 채팅(VIEWER) 최신 항목 polling 훅 — DEPRECATED (Phase 2)
 * @deprecated Use broadcastWSBackgroundService polling instead
 * @see src/services/broadcastWSBackgroundService.ts
 * 
 * 주의: 이 훅은 더 이상 사용되지 않습니다.
 * 시청자 채팅 폴링은 이제 broadcastWSBackgroundService가 전역 상주 형태로 관리합니다.
 * 
 * 마이그레이션 경로:
 *   OLD: useViewerChatPolling({ enabled: true, size: 30 });
 *   NEW: broadcastWSBackgroundService는 자동으로 폴링을 관리합니다.
 *        (broadcastStreamId 변화 감시 → 자동 시작/중지)
 */
```

**Why deprecate instead of delete**:
- Maintains backwards compatibility for any external callers
- Clear migration path for future developers
- Can be removed in Phase 3 cleanup

---

## (4) Dead Imports/Usages Already Removable

### Removable Exports from index.ts

**Current exports (line 8-10)**:
```typescript
export { useStreamWS } from "./useStreamWS";           // ← Can remove
export { useTTSPlayer } from "./useTTSPlayer";         // ← Can remove
export { useViewerChatPolling } from "./useViewerChatPolling"; // ← Can remove
```

**Recommendation**: **KEEP EXPORTS** (for backwards compatibility)

**Rationale**:
- No internal callers, but external code might import them
- Deprecation warnings are better than breaking changes
- Can be removed in Phase 3 after deprecation period

### No Dead Imports in DashboardPage

**Current imports (line 25)**:
```typescript
import { useBroadcastWSState, useStreamInfo } from "@/features/broadcast/hooks";
```

✅ Both are actively used:
- `useBroadcastWSState` — Used at line 119 for state subscription
- `useStreamInfo` — Used at line 110-114 for stream metadata

**No removable imports**.

---

## Architecture Verification

### Current Data Flow (Phase 2 Integrated)

```
┌─────────────────────────────────────────────────────────────┐
│ AppInitializer.tsx (Global Initialization)                  │
├─────────────────────────────────────────────────────────────┤
│ ✅ broadcastWSBackgroundService.init()                      │
│ ✅ broadcastWSBackgroundService.registerCallbacks({         │
│      onVoiceChunk, onVoiceTurnComplete, onEmotionChange     │
│    })                                                        │
│ ✅ sttBackgroundService.subscribeFinalTranscript(           │
│      handleFinalTranscript → sendChat()                     │
│    )                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ broadcastWSBackgroundService (Resident Service)             │
├─────────────────────────────────────────────────────────────┤
│ ✅ WebSocket lifecycle (connect/disconnect/reconnect)       │
│ ✅ TTS queue (persistent, survives page nav)                │
│ ✅ Viewer polling (3-second intervals)                      │
│ ✅ Callback registration (onVoiceChunk, etc.)               │
│ ✅ State subscriptions (authStore, aiModeStore)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ DashboardPage.tsx (UI Layer)                                │
├─────────────────────────────────────────────────────────────┤
│ ✅ useBroadcastWSState() → service state subscription       │
│ ✅ useStreamInfo() → stream metadata                        │
│ ✅ useSTT() → speech recognition                           │
│ ✅ useCharacter() → character metadata                      │
│ ❌ useStreamWS() — NOT USED                                 │
│ ❌ useTTSPlayer() — NOT USED                                │
│ ❌ useViewerChatPolling() — NOT USED                        │
└─────────────────────────────────────────────────────────────┘
```

### Service Public API (Verified)

**broadcastWSBackgroundService** exports:
```typescript
// Initialization
init(): void
dispose(): void

// State subscription (for React)
subscribeState(listener): () => void
getSnapshot(): BroadcastWSServiceState

// Callback registration
registerCallbacks(callbacks: BroadcastWSCallbacks): void
unregisterCallbacks(keys: string[]): void

// WebSocket operations
sendChat(text: string): { ok: boolean; reason?: string }

// TTS operations
enqueueTTS(audio: Blob): void

// Polling (internal, auto-managed)
// (no public API, auto-triggered by broadcastStreamId change)
```

**useBroadcastWSState** (thin wrapper):
```typescript
// Returns: { isConnected, error, diagnostic, isPlayingTTS }
useBroadcastWSState(): BroadcastWSServiceState
```

**useStreamWS** (thin wrapper):
```typescript
// Registers callbacks + returns state + sendChat
useStreamWS(options: UseStreamWSOptions): UseStreamWSReturn
```

---

## Migration Status Summary

| Component | Status | Action | Notes |
|-----------|--------|--------|-------|
| **AppInitializer.tsx** | ✅ Complete | None | Fully integrated with Phase 2 service |
| **broadcastWSBackgroundService.ts** | ✅ Complete | None | Core service fully functional |
| **useBroadcastWSState.ts** | ✅ Complete | None | New thin wrapper, properly integrated |
| **useStreamWS.ts** | ✅ Complete | None | Already refactored to thin wrapper |
| **useTTSPlayer.ts** | ⚠️ Legacy | Mark deprecated | Dead code, not used anywhere |
| **useViewerChatPolling.ts** | ⚠️ Legacy | Mark deprecated | Dead code, not used anywhere |
| **DashboardPage.tsx** | ✅ Complete | None | Using only new wrappers |
| **Broadcast hooks index.ts** | ✅ Safe | Keep exports | Maintain backwards compatibility |

---

## Recommendations

### Immediate Actions (No Breaking Changes)

1. **Mark useTTSPlayer.ts as deprecated**
   - Add deprecation notice at top of file
   - Point to broadcastWSBackgroundService.enqueueTTS()
   - Keep implementation for backwards compatibility

2. **Mark useViewerChatPolling.ts as deprecated**
   - Add deprecation notice at top of file
   - Point to broadcastWSBackgroundService polling
   - Keep implementation for backwards compatibility

3. **Keep all exports in index.ts**
   - Maintain backwards compatibility
   - External code might import these hooks
   - Can be removed in Phase 3 cleanup

### Phase 3 Cleanup (Breaking Changes OK)

1. **Remove useTTSPlayer.ts**
   - After deprecation period
   - Update index.ts exports
   - Update any external callers

2. **Remove useViewerChatPolling.ts**
   - After deprecation period
   - Update index.ts exports
   - Update any external callers

3. **Consider removing useStreamWS.ts**
   - If no external callers
   - useBroadcastWSState is the preferred new wrapper
   - Can keep for backwards compatibility

---

## Code Examples

### Current Working Pattern (DashboardPage)

```typescript
// ✅ Correct: Using new thin wrapper
const { isConnected: wsConnected, error: wsError, isPlayingTTS: isTtsPlaying } = useBroadcastWSState();

// ✅ Correct: Using unrelated hooks
const { characterInfo, error: streamInfoError, refetch: refetchStreamInfo } = useStreamInfo({ size: 1 });
const { isListening, isSupported, error: sttError } = useSTT();
```

### Legacy Pattern (NOT USED, but if someone tries)

```typescript
// ❌ DEPRECATED: Old pattern (not used anywhere)
const { enqueue: enqueueTTS, isPlaying: isTtsPlaying } = useTTSPlayer(toggles.ttsEnabled);

// ❌ DEPRECATED: Old pattern (not used anywhere)
useViewerChatPolling({ size: 100, intervalMs: 3000 });

// ❌ DEPRECATED: Old pattern (not used anywhere)
const { isConnected, error, diagnostic, sendChat } = useStreamWS({
  onVoiceChunk: handleVoiceChunk,
  onVoiceTurnComplete: handleVoiceTurnComplete,
  onEmotionChange: handleEmotionChange,
});
```

### New Pattern (Recommended)

```typescript
// ✅ NEW: Use service directly
broadcastWSBackgroundService.enqueueTTS(audio);

// ✅ NEW: Service auto-manages polling
// (no hook needed, service handles it)

// ✅ NEW: Use thin wrapper for state
const { isConnected, error, diagnostic, isPlayingTTS } = useBroadcastWSState();

// ✅ NEW: Use service for callbacks
broadcastWSBackgroundService.registerCallbacks({
  onVoiceChunk: handleVoiceChunk,
  onVoiceTurnComplete: handleVoiceTurnComplete,
  onEmotionChange: handleEmotionChange,
});
```

---

## Files Affected

### No Changes Needed
- ✅ src/pages/DashboardPage.tsx (already using new wrappers)
- ✅ src/components/AppInitializer.tsx (already integrated)
- ✅ src/services/broadcastWSBackgroundService.ts (core service)
- ✅ src/features/broadcast/hooks/useBroadcastWSState.ts (new wrapper)
- ✅ src/features/broadcast/hooks/useStreamWS.ts (already refactored)
- ✅ src/features/broadcast/hooks/useStreamInfo.ts (unrelated)
- ✅ src/features/broadcast/hooks/useStartBroadcast.ts (unrelated)
- ✅ src/features/broadcast/hooks/useTerminateBroadcast.ts (unrelated)
- ✅ src/features/broadcast/hooks/useObsLaunch.ts (unrelated)

### Optional Deprecation Notices (No Breaking Changes)
- ⚠️ src/features/broadcast/hooks/useTTSPlayer.ts (add deprecation notice)
- ⚠️ src/features/broadcast/hooks/useViewerChatPolling.ts (add deprecation notice)

### Keep As-Is (Backwards Compatibility)
- ✅ src/features/broadcast/hooks/index.ts (keep all exports)

---

## Conclusion

**Phase 2 integration is WELL-PROGRESSED and SAFE**:

1. ✅ **Core service** (broadcastWSBackgroundService) is fully functional
2. ✅ **AppInitializer** is fully integrated with Phase 2 service
3. ✅ **New thin wrappers** (useBroadcastWSState, useStreamWS) are properly implemented
4. ✅ **DashboardPage** is using only new wrappers, not legacy hooks
5. ⚠️ **Legacy hooks** (useTTSPlayer, useViewerChatPolling) are dead code but safe to keep for backwards compatibility

**No breaking changes needed**. The codebase is in a good state for Phase 3 cleanup.

**Recommended next step**: Add deprecation notices to useTTSPlayer.ts and useViewerChatPolling.ts, then proceed with Phase 3 backend improvements.
