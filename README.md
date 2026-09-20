# 박성준 · Growth Report 2026

그로스 마케터 박성준의 웹 이력서입니다. 외부 요청 없이 동작하는 정적 사이트(HTML · CSS · JS)입니다.

## 폴더 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 페이지 뼈대 |
| `en.html` | 영문 한 장 요약 — 외국계 지원용, 본판과 같은 스타일 토큰을 쓰고 내용은 직접 적는다 |
| `assets/data.js` | **모든 문구·수치** — 이력서를 고칠 때는 보통 이 파일만 바꿉니다 |
| `assets/series.js` | 성과 차트용 월별 시계열 (비율·지수·월 금액) |
| `assets/app.js` · `assets/style.css` · `assets/motion.js` | 화면 구성 · 디자인 · 모션 영상 |
| `dashboard-demo.html` | 퍼포먼스 대시보드 데모 (모든 숫자는 임의 값) |
| `archive/` | 참고 자료 이미지 |
| `videos/` | 직접 녹화한 영상을 넣는 곳 |
| `CLAUDE.md` | 편집 가이드 — 사람과 AI 모두 이 문서를 보고 이어서 고칠 수 있습니다 |

## 고치고 다시 올리기

1. `assets/data.js` 에서 문장을 찾아 고친 뒤, `index.html` 을 더블클릭해 브라우저에서 확인합니다.
2. GitHub 저장소 화면에서 **Add file → Upload files** 로 바뀐 파일을 끌어다 놓고 **Commit changes** 를 누릅니다.
3. 1~2분 뒤 사이트 주소에 반영됩니다. (반영이 안 보이면 Ctrl+F5 로 새로고침)

검색엔진에는 노출되지 않도록 `noindex` 가 설정되어 있습니다 — 링크를 받은 사람만 열어 볼 수 있습니다.
