# CharacterDashboard - Component Showcase

## Visual Component Library

This document showcases the individual components and patterns used in the CharacterDashboard.

---

## 1. Gender Badge Component

### Visual

```
┌──────────────────┐
│ 👩 여성          │
└──────────────────┘

┌──────────────────┐
│ 👨 남성          │
└──────────────────┘
```

### Code

```tsx
function GenderBadge({ gender }: { gender: string }) {
  const isFemale = gender === "female";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-200">
      {isFemale ? "👩 여성" : "👨 남성"}
    </span>
  );
}
```

### Styling Details

| Property | Value |
|----------|-------|
| Background | `bg-slate-700/50` |
| Text Color | `text-slate-200` |
| Padding | `px-3 py-1` |
| Border Radius | `rounded-full` |
| Font Size | `text-xs` |
| Font Weight | `font-medium` |
| Display | `inline-flex` |
| Gap | `gap-1` |

---

## 2. Call Word Badges

### Visual

```
┌─────────────┐  ┌──────────────┐  ┌──────────────┐
│ "야"        │  │ "도와줘"     │  │ "여기봐"     │
└─────────────┘  └──────────────┘  └──────────────┘
```

### Code

```tsx
function CallWordBadges({ callWords }: { callWords: string[] }) {
  if (!callWords.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {callWords.map((word) => (
        <span
          key={word}
          className="inline-flex items-center rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30"
        >
          "{word}"
        </span>
      ))}
    </div>
  );
}
```

### Styling Details

| Property | Value |
|----------|-------|
| Background | `bg-indigo-500/15` |
| Text Color | `text-indigo-300` |
| Border | `border-indigo-500/30` |
| Padding | `px-3 py-1` |
| Border Radius | `rounded-full` |
| Font Size | `text-xs` |
| Gap | `gap-2` |
| Flex Wrap | `flex-wrap` |

---

## 3. Featured Character Card

### Visual Layout

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  ┌──────────┐  Name + 👩 여성                             ║
║  │          │                                              ║
║  │    A     │  ⚡ 페르소나: 유머/예능                      ║
║  │          │                                              ║
║  └──────────┘  호출어                                      ║
║                ┌──────────┐ ┌──────────┐ ┌──────────┐    ║
║                │ "야"     │ │ "도와줘" │ │ "여기봐" │    ║
║                └──────────┘ └──────────┘ └──────────┘    ║
║                                                            ║
║                [⚡ 이 캐릭터로 방송 시작]                  ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### Code

```tsx
<div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-8 transition-all hover:border-slate-600/50 hover:shadow-lg hover:shadow-indigo-500/10">
  {/* Decorative gradient background */}
  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

  <div className="relative flex flex-col gap-8 sm:flex-row sm:items-start">
    {/* Avatar */}
    <div className="flex shrink-0">
      <div className="flex h-32 w-32 items-center justify-center rounded-2xl border border-slate-600/50 bg-gradient-to-br from-slate-700 to-slate-800 text-4xl font-bold text-slate-300 shadow-lg">
        {selectedChar.name.charAt(0).toUpperCase()}
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 space-y-5">
      {/* Name & Gender */}
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-2xl font-bold text-white">{selectedChar.name}</h3>
        <GenderBadge gender={selectedChar.info.gender} />
      </div>

      {/* Persona */}
      <div className="flex items-center gap-2">
        <Zap className={`h-4 w-4 ${getPersonaColor(selectedChar.info.persona)}`} />
        <span className="text-sm font-medium text-slate-300">
          페르소나: <span className="text-white">{getPersonaLabel(selectedChar.info.persona)}</span>
        </span>
      </div>

      {/* Call Words */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase text-slate-400">호출어</p>
        <CallWordBadges callWords={selectedChar.info.callSign.split(",").map((w) => w.trim()).filter(Boolean)} />
      </div>

      {/* Broadcast Button */}
      <button
        type="button"
        onClick={() => onBroadcastClick(selectedChar.id)}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
      >
        <Zap className="h-4 w-4" />
        이 캐릭터로 방송 시작
      </button>
    </div>
  </div>
</div>
```

### Styling Hierarchy

| Element | Purpose | Classes |
|---------|---------|---------|
| Container | Card surface | `rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800 to-slate-900 p-8` |
| Hover Effect | Interactive feedback | `hover:border-slate-600/50 hover:shadow-lg hover:shadow-indigo-500/10` |
| Avatar | Character initial | `h-32 w-32 rounded-2xl border border-slate-600/50 bg-gradient-to-br from-slate-700 to-slate-800 text-4xl` |
| Name | Primary heading | `text-2xl font-bold text-white` |
| Persona | Secondary info | `text-sm font-medium text-slate-300` |
| Button | CTA | `bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-sm font-semibold text-white` |

---

## 4. Character List Card (Unselected)

### Visual Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│ ┌─────┐  Name                                            │
│ │  A  │  👩 여성                                         │
│ └─────┘  [유머/예능] • 호출어: 야, 도와줘               │
│                                                          │
│  [○ 선택]  [👁]  [✏]  [🗑]                              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Code

```tsx
<div className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/40 transition-all hover:border-slate-600/50 hover:bg-slate-800/60">
  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/0 to-indigo-600/0 opacity-0 transition-opacity group-hover:opacity-5" />

  <div className="relative flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
    {/* Avatar & Info */}
    <div className="flex items-start gap-4 sm:items-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-600/50 bg-slate-700 text-sm font-bold text-slate-300">
        {character.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">{character.name}</p>
          <GenderBadge gender={character.info.gender} />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          <span className={`font-medium ${getPersonaColor(character.info.persona)}`}>
            [{getPersonaLabel(character.info.persona)}]
          </span>
          {callWords.length > 0 && (
            <> • 호출어: {callWords.slice(0, 2).join(", ")}{callWords.length > 2 ? "..." : ""}</>
          )}
        </p>
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-1.5 sm:gap-2">
      <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600/50 bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-slate-500/50 hover:bg-slate-700">
        <Circle className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">선택</span>
      </button>

      <button className="rounded-lg border border-slate-600/50 bg-slate-700/50 p-1.5 text-slate-300 transition hover:bg-slate-700">
        <Eye className="h-4 w-4" />
      </button>

      <button className="rounded-lg border border-slate-600/50 bg-slate-700/50 p-1.5 text-slate-300 transition hover:bg-slate-700">
        <Edit2 className="h-4 w-4" />
      </button>

      <button className="rounded-lg border border-red-900/30 bg-red-950/20 p-1.5 text-red-400 transition hover:bg-red-950/40">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  </div>
</div>
```

---

## 5. Character List Card (Selected)

### Visual Layout

```
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║ ┌─────┐  Name                                            ║
║ │  A  │  👩 여성                                         ║
║ └─────┘  [유머/예능] • 호출어: 야, 도와줘               ║
║                                                          ║
║  [✓ 선택됨]  [👁]  [✏]  [🗑]                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Styling Differences

| Property | Unselected | Selected |
|----------|-----------|----------|
| Border | `border-slate-700/50` | `border-indigo-500/50` |
| Background | `bg-slate-800/40` | `bg-indigo-500/10` |
| Shadow | None | `shadow-lg shadow-indigo-500/10` |
| Select Button | `border-slate-600/50 bg-slate-700/50` | `border-indigo-500/50 bg-indigo-500/20` |
| Select Icon | `Circle` | `CheckCircle2` |
| Select Text | `text-slate-300` | `text-indigo-300` |

---

## 6. Empty State

### Visual Layout

```
┌────────────────────────────────────────┐
│                                        │
│          ┌──────────────┐              │
│          │   Sparkles   │              │
│          └──────────────┘              │
│                                        │
│   아직 생성된 캐릭터가 없습니다         │
│                                        │
│   방송을 함께할 AI 동료를 만들어보세요 │
│   외모, 목소리, 페르소나를 조합해      │
│   캐릭터를 구성할 수 있습니다.         │
│                                        │
│   [+ 첫 캐릭터 생성하기]               │
│                                        │
└────────────────────────────────────────┘
```

### Code

```tsx
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-indigo-500/10 p-4">
          <Sparkles className="h-8 w-8 text-indigo-400" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">아직 생성된 캐릭터가 없습니다</h3>
      <p className="mb-6 text-sm text-slate-400">
        방송을 함께할 AI 동료를 만들어보세요. 외모, 목소리, 페르소나를 조합해 캐릭터를 구성할 수 있습니다.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        첫 캐릭터 생성하기
      </button>
    </div>
  );
}
```

---

## 7. Loading Skeleton

### Visual Layout

```
┌────────────────────────────────────────┐
│                                        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                        │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                        │
└────────────────────────────────────────┘
```

### Code

```tsx
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-40 rounded-2xl bg-slate-800" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-800" />
        ))}
      </div>
    </div>
  );
}
```

---

## 8. Error State

### Visual Layout

```
┌────────────────────────────────────────┐
│                                        │
│  ⚠ Something went wrong                │
│                                        │
│  Please try again later.               │
│                                        │
└────────────────────────────────────────┘
```

### Code

```tsx
function ErrorState({ error }: { error: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
      <p className="text-sm text-red-300">{error}</p>
    </div>
  );
}
```

---

## Button Variants

### Select Button

**Unselected:**
```
┌─────────────────┐
│ ○ 선택          │
└─────────────────┘
```

**Selected:**
```
┌─────────────────┐
│ ✓ 선택됨        │
└─────────────────┘
```

### Icon Button (View/Edit)

```
┌────┐  ┌────┐
│ 👁 │  │ ✏  │
└────┘  └────┘
```

### Delete Button

```
┌────┐
│ 🗑  │
└────┘
```

---

## Color Reference

### Personas

```
Game Specialist:    ⚡ [text-purple-400]
Humor/Entertainment: ⚡ [text-pink-400]
Focused/Serious:    ⚡ [text-blue-400]
Chat/Social:        ⚡ [text-emerald-400]
```

### States

```
Primary Action:     [bg-indigo-600 hover:bg-indigo-700]
Secondary Action:   [bg-slate-700/50 hover:bg-slate-700]
Destructive:        [bg-red-950/20 hover:bg-red-950/40]
Selected:           [border-indigo-500/50 bg-indigo-500/10]
Disabled:           [opacity-50]
```

---

## Responsive Behavior

### Mobile (< 640px)

- Featured card: Stacked layout (avatar on top)
- List cards: Vertical flex with full-width buttons
- Button text hidden, icons only
- Padding: `p-4` to `p-6`

### Tablet (640px - 1024px)

- Featured card: Side-by-side with `sm:flex-row`
- List cards: Horizontal with `sm:flex-row`
- Button text visible
- Padding: `p-6` to `p-8`

### Desktop (> 1024px)

- All content side-by-side
- Max-width container: `max-w-6xl`
- Generous spacing and padding
- All details visible

---

## Animation Classes

| Animation | Class | Usage |
|-----------|-------|-------|
| Pulse | `animate-pulse` | Loading skeleton |
| Scale | `active:scale-95` | Button click feedback |
| Opacity | `opacity-0 group-hover:opacity-100` | Hover overlays |
| Transition | `transition-all` | Smooth state changes |

---

**Last Updated:** April 23, 2026
