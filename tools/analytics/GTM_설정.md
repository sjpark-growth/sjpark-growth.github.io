# 방문 흐름 · 이탈 분석 — GTM + GA4 + Clarity 설정 (2026-11-25)

사이트 쪽은 `assets/track.js` 가 이벤트를 `dataLayer` 에만 넣는다. 어디로 보낼지는 GTM 에서 정한다.
**`track.js` 의 `GTM_ID` 가 비어 있는 동안에는 외부 요청이 없다.**

## 0. 만든 것 (2026-11-25)

| 도구 | ID | 계정 · 이름 |
|---|---|---|
| GTM | `GTM-P9NRDTDV` (계정 6407836635 · 컨테이너 288652423) | 계정 sjpark-growth · 컨테이너 sjpark-growth.github.io · 게시본 **버전 7** 「v7 맥락은 psj_open 이벤트로 · page_view 는 기본」(2026-11-27 GTM API 로 확인 · 태그 4 · 트리거 2 — 처음 게시는 버전 2 「v1 방문 흐름 분석」) |
| GA4 | 측정 ID `G-D1KF2MWKJW` · 스트림 16410100727 | 계정 sjpark-growth · 속성 sjpark-growth portfolio(대한민국 시간) · 데이터 공유 4개 모두 끔 · 「브라우저 기록 기반 페이지 변경」 끔 |
| Clarity | `zizzedwvba` | 프로젝트 sjpark-growth portfolio |

GTM 컨테이너 설정은 `gtm-container.json`(이 폴더)을 「관리자 → 컨테이너 가져오기 → 병합」으로 넣었다 — 다시 만들 때도 이 파일. 아래 1~3 은 손으로 할 때의 설명이다.
(2026-11-27) 이 파일은 게시본 v7 을 GTM API(읽기 전용 서비스 계정 — 컨테이너 사용자 관리 「읽기」)로 받아 작업 폴더 도구 `gtm_export.py` 로 옮긴 판이다 — 계정 메일 · 로그인 주소 · 지문(fingerprint)은 빼고, 메일 꼴 값이 있으면 쓰지 않는다. 게시본을 바꾸면 이 파일도 같은 도구로 다시 만든다(매일 점검 「저장소 사본 ↔ 게시본(태그 수)」이 어긋나면 ✕).

**재점검 (2026-11-25 밤)** — 공개 3쪽(index · en · resume-pdf) track.js 포함 · 공개 track.js = 저장소 · GTM 게시본 v2 에 GA4 · Clarity · psj 트리거 있음. GA4 스트림 「최근 48시간 동안 수신」, Clarity 「세션 0 · 봇 세션 3 제외」(헤드리스 점검 방문 — 봇 감지 켜짐이라 정상). 이때 더한 것:
- GA4 이벤트 데이터 보관 2개월 → **14개월**(탐색 · 유입경로 보고서가 2개월까지만 거슬러 올라가서).
- GA4 맞춤 이벤트 4개 + **키 이벤트**(값 없음 · 이벤트당 한 번, 소스 매개변수 복사): `resume_download`(psj_click = resume_download) · `resume_view`(= resume_view) · `contact_email`(psj_click 포함 email_ — 클릭 · 복사) · `contact_phone`(= phone_click). 이벤트 목록 「주요 이벤트」 탭에는 데이터가 들어온 뒤 뜬다.
- GA4 화면이 바뀌어 조건식 맞춤 이벤트는 「이벤트 → 커스텀 구성 → 맞춤 이벤트 → 만들기 → (URL 칸 아래) 옵션 더 보기」에 있다. 「이벤트 만들기」 첫 화면은 URL 조건만 된다.
- Clarity–GA4 통합 **연결됨**(같은 날 본인 「연동 진행」 — Google 권한(애널리틱스 관리 요소 수정 · 데이터 보기)은 본인이 승인, Clarity 설정 → 통합 「연결됨 · sjpark-growth portfolio · 활성」). 연결 직후 GA4 맞춤 측정기준에 Clarity 항목은 아직 없음 — 실제 방문이 생긴 뒤 생기는지 볼 것(`미검증`). 끊기는 Clarity 설정 → 통합 → 연결 끊기.

## 1. 계정 · ID 만들기 (본인)

| 도구 | 만드는 것 | 받는 ID |
|---|---|---|
| Google 태그 관리자 (tagmanager.google.com) | 계정 → 컨테이너(웹, `sjpark-growth.github.io`) | `GTM-XXXXXXX` |
| Google 애널리틱스 (analytics.google.com) | 속성 → 웹 데이터 스트림(`https://sjpark-growth.github.io`) | `G-XXXXXXXXXX` |
| Microsoft Clarity (clarity.microsoft.com) | 새 프로젝트(같은 주소) | 영문 · 숫자 10자 안팎 |

GA4 데이터 스트림 → 향상된 측정 → **페이지 조회 → 고급 설정 → 「브라우저 기록 이벤트 기반 페이지 변경」 끄기**.
장 넘김은 넘길 때마다 주소(`#work-3`)를 바꾸므로 켜 두면 page_view 가 장마다 쌓인다. 장 · 절은 `psj_section` 으로 따로 받는다.

## 2. GTM — 변수 (데이터 영역 변수, 버전 2 부터 v7 까지 같은 16개)

이름 그대로 만든다: `psj_page` `psj_view` `psj_angle` `psj_share` `psj_src` `psj_section` `psj_section_index` `psj_section_total`
`psj_depth` `psj_via` `psj_seen` `psj_engaged_sec` `psj_section_sec` `psj_leave_n` `psj_click` `psj_target`

## 3. GTM — 태그 · 트리거

게시본 v7 기준(2026-11-27). 버전 2 까지는 Google 태그의 구성 매개변수로 맥락(`psj_page` …)을 모든 이벤트에 실었는데, v7 은 Google 태그를 태그 ID 만 두고(page_view 는 기본 그대로) 맥락을 `psj_open` 이벤트 하나로 따로 보낸다.

1. **Google 태그 「Google 태그 — GA4」** — 태그 ID `G-XXXXXXXXXX`, 트리거 「Initialization - All Pages」. 구성 매개변수 없음.
2. **GA4 이벤트 「GA4 psj_open — 페이지 맥락」** — 측정 ID 같음, 이벤트 이름 `psj_open`,
   트리거 「psj 맥락 (psj_ctx)」 = 맞춤 이벤트 · 이벤트 이름 `psj_ctx` 와 같음. 이벤트 매개변수: 2 의 변수 전부.
3. **GA4 이벤트 「GA4 이벤트 — psj」** — 측정 ID 같음, 이벤트 이름 `{{Event}}`,
   트리거 「psj 이벤트」 = 맞춤 이벤트 · 정규식 사용 `^psj_(section|leave|click|print|view_change)$`.
   이벤트 매개변수: 2 의 변수 전부(값이 없는 것은 비어서 간다 — 괜찮다).
4. **맞춤 HTML 「Microsoft Clarity」** — Clarity 설정 → 설치에 나오는 **공식 코드 그대로**, 트리거 「Initialization - All Pages」.
   공식 코드는 `window.clarity` 대기열을 이어받으므로 `track.js` 가 먼저 넣은 태그(`set`) · 이벤트가 사라지지 않는다. 대기열을 새로 만드는 다른 코드로 바꾸지 않는다.
5. 미리보기(Tag Assistant)로 공개 주소를 열어 네 태그가 뜨는지 본 뒤 **제출(게시)**.

## 4. GA4 · Clarity 정리

- GA4 관리 → 맞춤 정의
  - 측정기준(이벤트 범위): `psj_section` `psj_click` `psj_target` `psj_view` `psj_src` `psj_angle` `psj_share` `psj_page` `psj_via`
  - 측정항목: `psj_depth`(표준) · `psj_engaged_sec` · `psj_section_sec`(단위 초)
- GA4 관리 → 이벤트 → 커스텀 구성 → 맞춤 이벤트 → 만들기 → 옵션 더 보기: `event_name` = `psj_click` 이고 `psj_click` = `resume_download` → 새 이벤트 `resume_download`, 키 이벤트로 표시(이메일 · 전화 · 이력서 보기도 같은 방법 — 2026-11-25 만듦, 위 0 절).
- Clarity 설정에서 GA4 연결(있으면) — 두 쪽 세션을 잇는다(메뉴 이름은 `미검증`). 가림(masking)은 기본값 그대로.

## 5. 사이트에 ID 넣고 게시

`assets/track.js` 맨 위 `var GTM_ID = '';` → `'GTM-XXXXXXX'` → resume-publish 절차(점검 3종 → 커밋 → push 는 본인 승인).
GTM 은 **공개 주소에서만** 받는다(로컬 · 워크트리 · 아티팩트 · 자동 점검(webdriver) · 추적 거부(DNT/GPC)는 받지 않음).

## 6. 본인 방문 빼기

브라우저마다 한 번 `https://sjpark-growth.github.io/?notrack` 으로 연다 — PC 크롬 · 휴대폰 브라우저 · **카카오톡 안 브라우저 따로**.
그 브라우저는 계속 빠진다(되돌리기 `?notrack=0`). 지금 상태는 콘솔 `PSJTrack.state()` 의 `live`.

## 7. 지원처별 링크

`?src=` 에 영문 · 숫자 · `_` `-` 만(40자) — 사람 이름 · 회사 실명 · 메일은 넣지 않는다(코드로).
예: `?src=wanted` · `?src=saramin` · `?src=jobkorea` · `?src=remember` · `?src=hh01`(헤드헌터는 번호로, 대응표는 내 메모에).
다른 표시와 같이: `?for=performance&src=wanted` · `?share&src=hh01`. `utm_source` 도 같은 칸으로 읽는다. 한 번 들어오면 그 탭에서는 이어 간다.

## 8. 보내는 이벤트

| 이벤트 | 언제 | 주요 매개변수 |
|---|---|---|
| `psj_ctx` | 페이지 열 때(GA4 에는 GTM v7 이 `psj_open` 이벤트로 보냄 — 3절 2) | `psj_page` home · en · resume_pdf, `psj_view` scroll · deck · page, `psj_angle`, `psj_share` on · off, `psj_src` |
| `psj_section` | 한 절(스크롤) · 한 장(장 넘김)에 **0.8초 넘게** 머물 때 | `psj_section`(스크롤 intro · summary · results · dash · xdash · perf · growth · work · pillars · career · beliefs · contact / 장 넘김 `work-3` 처럼 주제-장 / en 은 h2 id / 이력서 보기 p1~p7), `psj_section_index` · `_total`, `psj_depth`(가장 깊이 본 곳 %), `psj_via`(scroll · wheel · key · drag · swipe …) |
| `psj_leave` | 탭을 숨기거나 닫을 때(다시 돌아오면 또 생김 — `psj_leave_n`) | 마지막 `psj_section`, `psj_depth`, `psj_seen`(본 곳 수), `psj_engaged_sec`(보이던 시간), `psj_section_sec`(마지막 곳에 머문 시간) |
| `psj_click` | 누를 때 | `psj_click` = resume_view · resume_open · resume_download · demo_open · demo_newtab · email_click · email_copy · phone_click · en_open · home_open(en · 이력서 보기 → 포트폴리오) · print_click · outbound, (2026-11-28) **nav**(화면 안 #링크 — 상단 메뉴 · 레일 · 바로 가기 칩 · 사례 링크, `psj_target` = # 뒤 이름) · **ui**(화면 제어 단추 — `psj_target` = theme · perf_view_<보기> · perf_labels · perf_table · tip_chip · skills_more · tools_more · how_toggle · motion_play · guide), `psj_target`(데모 이름 · full/short · 바깥 도메인), `psj_section`(누를 때 본 곳). nav · ui 는 기존 트리거 · 측정기준 그대로라 GTM · GA4 설정을 바꾸지 않았다 |
| `psj_view_change` | 「장으로 보기 · 스크롤로 보기」 | `psj_view` |
| `psj_print` | 인쇄 창(Ctrl+P 포함 — 「전체 · 요약 PDF」 단추로 열면 `psj_click` print_click 도 같이 남는다) | `psj_section` |

Clarity 쪽은 11절(2026-11-28 다시 짬 — 태그는 같은 이름으로 다시 넣으면 **덮이지 않고 쌓인다**).

## 9. 보는 법

- **어디서 나갔나**: Clarity 녹화 → 필터 「맞춤 태그 `exit_section`」 = `work-3` 등 → 녹화를 연다(11-28 전 `last_section` 은 지나친 곳이 모두 쌓여 나간 곳이 아니었다). GA4 탐색 → 자유 형식: 이벤트 이름 = `psj_leave`, `psj_leave_n` = 1, 행 `psj_section`, 값 사용자 수.
- **얼마나 깊이**: 같은 표에 `psj_depth` 평균, 또는 행에 `psj_depth`.
- **퍼널**: GA4 유입경로 탐색(개방형) — `psj_section` intro → results/dash → work → `psj_click`(resume_view · resume_download · email_*). 분류 기준 `psj_src` · `psj_view`.
- **지원처별**: 아무 표에 `psj_src` 를 행 · 비교로.
- **히트맵**: Clarity 히트맵은 **스크롤판만** 의미가 있다. 장 넘김은 창이 스크롤되지 않아 스크롤 히트맵이 비고, 클릭 위치도 어긋날 수 있다 — 장 넘김은 녹화와 `section` · `exit_section` 으로 본다. `view` 태그는 쌓이므로(모든 세션이 scroll 로 시작) 「view = scroll」로는 장 넘김 세션이 안 빠진다 — 장 넘김은 「장으로 보기」를 누른 세션만(스마트 이벤트 `view_deck`)이라 드물다.
- (선택) GA4 → BigQuery 내보내기를 켜면 세션 단위 원본 이벤트를 SQL 로 엮을 수 있다.

## 10. 한계

- 방문이 적으면 GA4 가 일부 보고서 값을 가린다(기준점). 비율보다 「누가 · 어디까지 · 무엇을 눌렀나」로 본다. GA4 보고서는 하루쯤 늦게 찬다.
- Clarity 녹화 · 데이터 보관 30일.
- 메일 · 전화 글자, 입력값은 보내지 않는다. 사이트 바닥글에 안내 한 줄(화면만 · 인쇄 숨김)이 저절로 붙는다(공개 주소 + ID 가 있을 때).

## 11. Clarity 태그 · 스마트 이벤트 · 퍼널 · 가림 (2026-11-28 본인 「클래리티 스마트 이벤트 등 세팅값 디벨롭」)

근거: Clarity 공식 문서(learn.microsoft.com/clarity — smart-events · clarity-api · custom-tags · funnels · clarity-masking)와 공개 스크립트 원본(github.com/microsoft/clarity — `clarity-js/src/data/variable.ts` · `custom.ts` · `upgrade.ts` · `upload.ts` · `core/scrub.ts`).

### 11-1. 사이트가 보내는 것 (`track.js`)

**태그는 쌓인다** — `clarity("set", 키, 값)` 을 같은 키로 다시 부르면 값이 덮이지 않고 더해진다(variable.ts `validValues.push` · 문서 「set 배열 = set 두 번」). 그래서 셋으로 나눴다.

| 태그 | 넣는 때 | 값 · 필터 뜻 |
|---|---|---|
| `page` `angle` `share` `src` `entry` | 열 때 한 번 | `entry` = 처음 열린 주소의 #(`p-cp1` · `work` …, 없으면 `top`) — 절 · 카드로 바로 들어온 링크 |
| `view` | 열 때 + 「장으로 보기」 | 쌓임 → `view = deck` = 장 넘김을 써 본 세션 |
| `section` | 한 절 · 주제에 0.8초 넘게 머물 때 한 번 | 주제 이름만(`intro` `summary` `results` `dash` `xdash` `perf` `growth` `work` `pillars` `career` `beliefs` `contact`, en 은 h2 id, 이력서 보기 p1~p7) → `section = work` = 주요 업무를 본 세션 |
| `depth_reached` | 25 · 50 · 75 · 100 % 를 지날 때 한 번 | `depth_reached = 75` = 4분의 3 넘게 내려간 세션 |
| `action` | 핵심 행동 때 한 번 | resume_view · resume_open · resume_download · email_click · email_copy · phone_click · demo_open · demo_newtab |
| `ui` · `nav` | 화면 제어 단추 · 화면 안 #링크를 처음 누를 때 한 번 | GA4 psj_click ui · nav 와 같은 이름(8절) — 이벤트를 늘리지 않으려고 태그로만 |
| `exit_section` | 탭을 숨기거나 닫을 때 | 그때 보던 곳(장 번호까지 `work-3`). Clarity 는 pagehide 때 마지막 묶음을 보내며 태그도 싣는다(upload.ts — track.js 듣개가 먼저 돈다). 탭을 오가면 값이 여럿 — 녹화 끝을 보면 마지막이 진짜 나간 곳 |

옛 태그 `last_section` · `max_depth`(11-25 ~ 11-28 공개본)는 지나친 곳 · 깊이가 모두 쌓여 「나간 곳」 필터로 쓸 수 없었다 — 그 기간 녹화는 새 태그가 없다.

**API 이벤트(`clarity("event", 이름)`) 16종**: `resume_view` `resume_open` `resume_download` `email_click` `email_copy` `phone_click` `demo_open` `demo_newtab` `en_open` `home_open` `outbound` `print` `view_deck` + 퍼널용 도달 이벤트 `reach_results` `reach_work` `reach_contact`(포트폴리오만 · 한 번씩 · 0.8초 머문 뒤 — 장 넘김의 contact 주제는 원칙 · 핵심 요약 · 연락처를 묶어 원칙 장만 봐도 찍힌다. 스크롤판은 #contact 절에 닿아야). 11-28 에 뺀 것: `print_click`(Clarity 는 beforeprint 의 `print` 하나 — GA4 는 둘 다), `view_scroll`(되돌리기는 GA4 `psj_view_change` 에만).
**녹화 우선(`clarity("upgrade", 종류)`)**: 핵심 행동(위 `action` 8종) 때. 문서상 하루 10만 세션을 넘어 녹화를 고를 때 이 세션을 남긴다 — 지금 방문 수에서는 차이 없음(보험).

### 11-2. Clarity 화면 설정 (2026-11-28 Claude 가 본인 Chrome 으로 — 설정 → …)

| 메뉴 | 지금 값 | 비고 |
|---|---|---|
| 스마트 이벤트 | 자동 「다운로드」(Clarity) · API 이벤트(데이터가 들어온 것만 목록에 뜸 — 11-28 email_click · resume_download · resume_view) · **사용자 정의 5개**: `page_en`(페이지 방문 · URL 포함 `sjpark-growth.github.io/en.html`) · `page_resume_pdf`(포함 `…/resume-pdf.html` — 채용 사이트에서 이력서 보기로 바로 온 방문까지) · `step_resume_view` · `step_resume_download` · `step_contact`(API 이벤트를 감싼 것) | 사용자 정의는 프로젝트당 최대 20개. **퍼널 단계 목록에는 API 이벤트가 바로 안 뜨고 사용자 정의 스마트 이벤트만 뜬다** — 그래서 API 이벤트를 `step_` 이름으로 감쌌다. 「API 이벤트」 탭은 데이터가 들어온 이름만 고를 수 있다. 이름은 문자로 시작 |
| 퍼널 | **F1 resume** = 포트폴리오 방문(정규식 `^https://sjpark-growth\.github\.io/(index\.html)?(\?.*)?$`) → `step_resume_view` → `step_resume_download` · **F2 contact** = 포트폴리오 방문 → `step_contact` | 대시보드 퍼널 카드 · 필터에서 본다 |
| 마스킹 | 모드 **균형(기본 그대로)** + 요소별: `a[href^="mailto:"], a[href^="tel:"], li.ct` = **마스킹** · `main` = **마스킹 해제** | 균형 모드는 **숫자가 든 낱말을 모두 가린다**(scrub.ts `redact` — 통화 기호 없는 숫자 낱말) → 녹화 · 히트맵에서 1,331% 같은 성과 숫자가 안 보였다. 본문(main)만 풀고 메일 · 전화는 따로 가림. 입력칸은 모든 모드에서 가림(사이트에 입력칸 없음). 바꾼 뒤 새 녹화부터 · 최대 1시간 |
| 설정 → 고급 | 쿠키 켬 · 봇 감지 켬 · Google Analytics 통합 연결됨 | 그대로 |
| IP 차단 | 없음 | 본인 방문은 `?notrack`(6절)으로 뺀다 — 집 · 휴대폰 IP 가 바뀌어 IP 차단은 안 씀 |

### 11-3. 공개(push) 뒤 할 일 — 새 이벤트가 들어온 다음(하루쯤)

1. 설정 → 스마트 이벤트 → 새로운 이벤트 → 처음부터 → **API 이벤트** 탭에서 `reach_results` · `reach_work` · `reach_contact` 를 각각 감싸 `step_reach_results` · `step_reach_work` · `step_reach_contact` 로 저장.
2. `step_contact` 편집 → API 이벤트 `email_copy` · `phone_click` 더하기(들어온 뒤).
3. 퍼널 **F1 resume** 편집 → 포트폴리오 방문 → `step_reach_results` → `step_reach_work` → `step_resume_view` → `step_resume_download` 차례로. **F2 contact** → 포트폴리오 방문 → `step_reach_contact` → `step_contact`.
4. 대시보드 · 녹화 필터를 저장해 두면 좋은 묶음(세그먼트): 「핵심 행동 세션」(태그 `action` 아무 값) · 「주요 업무까지 본 세션」(`section = work`) · 「지원처 유입」(`src` = wanted · saramin …) · 「휴대폰」(기기).

### 11-4. 주간 인사이트 · 개선안 (2026-11-28 — 대시보드 「포트폴리오 유입·이탈」)

매일 07:30 갱신(작업 폴더 `_work/analytics/ga4_pull.py`)이 `insights.py` 를 불러 **지난 월~일 주**를 규칙으로 읽고 대시보드 「이번 주 인사이트 · 개선안」 칸에 올린다(집계 첫 주 전엔 부분 주 · 주가 끝나고 3일 뒤 굳힘 · `out/insights-history.json` 에 26주까지). 영역: 수집(점검 실패) · 규모 · 퍼널(첫 화면 → 주요 성과 → 주요 업무 → 연락처) · 이탈 · 기기(휴대폰 · PC 나갈 때 깊이) · 전환(이력서 보기 → 받기) · 유입(?src 별 핵심 행동) · UI(위 nav · ui — 안 쓰이는 장치) · 사용성(클래리티 dead · rage · quickback · 스크립트 오류). 줄마다 근거 숫자 · 할 일 · **고칠 곳(파일 · 선택자)** · 확신(표본)이 붙는다 — 방문자 5명 아래 주는 관찰만. 사이트 쪽 이름(절 id · `MILE` · ui 대상 이름)을 바꾸면 `insights.py` 의 `ORDER` · `MILES` · `FIX` · `UI_KNOWN` 도 맞춘다.
