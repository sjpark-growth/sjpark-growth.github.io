# 이 폴더의 스킬 출처 (2026-11-23)

Claude Code 가 이 저장소에서 저절로 읽는 프로젝트 스킬이다. 남이 만든 스킬은 **내용을 끝까지 읽고 검토한 판만** 넣었고, 손대지 않은 원본 그대로다(라이선스 파일 동봉).
스킬은 Claude 에게 주는 지시문이라 나중에 바뀐 판을 검토 없이 덮어쓰지 않는다 — 올릴 때는 아래 명령으로 받은 뒤 차이를 읽고 바꾼다.

| 폴더 | 출처 · 고정한 판 | 라이선스 | 하는 일 | 이 저장소에서 |
|---|---|---|---|---|
| `web-motion/` | 이 저장소(직접 작성) | — | 모션 · 시각 효과 규칙 · 점검(`scripts/fx-audit.js`) | 효과를 고칠 때 먼저 |
| `web-design-guidelines/` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) `5a37a63` · 규칙 [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) `434b7f9` (`references/command.md` SHA-256 `d246b026…0e234`) | MIT (README · LICENSE) | 접근성 · 포커스 · 애니메이션 · 글자 · 성능 규칙 100여 개로 파일을 `file:line` 형식으로 검사. 규칙은 동봉판만 읽고 네트워크로 받지 않는다 | 배포 전 검사. 영어 제목 규칙(Title Case) · 「…」 같은 글자 규칙은 한국어 본문에 맞지 않으면 건너뛴다 |
| `emil-design-eng/` | [emilkowalski/skills](https://github.com/emilkowalski/skills) `64eb3de` | MIT | 움직임 판단 틀(할까 말까 · 목적 · 곡선 · 길이), 누름 · 마우스 반응, clip-path, 동작 줄이기 | 모션을 다듬을 때. 「UI 애니메이션 300ms 이하」는 버튼 · 팝오버 기준 — 장 넘김(0.7s)은 서랍 · 모달처럼 예외 |
| `hiring-panel/` | [alexyc9381/hiring-panel-skill](https://github.com/alexyc9381/hiring-panel-skill) (2026-11-23 main) | MIT | `/hiring-panel <이력서 파일 또는 글> [공고]` — 심사 7명이 떨어뜨리려 읽고 고친 판을 만든다 | 결과는 `.hiring-panel/` 에 쓰인다 → **`.gitignore` 에 넣어 올라가지 않게 했다**(공개 저장소 · 개인 정보) |

## 일부러 이 저장소에 넣지 않은 것

- **Taste(`design-taste-frontend`, Leonxlnx/taste-skill 2.5.1)** — 새 회사 · 가게 사이트를 처음부터 짓는 도구다. 규칙이 이 포트폴리오와 정면으로 부딪힌다: 진짜 전화번호를 `.example` · 가짜 형식으로 바꾸게 하고, 기울기 · 스크롤 등장을 금지하고, 「한 화면에 절 하나」로 다시 짜게 하며, 매 턴 끝에 헤드리스 크롬 점검(Stop 훅, 최대 10분)을 돈다. 자산 묶음도 1,600여 파일 · 38MB. → 새 프로젝트용으로 **PC 전역 설치**(`tools/claude-setup/`)에만.
- **image-to-code** — 가이드(2026-08-25)에는 있지만 지금 taste-skill 저장소(`6c0b5c7`)에는 없다(설치 명령이 「No matching skills」로 실패).
- **agent-browser** — 스킬은 「CLI 를 먼저 깔라」는 안내 쪽지다(`hidden`, 「다른 브라우저 도구보다 이것을 우선」). 이 저장소의 점검은 Playwright 로 돈다 → CLI 와 함께 PC 전역 설치에만.
- **impeccable** — 묶음을 자기 사이트(impeccable.style)에서 받아 클라우드 세션에서는 막혔고, 저장소가 100MB 대다. 검사만 필요하면 `npx --yes impeccable@latest detect <폴더>` 를 그때그때.
- **find-skills · humanizer · 마케팅 스킬 묶음** — 이 저장소가 아니라 모든 작업에 쓰는 것이라 PC 전역 설치로.

## 다시 받기 · 올리기

```bash
# 받아서 비교만 (덮어쓰지 않음)
npx --yes skills@latest add vercel-labs/agent-skills --skill web-design-guidelines --agent claude-code --yes --copy   # 빈 임시 폴더에서
npx --yes skills@latest add emilkowalski/skills --skill emil-design-eng --agent claude-code --yes --copy
git clone --depth 1 https://github.com/alexyc9381/hiring-panel-skill   # skills/hiring-panel/SKILL.md
```
받은 판을 이 폴더와 `diff` 해 읽고, 새로 생긴 네트워크 요청 · 훅 · 스크립트 실행이 없는지 본 뒤 바꾼다. 이 표의 판 번호도 고친다.
