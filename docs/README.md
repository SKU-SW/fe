# SKU-SW 문서 허브

이 문서는 현재 프로젝트 문서의 **시작점**입니다.

## 문서 우선순위

문서 간 내용이 충돌하면 아래 순서를 따릅니다.

1. `swproject/package.json`, 실제 소스 코드
2. `swproject/AGENTS.md`
3. 이 문서와 `docs/features/*.md`
4. 과거 설계/회고 문서 (`swproject/*.md`, `swproject/docs/*.md`, `docs/archive/*`)

## 빠른 링크

- 아키텍처: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- API 스펙: [`API_SPECIFICATIONS.md`](./API_SPECIFICATIONS.md)
- 기능 명세: [`SPECIFICATIONS.md`](./SPECIFICATIONS.md)
- 레거시 문서 안내: [`archive/README_DOCUMENTS.md`](./archive/README_DOCUMENTS.md)

## 페이지별 문서

| Route | Page File | 문서 |
|---|---|---|
| `/login` `/signup` | `swproject/src/pages/auth/*` | [`features/AUTH.md`](./features/AUTH.md) |
| `/dashboard` | `swproject/src/pages/DashboardPage.tsx` | [`features/DASHBOARD.md`](./features/DASHBOARD.md) |
| `/character` | `swproject/src/pages/CharacterPage.tsx` | [`features/CHARACTER.md`](./features/CHARACTER.md) |
| `/chat-analysis` | `swproject/src/pages/ChatAnalysisPage.tsx` | [`features/CHAT_ANALYSIS.md`](./features/CHAT_ANALYSIS.md) |
| `/proactive` | `swproject/src/pages/ProactivePage.tsx` | [`features/PROACTIVE.md`](./features/PROACTIVE.md) |
| `/game` | `swproject/src/pages/GamePage.tsx` | [`features/GAME.md`](./features/GAME.md) |
| `/safety` | `swproject/src/pages/SafetyPage.tsx` | [`features/SAFETY.md`](./features/SAFETY.md) |
| `/stats` | `swproject/src/pages/StatsPage.tsx` | [`features/STATS.md`](./features/STATS.md) |
| `/overlay` | `swproject/src/pages/OverlayPage.tsx` | [`features/OVERLAY.md`](./features/OVERLAY.md) |

## 현재 문서 구조

```text
docs/
├── README.md
├── ARCHITECTURE.md
├── API_SPECIFICATIONS.md
├── SPECIFICATIONS.md
├── PROJECT_GUIDE.md
├── DEVELOPMENT_GUIDE.md
├── UI_DESIGN.md
├── features/
│   ├── AUTH.md
│   ├── DASHBOARD.md
│   ├── CHARACTER.md
│   ├── CHAT_ANALYSIS.md
│   ├── PROACTIVE.md
│   ├── GAME.md
│   ├── SAFETY.md
│   ├── STATS.md
│   └── OVERLAY.md
└── archive/
    └── README_DOCUMENTS.md
```

## 정리 원칙

- 페이지/기능별 설명은 `docs/features/`에 모읍니다.
- 구현 중이 아닌 과거 설계안, 비교 문서, 회고 문서는 **레거시 참고용**으로 봅니다.
- 새 기능 문서는 가능하면 **라우트 기준 1개 파일**로 작성합니다.

## 레거시 문서 메모

아래 문서들은 참고용 가치가 있지만 현재 구조 기준의 1차 진실 원천은 아닙니다.

- `swproject/DASHBOARD_REDESIGN*.md`
- `swproject/IMPLEMENTATION_SUMMARY.md`
- `swproject/BEFORE_AFTER_COMPARISON.md`
- `swproject/DASHBOARD_*REFERENCE.md`
- `swproject/docs/*CharacterDashboard*.md`
- `swproject/docs/superpowers/**`

필요 시 보관 문서로 읽고, 신규 작업은 이 문서 허브와 `features/*.md`를 우선 참고하세요.
