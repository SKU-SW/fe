# CharacterDashboard - Visual Reference Guide

## Design System Overview

This guide provides a visual reference for all design elements used in the CharacterDashboard component.

---

## Page Layout Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  내 AI 캐릭터                                               │
│  보유한 AI 동료를 확인하고 관리하세요                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ 현재 선택된 AI 캐릭터 정보                        │   │
│  │                                                     │   │
│  │ ┌─────┐  Name + 👩 여성                             │   │
│  │ │ A   │  ⚡ 페르소나: 유머/예능                      │   │
│  │ │     │  호출어                                      │   │
│  │ └─────┘  ┌────────┐ ┌────────┐ ┌────────┐          │   │
│  │          │ "야"   │ │ "도와" │ │ "여기" │          │   │
│  │          └────────┘ └────────┘ └────────┘          │   │
│  │                                                     │   │
│  │          [⚡ 이 캐릭터로 방송 시작]                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  생성한 AI 캐릭터 (3)  [+ AI 캐릭터 생성하기]              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌─────┐  Name + 👩 여성                              │  │
│  │ │  A  │  [유머/예능] • 호출어: 야, 도와줘             │  │
│  │ └─────┘  [○ 선택] [👁] [✏] [🗑]                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌─────┐  Name + 👨 남성                              │  │
│  │ │  B  │  [게임 특화] • 호출어: 게임, 플레이           │  │
│  │ └─────┘  [✓ 선택됨] [👁] [✏] [🗑]                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ┌─────┐  Name + 👩 여성                              │  │
│  │ │  C  │  [진중/집중] • 호출어: 집중, 도와줘          │  │
│  │ └─────┘  [○ 선택] [👁] [✏] [🗑]                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Swatches

### Primary Colors

```
┌─────────────────────────────────────────────┐
│ Slate-950 (Background)                      │
│ #020617                                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Slate-800 (Card Background)                 │
│ #1e293b                                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Indigo-600 (Primary Action)                 │
│ #4f46e5                                     │
└─────────────────────────────────────────────┘
```

### Accent Colors

```
┌─────────────────────────────────────────────┐
│ Purple-400 (Game Specialist)                │
│ #a855f7                                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Pink-400 (Humor/Entertainment)              │
│ #ec4899                                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Blue-400 (Focused/Serious)                  │
│ #60a5fa                                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Emerald-400 (Chat/Social)                   │
│ #34d399                                     │
└─────────────────────────────────────────────┘
```

### Semantic Colors

```
┌─────────────────────────────────────────────┐
│ Red-400 (Destructive/Delete)                │
│ #f87171                                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Slate-400 (Secondary Text)                  │
│ #94a3b8                                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ White (Primary Text)                        │
│ #ffffff                                     │
└─────────────────────────────────────────────┘
```

---

## Typography Scale

### Heading 1 (Page Title)
```
text-3xl font-bold text-white
내 AI 캐릭터
```

### Heading 2 (Section Title)
```
text-lg font-semibold text-slate-200
생성한 AI 캐릭터 (3)
```

### Heading 3 (Card Title)
```
text-2xl font-bold text-white
Character Name
```

### Body Text
```
text-sm font-medium text-slate-300
Primary content information
```

### Secondary Text
```
text-xs font-medium text-slate-400
Metadata and labels
```

### Micro Text (Labels)
```
text-xs uppercase text-slate-400
호출어
```

---

## Component Spacing

### Padding Reference

```
Compact:    px-3 py-1    (badges, small elements)
Standard:   px-4 py-2    (buttons, regular elements)
Generous:   px-6 py-3    (large buttons, cards)
Extra:      px-8 py-4    (featured cards)
```

### Gap Reference

```
Tight:      gap-1        (inline elements)
Close:      gap-2        (grouped elements)
Standard:   gap-4        (sections)
Generous:   gap-6        (major sections)
Extra:      gap-8        (page sections)
```

### Radius Reference

```
Small:      rounded-lg   (buttons, small elements)
Medium:     rounded-xl   (cards)
Large:      rounded-2xl  (featured cards, avatars)
Full:       rounded-full (circular elements)
```

---

## Featured Character Card Details

### Card Structure

```
┌─────────────────────────────────────────────────────────┐
│ Border: border-slate-700/50                             │
│ Background: bg-gradient-to-br from-slate-800 to-slate-900 │
│ Padding: p-8                                            │
│ Rounded: rounded-2xl                                    │
│ Hover: border-slate-600/50, shadow-lg shadow-indigo-500/10 │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Avatar                                              │ │
│ │ h-32 w-32                                           │ │
│ │ rounded-2xl                                         │ │
│ │ border-slate-600/50                                 │ │
│ │ bg-gradient-to-br from-slate-700 to-slate-800      │ │
│ │ text-4xl font-bold text-slate-300                   │ │
│ │ shadow-lg                                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Name + Gender Badge                                     │
│ text-2xl font-bold text-white                           │
│                                                         │
│ Persona                                                 │
│ text-sm font-medium text-slate-300                      │
│                                                         │
│ Call Words                                              │
│ bg-indigo-500/15 border-indigo-500/30 text-indigo-300  │
│                                                         │
│ Broadcast Button                                        │
│ bg-gradient-to-r from-indigo-600 to-indigo-700         │
│ px-5 py-2.5 text-sm font-semibold text-white           │
│ hover:shadow-lg hover:shadow-indigo-500/30             │
│ active:scale-95                                        │
└─────────────────────────────────────────────────────────┘
```

---

## Character List Card Details

### Unselected Card

```
┌─────────────────────────────────────────────────────────┐
│ Border: border-slate-700/50                             │
│ Background: bg-slate-800/40                             │
│ Padding: p-4                                            │
│ Rounded: rounded-xl                                     │
│ Hover: border-slate-600/50, bg-slate-800/60             │
│                                                         │
│ ┌─────┐  Name + Gender Badge                            │
│ │  A  │  text-sm font-semibold text-white               │
│ └─────┘  [Persona] • 호출어: word1, word2              │
│          text-xs text-slate-400                         │
│                                                         │
│ [○ 선택] [👁] [✏] [🗑]                                 │
│ gap-1.5 sm:gap-2                                        │
└─────────────────────────────────────────────────────────┘
```

### Selected Card

```
┌═════════════════════════════════════════════════════════┐
│ Border: border-indigo-500/50                            │
│ Background: bg-indigo-500/10                            │
│ Shadow: shadow-lg shadow-indigo-500/10                  │
│                                                         │
│ ┌─────┐  Name + Gender Badge                            │
│ │  A  │  text-sm font-semibold text-white               │
│ └─────┘  [Persona] • 호출어: word1, word2              │
│          text-xs text-slate-400                         │
│                                                         │
│ [✓ 선택됨] [👁] [✏] [🗑]                               │
│ border-indigo-500/50 bg-indigo-500/20 text-indigo-300  │
└═════════════════════════════════════════════════════════┘
```

---

## Button Styles

### Primary Button (Broadcast)

```
State: Default
├─ bg-gradient-to-r from-indigo-600 to-indigo-700
├─ text-white font-semibold
├─ px-5 py-2.5 rounded-lg
└─ transition

State: Hover
├─ shadow-lg shadow-indigo-500/30
└─ (gradient remains)

State: Active
└─ active:scale-95
```

### Secondary Button (Create, Edit)

```
State: Default
├─ bg-indigo-600
├─ text-white font-medium
├─ px-4 py-2 rounded-lg
└─ transition

State: Hover
└─ bg-indigo-700
```

### Icon Button (View, Edit, Delete)

```
State: Default (View/Edit)
├─ border-slate-600/50
├─ bg-slate-700/50
├─ p-1.5 rounded-lg
├─ text-slate-300
└─ transition

State: Hover
└─ bg-slate-700

State: Default (Delete)
├─ border-red-900/30
├─ bg-red-950/20
├─ p-1.5 rounded-lg
├─ text-red-400
└─ transition

State: Hover (Delete)
└─ bg-red-950/40
```

### Select Button

```
State: Unselected
├─ border-slate-600/50
├─ bg-slate-700/50
├─ text-slate-300
├─ px-3 py-1.5 rounded-lg
├─ text-xs font-medium
└─ Icon: Circle

State: Selected
├─ border-indigo-500/50
├─ bg-indigo-500/20
├─ text-indigo-300
├─ px-3 py-1.5 rounded-lg
├─ text-xs font-medium
└─ Icon: CheckCircle2
```

---

## State Indicators

### Gender Badge

```
Female:  👩 여성  (emoji + text)
Male:    👨 남성  (emoji + text)

Styling:
├─ bg-slate-700/50
├─ text-slate-200
├─ px-3 py-1 rounded-full
└─ text-xs font-medium
```

### Persona Indicator

```
Game Specialist:        ⚡ [purple-400]
Humor/Entertainment:    ⚡ [pink-400]
Focused/Serious:        ⚡ [blue-400]
Chat/Social:            ⚡ [emerald-400]

Styling:
├─ h-4 w-4 icon
├─ Tailwind color class
└─ Inline with text
```

### Call Word Badge

```
┌─────────────┐
│ "word"      │
└─────────────┘

Styling:
├─ bg-indigo-500/15
├─ border-indigo-500/30
├─ text-indigo-300
├─ px-3 py-1 rounded-full
├─ text-xs font-medium
└─ Quoted display
```

---

## Responsive Breakpoints

### Mobile (< 640px)

```
Featured Card:
├─ flex-col (vertical stack)
├─ Avatar on top
├─ Content below
└─ p-4 (compact padding)

List Card:
├─ flex-col (vertical stack)
├─ Avatar + info on top
├─ Buttons on bottom
├─ Buttons: icon-only
└─ p-4 (compact padding)

Text:
└─ Hidden labels on buttons
```

### Tablet (640px - 1024px)

```
Featured Card:
├─ sm:flex-row (horizontal)
├─ Avatar left, content right
├─ sm:items-start (top alignment)
└─ p-6 (standard padding)

List Card:
├─ sm:flex-row (horizontal)
├─ Avatar + info left, buttons right
├─ sm:items-center (center alignment)
├─ sm:gap-6 (increased gap)
├─ Buttons: text visible
└─ p-4 sm:p-6 (increased padding)
```

### Desktop (> 1024px)

```
Featured Card:
├─ flex-row (full horizontal)
├─ Avatar left, content right
├─ max-w-6xl (max width)
└─ p-8 (generous padding)

List Card:
├─ flex-row (full horizontal)
├─ Avatar + info left, buttons right
├─ sm:gap-6 (full gap)
├─ All details visible
└─ p-6 lg:p-8 (generous padding)

Container:
├─ max-w-6xl (centered)
└─ mx-auto (centered)
```

---

## Animation & Transitions

### Loading Skeleton

```
Animation: animate-pulse
├─ Opacity: 0.5 → 1 → 0.5 (repeating)
├─ Duration: 2s
└─ Infinite loop
```

### Hover Effects

```
Cards:
├─ transition-all
├─ Border: slight lightening
├─ Shadow: appears on hover
└─ Duration: 150-200ms

Buttons:
├─ transition-all
├─ Background: color change
├─ Shadow: appears on hover
└─ Duration: 150-200ms
```

### Click Feedback

```
Buttons:
├─ active:scale-95
├─ Scale: 100% → 95% → 100%
└─ Duration: instant
```

### Opacity Transitions

```
Overlays:
├─ opacity-0 group-hover:opacity-100
├─ Opacity: 0% → 100%
└─ Duration: 200ms
```

---

## Dark Mode Implementation

All components use Tailwind's dark mode utilities with slate color palette:

```
Background:     bg-slate-950  (darkest)
Surfaces:       bg-slate-800  (dark)
Accents:        bg-indigo-600 (bright)
Text:           text-white    (primary)
Text Secondary: text-slate-300/400 (secondary)
Borders:        border-slate-700/50 (subtle)
```

No light mode variants are implemented - component is dark-only.

---

## Accessibility Features

### Semantic HTML

```
<h1>내 AI 캐릭터</h1>           (Page title)
<h2>생성한 AI 캐릭터</h2>       (Section title)
<h3>Character Name</h3>         (Card title)
<button>Action</button>         (Interactive)
<span>Badge</span>              (Non-interactive)
```

### Focus States

```
Buttons:
├─ Tab navigation support
├─ Focus ring (browser default or custom)
└─ Visible focus indicator

Links:
├─ Keyboard accessible
└─ Clear focus state
```

### Color Contrast

```
White on Slate-950:     AAA (7:1+)
White on Slate-800:     AAA (7:1+)
Slate-300 on Slate-800: AA (4.5:1+)
Indigo-300 on Indigo-500/20: AA (4.5:1+)
```

### Icon Labels

```
All icon buttons have:
├─ title attribute (tooltip)
└─ Clear semantic meaning
```

---

## Implementation Checklist

- [x] Color palette implementation
- [x] Typography hierarchy
- [x] Spacing system
- [x] Button styles
- [x] Card layouts
- [x] Responsive design
- [x] State indicators
- [x] Animations
- [x] Accessibility
- [x] Dark mode
- [x] Icon integration
- [x] Hover effects
- [x] Loading states
- [x] Error states
- [x] Empty states

---

**Last Updated:** April 23, 2026
**Version:** 2.0
