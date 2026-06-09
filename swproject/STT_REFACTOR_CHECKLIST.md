# STT/PTT 상주형 아키텍처 전환 — 빠른 체크리스트

## 📋 Phase 1: STT 서비스 (Day 1-2)

### Day 1 AM: sttBackgroundService.ts 생성
```
[ ] 파일 생성: src/services/sttBackgroundService.ts
[ ] 클래스 정의: STTBackgroundService
[ ] 속성:
    [ ] mediaRecorderRef: MediaRecorder | null
    [ ] streamRef: MediaStream | null
    [ ] chunksRef: Blob[]
    [ ] sessionIdRef: number
    [ ] onFinalTranscriptRef: ((text: string) => void) | null
    [ ] onErrorRef: ((error: string) => void) | null
[ ] 메서드:
    [ ] initialize(): void (핫키 리스너 등록)
    [ ] cleanup(): void (리스너 정리)
    [ ] startListening(): Promise<void>
    [ ] stopListening(): Promise<void>
    [ ] cancelListening(): Promise<void>
    [ ] setOnFinalTranscript(callback): void
    [ ] setOnError(callback): void
[ ] 싱글톤 export: export const sttBackgroundService = new STTBackgroundService()
[ ] 타입 정의:
    [ ] STTBackgroundServiceOptions
    [ ] STTBackgroundServiceState
[ ] 에러 처리:
    [ ] 마이크 권한 거부
    [ ] 마이크 없음
    [ ] 네트워크 오류
    [ ] 녹음 오류
```

### Day 1 PM: AppInitializer.tsx 생성 + main.tsx 수정
```
[ ] 파일 생성: src/components/AppInitializer.tsx
[ ] 컴포넌트 정의: AppInitializer
[ ] 속성:
    [ ] children: React.ReactNode
[ ] 기능:
    [ ] sttBackgroundService.initialize() 호출
    [ ] 콜백 등록 (onFinalTranscript)
    [ ] cleanup 함수 반환
    [ ] null 렌더링 (UI 없음)
[ ] 타입 정의:
    [ ] AppInitializerProps
[ ] main.tsx 수정:
    [ ] import AppInitializer
    [ ] <AppInitializer><App /></AppInitializer> 래핑
    [ ] 기존 코드 호환성 확인
```

### Day 1 Eve: useSTT.ts 수정
```
[ ] 파일 수정: src/features/stt/hooks/useSTT.ts
[ ] 제거할 부분 (lines 264-282):
    [ ] 전역 PTT 이벤트 구독 useEffect
    [ ] onGlobalPtt 리스너 등록/해제
[ ] 유지할 부분:
    [ ] startListening 로직
    [ ] stopListening 로직
    [ ] cancelListening 로직
    [ ] pushDebugTranscript 로직
    [ ] MediaRecorder 상태 관리
[ ] 호환성 확인:
    [ ] UseSTTReturn 타입 변경 없음
    [ ] 기존 호출자 모두 호환
```

### Day 2 AM: DashboardPage.tsx 수정
```
[ ] 파일 수정: src/pages/DashboardPage.tsx
[ ] 제거할 부분 (lines 321-334):
    [ ] handleFinalTranscript 콜백 함수
[ ] 수정할 부분 (line 344):
    [ ] useSTT({ onFinalTranscript: handleFinalTranscript }) 
    [ ] → useSTT()
[ ] 제거할 부분 (lines 395-448):
    [ ] 키보드 PTT 이벤트 리스너 useEffect
    [ ] keydown/keyup/blur 핸들러
[ ] 유지할 부분:
    [ ] CharacterPortrait speakingState (isListening 기반)
    [ ] BroadcastControls 마이크 버튼
    [ ] startListening/stopListening 호출
```

### Day 2 PM: Phase 1 통합 테스트
```
[ ] 앱 시작 → sttBackgroundService 초기화 확인
[ ] 핫키 (Cmd/Ctrl+Shift+M) 작동 확인
[ ] 마이크 녹음 → STT 변환 → 결과 저장 확인
[ ] 페이지 이동 (DashboardPage → CharacterPage → DashboardPage)
    [ ] 핫키 계속 작동하는지 확인
    [ ] 마이크 녹음 유지되는지 확인
[ ] 에러 처리:
    [ ] 마이크 권한 거부 시 에러 메시지 표시
    [ ] 네트워크 오류 시 재시도
[ ] 메모리 누수 확인:
    [ ] DevTools Memory 탭에서 메모리 증가 확인
    [ ] 페이지 이동 후 메모리 감소 확인
```

### Day 2 Eve: 문서화
```
[ ] 파일 상단 JSDoc 주석 추가:
    [ ] sttBackgroundService.ts
    [ ] AppInitializer.tsx
    [ ] useSTT.ts (수정 부분)
    [ ] DashboardPage.tsx (수정 부분)
[ ] 함수별 주석 추가
[ ] 타입 정의 명확화
[ ] 에러 메시지 한국어 통일
```

---

## 📋 Phase 2: WebSocket 서비스 (Day 3-4)

### Day 3 AM: broadcastWSBackgroundService.ts 생성
```
[ ] 파일 생성: src/services/broadcastWSBackgroundService.ts
[ ] 클래스 정의: BroadcastWSBackgroundService
[ ] 속성:
    [ ] wsRef: WebSocket | null
    [ ] pendingAudiosRef: Blob[]
    [ ] reconnectTimerRef: ReturnType<typeof setTimeout> | null
    [ ] shouldReconnectRef: boolean
    [ ] onVoiceChunkRef: ((chunk: VoiceChunk) => void) | null
    [ ] onVoiceTurnCompleteRef: ((turn: VoiceTurnComplete) => void) | null
    [ ] onEmotionChangeRef: ((emotion: StreamEmotion) => void) | null
    [ ] onErrorRef: ((message: string, code?: StreamWsErrorCode) => void) | null
[ ] 메서드:
    [ ] initialize(): void (authStore/aiModeStore 구독)
    [ ] cleanup(): void (구독 정리)
    [ ] connect(): void
    [ ] disconnect(): void
    [ ] sendChat(text: string): { ok: boolean; reason?: string }
    [ ] setOnVoiceChunk(callback): void
    [ ] setOnVoiceTurnComplete(callback): void
    [ ] setOnEmotionChange(callback): void
    [ ] setOnError(callback): void
    [ ] isConnected(): boolean
[ ] 싱글톤 export: export const broadcastWSBackgroundService = new BroadcastWSBackgroundService()
[ ] 타입 정의:
    [ ] BroadcastWSBackgroundServiceOptions
    [ ] BroadcastWSBackgroundServiceState
[ ] 에러 처리:
    [ ] 연결 실패
    [ ] 타임아웃
    [ ] 서버 에러
    [ ] 재연결 정책
```

### Day 3 PM: AppInitializer.tsx 수정 (Phase 2)
```
[ ] 파일 수정: src/components/AppInitializer.tsx
[ ] 추가 기능:
    [ ] broadcastWSBackgroundService.initialize() 호출
    [ ] STT → WebSocket 콜백 연결
    [ ] WebSocket 콜백 등록 (onVoiceChunk 등)
    [ ] cleanup 함수 확장
[ ] 콜백 연결:
    [ ] sttBackgroundService.onFinalTranscript 
    [ ] → broadcastWSBackgroundService.sendChat()
    [ ] broadcastWSBackgroundService.onVoiceChunk 
    [ ] → UI 콜백 (DashboardPage 에서 등록)
```

### Day 3 Eve: 토큰 갱신 재연결 로직
```
[ ] broadcastWSBackgroundService 에서:
    [ ] authStore.subscribe() 로 accessToken 변경 감지
    [ ] 토큰 변경 시 WebSocket 재연결
    [ ] 기존 연결 정리 (close)
    [ ] 새 토큰으로 재연결
[ ] 테스트:
    [ ] 토큰 만료 시뮬레이션
    [ ] 자동 갱신 확인
    [ ] 재연결 확인
```

### Day 4 AM: useStreamWS.ts 수정
```
[ ] 파일 수정: src/features/broadcast/hooks/useStreamWS.ts
[ ] 추가 기능:
    [ ] 중복 연결 방지 로직 (connect 함수 시작)
    [ ] broadcastWSBackgroundService 상태 구독 (래퍼 패턴)
    [ ] 기존 호출자 호환성 유지
[ ] 호환성 확인:
    [ ] UseStreamWSReturn 타입 변경 없음
    [ ] 기존 호출자 모두 호환
```

### Day 4 PM: Phase 2 통합 테스트
```
[ ] 방송 시작 → WebSocket 연결 확인
[ ] STT 결과 → WebSocket 송신 확인
[ ] WebSocket 응답 처리:
    [ ] VOICE_CHUNK 수신 → TTS 재생
    [ ] VOICE_TURN_COMPLETE 수신 → dialogue 확정
    [ ] VOICE_EMOTION 수신 → 감정 변경
[ ] 페이지 이동 → WebSocket 유지 확인
[ ] 토큰 갱신 → 자동 재연결 확인
[ ] 에러 처리:
    [ ] 연결 실패 시 재시도
    [ ] 타임아웃 시 재연결
    [ ] 서버 에러 시 적절한 처리
```

### Day 4 Eve: 문서화
```
[ ] 파일 상단 JSDoc 주석 추가:
    [ ] broadcastWSBackgroundService.ts
    [ ] AppInitializer.tsx (수정 부분)
    [ ] useStreamWS.ts (수정 부분)
[ ] 함수별 주석 추가
[ ] 타입 정의 명확화
```

---

## 📋 Day 5: 최종 테스트 + 최적화

### Day 5 AM: 전체 시나리오 테스트
```
[ ] 앱 시작
    [ ] sttBackgroundService 초기화
    [ ] broadcastWSBackgroundService 초기화
[ ] 핫키 작동 (Cmd/Ctrl+Shift+M)
    [ ] 마이크 ON/OFF
    [ ] STT 변환
[ ] 방송 시작
    [ ] WebSocket 연결
    [ ] STT 결과 → WebSocket 송신
    [ ] WebSocket 응답 처리
[ ] 페이지 이동
    [ ] 핫키 계속 작동
    [ ] WebSocket 유지
    [ ] 서비스 상태 유지
[ ] 토큰 갱신
    [ ] 자동 갱신
    [ ] WebSocket 재연결
    [ ] 서비스 계속 작동
```

### Day 5 PM: 버그 수정 + 최적화
```
[ ] 발견된 버그 수정
[ ] 성능 최적화:
    [ ] 불필요한 리렌더링 제거
    [ ] 메모리 누수 방지
    [ ] 콜백 최적화
[ ] 에러 메시지 개선
[ ] 로그 정리
```

### Day 5 Eve: 최종 문서화
```
[ ] README 업데이트
[ ] 마이그레이션 가이드 작성
[ ] 트러블슈팅 가이드 작성
[ ] 코드 리뷰 완료
```

---

## 🔍 코드 리뷰 체크리스트

### 일반
- [ ] 파일 상단 JSDoc 주석 있음
- [ ] 함수별 주석 있음
- [ ] 타입 정의 명확함
- [ ] 에러 처리 완벽함
- [ ] 메모리 누수 없음

### sttBackgroundService.ts
- [ ] MediaRecorder 라이프사이클 정확함
- [ ] 핫키 리스너 등록/해제 정확함
- [ ] Electron IPC 통신 정확함
- [ ] 콜백 등록 인터페이스 명확함
- [ ] 세션 ID 관리 정확함

### broadcastWSBackgroundService.ts
- [ ] WebSocket 라이프사이클 정확함
- [ ] 토큰 변경 감지 정확함
- [ ] 방송 ID 변경 감지 정확함
- [ ] 메시지 라우팅 정확함
- [ ] 자동 재연결 정책 정확함

### AppInitializer.tsx
- [ ] 서비스 초기화 정확함
- [ ] 콜백 연결 정확함
- [ ] cleanup 함수 정확함
- [ ] null 렌더링 확인

### 기존 파일 수정
- [ ] 호환성 유지됨
- [ ] 불필요한 코드 제거됨
- [ ] 기존 기능 유지됨

---

## 🧪 테스트 시나리오

### 시나리오 1: 기본 핫키 작동
```
1. 앱 시작
2. Cmd/Ctrl+Shift+M 누르기
3. 마이크 ON 확인
4. 말하기
5. Cmd/Ctrl+Shift+M 떼기
6. STT 변환 확인
7. 결과 저장 확인
```

### 시나리오 2: 페이지 이동 중 핫키
```
1. DashboardPage 에서 핫키 작동 확인
2. CharacterPage 로 이동
3. 핫키 계속 작동 확인
4. SettingsPage 로 이동
5. 핫키 계속 작동 확인
6. DashboardPage 로 돌아오기
7. 핫키 계속 작동 확인
```

### 시나리오 3: 방송 중 STT → WebSocket
```
1. 방송 시작
2. WebSocket 연결 확인
3. 핫키로 STT 시작
4. 말하기
5. STT 결과 → WebSocket 송신 확인
6. WebSocket 응답 처리 확인
```

### 시나리오 4: 토큰 갱신 중 WebSocket
```
1. 방송 시작
2. WebSocket 연결 확인
3. 토큰 만료 시뮬레이션
4. 자동 갱신 확인
5. WebSocket 재연결 확인
6. 방송 계속 작동 확인
```

### 시나리오 5: 에러 처리
```
1. 마이크 권한 거부 → 에러 메시지 표시
2. 네트워크 오류 → 재시도
3. WebSocket 연결 실패 → 재연결
4. 서버 에러 → 적절한 처리
```

---

## 📊 진행 상황 추적

### Phase 1 진행률
- [ ] 0% - 시작 전
- [ ] 25% - Day 1 AM 완료 (sttBackgroundService.ts)
- [ ] 50% - Day 1 PM 완료 (AppInitializer.tsx + main.tsx)
- [ ] 75% - Day 1 Eve 완료 (useSTT.ts)
- [ ] 100% - Day 2 완료 (DashboardPage.tsx + 테스트)

### Phase 2 진행률
- [ ] 0% - 시작 전
- [ ] 25% - Day 3 AM 완료 (broadcastWSBackgroundService.ts)
- [ ] 50% - Day 3 PM 완료 (AppInitializer.tsx 수정)
- [ ] 75% - Day 4 AM 완료 (useStreamWS.ts)
- [ ] 100% - Day 4 PM 완료 (테스트)

### 전체 진행률
- [ ] 0% - 시작 전
- [ ] 20% - Day 1 완료
- [ ] 40% - Day 2 완료
- [ ] 60% - Day 3 완료
- [ ] 80% - Day 4 완료
- [ ] 100% - Day 5 완료

---

**작성일**: 2026-05-27  
**상태**: 준비 완료  
**다음 단계**: Day 1 AM 부터 시작
