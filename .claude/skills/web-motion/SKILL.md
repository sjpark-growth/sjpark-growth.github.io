---
name: web-motion
description: 박성준 포트폴리오(이 저장소)의 모션 · 시각 효과 작업 규칙과 도구. 「애니메이션」 「모션 그래픽」 「고급스럽게」 「삐까뻔쩍」 「인터랙션」 「화려하게」 「디자인 퀄리티」 같은 요청, 또는 assets/fx.js · style.css 맨 끝 FX 블록 · 테마 전환 · 첫 화면 빛 · 카드 기울기 · 커서 효과를 고칠 때 먼저 읽는다. 새 효과를 넣는 순서, 지켜야 할 장치(인쇄 16 · 7장, 장 넘김, 동작 줄이기, 글자 대비, 첫 화면 한 장), 복사해 쓸 레시피, 점검 스크립트(scripts/fx-audit.js)가 들어 있다.
---

# web-motion — 모션 · 시각 효과 보강 규칙 (2026-11-23)

이 사이트는 **숫자가 주인공인 이력서**다. 효과는 숫자를 더 또렷하게 보이게 하는 무대 조명이어야 하고, 숫자를 가리거나 읽는 속도를 늦추면 안 된다.
처음 넣은 판은 `assets/fx.js` + `assets/style.css` 맨 끝 「FX」 블록 + `app.js` 테마 단추 한 곳이다. 저장소 규칙 전체는 루트 `CLAUDE.md`(특히 5 · 5-1 · 5-5 · 5-8 · 5-9절)가 우선이다.

## 1. 원칙

1. **덧그림만** — `transform`(· 개별 속성 `translate` `rotate` `scale`) · `opacity` · 캔버스 · 가상 요소(::before/::after) · `clip-path`만 움직인다. `width` `height` `margin` `padding` `top/left` `font-size` `letter-spacing` 을 움직이면 첫 화면 한 장 맞춤(`fitHeroScroll`) · 장 넘김 장 나눔(`topics.js layout()`) · PDF 장 수가 흔들린다.
2. **한 화면에 주인공 하나** — 첫 화면은 빛(aurora), 주요 성과는 테두리 빛(beam), 절 머리는 꼬리표 해독(scramble). 같은 자리에 효과를 겹치지 않는다(이미 `wireReveal` 등장 · `wireSpot` 빛 번짐 · 숫자 굴림이 있다).
3. **끄면 예전 그대로** — 모든 규칙은 `html.fx-on` 아래. `?fx=0`(이 탭) · `localStorage psj-fx=0`(이 브라우저)이면 스크립트가 클래스를 안 붙인다. 스크립트가 꺼져도 화면은 멀쩡해야 한다.
4. **외부 요청 0** — 라이브러리(GSAP · three.js · Lottie · 웹폰트) 금지(CLAUDE.md 1절). WebGL · Web Animations · View Transitions · CSS `@property` 는 브라우저 기본이라 쓴다.
5. **멈출 줄 아는 움직임** — 저절로 도는 장식은 **5초 안에 멈춘다**(WCAG 2.2.2 · `web-design-guidelines`) — 한 번 돌고 끝 · 마우스를 올리면 다시. **`infinite` 장식 금지**(2026-11-26 본인 「장식 애니메이션은 한 번만 돌고 멈추게」 — 사이트의 옛 장식도 모두 한 번으로 바꿈, CLAUDE.md 5-1 「장식 애니메이션은 한 번만」). 안내 그림(넘기는 법 등)만 뜻을 알 만큼 2~3번. 화면 밖 · 다른 탭 · 동작 줄이기 · 인쇄에서는 처음부터 멈춤. 마우스를 따라가는 것은 마우스(`(hover: hover) and (pointer: fine)`)일 때만.
6. **색은 `DESIGN.md` 안에서** — 강조색 코발트 · 하늘 · 청록. **보라 · 라벤더 · 무지개 그라데이션 금지**(「AI 가 만든 화면」의 대표 표시).

## 2. 지금 있는 장치 지도 — 새로 만들기 전에 여기서 찾는다

| 무엇 | 어디 | 메모 |
|---|---|---|
| 첫 화면 빛(WebGL) + 점 격자 | `fx.js aurora()` · CSS `.fx-stage` `.fx-grid` | 「핵심 과업」 칸(#mboard) 둘레를 도는 빛 4개 + 흐르는 잡음. 4초 안에 잦아들어 멈춤(`REST_AFTER` 1.5초 · 첫 그리기 뒤 한가할 때 만듦), 마우스 · 테마 · 탭 복귀가 깨움. 소개 · 「핵심 성과」 머리 · 「핵심 과업」 머리 자리는 `--fx-a-text` 만큼 옅게(글자 대비). 해상도 0.5배 · 40fps, 소프트웨어 GL(SwiftShader 등)은 0.25배 · 20fps, 1초 평균 28ms 넘으면 한 단계씩 낮추다 멈춘 한 장 |
| 카드 기울기 · 단추 끌림 | `fx.js pointerFx()` (`TILT` · `MAG` 선택자) | `rotate` · `translate` **개별 속성**을 JS 가 직접 lerp — hover 의 `transform` 과 따로 겹친다. CSS `transition` 을 더하지 않는다(카드마다 있던 transition 목록을 덮어쓴다) |
| 따라오는 고리 | `fx.js cursor()` · `.fx-cursor` · `html.fx-cur` | 기본 커서(화살표)는 숨기지 않되, 고리가 있는 동안 **손 모양(pointer · grab)은 쓰지 않는다**(2026-11-26 본인 「손 모양으로 바뀌는 게 너무 별로」 — style.css 맨 끝 「손 모양 포인터 끄기」가 덮는다). 누를 것 위 `is-hot`, 차트 위 `is-chart`(작은 점), 입력 · iframe 위 `is-quiet`(숨김) |
| 꼬리표 해독 | `fx.js scramble()` (`SCR`) | 영문 · 숫자만 바꾸고 한글은 그대로, 고정폭 글꼴이라 폭이 안 바뀐다. 장 넘김에서는 안 돈다(장 넘김이 절 머리를 복사 · 줄바꿈 공백을 바꿈) |
| 테두리 빛 | `fx.js beam()` (`BEAM`) · `.fx-beam::after` | 들어올 때 한 바퀴(2.6초 — 11-26 전엔 두 바퀴 4.8초) · 마우스 올리면 다시. `@property --fx-ang` + conic-gradient + mask exclude. 대상에 ::after 가 이미 있으면 쓰지 않는다 |
| 흐르는 그라데이션 글자 | `fx.js grad()` · `.fx-grad` | 한 번(2.8초 — 11-26 전엔 4.5초) · 마우스 올리면 다시. `.thesis em` 안에 span 을 넣어 글자만 — em 의 형광펜 밑줄 바탕은 그대로. 주기 반복 그라데이션(200% · 0→100%)이라 이음매 없음 |
| 테마 원형 전환 | `FX.themeSwap(apply, 단추)` ← `app.js wireChrome` | View Transitions 없으면 바로 바뀜 |
| 스크롤 등장 · 빛 번짐 | `app.js wireReveal` · `wireSpot` (11-15) | 첫 화면 밖 카드 · 절 머리. 장 넘김에서는 안 돎 |
| 숫자 굴림 | `app.js rollNumbers` · `[data-roll-to]` | 인쇄 직전 끝값으로 |
| 움직임 예산 | `app.js wireAnimBudget`(`LOOPERS` → `.anim-idle`) · fx.js `budget()`(→ `.fx-idle`) | **`.anim-idle` 을 카드에 붙이지 말 것** — 카드 자신의 등장 애니메이션(boardin · rise)까지 멈춰 화면 밖 카드가 투명한 채 굳는다(휴대폰 LIVE DEMO 칸에서 실제로 났다). 효과 층만 멈추는 `.fx-idle` 을 쓴다 |
| 장 넘김 움직임 토큰 | `topics.css --tm-dur .7s` · `--tm-ease cubic-bezier(.3,0,.12,1)` | 새 전환 곡선은 이 둘을 따른다 |
| 데모 영상(모션) | `assets/motion.js` | 캔버스 장면. 테마가 바뀌면 `MOTION.redrawAll()` |

## 3. 새 효과를 넣는 순서

1. 위 표에 같은 일을 하는 것이 있는지 본다 → 있으면 그것을 고친다.
2. `fx.js` 에 함수 하나로 넣고 `CONF` 에 이름을 더한다(끌 수 있게). `start()` 에서 `try { } catch` 로 부른다 — 효과 하나가 깨져도 페이지는 산다.
3. CSS 는 `style.css` **맨 끝 FX 블록 안**에, `html.fx-on` 아래 · `@media screen` 안에. 인쇄 블록(`@media print`)에서 끈다.
4. 다음을 모두 정한다(코드 주석에 한 줄씩):
   - 동작 줄이기: 멈춘 한 장 / 안 그림 (`RM.matches`)
   - 인쇄: 숨김 + `holds` 에 정리 함수(인쇄 직전 · 「장으로 보기」 직전에 불림)
   - 장 넘김(`html.tabmode`): 돌아도 되나? 절을 옮기거나 복사(`copyPins`)해도 안전한가? `tm:mode` 에 다시 재기
   - 화면 밖 · 다른 탭: rAF 루프는 `loops` 에 이름을 넣고 빼서 `FX.info().loops` 로 보이게
   - 손가락 기기: 마우스 전용이면 `FINE.matches` 에서만
5. 루트 `CLAUDE.md` 5-8절 표에 한 줄 더한다(무엇 · 어디 · 주의).
6. 아래 6절 점검을 돌린다. 곡선 · 길이 · 누름 반응은 `emil-design-eng`, 마지막 규칙 검사는 `web-design-guidelines`(같은 `.claude/skills/`).

## 4. 반드시 지킬 것 (이 저장소에서 실제로 깨졌던 것들)

- **첫 화면 한 장**: 1463×800 · 1280×720 · 390×664 에서 핵심 성과 숫자가 첫 화면 안. 효과가 배치를 안 바꾸면 자동으로 지켜진다 — fx-audit 「layout」 이 ?fx=0 과 위치를 0.5px 단위로 비교.
- **PDF 장 수**: 전체 16 · 요약 7(맑은 고딕 8). fx-audit `--pdf` 가 효과 켬 / 끔 장 수를 비교. 인쇄에서 캔버스 · 고리 · 테두리 빛을 숨기고 그라데이션 글자는 단색으로.
- **글자 대비 4.5:1**: 첫 화면 빛은 바탕을 바꾼다. 라이트는 밝은 파스텔(바탕보다 많이 어두워지지 않는 색), 다크는 낮은 투명도. 소개 글자 자리 곱(`--fx-a-text`)을 올리기 전에 fx-audit 「contrast」 를 본다. 색 토큰은 `:root` · 다크 미디어 · `[data-theme="dark"]` 세 곳을 같이 고친다.
- **인쇄 직전 순서**: `fx.js` 는 `app.js` **앞**에 읽힌다 — `beforeprint` 가 먼저 돌아 글자 효과를 원래 글자로 돌려놓은 뒤에 app.js `printWrap` 이 인쇄 줄바꿈 공백을 넣는다. 순서를 바꾸면 해독 중이던 꼬리표가 엉터리 글자로 PDF 에 찍힐 수 있다. 시작(`start`)은 DOMContentLoaded.
- **장 넘김 전환**: `#modeBtn` 클릭을 캡처 단계에서 받아 `hold()` — 절을 옮기기 전에 진행 중인 효과를 끝낸다.
- **반복 애니메이션의 blur 금지**: keyframes 의 `filter: blur` 는 합성(compositing)이 안 돼 넘김이 끊겼다(CLAUDE.md 5-5 「넘김 성능」). 빛 번짐은 캔버스나 미리 흐린 그라데이션으로.
- **위치는 `translate` 속성, 크기는 `scale` 속성**(2026-11-28 고리): 개별 속성은 translate → rotate → scale → transform 순으로 합성된다. 위치를 `transform: translate3d()` 에 두고 크기를 `scale` 로 주면 scale 이 이동값까지 곱해 요소가 「배율 × 좌표」로 날아간다(고리가 링크 위에서 234~500px 떨어져 그려졌다). 마우스를 따라가는 요소는 `el.style.translate` 로 옮기고, lerp 는 프레임 수가 아니라 시간 기준(`k = 1 − exp(−dt / τ)`) — 프레임당 고정 계수는 60Hz · 144Hz · 바쁜 프레임에서 따라오는 속도가 2~4배 달라진다.
- **`<html>` 에 자주 바뀌는 사용자 정의 속성 금지**: 문서 전체 스타일 재계산. 마우스 좌표 같은 것은 그 요소(`.fx-stage` 등)에.
- **첫 화면 로드 예산**: 11-23 fx.js 포함 문서까지 14~15개 · 압축 없이 약 810~870KB(CLAUDE.md 6절 5). 새 파일 · 이미지를 붙이기 전에 정말 첫 화면에 필요한지. 무거운 것은 `load` 뒤 · 화면에 올 때.
- **원본 대시보드 · 실명**: 효과용 그림 · 영상에도 실제 사내 화면 · 상품명을 쓰지 않는다(CLAUDE.md 4절).

## 5. 레시피 (복사해 쓴다)

**원형 테마 전환 (View Transitions)**
```js
const t = document.startViewTransition(apply);
t.ready.then(() => document.documentElement.animate(
  { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
  { duration: 720, easing: 'cubic-bezier(.3,0,.12,1)', pseudoElement: '::view-transition-new(root)' }));
// CSS: html.fx-vt::view-transition-old(root), html.fx-vt::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
```

**테두리를 도는 빛 (@property)**
```css
@property --fx-ang { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
.x::after { content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.5px; pointer-events: none;
  background: conic-gradient(from var(--fx-ang), transparent 0 228deg, var(--accent) 300deg, #fff 332deg, transparent);
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); opacity: 0; animation: spin 2.6s cubic-bezier(.45,.05,.25,1) 1 both; }
@keyframes spin { 0% { --fx-ang: 0deg; opacity: 0; } 12%, 78% { opacity: 1; } 100% { --fx-ang: 360deg; opacity: 0; } }   /* 한 바퀴 돌고 사라짐 — infinite 금지 */
```

**마우스 쪽으로 기울기 (개별 속성 + lerp)** — 부모에 `perspective`, 요소에 `el.style.rotate = \`${-ny} ${nx} 0 ${deg}deg\``(축-각). 매 프레임 `x += (target - x) * .16`, 0 에 닿으면 `removeProperty`. `transition` 은 쓰지 않는다.

**스크롤에 묶인 움직임 (CSS 만 — 지원 브라우저에서만)**
```css
@supports (animation-timeline: view()) {
  html.fx-on .x { animation: fxPar linear both; animation-timeline: view(); animation-range: entry 0% cover 50%; }
  @keyframes fxPar { from { translate: 0 24px; opacity: .4; } to { translate: none; opacity: 1; } }
}
```
`animation` 을 이미 쓰는 요소에 걸면 그 애니메이션을 덮어쓴다 — 안쪽 요소나 가상 요소에.

**WebGL 한 장짜리 셰이더** — 삼각형 하나(`[-1,-1, 3,-1, -1,3]`)로 화면을 덮고 프래그먼트 셰이더만. `premultipliedAlpha: true` 면 `gl_FragColor = vec4(col * a, a)`. 해상도는 CSS 크기 × 0.5 이하, fps 상한, IntersectionObserver · `visibilitychange` 로 멈춤, `webglcontextlost` 에서 CSS 그라데이션으로. `fx.js aurora()` 가 본보기.

**첫 로드를 붙잡지 않기**(2026-11-26 본인 「로딩이 길어졌다」): WebGL 컨텍스트 · 셰이더 같은 무거운 준비는 `requestIdleCallback(f, { timeout: 500 })` 로 첫 그리기 뒤에, 셰이더는 `KHR_parallel_shader_compile` 이 있으면 걸어 두고 `COMPLETION_STATUS_KHR` 만 프레임마다 묻는다(`fx.js aurora()`). 첫 화면에서 저절로 도는 효과는 3초 안팎으로 — 첫 화면이 다 멈추기 전까지는 「아직 로딩 중」으로 읽힌다. 처음 크기를 재는 일은 ResizeObserver 의 첫 알림에 맡긴다(그리는 도중 바로 재면 페이지 전체를 한 번 더 배치).

**한 번만 — 화면에 들어올 때**: `new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } }), { threshold: .9 })`, 시작할 때 이미 화면 안인 것은 건드리지 않는다(깜빡임). CSS 만으로 된 장식은 `animation-iteration-count: 1` + `fill-mode: both` 로 두고 app.js `LOOPERS` 에 더하면 화면 밖에서 시작 전 그대로 멈춰 있다가 들어올 때 돈다(`.anim-idle`). 효과 층만 멈추려면 fx.js 의 `.fx-idle`.

**마우스를 올리면 다시** — app.js `wireReplay()` 의 `REPLAY_HOSTS`(카드 선택자) · `REPLAY_NAMES`(@keyframes 이름)에 더한다. 끝난(`finished`) 애니메이션만 기다림(delay)을 건너뛰어 처음으로 되감는다. **CSS `:hover` 에서 `animation-name` 을 바꾸지 말 것** — 마우스를 뗄 때 원래 이름으로 돌아가며 한 번 더 돈다(예전 fxBeamAgain · fxFlowAgain). 되감을 것은 `fill-mode: both` 라야 한다(끝나고 사라진 애니메이션은 `getAnimations()` 에 없다).

## 6. 점검

```bash
# 저장소 루트에서 정적 서버 (아무거나)
python -m http.server 8765
# 다른 창에서 — 1463×800 · 1280×720 · 390×844 × 라이트 · 다크, 동작 줄이기, 장 넘김, PDF
node .claude/skills/web-motion/scripts/fx-audit.js --pdf            # 결과 표 + _fx-audit/ 에 그림 · json (✗ 있으면 종료 코드 1)
node .claude/skills/web-motion/scripts/fx-audit.js --quick          # 빠르게(1463 · 390 라이트만, PDF 없음)
```
- `errors` 스크립트 · 콘솔 오류 0 · `overflow` 가로 넘침 0 · `layout` 효과 끔과 위치 같음 · `text` 끝난 뒤 글자 같음 · `contrast` 첫 화면 글자 대비(효과 켬이 4.5 이상이거나 끔보다 안 나쁨) · `frames` 스크롤 중 25ms 넘는 프레임 비율(끔보다 8%p 넘게 나쁘면 △/✗ — 헤드리스는 GPU 없이 그려서 실제보다 무겁고 들쭉날쭉하다) · `endless` 끝없이 도는 CSS · 스크립트 애니메이션(iterations Infinity) 0(화면마다 · 장 넘김 — 2026-11-26) · `loops` 동작 줄이기에서 루프 0 · `deck` 장 넘김 켜짐 · `pdf` 장 수 같음.
- playwright 가 필요하다(`npm i -D playwright` 뒤 `npx playwright install chromium`). 작업 폴더의 다른 점검(`node tools/demo-wash.js --check` · `check-numbers.js` · `site-gate.js`)도 그대로 돌린다.
- 눈으로: 화면 기록(playwright `recordVideo`)으로 첫 화면 마우스 이동 · 테마 전환 · 스크롤을 찍어 본다. 실제 휴대폰 · 트랙패드 손맛은 `미검증` 으로 적는다.

## 7. 손잡이

| 바꾸고 싶은 것 | 어디 |
|---|---|
| 첫 화면 빛 색 · 세기 | `style.css` FX 블록 `--fx-a1~3` · `--fx-a-max` · `--fx-a-text`(세 곳: `:root` · 다크 미디어 · `[data-theme="dark"]`) |
| 그라데이션 글자 색 | `--fx-g1~3` (대비 4.5:1 넘는 색만) |
| 점 격자 | `--fx-dot` · `--fx-dot-hi`, 간격 `background-size: 22px` |
| 테두리 빛 대상 · 속도 | `fx.js BEAM` · `.fx-beam::after` `animation` 초 |
| 기울기 대상 · 각도 | `fx.js TILT` · `pointerFx()` 의 `max`(넓은 카드 3.2° · 작은 카드 5.5°) |
| 효과 하나만 끄기 | 페이지에서 fx.js 앞에 `window.FX_CONF = { cursor: false }` |
| 전부 끄기 | 주소 `?fx=0` · `localStorage.setItem('psj-fx', '0')` |
| 지금 상태 보기 | 콘솔 `FX.info()` — 켜진 효과 · 돌고 있는 루프 · 빛 해상도 단계 |

## 8. 다음 후보 (아직 안 넣음 — 넣을 때 위 순서대로)

- 다크 모드 차트 선 네온(선에만 `drop-shadow` — 막대 · 글자에는 금지)
- 「성과 추이」 차트 선이 그려지듯(`stroke-dashoffset`) — `drawPerf(true)` 등장과 겹치는지 먼저 확인
- 절 사이 스크롤 연결선(오른쪽 목차 레일과 겹치지 않게)
- `en.html` 에도 fx.js(첫 화면 구조가 달라 aurora 대상 · 테마 단추 연결을 따로)

## 하지 말 것

- 스크롤 가로채기(관성 스크롤 라이브러리) — 상단 바 접기 · 레일 · 장 넘김 휠 처리가 모두 기본 스크롤에 기대고 있다.
- 내용을 막는 로딩 화면 · 인트로 — 본인이 「첫 화면이 늦게 나온다」를 싫어한다(11-23).
- 기본 커서 숨기기 · 글자 위 시차(parallax) · 숫자 위를 지나가는 빛 띠(읽기 방해).
- 소리 자동 재생.
