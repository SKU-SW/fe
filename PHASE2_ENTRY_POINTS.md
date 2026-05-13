# Phase 2 OBS Automation - Entry Points & Architecture Analysis

**Date**: 2025-05-11  
**Status**: Pre-implementation analysis (read-only)  
**Scope**: obs-websocket integration, browser source auto-creation, OBS detection

---

## 1. Current Relevant Files After Phase 1

### A. Overlay State Management
| File | Purpose | Key Exports |
|------|---------|-------------|
| `src/shared/stores/overlayStore.ts` | Zustand store for overlay settings + runtime | `useOverlayStore`, `updateRuntime()`, `setEnabled()` |
| `src/shared/lib/overlayBridge.ts` | Bridge between app and OBS Browser Source | `writeOverlayBridgeState()`, `readOverlayStateServer()`, polling (200ms) |
| `src/shared/types/overlay.ts` | Type definitions | `OverlayBridgeState`, `OverlaySettings`, `OverlayRuntimeState` |
| `electron/main.ts` (lines 25, 162-200) | HTTP overlay state server (port 5174) | GET `/overlay-state` endpoint |

### B. OBS Integration (Phase 1 Stubs)
| File | Purpose | Current State |
|------|---------|---------------|
| `src/features/broadcast/hooks/useObsLaunch.ts` | OBS detection + launch hook | ✅ Complete (detect + launch) |
| `electron/preload.ts` (lines 51-54) | IPC bridge for OBS | ✅ Exposed `obs.detect()`, `obs.launch()` |
| `electron/preload.d.ts` (lines 21-24) | Type definitions for OBS IPC | ✅ Typed |
| `electron/main.ts` (lines 31-40, 204-242, 515-516) | OBS detection + launch implementation | ✅ Complete (detectObs, launchObs) |

### C. Broadcast Flow Integration Points
| File | Purpose | Key Hooks/Functions |
|------|---------|-------------------|
| `src/pages/CharacterPage.tsx` (lines 271-274) | Overlay URL generation | `overlayUrl` (computed from window.location) |
| `src/pages/CharacterPage.tsx` (lines 270, 287-297) | OBS launch trigger | `useObsLaunch()`, status handling |
| `src/features/broadcast/hooks/useStartBroadcast.ts` | Broadcast start logic | `start()` function (calls backend API) |
| `src/features/character/components/CharacterDashboard.tsx` (lines 242-247) | Overlay URL display | Shows URL in UI for manual OBS setup |

### D. Broadcast API Layer
| File | Purpose | Exports |
|------|---------|---------|
| `src/features/broadcast/api/broadcastApi.ts` | Backend broadcast endpoints | `startBroadcast()`, `terminateBroadcast()` |
| `src/features/broadcast/api/streamApi.ts` | Stream info endpoints | `getStreamInfo()`, `getStreamDialoguesByCursor()` |

---

## 2. Package/Dependency State

### Current Dependencies (package.json)
```json
{
  "dependencies": {
    "react": "19.2.4",
    "react-router-dom": "7.14.1",
    "zustand": "5.0.12",
    "axios": "1.15.0",
    "zod": "4.3.6",
    "react-hook-form": "7.72.1"
  },
  "devDependencies": {
    "electron": "33.3.1",
    "typescript": "5",
    "vite": "8.0.9"
  }
}
```

### Missing for Phase 2: obs-websocket-js
**Library**: `obs-websocket-js` (npm package)
- **Latest**: v5.x (supports OBS 28+)
- **Installation**: `npm install obs-websocket-js`
- **Type Support**: Built-in TypeScript types
- **Size**: ~50KB (minimal)
- **Platform**: Node.js compatible (can run in Electron main process)

**Alternative**: `obs-websocket` (native WebSocket client)
- Lighter weight but requires manual protocol implementation
- Recommendation: Use `obs-websocket-js` for full feature support

### Dependency Placement
- **Main process only** (Electron): `obs-websocket-js` should be in `dependencies` (not devDependencies)
- **Renderer process**: Cannot use directly (no Node.js access), must use IPC bridge
- **Type definitions**: Already available in `obs-websocket-js`

---

## 3. Best File Locations for New Modules/Hooks

### A. Electron Main Process (OBS WebSocket Connection)
**Location**: `electron/obs-websocket-client.ts` (NEW)

**Purpose**: 
- Manage OBS WebSocket connection lifecycle
- Handle connection/disconnection
- Expose methods for browser source creation/update
- Emit events for connection state changes

**Structure**:
```typescript
// electron/obs-websocket-client.ts
export class ObsWebSocketClient {
  private client: OBSWebSocket;
  private connected: boolean = false;
  
  async connect(host: string, port: number, password?: string): Promise<void>
  async disconnect(): Promise<void>
  async createBrowserSource(sceneId: string, sourceUrl: string): Promise<void>
  async updateBrowserSource(sourceId: string, sourceUrl: string): Promise<void>
  async getScenes(): Promise<Scene[]>
  onConnectionStateChanged(callback: (connected: boolean) => void): void
}
```

**Integration**: 
- Instantiate in `electron/main.ts` (after app ready)
- Expose via IPC handlers (see section B)

---

### B. Electron IPC Handlers (New)
**Location**: `electron/main.ts` (add new handlers around line 515-540)

**New IPC Handlers**:
```typescript
ipcMain.handle('obs:connect', (_event, host: string, port: number, password?: string) => {
  // Connect to OBS WebSocket
})

ipcMain.handle('obs:disconnect', () => {
  // Disconnect from OBS
})

ipcMain.handle('obs:create-browser-source', (_event, sceneId: string, sourceUrl: string) => {
  // Create browser source in OBS
})

ipcMain.handle('obs:update-browser-source', (_event, sourceId: string, sourceUrl: string) => {
  // Update existing browser source URL
})

ipcMain.handle('obs:get-scenes', () => {
  // Get list of scenes from OBS
})

ipcMain.on('obs:connection-state-changed', (connected: boolean) => {
  // Broadcast connection state to renderer
})
```

**Integration Point**: Lines 513-540 (after existing obs:detect/obs:launch handlers)

---

### C. Preload API Extension
**Location**: `electron/preload.ts` (extend existing obs namespace)

**Current** (lines 51-54):
```typescript
obs: {
  detect: () => ipcRenderer.invoke('obs:detect'),
  launch: (obsPath: string) => ipcRenderer.invoke('obs:launch', obsPath),
}
```

**Add**:
```typescript
obs: {
  detect: () => ipcRenderer.invoke('obs:detect'),
  launch: (obsPath: string) => ipcRenderer.invoke('obs:launch', obsPath),
  // NEW:
  connect: (host: string, port: number, password?: string) => 
    ipcRenderer.invoke('obs:connect', host, port, password),
  disconnect: () => ipcRenderer.invoke('obs:disconnect'),
  createBrowserSource: (sceneId: string, sourceUrl: string) => 
    ipcRenderer.invoke('obs:create-browser-source', sceneId, sourceUrl),
  updateBrowserSource: (sourceId: string, sourceUrl: string) => 
    ipcRenderer.invoke('obs:update-browser-source', sourceId, sourceUrl),
  getScenes: () => ipcRenderer.invoke('obs:get-scenes'),
  onConnectionStateChanged: (callback: (connected: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, connected: boolean) => callback(connected);
    ipcRenderer.on('obs:connection-state-changed', listener);
    return () => ipcRenderer.removeListener('obs:connection-state-changed', listener);
  },
}
```

**Type Update**: `electron/preload.d.ts` (extend ElectronAPI.obs interface)

---

### D. React Hooks (Renderer Process)
**Location**: `src/features/broadcast/hooks/useObsWebSocket.ts` (NEW)

**Purpose**: 
- Manage OBS WebSocket connection from React
- Handle connection state, errors, scene list
- Provide methods to create/update browser sources

**Structure**:
```typescript
export interface UseObsWebSocketReturn {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  scenes: ObsScene[];
  connect: (host: string, port: number, password?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  createBrowserSource: (sceneId: string, sourceUrl: string) => Promise<void>;
  updateBrowserSource: (sourceId: string, sourceUrl: string) => Promise<void>;
  getScenes: () => Promise<void>;
}

export function useObsWebSocket(): UseObsWebSocketReturn {
  // Implementation
}
```

**Integration**: 
- Export from `src/features/broadcast/hooks/index.ts`
- Use in CharacterPage or new OBS setup modal

---

### E. OBS Setup Modal/Component (NEW)
**Location**: `src/features/broadcast/components/ObsSetupModal.tsx` (NEW)

**Purpose**:
- UI for connecting to OBS
- Display connection status
- Show scene list
- Allow browser source creation/update

**Props**:
```typescript
interface ObsSetupModalProps {
  isOpen: boolean;
  overlayUrl: string;
  onClose: () => void;
  onBrowserSourceCreated?: (sourceId: string) => void;
}
```

**Integration**: 
- Show in CharacterPage when broadcast starts
- Or as separate modal accessible from settings

---

### F. OBS Configuration Store (Optional)
**Location**: `src/shared/stores/obsStore.ts` (NEW)

**Purpose**:
- Persist OBS connection settings (host, port, password)
- Store last used scene/source IDs
- Track connection state across sessions

**Structure**:
```typescript
interface ObsStore {
  host: string;
  port: number;
  password: string | null;
  lastSceneId: string | null;
  lastSourceId: string | null;
  autoConnect: boolean;
  setConnection: (host: string, port: number, password?: string) => void;
  setLastScene: (sceneId: string) => void;
  setLastSource: (sourceId: string) => void;
  setAutoConnect: (enabled: boolean) => void;
}

export const useObsStore = create<ObsStore>()(
  persist((set) => ({ ... }), { name: 'obs-storage' })
);
```

---

## 4. Overlay URL Gotchas & Production Considerations

### A. Current Overlay URL Generation
**Location**: `src/pages/CharacterPage.tsx` (lines 271-274) + `src/pages/OverlayPage.tsx` (lines 138-139)

**Current Logic**:
```typescript
const overlayUrl = useMemo(() => {
  if (typeof window === "undefined") return "http://localhost:5173/#/overlay";
  return `${window.location.origin}${window.location.pathname}#/overlay`;
}, []);
```

**Issues**:
1. **Dev vs Production Mismatch**:
   - Dev: `http://localhost:5173/#/overlay` ✅
   - Electron (file://): `file:///path/to/app/index.html#/overlay` ✅
   - Production (packaged): `file:///Applications/SWproject.app/Contents/Resources/app/dist/index.html#/overlay` ✅

2. **OBS Browser Source URL Requirements**:
   - OBS can load `http://` URLs directly ✅
   - OBS can load `file://` URLs (with limitations) ⚠️
   - CORS issues: OBS Browser Source runs in Chromium context (may have CORS restrictions)
   - Localhost access: OBS may not access `localhost:5173` if running on different machine

### B. Gotchas for Browser Source Setup

#### 1. **Localhost vs Network Address**
- **Problem**: If OBS runs on different machine, `localhost:5173` won't work
- **Solution**: Use machine IP address or hostname instead
- **Implementation**: Detect network IP in Electron main process, pass to OBS setup

#### 2. **CORS & Same-Origin Policy**
- **Problem**: OBS Browser Source may block cross-origin requests
- **Solution**: Ensure overlay server (port 5174) has proper CORS headers
- **Current**: `electron/main.ts` (lines 162-200) serves overlay state without CORS headers
- **Fix Needed**: Add CORS headers to overlay state server

#### 3. **File:// Protocol Limitations**
- **Problem**: `file://` URLs have strict security restrictions
- **Solution**: Use HTTP server instead (already done with port 5174)
- **Current**: Overlay state server runs on `http://127.0.0.1:5174` ✅

#### 4. **Port Conflicts**
- **Dev**: Vite on 5173, overlay state server on 5174 ✅
- **Production**: Overlay state server still on 5174 ✅
- **Gotcha**: If user has other services on 5174, overlay state server won't start
- **Fix**: Make port configurable or use dynamic port allocation

#### 5. **OBS WebSocket Port (Default 4444)**
- **Problem**: OBS WebSocket server may not be enabled by default
- **Solution**: Provide UI to enable it or auto-detect if available
- **Current**: No detection implemented yet

### C. URL Handling for Browser Source Creation

**Recommended Flow**:
```
1. User clicks "방송 시작하기"
2. App detects OBS (useObsLaunch)
3. If OBS found:
   a. Launch OBS if not running
   b. Connect to OBS WebSocket (localhost:4444)
   c. Get list of scenes
   d. Show modal to select scene
   e. Create browser source with overlay URL
   f. Set source size to match monitor resolution
4. If OBS not found:
   a. Show overlay URL in UI
   b. User manually adds browser source to OBS
```

**URL to Pass to OBS**:
```typescript
// For dev:
const overlayUrl = "http://localhost:5173/#/overlay";

// For production (Electron):
const overlayUrl = "http://127.0.0.1:5173/#/overlay"; // If Vite still running
// OR
const overlayUrl = "http://127.0.0.1:5174/overlay-state"; // Overlay state server
// OR (better):
const overlayUrl = "file:///path/to/app/dist/index.html#/overlay"; // Packaged app
```

### D. Current Overlay State Server (Port 5174)

**Location**: `electron/main.ts` (lines 25, 162-200)

**Current Behavior**:
- Listens on `http://127.0.0.1:5174`
- Serves GET `/overlay-state` with JSON response
- No CORS headers
- No authentication

**For OBS Browser Source**:
- OBS can load `http://127.0.0.1:5174/overlay-state` as HTML source
- But it returns JSON, not HTML
- **Gotcha**: Need to serve actual HTML page, not just JSON endpoint

**Solution Options**:
1. **Serve HTML page** that fetches and displays overlay state
   - Create `electron/overlay-page.html` (static)
   - Serve at `http://127.0.0.1:5174/overlay` (not `/overlay-state`)
   - HTML page fetches `/overlay-state` endpoint and renders

2. **Use React app directly**
   - Point OBS to `http://localhost:5173/#/overlay` (dev)
   - Or packaged app URL (production)
   - Already works! ✅

### E. Recommended Overlay URL for OBS

**Best Practice**:
```typescript
// In production (Electron packaged app):
const overlayUrl = "http://127.0.0.1:5173/#/overlay"; // If dev server still running
// OR (better for production):
const overlayUrl = "http://127.0.0.1:5174/overlay"; // Dedicated overlay HTML page

// In dev:
const overlayUrl = "http://localhost:5173/#/overlay"; // Vite dev server

// Fallback (file:// protocol):
const overlayUrl = "file:///path/to/app/dist/index.html#/overlay";
```

**Current Implementation** (CharacterPage.tsx:271-274):
```typescript
const overlayUrl = useMemo(() => {
  if (typeof window === "undefined") return "http://localhost:5173/#/overlay";
  return `${window.location.origin}${window.location.pathname}#/overlay`;
}, []);
```

**Issues**:
- In Electron, `window.location.origin` is `file://` (not HTTP)
- OBS Browser Source may not handle `file://` URLs well
- **Fix Needed**: Detect Electron context and use HTTP URL instead

---

## 5. Summary: Phase 2 Implementation Roadmap

### Files to Create
1. ✅ `electron/obs-websocket-client.ts` - OBS WebSocket connection manager
2. ✅ `src/features/broadcast/hooks/useObsWebSocket.ts` - React hook for OBS connection
3. ✅ `src/features/broadcast/components/ObsSetupModal.tsx` - UI for OBS setup
4. ✅ `src/shared/stores/obsStore.ts` - Persist OBS settings (optional)

### Files to Modify
1. ✅ `electron/main.ts` - Add OBS WebSocket IPC handlers
2. ✅ `electron/preload.ts` - Extend obs namespace with new methods
3. ✅ `electron/preload.d.ts` - Update type definitions
4. ✅ `src/features/broadcast/hooks/index.ts` - Export new hooks
5. ✅ `src/pages/CharacterPage.tsx` - Integrate OBS setup modal
6. ✅ `swproject/package.json` - Add `obs-websocket-js` dependency

### Dependencies to Add
- `obs-websocket-js` (npm install)

### Key Gotchas to Handle
1. ✅ Overlay URL: Use HTTP in Electron, not file://
2. ✅ CORS: Add headers to overlay state server
3. ✅ Port conflicts: Make port configurable
4. ✅ OBS WebSocket: Detect if enabled, provide setup instructions
5. ✅ Network: Use IP address instead of localhost for remote OBS

---

**Next Steps**: 
1. Install `obs-websocket-js` dependency
2. Create `electron/obs-websocket-client.ts`
3. Add IPC handlers to `electron/main.ts`
4. Create `useObsWebSocket` hook
5. Create OBS setup modal
6. Integrate into CharacterPage broadcast flow

