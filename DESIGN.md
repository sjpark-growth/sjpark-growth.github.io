---
version: 2026-11-23
name: Park-Seongjoon-Growth-Report
description: >-
  박성준 포트폴리오(sjpark-growth.github.io)의 디자인 기준. 푸른 기가 도는 종이색 바탕 위 잉크색 글자, 강조색은 코발트 하나,
  숫자는 좁은 숫자 서체(Bahnschrift 계열)로 크게. 광고 콘솔 · 리포트처럼 정보가 촘촘한 화면이고, 장식은 숫자를 돋보이게 하는 무대 조명까지만.
  형식은 Awesome DESIGN.md(VoltAgent/awesome-design-md) · Google Stitch DESIGN.md 를 따랐다. 값의 원본은 assets/style.css — 이 파일과 다르면 style.css 가 맞다.
  규칙의 우선순위: CLAUDE.md > 이 파일 > 디자인 스킬(Taste · impeccable · emil-design-eng · web-design-guidelines …)의 기본값.

colors:
  # 라이트 (기본) — :root
  paper: "#f3f5f9"          # 바탕 — 푸른 기가 도는 종이
  surface: "#ffffff"        # 카드 · 칸
  sunk: "#eaeef4"           # 눌린 칸 · 아이콘 받침
  ink: "#0c1a2b"            # 본문 · 큰 숫자
  ink-2: "#46566c"          # 보조 글
  ink-3: "#5d6b80"          # 캡션 · 기간 · 부가 설명 — 모든 실제 바탕에서 4.5:1 이상(더 연하게 금지)
  rule: "#e0e5ed"
  rule-2: "#c7cfdb"
  ring: "rgba(12,26,43,.09)" # 카드 테두리
  accent: "#2743d4"         # 코발트 — 링크 · 재생 진행 · 「입사 이후」 표시에만
  accent-ink: "#1c34b0"     # 강조 글자 · 굵은 숫자
  accent-soft: "#e6eafc"
  before: "#8592a5"         # 입사 전 수치(차트)
  good: "#0b7a37"
  warn: "#a86a00"
  series-coupang-1p: "#2a78d6"   # 차트 색 = 채널 고정(바꾸지 않는다)
  series-coupang-wing: "#eb6834"
  series-naver: "#1baf7a"
  series-small: "#eda100"
  # 다크 — @media (prefers-color-scheme: dark) 와 [data-theme="dark"] 두 곳이 같은 값
  dark-paper: "#0a1019"
  dark-surface: "#111a26"
  dark-sunk: "#172232"
  dark-ink: "#e9eef6"
  dark-ink-2: "#aab6c7"
  dark-ink-3: "#8593a8"
  dark-rule: "#1f2b3c"
  dark-accent: "#8b9bff"
  dark-accent-ink: "#a9b5ff"
  dark-accent-soft: "#1b2447"
  # 효과(FX) 토큰 — style.css 맨 끝 FX 블록. 보라 · 라벤더는 쓰지 않는다(코발트 · 하늘 · 청록만)
  fx-light-glow: ["#c7d1ff", "#c4e3ff", "#bfeee3"]
  fx-dark-glow: ["#3a4fd8", "#2f7fe0", "#0e8f80"]
  fx-gradient-text-light: ["#1c34b0", "#1a5fc7", "#0e7490"]
  fx-gradient-text-dark: ["#a9b5ff", "#8fc8ff", "#6ee7d8"]

typography:
  # 웹폰트를 받지 않는다(외부 요청 0) — 설치된 시스템 서체 목록
  sans: '"Pretendard", "Pretendard Variable", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif'
  num: '"Bahnschrift", "DIN Alternate", "DIN Condensed", "Roboto Condensed", "Arial Narrow", sans'   # 숫자 · KPI · 차트 눈금 (font-stretch 85%)
  mono: '"Cascadia Mono", "SF Mono", "JetBrains Mono", Consolas, "Noto Sans KR", monospace'        # 꼬리표(TAG) · 기준일 · 코드
  display-name:   { fontFamily: sans, fontSize: "clamp(40px, 5.6vw, 72px)", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.045em" }   # 첫 화면 이름
  thesis:         { fontFamily: sans, fontSize: "clamp(22px, 2.3vw, 31px)", fontWeight: 700, lineHeight: 1.38, letterSpacing: "-0.035em", textWrap: balance }
  section-title:  { fontFamily: sans, fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.04em", textWrap: balance }
  kpi-number:     { fontFamily: num, fontSize: "clamp(34px, 3.4vw, 46px)", fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em", fontStretch: "85%" }
  body:           { fontFamily: sans, fontSize: 15.5px, fontWeight: 400, lineHeight: 1.62, letterSpacing: "-0.005em", wordBreak: keep-all }
  tag:            { fontFamily: mono, fontSize: 11.5px, letterSpacing: "0.12em", textTransform: uppercase, color: accent-ink }
  caption:        { fontFamily: sans, fontSize: 12px, color: ink-3 }   # 휴대폰 보조 글자 하한 12px

rounded:
  button: 7px        # .iconbtn — 상단 도구 단추
  chip: 8px          # 연락처 · 도구 칩
  button-primary: 9px
  card: 12px         # .panel · .job · .score · 핵심 성과 묶음
  card-feature: 14px # 주요 업무 카드(.proj) · 성과 리포트 칸(.mp)
  card-hero: 16px    # 그로스 카드 · 프로필 사진
  card-lead: 18px    # 주요 성과 머리 카드(.rs-lead)

spacing:
  gutter: "clamp(16px, 3.2vw, 44px)"   # --gut, 휴대폰 16px
  max-width: 1320px                    # --maxw
  section-padding: "clamp(34px, 4.2vw, 58px)"
  card-padding: "clamp(14px, 1.8vw, 22px)"
  chart-grid: "1px 칸 사이 선(gap: 1px + 배경 rule) — 표처럼 붙은 숫자 칸"

elevation:
  card: "0 1px 2px rgba(12,26,43,.05), 0 8px 24px rgba(12,26,43,.06)"
  card-dark: "0 1px 2px rgba(0,0,0,.3), 0 10px 30px rgba(0,0,0,.28)"
  card-hover: "0 12px 34px rgba(12,26,43,.14) + translateY(-3px) scale(1.012)"

motion:
  page-turn: { duration: .7s, easing: "cubic-bezier(.3,0,.12,1)" }        # 장 넘김(topics.css --tm-dur · --tm-ease)
  entrance: { duration: .7–.9s, easing: "cubic-bezier(.2,.8,.2,1)" }     # 첫 화면 rise · boardin, 스크롤 등장 26px
  hover: { duration: .15–.25s, properties: "transform · border-color · box-shadow 만 (transition: all 금지)" }
  theme-switch: { duration: 720ms, effect: "단추 자리에서 원이 퍼짐 (View Transitions)" }
  ambient: "첫 화면 빛(WebGL)은 5초 안에 멈춤(마우스가 깨움), 테두리 빛 · 그라데이션 글자는 한 번(5초 미만) — 끝없이 도는 장식 없음"
  reduced-motion: "모든 움직임 끔 · 첫 화면 빛은 멈춘 한 장"
---

## Overview

광고 · 매출 리포트를 그대로 웹으로 옮긴 이력서다. 읽는 사람(채용 담당 · 헤드헌터)이 **첫 화면 한 장에서 숫자 네 개**를 가져가게 하는 것이 전부이고,
나머지 화면은 그 숫자의 근거(대시보드 데모 · 차트 · 업무 카드 · 경력)를 차례로 보여 준다. 그래서 정보 밀도는 높게(Taste 다이얼로 치면 VISUAL_DENSITY 7~8),
배치는 반듯하게(DESIGN_VARIANCE 3~4), 움직임은 「들어올 때 한 번 · 마우스에 반응」(MOTION_INTENSITY 5) 정도가 이 사이트의 자리다.

## Colors

- 바탕은 순백이 아니라 푸른 기가 도는 종이(`paper`), 카드는 흰색(`surface`) — 카드와 바탕의 차이로 칸을 나눈다. 다크는 같은 구조의 남색 계열.
- **강조색은 코발트 하나.** 링크 · 「입사 이후」 · 개선 숫자에만 쓴다. 차트의 채널 색 네 개(1P 파랑 · 윙 주황 · 네이버 초록 · 소액 노랑)는 데이터 색이라 장식에 쓰지 않는다.
- 효과(첫 화면 빛 · 그라데이션 글자 · 진행 막대)도 코발트 → 하늘 → 청록 안에서만. **보라 · 라벤더 · 무지개 그라데이션 금지** — 「AI 가 만든 화면」의 대표 표시다.
- 글자 대비는 실제 바탕마다 4.5:1(본문) — `ink-3` 은 이미 한계값이다. 첫 화면 빛이 글자 뒤로 지나가는 자리는 `--fx-a-text` 로 옅게 하고 `fx-audit` 의 contrast 로 잰다.

## Typography

- 한글 본문은 Pretendard → Noto Sans KR → 맑은 고딕 순(설치된 것). 웹폰트를 받지 않는다.
- **숫자는 좁은 숫자 서체(`num`)로 크게**, 단위(%, 억, %p)는 0.45em 연하게. 개선은 늘 「이전 → 이후 (+개선 폭%p)」 꼴.
- 꼬리표(Performance · Projects …)는 고정폭 대문자 11.5px · 자간 .12em.
- 제목 `text-wrap: balance`, 본문 `pretty`, `word-break: keep-all`(한글 낱말 단위 줄바꿈).

## Layout

- 첫 화면은 100% 배율 노트북 한 장(1463×800 · 1280×720)에 핵심 성과 숫자 네 개가 들어와야 한다. 넓은 화면은 2단(소개 + 핵심 성과 | 「핵심 과업」 2×2).
- 휴대폰은 사진 · 문장 · 연락처 → 핵심 성과 → 요약 → 성과 리포트(가로 넘김) 순.
- 두 가지 보기: 스크롤판(기본)과 장 넘김(「장으로 보기」). 인쇄는 전체 16 · 요약 7장 A4 — 배치를 바꾸는 장식은 금지.

## Elevation & Depth

평면 카드 + 얕은 그림자 두 겹. 마우스를 올리면 3px 뜨고 그림자가 깊어진다. 카드 기울기(최대 3~5.5°)와 커서 빛 번짐은 마우스일 때만.

## Shapes

모서리는 단추 7~9px, 카드 12~18px(큰 카드일수록 둥글게). 알약(999px)은 상태 표시(LIVE · 기준일 · 경력 N년)에만.

## Components

- **성과 리포트 칸(.mp)**: 머리(꼬리표 + 개선 폭 알약) · 큰 숫자(이전 취소선 → 이후) · 한 줄 설명 · 작은 차트 · 기간 줄.
- **핵심 성과(.hk)**: 1px 선으로 붙은 2×2 숫자 칸, 첫 칸 숫자만 강조색.
- **주요 업무 카드(.proj)**: 모션 영상 | 제목 · hook · 「어떻게」(핵심어 파란 글자 + 세로선) · 숫자 세 칸.
- **단추**: 도구 단추(.iconbtn, 테두리 · 흰 바탕 · 32px), 주 단추(.btn, 잉크색 채움 · 38px). 누를 수 있는 칸 24px 이상(휴대폰 사례 링크 포함).

## Do's and Don'ts

**Do**
- 숫자를 먼저, 크게, 기간과 함께.
- 새 장식은 `assets/fx.js` 덧그림(transform · opacity · 캔버스)으로 — 배치 불변, `?fx=0` 으로 끌 수 있게.
- 바꾼 뒤 `fx-audit.js --pdf` · `web-design-guidelines` 검사 · 다크 모드 · 390px 확인.

**Don't**
- 보라 그라데이션 · 유리 효과 남발 · 똑같은 카드 세 장 · 가운데 정렬 큰 히어로(지금 구조를 「AI 기본값」으로 갈아엎지 않는다).
- 끝없이 도는 장식, 스크롤 가로채기, 내용을 막는 로딩 화면.
- 진짜 연락처를 가짜로 바꾸기(Taste 의 규칙 9는 이 사이트에 적용하지 않는다 — 공유판은 `?share`).
- 웹폰트 · CDN · 분석 도구.
