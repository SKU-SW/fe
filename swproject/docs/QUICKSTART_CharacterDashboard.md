# CharacterDashboard - Quick Start Guide

## 5-Minute Setup

### 1. Import the Component

```tsx
import { CharacterDashboard } from "@/features/character/components";
import type { CharacterPreset } from "@/shared/types/character";
```

### 2. Prepare Your Data

```tsx
const characters: CharacterPreset[] = [
  {
    id: "1",
    name: "Emma",
    info: {
      gender: "female",
      name: "Emma",
      callSign: "야, 도와줘",
      appearancePresetId: "1",
      voicePresetId: "1",
      speechStyle: "friendly_informal",
      personality: "energetic",
      persona: "chat_social",
    },
    broadcastSettings: {
      chatSensitivity: "medium",
      silenceIntervalSeconds: 30,
      ttsSpeed: 1,
      ttsVolume: 0.8,
    },
    createdAt: new Date().toISOString(),
  },
];

const selectedId = "1";
```

### 3. Add Event Handlers

```tsx
const handleCreateClick = () => {
  navigate("/character/create");
};

const handleEditClick = (id: string) => {
  navigate(`/character/${id}/edit`);
};

const handleDeleteClick = (id: string) => {
  deleteCharacter(id);
};

const handleSelectClick = (id: string) => {
  selectCharacter(id);
};

const handleBroadcastClick = (id: string) => {
  startBroadcast(id);
};

const handleViewDetails = (id: string) => {
  navigate(`/character/${id}`);
};
```

### 4. Render the Component

```tsx
<CharacterDashboard
  characters={characters}
  selectedId={selectedId}
  isLoading={isLoading}
  error={error}
  onCreateClick={handleCreateClick}
  onEditClick={handleEditClick}
  onDeleteClick={handleDeleteClick}
  onSelectClick={handleSelectClick}
  onBroadcastClick={handleBroadcastClick}
  onViewDetails={handleViewDetails}
/>
```

---

## Full Page Example

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CharacterDashboard } from "@/features/character/components";
import type { CharacterPreset } from "@/shared/types/character";

export function CharacterPage() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<CharacterPreset[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load characters on mount
  useEffect(() => {
    loadCharacters();
  }, []);

  async function loadCharacters() {
    try {
      setIsLoading(true);
      const data = await fetchCharacters(); // Your API call
      setCharacters(data);
      setSelectedId(data[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectClick(id: string) {
    try {
      setIsSelecting(true);
      await selectCharacterApi(id); // Your API call
      setSelectedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Selection failed");
    } finally {
      setIsSelecting(false);
    }
  }

  async function handleDeleteClick(id: string) {
    try {
      setIsDeleting(true);
      await deleteCharacterApi(id); // Your API call
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) {
        setSelectedId(characters[0]?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <CharacterDashboard
      characters={characters}
      selectedId={selectedId}
      isLoading={isLoading}
      isSelecting={isSelecting}
      isDeleting={isDeleting}
      error={error}
      onCreateClick={() => navigate("/character/create")}
      onEditClick={(id) => navigate(`/character/${id}/edit`)}
      onDeleteClick={handleDeleteClick}
      onSelectClick={handleSelectClick}
      onBroadcastClick={(id) => {
        console.log("Starting broadcast with", id);
        // Your broadcast logic
      }}
      onViewDetails={(id) => navigate(`/character/${id}`)}
    />
  );
}
```

---

## Props Reference

### Required Props

```typescript
characters: CharacterPreset[]
// Array of character objects

selectedId: string | null
// ID of currently selected character

onCreateClick: () => void
// Handler for create button

onEditClick: (id: string) => void
// Handler for edit button

onDeleteClick: (id: string) => void
// Handler for delete button

onSelectClick: (id: string) => void
// Handler for select button
```

### Optional Props

```typescript
isSelecting?: boolean
// Show loading state on select button (default: false)

isDeleting?: boolean
// Show loading state on delete button (default: false)

isLoading?: boolean
// Show skeleton loader (default: false)

error?: string | null
// Display error message (default: null)

onBroadcastClick?: (id: string) => void
// Handler for broadcast button (default: undefined)

onViewDetails?: (id: string) => void
// Handler for view details button (default: undefined)
```

---

## Common Patterns

### With Zustand Store

```tsx
import { useCharacterStore } from "@/shared/stores/characterStore";

export function CharacterPage() {
  const characters = useCharacterStore((s) => s.characters);
  const selectedId = useCharacterStore((s) => s.selectedId);
  const selectCharacter = useCharacterStore((s) => s.selectCharacter);
  const removeCharacter = useCharacterStore((s) => s.removeCharacter);

  return (
    <CharacterDashboard
      characters={characters}
      selectedId={selectedId}
      onCreateClick={() => navigate("/character/create")}
      onEditClick={(id) => navigate(`/character/${id}/edit`)}
      onDeleteClick={(id) => {
        removeCharacter(id);
        deleteCharacterApi(id);
      }}
      onSelectClick={(id) => {
        selectCharacter(id);
        selectCharacterApi(id);
      }}
    />
  );
}
```

### With React Query

```tsx
import { useQuery, useMutation } from "@tanstack/react-query";

export function CharacterPage() {
  const { data: characters = [], isLoading } = useQuery({
    queryKey: ["characters"],
    queryFn: fetchCharacters,
  });

  const selectMutation = useMutation({
    mutationFn: selectCharacterApi,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCharacterApi,
  });

  return (
    <CharacterDashboard
      characters={characters}
      selectedId={selectMutation.data?.id ?? null}
      isLoading={isLoading}
      isSelecting={selectMutation.isPending}
      isDeleting={deleteMutation.isPending}
      onSelectClick={(id) => selectMutation.mutate(id)}
      onDeleteClick={(id) => deleteMutation.mutate(id)}
      // ... other handlers
    />
  );
}
```

---

## Styling Customization

### Override Tailwind Classes

The component uses Tailwind CSS utility classes. To customize:

1. **Change Colors:**
   - Edit the color variables in your Tailwind config
   - Or modify the component's className strings directly

2. **Change Spacing:**
   - Modify padding/margin classes in the component
   - Update gap values for spacing between elements

3. **Change Border Radius:**
   - Update rounded-* classes for different corner styles

### Example: Custom Color Scheme

```tsx
// In component, change:
// from: border-indigo-500/50 bg-indigo-500/10
// to:   border-blue-500/50 bg-blue-500/10

// Or create a wrapper component:
export function CustomCharacterDashboard(props) {
  return (
    <div className="theme-custom">
      <CharacterDashboard {...props} />
    </div>
  );
}
```

---

## Troubleshooting

### Component Not Rendering

**Problem:** Component shows blank or errors

**Solution:**
1. Verify `characters` array is not empty or provide empty array
2. Check `selectedId` matches a character id or is null
3. Ensure all required props are provided
4. Check browser console for TypeScript errors

### Styling Issues

**Problem:** Colors or spacing look different

**Solution:**
1. Verify Tailwind CSS is properly configured
2. Check that dark mode is enabled in tailwind.config.ts
3. Ensure @tailwindcss/forms plugin is installed
4. Clear build cache: `npm run build`

### Event Handlers Not Firing

**Problem:** Buttons don't respond to clicks

**Solution:**
1. Verify handlers are passed as props
2. Check handlers are functions, not async functions without await
3. Ensure event handlers have correct signatures
4. Check browser console for JavaScript errors

### Responsive Layout Issues

**Problem:** Layout doesn't adapt on mobile/tablet

**Solution:**
1. Verify viewport meta tag in HTML head
2. Test with browser dev tools responsive mode
3. Check Tailwind breakpoints match your needs
4. Ensure CSS is properly compiled

---

## Performance Tips

### 1. Memoize Character List

```tsx
const memoCharacters = useMemo(() => characters, [characters]);
```

### 2. Use useCallback for Handlers

```tsx
const handleSelectClick = useCallback((id: string) => {
  selectCharacter(id);
}, []);
```

### 3. Lazy Load Character Details

```tsx
const handleViewDetails = useCallback((id: string) => {
  // Load details on demand, not upfront
  navigate(`/character/${id}`);
}, []);
```

### 4. Optimize Re-renders

```tsx
// Only pass necessary data to component
<CharacterDashboard
  characters={characters}
  selectedId={selectedId}
  // Avoid passing entire objects if not needed
/>
```

---

## Testing

### Basic Test

```tsx
import { render, screen } from "@testing-library/react";
import { CharacterDashboard } from "./CharacterDashboard";

test("renders character dashboard", () => {
  render(
    <CharacterDashboard
      characters={[mockCharacter]}
      selectedId={mockCharacter.id}
      onCreateClick={jest.fn()}
      onEditClick={jest.fn()}
      onDeleteClick={jest.fn()}
      onSelectClick={jest.fn()}
    />
  );

  expect(screen.getByText("내 AI 캐릭터")).toBeInTheDocument();
});
```

### Test User Interactions

```tsx
import { render, screen, fireEvent } from "@testing-library/react";

test("calls onSelectClick when button clicked", () => {
  const handleSelect = jest.fn();
  render(
    <CharacterDashboard
      characters={[mockCharacter]}
      selectedId={null}
      onCreateClick={jest.fn()}
      onEditClick={jest.fn()}
      onDeleteClick={jest.fn()}
      onSelectClick={handleSelect}
    />
  );

  fireEvent.click(screen.getByText("선택"));
  expect(handleSelect).toHaveBeenCalledWith(mockCharacter.id);
});
```

---

## Documentation Links

- **Design Guide:** `DESIGN_GUIDE_CharacterDashboard.md`
- **Component Showcase:** `COMPONENT_SHOWCASE_CharacterDashboard.md`
- **TypeScript Guide:** `TYPESCRIPT_IMPLEMENTATION_CharacterDashboard.md`
- **Visual Reference:** `VISUAL_REFERENCE_CharacterDashboard.md`
- **Summary:** `SUMMARY_CharacterDashboard_Enhancement.md`

---

## Need Help?

1. Check the design guide for styling details
2. Review component showcase for visual examples
3. See TypeScript guide for implementation patterns
4. Check visual reference for color/spacing values
5. Look at examples in this quickstart

---

**Last Updated:** April 23, 2026
**Version:** 2.0
