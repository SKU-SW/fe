# Phase 2 Quick Start: Next Steps (Day 3 PM)

## Current Status
✅ **broadcastWSBackgroundService.ts created** (500 lines, fully functional)  
✅ **PHASE2_IMPLEMENTATION.md created** (comprehensive guide)  
⏳ **Next**: Wire STT→WebSocket callback chain in AppInitializer.tsx

---

## Day 3 PM Task: AppInitializer Phase 2 Integration

### File to Modify
`src/components/AppInitializer.tsx`

### Current Code (Phase 1 only)
```typescript
import { useEffect } from "react";
import { sttBackgroundService } from "@/services/sttBackgroundService";
import { useAIModeStore } from "@/shared/stores/aiModeStore";

export default function AppInitializer() {
  const sttEnabled = useAIModeStore((s) => s.toggles.sttEnabled);

  useEffect(() => {
    sttBackgroundService.init();
    const unsubscribe = sttBackgroundService.subscribeFinalTranscript(async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      useAIModeStore.getState().addActivityLog({
        id: `stt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "system",
        message: `STT 인식: ${trimmed}`,
        timestamp: new Date(),
        level: "info",
      });
    });
    return () => {
      unsubscribe();
      sttBackgroundService.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sttEnabled) {
      void sttBackgroundService.cancelListening();
    }
  }, [sttEnabled]);

  return null;
}
```

### Changes Required (Phase 2 addition)

**Add import**:
```typescript
import { broadcastWSBackgroundService } from "@/services/broadcastWSBackgroundService";
```

**Modify first useEffect** (add Phase 2 init + STT→WebSocket wiring):
```typescript
useEffect(() => {
  console.info('[app-init] Phase 1 + Phase 2 init start');
  
  // Phase 1: STT service init
  sttBackgroundService.init();

  // Phase 2: WebSocket service init
  broadcastWSBackgroundService.init();

  // Wire STT final transcript → WebSocket sendChat
  const unsubscribeSTT = sttBackgroundService.subscribeFinalTranscript(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Activity log (Phase 1 behavior)
    useAIModeStore.getState().addActivityLog({
      id: `stt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "system",
      message: `STT 인식: ${trimmed}`,
      timestamp: new Date(),
      level: "info",
    });

    // NEW: Send to WebSocket (Phase 2 behavior)
    const result = broadcastWSBackgroundService.sendChat(trimmed);
    if (!result.ok) {
      console.warn("[app-init] sendChat failed:", result.reason);
      useAIModeStore.getState().addActivityLog({
        id: `stt-error-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "system",
        message: `WebSocket 송신 실패: ${result.reason}`,
        timestamp: new Date(),
        level: "error",
      });
    }
  });

  return () => {
    unsubscribeSTT();
    sttBackgroundService.dispose();
    broadcastWSBackgroundService.dispose();
  };
}, []);
```

### Complete Updated File

```typescript
/**
 * @file 앱 전역 런타임 초기화 컴포넌트
 * @updated Phase 2 - WebSocket service init + STT→WebSocket wiring
 * @dependsOn src/services/sttBackgroundService.ts
 * @dependsOn src/services/broadcastWSBackgroundService.ts
 * @dependsOn src/shared/stores/aiModeStore.ts
 * @usedBy src/main.tsx
 */

import { useEffect } from "react";
import { sttBackgroundService } from "@/services/sttBackgroundService";
import { broadcastWSBackgroundService } from "@/services/broadcastWSBackgroundService";
import { useAIModeStore } from "@/shared/stores/aiModeStore";

export default function AppInitializer() {
  const sttEnabled = useAIModeStore((s) => s.toggles.sttEnabled);

  useEffect(() => {
    console.info('[app-init] Phase 1 + Phase 2 init start', {
      hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI,
      hasGlobalPtt: typeof window !== 'undefined' && typeof window.electronAPI?.stt?.onGlobalPtt === 'function',
      hasTranscribe: typeof window !== 'undefined' && typeof window.electronAPI?.stt?.transcribe === 'function',
    });

    // Phase 1: STT service init
    sttBackgroundService.init();

    // Phase 2: WebSocket service init
    broadcastWSBackgroundService.init();

    // Wire STT final transcript → WebSocket sendChat
    const unsubscribeSTT = sttBackgroundService.subscribeFinalTranscript(async (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Activity log (Phase 1 behavior)
      useAIModeStore.getState().addActivityLog({
        id: `stt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "system",
        message: `STT 인식: ${trimmed}`,
        timestamp: new Date(),
        level: "info",
      });

      // Send to WebSocket (Phase 2 behavior)
      const result = broadcastWSBackgroundService.sendChat(trimmed);
      if (!result.ok) {
        console.warn("[app-init] sendChat failed:", result.reason);
        useAIModeStore.getState().addActivityLog({
          id: `stt-error-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: "system",
          message: `WebSocket 송신 실패: ${result.reason}`,
          timestamp: new Date(),
          level: "error",
        });
      }
    });

    return () => {
      unsubscribeSTT();
      sttBackgroundService.dispose();
      broadcastWSBackgroundService.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sttEnabled) {
      void sttBackgroundService.cancelListening();
    }
  }, [sttEnabled]);

  return null;
}
```

---

## Verification Checklist

After updating AppInitializer.tsx:

- [ ] File saves without TypeScript errors
- [ ] `broadcastWSBackgroundService` import resolves
- [ ] App starts without console errors
- [ ] STT hotkey works (Activity Log shows "STT 인식: ...")
- [ ] WebSocket connects when broadcast starts (check browser DevTools Network tab)
- [ ] Message sends via WebSocket (check Network tab for WS frames)
- [ ] AI response arrives (check VOICE_CHUNK frames)
- [ ] TTS plays (audio output)
- [ ] Overlay syncs (if OBS overlay is running)

---

## Testing Workflow

1. **Start app**: `npm run electron:dev`
2. **Go to DashboardPage**: Start a broadcast
3. **Check WebSocket**: DevTools → Network → WS tab (should show `wss://...` connection)
4. **Test STT**: Press hotkey, speak, release
5. **Check Activity Log**: Should show "STT 인식: [your text]"
6. **Check WebSocket**: Should show message frame sent
7. **Wait for response**: Should see VOICE_CHUNK frames arriving
8. **Verify TTS**: Audio should play
9. **Navigate away**: Go to CharacterPage
10. **Check WebSocket**: Should still be connected (Network tab)
11. **Navigate back**: Go to DashboardPage
12. **Test again**: STT → WebSocket → TTS should work

---

## Common Issues & Fixes

### Issue: "broadcastWSBackgroundService is not defined"
**Fix**: Check import statement in AppInitializer.tsx
```typescript
import { broadcastWSBackgroundService } from "@/services/broadcastWSBackgroundService";
```

### Issue: WebSocket doesn't connect
**Fix**: Check that broadcast is started (aiModeStore.broadcastStreamId is set)
```typescript
// In browser console:
useAIModeStore.getState().broadcastStreamId  // Should not be null
```

### Issue: Message doesn't send
**Fix**: Check WebSocket is OPEN
```typescript
// In browser console:
broadcastWSBackgroundService.wsRef?.readyState  // Should be 1 (OPEN)
```

### Issue: TTS doesn't play
**Fix**: Check TTS toggle is enabled
```typescript
// In browser console:
useAIModeStore.getState().toggles.ttsEnabled  // Should be true
```

---

## Next Steps After Day 3 PM

### Day 3 Eve: Token Refresh Reconnect
✅ Already implemented in service (no additional work)

### Day 4 AM: Refactor Hooks
- [ ] useStreamWS.ts → thin wrapper
- [ ] useTTSPlayer.ts → thin wrapper
- [ ] useViewerChatPolling.ts → no-op wrapper

### Day 4 PM: Update DashboardPage
- [ ] Register/unregister callbacks
- [ ] Remove direct polling call
- [ ] Keep hook calls (thin wrappers)

### Day 5 AM: Full E2E Test
- [ ] App start → broadcast → STT → WebSocket → TTS → overlay

### Day 5 PM: Bug Fixes
- [ ] Memory leak checks
- [ ] Error handling
- [ ] Edge cases

---

## Key Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `src/services/broadcastWSBackgroundService.ts` | WebSocket + TTS + polling service | ✅ Created |
| `src/components/AppInitializer.tsx` | Phase 2 init + STT→WS wiring | ⏳ To modify |
| `src/features/broadcast/hooks/useStreamWS.ts` | Thin wrapper (state subscription) | ⏳ To refactor |
| `src/features/broadcast/hooks/useTTSPlayer.ts` | Thin wrapper (state subscription) | ⏳ To refactor |
| `src/features/broadcast/hooks/useViewerChatPolling.ts` | No-op wrapper | ⏳ To refactor |
| `src/pages/DashboardPage.tsx` | Callback registration | ⏳ To update |
| `PHASE2_IMPLEMENTATION.md` | Comprehensive guide | ✅ Created |

---

## Questions?

Refer to:
- **PHASE2_IMPLEMENTATION.md** for detailed architecture
- **BROADCAST_WS_FLOW_INSPECTION.md** for risk assessment
- **BROADCAST_WS_QUICK_REFERENCE.md** for visual diagrams
