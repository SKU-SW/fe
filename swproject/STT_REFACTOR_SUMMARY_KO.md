# SKU-SW STT/PTT 상주형 아키텍처 전환 — 실무 요약

## 🎯 한 줄 요약
**DashboardPage 에 갇혀있는 STT/WebSocket 을 앱 시작 시 자동 초기화되는 백그라운드 서비스로 분리**

---

## 📌 현재 문제

| 문제 | 영향 |
|------|------|
| useSTT 가 DashboardPage 에서만 초기화 | 다른 페이지에서 PTT(핫키) 불가 |
| 전역 핫키 리스너가 useSTT 내부 useEffect | 페이지 이동 시 리스너 정리됨 |
| useStreamWS 도 DashboardPage 에서만 초기화 | 페이지 이동 시 WebSocket 재연결 발생 |
| 토큰 갱신 후 WebSocket 수동 재연결 필요 | 자동 복구 불가 |

---

## 🏗️ 해결책: 3단계 전환

### Phase 1: STT 서비스 (Day 1-2)
**목표**: 핫키 + 마이크 입력을 앱 전체에서 작동하게 만들기

**새 파일**:
1. `src/services/sttBackgroundService.ts` — 마이크 입력 관리 (싱글톤)
2. `src/components/AppInitializer.tsx` — 앱 시작 시 서비스 초기화

**수정 파일**:
1. `src/main.tsx` — AppInitializer 로 App 래핑
2. `src/features/stt/hooks/useSTT.ts` — 핫키 리스너 제거 (서비스가 처리)
3. `src/pages/DashboardPage.tsx` — handleFinalTranscript 콜백 제거

**결과**: 
- ✅ 핫키 (Cmd/Ctrl+Shift+M) 앱 전체에서 작동
- ✅ 페이지 이동해도 마이크 녹음 유지
- ✅ 기존 DashboardPage 호환성 유지

---

### Phase 2: WebSocket 서비스 (Day 3-4)
**목표**: WebSocket 연결을 앱 전체에서 유지하고 자동 재연결

**새 파일**:
1. `src/services/broadcastWSBackgroundService.ts` — WebSocket 관리 (싱글톤)

**수정 파일**:
1. `src/components/AppInitializer.tsx` — broadcastWSBackgroundService 초기화
2. `src/features/broadcast/hooks/useStreamWS.ts` — 중복 연결 방지

**결과**:
- ✅ 방송 중 페이지 이동해도 WebSocket 유지
- ✅ 토큰 갱신 시 자동 재연결
- ✅ STT 결과 자동으로 WebSocket 으로 송신

---

### Phase 3: 백엔드 개선 (Day 5+, 미뤄도 됨)
**목표**: broadcastStreamId 없이도 STT 가능하게 만들기

**필요한 변경**:
- `POST /api/v1/stt/transcribe` 엔드포인트 추가
- 토큰 갱신 이벤트 (선택사항)

**현재 상태**: 없어도 Phase 1-2 작동 가능

---

## 📁 파일 구조 (Phase 1-2)

### 신규 파일 (3개)

#### 1. `src/services/sttBackgroundService.ts` (~350 줄)
```
책임: 마이크 입력 → STT 변환 → 콜백 실행
기능:
  - MediaRecorder 라이프사이클 관리
  - 전역 핫키 리스너 (Cmd/Ctrl+Shift+M)
  - Electron IPC 통신
  - 콜백 등록 인터페이스
  - 세션 ID 관리 (중복 요청 방지)
```

#### 2. `src/services/broadcastWSBackgroundService.ts` (~450 줄)
```
책임: WebSocket 연결 → 메시지 라우팅 → 자동 재연결
기능:
  - WebSocket 라이프사이클
  - 토큰 변경 감지 → 자동 재연결
  - 방송 ID 변경 감지 → 연결/해제
  - 메시지 콜백 등록
  - 채팅 송신
```

#### 3. `src/components/AppInitializer.tsx` (~120 줄)
```
책임: 앱 시작 시 서비스 초기화 + 콜백 연결
기능:
  - sttBackgroundService 초기화
  - broadcastWSBackgroundService 초기화
  - 서비스 간 콜백 연결
  - 언마운트 시 정리
  - UI 렌더링 없음 (null 반환)
```

### 수정 파일 (5개)

| 파일 | 변경 | 라인 수 |
|------|------|--------|
| `src/main.tsx` | AppInitializer 로 App 래핑 | +10 |
| `src/features/stt/hooks/useSTT.ts` | 핫키 리스너 제거 | -20 |
| `src/pages/DashboardPage.tsx` | handleFinalTranscript + 핫키 리스너 제거 | -60 |
| `src/features/broadcast/hooks/useStreamWS.ts` | 중복 연결 방지 | +10 |
| `src/shared/stores/aiModeStore.ts` | 변경 없음 | 0 |

---

## 🔄 구현 순서 (5일)

### Day 1 (4-5시간)
- **AM**: sttBackgroundService.ts 생성 (MediaRecorder + 핫키 리스너)
- **PM**: AppInitializer.tsx 생성 + main.tsx 수정
- **Eve**: useSTT.ts 수정 (핫키 리스너 제거)

### Day 2 (4-5시간)
- **AM**: DashboardPage.tsx 수정 (콜백 제거)
- **PM**: Phase 1 통합 테스트 (핫키 + 마이크 + 페이지 이동)
- **Eve**: 문서화 + 코드 리뷰

### Day 3 (4-5시간)
- **AM**: broadcastWSBackgroundService.ts 생성
- **PM**: AppInitializer.tsx 수정 (Phase 2)
- **Eve**: 토큰 갱신 재연결 로직

### Day 4 (4-5시간)
- **AM**: useStreamWS.ts 수정 (중복 연결 방지)
- **PM**: Phase 2 통합 테스트 (WebSocket + 페이지 이동 + 토큰 갱신)
- **Eve**: 문서화 + 코드 리뷰

### Day 5 (3-4시간)
- **AM**: 전체 시나리오 테스트 (앱 시작 → 핫키 → 방송 → 페이지 이동 → 토큰 갱신)
- **PM**: 버그 수정 + 성능 최적화
- **Eve**: 최종 문서화

---

## 💡 핵심 설계 원칙

### 1. 싱글톤 패턴
```typescript
// sttBackgroundService.ts
export const sttBackgroundService = new STTBackgroundService();

// AppInitializer.tsx 에서 초기화
useEffect(() => {
  sttBackgroundService.initialize();
  return () => sttBackgroundService.cleanup();
}, []);
```

### 2. 콜백 기반 이벤트
```typescript
// 서비스에 콜백 등록
sttBackgroundService.onFinalTranscript = (text) => {
  // STT 결과 처리
};

// 서비스가 콜백 호출
await this.onFinalTranscript?.(finalText);
```

### 3. 상태 구독 (Zustand)
```typescript
// broadcastWSBackgroundService 에서
useAuthStore.subscribe(
  (state) => state.accessToken,
  (accessToken) => {
    // 토큰 변경 감지 → 재연결
    this.reconnect();
  }
);
```

### 4. 기존 호환성 유지
```typescript
// useSTT 훅은 여전히 사용 가능
const { isListening, startListening } = useSTT();

// 단, 핫키는 이제 sttBackgroundService 에서 관리
// UI 는 isListening 상태만 구독
```

---

## ✅ 호환성 체크리스트

### 기존 코드 호환성
- ✅ useSTT 훅 호출자 모두 호환 (onFinalTranscript 제거만 필요)
- ✅ useStreamWS 훅 호출자 모두 호환 (중복 연결 방지만 추가)
- ✅ DashboardPage 외 다른 페이지에서도 핫키 작동
- ✅ 페이지 이동 시 서비스 유지

### 성능
- ✅ 싱글톤으로 중복 초기화 방지
- ✅ 콜백 기반으로 폴링 없음
- ✅ cleanup 으로 메모리 누수 방지

---

## ⚠️ 주의사항

### 테스트 필요
- Electron IPC 모킹 (window.electronAPI.stt.*)
- WebSocket 모킹 (ws:// 프로토콜)
- Zustand store 모킹 (getState/subscribe)

### 마이그레이션 순서
1. Phase 1 완료 후 배포 (핫키 개선)
2. Phase 2 완료 후 배포 (WebSocket 안정성)
3. Phase 3 는 필요시 나중에 (백엔드 개선)

---

## 🚀 지금 당장 미뤄도 되는 것

### Phase 3 (백엔드 개선)
- broadcastStreamId 선택적 흐름
- 토큰 갱신 이벤트
- 상태 폴링 제거

### 추가 최적화
- sttStore/broadcastWSStore 분리
- 완전한 훅 제거 (현재 래퍼 패턴 유지)
- 테스트 코드 작성
- 성능 프로파일링

---

## 📊 코드 변화 요약

| 항목 | Phase 1 | Phase 2 | 합계 |
|------|---------|---------|------|
| 신규 줄 수 | ~470 | ~450 | ~920 |
| 삭제 줄 수 | -80 | 0 | -80 |
| 순증가 | ~390 | ~450 | ~840 |
| 복잡도 | 중간 | 중간 | 중간 |

---

## 🎓 학습 포인트

### 1. 싱글톤 서비스 패턴
- 앱 전체 수명 동안 유지되는 상태 관리
- React 훅과 다른 라이프사이클

### 2. Zustand 구독 (subscribe)
- 컴포넌트 외부에서 상태 변경 감지
- 콜백 기반 이벤트 처리

### 3. Electron IPC 통신
- 렌더러 ↔ 메인 프로세스 통신
- 비동기 처리 (invoke/on)

### 4. WebSocket 자동 재연결
- 토큰 갱신 감지
- 상태 기반 재연결 정책

---

## 📞 문의 사항

- **구현 중 막히는 부분**: 각 파일의 JSDoc 주석 참고
- **타입 정의**: `src/shared/types/` 참고
- **기존 코드**: `src/features/stt/hooks/useSTT.ts`, `src/features/broadcast/hooks/useStreamWS.ts` 참고

---

**작성일**: 2026-05-27  
**상태**: 준비 완료  
**다음 단계**: Day 1 AM 부터 sttBackgroundService.ts 생성 시작
