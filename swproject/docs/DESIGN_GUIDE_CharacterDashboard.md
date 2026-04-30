# Character Dashboard - Design & Implementation Guide

## Overview

The enhanced **CharacterDashboard** component is a polished, modern UI for managing AI characters in the streaming application. It features a sophisticated visual hierarchy, smooth interactions, and comprehensive state management.

---

## Design System

### Color Palette

| Purpose | Tailwind Class | Usage |
|---------|---|---|
| **Primary Accent** | `indigo-500/600/700` | Active states, primary buttons, highlights |
| **Background** | `slate-950` | Main container background |
| **Card Background** | `slate-800/40` to `slate-800/60` | Secondary surfaces |
| **Text Primary** | `text-white` | Headings, primary text |
| **Text Secondary** | `text-slate-300/400` | Descriptions, metadata |
| **Borders** | `slate-700/50` to `slate-600/50` | Card borders, dividers |
| **Success** | `emerald-400` | Positive actions |
| **Destructive** | `red-400/red-950` | Delete operations |
| **Persona Colors** | `purple/pink/blue/emerald-400` | Persona type indicators |

### Typography

- **Header (H1)**: `text-3xl font-bold text-white` - Page title
- **Section Header (H2)**: `text-lg font-semibold text-slate-200` - Section titles
- **Card Title (H3)**: `text-2xl font-bold text-white` - Featured character name
- **Body Text**: `text-sm font-medium text-slate-300` - Primary content
- **Secondary Text**: `text-xs font-medium text-slate-400` - Metadata, labels
- **Micro Text**: `text-xs uppercase text-slate-400` - Category labels

---

## Component Architecture

### Main Component: `CharacterDashboard`

**Props Interface:**
```typescript
interface CharacterDashboardProps {
  characters: CharacterPreset[];           // Array of character data
  selectedId: string | null;               // Currently selected character ID
  isSelecting?: boolean;                   // Selection in progress
  isDeleting?: boolean;                    // Deletion in progress
  isLoading?: boolean;                     // Data loading state
  error?: string | null;                   // Error message
  onCreateClick: () => void;               // Create character handler
  onEditClick: (id: string) => void;       // Edit character handler
  onDeleteClick: (id: string) => void;     // Delete character handler
  onSelectClick: (id: string) => void;     // Select character handler
  onBroadcastClick?: (id: string) => void; // Start broadcast handler
  onViewDetails?: (id: string) => void;    // View details handler
}
```

### Sub-Components

#### 1. **GenderBadge**
Displays gender indicator with emoji and text.
```tsx
<GenderBadge gender="female" />
// Output: 👩 여성
```

**Styling:**
- Background: `bg-slate-700/50`
- Text: `text-slate-200`
- Padding: `px-3 py-1`
- Border: Rounded pill shape

#### 2. **CallWordBadges**
Renders individual call word triggers as badge pills.
```tsx
<CallWordBadges callWords={["야", "도와줘", "여기봐"]} />
```

**Styling:**
- Background: `bg-indigo-500/15`
- Text: `text-indigo-300`
- Border: `border-indigo-500/30`
- Quoted display: `"{word}"`

#### 3. **LoadingSkeleton**
Animated skeleton loader for data loading state.

**Features:**
- Animated pulse effect: `animate-pulse`
- Placeholder heights matching actual content
- Smooth fade-in on completion

#### 4. **ErrorState**
Error message display component.

**Styling:**
- Background: `bg-red-950/20`
- Border: `border-red-500/30`
- Text: `text-red-300`

#### 5. **EmptyState**
Displays when no characters exist.

**Features:**
- Decorative icon with gradient background
- Encouraging copy
- CTA button with icon

---

## Layout Structure

### Page Layout
```
┌─ Page Container (min-h-screen bg-slate-950)
│
├─ Header Section
│  ├─ Title: "내 AI 캐릭터"
│  └─ Subtitle: "보유한 AI 동료를 확인하고 관리하세요"
│
├─ [Optional] Error State
│
├─ [Optional] Loading Skeleton
│
├─ Featured Character Section (if selected)
│  ├─ Section Label with Icon
│  └─ Featured Card
│     ├─ Avatar (h-32 w-32, rounded-2xl)
│     ├─ Character Info
│     │  ├─ Name + Gender Badge
│     │  ├─ Persona with Icon
│     │  ├─ Call Words (badge pills)
│     │  └─ Broadcast Button (optional)
│
└─ Character List Section
   ├─ Header with Count + Create Button
   └─ List Items
      └─ Character Card (repeating)
         ├─ Avatar (h-12 w-12, rounded-full)
         ├─ Character Info
         │  ├─ Name + Gender Badge
         │  └─ Persona + Call Words (summary)
         └─ Action Buttons (Select, View, Edit, Delete)
```

---

## Featured Character Card

### Design Details

**Container:**
- Border: `border-slate-700/50`
- Background: `bg-gradient-to-br from-slate-800 to-slate-900`
- Padding: `p-8`
- Rounded: `rounded-2xl`
- Hover Effects:
  - Border: `hover:border-slate-600/50`
  - Shadow: `hover:shadow-lg hover:shadow-indigo-500/10`
  - Decorative gradient overlay (indigo tint)

**Avatar:**
- Size: `h-32 w-32`
- Border: `border-slate-600/50`
- Background: `bg-gradient-to-br from-slate-700 to-slate-800`
- Rounded: `rounded-2xl`
- Text: `text-4xl font-bold text-slate-300`
- Shadow: `shadow-lg`

**Content Layout:**
- Flex direction: `flex-col gap-8 sm:flex-row sm:items-start`
- Responsive: Stacks on mobile, side-by-side on tablet+

**Information Hierarchy:**
1. Name + Gender Badge (top)
2. Persona with icon (medium emphasis)
3. Call Words section (detailed)
4. Broadcast Button (primary CTA)

**Broadcast Button:**
- Background: `bg-gradient-to-r from-indigo-600 to-indigo-700`
- Padding: `px-5 py-2.5`
- Text: `text-sm font-semibold text-white`
- Hover: `hover:shadow-lg hover:shadow-indigo-500/30`
- Active: `active:scale-95` (press feedback)

---

## Character List Cards

### Design Details

**Container:**
- Border: `border-slate-700/50` (default) or `border-indigo-500/50` (selected)
- Background: `bg-slate-800/40` (default) or `bg-indigo-500/10` (selected)
- Padding: `p-4`
- Rounded: `rounded-xl`
- Responsive Layout: `flex-col gap-4 sm:flex-row sm:items-center sm:gap-6`

**Selected State:**
- Border: `border-indigo-500/50`
- Background: `bg-indigo-500/10`
- Shadow: `shadow-lg shadow-indigo-500/10`

**Avatar:**
- Size: `h-12 w-12`
- Rounded: `rounded-full`
- Background: `bg-slate-700`
- Text: `text-sm font-bold text-slate-300`

**Character Info:**
- Name: `text-sm font-semibold text-white`
- Metadata: `text-xs text-slate-400`
- Format: `[Persona] • 호출어: word1, word2...`

**Action Buttons:**
- Size: `p-1.5` (icon buttons)
- Border: `border-slate-600/50`
- Background: `bg-slate-700/50`
- Hover: `hover:bg-slate-700`
- Spacing: `gap-1.5 sm:gap-2`

**Button States:**
- **Select Button:**
  - Default: `border-slate-600/50 bg-slate-700/50 text-slate-300`
  - Selected: `border-indigo-500/50 bg-indigo-500/20 text-indigo-300`
  - Disabled: `disabled:opacity-50`

- **View/Edit Buttons:**
  - Default: `border-slate-600/50 bg-slate-700/50 text-slate-300`
  - Hover: `hover:bg-slate-700`

- **Delete Button:**
  - Default: `border-red-900/30 bg-red-950/20 text-red-400`
  - Hover: `hover:bg-red-950/40`
  - Disabled: `disabled:opacity-50`

---

## Interaction Patterns

### Hover Effects

**Featured Card:**
- Border lightens: `slate-700/50` → `slate-600/50`
- Shadow appears: `shadow-lg shadow-indigo-500/10`
- Decorative gradient overlay becomes visible

**List Card:**
- Border lightens: `slate-700/50` → `slate-600/50`
- Background brightens: `slate-800/40` → `slate-800/60`
- Subtle gradient overlay appears

**Buttons:**
- Background color transitions
- Shadow effects on hover
- Scale effect on click: `active:scale-95`

### Loading State

- Animated skeleton with `animate-pulse`
- Placeholder boxes matching content structure
- Smooth transition when content loads

### Empty State

- Large decorative icon with gradient background
- Encouraging message
- Primary CTA button
- Centered layout with generous padding

### Error State

- Red-tinted background and border
- Clear error message
- Dismissible or retry option

---

## Persona System

### Persona Types & Colors

| Persona | Label | Color | Icon |
|---------|-------|-------|------|
| `game_specialist` | 게임 특화 | `text-purple-400` | ⚡ |
| `humor_entertainment` | 유머/예능 | `text-pink-400` | ⚡ |
| `focused_serious` | 진중/집중 | `text-blue-400` | ⚡ |
| `chat_social` | 잡담/소통 | `text-emerald-400` | ⚡ |

**Implementation:**
```typescript
function getPersonaColor(persona?: string): string {
  const colors: Record<string, string> = {
    game_specialist: "text-purple-400",
    humor_entertainment: "text-pink-400",
    focused_serious: "text-blue-400",
    chat_social: "text-emerald-400",
  };
  return colors[persona || ""] || "text-slate-400";
}
```

---

## Responsive Design

### Breakpoints

**Mobile (< 640px):**
- Single column layout
- Full-width cards with vertical stacking
- Compact padding: `p-4` to `p-6`
- Button text hidden on some elements (icon-only)

**Tablet (640px - 1024px):**
- Featured card: Stacked (avatar on top)
- List cards: Horizontal with flex-row
- Medium padding: `p-6` to `p-8`

**Desktop (> 1024px):**
- Featured card: Side-by-side layout
- List cards: Full horizontal with all details
- Generous padding: `p-8`
- Max-width container: `max-w-6xl`

### Responsive Classes Used

```css
/* Featured Card */
flex-col gap-8 sm:flex-row sm:items-start

/* List Card */
flex-col gap-4 sm:flex-row sm:items-center sm:gap-6

/* Buttons */
gap-1.5 sm:gap-2
text-xs sm:inline (toggle visibility)

/* Container */
p-6 sm:p-8
max-w-6xl
```

---

## Accessibility Features

### Semantic HTML
- Proper heading hierarchy: `h1` → `h2` → `h3`
- Button elements for interactive controls
- Disabled states properly conveyed

### Icon Labels
- All icon buttons have `title` attributes
- Semantic icons from lucide-react
- Clear visual states (enabled/disabled)

### Color Contrast
- Text: `white` on `slate-950` (AAA compliant)
- Secondary: `slate-300` on `slate-800` (AA compliant)
- Interactive: `indigo-300` on `indigo-500/20` (AA compliant)

### Focus States
- Keyboard navigation support via button elements
- Clear focus indicators (browser default or custom)
- Tab order follows visual flow

---

## Animation & Transitions

### CSS Classes

```css
/* Hover transitions */
transition-all
transition-colors
transition-opacity

/* Loading animation */
animate-pulse

/* Click feedback */
active:scale-95

/* Opacity states */
disabled:opacity-50
opacity-0 group-hover:opacity-100
```

### Motion Principles

1. **Entrance:** Smooth fade-in with skeleton loader
2. **Hover:** Subtle color and shadow changes
3. **Active:** Quick scale feedback on click
4. **Disabled:** Reduced opacity for inactive states

---

## Implementation Checklist

- [x] Featured character card with full details
- [x] Character list with compact cards
- [x] Empty state handling
- [x] Loading skeleton
- [x] Error state display
- [x] Gender badge component
- [x] Call word badges
- [x] Persona color system
- [x] Responsive layout
- [x] Hover effects
- [x] Button states (enabled/disabled/selected)
- [x] Delete confirmation
- [x] Broadcast button (optional prop)
- [x] View details button (optional prop)

---

## Code Example

### Basic Usage

```tsx
import { CharacterDashboard } from "@/features/character/components";

function CharacterPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <CharacterDashboard
      characters={characters}
      selectedId={selectedId}
      isLoading={isLoading}
      error={error}
      onCreateClick={() => navigate("/character/create")}
      onEditClick={(id) => navigate(`/character/${id}/edit`)}
      onDeleteClick={(id) => deleteCharacter(id)}
      onSelectClick={(id) => selectCharacter(id)}
      onBroadcastClick={(id) => startBroadcast(id)}
      onViewDetails={(id) => navigate(`/character/${id}`)}
    />
  );
}
```

---

## Future Enhancements

1. **Drag-to-Reorder:** Reorder characters by drag-and-drop
2. **Bulk Actions:** Select multiple characters for batch operations
3. **Search & Filter:** Filter characters by persona, creation date
4. **Favorites:** Star favorite characters for quick access
5. **Recent Activity:** Show last broadcast time or usage stats
6. **Character Templates:** Quick-start templates for common personas
7. **Duplicate Character:** Clone existing character with modifications
8. **Advanced Animations:** Staggered entrance animations for list items
9. **Keyboard Shortcuts:** Hotkeys for common actions
10. **Undo/Redo:** Reversible operations for destructive actions

---

## File Reference

**Component:** `/Users/lee/SKU-SW/swproject/src/features/character/components/CharacterDashboard.tsx`

**Related Types:** `/Users/lee/SKU-SW/swproject/src/shared/types/character.ts`

**Dependencies:**
- `lucide-react` (icons)
- `CharacterPreset` type
- Tailwind CSS (styling)

---

**Last Updated:** April 23, 2026
**Version:** 2.0 (Enhanced UI/UX)
