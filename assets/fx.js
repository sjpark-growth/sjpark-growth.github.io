/* =========================================================================
   FX — 모션 · 시각 효과 도구 상자 (2026-11-23 본인 「웹디자인 스킬 · 툴 보강 — 모션 그래픽 · 삐까뻔쩍한 것들로 퀄리티를 확」)
   CLAUDE.md 5-8 · 작업 규칙 .claude/skills/web-motion/SKILL.md · 점검 .claude/skills/web-motion/scripts/fx-audit.js

   효과는 모두 「덧그림」이다 — 배치(크기 · 위치 · 줄바꿈)를 바꾸지 않고 transform · opacity · 캔버스 · 가상 요소만 쓴다.
   그래서 첫 화면 한 장 맞춤 · 장 넘김 장 나눔 · PDF 장 수(16 · 7)가 그대로다(fx-audit 가 ?fx=0 과 위치를 비교한다).

     aurora   첫 화면 뒤 흐르는 빛(WebGL — 「핵심 과업」 칸 둘레를 돌고 소개 글자 쪽은 옅게) + 마우스를 따라 켜지는 점 격자. 5초 안에 잦아들어 멈춘 한 장, 마우스가 깨운다
     tilt     카드가 마우스 쪽으로 살짝 기운다(성과 리포트 칸 · 주요 성과 카드 · 그로스 · 역량 · 원칙 · 점수)
     magnet   단추가 마우스 쪽으로 몇 px 끌려온다(상단 메뉴 · 도구 단추 · 표 단추)
     cursor   마우스를 느리게 따라오는 고리 — 누를 수 있는 것 위에서 커진다(마우스만)
     scramble 절 꼬리표(Performance · Projects …)의 영문 · 숫자가 화면에 들어올 때 한 번 해독되듯 맞춰진다(고정폭 글꼴이라 폭 그대로)
     beam     테두리를 따라 도는 빛(LIVE DEMO 칸 · 주요 성과 머리 카드 · 프로필 사진) — 화면에 들어올 때 두 바퀴(4.8초) 뒤 사라짐, 마우스를 올리면 다시
     grad     첫 화면 문장 강조(「광고 밖까지」)에 한 번 흐르는 그라데이션 글자(4.5초 · 문장에 마우스를 올리면 다시). 색은 사이트 강조색 계열만(보라 없음)
     theme    테마 단추를 누르면 단추 자리에서 원이 퍼지며 바뀐다(View Transitions — 없으면 바로 바뀜)

   끄는 법: 주소 ?fx=0 (이 탭만 — sessionStorage) · localStorage psj-fx=0 (이 브라우저) · 한 가지만 끄려면 FX_CONF 의 그 이름을 false.
   동작 줄이기 · 인쇄 · 다른 탭 · 화면 밖이면 루프를 멈춘다(aurora 는 동작 줄이기에서 멈춘 한 장만 그린다). 외부 요청 없음.
   이 파일은 app.js 앞에 읽는다(인쇄 직전 처리가 app.js 의 인쇄 줄바꿈보다 먼저 돌아야 해서) — 실제 시작은 DOMContentLoaded(그때는 app.js 가 다 그린 뒤).
   ========================================================================= */
(function () {
  'use strict';
  const root = document.documentElement;
  const CONF = Object.assign({ aurora: true, tilt: true, magnet: true, cursor: true, scramble: true, beam: true, grad: true, theme: true }, window.FX_CONF || {});

  /* ---------------------------------------------------------- 켜고 끄기 */
  let off = false;
  try {
    const m = /[?&]fx=([^&#]*)/.exec(location.search);
    if (m) { if (m[1] === '0') sessionStorage.setItem('psj-fx', '0'); else sessionStorage.removeItem('psj-fx'); }
    off = sessionStorage.getItem('psj-fx') === '0' || localStorage.getItem('psj-fx') === '0';
  } catch (e) { off = /[?&]fx=0(?:&|#|$)/.test(location.search); }

  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)');
  const loops = new Set();                 // 지금 돌고 있는 rAF 루프 이름(점검용 — FX.info().loops)
  const mods = [];                         // 켜진 효과 이름
  let printing = false;
  const holds = [];                        // 인쇄 · 장 넘김 전환 직전에 부르는 정리 함수
  const hold = () => holds.forEach(f => { try { f(); } catch (e) {} });

  const FX = window.FX = {
    on: !off,
    info: () => ({ on: !off, mods: mods.slice(), loops: loops.size, loopNames: [...loops], reduce: RM.matches, fine: FINE.matches, aurora: FX._aurora ? FX._aurora() : null }),
    // app.js 테마 단추가 부른다 — 켜져 있으면 단추 자리에서 원이 퍼지며 바뀐다
    themeSwap(apply, from) {
      if (off || !CONF.theme || !document.startViewTransition || RM.matches || printing) { apply(); return; }
      const r = from ? from.getBoundingClientRect() : { left: innerWidth / 2, top: 0, width: 0, height: 0 };
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const R = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)));
      root.classList.add('fx-vt');
      let t;
      try { t = document.startViewTransition(apply); } catch (e) { root.classList.remove('fx-vt'); apply(); return; }
      t.ready.then(() => root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
        { duration: 720, easing: 'cubic-bezier(.3,0,.12,1)', pseudoElement: '::view-transition-new(root)' }
      )).catch(() => {});
      t.finished.finally(() => root.classList.remove('fx-vt'));
    },
  };
  if (off) { root.classList.add('fx-off'); return; }
  root.classList.add('fx-on');

  /* 인쇄 직전 — app.js 의 인쇄 처리(줄바꿈 묶음 등)보다 먼저 돈다(이 파일이 먼저 읽혀 먼저 등록) */
  addEventListener('beforeprint', () => { printing = true; hold(); });
  addEventListener('afterprint', () => { printing = false; });
  // 「장으로 보기 / 스크롤로 보기」 — 절을 옮기기 전에 글자 효과를 끝낸다(장 넘김이 절 머리를 복사한다)
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#modeBtn')) hold(); }, true);

  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const tabmode = () => root.classList.contains('tabmode');
  const lerp = (a, b, k) => a + (b - a) * k;

  /* CSS 색(이름 · hex · rgb · color-mix 무엇이든) → [r, g, b] 0~1 */
  const probe = document.createElement('i');
  probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
  function rgb(v) {
    if (!probe.isConnected) document.body.appendChild(probe);
    probe.style.color = ''; probe.style.color = v;
    const m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(getComputedStyle(probe).color) || [0, 0, 0, 0];
    return [m[1] / 255, m[2] / 255, m[3] / 255];
  }
  const tok = n => getComputedStyle(root).getPropertyValue(n).trim();

  /* 테마가 바뀌면 알린다 (data-theme 바뀜 · 시스템 테마 바뀜) */
  const themeSubs = [];
  const onTheme = f => themeSubs.push(f);
  new MutationObserver(() => themeSubs.forEach(f => f())).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  const sysDark = matchMedia('(prefers-color-scheme: dark)');
  (sysDark.addEventListener ? sysDark.addEventListener('change', () => themeSubs.forEach(f => f())) : sysDark.addListener(() => themeSubs.forEach(f => f())));

  /* =========================================================== aurora */
  const VS = 'attribute vec2 a;varying vec2 v;void main(){v=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}';
  const FS = `precision mediump float;
varying vec2 v;
uniform vec2 R; uniform float T; uniform vec3 M; uniform vec4 F; uniform vec4 P[3];
uniform vec3 C1; uniform vec3 C2; uniform vec3 C3; uniform vec2 A;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int k=0;k<4;k++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
float inside(vec4 r,vec2 u){vec2 lo=smoothstep(r.xy-.045,r.xy+.03,u)*(1.-smoothstep(r.zw-.03,r.zw+.045,u));return lo.x*lo.y;}
void main(){
  float asp=R.x/R.y; vec2 p=vec2(v.x*asp,v.y); float t=T*.05;
  vec2 c=vec2(F.x*asp,F.y); vec2 e=vec2(F.z*asp,F.w);
  float s=max(.16,min(e.x,e.y)*.62);
  vec2 q=vec2(fbm(p*1.5+vec2(0.,t)),fbm(p*1.5+vec2(5.2,-t)));
  float f=fbm(p*1.15+1.9*q+vec2(t*.8,-t*.5));
  vec2 o1=c+e*vec2(1.05*cos(T*.13),1.08*sin(T*.11));
  vec2 o2=c+e*vec2(1.1*cos(T*.09+2.1),1.05*sin(T*.15+1.));
  vec2 o3=c+e*vec2(1.08*sin(T*.07+4.),1.1*cos(T*.12+3.));
  vec2 o4=c+e*vec2(.95*cos(T*.05+5.),-1.1*sin(T*.08+.5));
  float b1=exp(-dot(p-o1,p-o1)/(s*s)),b2=exp(-dot(p-o2,p-o2)/(s*s*.8)),b3=exp(-dot(p-o3,p-o3)/(s*s*.7)),b4=exp(-dot(p-o4,p-o4)/(s*s*.9));
  vec2 d=max(abs(p-c)-e,0.); float halo=exp(-dot(d,d)/(s*s*.35));
  float w=b1+b2+b3+b4*.8+1e-4;
  vec3 col=(C1*b1+C2*b2+C3*b3+C1*b4*.8)/w;
  col=mix(col,C3,smoothstep(.45,.9,f)*.35);
  float a=clamp(w*.85+halo*.45,0.,1.)*(.6+.55*smoothstep(.28,.82,f));
  vec2 mp=vec2(M.x*asp,M.y); float ml=exp(-dot(p-mp,p-mp)/.05)*M.z;
  col=mix(col,C2,ml*.45); a=max(a,ml*.65);
  float pr=max(inside(P[0],v),max(inside(P[1],v),inside(P[2],v)));
  a*=mix(1.,A.y,pr);
  a*=smoothstep(1.,.86,v.y)*smoothstep(0.,.05,v.y);
  a=clamp(a*A.x,0.,1.);
  gl_FragColor=vec4(col*a,a);
}`;
  // display: contents 로 풀린 틀(휴대폰 첫 화면 .hero-l)은 자식들을 합친 사각형
  function rectOf(n) {
    const r = n.getBoundingClientRect(); if (r.width && r.height) return r;
    let L = Infinity, T = Infinity, Rr = -Infinity, B = -Infinity;
    Array.from(n.children).forEach(c => { const q = c.getBoundingClientRect(); if (!q.width || !q.height) return; L = Math.min(L, q.left); T = Math.min(T, q.top); Rr = Math.max(Rr, q.right); B = Math.max(B, q.bottom); });
    return L < Infinity ? { left: L, top: T, right: Rr, bottom: B, width: Rr - L, height: B - T } : null;
  }
  function aurora(host) {
    const stage = document.createElement('div'); stage.className = 'fx-stage'; stage.setAttribute('aria-hidden', 'true');
    const cv = document.createElement('canvas'); cv.className = 'fx-aurora';
    const grid = document.createElement('i'); grid.className = 'fx-grid';
    stage.append(cv, grid); host.prepend(stage); host.classList.add('fx-host');
    const gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    let prog = null, U = {};
    const build = () => {
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) return false;
      prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
      gl.useProgram(prog);
      const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ['R', 'T', 'M', 'F', 'P', 'C1', 'C2', 'C3', 'A'].forEach(k => { U[k] = gl.getUniformLocation(prog, k === 'P' ? 'P[0]' : k); });
      return true;
    };
    if (!gl || !build()) { stage.classList.add('fx-nogl'); mods.push('aurora(css)'); return; }
    mods.push('aurora');

    const S = { w: 0, h: 0, focus: [.7, .5, .2, .35], prot: new Float32Array(12), mouse: [.5, .5, 0], mt: [.5, .5, 0], col: null, alpha: [.9, .4], t0: 0, intro: 0, vis: false, last: 0,
      tacc: 14, speed: 1, wake: 0, prev: 0, rest: false };
    // 쉬기(2026-11-23 — WCAG 2.2.2 「5초 넘게 저절로 움직이는 것은 멈출 수 있어야」 · 배터리): 마지막으로 깨운 뒤 REST_AFTER 가 지나면
    // 흐름이 2.5초 동안 느려져 멈춘 한 장이 되고 루프도 끈다. 첫 화면 위 마우스 움직임 · 테마 바꿈 · 탭 돌아옴 · 화면에 다시 들어옴이 깨운다
    const REST_AFTER = 2500;                           // 2.5초 + 잦아듦 2.5초 = 5초 안에 멈춤(web-design-guidelines 「5초 넘는 자동 움직임」)
    // 캔버스 해상도 = CSS 크기 × 0.5 (흐린 빛이라 충분 · GPU 부담 ¼). 그래픽 카드 없이 CPU 로 그리는 브라우저(SwiftShader · llvmpipe —
    // 드라이버가 막힌 회사 PC 등)는 처음부터 0.25 · 20fps. 그려 보고 프레임이 밀리면(1초 평균 28ms 넘음) 한 단계씩 더 낮춘다(0.5 → 0.35 → 0.25 → 멈춘 한 장)
    let soft = false;
    try { const x = gl.getExtension('WEBGL_debug_renderer_info'); soft = /swiftshader|llvmpipe|software|basic render/i.test(String(gl.getParameter(x ? x.UNMASKED_RENDERER_WEBGL : gl.RENDERER))); } catch (e) {}
    const LV = [[.5, FINE.matches ? 40 : 30], [.35, 30], [.25, 20]];
    let lv = soft ? 2 : 0, SCALE = LV[lv][0], FPS = LV[lv][1], still = false;
    const perf = { n: 0, sum: 0, prev: 0 };
    const slower = () => {
      if (lv >= LV.length - 1) { still = true; loops.delete('aurora'); return; }   // 가장 낮은 단계도 무거우면 멈춘 한 장으로
      lv++; SCALE = LV[lv][0]; FPS = LV[lv][1]; S.w = 0; place();
    };
    const colors = () => {
      S.col = [rgb(tok('--fx-a1')), rgb(tok('--fx-a2')), rgb(tok('--fx-a3'))];
      S.alpha = [parseFloat(tok('--fx-a-max')) || .9, parseFloat(tok('--fx-a-text')) || .4];
      if (RM.matches) draw(performance.now());
    };
    const place = () => {
      const hr = stage.getBoundingClientRect(); if (!hr.width || !hr.height) return;
      const w = Math.max(2, Math.round(cv.clientWidth * SCALE)), h = Math.max(2, Math.round(cv.clientHeight * SCALE));
      if (w !== S.w || h !== S.h) { S.w = cv.width = w; S.h = cv.height = h; gl.viewport(0, 0, w, h); }
      const uv = (r) => [(r.left - hr.left) / hr.width, (r.top - hr.top) / hr.height, (r.right - hr.left) / hr.width, (r.bottom - hr.top) / hr.height];
      // 빛은 「핵심 과업」 칸 둘레를 돈다(칸이 가운데를 가리므로 테두리 · 칸 사이로 새어 나온다)
      const fb = host.querySelector('#mboard') || host.querySelector('.hero-r');
      if (fb) { const u = uv(fb.getBoundingClientRect()); S.focus = [(u[0] + u[2]) / 2, (u[1] + u[3]) / 2, Math.max(.04, (u[2] - u[0]) / 2), Math.max(.06, (u[3] - u[1]) / 2)]; }
      // 바탕 위에 바로 놓인 글자(소개 · 「핵심 성과」 · 「핵심 과업」 머리)는 빛을 옅게 — 글자 대비(4.5:1)를 지킨다. 카드 안 글자는 카드 바탕 위라 상관없음
      S.prot.fill(0);
      [host.querySelector('.hero-l'), host.querySelector('.hkey-h'), host.querySelector('.mb-h')].forEach((n, i) => { const r = n && rectOf(n); if (r) S.prot.set(uv(r), i * 4); });
      const g = (fb || host).getBoundingClientRect();
      stage.style.setProperty('--fx-fx', ((g.left + g.width / 2 - hr.left) / hr.width * 100).toFixed(1) + '%');
      stage.style.setProperty('--fx-fy', ((g.top + g.height / 2 - hr.top) / hr.height * 100).toFixed(1) + '%');
      if (RM.matches || !S.vis || S.rest) draw(performance.now());   // 캔버스 크기를 바꾸면 지워지므로 쉬는 중에도 한 장 다시
    };
    function draw(now) {
      if (!S.col || gl.isContextLost()) return;
      const dt = S.prev ? Math.min(.1, (now - S.prev) / 1000) : 0; S.prev = now;
      S.speed = RM.matches ? 0 : now - S.wake > REST_AFTER ? Math.max(0, S.speed - dt / 2.5) : Math.min(1, S.speed + dt / .8);
      S.tacc += dt * S.speed * S.speed;                  // 속도를 제곱으로 — 멈출 때 부드럽게 잦아든다
      const T = S.tacc;
      S.intro = RM.matches ? 1 : Math.min(1, S.intro + .025);
      for (let i = 0; i < 3; i++) S.mouse[i] = lerp(S.mouse[i], S.mt[i], .08);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.R, S.w, S.h); gl.uniform1f(U.T, T);
      gl.uniform3f(U.M, S.mouse[0], S.mouse[1], S.mouse[2]);
      gl.uniform4f(U.F, S.focus[0], S.focus[1], S.focus[2], S.focus[3]);
      gl.uniform4fv(U.P, S.prot);
      gl.uniform3fv(U.C1, S.col[0]); gl.uniform3fv(U.C2, S.col[1]); gl.uniform3fv(U.C3, S.col[2]);
      const ease = 1 - Math.pow(1 - S.intro, 3);
      gl.uniform2f(U.A, S.alpha[0] * ease, S.alpha[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    let raf = 0;
    const want = () => S.vis && !document.hidden && !RM.matches && !printing && !still;
    const frame = now => {
      raf = 0;
      if (!want()) { loops.delete('aurora'); perf.prev = 0; return; }
      if (perf.prev && now - S.t0 > 2500) { const g = now - perf.prev; if (g < 250) { perf.sum += g; perf.n++; } }   // 첫 2.5초(페이지 그리기 · 차트 등장)는 재지 않는다
      perf.prev = now;
      if (perf.n >= 45) { const avg = perf.sum / perf.n; perf.n = perf.sum = 0; if (avg > 28) slower(); }
      if (now - S.last >= 1000 / FPS - 2) { S.last = now; draw(now); }
      if (S.speed <= 0 && S.mouse[2] < .01 && S.intro >= 1) { S.rest = true; S.prev = 0; loops.delete('aurora'); return; }   // 멈춘 한 장 — 루프 끔
      if (!still) raf = requestAnimationFrame(frame);
    };
    const run = () => { if (want() && !raf && !S.rest) { loops.add('aurora'); raf = requestAnimationFrame(frame); } };
    const wake = () => { S.wake = performance.now(); if (S.rest) { S.rest = false; S.prev = 0; } run(); };
    S.t0 = S.wake = performance.now();
    FX._aurora = () => ({ soft, level: lv, scale: SCALE, fps: FPS, still, rest: S.rest, speed: +S.speed.toFixed(2), size: [S.w, S.h] });
    colors(); place();
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { S.vis = es[es.length - 1].isIntersecting; if (S.vis) { place(); wake(); } }, { rootMargin: '80px 0px' }).observe(host);
    else { S.vis = true; run(); }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
    afterPrint(run);
    if ('ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(place)).observe(host);
    addEventListener('resize', () => requestAnimationFrame(place));
    document.addEventListener('tm:mode', () => setTimeout(place, 60));
    onTheme(() => requestAnimationFrame(() => { colors(); if (S.rest) draw(performance.now()); wake(); }));
    RM.addEventListener && RM.addEventListener('change', () => { colors(); place(); wake(); });
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); stage.classList.add('fx-nogl'); });
    cv.addEventListener('webglcontextrestored', () => { stage.classList.remove('fx-nogl'); if (build()) { colors(); place(); wake(); } });
    // 마우스 — 빛이 따라오고 점 격자가 켜진다(마우스만)
    if (FINE.matches) {
      let gr = 0, gx = 0, gy = 0;
      host.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = stage.getBoundingClientRect();
        S.mt = [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, 1];
        if (performance.now() - S.wake > 400) wake();
        gx = e.clientX - r.left; gy = e.clientY - r.top;
        if (!gr) gr = requestAnimationFrame(() => { gr = 0; stage.style.setProperty('--fx-gx', gx.toFixed(0) + 'px'); stage.style.setProperty('--fx-gy', gy.toFixed(0) + 'px'); stage.classList.add('fx-lit'); });
      }, { passive: true });
      host.addEventListener('pointerleave', () => { S.mt[2] = 0; stage.classList.remove('fx-lit'); if (!S.rest) run(); });
    }
    // 스크롤 — 첫 화면이 올라가는 동안 빛은 조금 느리게(시차)
    let sr = 0;
    addEventListener('scroll', () => {
      if (sr || tabmode() || RM.matches) return;
      sr = requestAnimationFrame(() => { sr = 0; const y = Math.max(0, Math.min(scrollY, stage.offsetHeight)); cv.style.transform = y ? `translate3d(0, ${(y * .32).toFixed(1)}px, 0)` : ''; });
    }, { passive: true });
  }

  /* =========================================================== tilt · magnet — 마우스 쪽으로 기울기 · 끌려오기 */
  const TILT = '.mboard > .mp, a.rs-card, .gcard, .pillar, .belief, .score';
  const MAG = '.mast nav a, .mast .iconbtn, .tbtn, .btn, .mb-more, .seg button';
  function pointerFx() {
    const items = new Map();    // 요소 → { kind, x, y, tx, ty }
    let raf = 0, px = 0, py = 0, curT = null, curM = null;
    const persp = new Set();
    if (CONF.tilt) { $$(TILT).forEach(n => n.parentElement && persp.add(n.parentElement)); persp.forEach(p => p.classList.add('fx-persp')); mods.push('tilt'); }
    if (CONF.magnet) mods.push('magnet');
    const get = (n, kind) => { let s = items.get(n); if (!s) { s = { kind, x: 0, y: 0, tx: 0, ty: 0 }; items.set(n, s); } return s; };
    const aim = () => {
      if (curT) {
        const r = curT.getBoundingClientRect(), s = get(curT, 't');
        const nx = Math.max(-.5, Math.min(.5, (px - r.left) / r.width - .5)), ny = Math.max(-.5, Math.min(.5, (py - r.top) / r.height - .5));
        const max = r.width > 440 ? 3.2 : 5.5;
        s.tx = nx * 2 * max; s.ty = ny * 2 * max;
      }
      if (curM) {
        const r = curM.getBoundingClientRect(), s = get(curM, 'm');
        const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
        s.tx = Math.max(-6, Math.min(6, dx * .22)); s.ty = Math.max(-4, Math.min(4, dy * .3));
      }
    };
    const paint = () => {
      raf = 0; aim();
      let busy = false;
      items.forEach((s, n) => {
        s.x = lerp(s.x, s.tx, .16); s.y = lerp(s.y, s.ty, .16);
        const idle = Math.abs(s.x) < .02 && Math.abs(s.y) < .02 && !s.tx && !s.ty;
        if (idle) { n.style.removeProperty(s.kind === 't' ? 'rotate' : 'translate'); n.classList.remove('fx-tilting'); items.delete(n); return; }
        busy = true;
        if (s.kind === 't') {
          const ang = Math.hypot(s.x, s.y);
          n.style.rotate = ang < .01 ? '' : `${(-s.y / ang).toFixed(3)} ${(s.x / ang).toFixed(3)} 0 ${ang.toFixed(2)}deg`;
          n.classList.add('fx-tilting');
        } else n.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`;
      });
      if (busy) { raf = requestAnimationFrame(paint); loops.add('pointer'); } else loops.delete('pointer');
    };
    const kick = () => { if (!raf) { raf = requestAnimationFrame(paint); loops.add('pointer'); } };
    const release = n => { const s = n && items.get(n); if (s) { s.tx = 0; s.ty = 0; } };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || printing) return;
      px = e.clientX; py = e.clientY;
      const t = e.target.closest ? e.target : null;
      const dragging = document.querySelector('main.tm-dragging');
      const nt = CONF.tilt && t && !dragging ? t.closest(TILT) : null;
      const nm = CONF.magnet && t && !dragging ? t.closest(MAG) : null;
      if (nt !== curT) { release(curT); curT = nt; }
      if (nm !== curM) { release(curM); curM = nm; }
      if (curT || curM || items.size) kick();
    }, { passive: true });
    const leave = () => { release(curT); release(curM); curT = curM = null; kick(); };
    document.addEventListener('pointerleave', leave);
    addEventListener('blur', leave);
    addEventListener('scroll', () => { if (curT) kick(); }, { passive: true });
    holds.push(() => { items.forEach((s, n) => { n.style.removeProperty('rotate'); n.style.removeProperty('translate'); n.classList.remove('fx-tilting'); }); items.clear(); curT = curM = null; });
  }

  /* =========================================================== cursor — 따라오는 고리 */
  function cursor() {
    const ring = document.createElement('div'); ring.className = 'fx-cursor'; ring.setAttribute('aria-hidden', 'true');
    document.body.appendChild(ring); mods.push('cursor');
    const HOT = 'a[href], button:not(:disabled), [role="button"], summary, label[for], .mp-shot, .tm-tab, .rail a';
    const QUIET = 'input, textarea, select, iframe, [contenteditable="true"], .tk-viewport';
    const CHART = '.chartbox, .mp-chart, .gantt, .player';
    let x = -99, y = -99, rx = -99, ry = -99, raf = 0, shown = false, mode = '';
    const step = () => {
      raf = 0;
      rx = lerp(rx, x, .2); ry = lerp(ry, y, .2);
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      if (Math.abs(rx - x) + Math.abs(ry - y) > .3) { raf = requestAnimationFrame(step); loops.add('cursor'); } else loops.delete('cursor');
    };
    const setMode = m => { if (m !== mode) { if (mode) ring.classList.remove('is-' + mode); mode = m; if (m) ring.classList.add('is-' + m); } };
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || printing) { ring.classList.remove('on'); shown = false; return; }
      x = e.clientX; y = e.clientY;
      if (!shown) { rx = x; ry = y; shown = true; ring.classList.add('on'); }
      const t = e.target.closest ? e.target : null;
      setMode(!t ? '' : t.closest(QUIET) ? 'quiet' : t.closest(HOT) ? 'hot' : t.closest(CHART) ? 'chart' : '');
      if (!raf) { raf = requestAnimationFrame(step); loops.add('cursor'); }
    }, { passive: true });
    addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') ring.classList.add('down'); }, { passive: true });
    addEventListener('pointerup', () => ring.classList.remove('down'), { passive: true });
    document.addEventListener('mouseout', e => { if (!e.relatedTarget) { ring.classList.remove('on'); shown = false; } });
    addEventListener('blur', () => { ring.classList.remove('on'); shown = false; });
  }

  /* =========================================================== scramble — 꼬리표 해독 */
  const SCR = '.sec-h .tag, .growth-h .tag';
  const GLYPH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>';
  function scramble() {
    const live = new Set();
    mods.push('scramble');
    const done = job => { if (!live.has(job)) return; live.delete(job); cancelAnimationFrame(job.raf); job.nodes.forEach((t, i) => { if (t.data !== job.src[i]) t.data = job.src[i]; }); if (!live.size) loops.delete('scramble'); };
    holds.push(() => live.forEach(done));
    const run = el => {
      if (tabmode() || printing || RM.matches) return;
      const nodes = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) if (/[A-Za-z0-9]/.test(w.currentNode.data)) nodes.push(w.currentNode);
      if (!nodes.length) return;
      const job = { nodes, src: nodes.map(t => t.data), raf: 0, t0: performance.now() };
      const total = job.src.reduce((a, s) => a + s.length, 0), DUR = Math.min(900, 380 + total * 14);
      live.add(job); loops.add('scramble');
      const tick = now => {
        const k = (now - job.t0) / DUR;
        if (k >= 1) { done(job); return; }
        let at = 0;
        job.nodes.forEach((t, i) => {
          const s = job.src[i]; let out = '';
          for (let j = 0; j < s.length; j++, at++) {
            const c = s[j];
            out += (/[A-Za-z0-9]/.test(c) && at / total > k * 1.15 - .1) ? GLYPH[(Math.random() * GLYPH.length) | 0] : c;
          }
          if (t.data !== out) t.data = out;
        });
        job.raf = requestAnimationFrame(tick);
      };
      job.raf = requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); setTimeout(() => run(e.target), 120); } }), { threshold: .9 });
    const vh = innerHeight;
    $$(SCR).forEach(n => { const r = n.getBoundingClientRect(); if (r.top >= vh - 4 || r.bottom <= 0) io.observe(n); });
  }

  /* =========================================================== beam · grad — CSS 가 그리고, 여기서는 표시 · 움직임 예산만 */
  const BEAM = '.mp-dash, .rs-lead, .hero .portrait';
  const LOOP_CSS = [];
  function beam() {
    $$(BEAM).forEach(n => { n.classList.add('fx-beam', 'fx-idle'); LOOP_CSS.push(n); });   // 화면에 처음 들어올 때 돈다(그 전엔 멈춤)
    if (LOOP_CSS.length) mods.push('beam');
  }
  function grad() {
    $$('.thesis em').forEach(em => {
      if (em.querySelector('.fx-grad')) return;
      const s = document.createElement('span'); s.className = 'fx-grad fx-idle';
      while (em.firstChild) s.appendChild(em.firstChild);
      em.appendChild(s); LOOP_CSS.push(s);
    });
    mods.push('grad');
  }
  // 끝없이 도는 CSS 효과 — 화면 밖이면 멈춘다(.fx-idle — 효과 층(::after · 글자 바탕)만 멈춘다. app.js 의 .anim-idle 을 쓰면
  // 카드 자신의 등장 애니메이션(boardin · rise)까지 멈춰 화면 밖 카드가 투명한 채 굳었다 — 휴대폰 LIVE DEMO 칸). 다른 탭 .anim-hold 는 CSS
  function budget() {
    if (!('IntersectionObserver' in window) || !LOOP_CSS.length) return;
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('fx-idle', !e.isIntersecting)), { rootMargin: '150px 0px' });
    LOOP_CSS.forEach(n => io.observe(n));
  }

  const afterPrintSubs = [];
  function afterPrint(f) { afterPrintSubs.push(f); }
  addEventListener('afterprint', () => afterPrintSubs.forEach(f => f()));

  /* =========================================================== 시작 */
  function start() {
    const hero = document.querySelector('.hero');
    try { if (CONF.grad) grad(); } catch (e) { console.warn('fx grad', e); }
    try { if (CONF.beam) beam(); } catch (e) { console.warn('fx beam', e); }
    budget();
    try { if (CONF.aurora && hero) aurora(hero); } catch (e) { console.warn('fx aurora', e); }
    if (RM.matches) { mods.push('reduced'); return; }       // 움직임 효과는 여기까지 — 동작 줄이기면 멈춘 빛 · 정적 그라데이션만
    try { if (FINE.matches && (CONF.tilt || CONF.magnet)) pointerFx(); } catch (e) { console.warn('fx pointer', e); }
    try { if (FINE.matches && CONF.cursor) cursor(); } catch (e) { console.warn('fx cursor', e); }
    try { if (CONF.scramble) scramble(); } catch (e) { console.warn('fx scramble', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
