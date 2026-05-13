# Serving Overlay Page Over HTTP in Packaged Electron

**Date**: 2025-05-11  
**Status**: Architecture analysis (read-only)  
**Goal**: Identify safest way to serve overlay page over HTTP in production Electron

---

## 1. Where Built Frontend Files Live in Production

### Build Output Structure

**Development**:
```
swproject/
├── src/                    # React source
├── electron/               # Electron main process source
├── dist/                   # (empty until build)
└── dist-electron/          # (empty until build)
```

**After `npm run build`**:
```
swproject/
├── dist/                   # React app (built by Vite)
│   ├── index.html          # Entry point (relative paths: base: './')
│   ├── assets/
│   │   ├── index-DcyhwIt0.js    # Main bundle
│   │   └── index-DjXAySuc.css   # Styles
│   ├── characters/         # Public assets
│   ├── file.svg, globe.svg, etc.
│   └── logo.png
└── dist-electron/          # Electron main process (compiled from electron/*.ts)
    ├── main.js             # Compiled main.ts
    ├── preload.js          # Compiled preload.ts
    └── obsManager.js       # Compiled obsManager.ts
```

### In Packaged App (macOS DMG / Windows NSIS)

**macOS**:
```
SWproject.app/
└── Contents/
    ├── MacOS/
    │   └── SWproject        # Executable
    └── Resources/
        └── app/
            ├── dist/        # React app (copied by electron-builder)
            │   ├── index.html
            │   ├── assets/
            │   └── ...
            ├── dist-electron/
            │   ├── main.js
            │   ├── preload.js
            │   └── ...
            └── package.json
```

**Windows**:
```
Program Files\SWproject\
├── SWproject.exe           # Executable
└── resources\
    └── app\
        ├── dist/           # React app
        ├── dist-electron/
        └── package.json
```

### Key Path Resolution

**In electron/main.ts (line 485)**:
```typescript
mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
```

**Path Resolution**:
- `__dirname` = `dist-electron/` (where main.js is located)
- `path.join(__dirname, '../dist/index.html')` = `dist/index.html` ✅

**In packaged app**:
- `__dirname` = `app/dist-electron/`
- `path.join(__dirname, '../dist/index.html')` = `app/dist/index.html` ✅

---

## 2. How Electron Currently Loads the App (Dev vs Prod)

### Development Mode

**Condition**: `process.env.NODE_ENV === 'development'`

**Code** (main.ts:481-483):
```typescript
if (isDev) {
  mainWindow.loadURL('http://localhost:5173');
  mainWindow.webContents.openDevTools();
}
```

**Flow**:
1. Vite dev server runs on `http://localhost:5173`
2. Electron loads dev server URL directly
3. Hot reload works ✅
4. DevTools open automatically

**URL**: `http://localhost:5173` (HashRouter: `http://localhost:5173/#/overlay`)

---

### Production Mode

**Condition**: `process.env.NODE_ENV === 'production'` (or not development)

**Code** (main.ts:484-486):
```typescript
} else {
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}
```

**Flow**:
1. Electron loads built HTML file from disk
2. HTML uses relative paths (base: './' in vite.config.ts)
3. Assets load from `./assets/` relative to index.html
4. HashRouter works: `file:///path/to/app/dist/index.html#/overlay`

**URL**: `file:///path/to/app/dist/index.html` (HashRouter: `file:///path/to/app/dist/index.html#/overlay`)

---

## 3. Route/Hash Structure for Overlay Page

### Current Implementation

**Router Setup** (src/main.tsx):
```typescript
<HashRouter>
  <Routes>
    {/* ... other routes ... */}
    <Route path="/overlay" element={<OverlayPage />} />
  </Routes>
</HashRouter>
```

**Why HashRouter?**
- Electron uses `file://` protocol (not HTTP)
- `file://` doesn't support traditional routing
- HashRouter uses `#` which works with `file://` ✅

### Overlay URL Generation

**Current** (CharacterPage.tsx:271-274):
```typescript
const overlayUrl = useMemo(() => {
  if (typeof window === "undefined") return "http://localhost:5173/#/overlay";
  return `${window.location.origin}${window.location.pathname}#/overlay`;
}, []);
```

**Dev Mode**:
- `window.location.origin` = `http://localhost:5173`
- `window.location.pathname` = `/`
- Result: `http://localhost:5173/#/overlay` ✅

**Production Mode (file://)** ⚠️:
- `window.location.origin` = `file://`
- `window.location.pathname` = `/path/to/app/dist/index.html`
- Result: `file:///path/to/app/dist/index.html#/overlay` ⚠️
- **Problem**: OBS Browser Source may not handle `file://` URLs

---

## 4. Existing Helper Code & File Path Gotchas

### Existing HTTP Server Pattern

**Overlay State Server** (main.ts:174-204):
```typescript
function startOverlayStateServer() {
  if (overlayServer) return;

  overlayServer = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      sendOverlayJson(res, 204, null);
      return;
    }

    const url = new URL(req.url ?? '/', `http://127.0.0.1:${OVERLAY_SERVER_PORT}`);
    if (req.method === 'GET' && url.pathname === '/overlay-state') {
      sendOverlayJson(res, 200, overlayState);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/health') {
      sendOverlayJson(res, 200, { ok: true });
      return;
    }

    sendOverlayJson(res, 404, { message: 'Not found' });
  });

  overlayServer.on('error', (err) => {
    console.warn('[overlay-state-server] failed:', err.message);
    overlayServer = null;
  });

  overlayServer.listen(OVERLAY_SERVER_PORT, '127.0.0.1', () => {
    console.info(`[overlay-state-server] listening on http://127.0.0.1:${OVERLAY_SERVER_PORT}`);
  });
}
```

**Key Features**:
- ✅ CORS headers already present (line 165-167)
- ✅ Error handling with fallback
- ✅ Listens on `127.0.0.1:5174` (localhost only)
- ✅ Called at app startup (main.ts:512)

### Helper Function for JSON Responses

**sendOverlayJson** (main.ts:162-172):
```typescript
function sendOverlayJson(res: http.ServerResponse, statusCode: number, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(body);
}
```

**Can be extended for HTML responses**:
```typescript
function sendFile(res: http.ServerResponse, statusCode: number, filePath: string, contentType: string) {
  res.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
    'Content-Type': contentType,
  });
  fs.createReadStream(filePath).pipe(res);
}
```

### Path Resolution Patterns

**Current Pattern** (main.ts:485):
```typescript
mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
```

**For serving files from HTTP**:
```typescript
// Resolve dist folder path
const distPath = path.join(__dirname, '../dist');

// Serve file
const filePath = path.join(distPath, 'index.html');
if (existsSync(filePath)) {
  fs.createReadStream(filePath).pipe(res);
}
```

### File Path Gotchas

#### 1. **__dirname in Packaged App**
- **Dev**: `__dirname` = `swproject/dist-electron/`
- **Packaged**: `__dirname` = `app/dist-electron/` (inside app bundle)
- **Relative path**: `../dist/` works in both ✅

#### 2. **Asset Paths in HTML**
- **Vite config**: `base: './'` (relative paths)
- **Built HTML**: `<script src="./assets/index-DcyhwIt0.js">`
- **Works with**: `file://` URLs ✅
- **Works with**: HTTP URLs ✅

#### 3. **Public Assets**
- **Source**: `swproject/public/`
- **Built**: `swproject/dist/` (copied by Vite)
- **Served**: `http://127.0.0.1:5174/logo.png` (if HTTP server configured)

#### 4. **Symlinks in Packaged App**
- **Problem**: Packaged app may not preserve symlinks
- **Solution**: Use `existsSync()` + `readFileSync()` instead of symlinks

#### 5. **Case Sensitivity**
- **macOS/Windows**: Case-insensitive file system
- **Linux**: Case-sensitive file system
- **Solution**: Use exact case in paths

---

## 5. Recommended Approach: Extend Overlay State Server

### Current State

**Port 5174** already serves:
- `GET /overlay-state` → JSON response
- `GET /health` → JSON response
- CORS headers ✅
- Error handling ✅

### Proposed Extension

**Add new routes**:
```typescript
// GET /overlay → Serve index.html
// GET /assets/* → Serve assets
// GET /* → Serve static files
```

### Implementation Pattern

**Extend startOverlayStateServer()**:
```typescript
function startOverlayStateServer() {
  if (overlayServer) return;

  const distPath = path.join(__dirname, '../dist');

  overlayServer = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      sendOverlayJson(res, 204, null);
      return;
    }

    const url = new URL(req.url ?? '/', `http://127.0.0.1:${OVERLAY_SERVER_PORT}`);
    
    // Existing endpoints
    if (req.method === 'GET' && url.pathname === '/overlay-state') {
      sendOverlayJson(res, 200, overlayState);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/health') {
      sendOverlayJson(res, 200, { ok: true });
      return;
    }

    // NEW: Serve overlay page
    if (req.method === 'GET' && url.pathname === '/overlay') {
      const indexPath = path.join(distPath, 'index.html');
      if (existsSync(indexPath)) {
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(indexPath).pipe(res);
        return;
      }
    }

    // NEW: Serve static assets
    if (req.method === 'GET' && url.pathname.startsWith('/assets/')) {
      const assetPath = path.join(distPath, url.pathname);
      if (existsSync(assetPath)) {
        const contentType = getContentType(assetPath);
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000', // 1 year for hashed assets
        });
        fs.createReadStream(assetPath).pipe(res);
        return;
      }
    }

    sendOverlayJson(res, 404, { message: 'Not found' });
  });

  overlayServer.on('error', (err) => {
    console.warn('[overlay-state-server] failed:', err.message);
    overlayServer = null;
  });

  overlayServer.listen(OVERLAY_SERVER_PORT, '127.0.0.1', () => {
    console.info(`[overlay-state-server] listening on http://127.0.0.1:${OVERLAY_SERVER_PORT}`);
  });
}

function getContentType(filePath: string): string {
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}
```

### Overlay URL for OBS

**Dev Mode**:
```typescript
const overlayUrl = "http://localhost:5173/#/overlay";
```

**Production Mode** (NEW):
```typescript
const overlayUrl = "http://127.0.0.1:5174/overlay#/overlay";
```

**Why this works**:
- ✅ HTTP URL (OBS Browser Source friendly)
- ✅ Serves built React app
- ✅ HashRouter works with HTTP
- ✅ Assets load correctly (relative paths)
- ✅ CORS headers present
- ✅ Works in packaged app

---

## 6. Alternative Approaches (Not Recommended)

### Option A: Serve from Vite Dev Server in Production ❌
- **Problem**: Vite dev server not available in production
- **Problem**: Adds build complexity
- **Not recommended**

### Option B: Use file:// URLs Directly ❌
- **Problem**: OBS Browser Source may not handle file:// URLs
- **Problem**: Security restrictions on file:// protocol
- **Not recommended**

### Option C: Separate HTTP Server Library ❌
- **Problem**: Adds dependency (express, fastify, etc.)
- **Problem**: Overkill for simple file serving
- **Not recommended**

### Option D: Extend Overlay State Server ✅
- **Advantage**: Reuses existing HTTP server
- **Advantage**: No new dependencies
- **Advantage**: Minimal code changes
- **Advantage**: Works in dev and production
- **Recommended**

---

## 7. Summary: Safest Approach

### Current State
- ✅ Overlay state server runs on port 5174
- ✅ CORS headers already present
- ✅ Error handling in place
- ✅ Called at app startup

### Proposed Changes
1. **Extend overlay state server** to serve static files
2. **Add `/overlay` route** to serve index.html
3. **Add `/assets/*` routes** to serve JS/CSS bundles
4. **Update overlay URL generation** to use HTTP in production

### File Paths (Safe)
- `__dirname` = `dist-electron/` (works in dev and packaged)
- `path.join(__dirname, '../dist')` = `dist/` (works in dev and packaged)
- `existsSync()` before serving (prevents 404 errors)
- `fs.createReadStream()` for efficient file serving

### Testing Checklist
- [ ] Dev mode: `http://localhost:5173/#/overlay` works
- [ ] Production: `http://127.0.0.1:5174/overlay#/overlay` works
- [ ] OBS Browser Source loads overlay correctly
- [ ] Assets load (JS, CSS, images)
- [ ] Overlay state updates in real-time
- [ ] CORS headers present
- [ ] Works in packaged app (macOS/Windows)

