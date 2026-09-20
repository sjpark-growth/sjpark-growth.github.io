# 이 저장소를 다시 살리는 법

이 저장소 전체가 웹 이력서 <https://sjpark-growth.github.io> 의 전부입니다.
**빌드 과정이 없고 외부로 나가는 요청이 하나도 없는 정적 사이트**라, 파일만 있으면 어디서든 그대로 뜹니다.

## 1. 그냥 보기

내려받아 `index.html` 을 더블클릭하면 인터넷 없이 열립니다(데모 2개 포함).

## 2. 다른 계정 · 다른 주소로 다시 올리기

1. 새 GitHub 계정에서 저장소 `<계정>.github.io` 를 **Public** 으로 만듭니다.
2. 이 저장소의 파일을 전부 올립니다. `.nojekyll` 은 숨김 파일처럼 보이지만 **반드시 함께** 올립니다.
3. Settings → Pages 에서 Source 가 `main` / `/ (root)` 인지 확인합니다.
4. 1~2분 뒤 `https://<계정>.github.io` 에서 열립니다.

git 을 쓸 수 있으면:

```bash
git clone --mirror https://github.com/<기존계정>/<기존저장소>.git
cd <기존저장소>.git
git push --mirror https://github.com/<새계정>/<새계정>.github.io.git
```

## 3. GitHub 이 아니어도 됩니다

빌드도 외부 요청도 없어서 어떤 정적 호스팅에도 폴더째 올라갑니다.

- **Netlify Drop** — 폴더를 끌어다 놓으면 끝
- **Cloudflare Pages** — Direct Upload
- **일반 웹호스팅** — FTP 로 올리고 `index.html` 이 루트에 오게

## 4. 올린 뒤 확인할 것

- `index.html` 이 **루트**에 있다
- `.nojekyll` 이 있다
- `index.html` · `dashboard-demo.html` · `briefing-demo.html` 의 `<meta name="robots" content="noindex, nofollow">` 가 그대로다(일부러 넣은 검색 차단)
- 세 페이지가 모두 열리고, 이력서의 데모 버튼 2개와 데모끼리 오가는 버튼이 동작한다
- 콘솔(F12) 오류 없음 · 폭 390px 에서 가로 스크롤 없음 · 다크 모드에서 글자가 읽힌다
- 파일 이름 대소문자가 그대로다(서버는 구분합니다)

## 5. 데모 두 개에 대하여

`dashboard-demo.html`(퍼포먼스 대시보드) · `briefing-demo.html`(브리핑룸)은 실제 운영 대시보드의
**숫자를 임의 값으로 바꾼 사본**입니다. 실제 수치가 아닙니다.

- 글꼴까지 파일 안에 들어 있어 서버 없이 단독으로 열립니다.
- 서로를 상대 경로로 링크하므로 **같은 폴더에 같은 이름**으로 두어야 합니다.
- 실제 대시보드 원본으로 대체하지 마세요.

## 6. 고칠 때

문구와 수치는 `assets/data.js` 한 곳에 모여 있습니다. 편집 규칙 · 수치 원칙 · 같은 숫자가 나오는 곳 목록은
[`CLAUDE.md`](CLAUDE.md) 에 있습니다.
