# SWproject Frontend Initial Setup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 15 (App Router) + TypeScript + Tailwind CSS 기반 SWproject 프론트엔드 초기 세팅 완료 후 SKU-SW/fe GitHub 레포에 푸시

**Architecture:** Feature-Based 구조로 10주 로드맵 스프린트와 1:1 매핑. `src/features/` 하위에 기능별 모듈, `src/shared/`에 공통 모듈을 분리해 협업 충돌 최소화.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Zustand, Axios, NextAuth v5, Chart.js, react-hook-form, zod, lucide-react

---

## 파일 맵

| 파일 | 역할 |
|------|------|
| `swproject/src/app/layout.tsx` | 루트 레이아웃 (폰트, 전역 스타일) |
| `swproject/src/app/page.tsx` | `/` → `/login` 리다이렉트 |
| `swproject/src/app/(auth)/login/page.tsx` | 로그인 페이지 스텁 |
| `swproject/src/app/(auth)/signup/page.tsx` | 회원가입 페이지 스텁 |
| `swproject/src/app/(dashboard)/layout.tsx` | 사이드바 + 헤더 공통 레이아웃 |
| `swproject/src/app/(dashboard)/dashboard/page.tsx` | 대시보드 페이지 스텁 |
| `swproject/src/app/(dashboard)/character/page.tsx` | AI 캐릭터 설정 페이지 스텁 |
| `swproject/src/app/(dashboard)/chat-analysis/page.tsx` | 채팅 분석 페이지 스텁 |
| `swproject/src/app/(dashboard)/proactive/page.tsx` | 선제 반응 설정 페이지 스텁 |
| `swproject/src/app/(dashboard)/game/page.tsx` | 게임 연동 페이지 스텁 |
| `swproject/src/app/(dashboard)/safety/page.tsx` | 안전 관리 페이지 스텁 |
| `swproject/src/app/(dashboard)/stats/page.tsx` | 방송 통계 페이지 스텁 |
| `swproject/src/app/overlay/page.tsx` | OBS 오버레이 독립 페이지 스텁 |
| `swproject/src/app/api/auth/[...nextauth]/route.ts` | NextAuth v5 핸들러 |
| `swproject/src/shared/lib/axios.ts` | Axios 인스턴스 + 인터셉터 |
| `swproject/src/shared/lib/utils.ts` | 공통 유틸 함수 |
| `swproject/src/shared/hooks/useWebSocket.ts` | WebSocket 베이스 훅 |
| `swproject/src/shared/stores/authStore.ts` | Zustand 인증 스토어 |
| `swproject/src/shared/stores/characterStore.ts` | Zustand 캐릭터 스토어 |
| `swproject/src/shared/stores/aiModeStore.ts` | Zustand AI 모드 스토어 |
| `swproject/src/shared/types/auth.ts` | 인증 관련 타입 |
| `swproject/src/shared/types/character.ts` | 캐릭터 관련 타입 |
| `swproject/src/shared/types/chat.ts` | 채팅 분석 관련 타입 |
| `swproject/src/shared/types/game.ts` | 게임 연동 관련 타입 |
| `swproject/.env.example` | 환경변수 템플릿 |
| `swproject/src/styles/globals.css` | Tailwind 전역 스타일 (create-next-app 생성본 수정) |

---

### Task 1: Next.js 프로젝트 생성

**Files:**
- Create: `swproject/` (전체 프로젝트 디렉토리)

- [ ] **Step 1: swproject 생성**

```bash
cd /Users/lee/SKU-SW
npx create-next-app@latest swproject \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

프롬프트가 뜨면 모두 기본값(Enter)으로 진행.

Expected: `swproject/` 디렉토리 생성, `Success! Created swproject` 메시지 출력

- [ ] **Step 2: 생성 확인**

```bash
ls /Users/lee/SKU-SW/swproject/src/app/
```

Expected: `favicon.ico  globals.css  layout.tsx  page.tsx` 출력

---

### Task 2: 추가 패키지 설치

**Files:**
- Modify: `swproject/package.json`

- [ ] **Step 1: 패키지 설치**

```bash
cd /Users/lee/SKU-SW/swproject
npm install zustand axios chart.js react-chartjs-2 next-auth@beta react-hook-form zod lucide-react @tailwindcss/forms
```

Expected: `added N packages` 메시지, 에러 없음

- [ ] **Step 2: 설치 확인**

```bash
cd /Users/lee/SKU-SW/swproject
cat package.json | grep -E "zustand|axios|chart|next-auth|react-hook-form|zod|lucide"
```

Expected: 설치된 패키지들이 `dependencies`에 나열됨

- [ ] **Step 3: Tailwind forms 플러그인 설정**

`swproject/tailwind.config.ts` 파일을 열어 `plugins` 배열에 `@tailwindcss/forms` 추가:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
```

- [ ] **Step 4: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add package.json package-lock.json tailwind.config.ts
git commit -m "feat: install additional packages and configure tailwind forms"
```

---

### Task 3: 전체 디렉토리 구조 생성

**Files:**
- Create: `swproject/src/features/` 하위 11개 디렉토리
- Create: `swproject/src/shared/` 하위 5개 디렉토리
- Create: `swproject/public/characters/`

- [ ] **Step 1: features 디렉토리 생성**

```bash
cd /Users/lee/SKU-SW/swproject
mkdir -p src/features/auth/{components,hooks,api}
mkdir -p src/features/dashboard/{components,hooks}
mkdir -p src/features/character/{components/info,components/broadcast,components/preset,hooks,api}
mkdir -p src/features/conversation/{components,hooks}
mkdir -p src/features/chat-analysis/{components,hooks}
mkdir -p src/features/reaction/{components,hooks}
mkdir -p src/features/proactive/{components,hooks}
mkdir -p src/features/game/{components,hooks}
mkdir -p src/features/safety/{components,api}
mkdir -p src/features/stats/{components,api}
mkdir -p src/features/overlay/components
```

- [ ] **Step 2: shared 디렉토리 생성**

```bash
cd /Users/lee/SKU-SW/swproject
mkdir -p src/shared/components
mkdir -p src/shared/hooks
mkdir -p src/shared/lib
mkdir -p src/shared/stores
mkdir -p src/shared/types
```

- [ ] **Step 3: public/characters 디렉토리 생성**

```bash
mkdir -p /Users/lee/SKU-SW/swproject/public/characters
touch /Users/lee/SKU-SW/swproject/public/characters/.gitkeep
```

- [ ] **Step 4: App Router 라우트 디렉토리 생성**

```bash
cd /Users/lee/SKU-SW/swproject
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/signup
mkdir -p src/app/\(dashboard\)/dashboard
mkdir -p src/app/\(dashboard\)/character
mkdir -p src/app/\(dashboard\)/chat-analysis
mkdir -p src/app/\(dashboard\)/proactive
mkdir -p src/app/\(dashboard\)/game
mkdir -p src/app/\(dashboard\)/safety
mkdir -p src/app/\(dashboard\)/stats
mkdir -p src/app/overlay
mkdir -p "src/app/api/auth/[...nextauth]"
```

- [ ] **Step 5: 구조 확인**

```bash
find /Users/lee/SKU-SW/swproject/src -type d | sort
```

Expected: features/, shared/, app/(auth)/, app/(dashboard)/ 등 전체 디렉토리 트리 출력

- [ ] **Step 6: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add .
git commit -m "feat: scaffold full directory structure"
```

---

### Task 4: 공통 타입 정의

**Files:**
- Create: `swproject/src/shared/types/auth.ts`
- Create: `swproject/src/shared/types/character.ts`
- Create: `swproject/src/shared/types/chat.ts`
- Create: `swproject/src/shared/types/game.ts`

- [ ] **Step 1: auth 타입 작성**

`src/shared/types/auth.ts`:

```ts
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
```

- [ ] **Step 2: character 타입 작성**

`src/shared/types/character.ts`:

```ts
export type Gender = 'male' | 'female';

export type SpeechStyle =
  | 'friendly_informal'
  | 'polite_formal'
  | 'playful_informal'
  | 'broadcast_exaggerated';

export type Personality = 'energetic' | 'calm' | 'humorous' | 'serious';

export type Persona =
  | 'game_specialist'
  | 'humor_entertainment'
  | 'focused_serious'
  | 'chat_social';

export type SensitivityLevel = 'high' | 'medium' | 'low';

export interface CharacterInfo {
  gender: Gender;
  name: string;
  callSign: string;
  appearancePresetId: string;
  voicePresetId: string;
  speechStyle: SpeechStyle;
  personality: Personality;
  persona: Persona;
}

export interface BroadcastSettings {
  chatSensitivity: SensitivityLevel;
  silenceIntervalSeconds: number; // 10 ~ 120
  ttsSpeed: number;               // 0.5 ~ 2.0
  ttsVolume: number;              // 0 ~ 1.0
}

export interface CharacterPreset {
  id: string;
  name: string;
  info: CharacterInfo;
  broadcastSettings: BroadcastSettings;
  createdAt: string;
}

export interface CharacterState {
  info: CharacterInfo | null;
  broadcastSettings: BroadcastSettings | null;
  presets: CharacterPreset[];
}
```

- [ ] **Step 3: chat 타입 작성**

`src/shared/types/chat.ts`:

```ts
export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface ChatMessage {
  id: string;
  username: string;
  content: string;
  sentiment: Sentiment;
  timestamp: string;
}

export interface SentimentRatio {
  positive: number;
  neutral: number;
  negative: number;
}

export interface SentimentFlowPoint {
  timestamp: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface KeywordItem {
  keyword: string;
  count: number;
}

export interface ChatAnalyticsData {
  sentimentRatio: SentimentRatio;
  sentimentFlow: SentimentFlowPoint[];
  chatSpeed: number;           // 채팅 개수/분
  topKeywords: KeywordItem[];  // Top 10
  filteredCount: number;
}
```

- [ ] **Step 4: game 타입 작성**

`src/shared/types/game.ts`:

```ts
export type GameMode = 'CLASSIC' | 'ARAM' | 'OTHER';

export type GameEventType =
  | 'kill'
  | 'death'
  | 'assist'
  | 'multi_kill'
  | 'objective'
  | 'victory'
  | 'defeat';

export type AIReactionSpeed = 'fast' | 'normal' | 'slow';

export interface PlayerStats {
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  cs: number;
  gameMode: GameMode;
  elapsedSeconds: number;
}

export interface GameEventTriggerSettings {
  kill: boolean;
  death: boolean;
  assist: boolean;
  multi_kill: boolean;
  objective: boolean;
  victory: boolean;
  defeat: boolean;
}

export interface GameSettings {
  isConnected: boolean;
  reactionSpeed: AIReactionSpeed;
  triggerSettings: GameEventTriggerSettings;
}
```

- [ ] **Step 5: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add src/shared/types/
git commit -m "feat: add shared type definitions for auth, character, chat, game"
```

---

### Task 5: Zustand 스토어 작성

**Files:**
- Create: `swproject/src/shared/stores/authStore.ts`
- Create: `swproject/src/shared/stores/characterStore.ts`
- Create: `swproject/src/shared/stores/aiModeStore.ts`

- [ ] **Step 1: authStore 작성**

`src/shared/stores/authStore.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/shared/types/auth';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

- [ ] **Step 2: characterStore 작성**

`src/shared/stores/characterStore.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterInfo, BroadcastSettings, CharacterPreset } from '@/shared/types/character';

interface CharacterStore {
  info: CharacterInfo | null;
  broadcastSettings: BroadcastSettings | null;
  presets: CharacterPreset[];
  setInfo: (info: CharacterInfo) => void;
  setBroadcastSettings: (settings: BroadcastSettings) => void;
  setPresets: (presets: CharacterPreset[]) => void;
  reset: () => void;
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      info: null,
      broadcastSettings: null,
      presets: [],
      setInfo: (info) => set({ info }),
      setBroadcastSettings: (broadcastSettings) => set({ broadcastSettings }),
      setPresets: (presets) => set({ presets }),
      reset: () => set({ info: null, broadcastSettings: null, presets: [] }),
    }),
    { name: 'character-storage' }
  )
);
```

- [ ] **Step 3: aiModeStore 작성**

`src/shared/stores/aiModeStore.ts`:

```ts
import { create } from 'zustand';

export type AIMode = 'broadcasting' | 'idle' | 'gaming';
export type ReactionStrategy = 'cheer' | 'normal' | 'critical';

interface AIModeStore {
  mode: AIMode;
  reactionStrategy: ReactionStrategy;
  isAutoStrategy: boolean;
  setMode: (mode: AIMode) => void;
  setReactionStrategy: (strategy: ReactionStrategy) => void;
  setIsAutoStrategy: (isAuto: boolean) => void;
}

export const useAIModeStore = create<AIModeStore>()((set) => ({
  mode: 'idle',
  reactionStrategy: 'normal',
  isAutoStrategy: true,
  setMode: (mode) => set({ mode }),
  setReactionStrategy: (reactionStrategy) => set({ reactionStrategy }),
  setIsAutoStrategy: (isAutoStrategy) => set({ isAutoStrategy }),
}));
```

- [ ] **Step 4: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add src/shared/stores/
git commit -m "feat: add zustand stores for auth, character, ai-mode"
```

---

### Task 6: 공통 라이브러리 작성

**Files:**
- Create: `swproject/src/shared/lib/axios.ts`
- Create: `swproject/src/shared/lib/utils.ts`

- [ ] **Step 1: Axios 인스턴스 작성**

`src/shared/lib/axios.ts`:

```ts
import axios from 'axios';
import { useAuthStore } from '@/shared/stores/authStore';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: JWT 자동 주입
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 → 자동 로그아웃
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

- [ ] **Step 2: utils 작성**

`src/shared/lib/utils.ts`:

```ts
import { type ClassValue, clsx } from 'clsx';

/**
 * Tailwind 클래스 조건부 병합 유틸
 * clsx가 없으면 npm install clsx 먼저 실행
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * 초(seconds)를 mm:ss 포맷으로 변환
 */
export function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * ISO 날짜 문자열을 한국 시간 포맷으로 변환
 */
export function formatKoreanDate(isoString: string): string {
  return new Date(isoString).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
  });
}
```

- [ ] **Step 3: clsx 설치**

```bash
cd /Users/lee/SKU-SW/swproject
npm install clsx
```

Expected: `added 1 package`

- [ ] **Step 4: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add src/shared/lib/ package.json package-lock.json
git commit -m "feat: add axios instance with interceptors and shared utils"
```

---

### Task 7: WebSocket 베이스 훅 작성

**Files:**
- Create: `swproject/src/shared/hooks/useWebSocket.ts`

- [ ] **Step 1: useWebSocket 훅 작성**

`src/shared/hooks/useWebSocket.ts`:

```ts
'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions<T> {
  url: string;
  onMessage: (data: T) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
  enabled?: boolean;
}

interface UseWebSocketReturn {
  sendMessage: (data: unknown) => void;
  disconnect: () => void;
}

export function useWebSocket<T>({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  enabled = true,
}: UseWebSocketOptions<T>): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      onOpen?.();
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: T = JSON.parse(event.data as string);
        onMessage(data);
      } catch {
        // JSON 파싱 실패 시 무시
      }
    };

    ws.onclose = () => {
      onClose?.();
      // 3초 후 재연결
      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled) connect();
      }, 3000);
    };

    ws.onerror = (event: Event) => {
      onError?.(event);
    };
  }, [url, onMessage, onOpen, onClose, onError, enabled]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { sendMessage, disconnect };
}
```

- [ ] **Step 2: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add src/shared/hooks/
git commit -m "feat: add base WebSocket hook with auto-reconnect"
```

---

### Task 8: 루트 앱 파일 수정

**Files:**
- Modify: `swproject/src/app/layout.tsx`
- Modify: `swproject/src/app/page.tsx`
- Modify: `swproject/src/styles/globals.css` (이미 `src/app/globals.css`로 생성됨)

- [ ] **Step 1: 루트 layout.tsx 수정**

`src/app/layout.tsx` 전체를 아래로 교체:

```tsx
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SWproject',
  description: 'AI 동료 캐릭터 스트리밍 보조 서비스',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: 루트 page.tsx — /login 리다이렉트**

`src/app/page.tsx` 전체를 아래로 교체:

```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/login');
}
```

- [ ] **Step 3: globals.css 정리**

`src/app/globals.css` 전체를 아래로 교체:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: 빌드 확인**

```bash
cd /Users/lee/SKU-SW/swproject
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully` 또는 `Route (app)` 테이블 출력, 에러 없음

- [ ] **Step 5: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add src/app/layout.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat: configure root layout and redirect to login"
```

---

### Task 9: 인증 페이지 스텁 생성

**Files:**
- Create: `swproject/src/app/(auth)/login/page.tsx`
- Create: `swproject/src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: 로그인 페이지 스텁**

`src/app/(auth)/login/page.tsx`:

```tsx
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          로그인
        </h1>
        <p className="text-center text-sm text-gray-400">
          2주차에 구현 예정
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 회원가입 페이지 스텁**

`src/app/(auth)/signup/page.tsx`:

```tsx
export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
          회원가입
        </h1>
        <p className="text-center text-sm text-gray-400">
          2주차에 구현 예정
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add src/app/\(auth\)/
git commit -m "feat: add login and signup page stubs"
```

---

### Task 10: 대시보드 공통 레이아웃 + 페이지 스텁

**Files:**
- Create: `swproject/src/app/(dashboard)/layout.tsx`
- Create: `swproject/src/app/(dashboard)/dashboard/page.tsx`
- Create: `swproject/src/app/(dashboard)/character/page.tsx`
- Create: `swproject/src/app/(dashboard)/chat-analysis/page.tsx`
- Create: `swproject/src/app/(dashboard)/proactive/page.tsx`
- Create: `swproject/src/app/(dashboard)/game/page.tsx`
- Create: `swproject/src/app/(dashboard)/safety/page.tsx`
- Create: `swproject/src/app/(dashboard)/stats/page.tsx`

- [ ] **Step 1: 대시보드 공통 레이아웃 작성**

`src/app/(dashboard)/layout.tsx`:

```tsx
import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/character', label: 'AI 캐릭터 설정' },
  { href: '/chat-analysis', label: '채팅 분석' },
  { href: '/proactive', label: '선제 반응' },
  { href: '/game', label: '게임 연동' },
  { href: '/safety', label: '안전 관리' },
  { href: '/stats', label: '방송 통계' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside className="w-60 shrink-0 bg-white shadow-sm">
        <div className="px-6 py-5">
          <span className="text-lg font-bold text-indigo-600">SWproject</span>
        </div>
        <nav className="mt-2 flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 메인 영역 */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center border-b bg-white px-6 shadow-sm">
          <span className="text-sm text-gray-500">SWproject 대시보드</span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 대시보드 페이지 스텁**

`src/app/(dashboard)/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">대시보드</h1>
      <p className="text-sm text-gray-400">2주차에 구현 예정</p>
    </div>
  );
}
```

- [ ] **Step 3: 나머지 페이지 스텁 일괄 생성**

`src/app/(dashboard)/character/page.tsx`:
```tsx
export default function CharacterPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">AI 캐릭터 설정</h1>
      <p className="text-sm text-gray-400">3주차에 구현 예정</p>
    </div>
  );
}
```

`src/app/(dashboard)/chat-analysis/page.tsx`:
```tsx
export default function ChatAnalysisPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">채팅 분석</h1>
      <p className="text-sm text-gray-400">5주차에 구현 예정</p>
    </div>
  );
}
```

`src/app/(dashboard)/proactive/page.tsx`:
```tsx
export default function ProactivePage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">선제 반응 설정</h1>
      <p className="text-sm text-gray-400">6주차에 구현 예정</p>
    </div>
  );
}
```

`src/app/(dashboard)/game/page.tsx`:
```tsx
export default function GamePage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">게임 연동</h1>
      <p className="text-sm text-gray-400">7주차에 구현 예정</p>
    </div>
  );
}
```

`src/app/(dashboard)/safety/page.tsx`:
```tsx
export default function SafetyPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">안전 관리</h1>
      <p className="text-sm text-gray-400">7주차에 구현 예정</p>
    </div>
  );
}
```

`src/app/(dashboard)/stats/page.tsx`:
```tsx
export default function StatsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">방송 통계</h1>
      <p className="text-sm text-gray-400">8주차에 구현 예정</p>
    </div>
  );
}
```

- [ ] **Step 4: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add "src/app/(dashboard)/"
git commit -m "feat: add dashboard layout and all page stubs"
```

---

### Task 11: OBS 오버레이 + NextAuth 라우트

**Files:**
- Create: `swproject/src/app/overlay/page.tsx`
- Create: `swproject/src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: OBS 오버레이 페이지 스텁**

`src/app/overlay/page.tsx`:

```tsx
export default function OverlayPage() {
  return (
    <div className="flex h-screen w-screen items-end justify-start bg-transparent p-4">
      {/* OBS 크로마키 배경용 — 4주차 구현 예정 */}
      <div className="rounded-lg bg-black/50 px-4 py-2 text-white text-sm">
        AI 오버레이 영역 (4주차 구현 예정)
      </div>
    </div>
  );
}
```

- [ ] **Step 2: NextAuth v5 핸들러 스텁**

`src/app/api/auth/[...nextauth]/route.ts`:

```ts
/**
 * NextAuth v5 핸들러
 * 실제 구현은 2주차 인증 API 연동 시 진행
 * Spring Boot JWT와의 credentials provider 연동 방식은
 * 백엔드 협의 후 확정 (미결 사항 #1)
 */
export const GET = async () =>
  new Response('NextAuth 핸들러 — 2주차에 구현 예정', { status: 200 });

export const POST = async () =>
  new Response('NextAuth 핸들러 — 2주차에 구현 예정', { status: 200 });
```

- [ ] **Step 3: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add src/app/overlay/ "src/app/api/"
git commit -m "feat: add OBS overlay stub and NextAuth route placeholder"
```

---

### Task 12: 환경변수 파일 + .gitignore 확인

**Files:**
- Create: `swproject/.env.example`
- Modify: `swproject/.gitignore`

- [ ] **Step 1: .env.example 작성**

`swproject/.env.example`:

```env
# Spring Boot Backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Google OAuth2 (NextAuth v5)
AUTH_SECRET=your-secret-here
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 2: .env.local을 .gitignore에 추가 확인**

```bash
grep ".env.local" /Users/lee/SKU-SW/swproject/.gitignore
```

Expected: `.env.local` 라인 출력. 없으면 아래 실행:

```bash
echo ".env.local" >> /Users/lee/SKU-SW/swproject/.gitignore
```

- [ ] **Step 3: .env.local 생성 (.env.example 복사)**

```bash
cp /Users/lee/SKU-SW/swproject/.env.example /Users/lee/SKU-SW/swproject/.env.local
```

- [ ] **Step 4: 최종 빌드 확인**

```bash
cd /Users/lee/SKU-SW/swproject
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled successfully`, 에러 없음

- [ ] **Step 5: 커밋**

```bash
cd /Users/lee/SKU-SW/swproject
git add .env.example .gitignore
git commit -m "feat: add .env.example and verify .gitignore"
```

---

### Task 13: GitHub SKU-SW/fe 연결 및 푸시

**Files:**
- Modify: `swproject/.git/config` (remote origin 설정)

- [ ] **Step 1: swproject를 SKU-SW/fe 레포에 remote 연결**

```bash
cd /Users/lee/SKU-SW/swproject
git remote add origin https://github.com/SKU-SW/fe.git
git remote -v
```

Expected:
```
origin  https://github.com/SKU-SW/fe.git (fetch)
origin  https://github.com/SKU-SW/fe.git (push)
```

- [ ] **Step 2: main 브랜치 확인 및 push**

```bash
cd /Users/lee/SKU-SW/swproject
git branch -M main
git push -u origin main
```

Expected: `Branch 'main' set up to track remote branch 'main' from 'origin'`

- [ ] **Step 3: develop 브랜치 생성 및 push**

```bash
cd /Users/lee/SKU-SW/swproject
git checkout -b develop
git push -u origin develop
```

Expected: `Branch 'develop' set up to track remote branch 'develop' from 'origin'`

- [ ] **Step 4: GitHub에서 확인**

```bash
gh repo view SKU-SW/fe --web
```

브라우저에서 `main`, `develop` 브랜치와 커밋 히스토리 확인

- [ ] **Step 5: main 브랜치로 복귀**

```bash
cd /Users/lee/SKU-SW/swproject
git checkout main
```

---

## 최종 확인 체크리스트

```bash
# 전체 디렉토리 구조 확인
find /Users/lee/SKU-SW/swproject/src -type f | sort

# 브랜치 확인
cd /Users/lee/SKU-SW/swproject && git branch -a

# 빌드 최종 확인
npm run build
```

Expected:
- `src/shared/`, `src/features/`, `src/app/` 전체 파일 출력
- `main`, `develop`, `remotes/origin/main`, `remotes/origin/develop` 출력
- 빌드 에러 없음
