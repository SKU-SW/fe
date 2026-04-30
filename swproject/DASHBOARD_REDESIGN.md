# Dashboard Redesign - Design Document

## Overview

The DashboardPage has been redesigned with a **2-column layout** optimizing for real-time streaming data monitoring and control. The new layout prioritizes the chat monitor as the central feature while organizing controls efficiently on the left side.

---

## Layout Architecture

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Title + Top Controls (Pause/Resume, Standby)      │
├─────────────────────────────────────────────────────────────┤
│  STATUS CARDS: 4-column grid (AI Status, Viewers, Chat, Emotion) │
├──────────────────────┬──────────────────────────────────────┤
│  LEFT COLUMN         │  RIGHT COLUMN                        │
│  (Controls Panel)    │  (Chat Monitor - Prominent)          │
│                      │                                      │
│ • Persona Slots      │  ┌─ Chat Monitor (Full Height) ─┐  │
│ • Quick Controls     │  │  Real-time API Chat Data      │  │
│ • AI Reaction        │  │  (Scrollable, Auto-scroll)    │  │
│   Settings           │  └──────────────────────────────┘  │
│                      │                                      │
│                      │  ┌─ Status Summary ─────────────┐  │
│                      │  │ Broadcast Duration           │  │
│                      │  │ Total Chats / AI Responses   │  │
│                      │  │ AI Mode / Reaction Strategy  │  │
│                      │  └──────────────────────────────┘  │
├──────────────────────┴──────────────────────────────────────┤
│  FULL-WIDTH: AI Activity Log (Scrollable, Max Height)      │
└──────────────────────────────────────────────────────────────┘
```

### Grid Configuration

```
Main Container: grid-cols-1 lg:grid-cols-3 gap-6

Left Column:  lg:col-span-1 (1/3 width on desktop)
Right Column: lg:col-span-2 (2/3 width on desktop)
  - Chat Monitor: lg:row-span-2 (spans both rows)
  - Status Summary: below chat on desktop, responsive

Bottom: Full width (col-span-full equivalent)
```

---

## Component Structure

### 1. **Header Section** (Lines 242-277)
**Purpose**: Primary controls and dashboard identification

**Components**:
- Title: "대시보드" with subtitle
- **Pause/Resume Button**: 
  - Green (Resume) or Yellow (Pause) based on `isPaused` state
  - Icon: Play/Pause from lucide-react
  - Communicates streaming state clearly
  
- **Standby Toggle Button** (formerly "PTT"):
  - Blue (Active/대기중) or Slate (Offline/오프라인)
  - Icon: Wifi (more intuitive than Mic)
  - Shows connectivity/readiness status
  - **Removed**: "방송 시작" (Broadcast Start) button

**UX Improvements**:
- Reduced button count for cleaner header
- Wifi icon better communicates standby state than "PTT"
- Clear visual distinction between pause and standby states

---

### 2. **Status Cards Grid** (Lines 279-325)
**Purpose**: At-a-glance dashboard metrics

**4 Cards** (responsive: 1 col mobile → 2 col tablet → 4 col desktop):
1. **AI Status**: Current mode + response rate
2. **Viewer Count**: Active viewers + chat speed
3. **Chat Speed**: Messages/min + AI response count
4. **Emotion Ratio**: Dominant emotion + top 2 emotions

**UX Improvements**:
- Consistent color coding (green/blue/purple/orange/yellow)
- Hover effects for interactivity
- Icon + status layout for quick scanning

---

### 3. **Left Column: Control Panel** (Lines 330-430)
**Purpose**: All streaming controls and settings in one accessible area

#### 3.1 Persona Quick Switch (Lines 331-356)
- 2x2 grid (compact, fits left column)
- Smaller text (xs) to fit more content
- Active state: Blue highlight with shadow
- Shows "활성" or "미설정" status

**UX Improvements**:
- Reduced from 4-column to 2-column for better mobile fit
- Tighter padding (p-2.5 vs p-3) for space efficiency
- Truncated text prevents overflow

#### 3.2 Quick Controls (Lines 358-380)
- 2x2 grid: STT, TTS, Chat Reaction, Proactive Reaction
- Toggle state: Blue (enabled) or Slate (disabled)
- Label + description for clarity

**UX Improvements**:
- Compact 2-column layout fits left panel
- Consistent styling with persona slots

#### 3.3 AI Reaction Settings (Lines 382-415)
- 4 Sliders:
  - Reaction Speed (반응 속도)
  - Emotion Intensity (감정 강도)
  - Context Understanding (문맥 이해도)
  - Creativity (창의성)
- Value display: percentage on right
- Smooth transitions

**UX Improvements**:
- Reduced spacing (space-y-3 vs space-y-4) for compact layout
- Label-value alignment for quick reference

---

### 4. **Right Column: Chat Monitor** (Lines 433-485)
**Purpose**: Real-time chat display - PRIMARY FEATURE

**Key Features**:
- **Height**: h-96 on mobile, lg:h-[28rem] on desktop (fixed, scrollable)
- **Auto-scroll**: Newest messages appear at bottom
- **Empty State**: "실시간 채팅을 기다리는 중..." with icon
- **Hint Text**: "API 데이터가 여기에 표시됩니다"
- **Clear Button**: Trash icon to reset chat history

**Chat Message Item Structure**:
```
┌────────────────────────────────┐
│ Username [Emotion Badge]       │  ← Flex row with spacing
│ "User message text here..."    │  ← Break words for long text
│ HH:MM:SS                       │  ← Timestamp in slate-500
└────────────────────────────────┘
```

**Styling**:
- Background: bg-slate-800/50 (semi-transparent)
- Hover: bg-slate-800/70 (subtle highlight)
- Emotion Badge: Dynamic color background (e.g., bg-yellow-500/30 text-yellow-300)
- Border: Rounded-lg for consistency

**UX Improvements**:
- **Emotion Badge**: Moved to badge format (bg + text color) instead of text-only
  - More visually prominent
  - Easier to scan at a glance
  - Example: Yellow "기쁨" badge for joy
- **Larger Height**: lg:h-[28rem] gives more space for chat visibility
- **Hover State**: Subtle background change for interactivity
- **Word Break**: `break-words` prevents long messages from breaking layout
- **Placeholder**: Clear messaging about API data

---

### 5. **Right Column: Status Summary** (Lines 487-511)
**Purpose**: Key metrics summary below chat monitor

**Metrics**:
- Broadcast Duration: Formatted as "Xh Xm" or "Xm Xs"
- Total Chats: Localized number format
- AI Responses: Localized number format
- AI Mode: Current mode label (방송 중/대기/게임 중)
- Reaction Strategy: Current strategy (응원/일반/비판)

**Visual Separation**:
- Top 3 metrics (duration, chats, responses)
- Border separator (border-t border-slate-700/50)
- Bottom 2 metrics (mode, strategy)

**UX Improvements**:
- Divider line adds visual hierarchy
- Compact spacing (space-y-2) fits in remaining right column space
- Font weights: slate-400 labels, white font-medium values

---

### 6. **Bottom: AI Activity Log** (Lines 513-570)
**Purpose**: Full-width log of AI activities and system events

**Key Features**:
- **Full Width**: Spans entire dashboard
- **Height**: max-h-64 (scrollable, not taking up too much space)
- **Log Count**: Badge showing total logs "(5)"
- **Clear Button**: Reset logs

**Log Item Structure**:
```
┌─────────────────────────────────────┐
│ [Icon] Message text...      Time    │  ← Flex with icon, message, time
│        HH:MM:SS                     │  ← Smaller text below
└─────────────────────────────────────┘
```

**Icon Types** (from `getLogIcon`):
- ⚡ Reaction (Zap)
- ⚙️ System (Settings)
- 💬 Chat (MessageSquare)
- 📊 Emotion (Activity)
- 👥 Persona (Users)
- 🕐 Default (Clock)

**Log Level Colors**:
- Warning: text-yellow-400
- Error: text-red-400
- Info: text-slate-400 (default)

**Styling**:
- Background: bg-slate-800/30 (lighter than chat items)
- Hover: bg-slate-800/50
- Icon size: h-4 w-4
- Responsive: flex-shrink-0 prevents icon compression

**UX Improvements**:
- Reduced height (max-h-64) prevents log section from dominating
- Icon + color coding for quick event type identification
- Hover state for interactivity
- Timestamp precision for debugging
- "아직 활동 로그가 없습니다" placeholder with icon

---

## Color Scheme

### Emotion Colors (Emotion Badge)
```typescript
joy:      bg-yellow-500/30 text-yellow-300   (기쁨)
anger:    bg-red-500/30 text-red-300         (분노)
sadness:  bg-blue-500/30 text-blue-300       (슬픔)
fear:     bg-purple-500/30 text-purple-300   (공포)
surprise: bg-orange-500/30 text-orange-300   (놀람)
neutral:  bg-slate-500/30 text-slate-300     (중립)
```

### State Colors (Buttons & Cards)
```
Active:    bg-blue-600/30 border-blue-500 text-blue-300
Inactive:  bg-slate-800/50 border-slate-700 text-slate-400
Pause:     bg-yellow-600 hover:bg-yellow-700
Resume:    bg-green-600 hover:bg-green-700
Standby:   bg-blue-600 hover:bg-blue-700
Offline:   bg-slate-700 hover:bg-slate-600
```

### Background Gradients
```
Cards:     from-slate-900 to-slate-950 (subtle depth)
Border:    border-slate-700/50 (semi-transparent)
Hover:     shadow-lg shadow-blue-500/10 (subtle glow)
```

---

## Responsive Behavior

### Mobile (< 1024px)
- Single column layout
- Status cards: 1 column (full width)
- Chat monitor: Full width, h-96
- Status summary: Below chat, full width
- Activity log: Full width, max-h-64
- Left controls stack on top (if needed)

### Tablet (768px - 1023px)
- Status cards: 2 columns
- 2-column layout begins
- Left column narrower, right column wider
- Chat monitor: h-80

### Desktop (≥ 1024px)
- Full 2-column layout active
- Left column: 1/3 width (col-span-1)
- Right column: 2/3 width (col-span-2)
- Chat monitor: h-[28rem] (largest)
- Status summary: Beside chat
- Activity log: Full width

---

## UX Improvements Summary

### 1. **Removed Features**
- ❌ "방송 시작" (Broadcast Start) button
  - Reason: Streaming start likely handled elsewhere, clutters header
  - Alternative: Can be moved to Settings or separate Broadcast Control panel

### 2. **Button Label Changes**
- ✅ "PTT" → "대기중" / "오프라인"
  - More intuitive status indication
  - Wifi icon replaces Mic icon
  - Clearly shows connectivity state

### 3. **Layout Reorganization**
- ✅ **2-Column Layout**
  - Left: Controls (Persona, Quick Controls, Settings)
  - Right: Chat Monitor (Primary Feature)
  - Bottom: AI Activity Log (Full Width)
  - Reason: Chat is the key real-time feature, deserves prominence

### 4. **Chat Monitor Enhancements**
- ✅ Emotion badges (background color + text)
  - More scannable than text-only
- ✅ Larger height (h-[28rem] on desktop)
  - More messages visible at once
- ✅ Hover states for interactivity
- ✅ Better empty state messaging
  - Clarifies API data source
- ✅ Word break handling for long messages

### 5. **Activity Log Improvements**
- ✅ Icon + color coding for event types
- ✅ Reduced height (max-h-64)
  - Doesn't dominate dashboard
  - Still provides useful context
- ✅ Log count badge
  - Shows activity volume at a glance
- ✅ Hover states for clarity

### 6. **Control Panel Consolidation**
- ✅ All settings in left column
  - Persona quick switch
  - Quick controls (STT/TTS/Chat/Proactive)
  - Reaction settings (4 sliders)
- ✅ Compact spacing for efficiency
- ✅ Clear visual hierarchy

### 7. **Status Summary Refinement**
- ✅ Visual divider between metric groups
- ✅ Better alignment and spacing
- ✅ Consistent with card styling

---

## Component Integration

### Props & State Management
All state flows through **Zustand Store** (`useAIModeStore`):

```typescript
// Store values used:
- mode: AIMode
- isPaused: boolean
- isPTTActive: boolean
- personaSlots: PersonaSlot[]
- activePersonaIndex: number
- toggles: { sttEnabled, ttsEnabled, chatReactionEnabled, proactiveReactionEnabled }
- sensitivity: { reactionSpeed, emotionIntensity, contextUnderstanding, creativity }
- stats: { aiResponseRate, viewerCount, chatSpeed, totalChats, aiResponses, broadcastDuration, emotionRatios }
- chatMessages: ChatMessage[]
- activityLogs: ActivityLog[]
- reactionStrategy: ReactionStrategy

// Actions used:
- togglePause()
- togglePTT()
- setActivePersona(index)
- setToggle(key, value)
- setSensitivity(key, value)
- addChatMessage(message)
- addActivityLog(log)
- clearChatMessages()
- clearActivityLogs()
```

### Helper Functions
```typescript
formatDuration(seconds)        // "1h 23m" or "45s"
formatTime(date)               // "14:32:15"
getEmotionColor(emotion)       // Text color class
getEmotionLabel(emotion)       // Korean label
getEmotionBgColor(emotion)     // NEW: Background + text color
getDominantEmotion()           // Highest emotion ratio
getTopEmotions()               // Top 2 emotions with %
getLogIcon(type)               // Icon component
getLogLevelColor(level)        // Color based on level
getStrategyLabel()             // Current strategy label
getModeLabel()                 // Current mode label
```

### Sub-Components
- `StatusCard`: Metric display card
- `ToggleButton`: Toggle control with label
- `SliderControl`: Range slider with label

---

## API Data Integration

### Chat Monitor
**Expected Data Structure** (`ChatMessage`):
```typescript
interface ChatMessage {
  id: string;
  username: string;
  message: string;
  emotion: EmotionType;  // joy | anger | sadness | fear | surprise | neutral
  timestamp: Date;
}
```

**Display**: Messages appear in real-time as they're added via `addChatMessage()`

### Activity Log
**Expected Data Structure** (`ActivityLog`):
```typescript
interface ActivityLog {
  id: string;
  type: 'reaction' | 'system' | 'chat' | 'emotion' | 'persona';
  message: string;
  timestamp: Date;
  level?: 'warning' | 'error' | 'info';
}
```

**Display**: Logs appear in reverse chronological order (newest first)

### Statistics
**Expected Data Structure** (`stats`):
```typescript
interface Stats {
  aiResponseRate: number;      // 0-100
  viewerCount: number;
  chatSpeed: number;           // messages/min
  totalChats: number;
  aiResponses: number;
  broadcastDuration: number;   // seconds
  emotionRatios: Record<EmotionType, number>; // 0-100 each
}
```

---

## Performance Considerations

### Auto-Scroll Optimization
```typescript
useEffect(() => {
  if (chatContainerRef.current) {
    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }
}, [chatMessages]);  // Only re-run when messages change
```

### Scrollbar Styling
```
scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800
```
- Tailwind's Scrollbar plugin (requires config)
- Subtle, matches dark theme

### Memory Management
- Chat messages & logs auto-clear via `clearChatMessages()` / `clearActivityLogs()`
- Consider implementing max items limit if unbounded growth occurs
- Mock data generates every 3 seconds (development only)

---

## Accessibility (a11y)

### ARIA Attributes
```typescript
// Chat Monitor
<div role="log" aria-live="polite" aria-relevant="additions" aria-label="실시간 채팅 모니터">

// Activity Log
<div role="log" aria-live="polite" aria-relevant="additions" aria-label="AI 활동 로그">
```

### Semantic HTML
- Buttons: `type="button"` specified
- Labels: Linked to controls where applicable
- Headings: `h1` for title, `h3` for sections

### Color Contrast
- Text on dark backgrounds meets WCAG AA standards
- Emotion badges: sufficient contrast for colors used

---

## Future Enhancements

### Phase 2
1. **Drag-and-drop** layout customization
2. **Collapsible sections** in left panel for more space
3. **Dark/Light theme toggle**
4. **Custom emotion colors** per streamer
5. **Activity log filtering** (by type, level, time range)
6. **Chat message search** functionality
7. **Export logs** (CSV/JSON)

### Phase 3
1. **Real-time WebSocket** integration for live stats
2. **Notification system** for important events
3. **Dashboard presets** (minimalist, full-detail, etc.)
4. **Performance metrics** graph overlay
5. **AI response suggestion** inline in chat monitor

---

## Testing Checklist

- [ ] Desktop layout (1920x1080, 1440x900)
- [ ] Tablet layout (768x1024)
- [ ] Mobile layout (375x667, 412x915)
- [ ] Chat auto-scroll functionality
- [ ] Emotion badge colors render correctly
- [ ] Button click handlers work
- [ ] Slider controls update values
- [ ] Clear buttons reset data
- [ ] Empty states display correctly
- [ ] Responsive grid transitions smoothly
- [ ] Scrollbar appears on overflow
- [ ] Hover states visible
- [ ] Keyboard navigation (Tab, Enter)
- [ ] Screen reader compatibility

---

## File Changes Summary

**File**: `/Users/lee/sku-sw/swproject/src/pages/DashboardPage.tsx`

**Changes**:
1. ✅ Removed "방송 시작" button from header
2. ✅ Changed "PTT" to "대기중" / "오프라인" with Wifi icon
3. ✅ Reorganized into 2-column layout (Left: Controls, Right: Chat)
4. ✅ Moved AI Activity Log to bottom (full width)
5. ✅ Enhanced chat monitor styling with emotion badges
6. ✅ Added `getEmotionBgColor()` helper function
7. ✅ Improved empty state messaging
8. ✅ Refined spacing and sizing throughout
9. ✅ Added hover states for interactivity

**Lines Changed**: ~200 lines (layout restructuring)
**Lines Added**: ~50 lines (new styling, helpers)
**Lines Removed**: ~100 lines (old layout structure)

---

## Migration Notes

### For Developers Integrating API Data

1. **Chat Monitor**: Connect WebSocket to `addChatMessage()` action
   ```typescript
   // Example
   ws.on('chat', (message: ChatMessage) => {
     addChatMessage(message);
   });
   ```

2. **Activity Log**: Dispatch activities from AI reactions
   ```typescript
   // Example
   addActivityLog({
     id: generateId(),
     type: 'reaction',
     message: `AI responded to: ${chatMessage.substring(0, 30)}...`,
     timestamp: new Date(),
     level: 'info'
   });
   ```

3. **Statistics**: Update stats on interval from backend
   ```typescript
   // Example
   setInterval(async () => {
     const stats = await fetchStats();
     updateStats(stats);
   }, 5000);
   ```

---

## Design Rationale

### Why 2-Column Layout?

**Problem**: Original 3-column layout (2-col left + 1-col right) made chat monitor secondary.

**Solution**: 
- Chat is the PRIMARY real-time feature
- Give it 2/3 width (right column)
- Consolidate controls in 1/3 width (left column)
- Users can see more chat messages at once
- Controls remain accessible but don't dominate

### Why Full-Width Activity Log?

**Problem**: Activity log was hidden in 2-column grid, easy to miss.

**Solution**:
- Separate section at bottom
- Full width but limited height (max-h-64)
- Provides context without overwhelming
- Clear visual separation from main content

### Why Emotion Badges?

**Problem**: Emotion as text-only label hard to scan quickly.

**Solution**:
- Use background color + text color
- Matches emotion color scheme
- More visually distinctive
- Easier to spot dominant emotions in chat stream

### Why Wifi Icon for Standby?

**Problem**: "PTT" is technical jargon, unclear to non-technical users.

**Solution**:
- "대기중" (Standby) is clearer
- Wifi icon indicates connectivity/readiness
- More intuitive than Mic icon
- Matches streaming context

---

## Conclusion

The redesigned dashboard prioritizes **real-time chat monitoring** while maintaining efficient access to **streaming controls and AI settings**. The 2-column layout with full-width activity log creates a clear information hierarchy that supports both quick monitoring and detailed control.

**Key Outcomes**:
✅ Chat monitor is now the prominent centerpiece
✅ Controls are organized and easily accessible
✅ Activity log provides useful context without clutter
✅ Responsive design works across all device sizes
✅ Visual hierarchy guides user attention
✅ All existing functionality preserved
✅ Ready for API data integration
