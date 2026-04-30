# Dashboard Layout - Visual Reference

## Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  대시보드                                    [일시정지] [대기중/오프라인]   │
│  AI 스트리머 상태를 한눈에 확인하고 제어하세요                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [AI 상태]    [시청자 수]    [채팅 속도]    [감정 비율]                    │
│  방송 중      1,234명        45개/분        기쁨 (45%)                     │
│  응답률 92%   채팅 45/분     AI응답 30개    놀람 (30%)                     │
│  전략: 응원   총 2,340       반응률 66%                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─ LEFT (1/3) ────────────────────┐ ┌─ RIGHT (2/3) ──────────────────┐  │
│  │                                 │ │                                 │  │
│  │ 👥 페르소나 빠른 교체            │ │ 💬 실시간 채팅 모니터 [초기화]  │  │
│  │ ┌─────────────────────────┐      │ │                                 │  │
│  │ │ 캐릭터1 │ 캐릭터2 │     │      │ │ ┌─ Chat Messages ──────────┐  │  │
│  │ │ 활성    │ 미설정  │     │      │ │ │ 사용자1      [기쁨]       │  │  │
│  │ │ 캐릭터3 │ 캐릭터4 │     │      │ │ │ 안녕하세요!               │  │  │
│  │ │ 미설정  │ 미설정  │     │      │ │ │ 14:32:15                  │  │  │
│  │ └─────────────────────────┘      │ │ │                           │  │  │
│  │                                 │ │ │ 사용자2      [놀람]       │  │  │
│  │ ⚡ 빠른 제어                     │ │ │ 오늘 방송 재미있어요!     │  │  │
│  │ ┌──────────────────────────┐    │ │ │ 14:32:08                  │  │  │
│  │ │ STT   │ TTS              │    │ │ │                           │  │  │
│  │ │ 음성인식│음성출력         │    │ │ │ [실시간 채팅 기다리는중]  │  │  │
│  │ │ 채팅반응│선제반응         │    │ │ │                           │  │  │
│  │ └──────────────────────────┘    │ │ └───────────────────────────┘  │  │
│  │                                 │ │                                 │  │
│  │ ⚙️ AI 반응 설정                  │ │ 📋 상태 요약                    │  │
│  │ ┌──────────────────────────┐    │ │ ┌─────────────────────────┐   │  │
│  │ │ 반응 속도        [60%]   │    │ │ │ 방송 시간     1h 23m    │   │  │
│  │ │ 감정 강도        [75%]   │    │ │ │ 총 채팅       2,340     │   │  │
│  │ │ 문맥 이해도      [80%]   │    │ │ │ AI 응답       1,540     │   │  │
│  │ │ 창의성           [50%]   │    │ │ ├─────────────────────────┤   │  │
│  │ └──────────────────────────┘    │ │ │ AI 모드       방송 중    │   │  │
│  │                                 │ │ │ 반응 전략     응원       │   │  │
│  │                                 │ │ └─────────────────────────┘   │  │
│  └─────────────────────────────────┘ └─────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  📊 AI 활동 로그 (5) [초기화]                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ ⚡ 채팅 반응: 안녕하세요!                               14:32:15    │  │
│  │ 📊 감정 분석: 기쁨 감정 감지됨                          14:32:12    │  │
│  │ ⚙️  시스템: STT 활성화됨                                14:32:10    │  │
│  │ 💬 채팅 반응: 오늘 방송 재미있어요!                     14:32:08    │  │
│  │ 👥 페르소나: 캐릭터1로 변경됨                           14:32:05    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tablet Layout (768px - 1023px)

```
┌──────────────────────────────────────────────────────────────┐
│  대시보드                  [일시정지] [대기중/오프라인]      │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ [AI상태]   [시청자수]   [채팅속도]   [감정비율]            │
│ 방송 중     1,234명      45개/분     기쁨 (45%)             │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────┬──────────────────────────────┐
│ LEFT (Controls)             │ RIGHT (Chat Monitor)         │
│                             │                              │
│ 👥 페르소나 빠른 교체        │ 💬 실시간 채팅 모니터        │
│ [캐릭터1] [캐릭터2]         │ ┌──────────────────────────┐ │
│ [캐릭터3] [캐릭터4]         │ │ 사용자1  [기쁨]           │ │
│                             │ │ 안녕하세요!              │ │
│ ⚡ 빠른 제어                 │ │ 14:32:15                 │ │
│ [STT] [TTS]                 │ │                          │ │
│ [채팅반응] [선제반응]       │ │ 사용자2  [놀람]           │ │
│                             │ │ 오늘 방송 재미있어요!    │ │
│ ⚙️ AI 반응 설정             │ │ 14:32:08                 │ │
│ 반응 속도 [60%]             │ │                          │ │
│ 감정 강도 [75%]             │ │ [실시간 채팅 기다리중]   │ │
│ 문맥 이해도 [80%]           │ │                          │ │
│ 창의성 [50%]                │ └──────────────────────────┘ │
│                             │                              │
│                             │ 📋 상태 요약                 │
│                             │ 방송 시간: 1h 23m           │
│                             │ 총 채팅: 2,340              │
│                             │ AI 응답: 1,540              │
│                             │ ─────────────────            │
│                             │ AI 모드: 방송 중             │
│                             │ 반응 전략: 응원              │
└─────────────────────────────┴──────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 📊 AI 활동 로그 (5) [초기화]                                │
│ ⚡ 채팅 반응: 안녕하세요!                      14:32:15     │
│ 📊 감정 분석: 기쁨 감정 감지됨                 14:32:12     │
│ ⚙️  시스템: STT 활성화됨                       14:32:10     │
└──────────────────────────────────────────────────────────────┘
```

## Mobile Layout (< 768px)

```
┌────────────────────────────────┐
│ 대시보드                        │
│ AI 스트리머 상태 확인           │
│ [일시정지] [대기중/오프라인]   │
└────────────────────────────────┘

┌────────────────────────────────┐
│ [AI상태] [시청자수]           │
│ 방송 중   1,234명              │
│ [채팅속도] [감정비율]          │
│ 45개/분    기쁨 (45%)          │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 👥 페르소나 빠른 교체           │
│ [캐릭터1] [캐릭터2]           │
│ [캐릭터3] [캐릭터4]           │
└────────────────────────────────┘

┌────────────────────────────────┐
│ ⚡ 빠른 제어                    │
│ [STT] [TTS]                    │
│ [채팅반응] [선제반응]          │
└────────────────────────────────┘

┌────────────────────────────────┐
│ ⚙️ AI 반응 설정                 │
│ 반응 속도 ▮▮▮▮▮▯▯▯▯▯ 60%     │
│ 감정 강도 ▮▮▮▮▮▮▮▮▯▯ 75%     │
│ 문맥 이해도 ▮▮▮▮▮▮▮▮▯▯ 80%   │
│ 창의성 ▮▮▮▮▮▯▯▯▯▯ 50%        │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 💬 실시간 채팅 모니터 [초기화] │
│                                │
│ 사용자1        [기쁨]          │
│ 안녕하세요!                    │
│ 14:32:15                       │
│                                │
│ 사용자2        [놀람]          │
│ 오늘 방송 재미있어요!          │
│ 14:32:08                       │
│                                │
│ [실시간 채팅 기다리는중...]    │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 📋 상태 요약                    │
│ 방송 시간     1h 23m           │
│ 총 채팅       2,340            │
│ AI 응답       1,540            │
│ ─────────────────────          │
│ AI 모드       방송 중           │
│ 반응 전략     응원              │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 📊 AI 활동 로그(5) [초기화]   │
│                                │
│ ⚡ 채팅 반응: 안녕하세요!     │
│    14:32:15                    │
│                                │
│ 📊 감정 분석: 기쁨 감정 감지됨 │
│    14:32:12                    │
│                                │
│ ⚙️  시스템: STT 활성화됨       │
│    14:32:10                    │
└────────────────────────────────┘
```

## Color Scheme Reference

### Emotion Badges
```
┌─────────────────────────────────────────────────┐
│ 기쁨    [Yellow]   bg-yellow-500/30             │
│ 분노    [Red]      bg-red-500/30                │
│ 슬픔    [Blue]     bg-blue-500/30               │
│ 공포    [Purple]   bg-purple-500/30             │
│ 놀람    [Orange]   bg-orange-500/30             │
│ 중립    [Slate]    bg-slate-500/30              │
└─────────────────────────────────────────────────┘
```

### Button States
```
┌──────────────────────────────────────┐
│ 일시정지 (Active)   Yellow-600        │
│ 재개 (Inactive)     Green-600         │
│ 대기중 (Active)     Blue-600          │
│ 오프라인 (Inactive) Slate-700         │
│ 활성 상태           Blue-500 border   │
│ 비활성 상태         Slate-700 border  │
└──────────────────────────────────────┘
```

### Activity Log Icons & Colors
```
┌────────────────────────────────────────┐
│ ⚡ Reaction   (Zap)      Yellow-400    │
│ ⚙️  System    (Settings)  Blue-400     │
│ 💬 Chat      (MessageSquare) Green-400 │
│ 📊 Emotion   (Activity)   Purple-400   │
│ 👥 Persona   (Users)      Slate-400    │
│ 🕐 Default   (Clock)      Slate-400    │
└────────────────────────────────────────┘
```

## Responsive Grid Structure

### Desktop (≥1024px)
```
grid-cols-1 lg:grid-cols-3 gap-6

Left:  lg:col-span-1 (1/3 width = ~33%)
Right: lg:col-span-2 (2/3 width = ~67%)

Right Column:
  Chat Monitor: lg:row-span-2 (spans both rows)
  Status Summary: below chat
```

### Tablet (768px - 1023px)
```
grid-cols-1 gap-6

Both columns: Full width, stacked
Left: Above Right
```

### Mobile (< 768px)
```
grid-cols-1 gap-6

All sections: Full width, stacked
```

## Component Heights

```
Desktop (lg):
  Chat Monitor:   h-[28rem]  (448px)
  Activity Log:   max-h-64   (256px)
  Status Cards:   Auto
  
Tablet (md):
  Chat Monitor:   h-80       (320px)
  Activity Log:   max-h-64   (256px)
  Status Cards:   Auto

Mobile:
  Chat Monitor:   h-96       (384px)
  Activity Log:   max-h-64   (256px)
  Status Cards:   Auto
```

## Component Spacing

```
Page Level:         space-y-6      (24px gaps)
Section Level:      space-y-6      (24px gaps)
Item Level:         space-y-2/3    (8-12px gaps)
Card Padding:       p-4            (16px)
Card Item Padding:  p-3 or p-2.5   (12px or 10px)
Button Padding:     px-4 py-2.5    (16px x 10px)
```

## Accessibility Features

```
Chat Monitor:
  role="log"
  aria-live="polite"
  aria-relevant="additions"
  aria-label="실시간 채팅 모니터"

Activity Log:
  role="log"
  aria-live="polite"
  aria-relevant="additions"
  aria-label="AI 활동 로그"

Buttons:
  type="button"
  aria-pressed={enabled} (toggle buttons)

Sliders:
  aria-label={label}
  type="range"
```

## Animation & Transitions

```
Button Hover:
  transition-colors duration-200
  Example: bg-yellow-600 → bg-yellow-700

Card Hover:
  hover:shadow-lg hover:shadow-blue-500/10
  hover:border-blue-500/30
  transition-all duration-300

Toggle Buttons:
  transition-all duration-200
  Smooth color & border changes

Hover States:
  Chat Item:      bg-slate-800/50 → bg-slate-800/70
  Log Item:       bg-slate-800/30 → bg-slate-800/50
  Button:         bg-color-600 → bg-color-700
```

## Key Layout Decisions

### Why 2-Column (1/3 + 2/3)?
- Chat is PRIMARY feature → Gets 2/3 width
- Controls are SECONDARY → Gets 1/3 width
- More chat visible at once
- Better for streaming monitoring

### Why Full-Width Activity Log?
- Provides context without taking side space
- Limited height (max-h-64) prevents overflow
- Clear visual separation from main content
- Full width = better readability

### Why Compact Left Column?
- Consolidates all controls in one area
- Leaves room for chat monitor
- Easy to scan and access
- Mobile-friendly layout

### Why Responsive Grid?
- Single column on mobile (space constraints)
- 2-column on tablet (better space usage)
- Full layout on desktop (optimal experience)
- Smooth transitions between breakpoints

---

**Visual Reference Complete**
**Ready for Implementation**
