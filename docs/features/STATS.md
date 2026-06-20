# Stats 페이지 문서

## 대상 라우트

- `/stats`

## 관련 파일

- `swproject/src/pages/StatsPage.tsx`
- 연관 명세: `docs/SPECIFICATIONS.md`, `docs/API_SPECIFICATIONS.md`

## 현재 상태

- 프론트엔드 stats 타입/상세 모달은 구현되어 있습니다.
- 일별 상세 응답의 `analysisResult.catchPhrases`는 **문자열 리스트가 아니라 객체 리스트**입니다.

```json
"catchPhrases": [
  {
    "content": "무야호",
    "subject": "VIEWER",
    "situationAnalysis": "시청자가 특정 상황에서 재미있다고 반응하며 반복 사용한 표현"
  }
]
```

## 계획상 역할

- 날짜별 방송 통계 조회
- 타임라인/요약/상세 로그 제공
- AI 응답, 채팅, 게임 이벤트 통합 조회

## 참고

- 프론트 기대 엔드포인트:
  - `GET /api/v1/broadcast/stats/month?year=YYYY&month=M`
  - `GET /api/v1/broadcast/stats/day?broadcastId=...`
- 백엔드 구현은 아직 별도 추가가 필요합니다.

## 메모

- 향후 차트/필터 UI가 들어가면 별도 feature 모듈 분리가 자연스럽습니다.
