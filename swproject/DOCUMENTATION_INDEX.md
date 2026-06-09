# SKU-SW Frontend Documentation Index

## 📚 Documentation Files

This comprehensive inspection has generated two detailed documentation files:

### 1. **TECHNICAL_MAP.md** (34 KB, 1,080 lines)
**Comprehensive technical reference for the entire frontend codebase**

**Contents**:
- Architecture Overview (directory structure, tech stack)
- Core Infrastructure (routing, API client, layout system)
- Feature Modules (5 major features with detailed data flows)
- Pages & Routing (11 pages with descriptions)
- Shared Infrastructure (9 stores, 9 type files, utilities)
- Data Flow Patterns (4 major patterns with examples)
- Key Implementation Patterns (10 patterns with code examples)
- File Reference Index (complete file listing)
- Summary Statistics

**Best for**: Understanding the overall architecture, data flows, and implementation patterns

### 2. **QUICK_REFERENCE.md** (11 KB)
**Quick lookup guide for common tasks and decisions**

**Contents**:
- Feature Overview at a Glance (5 features summarized)
- Pages at a Glance (status table)
- Stores at a Glance (quick reference table)
- Data Flow Patterns (4 patterns)
- Key Technical Decisions (10 decisions with rationale)
- Common Tasks (code snippets for adding stores, hooks, pages)
- File Locations Quick Lookup (where to modify for specific features)
- Environment Variables
- Commands
- Debugging Tips
- Common Errors & Solutions
- Architecture Principles

**Best for**: Quick lookups, common tasks, debugging, and decision rationale

---

## 🎯 Quick Navigation

### By Feature

**Authentication**
- TECHNICAL_MAP.md → Feature 1: Authentication
- QUICK_REFERENCE.md → Feature Overview → 🔐 Authentication

**Character Management**
- TECHNICAL_MAP.md → Feature 2: Character Management
- QUICK_REFERENCE.md → Feature Overview → 👤 Character Management

**Dashboard**
- TECHNICAL_MAP.md → Feature 3: Dashboard
- QUICK_REFERENCE.md → Feature Overview → 📊 Dashboard

**Broadcasting**
- TECHNICAL_MAP.md → Feature 4: Broadcasting
- QUICK_REFERENCE.md → Feature Overview → 📡 Broadcasting

**Speech-to-Text**
- TECHNICAL_MAP.md → Feature 5: Speech-to-Text
- QUICK_REFERENCE.md → Feature Overview → 🎤 Speech-to-Text

### By Page

**Login/Signup**
- TECHNICAL_MAP.md → Pages & Routing → Page 1-2
- QUICK_REFERENCE.md → Pages at a Glance

**Dashboard**
- TECHNICAL_MAP.md → Pages & Routing → Page 3
- QUICK_REFERENCE.md → Pages at a Glance

**Character**
- TECHNICAL_MAP.md → Pages & Routing → Page 4
- QUICK_REFERENCE.md → Pages at a Glance

**Game**
- TECHNICAL_MAP.md → Pages & Routing → Page 7
- QUICK_REFERENCE.md → Pages at a Glance

**Safety**
- TECHNICAL_MAP.md → Pages & Routing → Page 8
- QUICK_REFERENCE.md → Pages at a Glance

**Settings**
- TECHNICAL_MAP.md → Pages & Routing → Page 9
- QUICK_REFERENCE.md → Pages at a Glance

**Overlay**
- TECHNICAL_MAP.md → Pages & Routing → Page 11
- QUICK_REFERENCE.md → Pages at a Glance

### By Store

**authStore**
- TECHNICAL_MAP.md → Shared Infrastructure → Stores
- QUICK_REFERENCE.md → Stores at a Glance

**characterStore**
- TECHNICAL_MAP.md → Shared Infrastructure → Stores
- QUICK_REFERENCE.md → Stores at a Glance

**aiModeStore**
- TECHNICAL_MAP.md → Shared Infrastructure → Stores
- QUICK_REFERENCE.md → Stores at a Glance

**overlayStore**
- TECHNICAL_MAP.md → Shared Infrastructure → Stores
- QUICK_REFERENCE.md → Stores at a Glance

**gameStore**
- TECHNICAL_MAP.md → Shared Infrastructure → Stores
- QUICK_REFERENCE.md → Stores at a Glance

### By Task

**Add a new store**
- QUICK_REFERENCE.md → Common Tasks → Add a New Store

**Add a new hook**
- QUICK_REFERENCE.md → Common Tasks → Add a New Hook

**Add a new page**
- QUICK_REFERENCE.md → Common Tasks → Add a New Page

**Handle errors**
- QUICK_REFERENCE.md → Common Tasks → Handle Errors

**Debug issues**
- QUICK_REFERENCE.md → Debugging Tips

**Fix common errors**
- QUICK_REFERENCE.md → Common Errors & Solutions

---

## 📊 Project Statistics

| Metric | Count |
|--------|-------|
| Total Pages | 11 |
| Implemented Pages | 8 |
| Stub Pages | 3 |
| Major Features | 5 |
| Zustand Stores | 9 |
| Custom Hooks | 25+ |
| Components | 40+ |
| Type Definition Files | 9 |
| Total Lines of Code | ~3,500+ |
| Documentation Lines | 1,080+ |

---

## 🏗️ Architecture at a Glance

```
SKU-SW Frontend (React 19 + Electron + Zustand)
│
├── Pages (11)
│   ├── Auth (2): Login, Signup
│   ├── Dashboard (1): Main broadcast monitoring
│   ├── Character (1): CRUD + broadcast control
│   ├── Feature Pages (5): Game, Safety, Settings, Chat Analysis, Proactive, Stats
│   └── Overlay (1): OBS Browser Source
│
├── Features (5)
│   ├── auth/ (7 files): Login, signup, JWT management
│   ├── character/ (15 files): CRUD, personas, voices, models
│   ├── dashboard/ (9 files): UI components for monitoring
│   ├── broadcast/ (12 files): Stream lifecycle, WebSocket, TTS
│   └── stt/ (1 file): Speech-to-text integration
│
├── Shared Infrastructure
│   ├── Stores (9): Zustand state management
│   ├── Types (9): TypeScript definitions
│   ├── Hooks (1): Custom hooks
│   ├── Lib (4): Utilities (axios, overlay bridge, etc.)
│   └── Constants (1): App constants
│
└── Core
    ├── App.tsx: React Router setup
    ├── main.tsx: Vite entry point
    └── DashboardLayout: Main layout with sidebar
```

---

## 🔄 Data Flow Overview

### Simple Flow: API → Store → UI
```
Component → useHook() → apiClient.get() → Store.setData() → Re-render
```

### Complex Flow: User Action → API → Store → Broadcast → WebSocket
```
User clicks → Modal → API call → Store update → Navigate → WebSocket connect
```

### Real-time Flow: WebSocket → Store → UI + Overlay
```
WS message → Parse → Store update → UI re-render + Overlay sync
```

---

## 🛠️ Key Technologies

- **React 19.2.4**: UI framework
- **React Router v7**: Client-side routing (HashRouter)
- **Zustand v5**: State management with persistence
- **Axios v1**: HTTP client with JWT interceptors
- **Tailwind CSS v3**: Styling
- **Vite v8**: Build tool
- **Electron v33**: Desktop app framework
- **TypeScript v5**: Type safety
- **react-hook-form v7 + Zod v4**: Form handling & validation

---

## 🚀 Getting Started

### 1. Understand the Architecture
- Read: TECHNICAL_MAP.md → Architecture Overview
- Read: QUICK_REFERENCE.md → Architecture Principles

### 2. Explore a Feature
- Pick a feature (e.g., Character Management)
- Read: TECHNICAL_MAP.md → Feature 2: Character Management
- Explore files: `src/features/character/`

### 3. Add a New Feature
- Read: QUICK_REFERENCE.md → Common Tasks → Add a New Store/Hook/Page
- Follow the patterns in existing features
- Add JSDoc comments to all files

### 4. Debug Issues
- Read: QUICK_REFERENCE.md → Debugging Tips
- Read: QUICK_REFERENCE.md → Common Errors & Solutions
- Check: TECHNICAL_MAP.md → Key Implementation Patterns

---

## 📝 File Organization

```
src/
├── pages/                    # 11 route pages
├── features/                 # 5 major features (52 files)
│   ├── auth/
│   ├── character/
│   ├── dashboard/
│   ├── broadcast/
│   └── stt/
├── shared/                   # Shared infrastructure (30+ files)
│   ├── stores/              # 9 Zustand stores
│   ├── types/               # 9 type definition files
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utilities
│   └── constants/           # Constants
├── components/
│   └── layouts/             # Layout components
├── styles/
│   └── globals.css          # Tailwind CSS
├── App.tsx                  # React Router setup
└── main.tsx                 # Vite entry point
```

---

## 🎓 Learning Path

### Beginner
1. Read QUICK_REFERENCE.md (overview)
2. Explore a simple page (e.g., SettingsPage)
3. Understand one store (e.g., themeStore)
4. Try adding a simple feature

### Intermediate
1. Read TECHNICAL_MAP.md (full architecture)
2. Understand data flow patterns
3. Explore a complex feature (e.g., Broadcasting)
4. Implement a new page

### Advanced
1. Master all implementation patterns
2. Understand WebSocket + auto-reconnect
3. Understand JWT + 401 queue pattern
4. Implement complex features with multiple stores

---

## 🔍 Key Concepts

### Zustand Store Pattern
- Define interface
- Create store with persist middleware
- Use selectors in components
- Actions update state

### Custom Hook Pattern
- Fetch data from API
- Handle loading/error states
- Return data + refetch function
- Use in components

### Data Flow Pattern
- Component → Hook → API → Store → Re-render
- Optimistic UI for immediate feedback
- Error handling at each step

### WebSocket Pattern
- Connect with auth token
- Handle binary + JSON frames
- Auto-reconnect on network errors
- Sync to stores and UI

### Overlay Bridge Pattern
- Main app writes to localStorage
- Overlay reads from localStorage
- postMessage for real-time sync
- Cross-window state management

---

## 📞 Support

For questions about:
- **Architecture**: See TECHNICAL_MAP.md → Architecture Overview
- **Specific Feature**: See TECHNICAL_MAP.md → Feature Modules
- **Data Flow**: See TECHNICAL_MAP.md → Data Flow Patterns
- **Implementation**: See TECHNICAL_MAP.md → Key Implementation Patterns
- **Quick Lookup**: See QUICK_REFERENCE.md
- **Common Tasks**: See QUICK_REFERENCE.md → Common Tasks
- **Debugging**: See QUICK_REFERENCE.md → Debugging Tips

---

## 📅 Development Timeline

- **2026-04-14**: Project started
- **2026-04-29**: CLAUDE.md initial draft
- **2026-04-30**: Broadcast feature added
- **2026-05-10**: Faster Whisper STT daemon
- **2026-05-11~12**: OBS overlay automation
- **2026-05-13**: Character custom personas
- **2026-05-19**: AGENTS.md documentation
- **2026-05-22**: Comprehensive technical inspection (this document)

---

## 📄 Related Documentation

- `CLAUDE.md` - Compressed project guide
- `AGENTS.md` - Agent-specific guidelines
- `PROJECT_GUIDE.md` - Detailed project guide
- `SPECIFICATIONS.md` - Feature specifications
- `API_SPECIFICATIONS.md` - API documentation
- `DEVELOPMENT_GUIDE.md` - Development workflow
- `UI_DESIGN.md` - UI/UX guidelines

---

**Last Updated**: 2026-05-22  
**Inspection Scope**: Complete frontend codebase (src/ directory)  
**Documentation Quality**: Comprehensive with code examples and patterns
