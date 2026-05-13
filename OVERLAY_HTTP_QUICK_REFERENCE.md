# Overlay HTTP Serving - Quick Reference

## 1. Built Frontend Files Location

**After `npm run build`**:
```
swproject/dist/                    # React app (Vite output)
├── index.html                     # Entry point (relative paths)
├── assets/
│   ├── index-DcyhwIt0.js         # Main bundle
│   └── index-DjXAySuc.css        # Styles
└── characters/, *.svg, logo.png  # Public assets
```

**In Packaged App**:
```
SWproject.app/Contents/Resources/app/dist/  (macOS)
Program Files\SWproject\resources\app\dist\  (Windows)
```

**Path Resolution** (safe in both dev & packaged):
```typescript
const distPath = path.join(__dirname, '../dist');
// __dirname = dist-electron/ (where main.js is)
// Result: dist/ ✅
```

---

## 2. Electron App Loading (Dev vs Prod)

| Mode | Condition | URL | Code |
|------|-----------|-----|------|
| **Dev** | `NODE_ENV === 'development'` | `http://localhost:5173` | `mainWindow.loadURL('http://localhost:5173')` |
| **Prod** | `NODE_ENV === 'production'` | `file:///path/to/dist/index.html` | `mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))` |

**Problem**: In production, `file://` URLs don't work well with OBS Browser Source

---

## 3. Overlay Route/Hash Structure

**Router** (src/main.tsx):
```typescript
<HashRouter>
  <Routes>
    <Route path="/overlay" element={<OverlayPage />} />
  </Routes>
</HashRouter>
```

**URLs**:
- Dev: `http://localhost:5173/#/overlay` ✅
- Prod (file://): `file:///path/to/dist/index.html#/overlay` ⚠️ (OBS issue)
- Prod (HTTP): `http://127.0.0.1:5174/overlay#/overlay` ✅ (RECOMMENDED)

---

## 4. Existing Helper Code

### Overlay State Server (main.ts:174-204)
- ✅ Already runs on port 5174
- ✅ CORS headers present (line 165-167)
- ✅ Error handling in place
- ✅ Called at app startup (line 512)

### Helper Functions
```typescript
// sendOverlayJson (line 162-172) - can be extended for HTML
// startOverlayStateServer (line 174-204) - can add new routes
```

### Safe Path Patterns
```typescript
// Resolve dist folder
const distPath = path.join(__dirname, '../dist');

// Check file exists
if (existsSync(filePath)) {
  fs.createReadStream(filePath).pipe(res);
}
```

---

## 5. File Path Gotchas

| Gotcha | Issue | Solution |
|--------|-------|----------|
| `__dirname` in packaged app | Points to `app/dist-electron/` | Use relative path `../dist/` ✅ |
| Asset paths in HTML | Vite uses `base: './'` | Works with both `file://` and HTTP ✅ |
| Public assets | Copied to `dist/` by Vite | Serve from HTTP server |
| Symlinks | May not preserve in packaged app | Use `existsSync()` + `readFileSync()` |
| Case sensitivity | Linux is case-sensitive | Use exact case in paths |

---

## 6. Recommended Solution: Extend Overlay State Server

**Current**: Serves `/overlay-state` (JSON) and `/health`

**Add**:
- `GET /overlay` → Serve `dist/index.html`
- `GET /assets/*` → Serve `dist/assets/*`
- `GET /*` → Serve static files

**Result**:
- ✅ No new dependencies
- ✅ Reuses existing HTTP server
- ✅ Works in dev and production
- ✅ CORS headers already present
- ✅ OBS Browser Source friendly

**Overlay URL for OBS**:
```typescript
// Dev
const overlayUrl = "http://localhost:5173/#/overlay";

// Production (NEW)
const overlayUrl = "http://127.0.0.1:5174/overlay#/overlay";
```

---

## 7. Implementation Checklist

- [ ] Extend `startOverlayStateServer()` to serve static files
- [ ] Add `/overlay` route to serve `index.html`
- [ ] Add `/assets/*` routes to serve JS/CSS
- [ ] Add `getContentType()` helper for MIME types
- [ ] Update overlay URL generation in CharacterPage
- [ ] Test in dev mode: `http://localhost:5173/#/overlay`
- [ ] Test in production: `http://127.0.0.1:5174/overlay#/overlay`
- [ ] Verify OBS Browser Source loads correctly
- [ ] Verify assets load (JS, CSS, images)
- [ ] Verify CORS headers present
- [ ] Test in packaged app (macOS/Windows)

