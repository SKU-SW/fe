# Dashboard Redesign - Component Reference Guide

## Quick Reference

### Updated Components

#### 1. Header Controls
```jsx
{/* Pause/Resume Button */}
<button className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
  isPaused
    ? 'bg-green-600 hover:bg-green-700 text-white'
    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
}`}>
  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
  {isPaused ? '재개' : '일시정지'}
</button>

{/* Standby Toggle (NEW - replaces PTT) */}
<button className={`px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
  isPTTActive
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
}`}>
  <Wifi className="h-4 w-4" />
  {isPTTActive ? '대기중' : '오프라인'}
</button>
```

**Changes**:
- ✅ Removed "방송 시작" button
- ✅ Changed icon from Mic to Wifi
- ✅ Changed label from "PTT" to "대기중"/"오프라인"

---

#### 2. Chat Monitor (Enhanced)
```jsx
<div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4 lg:row-span-2">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
      <MessageSquare className="h-4 w-4 text-green-400" />
      실시간 채팅 모니터
    </h3>
    <button
      type="button"
      onClick={clearChatMessages}
      className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
    >
      <Trash2 className="h-3 w-3" />
      초기화
    </button>
  </div>
  <div
    ref={chatContainerRef}
    role="log"
    aria-live="polite"
    aria-relevant="additions"
    aria-label="실시간 채팅 모니터"
    className="h-96 lg:h-[28rem] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
  >
    {chatMessages.length === 0 ? (
      <div className="text-center text-slate-500 py-12 flex flex-col items-center justify-center h-full">
        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">실시간 채팅을 기다리는 중...</p>
        <p className="text-xs mt-1 opacity-60">API 데이터가 여기에 표시됩니다</p>
      </div>
    ) : (
      chatMessages.map((msg: ChatMessage) => (
        <div key={msg.id} className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800/70 transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-blue-400 truncate">{msg.username}</span>
            {/* NEW: Emotion Badge with background color */}
            <span className={`text-xs px-2 py-0.5 rounded ${getEmotionBgColor(msg.emotion)}`}>
              {getEmotionLabel(msg.emotion)}
            </span>
          </div>
          <p className="text-sm text-slate-300 break-words">{msg.message}</p>
          <p className="text-xs text-slate-500 mt-1.5">{formatTime(msg.timestamp)}</p>
        </div>
      ))
    )}
  </div>
</div>
```

**Key Changes**:
- ✅ Title: "채팅 모니터" → "실시간 채팅 모니터"
- ✅ Height: h-96 mobile, lg:h-[28rem] desktop (larger)
- ✅ Emotion: Text color → Background badge with color
- ✅ Empty state: Better messaging with icon
- ✅ Hover: Added bg-slate-800/70 transition
- ✅ Word break: `break-words` for long messages
- ✅ Timestamp: Moved to bottom, better spacing

---

#### 3. New Helper Function
```typescript
// NEW: Emotion background color for badges
const getEmotionBgColor = (emotion: EmotionType): string => {
  const bgColorMap: Record<EmotionType, string> = {
    joy: 'bg-yellow-500/30 text-yellow-300',
    anger: 'bg-red-500/30 text-red-300',
    sadness: 'bg-blue-500/30 text-blue-300',
    fear: 'bg-purple-500/30 text-purple-300',
    surprise: 'bg-orange-500/30 text-orange-300',
    neutral: 'bg-slate-500/30 text-slate-300',
  };
  return bgColorMap[emotion];
};
```

---

#### 4. Layout Grid Structure
```jsx
{/* 2-Column Main Layout */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* LEFT COLUMN: 1/3 width on desktop */}
  <div className="lg:col-span-1 space-y-6">
    {/* Persona Slots */}
    {/* Quick Controls */}
    {/* AI Reaction Settings */}
  </div>

  {/* RIGHT COLUMN: 2/3 width on desktop */}
  <div className="lg:col-span-2 space-y-6">
    {/* Chat Monitor - spans both rows */}
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4 lg:row-span-2">
      {/* Chat content */}
    </div>

    {/* Status Summary - below chat on desktop, side-by-side on mobile */}
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4">
      {/* Status content */}
    </div>
  </div>
</div>

{/* FULL WIDTH: AI Activity Log */}
<div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4">
  {/* Activity log content */}
</div>
```

**Grid Ratios**:
- Desktop (lg): 1 col (33%) + 2 cols (67%)
- Tablet/Mobile: 1 col (100%) stacked

---

#### 5. Activity Log (Improved)
```jsx
<div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-lg p-4">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
      <Activity className="h-4 w-4 text-purple-400" />
      AI 활동 로그
      {/* NEW: Log count badge */}
      <span className="text-xs text-slate-500 font-normal ml-1">({activityLogs.length})</span>
    </h3>
    <button
      type="button"
      onClick={clearActivityLogs}
      className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
    >
      <Trash2 className="h-3 w-3" />
      초기화
    </button>
  </div>
  <div
    ref={logContainerRef}
    role="log"
    aria-live="polite"
    aria-relevant="additions"
    aria-label="AI 활동 로그"
    className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
  >
    {activityLogs.length === 0 ? (
      <div className="text-center text-slate-500 py-6">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">아직 활동 로그가 없습니다</p>
        <p className="text-xs mt-1 opacity-60">AI 활동이 여기에 기록됩니다</p>
      </div>
    ) : (
      activityLogs.map((log: ActivityLog) => (
        <div key={log.id} className="flex items-start gap-3 bg-slate-800/30 rounded-lg p-2.5 hover:bg-slate-800/50 transition-colors">
          {/* Icon with color based on level */}
          <div className={`mt-0.5 flex-shrink-0 ${getLogLevelColor(log.level)}`}>
            {getLogIcon(log.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 truncate">{log.message}</p>
            <p className="text-xs text-slate-500 mt-0.5">{formatTime(log.timestamp)}</p>
          </div>
        </div>
      ))
    )}
  </div>
</div>
```

**Key Changes**:
- ✅ Added log count badge: `({activityLogs.length})`
- ✅ Height: max-h-64 (controlled, not full height)
- ✅ Background: bg-slate-800/30 (lighter than chat items)
- ✅ Hover: bg-slate-800/50 transition
- ✅ Icon: flex-shrink-0 prevents compression
- ✅ Better empty state messaging

---

## Emotion Badge Examples

### Visual Reference
```
Joy (기쁨)         → bg-yellow-500/30 text-yellow-300
Anger (분노)       → bg-red-500/30 text-red-300
Sadness (슬픔)     → bg-blue-500/30 text-blue-300
Fear (공포)        → bg-purple-500/30 text-purple-300
Surprise (놀람)    → bg-orange-500/30 text-orange-300
Neutral (중립)     → bg-slate-500/30 text-slate-300
```

### Chat Message with Badge
```
┌─────────────────────────────────────┐
│ 사용자1        [기쁨]               │  ← Username + emotion badge
│ 오늘 방송 재미있어요!              │  ← Message (word-wrapped)
│ 14:32:15                            │  ← Timestamp
└─────────────────────────────────────┘
```

---

## Responsive Breakpoints

### Mobile (< 768px)
```
Status Cards:  1 column (full width)
Layout:        1 column (left controls stack on top)
Chat Monitor:  h-96 (full width)
Activity Log:  max-h-64 (full width)
```

### Tablet (768px - 1023px)
```
Status Cards:  2 columns
Layout:        Begins 2-column layout
Chat Monitor:  h-80
Activity Log:  max-h-64
```

### Desktop (≥ 1024px)
```
Status Cards:  4 columns
Layout:        Full 2-column (1/3 + 2/3)
Chat Monitor:  h-[28rem] (largest)
Activity Log:  max-h-64 (full width)
```

---

## Color Palette Reference

### Semantic Colors
```
Active/Primary:     blue-600, blue-500, blue-400
Success/Resume:     green-600, green-400
Warning/Pause:      yellow-600, yellow-400
Offline:            slate-700, slate-600
Hover:              +100 shade (e.g., blue-700 from blue-600)
```

### Emotion Colors
```
Joy:                yellow-{300,400,500}
Anger:              red-{300,400,500}
Sadness:            blue-{300,400,500}
Fear:               purple-{300,400,500}
Surprise:           orange-{300,400,500}
Neutral:            slate-{300,400,500}
```

### Background & Border
```
Card Background:    from-slate-900 to-slate-950
Card Border:        border-slate-700/50
Hover Border:       border-blue-500/30
Hover Shadow:       shadow-blue-500/10
Text Primary:       text-white
Text Secondary:     text-slate-400
Text Muted:         text-slate-500
```

---

## Tailwind Classes Used

### Layout
- `grid`, `grid-cols-1`, `lg:grid-cols-3`, `gap-6`
- `lg:col-span-1`, `lg:col-span-2`, `lg:row-span-2`
- `space-y-6`, `space-y-2`, `space-y-3`
- `flex`, `flex-col`, `sm:flex-row`, `items-center`, `justify-between`

### Sizing
- `h-96`, `lg:h-[28rem]`, `max-h-64`
- `w-full`, `px-4`, `py-2.5`, `p-4`, `p-3`, `p-2.5`
- `h-4`, `w-4`, `h-6`, `w-6`

### Typography
- `text-2xl`, `text-sm`, `text-xs`
- `font-bold`, `font-semibold`, `font-medium`
- `text-white`, `text-slate-400`, `text-blue-400`

### Effects
- `rounded-lg`, `border`, `border-2`
- `shadow-lg`, `shadow-blue-500/10`, `shadow-blue-500/20`
- `transition-colors`, `transition-all`, `duration-200`, `duration-300`
- `hover:bg-slate-800`, `hover:border-slate-600`

### Scrollbar
- `overflow-y-auto`, `scrollbar-thin`
- `scrollbar-thumb-slate-700`, `scrollbar-track-slate-800`

### Opacity & Transparency
- `opacity-50`, `opacity-30`, `opacity-75`
- `bg-slate-800/50`, `bg-slate-800/30`, `bg-blue-500/30`
- `border-slate-700/50`, `shadow-blue-500/10`

---

## Integration Checklist

### For Backend Integration
- [ ] Connect chat WebSocket to `addChatMessage()`
- [ ] Connect activity events to `addActivityLog()`
- [ ] Connect stats API to update `stats` object
- [ ] Implement emotion detection on backend
- [ ] Test with real API data

### For Testing
- [ ] Test all responsive breakpoints
- [ ] Test chat auto-scroll behavior
- [ ] Test emotion badge colors
- [ ] Test button click handlers
- [ ] Test slider controls
- [ ] Test clear buttons
- [ ] Test empty states
- [ ] Test keyboard navigation
- [ ] Test with screen readers

### For Performance
- [ ] Monitor chat message memory usage
- [ ] Implement max items limit if needed
- [ ] Test with high chat volume (100+ messages/min)
- [ ] Check scrollbar performance
- [ ] Verify no memory leaks in useEffect

---

## Common Use Cases

### Use Case 1: Monitor Live Chat
**User Flow**:
1. Open Dashboard
2. Watch chat monitor (right column)
3. See real-time messages with emotions
4. Identify trending emotions from badges

**Supporting Elements**:
- Large chat monitor (h-[28rem])
- Emotion badges for quick scanning
- Auto-scroll to latest message
- Empty state messaging

### Use Case 2: Adjust AI Settings
**User Flow**:
1. Open Dashboard
2. Modify sliders in left column
3. See immediate effect on chat responses
4. Monitor activity log for AI events

**Supporting Elements**:
- Left column controls
- Quick reaction settings
- Activity log shows AI actions
- Real-time feedback

### Use Case 3: Switch Personas
**User Flow**:
1. Open Dashboard
2. Click persona button in left column
3. See persona switch logged
4. Chat responses change personality

**Supporting Elements**:
- Persona quick switch (2x2 grid)
- Visual active state (blue highlight)
- Activity log shows persona change
- Quick access without navigation

### Use Case 4: Monitor AI Health
**User Flow**:
1. Open Dashboard
2. Check status cards (top)
3. Review activity log (bottom)
4. Identify issues from log colors

**Supporting Elements**:
- Status cards show key metrics
- Activity log with icon + color coding
- Log level colors (warning/error)
- Timestamp for debugging

---

## Troubleshooting

### Chat Monitor Not Scrolling
**Solution**: Ensure `overflow-y-auto` and fixed height (h-96/h-[28rem])
```jsx
className="h-96 lg:h-[28rem] overflow-y-auto"
```

### Emotion Badges Not Showing Color
**Solution**: Verify `getEmotionBgColor()` is called correctly
```jsx
<span className={`text-xs px-2 py-0.5 rounded ${getEmotionBgColor(msg.emotion)}`}>
  {getEmotionLabel(msg.emotion)}
</span>
```

### Layout Not Responsive
**Solution**: Check grid breakpoint is `lg:` for desktop
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
```

### Scrollbar Not Visible
**Solution**: Ensure Tailwind scrollbar plugin is installed
```jsx
className="scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800"
```

### Empty State Not Showing
**Solution**: Check condition is `chatMessages.length === 0`
```jsx
{chatMessages.length === 0 ? (
  <div className="text-center text-slate-500 py-12">...</div>
) : (
  chatMessages.map(...)
)}
```

---

## Performance Tips

### Chat Monitor
- Limit displayed messages to last 100 (virtual scrolling for 1000+)
- Debounce scroll events
- Use `key={msg.id}` for stable reconciliation

### Activity Log
- Limit displayed logs to last 50
- Use `max-h-64` to prevent DOM explosion
- Consider pagination for history

### Sliders
- Debounce `onChange` events (100ms)
- Batch updates to store
- Avoid re-renders on every slider drag

### Auto-Scroll
- Only trigger on new message
- Check if user is scrolled to bottom before auto-scroll
- Implement "New messages" indicator if user scrolls up

---

## Accessibility Notes

### Screen Reader Support
- Chat monitor: `role="log"` + `aria-live="polite"` + `aria-relevant="additions"`
- Activity log: `role="log"` + `aria-live="polite"` + `aria-relevant="additions"`
- Buttons: `type="button"` specified
- Labels: Descriptive text in headers

### Keyboard Navigation
- Tab: Navigate between controls
- Enter/Space: Activate buttons
- Arrow keys: Adjust sliders
- No keyboard trap (Tab can exit all sections)

### Color Contrast
- Text on backgrounds: WCAG AA (4.5:1 minimum)
- Emotion badges: Sufficient contrast for text
- Buttons: Clear active/inactive states

### Focus Indicators
- Default browser focus outline (can be enhanced)
- Visible on all interactive elements
- Clear visual feedback

---

## Version History

### v1.0 (Current)
- ✅ 2-column layout implemented
- ✅ Chat monitor as primary feature
- ✅ Emotion badges with colors
- ✅ Full-width activity log
- ✅ Standby toggle replaces PTT
- ✅ Broadcast start button removed
- ✅ Responsive design
- ✅ Accessibility support

### Future Versions
- 🔄 Drag-drop layout customization
- 🔄 Collapsible control sections
- 🔄 Dark/Light theme toggle
- 🔄 Chat search & filter
- 🔄 Export logs (CSV/JSON)
- 🔄 WebSocket real-time stats
- 🔄 Notification system
- 🔄 Performance metrics graph

---

## Support & Questions

For questions about the dashboard redesign, refer to:
- **Design Document**: `DASHBOARD_REDESIGN.md`
- **Component Reference**: This file
- **Store Types**: `src/shared/stores/aiModeStore.ts`
- **Main Page**: `src/pages/DashboardPage.tsx`

---

**Last Updated**: 2025-04-23
**Version**: 1.0
**Status**: Ready for Integration
