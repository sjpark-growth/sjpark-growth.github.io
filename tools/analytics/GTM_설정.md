# 방문 흐름 · 이탈 분석 — GTM + GA4 + Clarity 설정 (2026-11-25)

사이트 쪽은 `assets/track.js` 가 이벤트를 `dataLayer` 에만 넣는다. 어디로 보낼지는 GTM 에서 정한다.
**`track.js` 의 `GTM_ID` 가 비어 있는 동안에는 외부 요청이 없다.**

## 0. 만든 것 (2026-11-25)

| 도구 | ID | 계정 · 이름 |
|---|---|---|
| GTM | `GTM-P9NRDTDV` (계정 6407836635 · 컨테이너 288652423) | 계정 sjpark-growth · 컨테이너 sjpark-growth.github.io · 버전 2 「v1 방문 흐름 분석」 게시 |
| GA4 | 측정 ID `G-D1KF2MWKJW` · 스트림 16410100727 | 계정 sjpark-growth · 속성 sjpark-growth portfolio(대한민국 시간) · 데이터 공유 4개 모두 끔 · 「브라우저 기록 기반 페이지 변경」 끔 |
| Clarity | `zizzedwvba` | 프로젝트 sjpark-growth portfolio |

GTM 컨테이너 설정은 `gtm-container.json`(이 폴더)을 「관리자 → 컨테이너 가져오기 → 병합」으로 넣었다 — 다시 만들 때도 이 파일. 아래 1~3 은 손으로 할 때의 설명이다.

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

## 2. GTM — 변수 (데이터 영역 변수, 버전 2)

이름 그대로 만든다: `psj_page` `psj_view` `psj_angle` `psj_share` `psj_src` `psj_section` `psj_section_index` `psj_section_total`
`psj_depth` `psj_via` `psj_seen` `psj_engaged_sec` `psj_section_sec` `psj_leave_n` `psj_click` `psj_target`

## 3. GTM — 태그 · 트리거

1. **Google 태그** — 태그 ID `G-XXXXXXXXXX`, 트리거 「Initialization - All Pages」.
   구성 매개변수(모든 이벤트에 실림): `psj_page` `psj_view` `psj_angle` `psj_share` `psj_src` ← 같은 이름 변수.
2. **GA4 이벤트 「psj 이벤트」** — 측정 ID 같음, 이벤트 이름 `{{Event}}`,
   트리거 = 맞춤 이벤트 · 정규식 사용 `^psj_(section|leave|click|print|view_change)$`.
   이벤트 매개변수: 2 의 변수 전부(값이 없는 것은 비어서 간다 — 괜찮다).
3. **맞춤 HTML 「Clarity」** — Clarity 설정 → 설치에 나오는 **공식 코드 그대로**, 트리거 「Initialization - All Pages」.
   공식 코드는 `window.clarity` 대기열을 이어받으므로 `track.js` 가 먼저 넣은 태그(`set`) · 이벤트가 사라지지 않는다. 대기열을 새로 만드는 다른 코드로 바꾸지 않는다.
4. 미리보기(Tag Assistant)로 공개 주소를 열어 세 태그가 뜨는지 본 뒤 **제출(게시)**.

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
| `psj_ctx` | 페이지 열 때(GA4 로 안 보냄 — 맥락만) | `psj_page` home · en · resume_pdf, `psj_view` scroll · deck · page, `psj_angle`, `psj_share` on · off, `psj_src` |
| `psj_section` | 한 절(스크롤) · 한 장(장 넘김)에 **0.8초 넘게** 머물 때 | `psj_section`(스크롤 intro · summary · results · dash · xdash · perf · growth · work · pillars · career · beliefs · contact / 장 넘김 `work-3` 처럼 주제-장 / en 은 h2 id / 이력서 보기 p1~p7), `psj_section_index` · `_total`, `psj_depth`(가장 깊이 본 곳 %), `psj_via`(scroll · wheel · key · drag · swipe …) |
| `psj_leave` | 탭을 숨기거나 닫을 때(다시 돌아오면 또 생김 — `psj_leave_n`) | 마지막 `psj_section`, `psj_depth`, `psj_seen`(본 곳 수), `psj_engaged_sec`(보이던 시간), `psj_section_sec`(마지막 곳에 머문 시간) |
| `psj_click` | 누를 때 | `psj_click` = resume_view · resume_open · resume_download · demo_open · demo_newtab · email_click · email_copy · phone_click · en_open · home_open(en · 이력서 보기 → 포트폴리오) · print_click · outbound, `psj_target`(데모 이름 · full/short · 바깥 도메인), `psj_section`(누를 때 본 곳) |
| `psj_view_change` | 「장으로 보기 · 스크롤로 보기」 | `psj_view` |
| `psj_print` | 인쇄 창(Ctrl+P 포함 — 「전체 · 요약 PDF」 단추로 열면 `psj_click` print_click 도 같이 남는다) | `psj_section` |

Clarity 에는 태그 `page` `view` `angle` `share` `src` `last_section` `max_depth` 와 이벤트(위 `psj_click` 종류 · `print` · `view_deck` · `view_scroll`)가 같이 간다. Clarity 맞춤 이벤트 한도는 프로젝트당 20개 — 지금 15개.

## 9. 보는 법

- **어디서 나갔나**: Clarity 녹화 → 필터 「맞춤 태그 `last_section`」 = `work-3` 등 → 녹화를 연다. GA4 탐색 → 자유 형식: 이벤트 이름 = `psj_leave`, `psj_leave_n` = 1, 행 `psj_section`, 값 사용자 수.
- **얼마나 깊이**: 같은 표에 `psj_depth` 평균, 또는 행에 `psj_depth`.
- **퍼널**: GA4 유입경로 탐색(개방형) — `psj_section` intro → results/dash → work → `psj_click`(resume_view · resume_download · email_*). 분류 기준 `psj_src` · `psj_view`.
- **지원처별**: 아무 표에 `psj_src` 를 행 · 비교로.
- **히트맵**: Clarity 히트맵은 **스크롤판만** 의미가 있다(필터 `view` = scroll). 장 넘김은 창이 스크롤되지 않아 스크롤 히트맵이 비고, 클릭 위치도 어긋날 수 있다 — 장 넘김은 녹화와 `last_section` 으로 본다.
- (선택) GA4 → BigQuery 내보내기를 켜면 세션 단위 원본 이벤트를 SQL 로 엮을 수 있다.

## 10. 한계

- 방문이 적으면 GA4 가 일부 보고서 값을 가린다(기준점). 비율보다 「누가 · 어디까지 · 무엇을 눌렀나」로 본다. GA4 보고서는 하루쯤 늦게 찬다.
- Clarity 녹화 · 데이터 보관 30일.
- 메일 · 전화 글자, 입력값은 보내지 않는다. 사이트 바닥글에 안내 한 줄(화면만 · 인쇄 숨김)이 저절로 붙는다(공개 주소 + ID 가 있을 때).
