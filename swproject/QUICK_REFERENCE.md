# SKU-SW Frontend - Quick Reference Guide

## Feature Overview at a Glance

### 🔐 Authentication (`src/features/auth/`)
- **What**: User login/signup with JWT tokens
- **Key Files**: authApi.ts, useLogin.ts, useSignup.ts
- **Store**: useAuthStore (user, accessToken, refreshToken)
- **Flow**: Email/password → API → setAuth() → /dashboard

### 👤 Character Management (`src/features/character/`)
- **What**: Create/edit/delete AI characters with personas
- **Key Files**: characterApi.ts, useCharacters.ts, useCreateCharacter.ts, CharacterForm.tsx
- **Store**: useCharacterStore (characters[], selectedCharacterId, characterDetailsMap)
- **Special**: Image URL normalization (Default.png), max 10 characters/user
- **Flow**: List → Select → Create/Edit → Save → Broadcast

### 📊 Dashboard (`src/features/dashboard/`)
- **What**: Main broadcast monitoring UI
- **Key Files**: DashboardPage.tsx, ConversationStream.tsx, BroadcastControls.tsx, KpiCard.tsx
- **Store**: useAIModeStore (mode, toggles, dialogues, stats)
- **Features**: Real-time chat, character portrait, KPI cards, activity log
- **Flow**: useStreamInfo() → useStreamWS() → upsertDialogues() → render

### 📡 Broadcasting (`src/features/broadcast/`)
- **What**: Stream lifecycle + WebSocket communication
- **Key Files**: broadcastApi.ts, useStartBroadcast.ts, useStreamWS.ts, useTTSPlayer.ts
- **Store**: useBroadcastNoticeStore (skip notice per character)
- **Special**: Auto-recovery on 400 (leftover cleanup), binary+JSON WebSocket pairing
- **Flow**: Start → OBS setup → WebSocket connect → Real-time updates → Stop

### 🎤 Speech-to-Text (`src/features/stt/`)
- **What**: Capture streamer voice via Faster Whisper
- **Key Files**: useSTT.ts
- **Backend**: electron/stt_server.py (Python daemon)
- **Flow**: Ctrl+M push-to-talk → Whisper → transcription → sendChat()

---

## Pages at a Glance

| Page | File | Status | Purpose |
|------|------|--------|---------|
| Login | `pages/auth/LoginPage.tsx` | ✅ Done | User authentication |
| Signup | `pages/auth/SignupPage.tsx` | ✅ Done | User registration |
| Dashboard | `pages/DashboardPage.tsx` | ✅ Done | Main broadcast monitoring |
| Character | `pages/CharacterPage.tsx` | ✅ Done | Character CRUD + broadcast control |
| Chat Analysis | `pages/ChatAnalysisPage.tsx` | 🔄 Stub | Chat pattern analysis |
| Proactive | `pages/ProactivePage.tsx` | 🔄 Stub | Proactive AI reactions |
| Game | `pages/GamePage.tsx` | ✅ Done | LoL integration + event reactions |
| Safety | `pages/SafetyPage.tsx` | ✅ Done | Harmful word filter |
| Settings | `pages/SettingsPage.tsx` | ✅ Done | Theme selection |
| Stats | `pages/StatsPage.tsx` | 🔄 Stub | Broadcast analytics |
| Overlay | `pages/OverlayPage.tsx` | ✅ Done | OBS Browser Source |

---

## Stores at a Glance

| Store | Persists | Runtime | Key Actions |
|-------|----------|---------|-------------|
| **authStore** | user, tokens | — | setAuth(), clearAuth() |
| **characterStore** | characters[], selectedId | — | setCharacters(), addCharacter() |
| **aiModeStore** | mode, toggles | streamId, dialogues, stats | setBroadcast(), upsertDialogues() |
| **overlayStore** | settings | runtime | updateRuntime(), clearRuntime() |
| **broadcastNoticeStore** | skipNoticeMap | — | skipNoticeForCharacter() |
| **gameStore** | triggers, speed | isRunning, gameState | setTrigger(), setGameState() |
| **safetyStore** | words[] | — | addWord(), removeWord() |
| **themeStore** | theme | — | setTheme() |

---

## Data Flow Patterns

### Pattern A: Simple API → Store → UI
```
Component → useHook() → apiClient.get() → Store.setData() → Re-render
```
**Example**: CharacterPage → useCharacters() → GET /characters → setCharacters() → render list

### Pattern B: User Action → API → Store → Broadcast
```
User clicks → Modal → API call → Store update → Navigate → WebSocket connect
```
**Example**: Start broadcast → Confirm → OBS setup → startBroadcast() → setBroadcast() → /dashboard

### Pattern C: WebSocket → Store → UI + Overlay
```
WS message → Parse → Store update → UI re-render + Overlay sync
```
**Example**: VOICE_CHUNK → upsertDialogues() → ConversationStream + OverlayPage

### Pattern D: Optimistic UI
```
User action → Immediate UI update + API call (may not echo back)
```
**Example**: Send message → Add to dialogues immediately → Display in chat

---

## Key Technical Decisions

### 1. HashRouter (not BrowserRouter)
- **Why**: Electron file:// protocol compatibility
- **Impact**: URLs use #/path format, redirects via window.location.hash

### 2. Zustand + Persist
- **Why**: Simple state management + auto-localStorage sync
- **Impact**: App state survives page refresh, no Redux boilerplate

### 3. JWT + 401 Queue Pattern
- **Why**: Handle concurrent requests during token refresh
- **Impact**: First 401 triggers refresh, others wait, all retry with new token

### 4. Image URL Normalization
- **Why**: Backend inconsistency (returns emotion filenames instead of Default.png)
- **Impact**: Normalize on every set/hydrate to ensure consistent UI

### 5. Overlay Bridge (localStorage + postMessage)
- **Why**: Cross-window state sync between main app and OBS overlay
- **Impact**: Overlay updates in real-time without polling

### 6. Auto-Recovery on 400
- **Why**: Handle leftover broadcasts from previous sessions
- **Impact**: Terminate → Retry pattern ensures clean state

### 7. Optimistic UI for Streamer Messages
- **Why**: Backend doesn't echo streamer messages back
- **Impact**: Add to dialogues immediately for instant feedback

---

## Common Tasks

### Add a New Store
```typescript
// 1. Define interface
interface MyStore { data: T; setData: (d: T) => void; }

// 2. Create with persist
export const useMyStore = create<MyStore>()(
  persist((set) => ({
    data: initialValue,
    setData: (data) => set({ data }),
  }), { name: 'my-storage' })
);

// 3. Use in component
const data = useMyStore((s) => s.data);
```

### Add a New Hook
```typescript
// 1. Define return type
interface UseMyHookReturn { data: T | null; isLoading: boolean; error: string | null; }

// 2. Implement with error handling
export function useMyHook(): UseMyHookReturn {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<T>('/api/endpoint');
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetch(); }, [fetch]);
  return { data, isLoading, error };
}
```

### Add a New Page
```typescript
// 1. Create page file
// src/pages/XxxPage.tsx

// 2. Add route
// src/App.tsx: <Route path="/xxx" element={<XxxPage />} />

// 3. Use stores/hooks
const data = useMyStore((s) => s.data);
const { data: apiData } = useMyHook();

// 4. Render
return <div>{data}</div>;
```

### Handle Errors
```typescript
try {
  await someAsyncOperation();
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
  if (import.meta.env.DEV) console.error('[context]', { error: err });
}
```

---

## File Locations Quick Lookup

### Need to modify...

**User authentication?**
- `src/features/auth/api/authApi.ts` (API calls)
- `src/shared/stores/authStore.ts` (state)
- `src/shared/types/auth.ts` (types)

**Character management?**
- `src/features/character/api/characterApi.ts` (API)
- `src/features/character/hooks/useCharacters.ts` (list)
- `src/shared/stores/characterStore.ts` (state)
- `src/shared/types/character.ts` (types)

**Dashboard display?**
- `src/pages/DashboardPage.tsx` (page logic)
- `src/features/dashboard/components/` (UI components)
- `src/shared/stores/aiModeStore.ts` (state)

**Broadcasting?**
- `src/features/broadcast/api/broadcastApi.ts` (API)
- `src/features/broadcast/hooks/useStreamWS.ts` (WebSocket)
- `src/shared/stores/aiModeStore.ts` (state)

**Overlay?**
- `src/pages/OverlayPage.tsx` (page)
- `src/shared/stores/overlayStore.ts` (state)
- `src/shared/lib/overlayBridge.ts` (sync)

**Game integration?**
- `src/pages/GamePage.tsx` (page)
- `src/shared/stores/gameStore.ts` (state)
- `src/shared/types/game.ts` (types)

**Safety filter?**
- `src/pages/SafetyPage.tsx` (page)
- `src/shared/stores/safetyStore.ts` (state)

**API client/interceptors?**
- `src/shared/lib/axios.ts` (JWT + 401 handling)

**Types/constants?**
- `src/shared/types/` (all type definitions)
- `src/shared/constants/` (constants)

---

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

---

## Commands

```bash
npm run dev              # Vite dev server (port 5173)
npm run electron:dev    # Vite + Electron
npm run build           # Production build
npm run lint            # ESLint
```

---

## Debugging Tips

1. **Check store state**: `useMyStore.getState()` in console
2. **Check API calls**: Network tab in DevTools
3. **Check WebSocket**: Network → WS tab
4. **Check localStorage**: Application → Local Storage
5. **Check Electron logs**: Electron DevTools (Ctrl+Shift+I)
6. **Check STT**: Electron console for stt_server.py logs

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token expired | Auto-handled by interceptor, check refresh endpoint |
| 400 Bad Request | Leftover broadcast | Auto-recovery in useStartBroadcast, check BE state |
| WebSocket connection failed | Network issue | Check VITE_WS_URL, auto-reconnect after 3s |
| Image not loading | Wrong URL format | Check characterEmotionImages.ts normalization |
| Overlay not syncing | Bridge not initialized | Check overlayBridge.ts, verify localStorage |
| STT not working | Daemon not running | Check electron/stt_server.py, verify Whisper model |

---

## Architecture Principles

1. **Feature-based organization**: Related code grouped by feature
2. **Separation of concerns**: API, hooks, components, stores separate
3. **Single source of truth**: Zustand stores as state authority
4. **Selector pattern**: Only subscribe to needed store fields
5. **Error handling**: Try-catch + user-friendly messages
6. **Type safety**: Full TypeScript coverage
7. **Persistence**: Auto-save to localStorage via Zustand
8. **Optimistic UI**: Immediate feedback, eventual consistency
9. **Auto-recovery**: Handle edge cases gracefully
10. **Cross-window sync**: Overlay bridge for real-time updates

---

**For detailed information, see TECHNICAL_MAP.md**
