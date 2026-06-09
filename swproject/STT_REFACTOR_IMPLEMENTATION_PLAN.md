# SKU-SW STT/PTT 상주형(Background Resident) 아키텍처 전환 계획

**목표**: DashboardPage 의존성 제거 → 앱 시작 시 자동 초기화되는 백그라운드 서비스로 전환  
**범위**: Phase 1 (STT 서비스) + Phase 2 (WebSocket 서비스) + Phase 3 (백엔드 개선)  
**기간**: 5-8일 (Phase 1-2 기준)

---

## 📋 현재 상태 분석

### 문제점
- **DashboardPage 종속성**: useSTT 훅이 DashboardPage 에서만 초기화 → 다른 페이지에서 PTT 불가
- **전역 핫키 리스너**: useSTT 내부 useEffect (lines 264-282) 에서 관리 → 페이지 언마운트 시 정리됨
- **WebSocket 중복 연결**: useStreamWS 도 DashboardPage 에서만 초기화 → 페이지 이동 시 재연결 발생
- **토큰 갱신 미처리**: axios 인터셉터는 토큰 갱신하지만, WebSocket 은 수동 재연결 필요

### 현재 흐름
```
App 시작
  ↓
DashboardPage 진입
  ↓
useSTT 초기화 (전역 핫키 리스너 등록)
useStreamWS 초기화 (WebSocket 연결)
  ↓
페이지 이동 (예: CharacterPage)
  ↓
useSTT/useStreamWS 언마운트 (리스너/연결 정리)
  ↓
다시 DashboardPage 진입
  ↓
useSTT/useStreamWS 재초기화 (중복 연결 위험)
```

---

## 🎯 목표 아키텍처

```
App 시작
  ↓
AppInitializer 컴포넌트 (root 레벨)
  ↓
sttBackgroundService 초기화 (싱글톤)
  ├─ 전역 핫키 리스너 등록 (앱 전체 수명)
  ├─ MediaRecorder 로직 (useSTT 에서 추출)
  └─ 콜백 등록 인터페이스 제공
  ↓
broadcastWSBackgroundService 초기화 (싱글톤)
  ├─ authStore/aiModeStore 구독 (토큰 갱신 감지)
  ├─ WebSocket 자동 재연결
  └─ 메시지 라우팅 (UI 콜백 등록)
  ↓
페이지 이동 (CharacterPage, SettingsPage 등)
  ↓
서비스 계속 실행 (핫키/WebSocket 유지)
  ↓
DashboardPage 진입
  ↓
useSTT/useStreamWS 훅 (UI 상태만 구독, 로직은 서비스 위임)
```

---

## 📁 파일 구조 (Phase 1-2)

### 새로 만들 파일 (3개)

#### 1️⃣ `src/services/sttBackgroundService.ts` (Phase 1)
**책임**: 마이크 입력 → STT 변환 → 콜백 실행 (DashboardPage 독립)

**주요 기능**:
- MediaRecorder 라이프사이클 관리 (useSTT 에서 추출)
- 전역 핫키 리스너 (Cmd/Ctrl+Shift+M) 등록/해제
- Electron IPC 통신 (window.electronAPI.stt.transcribe)
- 콜백 등록 인터페이스 (onFinalTranscript, onError)
- 세션 ID 관리 (중복 요청 방지)

**크기**: ~350-400 줄

**의존성**:
- `window.electronAPI.stt.*` (Electron preload)
- `navigator.mediaDevices.getUserMedia()`
- `useAIModeStore` (currentTranscript 저장)

**사용처**:
- `src/components/AppInitializer.tsx` (초기화)
- `src/features/stt/hooks/useSTT.ts` (UI 상태 구독)

---

#### 2️⃣ `src/services/broadcastWSBackgroundService.ts` (Phase 2)
**책임**: WebSocket 연결 → 메시지 라우팅 → 자동 재연결 (DashboardPage 독립)

**주요 기능**:
- WebSocket 라이프사이클 (useStreamWS 에서 추출)
- authStore.accessToken 변경 감지 → 자동 재연결
- aiModeStore.broadcastStreamId 변경 감지 → 연결/해제
- 메시지 콜백 등록 (onVoiceChunk, onVoiceTurnComplete, onEmotionChange)
- 채팅 송신 (sendChat)
- 중복 연결 방지 (isConnected() 체크)

**크기**: ~450-500 줄

**의존성**:
- `useAuthStore` (accessToken 구독)
- `useAIModeStore` (broadcastStreamId 구독)
- `src/shared/types/broadcastWs.ts`

**사용처**:
- `src/components/AppInitializer.tsx` (초기화)
- `src/features/broadcast/hooks/useStreamWS.ts` (UI 상태 구독)

---

#### 3️⃣ `src/components/AppInitializer.tsx` (Phase 1)
**책임**: 앱 시작 시 백그라운드 서비스 초기화 + 콜백 연결

**주요 기능**:
- sttBackgroundService 초기화
- broadcastWSBackgroundService 초기화 (Phase 2)
- 서비스 간 콜백 연결 (STT 결과 → WebSocket 송신)
- 언마운트 시 정리 (cleanup)
- null 반환 (UI 렌더링 없음)

**크기**: ~120-150 줄

**의존성**:
- `src/services/sttBackgroundService.ts`
- `src/services/broadcastWSBackgroundService.ts` (Phase 2)
- `useAIModeStore`

**사용처**:
- `src/main.tsx` (App 래핑)

---

### 수정할 기존 파일 (5개)

#### 1️⃣ `src/main.tsx`
**변경 사항**: AppInitializer 로 App 래핑

**Before**:
```tsx
createRoot(document.getElementById("root")!).render(
  <App />
);
```

**After**:
```tsx
import { AppInitializer } from "@/components/AppInitializer";

createRoot(document.getElementById("root")!).render(
  <AppInitializer>
    <App />
  </AppInitializer>
);
```

**라인 수**: +5-10 줄

---

#### 2️⃣ `src/features/stt/hooks/useSTT.ts`
**변경 사항**: 전역 핫키 리스너 제거 + 서비스 위임

**제거할 부분** (lines 264-282):
```tsx
// 전역 PTT(Cmd/Ctrl+Shift+M hold) 이벤트 구독
useEffect(() => {
  const onGlobalPtt = window.electronAPI?.stt?.onGlobalPtt;
  if (typeof onGlobalPtt !== 'function') return;

  const unsubscribe = onGlobalPtt((payload) => {
    if (payload.type === 'start') {
      if (isListening) return;
      void startListening();
      return;
    }

    if (!isListening) return;
    void stopListening();
  });

  return unsubscribe;
}, [isListening, startListening, stopListening]);
```

**유지할 부분**:
- startListening / stopListening / cancelListening (로직 그대로)
- pushDebugTranscript
- MediaRecorder 상태 관리 (UI 렌더링용)

**라인 수**: -20 줄

**주의**: 
- 기존 호출자 (DashboardPage) 는 여전히 useSTT 사용 가능
- 단, 핫키는 이제 sttBackgroundService 에서 관리
- UI 는 isListening 상태만 구독

---

#### 3️⃣ `src/pages/DashboardPage.tsx`
**변경 사항**: handleFinalTranscript 콜백 제거 + WebSocket 콜백 간소화

**제거할 부분** (lines 321-334):
```tsx
const handleFinalTranscript = useCallback(
  async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!toggles.sttEnabled) {
      throw new Error("음성인식이 꺼져 있습니다. 토글을 다시 켜주세요.");
    }
    const result = sendStreamerMessage(trimmed);
    if (!result.ok) {
      throw new Error(result.reason ?? "LLM 전송에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  },
  [sendStreamerMessage, toggles.sttEnabled]
);
```

**변경 사항** (lines 337-344):
```tsx
// Before
const {
  isListening,
  isSupported,
  error: sttError,
  startListening,
  stopListening,
  cancelListening,
} = useSTT({ onFinalTranscript: handleFinalTranscript });

// After
const {
  isListening,
  isSupported,
  error: sttError,
  startListening,
  stopListening,
  cancelListening,
} = useSTT(); // onFinalTranscript 제거 (서비스가 처리)
```

**제거할 부분** (lines 395-448):
```tsx
// 키보드 PTT 이벤트 리스너 (이제 sttBackgroundService 에서 관리)
useEffect(() => {
  if (!isBroadcasting || !toggles.sttEnabled || !isSupported) return;
  // ... 핫키 로직 ...
}, [isBroadcasting, toggles.sttEnabled, isSupported, startListening, stopListening, cancelListening]);
```

**라인 수**: -60 줄

**주의**:
- CharacterPortrait 의 speakingState 는 여전히 isListening 으로 표시
- BroadcastControls 의 마이크 버튼은 여전히 startListening/stopListening 호출 가능
- 핫키는 이제 앱 전체에서 작동 (DashboardPage 진입 필요 없음)

---

#### 4️⃣ `src/features/broadcast/hooks/useStreamWS.ts`
**변경 사항**: 중복 연결 방지 + 서비스 위임 준비

**추가할 부분** (connect 함수 시작):
```tsx
const connect = useCallback(() => {
  if (!wsUrl) return;
  // 중복 연결 방지: broadcastWSBackgroundService 가 이미 연결 중이면 무시
  if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return;
  // ... 기존 로직 ...
}, [wsUrl, ...]);
```

**라인 수**: +5-10 줄 (주석 + 체크 로직)

**주의**:
- Phase 2 에서 이 훅은 서비스의 상태만 구독하는 래퍼로 변환 예정
- 지금은 기존 로직 유지 + 중복 연결 방지만 추가

---

#### 5️⃣ `src/shared/stores/aiModeStore.ts`
**변경 사항**: 없음 (Phase 1-2 에서는 기존 구조 유지)

**주의**:
- broadcastWSBackgroundService 가 `.subscribe()` 로 구독
- Phase 3 에서 sttStore/broadcastWSStore 분리 검토

---

## 🔄 구현 순서 (Day-by-Day)

### Phase 1: STT 서비스 (Day 1-2)

#### Day 1 AM (2-3시간)
**작업**: `src/services/sttBackgroundService.ts` 생성

**체크리스트**:
- [ ] useSTT.ts 에서 MediaRecorder 로직 추출
- [ ] 전역 핫키 리스너 구현 (window.electronAPI.stt.onGlobalPtt)
- [ ] 콜백 등록 인터페이스 (onFinalTranscript, onError)
- [ ] 세션 ID 관리 (중복 요청 방지)
- [ ] 싱글톤 패턴 (export const sttBackgroundService = new STTBackgroundService())
- [ ] 타입 정의 (STTBackgroundServiceOptions, STTBackgroundServiceState)
- [ ] 에러 처리 (마이크 권한, 네트워크 등)

**테스트**:
- 핫키 누르면 마이크 ON/OFF 되는지 확인
- 다른 페이지에서도 핫키 작동하는지 확인

---

#### Day 1 PM (2-3시간)
**작업**: `src/components/AppInitializer.tsx` 생성 + `src/main.tsx` 수정

**체크리스트**:
- [ ] AppInitializer 컴포넌트 생성 (null 반환)
- [ ] sttBackgroundService 초기화
- [ ] 콜백 등록 (onFinalTranscript → WebSocket 송신 준비)
- [ ] 언마운트 시 정리 (cleanup)
- [ ] src/main.tsx 에서 App 래핑
- [ ] 타입 정의 (AppInitializerProps)

**테스트**:
- 앱 시작 시 sttBackgroundService 초기화되는지 확인
- 콘솔에 초기화 로그 출력되는지 확인

---

#### Day 1 Eve (1-2시간)
**작업**: `src/features/stt/hooks/useSTT.ts` 수정

**체크리스트**:
- [ ] 전역 핫키 리스너 제거 (lines 264-282)
- [ ] startListening/stopListening 로직 유지
- [ ] 기존 호출자 호환성 확인 (DashboardPage 등)
- [ ] 타입 변경 없음 (UseSTTReturn 동일)

**테스트**:
- DashboardPage 에서 useSTT 여전히 작동하는지 확인
- 마이크 버튼 클릭 시 녹음 시작/종료되는지 확인

---

#### Day 2 AM (2-3시간)
**작업**: `src/pages/DashboardPage.tsx` 수정 (Phase 1)

**체크리스트**:
- [ ] handleFinalTranscript 콜백 제거 (lines 321-334)
- [ ] useSTT 호출에서 onFinalTranscript 제거 (line 344)
- [ ] 키보드 PTT 리스너 제거 (lines 395-448)
- [ ] CharacterPortrait speakingState 유지 (isListening 기반)
- [ ] BroadcastControls 마이크 버튼 유지

**테스트**:
- DashboardPage 진입 시 에러 없는지 확인
- 마이크 버튼 여전히 작동하는지 확인
- 핫키는 이제 앱 전체에서 작동하는지 확인

---

#### Day 2 PM (2-3시간)
**작업**: Phase 1 통합 테스트

**체크리스트**:
- [ ] 앱 시작 → 핫키 작동 확인
- [ ] 페이지 이동 (DashboardPage → CharacterPage → DashboardPage) → 핫키 계속 작동
- [ ] 마이크 녹음 → STT 변환 → 결과 저장 (aiModeStore.currentTranscript)
- [ ] 에러 처리 (마이크 권한 거부, 네트워크 오류 등)
- [ ] 메모리 누수 확인 (DevTools)

**버그 수정**:
- 발견된 이슈 즉시 수정

---

#### Day 2 Eve (1-2시간)
**작업**: Phase 1 문서화 + 코드 리뷰

**체크리스트**:
- [ ] 파일 상단 JSDoc 주석 추가
- [ ] 함수별 주석 추가
- [ ] 타입 정의 명확화
- [ ] 에러 메시지 한국어 통일

---

### Phase 2: WebSocket 서비스 (Day 3-4)

#### Day 3 AM (2-3시간)
**작업**: `src/services/broadcastWSBackgroundService.ts` 생성

**체크리스트**:
- [ ] useStreamWS.ts 에서 WebSocket 로직 추출
- [ ] authStore.accessToken 구독 (토큰 갱신 감지)
- [ ] aiModeStore.broadcastStreamId 구독 (연결/해제)
- [ ] 콜백 등록 인터페이스 (onVoiceChunk, onVoiceTurnComplete, onEmotionChange)
- [ ] 채팅 송신 (sendChat)
- [ ] 자동 재연결 로직
- [ ] 싱글톤 패턴

**테스트**:
- 방송 시작 → WebSocket 연결 확인
- 토큰 갱신 → 자동 재연결 확인

---

#### Day 3 PM (2-3시간)
**작업**: `src/components/AppInitializer.tsx` 수정 (Phase 2)

**체크리스트**:
- [ ] broadcastWSBackgroundService 초기화 추가
- [ ] STT → WebSocket 콜백 연결 (STT 결과 → sendChat)
- [ ] WebSocket 콜백 등록 (onVoiceChunk 등)
- [ ] 언마운트 시 정리 (cleanup)

**테스트**:
- 앱 시작 시 두 서비스 모두 초기화되는지 확인

---

#### Day 3 Eve (1-2시간)
**작업**: 토큰 갱신 재연결 로직 구현

**체크리스트**:
- [ ] authStore.accessToken 변경 감지
- [ ] 토큰 갱신 시 WebSocket 재연결
- [ ] 기존 연결 정리 (close)
- [ ] 새 토큰으로 재연결

**테스트**:
- 토큰 만료 시뮬레이션 → 자동 갱신 → 재연결 확인

---

#### Day 4 AM (2-3시간)
**작업**: `src/features/broadcast/hooks/useStreamWS.ts` 수정 (Phase 2)

**체크리스트**:
- [ ] 중복 연결 방지 로직 추가
- [ ] broadcastWSBackgroundService 상태 구독 (래퍼 패턴)
- [ ] 기존 호출자 호환성 유지

**테스트**:
- DashboardPage 에서 useStreamWS 여전히 작동하는지 확인
- 중복 연결 방지되는지 확인

---

#### Day 4 PM (2-3시간)
**작업**: Phase 2 통합 테스트

**체크리스트**:
- [ ] 방송 시작 → WebSocket 연결 확인
- [ ] STT 결과 → WebSocket 송신 확인
- [ ] WebSocket 응답 (VOICE_CHUNK, VOICE_TURN_COMPLETE) 처리 확인
- [ ] 페이지 이동 → WebSocket 유지 확인
- [ ] 토큰 갱신 → 자동 재연결 확인
- [ ] 에러 처리 (연결 실패, 타임아웃 등)

**버그 수정**:
- 발견된 이슈 즉시 수정

---

#### Day 4 Eve (1-2시간)
**작업**: Phase 2 문서화 + 코드 리뷰

**체크리스트**:
- [ ] 파일 상단 JSDoc 주석 추가
- [ ] 함수별 주석 추가
- [ ] 타입 정의 명확화

---

### Phase 3: 백엔드 개선 (Day 5+, 미뤄도 됨)

#### 필요한 백엔드 변경사항
1. **broadcastStreamId 선택적 흐름**
   - `POST /api/v1/stt/transcribe` 엔드포인트 추가
   - broadcastStreamId 없이도 STT 변환 가능

2. **토큰 갱신 이벤트**
   - WebSocket 에서 토큰 갱신 알림 (선택사항)
   - 현재는 axios 인터셉터 + 수동 재연결로 충분

3. **상태 폴링 제거**
   - 현재 DashboardPage 에서 useStreamInfo 폴링
   - Phase 2 에서 broadcastWSBackgroundService 가 상태 관리

---

## 📊 코드 라인 수 변화

### Phase 1
- **신규**: sttBackgroundService.ts (~350 줄) + AppInitializer.tsx (~120 줄) = ~470 줄
- **삭제**: useSTT.ts (-20 줄) + DashboardPage.tsx (-60 줄) = -80 줄
- **수정**: main.tsx (+10 줄)
- **순증가**: ~400 줄

### Phase 2
- **신규**: broadcastWSBackgroundService.ts (~450 줄) = ~450 줄
- **수정**: AppInitializer.tsx (+30 줄) + useStreamWS.ts (+10 줄) = +40 줄
- **순증가**: ~490 줄

### 전체 (Phase 1-2)
- **순증가**: ~890 줄 (기존 대비 +10-15%)
- **복잡도**: 중간 (새 서비스 2개, 기존 훅 간소화)

---

## ⚠️ 주의사항

### 호환성
- ✅ 기존 useSTT/useStreamWS 훅 호출자 모두 호환
- ✅ DashboardPage 외 다른 페이지에서도 핫키 작동
- ✅ 페이지 이동 시 서비스 유지

### 성능
- ✅ 싱글톤 패턴으로 중복 초기화 방지
- ✅ 콜백 기반 이벤트 (폴링 없음)
- ✅ 메모리 누수 방지 (cleanup 필수)

### 테스트
- ⚠️ Electron IPC 모킹 필요 (window.electronAPI.stt.*)
- ⚠️ WebSocket 모킹 필요 (ws:// 프로토콜)
- ⚠️ Zustand store 모킹 필요 (getState/subscribe)

---

## 🚀 지금 당장 미뤄도 되는 것

### Phase 3 (백엔드 개선)
- broadcastStreamId 선택적 흐름 (현재 필수)
- 토큰 갱신 이벤트 (현재 수동 재연결로 충분)
- 상태 폴링 제거 (현재 useStreamInfo 폴링 유지)

### 추가 최적화
- sttStore/broadcastWSStore 분리 (현재 aiModeStore 사용)
- 완전한 훅 제거 (현재 래퍼 패턴 유지)
- 테스트 코드 작성 (Phase 4+)
- 성능 프로파일링 (필요시)

### 다른 기능
- 오버레이 동기화 (현재 DashboardPage 에서 처리)
- 채팅 분석 (현재 ChatAnalysisPage 독립)
- 게임 모드 (현재 GamePage 독립)

---

## 📝 파일 체크리스트

### Phase 1
- [ ] `src/services/sttBackgroundService.ts` (신규)
- [ ] `src/components/AppInitializer.tsx` (신규)
- [ ] `src/main.tsx` (수정)
- [ ] `src/features/stt/hooks/useSTT.ts` (수정)
- [ ] `src/pages/DashboardPage.tsx` (수정)

### Phase 2
- [ ] `src/services/broadcastWSBackgroundService.ts` (신규)
- [ ] `src/components/AppInitializer.tsx` (수정)
- [ ] `src/features/broadcast/hooks/useStreamWS.ts` (수정)

### Phase 3
- [ ] 백엔드 API 변경 (미뤄도 됨)

---

## 🔗 의존성 그래프

```
App (src/main.tsx)
  ↓
AppInitializer (src/components/AppInitializer.tsx)
  ├─ sttBackgroundService (src/services/sttBackgroundService.ts)
  │  ├─ window.electronAPI.stt.*
  │  ├─ navigator.mediaDevices
  │  └─ useAIModeStore
  │
  └─ broadcastWSBackgroundService (src/services/broadcastWSBackgroundService.ts)
     ├─ useAuthStore
     ├─ useAIModeStore
     └─ WebSocket API

DashboardPage (src/pages/DashboardPage.tsx)
  ├─ useSTT (src/features/stt/hooks/useSTT.ts)
  │  └─ sttBackgroundService (상태 구독)
  │
  └─ useStreamWS (src/features/broadcast/hooks/useStreamWS.ts)
     └─ broadcastWSBackgroundService (상태 구독)
```

---

## 📚 참고 자료

- 이전 세션 분석: `/Users/lee/SKU-SW/stt_refactor_summary.md`
- 현재 코드: `swproject/src/`
- Electron 설정: `swproject/electron/`
- 타입 정의: `swproject/src/shared/types/`

---

**작성일**: 2026-05-27  
**상태**: 준비 완료 (Day 1 AM 시작 가능)
