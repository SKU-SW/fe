# 로그인/대시보드 UI/UX 디자인 리뷰 & 개선안

**작성일**: 2026-04-22  
**리뷰 대상**: LoginPage, SignupPage, DashboardLayout, AuthCard, GoogleButton  
**리뷰어**: Design Specialist

---

## 목차
1. [현재 상태 분석](#현재-상태-분석)
2. [주요 문제점](#주요-문제점)
3. [개선안](#개선안)
4. [구현 가이드](#구현-가이드)

---

## 현재 상태 분석

### ✅ 잘된 점

#### 1. **Auth 페이지 (LoginPage, SignupPage)**
- **다크 테마 일관성**: `bg-slate-950` 배경과 `bg-slate-900` 카드로 통일된 어두운 분위기
- **명확한 시각 계층**: 제목(2xl), 라벨(sm), 입력 필드의 크기 차이로 명확한 구조
- **아이콘 활용**: Mail, Lock, User 아이콘으로 시각적 가이드 제공
- **에러 처리**: API 에러와 필드 에러를 구분하여 표시
- **로딩 상태**: 버튼 비활성화 + 텍스트 변경으로 진행 상황 표시
- **접근성 기본**: label-input 쌍, htmlFor 연결, placeholder 제공

#### 2. **DashboardLayout**
- **레이아웃 구조**: 사이드바 + 헤더 + 메인 영역의 기본 레이아웃 구현
- **라우트 보호**: 인증 가드 준비 (현재 임시 비활성화)
- **네비게이션**: NAV_ITEMS 배열로 관리하기 쉬운 구조

---

## 주요 문제점

### 🔴 **문제 1: 테마 불일치 (Critical)**

**현황**:
- Auth 페이지: 다크 테마 (`bg-slate-950`)
- Dashboard: 라이트 테마 (`bg-gray-100`, `bg-white`)
- **불연속적인 사용자 경험**: 로그인 → 대시보드 전환 시 급격한 시각적 변화

**영향**:
- 브랜드 일관성 약화
- 사용자 혼동 (다른 앱인 것처럼 느껴짐)
- 라이트 테마에서 다크 테마 전환은 눈 피로 증가

**권장사항**: 
- **통일 방향**: 다크 테마로 전체 통일 (현대적, AI 기반 앱에 적합)
- 또는 라이트 테마로 통일 (더 명확하고 공식적)

---

### 🔴 **문제 2: 대시보드 헤더 부족 (High)**

**현황**:
```tsx
<header className="flex h-14 items-center justify-between border-b bg-white px-6">
  <span className="text-sm text-gray-500">SWproject 대시보드</span>
  <button>로그아웃</button>
</header>
```

**문제점**:
- 사용자 정보 미표시 (누가 로그인했는지 불명확)
- 알림, 설정 등 주요 기능 없음
- 헤더 높이 너무 낮음 (h-14 = 56px)
- 타이틀만 있고 현재 페이지 정보 없음

**필요 요소**:
- ✓ 사용자 프로필 (아바타 + 이름)
- ✓ 현재 페이지 타이틀 (동적)
- ✓ 알림 벨 (향후 기능)
- ✓ 설정 메뉴
- ✓ 사용자 드롭다운 (프로필, 설정, 로그아웃)

---

### 🔴 **문제 3: 사이드바 UX 부족 (High)**

**현황**:
```tsx
<nav className="mt-2 flex flex-col gap-1 px-3">
  {NAV_ITEMS.map((item) => (
    <Link
      to={item.href}
      className="rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50"
    >
      {item.label}
    </Link>
  ))}
</nav>
```

**문제점**:
1. **활성 상태 표시 없음**: 현재 페이지가 어디인지 모름
2. **아이콘 없음**: 텍스트만으로는 시각적 스캔 어려움
3. **축소 기능 없음**: 모바일에서 공간 낭비
4. **그룹화 없음**: 7개 항목이 평면 구조
5. **호버 상태 약함**: 인터랙션 피드백 부족

**권장 개선**:
- 각 항목에 아이콘 추가
- 활성 상태: 배경색 + 좌측 보더
- 섹션 그룹화 (메인 / 설정)
- 모바일: 토글 가능한 사이드바
- 호버: 배경 + 텍스트 색상 변화

---

### 🟡 **문제 4: 모바일 반응형 미흡 (Medium)**

**현황**:
- DashboardLayout은 `flex` 기반 레이아웃이지만 모바일 대응 없음
- 사이드바가 모바일에서 그대로 표시되어 화면 낭비
- Auth 페이지는 `p-4`로 기본 패딩만 있음

**필요 개선**:
- 모바일: 사이드바 → 하단 탭 또는 토글 메뉴
- 태블릿: 축소된 사이드바 (아이콘만)
- 데스크톱: 기본 레이아웃

---

### 🟡 **문제 5: 접근성 미흡 (Medium)**

**현황**:
- 기본 label-input 쌍은 있음
- 하지만 `aria-*` 속성 부족
- 키보드 네비게이션 미검증
- 폼 제출 시 에러 포커스 관리 없음

**필요 개선**:
- `aria-label`, `aria-describedby` 추가
- 에러 시 포커스 이동
- 탭 순서 명시
- 시각 장애인 대응: 스크린 리더 테스트

---

### 🟡 **문제 6: 대시보드 메인 페이지 구현 부재 (Medium)**

**현황**:
- `/dashboard` 라우트가 정의되지 않음
- 메인 페이지 UI 스펙 없음
- 사용자가 로그인 후 보게 될 첫 화면 불명확

**필요 요소** (요구사항 기반):
- AI 모드 상태 표시 (방송 중 | 공백 | 게임)
- AI 반응 전략 현황 (응원 | 일반 | 비판)
- 음성 입력 방식 제어 (자동인식 | PTT | 비활성화)
- AI 동작 On/Off (음성출력 | 무음 | 완전OFF)

---

### 🟡 **문제 7: 시각적 피드백 부족 (Medium)**

**현황**:
- 버튼: hover 상태만 있음 (active, focus 상태 미흡)
- 입력 필드: focus ring만 있음 (성공/경고 상태 없음)
- 로딩 상태: 텍스트 변경만 있음 (스피너 없음)

**필요 개선**:
- 버튼: active, focus 상태 추가
- 입력 필드: success, warning 상태 (향후)
- 로딩: 스피너 또는 프로그레스 바
- 토스트 알림: 성공/실패 메시지

---

### 🟡 **문제 8: 브랜드 정체성 약함 (Medium)**

**현황**:
- "SWproject"라는 텍스트만 있음
- 로고 없음
- 색상이 제네릭 (파란색, 회색)
- 폰트: 기본 sans-serif

**필요 개선**:
- 로고 추가
- 브랜드 색상 정의 (기본: 파란색 → 보라색/인디고로 차별화)
- 폰트: 한글 본문(Pretendard) + 영문 헤더(Poppins 등)
- 브랜드 가이드라인 문서화

---

## 개선안

### 📋 **개선안 1: 테마 통일 (다크 테마)**

#### 색상 팔레트 (다크 테마)

```typescript
// tailwind.config.ts 확장
const colors = {
  // 배경
  bg: {
    primary: 'bg-slate-950',      // 페이지 배경
    secondary: 'bg-slate-900',    // 카드, 섹션
    tertiary: 'bg-slate-800',     // 호버, 활성
  },
  
  // 텍스트
  text: {
    primary: 'text-white',        // 주 텍스트
    secondary: 'text-slate-300',  // 라벨, 보조
    tertiary: 'text-slate-400',   // 플레이스홀더, 약한 텍스트
  },
  
  // 액센트
  accent: {
    primary: 'bg-blue-600',       // 주 버튼
    hover: 'bg-blue-700',
    focus: 'ring-blue-500',
  },
};
```

#### DashboardLayout 수정

```tsx
// Before
<div className="flex min-h-screen bg-gray-100">
  <aside className="w-60 bg-white shadow-sm">
  
// After
<div className="flex min-h-screen bg-slate-950">
  <aside className="w-60 bg-slate-900 border-r border-slate-800 shadow-lg">
```

**장점**:
- Auth → Dashboard 전환 시 일관된 어두운 분위기 유지
- 현대적, 프리미엄 느낌
- 눈 피로 감소 (야간 사용에 적합)

---

### 📋 **개선안 2: 대시보드 헤더 개선**

#### 새 헤더 구조

```tsx
/**
 * @file 대시보드 헤더 컴포넌트
 * @created Sprint 2 - Dashboard Header
 * @dependsOn useAuthStore, useNavigate
 * @usedBy DashboardLayout
 */

import { Bell, Settings, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/shared/stores/authStore';
import { useLogout } from '@/features/auth/hooks';
import { useState } from 'react';

interface DashboardHeaderProps {
  pageTitle?: string;
}

export function DashboardHeader({ pageTitle = 'Dashboard' }: DashboardHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const { logout, isPending } = useLogout();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 shadow-lg">
      {/* 좌측: 페이지 타이틀 */}
      <div>
        <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
        <p className="text-xs text-slate-400">AI 스트리머 파트너</p>
      </div>

      {/* 우측: 알림 + 설정 + 사용자 메뉴 */}
      <div className="flex items-center gap-4">
        {/* 알림 벨 */}
        <button
          type="button"
          className="relative p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="알림"
        >
          <Bell className="h-5 w-5" />
          {/* 알림 배지 (향후) */}
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        {/* 설정 */}
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="설정"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* 사용자 드롭다운 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="사용자 메뉴"
            aria-expanded={showUserMenu}
          >
            {/* 아바타 */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-medium text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400">{user?.email || 'user@example.com'}</p>
            </div>
          </button>

          {/* 드롭다운 메뉴 */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-800 border border-slate-700 shadow-lg z-50">
              <a
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <User className="h-4 w-4" />
                프로필
              </a>
              <a
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4" />
                설정
              </a>
              <hr className="border-slate-700 my-1" />
              <button
                type="button"
                onClick={() => {
                  void logout();
                  setShowUserMenu(false);
                }}
                disabled={isPending}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {isPending ? '로그아웃 중...' : '로그아웃'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
```

#### Tailwind 클래스 정리

| 요소 | 클래스 |
|---|---|
| 헤더 배경 | `bg-slate-900 border-b border-slate-800` |
| 헤더 높이 | `h-16` (64px, 더 넓음) |
| 타이틀 | `text-lg font-semibold text-white` |
| 서브타이틀 | `text-xs text-slate-400` |
| 아이콘 버튼 | `p-2 text-slate-400 hover:text-white` |
| 드롭다운 | `bg-slate-800 border border-slate-700` |
| 드롭다운 항목 호버 | `hover:bg-slate-700 hover:text-white` |

**개선점**:
- ✓ 사용자 정보 명확 (아바타 + 이름 + 이메일)
- ✓ 알림, 설정 기능 준비
- ✓ 현재 페이지 타이틀 표시
- ✓ 드롭다운 메뉴로 로그아웃 통합
- ✓ 더 높은 헤더로 여유 있는 디자인

---

### 📋 **개선안 3: 사이드바 개선**

#### 새 사이드바 구조

```tsx
/**
 * @file 대시보드 사이드바 컴포넌트
 * @created Sprint 2 - Dashboard Sidebar
 * @dependsOn react-router-dom
 * @usedBy DashboardLayout
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  MessageCircle,
  Shield,
  Gamepad2,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  group: 'main' | 'settings';
}

const NAV_ITEMS: NavItem[] = [
  // Main
  { href: '/dashboard', label: '대시보드', icon: <LayoutDashboard className="h-5 w-5" />, group: 'main' },
  { href: '/character', label: 'AI 캐릭터', icon: <Zap className="h-5 w-5" />, group: 'main' },
  { href: '/chat-analysis', label: '채팅 분석', icon: <MessageCircle className="h-5 w-5" />, group: 'main' },
  { href: '/proactive', label: '선제 반응', icon: <Shield className="h-5 w-5" />, group: 'main' },
  { href: '/game', label: '게임 연동', icon: <Gamepad2 className="h-5 w-5" />, group: 'main' },
  
  // Settings
  { href: '/stats', label: '방송 통계', icon: <BarChart3 className="h-5 w-5" />, group: 'settings' },
  { href: '/settings', label: '설정', icon: <Settings className="h-5 w-5" />, group: 'settings' },
];

interface DashboardSidebarProps {
  onCollapse?: (collapsed: boolean) => void;
}

export function DashboardSidebar({ onCollapse }: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapse?.(newState);
  };

  const isActive = (href: string) => location.pathname === href;

  const mainItems = NAV_ITEMS.filter((item) => item.group === 'main');
  const settingsItems = NAV_ITEMS.filter((item) => item.group === 'settings');

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300`}
    >
      {/* 로고 영역 */}
      <div className="px-6 py-5 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-lg font-bold text-white">SWproject</span>
          </div>
        )}
        <button
          type="button"
          onClick={toggleCollapse}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label={isCollapsed ? '사이드바 확장' : '사이드바 축소'}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {/* Main 섹션 */}
        {!isCollapsed && <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">메인</p>}
        {mainItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}

        {/* Settings 섹션 */}
        {!isCollapsed && <hr className="border-slate-800 my-4" />}
        {!isCollapsed && <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase">설정</p>}
        {settingsItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
              isActive(item.href)
                ? 'bg-blue-600/20 text-blue-400 border-l-2 border-blue-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isCollapsed ? item.label : undefined}
          >
            {item.icon}
            {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* 버전 정보 (선택사항) */}
      {!isCollapsed && (
        <div className="px-6 py-4 border-t border-slate-800">
          <p className="text-xs text-slate-500">v1.0.0</p>
        </div>
      )}
    </aside>
  );
}
```

#### 주요 개선점

| 개선 항목 | 전 | 후 |
|---|---|---|
| 아이콘 | 없음 | lucide-react 아이콘 추가 |
| 활성 상태 | 없음 | 배경색 + 좌측 보더 + 파란색 강조 |
| 축소 기능 | 없음 | 토글 버튼 + 애니메이션 |
| 그룹화 | 평면 | "메인" / "설정" 섹션 분리 |
| 호버 상태 | `hover:bg-indigo-50` | `hover:bg-slate-800 hover:text-white` |
| 너비 | 240px (w-60) | 256px (w-64) 또는 80px (w-20, 축소) |
| 로고 | 텍스트만 | 아이콘 + 텍스트 |

---

### 📋 **개선안 4: 대시보드 메인 페이지 UI**

#### 새 DashboardPage 구조

```tsx
/**
 * @file 대시보드 메인 페이지
 * @created Sprint 2 - Dashboard Main
 * @dependsOn useAuthStore
 * @usedBy App.tsx (라우트)
 */

import { Activity, Mic, Radio, Volume2, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">대시보드</h1>
          <p className="text-slate-400 mt-1">AI 스트리머 상태를 한눈에 확인하세요</p>
        </div>
        <button
          type="button"
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          방송 시작
        </button>
      </div>

      {/* 상태 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AI 모드 상태 */}
        <StatusCard
          title="AI 모드"
          icon={<Radio className="h-6 w-6" />}
          status="방송 중"
          color="green"
          details={['모드: 응원', '응답률: 94%']}
        />

        {/* 반응 전략 */}
        <StatusCard
          title="반응 전략"
          icon={<Activity className="h-6 w-6" />}
          status="응원"
          color="blue"
          details={['활성도: 높음', '감정 톤: 긍정']}
        />

        {/* 음성 입력 */}
        <StatusCard
          title="음성 입력"
          icon={<Mic className="h-6 w-6" />}
          status="자동인식"
          color="purple"
          details={['감도: 중간', '언어: 한국어']}
        />

        {/* AI 동작 */}
        <StatusCard
          title="AI 동작"
          icon={<Volume2 className="h-6 w-6" />}
          status="음성출력"
          color="orange"
          details={['볼륨: 80%', '속도: 정상']}
        />
      </div>

      {/* 상세 제어 패널 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 좌측: 상태 제어 */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI 모드 제어 */}
          <ControlPanel title="AI 모드 설정">
            <div className="space-y-3">
              <RadioGroup
                label="현재 모드"
                options={['방송 중', '공백', '게임']}
                selected="방송 중"
              />
            </div>
          </ControlPanel>

          {/* 반응 전략 제어 */}
          <ControlPanel title="반응 전략">
            <div className="space-y-3">
              <RadioGroup
                label="반응 타입"
                options={['응원', '일반', '비판']}
                selected="응원"
              />
            </div>
          </ControlPanel>

          {/* 음성 제어 */}
          <ControlPanel title="음성 입력 제어">
            <div className="space-y-3">
              <RadioGroup
                label="입력 방식"
                options={['자동인식', 'PTT (Push-To-Talk)', '비활성화']}
                selected="자동인식"
              />
            </div>
          </ControlPanel>
        </div>

        {/* 우측: 빠른 제어 */}
        <div className="space-y-4">
          <ControlPanel title="빠른 제어">
            <div className="space-y-2">
              <ToggleButton label="음성 출력" enabled={true} />
              <ToggleButton label="무음 모드" enabled={false} />
              <ToggleButton label="완전 OFF" enabled={false} />
            </div>
          </ControlPanel>

          {/* 상태 요약 */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              상태 요약
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">방송 시간</span>
                <span className="text-white font-medium">2h 34m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">채팅 수</span>
                <span className="text-white font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI 응답</span>
                <span className="text-white font-medium">456</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 컴포넌트 ============

interface StatusCardProps {
  title: string;
  icon: React.ReactNode;
  status: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
  details: string[];
}

function StatusCard({ title, icon, status, color, details }: StatusCardProps) {
  const colorMap = {
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>{icon}</div>
      </div>
      <div className={`text-lg font-bold mb-2 ${colorMap[color].split(' ')[1]}`}>{status}</div>
      <div className="space-y-1">
        {details.map((detail, idx) => (
          <p key={idx} className="text-xs text-slate-400">
            {detail}
          </p>
        ))}
      </div>
    </div>
  );
}

interface ControlPanelProps {
  title: string;
  children: React.ReactNode;
}

function ControlPanel({ title, children }: ControlPanelProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

interface RadioGroupProps {
  label: string;
  options: string[];
  selected: string;
}

function RadioGroup({ label, options, selected }: RadioGroupProps) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300 block mb-2">{label}</label>
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name={label}
              value={option}
              checked={option === selected}
              readOnly
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-sm text-slate-300">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  label: string;
  enabled: boolean;
}

function ToggleButton({ label, enabled }: ToggleButtonProps) {
  return (
    <button
      type="button"
      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        enabled
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
      }`}
    >
      {label}
    </button>
  );
}
```

#### 레이아웃 설명

| 섹션 | 용도 | 그리드 |
|---|---|---|
| 상태 카드 | 현재 상태 한눈에 보기 | 4열 (반응형) |
| 상세 제어 | AI 모드, 반응 전략, 음성 제어 | 2/3 + 1/3 |
| 빠른 제어 | 토글 버튼 (음성, 무음, OFF) | 사이드바 |
| 상태 요약 | 방송 통계 | 사이드바 |

---

### 📋 **개선안 5: 모바일 반응형 설계**

#### 반응형 DashboardLayout

```tsx
export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const accessToken = useAuthStore((s) => s.accessToken);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-950">
      {/* 모바일: 사이드바 토글 */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 text-slate-400"
        >
          ☰
        </button>
      </div>

      {/* 사이드바 (모바일: 조건부) */}
      {(sidebarOpen || window.innerWidth >= 768) && (
        <DashboardSidebar onCollapse={(collapsed) => {}} />
      )}

      {/* 메인 영역 */}
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

#### 반응형 포인트

| 화면 크기 | 변화 |
|---|---|
| `sm` (640px) | 사이드바 숨김, 하단 탭 표시 |
| `md` (768px) | 사이드바 표시 (축소 가능) |
| `lg` (1024px) | 풀 레이아웃 |
| `xl` (1280px) | 여유 있는 레이아웃 |

---

### 📋 **개선안 6: 접근성 강화**

#### WCAG 2.1 AA 준수 체크리스트

```tsx
// 1. 폼 접근성
<div className="space-y-1.5">
  <label htmlFor="email" className="text-sm font-medium text-slate-300">
    이메일
  </label>
  <input
    id="email"
    type="email"
    aria-label="이메일 주소"
    aria-describedby="email-error"
    placeholder="name@example.com"
    className="..."
  />
  {errors.email && (
    <p id="email-error" className="text-red-400 text-sm" role="alert">
      {errors.email.message}
    </p>
  )}
</div>

// 2. 버튼 접근성
<button
  type="submit"
  disabled={isSubmitting}
  aria-busy={isSubmitting}
  className="..."
>
  {isSubmitting ? '로그인 중...' : '로그인'}
</button>

// 3. 네비게이션 접근성
<nav aria-label="메인 네비게이션">
  {NAV_ITEMS.map((item) => (
    <Link
      to={item.href}
      aria-current={isActive(item.href) ? 'page' : undefined}
      className="..."
    >
      {item.label}
    </Link>
  ))}
</nav>

// 4. 색상 대비
// WCAG AA: 최소 4.5:1 (텍스트), 3:1 (그래픽)
// 예: 흰색 텍스트(#fff) on 파란색(#2563eb) = 8.6:1 ✓

// 5. 포커스 스타일
className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
```

---

### 📋 **개선안 7: 로딩 & 에러 상태**

#### 로딩 스피너

```tsx
function LoadingSpinner() {
  return (
    <div className="inline-flex items-center justify-center">
      <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-600 border-t-blue-500" />
    </div>
  );
}

// 사용
<button disabled={isSubmitting} className="...">
  {isSubmitting ? (
    <>
      <LoadingSpinner />
      로그인 중...
    </>
  ) : (
    '로그인'
  )}
</button>
```

#### 토스트 알림

```tsx
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

function Toast({ type, message }: Omit<Toast, 'id'>) {
  const bgColor = {
    success: 'bg-green-900 border-green-700',
    error: 'bg-red-900 border-red-700',
    info: 'bg-blue-900 border-blue-700',
    warning: 'bg-yellow-900 border-yellow-700',
  }[type];

  const textColor = {
    success: 'text-green-300',
    error: 'text-red-300',
    info: 'text-blue-300',
    warning: 'text-yellow-300',
  }[type];

  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      <p className={`text-sm font-medium ${textColor}`}>{message}</p>
    </div>
  );
}
```

---

## 구현 가이드

### 단계별 구현 계획

#### Phase 1: 기본 테마 통일 (1일)
1. Tailwind 색상 변수 정의
2. DashboardLayout 다크 테마 적용
3. 기존 페이지 테마 확인

#### Phase 2: 헤더 & 사이드바 개선 (2일)
1. `DashboardHeader.tsx` 생성
2. `DashboardSidebar.tsx` 생성
3. DashboardLayout 통합
4. 모바일 반응형 추가

#### Phase 3: 대시보드 메인 페이지 (2일)
1. `DashboardPage.tsx` 생성
2. 상태 카드, 제어 패널 컴포넌트 개발
3. 라우트 연결

#### Phase 4: 접근성 & 폴리시 (1일)
1. aria 속성 추가
2. 키보드 네비게이션 테스트
3. 색상 대비 검증

#### Phase 5: 애니메이션 & 피드백 (1일)
1. 로딩 스피너 추가
2. 토스트 알림 시스템
3. 페이지 전환 애니메이션

---

### 파일 생성 체크리스트

```
src/
├── components/
│   └── layouts/
│       ├── DashboardLayout.tsx (수정)
│       ├── DashboardHeader.tsx (신규)
│       └── DashboardSidebar.tsx (신규)
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx (검토)
│   │   └── SignupPage.tsx (검토)
│   └── dashboard/
│       └── DashboardPage.tsx (신규)
├── shared/
│   └── components/
│       ├── Toast.tsx (신규)
│       ├── LoadingSpinner.tsx (신규)
│       └── ConfirmDialog.tsx (신규)
└── styles/
    └── animations.css (신규)
```

---

## 요약 테이블

| 항목 | 현재 상태 | 개선안 | 우선순위 |
|---|---|---|---|
| 테마 통일 | 불일치 (다크/라이트) | 다크 테마 전체 통일 | 🔴 Critical |
| 헤더 | 기본 (타이틀 + 로그아웃) | 사용자 정보 + 알림 + 드롭다운 | 🔴 High |
| 사이드바 | 텍스트 링크만 | 아이콘 + 활성 상태 + 축소 | 🔴 High |
| 메인 페이지 | 없음 | 상태 카드 + 제어 패널 | 🔴 High |
| 모바일 반응형 | 미흡 | 토글 사이드바 + 레이아웃 조정 | 🟡 Medium |
| 접근성 | 기본 | aria 속성 + 키보드 네비게이션 | 🟡 Medium |
| 로딩/에러 | 기본 | 스피너 + 토스트 알림 | 🟡 Medium |
| 브랜드 정체성 | 약함 | 로고 + 색상 팔레트 + 폰트 | 🟢 Low |

---

## 결론

현재 구현된 Auth 페이지는 **기본 구조는 견고**하지만, 대시보드 영역에서 **테마 불일치, 헤더/사이드바 부족, 메인 페이지 미구현** 등의 문제가 있습니다.

**즉시 개선 권장**:
1. 다크 테마로 전체 통일
2. 헤더 개선 (사용자 정보, 알림)
3. 사이드바 개선 (아이콘, 활성 상태)
4. 대시보드 메인 페이지 구현

이 개선안을 단계적으로 적용하면 **일관되고 전문적인 UI/UX**를 갖춘 애플리케이션이 완성될 것입니다.
