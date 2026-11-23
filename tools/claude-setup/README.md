# Claude 디자인 · 작업 도구 설치 (2026-11-23)

본인 요청 「어썸디자인도 설치해줘 — lazyowen.com 「클로드한테 디자인 시키기 전에 깔아야 하는 5개」 참고해 자동 설치, 가이드 목록에서 나한테 필요한 것들 클로드에 보강」.
가이드 93편 가운데 이 일(그로스 마케터 · 포트폴리오 사이트 · 이력서 · 한국어 글)에 맞는 것만 골랐다. **남이 만든 스킬은 Claude 에게 주는 지시문이라 끝까지 읽고 검토한 것만** 넣었다.

## 어디에 무엇이 깔리나

| 무엇 | 이 저장소(`.claude/skills`, 커밋됨 — 클라우드 세션 · PC 둘 다) | PC 전역(`install-global.ps1` → `%USERPROFILE%\.claude\skills`) |
|---|---|---|
| **Awesome DESIGN.md**(기준 파일) | 루트 `DESIGN.md` — 이 사이트의 실제 색 · 글꼴 · 간격을 같은 형식으로 정리 | 새 프로젝트에서 아래 「참고 DESIGN.md 받기」 |
| **Taste**(`design-taste-frontend`) | ✗ — 이 포트폴리오와 규칙이 부딪힘(아래) | ✓ 새 랜딩 · 회사 사이트용 |
| **Image to Code** | ✗ | ✗ — 지금 taste-skill 저장소에서 빠짐(설치 명령이 실패) |
| **agent-browser** | ✗ — 이 저장소 점검은 Playwright | ✓ 스킬 + 명령줄 도구 + 자동화용 크롬 |
| **web-design-guidelines**(Vercel) | ✓ 규칙 동봉판(SHA 고정 · 인터넷에서 안 받음) | ✓ |
| **emil-design-eng**(움직임 다듬기) | ✓ | ✓ |
| **hiring-panel**(이력서 심사단) | ✓ — 결과 폴더 `.hiring-panel/` 은 gitignore | ✓ |
| **humanizer**(AI 티 문장) | — | ✓ |
| **find-skills**(스킬 찾기) | — | ✓ |
| **web-motion**(이 사이트 모션 규칙 · `fx-audit.js`) | ✓ 직접 작성 | — |
| 마케팅 스킬 53개(coreyhaines31/marketingskills) | — | `-Marketing` 붙일 때만(대화마다 목록 비용이 늘어 기본은 끔 · 세부 내용은 미검토) |

출처 · 판 번호 · 라이선스: `.claude/skills/THIRD_PARTY.md`.

### Taste 를 이 저장소에 넣지 않은 이유
Taste 2.5.1 은 「회사 · 가게 사이트를 처음부터 짓는」 도구라 이 포트폴리오에 쓰면 CLAUDE.md 와 정면으로 부딪힌다 —
진짜 전화번호 · 메일을 가짜 형식으로 바꾸게 하고(규칙 9), 카드 기울기 · 스크롤 등장을 금지하고, 「한 화면에 절 하나」로 다시 짜게 하며,
매 턴 끝에 헤드리스 크롬 점검(Stop 훅 · 최대 10분)이 돈다. PC 전역에 깔아도 **이 저장소에서는 「Taste 쓰지 말고 CLAUDE.md · DESIGN.md 기준」** 이 이긴다(CLAUDE.md 5-8).
대신 Taste 의 좋은 기준(보라 그라데이션 금지 · 끝없는 장식 금지)은 이 사이트 효과에 반영했다(`DESIGN.md` · `assets/fx.js`).

## PC 에 설치 (Windows)

```powershell
cd <이 저장소 폴더>
git pull
powershell -ExecutionPolicy Bypass -File tools\claude-setup\install-global.ps1 -DryRun   # 실행할 명령만 보기
powershell -ExecutionPolicy Bypass -File tools\claude-setup\install-global.ps1           # 설치
powershell -ExecutionPolicy Bypass -File tools\claude-setup\install-global.ps1 -Marketing # + 마케팅 스킬
```
필요한 것: Node.js 22.20 이상(`node --version`), Claude Code(`claude --version`). 이미 있는 스킬은 건너뛰고(덮어쓰지 않음) 한 개씩 설치 · 확인한다.
끝나면 Claude Code 를 완전히 껐다 켠다. 되돌리기: `%USERPROFILE%\.claude\skills\<이름>` 폴더 삭제 · `npm uninstall -g agent-browser`.
※ 이 스크립트는 클라우드(리눅스)에서 만들어 **Windows 에서 실제로 돌려 보지 못했다** — 스킬마다 설치 명령은 이 세션에서 성공을 확인했다(전역 `-g` 는 find-skills · humanizer · hiring-panel 세 개로 확인). 실패하면 화면의 명령을 그대로 한 줄씩 실행하면 된다.

## 참고 DESIGN.md 받기 (Awesome DESIGN.md — 새 프로젝트용)

74개 사이트의 색 · 글꼴 · 간격 · 단추 규칙(MIT, github.com/VoltAgent/awesome-design-md). 새 폴더에서:
```powershell
curl.exe -o DESIGN.md https://raw.githubusercontent.com/VoltAgent/awesome-design-md/main/design-md/linear.app/DESIGN.md
```
`linear.app` 자리: 어둡고 절제된 제품 `linear.app` · 따뜻한 크림색 `claude` · 흑백 개발자 `vercel` · 여백 넓은 프리미엄 `apple` · 초록 강조 다크 `supabase` (전체 목록은 저장소 `design-md/` 폴더).
**이 저장소에서는 `DESIGN.md` 를 덮어쓰지 말고** `-o DESIGN.local.md` 로 받아 비교만(gitignore 됨).

## 쓰는 순서 (이 사이트)

1. **기준** — `DESIGN.md`(색 · 글꼴 · 간격) + `CLAUDE.md`(숫자 · 인쇄 · 장 넘김 규칙)
2. **모션** — `web-motion` 스킬(효과 넣는 순서 · 지킬 것) + `emil-design-eng`(곡선 · 길이 · 누름 반응)
3. **눈으로 확인** — `node .claude/skills/web-motion/scripts/fx-audit.js --pdf` (PC 에서는 agent-browser 로 화면을 열어 보게 해도 됨)
4. **배포 전 검사** — `web-design-guidelines` 로 `index.html assets/fx.js assets/style.css` 검사 → 고치고 다시 검사
5. **이력서** — `/hiring-panel files/sjpark_resume.pdf 그로스 마케터` (결과는 `.hiring-panel/` — 올라가지 않음)

### 복사해 쓰는 요청
```
DESIGN.md 와 CLAUDE.md 를 먼저 읽고, web-motion 스킬 순서대로 <바꿀 부분> 에 움직임을 더해 줘.
emil-design-eng 기준으로 곡선 · 길이를 정하고, 끝나면 fx-audit --pdf 와 web-design-guidelines 검사까지 돌려서 남은 지적을 고쳐 줘.
```
```
web-design-guidelines 스킬로 index.html, assets/fx.js, assets/style.css 의 FX 블록을 검사해 줘.
영어 전용 규칙(Title Case · 곧은 따옴표)은 한국어 본문이라 건너뛰고, 나머지는 file:line 으로.
```
```
/hiring-panel files/sjpark_resume.pdf 그로스 마케터 (퍼포먼스 · MD) — 공고: <붙여넣기>
```

## 가이드 목록에서 고르지 않은 것 (참고)

- 자동매매 봇 · 힉스필드 · 뉴테이크 · 영상 AI(유료 · 다른 일), 9Router · OmniRoute · 무료 LLM(한도 우회 — 계정 정책 확인 필요), 오라클 무료 서버.
- ECC · claude-mem · superpowers · Ruflo 같은 큰 묶음 — 대화마다 고정 비용이 늘고 이 작업(정적 사이트 · 이력서)에는 과함. 필요해지면 `find-skills` 로 하나씩.
- MCP 5개(Playwright · Chrome DevTools · Firecrawl · Perplexity · Glif) — 화면 확인은 agent-browser 와 겹치고, 나머지는 키 · 요금이 필요. 필요할 때 `claude mcp add` 로.
- impeccable — 디자인 반패턴 검사기. 설치 없이 필요할 때만: `npx --yes impeccable@latest detect <폴더>` (새 프로젝트에 깔려면 `npx --yes impeccable@latest install --providers=claude --scope=project`).
