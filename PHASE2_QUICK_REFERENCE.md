# Phase 2 OBS Automation - Quick Reference

## Current State After Phase 1

### ✅ Already Implemented
- OBS detection (detectObs) - `electron/main.ts:204-224`
- OBS launch (launchObs) - `electron/main.ts:226-242`
- useObsLaunch hook - `src/features/broadcast/hooks/useObsLaunch.ts`
- IPC bridge for obs.detect/obs.launch - `electron/preload.ts:51-54`
- Overlay state server (HTTP) - `electron/main.ts:162-200` (port 5174)
- Overlay URL generation - `src/pages/CharacterPage.tsx:271-274`

### ❌ Missing for Phase 2
- OBS WebSocket connection (obs-websocket-js library)
- Browser source auto-creation
- Scene detection/selection
- OBS setup modal UI

---

## File Structure for Phase 2

### New Files to Create
```
electron/
  └─ obs-websocket-client.ts          (OBS WebSocket connection manager)

src/features/broadcast/
  ├─ hooks/
  │  └─ useObsWebSocket.ts            (React hook for OBS connection)
  └─ components/
     └─ ObsSetupModal.tsx             (UI for OBS setup)

src/shared/stores/
  └─ obsStore.ts                      (Optional: persist OBS settings)
```

### Files to Modify
```
electron/
  ├─ main.ts                          (Add OBS WebSocket IPC handlers)
  ├─ preload.ts                       (Extend obs namespace)
  └─ preload.d.ts                     (Update type definitions)

src/features/broadcast/
  └─ hooks/index.ts                   (Export new hooks)

src/pages/
  └─ CharacterPage.tsx                (Integrate OBS setup modal)

swproject/
  └─ package.json                     (Add obs-websocket-js)
```

---

## Key Integration Points

### 1. Broadcast Start Flow
```
CharacterPage.performStart()
  ├─ useStartBroadcast() → POST /api/v1/stream/start
  ├─ updateOverlayRuntime() → overlayStore
  └─ [NEW] useObsWebSocket.createBrowserSource()
      └─ window.electronAPI.obs.createBrowserSource()
          └─ electron/main.ts IPC handler
              └─ ObsWebSocketClient.createBrowserSource()
```

### 2. OBS Detection Flow
```
CharacterPage (useObsLaunch)
  ├─ window.electronAPI.obs.detect()
  ├─ window.electronAPI.obs.launch()
  └─ [NEW] window.electronAPI.obs.connect()
      └─ [NEW] useObsWebSocket.connect()
```

### 3. Overlay URL Handling
```
CharacterPage.overlayUrl
  ├─ Dev: http://localhost:5173/#/overlay
  ├─ Electron: http://127.0.0.1:5173/#/overlay (NEEDS FIX)
  └─ Production: file:///path/to/app/dist/index.html#/overlay
```

---

## Critical Gotchas

### 1. Overlay URL in Electron
**Current**: `window.location.origin` returns `file://` in Electron
**Problem**: OBS Browser Source may not handle file:// URLs
**Solution**: Detect Electron context, use HTTP URL instead
```typescript
// BEFORE (broken in Electron):
const overlayUrl = `${window.location.origin}${window.location.pathname}#/overlay`;

// AFTER (fixed):
const overlayUrl = window.electronAPI 
  ? "http://127.0.0.1:5173/#/overlay"  // Electron: use HTTP
  : `${window.location.origin}${window.location.pathname}#/overlay`;  // Web
```

### 2. CORS Headers Missing
**Current**: Overlay state server (port 5174) has no CORS headers
**Problem**: OBS Browser Source may block requests
**Solution**: Add CORS headers to HTTP server in main.ts

### 3. OBS WebSocket Port
**Default**: 4444 (may not be enabled by default)
**Solution**: Provide UI to enable or auto-detect

### 4. Localhost vs Network IP
**Problem**: If OBS on different machine, localhost won't work
**Solution**: Detect network IP, use in browser source URL

---

## Dependency: obs-websocket-js

### Installation
```bash
npm install obs-websocket-js
```

### Key Classes/Methods
```typescript
import OBSWebSocket from 'obs-websocket-js';

const obs = new OBSWebSocket();

// Connect
await obs.connect('localhost', 4444, 'password');

// Get scenes
const scenes = await obs.call('GetSceneList');

// Create source
await obs.call('CreateInput', {
  sceneName: 'Scene 1',
  inputName: 'Browser Source',
  inputKind: 'browser_source',
  inputSettings: {
    url: 'http://localhost:5173/#/overlay',
    width: 1920,
    height: 1080,
  },
});

// Disconnect
await obs.disconnect();
```

---

## IPC Handler Locations

### Current (Phase 1)
- `electron/main.ts:515-516` - obs:detect, obs:launch

### New (Phase 2)
- `electron/main.ts:520+` - obs:connect, obs:disconnect, obs:create-browser-source, obs:update-browser-source, obs:get-scenes

---

## Preload API Extension

### Current (Phase 1)
```typescript
obs: {
  detect: () => ipcRenderer.invoke('obs:detect'),
  launch: (obsPath: string) => ipcRenderer.invoke('obs:launch', obsPath),
}
```

### New (Phase 2)
```typescript
obs: {
  // ... existing methods ...
  connect: (host, port, password?) => ipcRenderer.invoke('obs:connect', ...),
  disconnect: () => ipcRenderer.invoke('obs:disconnect'),
  createBrowserSource: (sceneId, sourceUrl) => ipcRenderer.invoke('obs:create-browser-source', ...),
  updateBrowserSource: (sourceId, sourceUrl) => ipcRenderer.invoke('obs:update-browser-source', ...),
  getScenes: () => ipcRenderer.invoke('obs:get-scenes'),
  onConnectionStateChanged: (callback) => { /* listener setup */ },
}
```

---

## Recommended Implementation Order

1. **Install dependency**: `npm install obs-websocket-js`
2. **Create ObsWebSocketClient**: `electron/obs-websocket-client.ts`
3. **Add IPC handlers**: `electron/main.ts` (lines 520+)
4. **Extend preload**: `electron/preload.ts` + `electron/preload.d.ts`
5. **Create React hook**: `src/features/broadcast/hooks/useObsWebSocket.ts`
6. **Create UI modal**: `src/features/broadcast/components/ObsSetupModal.tsx`
7. **Integrate into CharacterPage**: `src/pages/CharacterPage.tsx`
8. **Fix overlay URL**: Handle Electron context properly

---

## Testing Checklist

- [ ] OBS detection works
- [ ] OBS launch works
- [ ] OBS WebSocket connection works
- [ ] Scene list retrieval works
- [ ] Browser source creation works
- [ ] Browser source URL update works
- [ ] Overlay URL displays correctly in OBS
- [ ] Overlay state updates in real-time
- [ ] CORS headers present in overlay state server
- [ ] Works with localhost and network IP

