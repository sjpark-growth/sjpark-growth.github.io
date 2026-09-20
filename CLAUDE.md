# 편집 가이드 — 박성준 웹 이력서

이 문서는 이 이력서를 이어서 고치는 사람(또는 AI)을 위한 작업 규칙입니다. 수정 전에 끝까지 읽어 주세요.

## 1. 구조

- 로컬에서 `index.html` 을 더블클릭하면 그대로 열리는 정적 사이트입니다. 빌드 과정 없음, 외부 요청 없음(CDN · 웹폰트 · 분석 도구를 넣지 않는다).
- 스크립트 로드 순서: `series.js` → `data.js` → `motion.js` → `app.js`.
- **문구와 수치는 `assets/data.js` 한 곳에 모은다.** `app.js` 에는 차트 캡션 몇 개(VIEWS)와 첫 화면 차트 라벨만 하드코딩되어 있다.
- `assets/series.js` 는 대시보드 월별 데이터에서 자동 생성된 시계열이다. 손으로 고치지 않는다.
- `dashboard-demo.html` 은 실제 운영 대시보드의 **숫자를 임의 값으로 바꾼 사본**이다. 금액 · 비율 · ROAS 모두 실제 값이 아니며, 원본으로 되돌리거나 원본 파일을 여기에 두지 않는다.

## 2. data.js 에서 자주 고치는 곳

| 섹션 | 키 | 비고 |
|---|---|---|
| 첫 화면 | `profile` (kicker · thesis · lede), `board` (4칸 차트), `boardMulti` | thesis 줄바꿈은 `<br>` |
| 띠배너 | `ticker` | `[이모지, 지표, 값]` |
| 결정적 수치 | `kpis`, `moreWins` | kpis 의 `v` 는 굴러가는 숫자 (+/− 부호 포함) |
| 그로스 설계 | `growth.items`, `growth.extra` | |
| 성과 단계 | `phases` | 4단계 설명 |
| 주요 업무 카드 | `projects` | `hook` 1~2문장, `facts` 3개, `how` 는 「<b>핵심어</b> — 내용」 |
| 역량 | `pillars`, `tools`, `toolsMore` | `*` 로 시작하는 도구는 강조 칩 |
| 경력 | `jobs`, `careerNote`, `experience` | 숫자는 `<strong>`(파란 강조), 핵심 문구는 `<b>`(볼드) |
| 원칙 · 점수 · 기타 | `beliefs`, `scores`, `facts`, `archive` | |

## 3. 수치 원칙 (반드시 지킬 것)

- **ROAS 는 순수 ROAS = 전환매출 ÷ 광고비** (VAT · 몰 수수료 차감 전). 기간 값은 광고비 가중 평균.
- ROAS 개선은 항상 **개선 폭(%p)** 을 함께 적는다. 예: `964% → 1,330% (+366%p)`.
- 기준일: 대시보드 월별 데이터 2026-09-09. 26년 9월 금액은 1~9일을 30일로 환산.
- 같은 숫자가 여러 곳에 나온다. 하나를 바꾸면 아래 목록을 모두 맞춘다.

| 수치 | 나오는 곳 |
|---|---|
| 통합 ROAS 964% → 1,330% (+366%p) | ticker · board.roas · kpis · pillars(PERFORMANCE) · jobs(이그니스) · careerNote · scores |
| 쿠팡 1P 1,426% → 1,893% (+468%p) | ticker · board.multi · boardMulti · kpis · projects.cp1 · jobs |
| 브랜드 키워드 의존도 37.9% → 15.1% (−22.8%p) | ticker · board.brand · kpis · projects.brand · jobs · careerNote |
| 동일 몰 7월 매출 30.8억 → 41억 (+10.2억), 광고비 −4.7% | ticker · kpis · growth.coupon · jobs · scores |
| 전환매출 +83.8% (광고비 +33.3%) | ticker · kpis · jobs |
| 전체 매출 +36.6% | kpis · growth.main · projects.nonad · jobs · scores |
| 쿠팡 PMC 최대 −95% | moreWins · growth.coupon · projects.nonad · jobs · motion.js(nonad) |
| 모니터링 시간 30%+ 단축 · 자동화 8건 | ticker · moreWins · pillars · projects.automation · beliefs · motion.js(automation) |
| 경력 8년 10개월 | profile.career · index.html(경력 제목) |

- `motion.js` 의 모션 영상 속 숫자와 `app.js` 의 VIEWS 캡션도 같은 기준이다. 숫자를 바꾸면 함께 검색해서 맞춘다.

## 4. 올리면 안 되는 것

- 매체 수수료율 · 마진 · 거래 조건 · 동료 이름 · 대행사 자료 · 원본 광고비/매출 파일.
- 실제 대시보드 원본(사내 기밀). 데모는 반드시 숫자를 바꾼 사본만 쓴다.
- 절대 금액은 이미 공개한 것(월 광고비 · 월 전환매출 억 단위, 동일 몰 7월 매출)만 쓴다. 더 넣을 때는 본인 확인 후에.

## 5. 문구 · 디자인 규칙 (본인이 정한 취향)

- 문장은 짧고 핵심 위주. 개선된 숫자가 가장 먼저 눈에 띄게 굵게 한다.
- 카드 hook 은 앞 문장(무엇을 했나) 다음에 `<br>` 로 줄을 바꾸고 숫자 문장을 둔다.
- 경력 카드: 숫자는 `<strong>`, 핵심 문구(예: 전체 외부몰 SEO)는 `<b>`.
- 차트: 개선 구간은 점점 밝고 굵게, 마우스를 올린 항목만 또렷하고 나머지는 연하게, 전분기 · 전년 동월은 옅은 점선.
- 첫 화면은 100% 배율의 노트북 화면 한 장에 들어와야 한다.
- 새 스타일은 `style.css` 맨 아래에 블록으로 덧붙인다(앞쪽 규칙을 덮어쓰는 구조). 모바일은 `@media (max-width: 600px)`, 인쇄는 `@media print` 블록.

## 5-1. 자동으로 도는 장치 — 손대면 깨지는 것 (2026-09-20 추가)

화면에 보이는 값 중 **손으로 적으면 안 되는 것**과, 배터리를 아끼려고 넣은 장치들이다.

| 장치 | 어디 | 하는 일 | 주의 |
|---|---|---|---|
| `data-auto="tenure"` · `data-auto="career"` | `index.html` 5곳 | `app.js` 의 `paintPeriods()` 가 오늘 날짜로 「입사 후 N개월」 · 「N년 N개월」을 채운다 | HTML 안의 글자는 **자바스크립트가 꺼졌을 때의 기본값**일 뿐이다. 기간을 바꾸려면 `data.js` 의 `jobs` 구간을 고친다 |
| `.anim-idle` | `app.js` `wireAnimBudget()` | 화면 밖(여유 150px)으로 나간 장식 애니메이션을 멈춘다 | 대상 선택자는 `LOOPERS` 상수. 끝없이 도는 애니메이션을 새로 만들면 여기에 추가한다 |
| `.anim-hold` | 같은 함수 | 다른 탭을 보는 동안 장식 애니메이션을 멈춘다 | **등장 애니메이션(rise 등)은 대상에서 뺀다** — 넣으면 백그라운드 탭에서 열었을 때 투명한 채로 굳는다 |
| `loading="lazy"` | `app.js` 아카이브 이미지 | 스크롤해서 내려갈 때만 받는다 | `.arc button` 의 `aspect-ratio: 4/3` 이 자리를 잡아 주므로 지우지 않는다 |
| `data-src` (대시보드 축소판 iframe) | `app.js` `renderShowcase()` | `#dash` 가 700px 앞에 오면 `src` 를 채운다 | 버튼을 먼저 누를 때를 위해 `loadFrame()` 을 조작 지점마다 부른다 |
| `?for=performance` · `md` · `growth` · `leader` | `data.js` `angles` · `app.js` `applyAngle()` | 공고 성격에 맞춰 첫 화면 세 줄(kicker · thesis · lede)과 요약 네 줄의 차례만 바꾼다 | 나머지 내용은 전부 같다. 모르는 값이면 기본 문구가 나온다. 네 갈래 모두 첫 화면 한 장(1280×800)에 들어가는지 확인하고 문구를 늘린다 |
| `assets/og-card.png` | `index.html` `<head>` | 카카오톡 · 슬랙 · 메일에 뜨는 링크 미리보기 카드(1200×630) | **경력 개월수가 그림 안에 박혀 있다.** 다시 만드는 법은 원본 폴더 `_work/og-card/만들기.txt` |

색 대비: `--ink-3`(캡션 · 기간 · 부가 설명)은 라이트 `#5f6d82`(4.8:1) · 다크 `#707f94`(4.7:1)로
WCAG AA(4.5:1)를 맞춰 둔 값이다. 더 연하게 바꾸지 않는다.

첫 화면 로드 예산: **요청 6개 · 136KB**(2026-09-20 실측). 새 파일을 `<head>` 나 첫 화면에 붙이기 전에
정말 첫 화면에 필요한지 본다 — 아카이브 이미지와 대시보드 데모는 일부러 뒤로 미뤄 둔 것이다.

## 6. 확인 방법

1. `index.html` 을 브라우저로 열어 콘솔 에러가 없는지 본다(F12 → Console).
2. 브라우저 폭을 390px 정도로 줄여 가로 스크롤이 생기지 않는지 본다(F12 → 기기 툴바).
3. Ctrl+P → A4 · PDF로 저장 미리보기에서 카드가 잘리지 않는지 본다.
4. 다크 모드(오른쪽 위 테마 버튼)에서도 글자가 읽히는지 본다.
5. 첫 화면 로드가 무거워지지 않았는지 본다(F12 → Network → 새로고침 → 요청 수 · 전송량). 기준은 **6개 · 136KB**.
6. 「입사 후 N개월」 · 「N년 N개월」이 오늘 기준으로 맞는지 본다(자동 계산이 막히면 HTML 의 옛 숫자가 그대로 보인다).

## 7. 배포 (GitHub Pages)

- 이 폴더 전체가 저장소 루트다. `index.html` 이 루트에 있어야 하고, `.nojekyll` 은 지우지 않는다.
- 검색엔진 차단: `index.html` 과 `dashboard-demo.html` 의 `<meta name="robots" content="noindex, nofollow">` 를 지우지 않는다.
- 파일 이름 대소문자는 서버에서 구분된다. 새 이미지를 넣을 때 `data.js` 의 경로와 대소문자까지 똑같이 맞춘다.
