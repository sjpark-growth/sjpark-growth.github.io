# Growth Report 2026 — 포트폴리오

그로스 마케터의 웹 포트폴리오입니다. 외부 요청 없이 동작하는 정적 사이트(HTML · CSS · JS)입니다.

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 페이지 뼈대 |
| `en.html` | 영문 한 장 요약 — 외국계 지원용, 본판과 같은 스타일 토큰을 쓰고 내용은 직접 적는다 |
| `assets/data.js` | **모든 문구·수치** — 이력서를 고칠 때는 보통 이 파일만 바꿉니다 |
| `assets/series.js` | 성과 차트용 월별 시계열 (비율·지수 — 절대 금액 없음). 대시보드 월별 데이터에서 자동 생성, 손으로 고치지 않음 |
| `assets/app.js` · `assets/style.css` · `assets/motion.js` | 화면 구성 · 디자인 · 모션 영상 |
| `dashboard-demo.html` · `briefing-demo.html` · `stock-demo.html` | 데모 3종 — 퍼포먼스 대시보드 · 브리핑룸 · 재고 신호판. **모든 숫자는 임의 값**이고 품목 · 상품 이름도 코드로 가린 사본 |
| `favicon.ico` | 데모 3종이 쓰는 탭 아이콘(본판 · 영문판은 페이지 안 SVG 아이콘) |
| `tools/` | 관리 도구 — `demo-wash.js`(데모 · 본문의 품목 · 상품 실명 가림, `--check` 는 검사만) · `demo-wash.json`(대응표, 실명은 해시로만) |
| `.githooks/` | `pre-commit` — 커밋 전에 `tools/demo-wash.js --staged` 로 실명을 가린다. 저장소마다 한 번 `git config core.hooksPath .githooks` 로 켠다 |
| `.github/workflows/` | GitHub Actions 「데모 가림」 — main 에 올라온 데모 · 본문 파일을 한 번 더 가린다 |
| `archive/` | 참고 자료 이미지 — 같은 이름으로 **두 벌**: `.jpg`(목록 칸 · 인쇄/PDF 용, q80) · `.webp`(크게 보기 원본). PDF 용량 때문에 일부러 둔 것이라 한쪽만 지우지 않고, 새 이미지를 넣을 때도 둘 다 만듭니다(CLAUDE.md 8장) |
| `videos/` | 직접 녹화한 영상을 넣는 곳 |
| `CLAUDE.md` | 편집 가이드 — 사람과 AI 모두 이 문서를 보고 이어서 고칠 수 있습니다 |

## 고치고 다시 올리기

1. `assets/data.js` 에서 문장을 찾아 고친 뒤, `index.html` 을 더블클릭해 브라우저에서 확인합니다.
2. GitHub 저장소 화면에서 **Add file → Upload files** 로 바뀐 파일을 끌어다 놓고 **Commit changes** 를 누릅니다.
3. 1~2분 뒤 사이트 주소에 반영됩니다. (반영이 안 보이면 Ctrl+F5 로 새로고침)

> **주의 — 웹 「Upload files」는 pre-commit 훅을 건너뜁니다.** 데모 3종이나 본문(data.js · motion.js · index · en)을 웹으로 올리면
> 가림 훅이 돌지 않아, GitHub Actions 「데모 가림」이 가려서 다시 올리기 전 **1~2분 동안 실명이 공개될 수 있습니다.**
> 이 파일들은 PC 저장소에서 훅을 켠 채 `git commit` 으로 올리거나, 올리기 전에 `node tools/demo-wash.js --check` 가 「가릴 것 없음」인지 봅니다.

## 공고별 링크 (`?for=`)

주소 끝에 붙이면 첫 화면 세 줄(kicker · thesis · lede)만 공고 성격에 맞게 바뀝니다. 나머지 내용은 같습니다.

| 공고 성격 | 보낼 링크 |
|---|---|
| 기본 | https://sjpark-growth.github.io/ |
| 퍼포먼스 마케팅 | https://sjpark-growth.github.io/?for=performance |
| 온라인 MD | https://sjpark-growth.github.io/?for=md |
| 그로스 | https://sjpark-growth.github.io/?for=growth |
| 팀장 · 리더 | https://sjpark-growth.github.io/?for=leader |

모르는 값이면 기본 화면이 나옵니다. 문구는 `assets/data.js` 의 `angles` 에서 고칩니다.

검색엔진에는 노출되지 않도록 `noindex` 가 설정되어 있습니다 — 링크를 받은 사람만 열어 볼 수 있습니다.
