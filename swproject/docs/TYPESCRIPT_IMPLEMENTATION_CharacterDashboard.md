# CharacterDashboard - TypeScript Implementation Guide

## Type Definitions

### Main Props Interface

```typescript
interface CharacterDashboardProps {
  // Data
  characters: CharacterPreset[];
  selectedId: string | null;
  
  // Loading & Error States
  isSelecting?: boolean;
  isDeleting?: boolean;
  isLoading?: boolean;
  error?: string | null;
  
  // Event Handlers (Required)
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string) => void;
  onSelectClick: (id: string) => void;
  
  // Event Handlers (Optional)
  onBroadcastClick?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}
```

### Related Types from character.ts

```typescript
// Character Data Structure
interface CharacterPreset {
  id: string;
  name: string;
  info: CharacterInfo;
  broadcastSettings: BroadcastSettings;
  createdAt: string;
}

// Character Information
interface CharacterInfo {
  gender: UiGender;                    // "male" | "female"
  name: string;
  callSign: string;                    // Comma-separated call words
  appearancePresetId: string;
  voicePresetId: string;
  speechStyle: UiSpeechStyle;
  personality: UiPersonality;
  persona: Persona;                    // "game_specialist" | etc.
}

// Persona Types
type Persona = 
  | "game_specialist"
  | "humor_entertainment"
  | "focused_serious"
  | "chat_social";

// Gender Types
type UiGender = "male" | "female";

// Broadcast Settings
interface BroadcastSettings {
  chatSensitivity: SensitivityLevel;
  silenceIntervalSeconds: number;
  ttsSpeed: number;
  ttsVolume: number;
}
```

---

## Helper Functions

### 1. Persona Label Mapping

```typescript
/**
 * Convert persona enum to Korean label
 * @param persona - Persona type
 * @returns Localized persona label
 */
function getPersonaLabel(persona?: string): string {
  const labels: Record<string, string> = {
    game_specialist: "게임 특화",
    humor_entertainment: "유머/예능",
    focused_serious: "진중/집중",
    chat_social: "잡담/소통",
  };
  return labels[persona || ""] || "지정 안 됨";
}

// Usage
const label = getPersonaLabel("game_specialist"); // "게임 특화"
```

### 2. Persona Color Mapping

```typescript
/**
 * Get Tailwind color class for persona type
 * @param persona - Persona type
 * @returns Tailwind text color class
 */
function getPersonaColor(persona?: string): string {
  const colors: Record<string, string> = {
    game_specialist: "text-purple-400",
    humor_entertainment: "text-pink-400",
    focused_serious: "text-blue-400",
    chat_social: "text-emerald-400",
  };
  return colors[persona || ""] || "text-slate-400";
}

// Usage
const colorClass = getPersonaColor("humor_entertainment"); // "text-pink-400"
```

### 3. Call Words Parser

```typescript
/**
 * Parse comma-separated call words from callSign string
 * @param callSign - Comma-separated call words
 * @returns Array of trimmed call words
 */
function parseCallWords(callSign: string): string[] {
  return callSign
    .split(",")
    .map((word) => word.trim())
    .filter((word) => word.length > 0);
}

// Usage
const words = parseCallWords("야, 도와줘, 여기봐");
// ["야", "도와줘", "여기봐"]
```

---

## Component Sub-Components

### GenderBadge Component

```typescript
interface GenderBadgeProps {
  gender: string;
}

function GenderBadge({ gender }: GenderBadgeProps) {
  const isFemale = gender === "female";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-200">
      {isFemale ? "👩 여성" : "👨 남성"}
    </span>
  );
}
```

### CallWordBadges Component

```typescript
interface CallWordBadgesProps {
  callWords: string[];
}

function CallWordBadges({ callWords }: CallWordBadgesProps) {
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

### LoadingSkeleton Component

```typescript
function LoadingSkeleton(): JSX.Element {
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

### ErrorState Component

```typescript
interface ErrorStateProps {
  error: string;
}

function ErrorState({ error }: ErrorStateProps): JSX.Element {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center">
      <p className="text-sm text-red-300">{error}</p>
    </div>
  );
}
```

### EmptyState Component

```typescript
interface EmptyStateProps {
  onCreateClick: () => void;
}

function EmptyState({ onCreateClick }: EmptyStateProps): JSX.Element {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
      <div className="mb-4 flex justify-center">
        <div className="rounded-full bg-indigo-500/10 p-4">
          <Sparkles className="h-8 w-8 text-indigo-400" />
        </div>
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">
        아직 생성된 캐릭터가 없습니다
      </h3>
      <p className="mb-6 text-sm text-slate-400">
        방송을 함께할 AI 동료를 만들어보세요. 외모, 목소리, 페르소나를 
        조합해 캐릭터를 구성할 수 있습니다.
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

## Integration Example

### In a Page Component

```typescript
// src/pages/CharacterPage.tsx

import { useState, useEffect } from "react";
import { CharacterDashboard } from "@/features/character/components";
import type { CharacterPreset } from "@/shared/types/character";

export function CharacterPage() {
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
      setError(null);
      const data = await fetchCharacters();
      setCharacters(data);
      
      // Set first character as selected if none selected
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load characters";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSelectCharacter(id: string) {
    try {
      setIsSelecting(true);
      setError(null);
      await selectCharacter(id);
      setSelectedId(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to select character";
      setError(message);
    } finally {
      setIsSelecting(false);
    }
  }

  async function handleDeleteCharacter(id: string) {
    try {
      setIsDeleting(true);
      setError(null);
      await deleteCharacter(id);
      
      // Remove from list
      setCharacters((prev) => prev.filter((c) => c.id !== id));
      
      // Clear selection if deleted character was selected
      if (selectedId === id) {
        setSelectedId(characters.length > 1 ? characters[0].id : null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete character";
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCreateClick() {
    // Navigate to character creation
    navigate("/character/create");
  }

  function handleEditClick(id: string) {
    // Navigate to character edit
    navigate(`/character/${id}/edit`);
  }

  function handleBroadcastClick(id: string) {
    // Start broadcast with selected character
    startBroadcast(id);
  }

  function handleViewDetails(id: string) {
    // Navigate to character details
    navigate(`/character/${id}`);
  }

  return (
    <CharacterDashboard
      characters={characters}
      selectedId={selectedId}
      isLoading={isLoading}
      isSelecting={isSelecting}
      isDeleting={isDeleting}
      error={error}
      onCreateClick={handleCreateClick}
      onEditClick={handleEditClick}
      onDeleteClick={handleDeleteCharacter}
      onSelectClick={handleSelectCharacter}
      onBroadcastClick={handleBroadcastClick}
      onViewDetails={handleViewDetails}
    />
  );
}
```

---

## State Management Pattern

### Using Zustand Store

```typescript
// src/shared/stores/characterStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CharacterPreset } from "@/shared/types/character";

interface CharacterStore {
  characters: CharacterPreset[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCharacters: (characters: CharacterPreset[]) => void;
  selectCharacter: (id: string) => void;
  addCharacter: (character: CharacterPreset) => void;
  updateCharacter: (id: string, updates: Partial<CharacterPreset>) => void;
  removeCharacter: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      characters: [],
      selectedId: null,
      isLoading: false,
      error: null,

      setCharacters: (characters) => {
        set({ characters });
        // Auto-select first character if none selected
        set((state) => ({
          selectedId: state.selectedId || (characters[0]?.id ?? null),
        }));
      },

      selectCharacter: (id) => set({ selectedId: id }),

      addCharacter: (character) =>
        set((state) => ({
          characters: [...state.characters, character],
          selectedId: state.selectedId || character.id,
        })),

      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      removeCharacter: (id) =>
        set((state) => {
          const filtered = state.characters.filter((c) => c.id !== id);
          return {
            characters: filtered,
            selectedId:
              state.selectedId === id
                ? filtered[0]?.id ?? null
                : state.selectedId,
          };
        }),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      reset: () =>
        set({
          characters: [],
          selectedId: null,
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: "character-storage",
    }
  )
);

// Usage in component
const characters = useCharacterStore((s) => s.characters);
const selectedId = useCharacterStore((s) => s.selectedId);
const selectCharacter = useCharacterStore((s) => s.selectCharacter);
```

---

## Event Handler Patterns

### Selection Handler

```typescript
async function handleSelectClick(id: string) {
  try {
    setIsSelecting(true);
    setError(null);
    
    // Call API
    const response = await selectCharacterApi(id);
    
    // Update local state
    setSelectedId(id);
    
    // Optional: Show success toast
    toast.success("캐릭터가 선택되었습니다");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "선택 실패";
    setError(message);
    toast.error(message);
  } finally {
    setIsSelecting(false);
  }
}
```

### Deletion Handler

```typescript
async function handleDeleteClick(id: string) {
  // Confirmation dialog
  if (!window.confirm("이 캐릭터를 삭제하시겠습니까?")) {
    return;
  }

  try {
    setIsDeleting(true);
    setError(null);
    
    // Call API
    await deleteCharacterApi(id);
    
    // Update local state
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    
    // Clear selection if needed
    if (selectedId === id) {
      setSelectedId(characters[0]?.id ?? null);
    }
    
    // Show success toast
    toast.success("캐릭터가 삭제되었습니다");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "삭제 실패";
    setError(message);
    toast.error(message);
  } finally {
    setIsDeleting(false);
  }
}
```

### Navigation Handler

```typescript
function handleEditClick(id: string) {
  const character = characters.find((c) => c.id === id);
  if (!character) return;
  
  // Navigate to edit page with character data
  navigate(`/character/${id}/edit`, {
    state: { character },
  });
}
```

---

## Error Handling

### API Error Types

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Handle different error scenarios
function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("401")) {
      return "인증이 필요합니다. 다시 로그인해주세요.";
    }
    if (error.message.includes("403")) {
      return "이 작업을 수행할 권한이 없습니다.";
    }
    if (error.message.includes("404")) {
      return "캐릭터를 찾을 수 없습니다.";
    }
    if (error.message.includes("409")) {
      return "캐릭터 이름이 이미 존재합니다.";
    }
    if (error.message.includes("500")) {
      return "서버 오류가 발생했습니다. 나중에 다시 시도해주세요.";
    }
    return error.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}
```

---

## Performance Optimizations

### Memoization

```typescript
import { useMemo, useCallback } from "react";

// Memoize character lookup
const selectedCharacter = useMemo(
  () => characters.find((c) => c.id === selectedId),
  [characters, selectedId]
);

// Memoize handlers
const handleSelect = useCallback(
  (id: string) => {
    selectCharacter(id);
  },
  []
);

// Memoize derived data
const characterCount = useMemo(
  () => characters.length,
  [characters]
);
```

### List Rendering

```typescript
// Use key prop correctly
<div className="space-y-3">
  {characters.map((character) => (
    <div key={character.id}>
      {/* Character card */}
    </div>
  ))}
</div>
```

---

## Testing Patterns

### Unit Tests

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterDashboard } from "./CharacterDashboard";
import type { CharacterPreset } from "@/shared/types/character";

describe("CharacterDashboard", () => {
  const mockCharacter: CharacterPreset = {
    id: "1",
    name: "Test Character",
    info: {
      gender: "female",
      name: "Test",
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
  };

  it("renders character dashboard", () => {
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
    expect(screen.getByText("Test Character")).toBeInTheDocument();
  });

  it("calls onSelectClick when select button is clicked", () => {
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

  it("displays empty state when no characters", () => {
    render(
      <CharacterDashboard
        characters={[]}
        selectedId={null}
        onCreateClick={jest.fn()}
        onEditClick={jest.fn()}
        onDeleteClick={jest.fn()}
        onSelectClick={jest.fn()}
      />
    );

    expect(
      screen.getByText("아직 생성된 캐릭터가 없습니다")
    ).toBeInTheDocument();
  });
});
```

---

**Last Updated:** April 23, 2026
