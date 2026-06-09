# SKU-SW Frontend Technical Map

**Project**: AI Character Broadcasting Management Desktop App (React 19 + Electron + Zustand)  
**Last Updated**: 2026-05-22  
**Architecture**: Feature-based + Page-based hybrid with Zustand state management

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Infrastructure](#core-infrastructure)
3. [Feature Modules](#feature-modules)
4. [Pages & Routing](#pages--routing)
5. [Shared Infrastructure](#shared-infrastructure)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Key Implementation Patterns](#key-implementation-patterns)

---

## Architecture Overview

### Directory Structure

```
src/
├── pages/                    # Route pages (11 total)
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── SignupPage.tsx
│   ├── DashboardPage.tsx     # Main broadcast dashboard
│   ├── CharacterPage.tsx     # Character management
│   ├── ChatAnalysisPage.tsx  # Chat analysis (stub)
│   ├── ProactivePage.tsx     # Proactive reactions (stub)
│   ├── GamePage.tsx          # Game integration
│   ├── SafetyPage.tsx        # Safety filter management
│   ├── SettingsPage.tsx      # App settings
│   ├── StatsPage.tsx         # Broadcast stats (stub)
│   └── OverlayPage.tsx       # OBS overlay (standalone)
│
├── features/                 # Feature modules (5 major)
│   ├── auth/                 # Authentication
│   ├── character/            # Character management
│   ├── dashboard/            # Dashboard components
│   ├── broadcast/            # Broadcasting & streaming
│   └── stt/                  # Speech-to-text
│
├── shared/                   # Shared infrastructure
│   ├── stores/               # Zustand stores (8 total)
│   ├── types/                # TypeScript types
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilities & helpers
│   └── constants/            # Constants
│
├── components/
│   └── layouts/              # Layout components
│
├── styles/
│   └── globals.css           # Tailwind CSS
│
├── App.tsx                   # React Router setup
└── main.tsx                  # Vite entry point
```

### Tech Stack

- **React**: 19.2.4 (with hooks)
- **Router**: React Router v7 (HashRouter for Electron)
- **State**: Zustand v5 (with persist middleware)
- **Forms**: react-hook-form v7 + Zod v4
- **HTTP**: Axios v1 (with JWT interceptors)
- **Styling**: Tailwind CSS v3 + PostCSS
- **UI Icons**: lucide-react
- **Build**: Vite v8
- **Desktop**: Electron v33 (contextIsolation + preload)
- **Backend**: Spring Boot REST API @ localhost:8080

---

## Core Infrastructure

### 1. Routing (React Router v7)

**File**: `src/App.tsx`

```typescript
Routes:
  / → /login (redirect)
  /login, /signup → LoginPage, SignupPage (no layout)
  /dashboard → DashboardLayout (with sidebar)
    ├── /dashboard → DashboardPage
    ├── /character → CharacterPage
    ├── /chat-analysis → ChatAnalysisPage
    ├── /proactive → ProactivePage
    ├── /game → GamePage
    ├── /safety → SafetyPage
    ├── /settings → SettingsPage
    └── /stats → StatsPage
  /overlay → OverlayPage (standalone, no layout)
  * → /login (catch-all)
```

**Key Pattern**: HashRouter (not BrowserRouter) for Electron file:// protocol compatibility.

### 2. API Client (Axios + JWT)

**File**: `src/shared/lib/axios.ts`

**Two instances**:
- `apiClient` (default): JWT auto-injection + response unwrap + 401 token refresh
- `bareClient` (named): No token injection (for refresh endpoint only)

**Request Interceptor**:
- Injects `Authorization: Bearer {accessToken}` for all non-auth paths
- Skips token for: `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/refresh`

**Response Interceptor** (401 Queue Pattern):
1. First 401 triggers token refresh
2. Subsequent 401s queue and wait
3. On refresh success: retry all queued requests with new token
4. On refresh failure: clearAuth() + redirect to #/login

### 3. Layout System

**File**: `src/components/layouts/DashboardLayout.tsx`

- **Auth Guard**: Redirects to /login if no accessToken
- **Sidebar**: Collapsible navigation (DashboardSidebar)
- **Header**: Top bar with user info (DashboardHeader)
- **Main**: Outlet for page content

---

## Feature Modules

### Feature 1: Authentication (`src/features/auth/`)

**Purpose**: User login, signup, token management

**Files**:
- `api/authApi.ts` - API calls (loginEmail, signupEmail, refreshToken)
- `hooks/useLogin.ts` - Login logic with error handling
- `hooks/useSignup.ts` - Signup logic
- `hooks/useLogout.ts` - Logout logic
- `components/AuthCard.tsx` - Auth form wrapper
- `components/GoogleButton.tsx` - OAuth button
- `schemas/authSchemas.ts` - Zod validation schemas

**Data Flow**:
```
LoginPage
  ↓ useLogin()
  ↓ loginEmail(email, password)
  ↓ apiClient.post(/api/v1/auth/login/email)
  ↓ Response: { user, accessToken, refreshToken }
  ↓ useAuthStore.setAuth()
  ↓ Navigate to /dashboard
```

**Store**: `useAuthStore` (src/shared/stores/authStore.ts)
- Persists: user, accessToken, refreshToken
- Actions: setAuth(), setTokens(), clearAuth()

**Types**: `src/shared/types/auth.ts`
- User, AuthResponse, LoginRequest, TokenResponse

---

### Feature 2: Character Management (`src/features/character/`)

**Purpose**: Create, read, update, delete AI characters with personas

**Files**:
- `api/characterApi.ts` - CRUD endpoints
- `hooks/useCharacters.ts` - List all characters
- `hooks/useCharacter.ts` - Get single character detail
- `hooks/useCreateCharacter.ts` - Create new character
- `hooks/useUpdateCharacter.ts` - Update character
- `hooks/useDeleteCharacter.ts` - Delete character
- `hooks/useSelectCharacter.ts` - Select active character
- `hooks/useCharacterSettings.ts` - Get voice/image presets
- `components/CharacterDashboard.tsx` - Character list UI
- `components/CharacterForm.tsx` - Create/edit form
- `components/CharacterSettings.tsx` - Settings panel
- `components/BasicInfoSection.tsx` - Name, gender, voice
- `components/PersonaPresetSection.tsx` - Persona selection
- `components/VoicePersonalitySection.tsx` - Voice style
- `components/PNGTuberSelector.tsx` - 2D model selection
- `components/BroadcastConfirmModal.tsx` - Start broadcast confirmation
- `components/CharacterEmptyState.tsx` - Empty state UI
- `lib/triggerWords.ts` - Trigger word validation

**Data Flow**:
```
CharacterPage
  ↓ useCharacters() → GET /api/v1/characters
  ↓ Response: CharacterListItemResDto[]
  ↓ useCharacterStore.setCharacters()
  ↓ Display in CharacterDashboard
  ↓ On select: useSelectCharacter() → PATCH /api/v1/characters/{id}/select
  ↓ useCharacterStore.setSelectedCharacterId()
```

**Store**: `useCharacterStore` (src/shared/stores/characterStore.ts)
- Persists: characters[], selectedCharacterId, selectedCharacter, characterDetailsMap
- Normalizes: characterImageUrl to Default.png (handles BE inconsistencies)
- Actions: setCharacters(), setSelectedCharacterId(), addCharacter(), updateCharacter(), removeCharacter()

**Types**: `src/shared/types/character.ts`
- CharacterListItemResDto, CharacterDetailResDto
- CharacterCreateReqDto, CharacterUpdateReqDto
- CharacterPersona, SpeechStyle, Personality, Gender

**Key Pattern**: Image URL normalization on every set/hydrate to ensure consistent UI display

---

### Feature 3: Dashboard (`src/features/dashboard/`)

**Purpose**: Main broadcast monitoring UI with real-time stats

**Components**:
- `BroadcastHeader.tsx` - Stream info + log toggle
- `BroadcastControls.tsx` - Toggle buttons (STT, TTS, chat, proactive, AI)
- `CharacterPortrait.tsx` - Character image + emotion state
- `ConversationStream.tsx` - Chat/dialogue display with filters
- `KpiCard.tsx` - Stats card (viewers, chat speed, emotion, AI status)
- `ActivityLogPanel.tsx` - Activity log sidebar
- `ResetConfirmModal.tsx` - Confirmation modal
- `DashboardEmptyState.tsx` - "No broadcast" state

**Page**: `src/pages/DashboardPage.tsx`

**Data Flow**:
```
DashboardPage (mode === 'broadcasting')
  ↓ useStreamInfo() → GET /api/v1/stream/info
  ↓ Response: CurrentStreamInfoResDto (character info + initial dialogues)
  ↓ useStreamWS() → WebSocket /api/v1/stream/ws
  ↓ Receive: VOICE_CHUNK, VOICE_TURN_COMPLETE, VOICE_EMOTION
  ↓ useSTT() → Ctrl+M push-to-talk
  ↓ useViewerChatPolling() → Poll viewer chats every 3s
  ↓ useTTSPlayer() → Play TTS audio chunks
  ↓ updateOverlayRuntime() → Sync to OBS overlay
  ↓ upsertDialogues() → Update aiModeStore.dialogues
  ↓ Render ConversationStream + KPI cards
```

**Store**: `useAIModeStore` (src/shared/stores/aiModeStore.ts)
- Persists: mode, toggles, sensitivity settings
- Runtime: broadcastStreamId, broadcastStartedAt, dialogues, stats, activityLogs
- Actions: setBroadcast(), clearBroadcast(), setToggle(), upsertDialogues(), setEmotion()

**Key Pattern**: 
- Dialogue timestamp parsing (BE format: "YYYY-MM-DD-HH:MM:SS")
- Speaker mapping (STREAMER/AI_CHARACTER/VIEWER/SYSTEM_SUMMARY → streamer/ai/chat/ai)
- Optimistic UI updates for streamer messages (not echoed by BE)

---

### Feature 4: Broadcasting (`src/features/broadcast/`)

**Purpose**: Stream lifecycle, WebSocket communication, TTS playback

**API Files**:
- `api/broadcastApi.ts` - startBroadcast(), terminateBroadcast()
- `api/streamApi.ts` - getStreamInfo(), getStreamDialogues()

**Hooks**:
- `useStartBroadcast.ts` - Start broadcast with auto-recovery (handles leftover cleanup)
- `useTerminateBroadcast.ts` - Stop broadcast
- `useStreamInfo.ts` - Fetch current stream metadata
- `useStreamWS.ts` - WebSocket client (VOICE_CHUNK, VOICE_TURN_COMPLETE, VOICE_EMOTION)
- `useTTSPlayer.ts` - Audio playback queue
- `useViewerChatPolling.ts` - Poll viewer chats
- `useObsLaunch.ts` - Launch OBS + overlay setup

**Components**:
- `ObsGateModal.tsx` - OBS readiness check before broadcast start

**Data Flow** (Broadcast Start):
```
CharacterPage.handleBroadcastStart()
  ↓ BroadcastConfirmModal (user consent)
  ↓ ObsGateModal (OBS setup check)
  ↓ useObsLaunch() → Electron IPC obsManager.ts
  ↓ On obsStatus === 'setup_ok'
  ↓ performStart(characterId)
    ├─ useSelectCharacter() → PATCH /api/v1/characters/{id}/select
    └─ useStartBroadcast() → POST /api/v1/stream/start
      ↓ Response: { broadcastStreamId, broadcastStartedAt }
      ↓ aiModeStore.setBroadcast()
      ↓ overlayStore.updateRuntime()
      ↓ Navigate to /dashboard
```

**Data Flow** (WebSocket):
```
DashboardPage.useStreamWS()
  ↓ Connect: ws://localhost:8080/api/v1/stream/ws?broadcastStreamId=...&accessToken=...
  ↓ Receive binary (PCM audio) + text (JSON metadata)
  ↓ Parse: VOICE_CHUNK { audio, voiceText, emotion }
  ↓ handleVoiceChunk()
    ├─ useTTSPlayer.enqueue(audio)
    ├─ setCurrentTranscript(voiceText)
    ├─ setEmotion(emotion)
    └─ updateOverlayRuntime()
  ↓ Parse: VOICE_TURN_COMPLETE { voiceText, emotion, cursorId }
  ↓ handleVoiceTurnComplete()
    ├─ upsertDialogues([{ speaker: 'ai', text: voiceText, emotion, cursorId }])
    └─ updateOverlayRuntime()
```

**Store**: `useBroadcastNoticeStore` (src/shared/stores/broadcastNoticeStore.ts)
- Tracks: shouldSkipBroadcastNotice per character
- Actions: skipNoticeForCharacter()

**Types**: 
- `src/shared/types/broadcast.ts` - BroadcastStartResDto, BroadcastTerminateResDto, BroadcastCharacterInfoResDto
- `src/shared/types/broadcastWs.ts` - StreamWsVoiceEvent, VoiceChunk, VoiceTurnComplete
- `src/shared/types/stream.ts` - StreamDialogue, StreamEmotion, DialogueSpeaker

**Key Pattern**:
- Auto-recovery on 400 (leftover broadcast): terminate → retry start
- Binary + JSON pairing for WebSocket frames
- Optimistic UI updates for streamer messages
- Overlay bridge sync on every state change

---

### Feature 5: Speech-to-Text (`src/features/stt/`)

**Purpose**: Capture streamer voice input via Faster Whisper daemon

**Hooks**:
- `useSTT.ts` - Microphone capture + transcription

**Data Flow**:
```
DashboardPage.useSTT()
  ↓ Ctrl+M (push-to-talk) keydown
  ↓ startListening()
    ├─ Electron IPC → stt_server.py (Faster Whisper daemon)
    └─ Capture audio stream
  ↓ On Ctrl+M keyup
  ↓ stopListening()
    ├─ Send audio to Whisper
    └─ Receive transcription
  ↓ onFinalTranscript(text)
    ├─ sendStreamerMessage(text)
    └─ useStreamWS.sendChat(text)
      ↓ WebSocket → Backend LLM
```

**Backend Integration**: `electron/stt_server.py`
- Faster Whisper model (GPU-accelerated)
- Spawned by Electron main process
- Communicates via WebSocket or IPC

**Types**: `src/shared/types/stream.ts` (StreamEmotion)

---

## Pages & Routing

### Page 1: Login (`src/pages/auth/LoginPage.tsx`)

**Purpose**: User authentication

**Components**:
- AuthCard (email/password form)
- GoogleButton (OAuth)

**Hooks**: useLogin()

**Flow**: Email/password → loginEmail() → setAuth() → /dashboard

---

### Page 2: Signup (`src/pages/auth/SignupPage.tsx`)

**Purpose**: User registration

**Hooks**: useSignup()

**Flow**: Email/password/name → signupEmail() → setAuth() → /dashboard

---

### Page 3: Dashboard (`src/pages/DashboardPage.tsx`)

**Purpose**: Main broadcast monitoring

**State**:
- mode (broadcasting/idle/gaming)
- dialogues (conversation history)
- stats (viewers, chat speed, emotions)
- toggles (STT, TTS, chat, proactive, AI)

**Key Features**:
- Real-time dialogue stream
- Character portrait with emotion
- KPI cards (viewers, chat speed, emotion ratio, AI status)
- Activity log
- Push-to-talk (Ctrl+M)
- Broadcast controls

**Stores**: aiModeStore, characterStore, overlayStore

---

### Page 4: Character (`src/pages/CharacterPage.tsx`)

**Purpose**: Character CRUD + broadcast lifecycle

**Views**:
- Dashboard (list + select)
- Create (form)
- Edit (form)

**Modals**:
- BroadcastConfirmModal (consent)
- ObsGateModal (OBS setup)

**Key Features**:
- Character list with broadcast status
- Create/edit form with persona presets
- Broadcast start/stop
- OBS overlay auto-setup
- Max 10 characters per user

**Stores**: characterStore, aiModeStore, broadcastNoticeStore, overlayStore

---

### Page 5: Chat Analysis (`src/pages/ChatAnalysisPage.tsx`)

**Status**: Stub (5주차 구현 예정)

**Purpose**: Analyze viewer chat patterns

---

### Page 6: Proactive (`src/pages/ProactivePage.tsx`)

**Status**: Stub (6주차 구현 예정)

**Purpose**: Configure proactive AI reactions

---

### Page 7: Game (`src/pages/GamePage.tsx`)

**Purpose**: LoL game integration + event-based reactions

**Features**:
- Auto-detect LoL game launch
- Real-time game stats (KDA, gold, CS, level)
- Event triggers (kill, death, assist, multi-kill, objective, victory, defeat)
- AI reaction speed (fast/normal/slow)

**Stores**: gameStore

**Types**: `src/shared/types/game.ts`
- GameEventTriggerSettings, AIReactionSpeed, LolAllGameData

---

### Page 8: Safety (`src/pages/SafetyPage.tsx`)

**Purpose**: Manage harmful word filter

**Features**:
- Add/remove harmful words
- Bulk delete with confirmation
- Real-time validation

**Stores**: safetyStore

**Types**: `src/shared/types/overlay.ts` (if needed)

---

### Page 9: Settings (`src/pages/SettingsPage.tsx`)

**Purpose**: App-wide settings

**Features**:
- Theme selection (dark, light, spring)
- Theme preview swatches

**Stores**: themeStore

---

### Page 10: Stats (`src/pages/StatsPage.tsx`)

**Status**: Stub (8주차 구현 예정)

**Purpose**: Broadcast statistics & analytics

---

### Page 11: Overlay (`src/pages/OverlayPage.tsx`)

**Purpose**: OBS Browser Source for AI character display

**Modes**:
- Canvas (broadcast mode): Display character + transcript
- Settings (settings mode): Configure overlay

**Features**:
- Character image with emotion-based glow
- Transcript bubble (auto-fade after 3s)
- Position presets (4 corners)
- Scale adjustment (0.5x - 1.5x)
- Show/hide bubble toggle

**Stores**: overlayStore

**Bridge**: overlayBridge (cross-window state sync)

**Types**: `src/shared/types/overlay.ts`
- OverlaySettings, OverlayRuntimeState, OverlayPosition

---

## Shared Infrastructure

### Stores (Zustand)

**1. authStore** (`src/shared/stores/authStore.ts`)
- **Persists**: user, accessToken, refreshToken
- **Actions**: setAuth(), setTokens(), clearAuth()
- **Used by**: All authenticated features

**2. characterStore** (`src/shared/stores/characterStore.ts`)
- **Persists**: characters[], selectedCharacterId, selectedCharacter, characterDetailsMap
- **Normalization**: Image URL → Default.png
- **Actions**: setCharacters(), setSelectedCharacterId(), addCharacter(), updateCharacter(), removeCharacter()
- **Used by**: CharacterPage, DashboardPage

**3. aiModeStore** (`src/shared/stores/aiModeStore.ts`)
- **Persists**: mode, toggles, sensitivity
- **Runtime**: broadcastStreamId, broadcastStartedAt, dialogues, stats, activityLogs, currentTranscript, currentEmotion
- **Actions**: setBroadcast(), clearBroadcast(), setToggle(), upsertDialogues(), setEmotion()
- **Used by**: DashboardPage, CharacterPage

**4. overlayStore** (`src/shared/stores/overlayStore.ts`)
- **Persists**: settings (enabled, position, scale, showBubble)
- **Runtime**: runtime (isBroadcasting, characterName, transcript, emotion, etc.)
- **Sync**: overlayBridge (cross-window state)
- **Actions**: setEnabled(), setPosition(), setScale(), setShowBubble(), updateRuntime(), clearRuntime()
- **Used by**: OverlayPage, DashboardPage, CharacterPage

**5. broadcastNoticeStore** (`src/shared/stores/broadcastNoticeStore.ts`)
- **Persists**: skipNoticeMap (character ID → skip flag)
- **Actions**: shouldSkipNotice(), skipNoticeForCharacter()
- **Used by**: CharacterPage

**6. characterSettingsStore** (`src/shared/stores/characterSettingsStore.ts`)
- **Persists**: voice presets, image presets
- **Used by**: CharacterForm

**7. gameStore** (`src/shared/stores/gameStore.ts`)
- **Persists**: triggerSettings, reactionSpeed
- **Runtime**: isGameRunning, gameState
- **Actions**: setTrigger(), setReactionSpeed(), setIsGameRunning(), setGameState()
- **Used by**: GamePage

**8. safetyStore** (`src/shared/stores/safetyStore.ts`)
- **Persists**: words[] (harmful words)
- **Actions**: addWord(), removeWord(), clearWords()
- **Used by**: SafetyPage

**9. themeStore** (`src/shared/stores/themeStore.ts`)
- **Persists**: theme (dark, light, spring)
- **Actions**: setTheme(), applyTheme()
- **Used by**: SettingsPage, main.tsx

### Types

**Core Types** (`src/shared/types/`):

- **api.ts**: ApiResponse<T> (generic wrapper)
- **auth.ts**: User, AuthResponse, LoginRequest, TokenResponse, RefreshRequest
- **broadcast.ts**: BroadcastStartResDto, BroadcastTerminateResDto, BroadcastCharacterInfoResDto, DialogueSubject
- **broadcastWs.ts**: StreamWsClientMessage, StreamWsVoiceEvent, VoiceChunk, VoiceTurnComplete, StreamWsErrorCode
- **character.ts**: CharacterListItemResDto, CharacterDetailResDto, CharacterCreateReqDto, CharacterUpdateReqDto, CharacterSettingsResDto, Persona, SpeechStyle, Personality, Gender
- **chat.ts**: ChatMessage (if used)
- **game.ts**: GameEventTriggerSettings, AIReactionSpeed, LolAllGameData, LolActivePlayer
- **overlay.ts**: OverlaySettings, OverlayRuntimeState, OverlayPosition, OverlayBridgeState
- **stream.ts**: StreamDialogue, StreamEmotion, DialogueSpeaker, StreamInfo

### Hooks

**Custom Hooks** (`src/shared/hooks/`):

- **useWebSocket.ts**: Generic WebSocket client (if used)

**Feature Hooks** (in feature folders):

- **auth**: useLogin(), useSignup(), useLogout()
- **character**: useCharacters(), useCharacter(), useCreateCharacter(), useUpdateCharacter(), useDeleteCharacter(), useSelectCharacter(), useCharacterSettings()
- **broadcast**: useStartBroadcast(), useTerminateBroadcast(), useStreamInfo(), useStreamWS(), useTTSPlayer(), useViewerChatPolling(), useObsLaunch()
- **stt**: useSTT()

### Utilities

**lib/** (`src/shared/lib/`):

- **axios.ts**: API client setup (JWT interceptors, 401 queue pattern)
- **utils.ts**: Helper functions (resolveAssetUrl, etc.)
- **overlayBridge.ts**: Cross-window state sync (localStorage + postMessage)
- **characterEmotionImages.ts**: Emotion image URL mapping + normalization
- **triggerWords.ts** (in features/character/lib/): Trigger word validation

### Constants

**constants/** (`src/shared/constants/`):

- **character.ts**: MAX_CHARACTERS_PER_USER, character presets

---

## Data Flow Patterns

### Pattern 1: API → Store → UI

```
Component
  ↓ useHook() [e.g., useCharacters()]
  ↓ apiClient.get() [e.g., GET /api/v1/characters]
  ↓ Response: DTO[]
  ↓ Store.setData() [e.g., useCharacterStore.setCharacters()]
  ↓ Component re-renders (selector subscription)
  ↓ UI displays data
```

**Example**: CharacterPage → useCharacters() → GET /api/v1/characters → useCharacterStore.setCharacters() → CharacterDashboard renders

### Pattern 2: User Action → API → Store → Broadcast

```
User clicks "Start Broadcast"
  ↓ handleBroadcastStart()
  ↓ BroadcastConfirmModal (consent)
  ↓ ObsGateModal (OBS setup)
  ↓ useSelectCharacter() → PATCH /api/v1/characters/{id}/select
  ↓ useStartBroadcast() → POST /api/v1/stream/start
  ↓ Response: { broadcastStreamId, broadcastStartedAt }
  ↓ aiModeStore.setBroadcast()
  ↓ overlayStore.updateRuntime()
  ↓ Navigate to /dashboard
  ↓ useStreamWS() connects
  ↓ Real-time updates via WebSocket
```

### Pattern 3: WebSocket → Store → UI + Overlay

```
Backend sends VOICE_CHUNK
  ↓ useStreamWS receives binary + JSON
  ↓ handleVoiceChunk()
    ├─ useTTSPlayer.enqueue(audio) [play audio]
    ├─ setCurrentTranscript(text) [update store]
    ├─ setEmotion(emotion) [update store]
    └─ updateOverlayRuntime() [sync to overlay]
  ↓ aiModeStore.dialogues updated
  ↓ DashboardPage re-renders ConversationStream
  ↓ OverlayPage receives state via overlayBridge
  ↓ Overlay displays character + transcript
```

### Pattern 4: Optimistic UI Update

```
User sends streamer message
  ↓ sendStreamerMessage(text)
  ↓ sendChat(text) [send to WebSocket]
  ↓ Immediately: upsertDialogues([{ speaker: 'streamer', text, ... }])
  ↓ ConversationStream displays message instantly
  ↓ Backend processes (may not echo back)
  ↓ UI remains consistent
```

### Pattern 5: Cross-Window State Sync (Overlay)

```
DashboardPage.updateOverlayRuntime()
  ↓ overlayStore.updateRuntime()
  ↓ writeOverlayBridgeState() [localStorage + postMessage]
  ↓ OverlayPage.subscribeOverlayBridgeState()
  ↓ Receives state update
  ↓ Re-renders with new character/transcript/emotion
```

---

## Key Implementation Patterns

### 1. Zustand Store Pattern

```typescript
// Define interface
interface MyStore {
  data: T;
  setData: (data: T) => void;
}

// Create store with persist
export const useMyStore = create<MyStore>()(
  persist(
    (set) => ({
      data: initialValue,
      setData: (data) => set({ data }),
    }),
    {
      name: 'my-storage',
      partialize: (state) => ({ data: state.data }), // Only persist data
    }
  )
);

// Use in component
const data = useMyStore((s) => s.data);
const setData = useMyStore((s) => s.setData);
```

### 2. Custom Hook Pattern

```typescript
interface UseMyHookReturn {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMyHook(): UseMyHookReturn {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<T>('/api/endpoint');
      setData(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
```

### 3. Error Handling Pattern

```typescript
try {
  await someAsyncOperation();
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  setError(message);
  if (import.meta.env.DEV) {
    console.error('[context]', { error: err });
  }
}
```

### 4. Selector Pattern (Zustand)

```typescript
// ✅ Good: Only subscribe to needed fields
const user = useAuthStore((s) => s.user);
const accessToken = useAuthStore((s) => s.accessToken);

// ❌ Avoid: Subscribing to entire store
const auth = useAuthStore(); // Re-renders on any change
```

### 5. Normalization Pattern (Character Images)

```typescript
// Normalize on every set/hydrate to ensure consistency
function normalizeListItem(item: CharacterListItemResDto): CharacterListItemResDto {
  if (!item.characterImageUrl) return item;
  const normalized = normalizeCharacterImageUrlToDefault(item.characterImageUrl);
  return normalized === item.characterImageUrl ? item : { ...item, characterImageUrl: normalized };
}

// Apply in store
setCharacters: (characters) =>
  set({ characters: characters.map(normalizeListItem) }),

// Apply on hydrate
onRehydrateStorage: () => (state) => {
  if (!state) return;
  state.characters = state.characters.map(normalizeListItem);
},
```

### 6. WebSocket Auto-Reconnect Pattern

```typescript
const shouldReconnectRef = useRef(true);
const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

const handleClose = useCallback((event: CloseEvent) => {
  if (event.code === 1000 || event.code === 1008) {
    shouldReconnectRef.current = false; // Don't reconnect on normal close
  }
  if (shouldReconnectRef.current && !isIntentionalClose) {
    reconnectTimerRef.current = setTimeout(() => {
      connect(); // Retry after 3s
    }, RECONNECT_DELAY_MS);
  }
}, []);
```

### 7. Overlay Bridge Pattern (Cross-Window Sync)

```typescript
// Main app updates overlay state
overlayStore.updateRuntime({ transcript: 'Hello' });

// Bridge writes to localStorage + postMessage
writeOverlayBridgeState({ settings, runtime });

// Overlay page subscribes
subscribeOverlayBridgeState((state) => {
  setBridgeState(state);
});
```

### 8. Timestamp Parsing Pattern

```typescript
// BE format: "YYYY-MM-DD-HH:MM:SS"
function parseDialogueTimestamp(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})-(\d{2}):(\d{2}):(\d{2})$/.exec(s);
  if (m) {
    const [, y, mo, d, h, mi, se] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se));
  }
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
}
```

### 9. Auto-Recovery Pattern (Broadcast)

```typescript
// On 400 (leftover broadcast):
try {
  await startBroadcast(characterId);
} catch (err) {
  if (statusOf(err) === 400) {
    try {
      await tryTerminateLeftover(); // Clean up
      const retryRes = await startBroadcast(characterId); // Retry
      return retryRes;
    } catch (retryErr) {
      setError(deriveMessage(retryErr) + ' (auto-recovery failed)');
      return null;
    }
  }
}
```

### 10. Form Validation Pattern (react-hook-form + Zod)

```typescript
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 chars'),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});

const onSubmit = async (data: FormData) => {
  try {
    await loginEmail(data);
  } catch (err) {
    // Handle error
  }
};
```

---

## File Reference Index

### Pages (11 files)
- `src/pages/auth/LoginPage.tsx` - Login form
- `src/pages/auth/SignupPage.tsx` - Signup form
- `src/pages/DashboardPage.tsx` - Main broadcast dashboard (711 lines)
- `src/pages/CharacterPage.tsx` - Character management (676 lines)
- `src/pages/ChatAnalysisPage.tsx` - Chat analysis (stub)
- `src/pages/ProactivePage.tsx` - Proactive reactions (stub)
- `src/pages/GamePage.tsx` - Game integration (284 lines)
- `src/pages/SafetyPage.tsx` - Safety filter (189 lines)
- `src/pages/SettingsPage.tsx` - App settings (91 lines)
- `src/pages/StatsPage.tsx` - Stats (stub)
- `src/pages/OverlayPage.tsx` - OBS overlay (442 lines)

### Features (52 files total)

**Auth** (7 files):
- `src/features/auth/api/authApi.ts`
- `src/features/auth/hooks/useLogin.ts`
- `src/features/auth/hooks/useLogout.ts`
- `src/features/auth/hooks/useSignup.ts`
- `src/features/auth/components/AuthCard.tsx`
- `src/features/auth/components/GoogleButton.tsx`
- `src/features/auth/schemas/authSchemas.ts`

**Character** (15 files):
- `src/features/character/api/characterApi.ts`
- `src/features/character/hooks/useCharacter.ts`
- `src/features/character/hooks/useCharacters.ts`
- `src/features/character/hooks/useCreateCharacter.ts`
- `src/features/character/hooks/useUpdateCharacter.ts`
- `src/features/character/hooks/useDeleteCharacter.ts`
- `src/features/character/hooks/useSelectCharacter.ts`
- `src/features/character/hooks/useCharacterSettings.ts`
- `src/features/character/components/CharacterDashboard.tsx`
- `src/features/character/components/CharacterForm.tsx`
- `src/features/character/components/CharacterSettings.tsx`
- `src/features/character/components/BasicInfoSection.tsx`
- `src/features/character/components/PersonaPresetSection.tsx`
- `src/features/character/components/VoicePersonalitySection.tsx`
- `src/features/character/components/PNGTuberSelector.tsx`
- `src/features/character/components/BroadcastConfirmModal.tsx`
- `src/features/character/components/CharacterEmptyState.tsx`
- `src/features/character/lib/triggerWords.ts`

**Dashboard** (9 files):
- `src/features/dashboard/components/BroadcastHeader.tsx`
- `src/features/dashboard/components/BroadcastControls.tsx`
- `src/features/dashboard/components/CharacterPortrait.tsx`
- `src/features/dashboard/components/ConversationStream.tsx`
- `src/features/dashboard/components/KpiCard.tsx`
- `src/features/dashboard/components/ActivityLogPanel.tsx`
- `src/features/dashboard/components/ResetConfirmModal.tsx`
- `src/features/dashboard/components/DashboardEmptyState.tsx`
- `src/features/dashboard/types.ts`

**Broadcast** (12 files):
- `src/features/broadcast/api/broadcastApi.ts`
- `src/features/broadcast/api/streamApi.ts`
- `src/features/broadcast/hooks/useStartBroadcast.ts`
- `src/features/broadcast/hooks/useTerminateBroadcast.ts`
- `src/features/broadcast/hooks/useStreamInfo.ts`
- `src/features/broadcast/hooks/useStreamWS.ts`
- `src/features/broadcast/hooks/useTTSPlayer.ts`
- `src/features/broadcast/hooks/useViewerChatPolling.ts`
- `src/features/broadcast/hooks/useObsLaunch.ts`
- `src/features/broadcast/components/ObsGateModal.tsx`

**STT** (1 file):
- `src/features/stt/hooks/useSTT.ts`

### Shared Infrastructure (30+ files)

**Stores** (9 files):
- `src/shared/stores/authStore.ts`
- `src/shared/stores/characterStore.ts`
- `src/shared/stores/aiModeStore.ts`
- `src/shared/stores/overlayStore.ts`
- `src/shared/stores/broadcastNoticeStore.ts`
- `src/shared/stores/characterSettingsStore.ts`
- `src/shared/stores/gameStore.ts`
- `src/shared/stores/safetyStore.ts`
- `src/shared/stores/themeStore.ts`

**Types** (9 files):
- `src/shared/types/api.ts`
- `src/shared/types/auth.ts`
- `src/shared/types/broadcast.ts`
- `src/shared/types/broadcastWs.ts`
- `src/shared/types/character.ts`
- `src/shared/types/chat.ts`
- `src/shared/types/game.ts`
- `src/shared/types/overlay.ts`
- `src/shared/types/stream.ts`

**Lib** (4 files):
- `src/shared/lib/axios.ts` (210 lines)
- `src/shared/lib/utils.ts`
- `src/shared/lib/overlayBridge.ts`
- `src/shared/lib/characterEmotionImages.ts`

**Hooks** (1 file):
- `src/shared/hooks/useWebSocket.ts`

**Constants** (1 file):
- `src/shared/constants/character.ts`

### Layouts (3 files):
- `src/components/layouts/DashboardLayout.tsx`
- `src/components/layouts/DashboardHeader.tsx`
- `src/components/layouts/DashboardSidebar.tsx`

### Root (3 files):
- `src/App.tsx` (57 lines)
- `src/main.tsx` (22 lines)
- `src/vite-env.d.ts`

---

## Summary Statistics

- **Total Pages**: 11 (3 auth/dashboard, 8 feature pages)
- **Total Features**: 5 major (auth, character, dashboard, broadcast, stt)
- **Total Components**: 40+ (dashboard, character, broadcast, auth)
- **Total Hooks**: 25+ (custom hooks across features)
- **Total Stores**: 9 (Zustand)
- **Total Types**: 9 type definition files
- **Total Lines of Code**: ~3,500+ (excluding node_modules)

---

## Development Workflow

### Adding a New Feature

1. **Create feature directory**: `src/features/{name}/`
2. **Define types**: `src/shared/types/{name}.ts`
3. **Create API layer**: `src/features/{name}/api/{name}Api.ts`
4. **Create hooks**: `src/features/{name}/hooks/useXxx.ts`
5. **Create components**: `src/features/{name}/components/Xxx.tsx`
6. **Create store** (if needed): `src/shared/stores/{name}Store.ts`
7. **Add route** (if needed): Update `src/App.tsx`
8. **Add JSDoc comments**: File header + function docs

### Adding a New Page

1. **Create page file**: `src/pages/XxxPage.tsx`
2. **Add route**: Update `src/App.tsx`
3. **Use existing features**: Import hooks/components
4. **Connect to stores**: Use selectors for state
5. **Handle errors**: Try-catch + error display

### Debugging

- **Dev mode**: `npm run dev` (Vite + React hot reload)
- **Electron dev**: `npm run electron:dev` (Vite + Electron)
- **Console logs**: Check browser DevTools + Electron DevTools
- **Store state**: Use Redux DevTools (if integrated) or console.log

---

## Notes

- **HashRouter**: Required for Electron file:// protocol
- **Persist middleware**: Auto-saves to localStorage
- **JWT refresh**: Automatic via 401 interceptor (queue pattern)
- **Image normalization**: Handles BE inconsistencies
- **Overlay bridge**: Cross-window state sync via localStorage + postMessage
- **Auto-recovery**: Broadcast leftover cleanup on 400 error
- **Optimistic UI**: Streamer messages displayed immediately
- **WebSocket**: Auto-reconnect on network errors (except 1000/1008)

---

**End of Technical Map**
