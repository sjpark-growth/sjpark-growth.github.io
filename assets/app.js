/* =========================================================================
   화면 렌더링 · 차트 · 인터랙션
   콘텐츠는 data.js, 시계열은 series.js, 모션 영상은 motion.js
   ========================================================================= */
(function () {
  'use strict';
  const R = window.RESUME, S = window.SERIES;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const mLabel = m => `${m.slice(2, 4)}.${+m.slice(5)}`;
  const nf = (v, d = 0) => v == null ? '–' : v.toLocaleString('ko-KR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const tenureIdx = S.months.indexOf(S.tenureStart);
  const lastIdx = S.months.length - 1;
  const N = S.months.length;

  const ICON = {
    mail: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="3" width="13" height="10" rx="1.5"/><path d="m2 4 6 5 6-5"/></svg>',
    phone: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 1.8h2.2l1.1 3-1.5 1a8 8 0 0 0 4.9 4.9l1-1.5 3 1.1v2.2a1.5 1.5 0 0 1-1.6 1.5A12.5 12.5 0 0 1 2 3.4a1.5 1.5 0 0 1 1.5-1.6z"/></svg>',
    pin: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 14.5s5-4.6 5-8.5a5 5 0 0 0-10 0c0 3.9 5 8.5 5 8.5z"/><circle cx="8" cy="6" r="1.8"/></svg>',
    copy: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="9" height="9" rx="1.5"/><path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5"/></svg>',
    play: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>',
    pause: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>',
    grid: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>',
    expand: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9"/></svg>',
    ext: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 2.5h4.5V7"/><path d="M13.5 2.5 7 9"/><path d="M11.5 9.5v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3"/></svg>',
  };

  /* ------------------------------------------------------------ helpers */
  function el(tag, attrs, html) {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v != null) e.setAttribute(k, v); }
    if (html != null) e.innerHTML = html;
    return e;
  }
  function s(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, str, cls, anchor, style) {
    const t = s('text', { x, y, class: cls, 'text-anchor': anchor || 'start', style }, parent);
    t.textContent = str;
    return t;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => 1 - Math.pow(1 - t, 3);
  function niceTicks(min, max, count) {
    const span = max - min; const step0 = span / count; const mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const norm = step0 / mag; const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step; const out = [];
    for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(6));
    return out;
  }
  function onFirstView(node, fn, threshold = 0.25) {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.disconnect(); fn(); } }, { threshold });
    io.observe(node);
  }
  const pathD = pts => { let d = '', on = false; pts.forEach(p => { if (!p) { on = false; return; } d += (on ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); on = true; }); return d; };

  const roMap = new Map();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(es => {
    for (const e of es) { const f = roMap.get(e.target); if (!f) continue; const w = Math.round(e.contentRect.width); if (f.w !== w) { f.w = w; clearTimeout(f.t); f.t = setTimeout(f.fn, 60); } }
  }) : null;
  function observeWidth(node, fn) { if (!ro) return; roMap.set(node, { fn, w: Math.round(node.clientWidth), t: 0 }); ro.observe(node); }

  /* 개선 구간 강조선 — 입사 이후 구간이 오른쪽으로 갈수록 밝아지고(다크: 흰색) 굵어진다 */
  let gradSeq = 0;
  function progLine(parent, pts, from, color, w0, w1) {
    const idx = []; for (let i = from; i < pts.length; i++) if (pts[i]) idx.push(i);
    if (idx.length < 2) return null;
    const id = 'pg' + (++gradSeq);
    const lg = s('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: pts[idx[0]][0], x2: pts[idx[idx.length - 1]][0], y1: 0, y2: 0 }, s('defs', {}, parent));
    s('stop', { offset: 0, style: `stop-color:${color}` }, lg);
    s('stop', { offset: 0.55, style: `stop-color:${color}` }, lg);
    s('stop', { offset: 1, style: 'stop-color:var(--hi-end)' }, lg);
    const g = s('g', {}, parent);
    for (let k = 0; k < idx.length - 1; k++) {
      const a = pts[idx[k]], b = pts[idx[k + 1]], f = k / Math.max(1, idx.length - 2);
      s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'seg', 'data-k': k, style: `stroke:url(#${id});stroke-width:${(w0 + (w1 - w0) * f).toFixed(2)};stroke-linecap:round` }, g);
    }
    const last = pts[idx[idx.length - 1]];
    s('circle', { cx: last[0], cy: last[1], r: 5, class: 'pulse', style: 'fill:none;stroke:var(--hi-end);stroke-width:2' }, g);
    s('circle', { cx: last[0], cy: last[1], r: 5, class: 'enddot', style: 'fill:var(--hi-end);stroke:var(--surface);stroke-width:2' }, g);
    return g;
  }
  function animateSegs(svg, base) {
    $$('line.seg', svg).forEach(l => {
      const len = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value) + 1;
      l.animate?.([{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: '0' }], { duration: 130, delay: base + (+l.dataset.k) * 85, easing: 'linear', fill: 'backwards' });
    });
    $$('circle.enddot, circle.pulse', svg).forEach(c => {
      const k = $$('line.seg', svg).length;
      c.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: base + k * 85, fill: 'backwards' });
    });
  }
  function growBars(svg, sel, base, step, originBottom = true) {
    $$(sel, svg).forEach((r, n) => {
      r.style.transformBox = 'fill-box'; r.style.transformOrigin = originBottom ? '50% 100%' : '0% 50%';
      r.animate?.([{ transform: originBottom ? 'scaleY(0)' : 'scaleX(0)' }, { transform: 'none' }], { duration: 560, delay: base + (+(r.dataset.k ?? n)) * step, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    });
  }

  /* ------------------------------------------------------------ tooltip */
  const tip = $('#tip');
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.classList.add('on');
    const r = tip.getBoundingClientRect(); const pad = 14;
    let left = x + pad, top = y + pad;
    if (left + r.width > innerWidth - 8) left = x - r.width - pad;
    if (top + r.height > innerHeight - 8) top = y - r.height - pad;
    tip.style.left = Math.max(8, left) + 'px'; tip.style.top = Math.max(8, top) + 'px';
  }
  const hideTip = () => tip.classList.remove('on');

  /* 숫자 굴리기: 시작값 → 목표값. 형식(부호·쉼표·소수점)은 목표 문자열을 따른다 */
  function rollNumbers(scope) {
    $$('[data-roll-to]', scope).forEach(node => {
      if (node.dataset.rolled) return; node.dataset.rolled = '1';
      const toStr = node.dataset.rollTo.trim();
      const neg = /^[−-]/.test(toStr);
      const to = parseFloat(toStr.replace(/[^0-9.]/g, ''));
      const from = parseFloat((node.dataset.rollFrom || '').replace(/[^0-9.]/g, ''));
      if (reduceMotion || !isFinite(to) || !isFinite(from) || from === to) return;
      const dec = (toStr.split('.')[1] || '').replace(/[^0-9]/g, '').length;
      const sign = toStr.startsWith('+'), comma = toStr.includes(',');
      const tail = node.querySelector('small'); const tailHTML = tail ? tail.outerHTML : '';
      const fmt = v => (sign ? '+' : neg ? '−' : '') + (comma ? v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : v.toFixed(dec));
      const dur = 1200, t0 = performance.now();
      const tick = now => {
        const p = clamp((now - t0) / dur, 0, 1);
        node.innerHTML = fmt(from + (to - from) * ease(p)) + tailHTML;
        if (p < 1) requestAnimationFrame(tick); else { node.innerHTML = toStr + tailHTML; node.classList.add('pop'); setTimeout(() => node.classList.remove('pop'), 900); }
      };
      requestAnimationFrame(tick);
    });
  }

  /* ------------------------------------------------------------ 갈래(포지션)별 첫 화면
     ?for=performance | md | growth | leader — 첫 화면 세 줄과 요약 네 줄의 차례만 바꾼다.
     값이 없거나 모르는 값이면 아무 일도 하지 않는다(기본 문구 그대로). */
  function applyAngle() {
    let key = '';
    try { key = (new URLSearchParams(location.search).get('for') || '').toLowerCase().trim(); } catch (e) {}
    const A = R.angles && R.angles[key];
    if (!A) return;
    document.documentElement.dataset.angle = key;
    if (A.kicker) R.profile.kicker = A.kicker;
    if (A.thesis) R.profile.thesis = A.thesis;
    if (A.lede) R.profile.lede = A.lede;
    if (A.first && Array.isArray(R.profile.highlights)) {
      const i = R.profile.highlights.findIndex(h => h[0] === A.first);
      if (i > 0) R.profile.highlights.unshift(R.profile.highlights.splice(i, 1)[0]);
    }
  }
  /* ------------------------------------------------------------ hero */
  function renderHero() {
    const P = R.profile;
    $('#h-role').textContent = P.role;
    $('#h-career').textContent = P.career;
    $('#h-name').innerHTML = `<span class="sr">${P.name}</span><span aria-hidden="true">${[...P.name].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join('')}</span><span class="en">${P.nameEn}</span>`;
    $('#h-thesis').innerHTML = P.thesis;
    if (P.kicker) $('#h-kicker').textContent = P.kicker; else $('#h-kicker').remove();
    const ph = $('#h-photo');
    if (P.photo) { ph.src = P.photo; ph.addEventListener('error', () => ph.closest('.portrait').remove()); } else ph.closest('.portrait').remove();
    const contactHTML = `
      <a class="chip" href="mailto:${P.email}">${ICON.mail}<span>${P.email}</span></a>
      <a class="chip" href="tel:${P.phone.replace(/-/g, '')}">${ICON.phone}<span>${P.phone}</span></a>
      <span class="chip">${ICON.pin}<span>${P.location}</span></span>`;
    const copyChip = `<button class="chip copy" type="button" data-copy="${P.email}">${ICON.copy}<span>이메일 복사</span></button>`;
    /* 첫 화면은 복사 버튼 자리에 업력 요약을 둔다 — 복사 버튼은 맨 아래 연락처에 그대로 (2026-09-19) */
    $('#heroContact').innerHTML = contactHTML;
    $('#contact2').innerHTML = contactHTML + copyChip;
    $('#heroSum').innerHTML = (() => { let sub = false; return (P.highlights || []).map(h => { // 'gap' 줄부터는 구분선 아래 검은 글씨
      const sep = h[2] === 'gap' && !sub ? '<li class="hs-sep" aria-hidden="true"></li>' : ''; if (h[2] === 'gap') sub = true;
      return `${sep}<li${sub ? ' class="sub"' : ''}><b class="hs-k">${h[0]}</b><span>${h[1]}</span></li>`; }).join(''); })();
    $('#contact-lede').textContent = `${P.role} · ${P.career}. 편하게 연락 주세요 — 메일이 가장 빠릅니다.`;
    // 요약 띠
    $('#h-lede').innerHTML = P.lede;
    $('#h-now').innerHTML = P.now.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    $('#kpis').innerHTML = R.kpis.map(k => `
      <li class="kpi">
        <span class="k">${k.e ? `<span class="emo" aria-hidden="true">${k.e}</span>` : ''}${k.k}</span>
        <span class="v"><span class="shine" data-roll-from="${k.from}" data-roll-to="${k.v}">${k.v}</span><small>${k.u}</small></span>
        <span class="d">${k.d}</span>
        ${R.config.showAbsolute && k.abs ? `<span class="abs">${k.abs}</span>` : ''}
        <span class="s">${k.s}</span>
      </li>`).join('');
    $('#moreWins').innerHTML = (R.moreWins || []).map(w => `<li>${w}</li>`).join('');
  }

  /* ------------------------------------------------------------ 4칸 모션 보드 */
  function renderBoard() {
    const host = $('#mboard');
    R.board.forEach((b, i) => {
      const a = el('article', { class: 'mp', 'data-id': b.id, style: `--d:${i}` });
      a.innerHTML = `
        <header><div>${b.group ? `<span class="mp-group g-${b.group === '체질 개선' ? 'body' : 'roas'}">${b.group}</span>` : ''}<h3>${b.title}</h3></div><span class="mp-tag">${b.tag}</span></header>
        <div class="mp-big">${b.from ? `<span class="from">${b.from}${b.unit}</span><span class="ar" aria-hidden="true">→</span>` : ''}<span class="to shine" data-roll-from="${b.from || '0'}" data-roll-to="${b.to}">${b.to}<small>${b.unit}</small></span></div>
        <p class="mp-sub">${b.sub}</p>
        <div class="mp-chart"></div>
        <p class="mp-span">${b.span}</p>`;
      host.appendChild(a);
      const box = a.querySelector('.mp-chart');
      const draw = anim => { const svg = BOARD[b.id](box); if (anim && !reduceMotion) animateBoard(svg, b.id); };
      draw(false);
      observeWidth(box, () => draw(false));
      a._draw = draw;
      a.addEventListener('mouseenter', () => { if (!a._busy) { a._busy = true; draw(true); setTimeout(() => a._busy = false, 1600); } });
    });
    // 처음 한 번 + 보이는 동안 12초마다 다시 그린다
    const cards = $$('.mp', host);
    let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => cards.forEach(c => c._draw(false)), 120); });
    addEventListener('load', () => setTimeout(() => cards.forEach(c => c._draw(false)), 60)); // 창 높이가 확정된 뒤 한 번 더
    let visible = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0.2 }).observe(host);
    setTimeout(() => { cards.forEach((c, i) => setTimeout(() => c._draw(true), i * 180)); rollNumbers(host); }, reduceMotion ? 0 : 500);
    if (!reduceMotion) setInterval(() => { if (visible && document.visibilityState === 'visible') cards.forEach((c, i) => setTimeout(() => c._draw(true), i * 220)); }, 12000);
  }
  function animateBoard(svg, id) {
    if (id === 'mix') { growBars(svg, 'rect.gcol', 0, 45); $$('path.mixline', svg).forEach(p => { const len = p.getTotalLength(); p.animate?.([{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: '0' }], { duration: 900, delay: 950, easing: 'cubic-bezier(.4,.1,.2,1)', fill: 'backwards' }); }); }
    if (id === 'brand') growBars(svg, 'rect.gb', 0, 45);
    if (id === 'roas') { animateSegs(svg, 150); $$('path.ar', svg).forEach(p => p.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 300, fill: 'backwards' })); }
    if (id === 'multi') growBars(svg, 'rect.gm', 0, 160, false);
  }
  const ymTitle = i => `${S.months[i].replace('-', '년 ')}월${i === lastIdx && S.partialLast ? ' (1~9일)' : ''}${i < tenureIdx ? ' · 입사 전' : ''}`;
  // 첫 화면 차트 호버 — 해당 달만 또렷하고 살짝 커지며, 값 라벨과 전분기·전년 동월 점선이 뜬다
  // val = { get(i) → 숫자, y(i) → 차트 위 y, fmt(v) → 표시 문자열, dot: 선 차트면 점 표시 }
  function boardHover(svg, W, H, x0, step, sel, html, val) {
    const Xc = i => x0 + (i + .5) * step;
    const hit = s('rect', { x: x0, y: 0, width: step * N, height: H, style: 'fill:transparent;cursor:crosshair' }, svg);
    const cross = s('line', { x1: 0, x2: 0, y1: 0, y2: H - 16, style: 'stroke:var(--ink-3);stroke-width:1;opacity:0;pointer-events:none' }, svg);
    const refs = [['전분기', 3], ['전년 동월', 12]].map(([lb, off]) => [
      s('line', { x1: 0, x2: 0, y1: 8, y2: H - 16, style: 'stroke:var(--ink-3);stroke-width:1;stroke-dasharray:2 3;opacity:0;pointer-events:none' }, svg),
      txt(svg, 0, 7, lb, 'tick', 'middle', 'opacity:0;font-size:9.5px;pointer-events:none'), off]);
    const dot = val && val.dot ? s('circle', { cx: 0, cy: 0, r: 0, style: 'fill:var(--hi-end);stroke:var(--surface);stroke-width:2;pointer-events:none;transition:r .2s' }, svg) : null;
    const vlab = val ? txt(svg, 0, 0, '', 'dlab', 'middle', 'opacity:0;font-size:12px;pointer-events:none') : null;
    hit.addEventListener('pointermove', ev => {
      const r = svg.getBoundingClientRect(); const i = clamp(Math.floor(((ev.clientX - r.left) / r.width * W - x0) / step), 0, N - 1);
      const cx = Xc(i); cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.style.opacity = '.45';
      if (sel) $$(sel, svg).forEach(e => { const on = +e.dataset.i === i; e.style.filter = on ? '' : 'opacity(.35)'; e.style.transform = on ? (e.classList.contains('gcol') ? 'scaleX(1.4)' : 'scale(1.35, 1.06)') : ''; });
      refs.forEach(([ln, lb, off]) => { const j = i - off, show = j >= 0 && (!val || val.get(j) != null); ln.style.opacity = show ? '.7' : '0'; lb.style.opacity = show ? '1' : '0'; if (show) { ln.setAttribute('x1', Xc(j)); ln.setAttribute('x2', Xc(j)); lb.setAttribute('x', Xc(j)); } });
      let cmp = '';
      if (val) {
        const v = val.get(i), y = val.y(i);
        vlab.textContent = val.fmt(v); vlab.setAttribute('x', clamp(cx, 22, W - 22)); vlab.setAttribute('y', Math.max(12, y - 8)); vlab.style.opacity = '1';
        if (dot) { dot.setAttribute('cx', cx); dot.setAttribute('cy', y); dot.setAttribute('r', 5.5); }
        cmp = [['전분기', 3], ['전년 동월', 12]].filter(([, o]) => i - o >= 0 && val.get(i - o) != null).map(([lb, o]) => `${lb}(${mLabel(S.months[i - o])}) ${val.fmt(val.get(i - o))}`).join(' · ');
      }
      showTip(html(i) + (cmp ? `<div class="f" style="margin-top:4px">${cmp}</div>` : ''), ev.clientX, ev.clientY);
    });
    hit.addEventListener('pointerleave', () => {
      cross.style.opacity = '0'; refs.forEach(([ln, lb]) => { ln.style.opacity = '0'; lb.style.opacity = '0'; });
      if (sel) $$(sel, svg).forEach(e => { e.style.filter = ''; e.style.transform = ''; });
      if (vlab) vlab.style.opacity = '0'; if (dot) dot.setAttribute('r', 0);
      hideTip();
    });
  }
  // 첫 화면이 한 화면에 들어오도록 — 창 높이에 맞춰 차트 높이를 정한다 (넓은 화면 2열 배치일 때만)
  const boardH = () => innerWidth > 1100 ? Math.max(80, Math.min(118, Math.round((innerHeight - 520) / 2))) : 110;
  const BOARD = {
    mix(box) {
      const W = Math.max(240, box.clientWidth || 360), H = boardH(), m = { l: 0, r: 0, t: 4, b: 16 };
      const step = (W - m.l - m.r) / N, bw = Math.max(3, step - 3);
      const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '매체별 광고비 비중 월별' });
      const Y = p => m.t + (1 - p / 100) * (H - m.t - m.b);
      // 1P·윙·네이버는 원래 색, 소액만 연하게 — 1P 비중 추이는 잉크색 선으로 따로 보여 준다
      const keys = [['cp1', 'var(--c-1p)', 1], ['cp3', 'var(--c-3p)', 1], ['naver', 'var(--c-nv)', 1], ['small4', 'var(--c-sm)', .3]];
      S.months.forEach((mo, i) => {
        const g = s('g', { opacity: i < tenureIdx ? .4 : 1 }, svg);
        let acc = 0;
        keys.forEach(([k, col, op]) => { const v = S.mix[k][i] || 0; const y0 = Y(acc), y1 = Y(acc + v); acc += v; s('rect', { x: m.l + i * step + 1.5, y: y1 + 1, width: bw, height: Math.max(0, y0 - y1 - 2), rx: 1.5, class: 'gcol', 'data-k': i, 'data-i': i, style: `fill:${col};fill-opacity:${op}` }, g); });
      });
      // 1P 비중 선 (1P 는 맨 아래 칸이라 그 윗변이 곧 비중) — 입사 첫 달 → 지금
      const p1 = S.months.map((mo, i) => i < tenureIdx ? null : [m.l + (i + .5) * step, Y(S.mix.cp1[i])]);
      s('path', { d: pathD(p1), class: 'mixline', style: 'fill:none;stroke:var(--surface);stroke-width:5;stroke-linejoin:round;stroke-linecap:round;opacity:.9' }, svg);
      s('path', { d: pathD(p1), class: 'mixline', style: 'fill:none;stroke:var(--ink);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round' }, svg);
      const a1 = p1[tenureIdx], z1 = p1[lastIdx];
      s('circle', { cx: a1[0], cy: a1[1], r: 3.5, style: 'fill:var(--surface);stroke:var(--ink);stroke-width:2' }, svg);
      s('circle', { cx: z1[0], cy: z1[1], r: 4, style: 'fill:var(--ink);stroke:var(--surface);stroke-width:2' }, svg);
      txt(svg, a1[0] + 5, a1[1] - 5, `1P ${nf(S.mix.cp1[tenureIdx], 0)}%`, 'dlab', 'start', 'font-size:11px');
      txt(svg, z1[0] - 3, z1[1] + 14, `${nf(S.mix.cp1[lastIdx], 0)}%`, 'dlab', 'end', 'font-size:11px');
      // 최신 달 윙·네이버 비중 — 각 칸의 가운데 높이, 마지막 막대 바로 왼쪽
      const lx = m.l + lastIdx * step - 1;
      [['윙', 'cp3', S.mix.cp1[lastIdx]], ['네이버', 'naver', S.mix.cp1[lastIdx] + S.mix.cp3[lastIdx]]].forEach(([n, k, base]) => {
        const v = S.mix[k][lastIdx]; txt(svg, lx, Y(base + v / 2) + 4, `${n} ${nf(v, 0)}%`, 'dlab', 'end', 'font-size:11px');
      });
      const tx = m.l + step * tenureIdx; s('line', { x1: tx, x2: tx, y1: 0, y2: H - m.b, style: 'stroke:var(--accent);stroke-width:1.5' }, svg);
      txt(svg, 0, H - 3, '25.1', 'tick'); txt(svg, tx, H - 3, '입사', 'tick strong', 'middle', 'fill:var(--accent-ink)'); txt(svg, W, H - 3, '26.9', 'tick', 'end');
      boardHover(svg, W, H, m.l, step, 'rect[data-i]', i => `<div class="t">${ymTitle(i)}</div>${[['쿠팡 1P', 'cp1', '--c-1p'], ['쿠팡 윙', 'cp3', '--c-3p'], ['네이버', 'naver', '--c-nv'], ['소액 4채널', 'small4', '--c-sm']].map(([n, k, c]) => `<div class="r"><span><i style="background:var(${c})"></i>${n}</span><b>${nf(S.mix[k][i], 1)}%</b></div>`).join('')}`, { get: i => S.mix.cp1[i], y: i => Y(S.mix.cp1[i]), fmt: v => `1P ${nf(v, 1)}%` });
      box.replaceChildren(svg);
      if (!box.nextElementSibling.classList.contains('mp-key')) box.insertAdjacentHTML('afterend', `<div class="mp-key">${[['쿠팡 1P', '--c-1p'], ['윙', '--c-3p'], ['네이버', '--c-nv'], ['소액', '--c-sm']].map(([n, c]) => `<span><i style="background:var(${c})"></i>${n}</span>`).join('')}</div>`);
      return svg;
    },
    brand(box) {
      const W = Math.max(240, box.clientWidth || 360), H = boardH(), m = { l: 0, r: 0, t: 8, b: 16 };
      const step = W / N, Y = v => m.t + (1 - v / 50) * (H - m.t - m.b);
      const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '브랜드 키워드 의존도 월별' });
      s('rect', { x: 0, y: 0, width: step * tenureIdx, height: H - m.b, style: 'fill:var(--band-b)' }, svg);
      const ry = Y(37.9); s('line', { x1: 0, x2: W, y1: ry, y2: ry, style: 'stroke:var(--before);stroke-dasharray:3 3' }, svg);
      txt(svg, W - 4, ry - 4, '입사 전 평균 37.9%', 'tick', 'end');
      S.brand.total.forEach((v, i) => {
        const x = i * step + 1.5, bw = Math.max(2, step - 3), yy = Y(v), after = i >= tenureIdx, f = after ? (i - tenureIdx) / (N - 1 - tenureIdx) : 0;
        s('rect', { x, y: yy, width: bw, height: (H - m.b) - yy, rx: 2, class: after ? 'gb' : 'gb0', 'data-k': i - tenureIdx, 'data-i': i, style: after ? `fill:var(--accent);opacity:${(.45 + .55 * f).toFixed(2)}` : 'fill:var(--before);opacity:.55' }, svg);
      });
      const tx = step * tenureIdx; s('line', { x1: tx, x2: tx, y1: 0, y2: H - m.b, style: 'stroke:var(--accent);stroke-width:1.5' }, svg);
      // 가장 최근 값은 마우스를 올리지 않아도 보이게
      const lv = S.brand.total[lastIdx];
      txt(svg, W - 1, Y(lv) - 6, `${nf(lv, 1)}%`, 'dlab', 'end', 'font-size:12.5px;fill:var(--accent-ink)');
      txt(svg, 0, H - 3, '25.1', 'tick'); txt(svg, tx, H - 3, '입사', 'tick strong', 'middle', 'fill:var(--accent-ink)'); txt(svg, W, H - 3, '26.9', 'tick', 'end');
      boardHover(svg, W, H, 0, step, 'rect[data-i]', i => `<div class="t">${ymTitle(i)}</div><div class="r"><span>브랜드 키워드 의존도</span><b>${nf(S.brand.total[i], 1)}%</b></div><div class="f">입사 전 평균 37.9%</div>`, { get: i => S.brand.total[i], y: i => Y(S.brand.total[i]), fmt: v => `${nf(v, 1)}%` });
      box.replaceChildren(svg); return svg;
    },
    roas(box) {
      const W = Math.max(240, box.clientWidth || 360), H = boardH(), m = { l: 2, r: 8, t: 10, b: 16 };
      const step = (W - m.l - m.r) / N, X = i => m.l + (i + .5) * step, Y = v => m.t + (1 - (v - 700) / 1000) * (H - m.t - m.b);
      const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '통합 ROAS 월별' });
      s('rect', { x: 0, y: 0, width: m.l + step * tenureIdx, height: H - m.b, style: 'fill:var(--band-b)' }, svg);
      const ry = Y(964); s('line', { x1: 0, x2: W, y1: ry, y2: ry, style: 'stroke:var(--before);stroke-dasharray:3 3' }, svg);
      txt(svg, W - 4, ry + 13, '입사 전 평균 964%', 'tick', 'end');
      const pts = S.roas.total.map((v, i) => [X(i), Y(v)]);
      s('path', { d: pathD(pts.slice(tenureIdx)) + ` L ${X(lastIdx)} ${H - m.b} L ${X(tenureIdx)} ${H - m.b} Z`, class: 'ar', style: 'fill:var(--accent);opacity:.1' }, svg);
      s('path', { d: pathD(pts.slice(0, tenureIdx + 1)), style: 'fill:none;stroke:var(--before);stroke-width:2;stroke-linejoin:round' }, svg);
      progLine(svg, pts, tenureIdx, 'var(--accent)', 2, 4.6);
      // 큰 숫자(26 상반기 평균)가 차트의 어디인지 — 구간선 + 끝 점 라벨
      const h0 = S.months.indexOf('2026-01'), h1 = S.months.indexOf('2026-06'), hy = Y(S.periods.H1.roas.total);
      // 라벨은 선과 겹치지 않는 왼쪽 빈 공간(입사 전 구간 위쪽)에 두고 점선으로 구간까지 잇는다
      s('line', { x1: 4, x2: X(h0) - step / 2, y1: hy, y2: hy, style: 'stroke:var(--good);stroke-width:1;stroke-dasharray:2 3;opacity:.6' }, svg);
      s('line', { x1: X(h0) - step / 2, x2: X(h1) + step / 2, y1: hy, y2: hy, style: 'stroke:var(--good);stroke-width:2.2;stroke-dasharray:4 3' }, svg);
      txt(svg, 4, hy - 5, `26 상반기 평균 ${nf(S.periods.H1.roas.total, 0)}%`, 'tick strong', 'start', 'fill:var(--good);font-size:10.5px');
      txt(svg, X(lastIdx) - 2, Y(S.roas.total[lastIdx]) + 16, `26.9 ${nf(S.roas.total[lastIdx], 0)}%`, 'tick', 'end', 'font-size:10px');
      const tx = m.l + step * tenureIdx; s('line', { x1: tx, x2: tx, y1: 0, y2: H - m.b, style: 'stroke:var(--accent);stroke-width:1.5' }, svg);
      txt(svg, 0, H - 3, '25.1', 'tick'); txt(svg, tx, H - 3, '입사', 'tick strong', 'middle', 'fill:var(--accent-ink)'); txt(svg, W, H - 3, '26.9', 'tick', 'end');
      boardHover(svg, W, H, m.l, step, null, i => `<div class="t">${ymTitle(i)}</div><div class="r"><span>통합 ROAS</span><b>${nf(S.roas.total[i], 0)}%</b></div><div class="f">입사 전 평균 964% 대비 ${S.roas.total[i] >= 964 ? '+' : ''}${nf(S.roas.total[i] - 964, 0)}%p</div>`, { get: i => S.roas.total[i], y: i => Y(S.roas.total[i]), fmt: v => `${nf(v, 0)}%`, dot: true });
      box.replaceChildren(svg); return svg;
    },
    multi(box) {
      // 한 줄 = 매체 | 개선 전 | 막대(점선 = 개선 전 크기) | 개선 후 | 개선 폭
      const rows = R.boardMulti, W = Math.max(260, box.clientWidth || 360), rowH = Math.max(21, Math.min(27, Math.round(boardH() / 4.3))), H = rows.length * rowH + 16;
      const lw = 66, bw0 = 44, aw = 44, dw = 48, bx = lw + bw0, bwMax = Math.max(40, W - bx - aw - dw - 8), maxR = 3.3;
      const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': '매체별 ROAS 개선 전후' });
      const cols = ['var(--c-1p)', 'var(--c-nv)', 'var(--c-3p)', 'var(--c-sm)'];
      const cA = lw + bw0 / 2 - 2, cB = bx + bwMax + aw / 2 + 2; // 개선 전·후 숫자 칸의 가운데
      txt(svg, cA, 9, '개선 전', 'tick', 'middle', 'font-size:9.5px');
      txt(svg, cB, 9, '개선 후', 'tick', 'middle', 'font-size:9.5px');
      rows.forEach(([name, a, b, d], k) => {
        const y = 14 + k * rowH, ratio = b / a, bh = Math.min(15, rowH - 8);
        txt(svg, 0, y + bh - 2, name, 'plabel', 'start', 'font-size:11px');
        txt(svg, cA, y + bh - 2, `${nf(a)}%`, 'tick', 'middle', 'font-size:10.5px;fill:var(--ink-3)');
        s('rect', { x: bx, y: y + 2, width: bwMax, height: bh, rx: 4, style: 'fill:var(--sunk)' }, svg);
        s('rect', { x: bx, y: y + 2, width: bwMax / maxR, height: bh, rx: 4, style: 'fill:none;stroke:var(--before);stroke-dasharray:3 2' }, svg);
        s('rect', { x: bx, y: y + 2, width: bwMax * ratio / maxR, height: bh, rx: 4, class: 'gm', 'data-k': k, style: `fill:${cols[k]}` }, svg);
        txt(svg, cB, y + bh - 1, `${nf(b)}%`, 'dlab', 'middle', 'font-size:12px');
        txt(svg, W, y + bh - 1, d, 'dlab', 'end', 'font-size:12px;fill:var(--good)');
        const hit = s('rect', { x: 0, y, width: W, height: rowH - 2, style: 'fill:transparent;cursor:default' }, svg);
        hit.addEventListener('pointermove', ev => { $$('rect.gm', svg).forEach(r => r.style.filter = +r.dataset.k === k ? '' : 'opacity(.3)'); showTip(`<div class="t">${name}</div><div class="r"><span>개선 전</span><b>${nf(a)}%</b></div><div class="r"><span>개선 후</span><b>${nf(b)}%</b></div><div class="f">${d} · ${rows[k][4]}</div>`, ev.clientX, ev.clientY); });
        hit.addEventListener('pointerleave', () => { $$('rect.gm', svg).forEach(r => r.style.filter = ''); hideTip(); });
      });
      box.replaceChildren(svg); return svg;
    },
  };

  /* ------------------------------------------------------------ 광고 밖 그로스 설계 */
  // 카드마다 몰 화면을 단순화한 미니 일러스트 — 마우스를 올리면 재설계 전후가 바뀐다
  const GILL = {
    main: `<svg viewBox="0 0 240 150" aria-hidden="true">
      <rect x="6" y="6" width="228" height="138" rx="10" class="gi-frame"/>
      <rect x="6" y="6" width="228" height="18" rx="10" class="gi-bar"/><circle cx="18" cy="15" r="2.5" class="gi-dot"/><circle cx="27" cy="15" r="2.5" class="gi-dot"/><circle cx="36" cy="15" r="2.5" class="gi-dot"/>
      <rect x="16" y="32" width="208" height="38" rx="6" class="gi-hero"/><text x="28" y="56" class="gi-t">기획전 · 타임배너</text>
      <g class="gi-tiles"><rect x="16" y="78" width="64" height="44" rx="5" class="gi-a"/><rect x="88" y="78" width="64" height="44" rx="5" class="gi-b"/><rect x="160" y="78" width="64" height="44" rx="5" class="gi-c"/></g>
      <text x="48" y="104" class="gi-s" text-anchor="middle">주력</text><text x="120" y="104" class="gi-s" text-anchor="middle">확장</text><text x="192" y="104" class="gi-s" text-anchor="middle">세트</text>
      <rect x="16" y="128" width="208" height="8" rx="4" class="gi-cta"/><rect class="gi-sweep" x="-60" y="30" width="40" height="110"/>
    </svg>`,
    cat: `<svg viewBox="0 0 240 150" aria-hidden="true">
      <rect x="6" y="6" width="228" height="138" rx="10" class="gi-frame"/>
      <text x="18" y="26" class="gi-t">대표 카테고리</text><rect x="150" y="14" width="74" height="16" rx="8" class="gi-chip"/><text x="187" y="26" class="gi-s" text-anchor="middle">랭킹 ↑</text>
      ${Array.from({ length: 12 }, (_, k) => { const c = k % 4, r = Math.floor(k / 4); const on = k < 5 ? 'gi-on' : k < 9 ? 'gi-new' : 'gi-off'; return `<rect x="${18 + c * 52}" y="${40 + r * 34}" width="44" height="26" rx="5" class="gi-cell ${on}" style="--k:${k}"/>`; }).join('')}
    </svg>`,
    coupon: `<svg viewBox="0 0 240 150" aria-hidden="true">
      <rect x="6" y="6" width="228" height="138" rx="10" class="gi-frame"/>
      <g class="gi-cp gi-cp1"><path d="M22 34h120a8 8 0 0 0 0 16 8 8 0 0 0 0 16H22z" class="gi-ticket"/><text x="34" y="55" class="gi-t">첫구매 쿠폰</text></g>
      <g class="gi-cp gi-cp2"><path d="M98 82h120a8 8 0 0 0 0 16 8 8 0 0 0 0 16H98z" class="gi-ticket2"/><text x="110" y="103" class="gi-t">재구매 쿠폰</text></g>
      <text x="22" y="134" class="gi-s">+ 네플 쿠폰 분리 · PMC 최대 −95%</text>
    </svg>`,
  };
  function renderGrowth() {
    const G = R.growth; if (!G) return;
    $('#growth-h').textContent = G.headline;
    $('#growth-lede').innerHTML = G.lede;
    $('#gcards').innerHTML = G.items.map((it, i) => `
      <article class="gcard" style="--d:${i}">
        <div class="gill gill-${it.id}">${GILL[it.id] || ''}</div>
        <div class="gbody">
          <span class="gwhere">${it.where}</span>
          <h3>${it.title}</h3>
          <ul class="gwhat">${it.what.map(w => `<li>${w}</li>`).join('')}</ul>
          <div class="gres">${it.result.map(([v, k]) => `<span><b class="shine">${v}</b>${k}</span>`).join('')}</div>
        </div>
      </article>`).join('');
    const X = G.extra, ex = $('#gextra');
    if (X && ex) { ex.hidden = false; ex.innerHTML = `<h3>${X.title}</h3><ul>${X.items.map(([e, k]) => `<li><span aria-hidden="true">${e}</span>${k}</li>`).join('')}${X.tail ? `<li class="tail">${X.tail}</li>` : ''}</ul>`; }
  }

  /* ------------------------------------------------------------ 대시보드 쇼케이스 */
  function renderShowcase() {
    const p = R.projects.find(x => x.featured); if (!p) return;
    $('#dash-h').textContent = p.headline || p.title;
    const frame = $('#dashFrame'), side = $('#dashSide');
    frame.innerHTML = `
      <div class="dash-view">
        <iframe data-src="${p.tourSrc}" title="퍼포먼스 대시보드 축소판" tabindex="-1" aria-hidden="true"></iframe>
        <button class="dash-shield" type="button" aria-label="대시보드 크게 보기"><span>${ICON.expand}클릭해서 크게 보기</span></button>
        <span class="dash-badge">숫자는 모두 임의 값</span>
      </div>
      <div class="dash-bar" hidden>
        <div class="cap" aria-hidden="true"></div>
        <div class="ctl"><button class="pbtn" type="button" aria-label="재생">${ICON.play}</button><div class="bar"><div class="trk"><div class="fil"></div></div></div><span class="time">0:00</span></div>
      </div>`;
    const facts = p.facts.map(f => `<li><span class="fv">${f.v}<small>${f.u}</small></span><span class="fk">${f.k}</span></li>`).join('');
    side.innerHTML = `
      <div class="proj-meta">${p.pill ? `<span class="pill ${p.pill.c}">${p.pill.t}</span>` : ''}${p.meta.map(x => `<span>${x}</span>`).join('<span aria-hidden="true">·</span>')}</div>
      <p class="hook">${p.hook}</p>
      <div class="modesw" role="group" aria-label="보기 방식">
        <button type="button" data-mode="mini" aria-pressed="true">${ICON.grid}축소판</button>
        <button type="button" data-mode="video" aria-pressed="false">${ICON.play}영상으로 보기</button>
      </div>
      <div class="actions"><button class="btn" type="button" data-big>${ICON.expand}크게 보기 · 직접 조작</button><a class="btn ghost" href="${p.demo}" target="_blank" rel="noopener">${ICON.ext}새 창</a>${(Array.isArray(p.demo2) ? p.demo2 : p.demo2 ? [p.demo2] : []).map(d => `<a class="btn ghost" href="${d.href}" target="_blank" rel="noopener">${ICON.ext}${d.label}</a>`).join('')}</div>
      <ul class="facts">${facts}</ul>
      <ul class="how">${p.how.map(x => `<li>${x}</li>`).join('')}</ul>`;

    const view = $('.dash-view', frame), ifr = $('iframe', view), shield = $('.dash-shield', view);
    const bar = $('.dash-bar', frame), cap = $('.cap', bar), pbtn = $('.pbtn', bar), fil = $('.fil', bar), time = $('.time', bar), track = $('.bar', bar);
    const T = p.tour; const st = { mode: 'mini', t: 0, playing: false, last: 0, raf: 0, ready: false, visible: false, userPaused: false };
    const post = m => { try { ifr.contentWindow.postMessage(m, '*'); } catch (e) {} };
    /* (2026-09-20) 축소판 데모는 약 870KB — 첫 화면에 필요 없으므로 이 구역이 가까워졌을 때 불러온다.
       버튼을 먼저 누르는 경우를 대비해 조작 지점마다 loadFrame() 을 한 번 더 부른다(두 번째부터는 아무 일도 안 한다) */
    let frameLoaded = false;
    const loadFrame = () => { if (frameLoaded || !ifr.dataset.src) return; frameLoaded = true; ifr.src = ifr.dataset.src; };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => { for (const e of es) if (e.isIntersecting) { io.disconnect(); loadFrame(); } }, { rootMargin: '700px 0px' });
      io.observe($('#dash'));
    } else loadFrame();
    // 축소판 박스가 오른쪽 설명 높이만큼 늘어나면, 늘어난 만큼 대시보드를 더 보여 준다
    const fitScale = () => { const w = view.clientWidth, h = view.clientHeight, sc = w / 1440; ifr.style.transform = `scale(${sc})`; ifr.style.height = Math.max(810, Math.ceil(h / sc)) + 'px'; };
    fitScale();
    if ('ResizeObserver' in window) new ResizeObserver(() => fitScale()).observe(view);
    window.addEventListener('message', e => { if (e.source === ifr.contentWindow && e.data && e.data.type === 'dash-ready') { st.ready = true; st.mode === 'mini' ? post({ type: 'explore' }) : post({ type: 'tour', t: st.t }); } });
    const mmss = v => `${Math.floor(v / 60)}:${String(Math.floor(v % 60)).padStart(2, '0')}`;
    function ui() {
      fil.style.width = (clamp(st.t / T.duration, 0, 1) * 100) + '%';
      time.textContent = `${mmss(Math.min(st.t, T.duration))} / ${mmss(T.duration)}`;
      let c = ''; for (const [ct, txt2] of T.chapters) if (st.t >= ct) c = txt2; if (cap.textContent !== c) cap.textContent = c;
      pbtn.innerHTML = st.playing ? ICON.pause : ICON.play; pbtn.setAttribute('aria-label', st.playing ? '일시정지' : '재생');
    }
    function loop(now) {
      if (!st.playing) return;
      st.t += Math.min(.1, (now - st.last) / 1000); st.last = now;
      if (st.t > T.duration + 1) st.t = 0;
      post({ type: 'tour', t: st.t }); ui();
      st.raf = requestAnimationFrame(loop);
    }
    const play = () => { if (st.playing) return; st.playing = true; st.userPaused = false; st.last = performance.now(); st.raf = requestAnimationFrame(loop); ui(); };
    const pause = user => { if (user) st.userPaused = true; st.playing = false; cancelAnimationFrame(st.raf); ui(); };
    function setMode(mode) {
      loadFrame();
      st.mode = mode;
      $$('.modesw button', side).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      frame.classList.toggle('is-video', mode === 'video');
      bar.hidden = mode !== 'video';
      if (mode === 'video') { post({ type: 'tour', t: st.t }); play(); }
      else { pause(); post({ type: 'explore' }); }
    }
    side.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); if (e.target.closest('[data-big]')) openDemo(p.demo); });
    shield.addEventListener('click', () => { loadFrame(); if (st.mode === 'video') { st.playing ? pause(true) : play(); } else openDemo(p.demo); });
    pbtn.addEventListener('click', () => st.playing ? pause(true) : play());
    track.addEventListener('pointerdown', e => { const r = track.getBoundingClientRect(); st.t = clamp((e.clientX - r.left) / r.width, 0, 1) * T.duration; post({ type: 'tour', t: st.t }); ui(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(en => {
      if (st.mode !== 'video') return;
      if (en.intersectionRatio >= .5 && !st.userPaused && !reduceMotion) play(); else if (en.intersectionRatio < .2) pause();
    }), { threshold: [0, .2, .5] }).observe(frame);
    ui();
  }

  /* ------------------------------------------------------------ performance board */
  const P = S.periods, PKEYS = ['B', 'H2', 'H1', 'R3', 'MTD'];
  const VIEWS = [
    { id: 'amount', label: '광고비와 매출', title: '월 광고비와 월 전환매출 (지수)', unit: '입사 전 6개월 월평균 = 100 · 26.9는 1~9일을 30일로 환산', type: 'duo',
      series: [
        { id: 'rev', name: '월 전환매출', color: 'var(--accent)', values: S.index.revenue, emph: true },
        { id: 'spend', name: '월 광고비', color: 'var(--ink-3)', values: S.index.spend },
      ], dec: 0, suffix: '',
      caption: '입사 전 월평균을 <b>100</b>으로 두면 26년 7–8월은 <b>광고비 189 · 전환매출 218</b> — 광고비를 1.9배 늘리는 동안 매출은 <b>2.2배</b>가 됐습니다. 25년 9월부터는 매달 <b>광고비 1원당 전환매출이 입사 전(9.6원)보다 높습니다</b>.',
      cmp: { cols: [['월 광고비', p => p.index.spend], ['월 전환매출', p => p.index.revenue]], dec: 0, suffix: '', note: '지수 · 입사 전 6개월 월평균 = 100 (26.9는 30일 환산)', deltaCol: 1 } },
    { id: 'roas', label: '통합 ROAS', title: '통합 ROAS', unit: '9개 매체 · 광고비 가중 · 순수 ROAS %',
      type: 'line', min: 700, max: 1700, ref: { v: 964, label: '입사 전 평균 964%' }, dec: 0, suffix: '%',
      series: [{ id: 'total', name: '통합 ROAS', color: 'var(--accent)', values: S.roas.total, emph: true }],
      caption: '진단 구간(25.7–8)의 저점을 지난 뒤 <b>25년 9월부터 13개월 연속 입사 전 평균(964%) 위</b>. 26년 1월 1,556%로 최고치를 찍었고, 월 광고비를 입사 전의 1.9배로 늘린 확장 구간에서도 1,090% 이상을 지켰습니다.',
      cmp: { cols: [['ROAS', p => p.roas.total]], dec: 0, suffix: '%', note: '순수 ROAS · 광고비 가중', deltaCol: 0, deltaUnit: '%p' } },
    { id: 'channel', label: '채널별 ROAS', title: '주력 채널 ROAS', unit: '순수 ROAS %',
      type: 'line', min: 0, max: 2300, dec: 0, suffix: '%',
      series: [
        { id: 'tot', name: '통합 (9개 매체)', color: 'var(--c-tot)', values: S.roas.total, emph: true },
        { id: 'cp1', name: '쿠팡 1P 로켓', color: 'var(--c-1p)', values: S.roas.cp1 },
        { id: 'cp3', name: '쿠팡 윙(3P)', color: 'var(--c-3p)', values: S.roas.cp3 },
        { id: 'nv', name: '네이버 합계', color: 'var(--c-nv)', values: S.roas.naver },
      ],
      ref: { v: 1635, label: '1P 입사 전 최고 1,635%' },
      caption: '쿠팡 1P 는 <b>25년 12월부터 10개월 연속 입사 전 최고치(1,635%) 위</b>. 윙은 25년 9월 이후 입사 전 저점(474%)을 다시 밟지 않았고, 네이버는 브랜드 키워드를 절반 이하로 걷어내면서도 26년 9월 736%로 입사 전 평균(596%)을 넘어섰습니다.',
      cmp: { cols: [['통합', p => p.roas.total], ['1P', p => p.roas.cp1], ['윙', p => p.roas.cp3], ['네이버', p => p.roas.naver]], dec: 0, suffix: '', note: '순수 ROAS %' } },
    { id: 'brand', label: '브랜드 의존도', title: '브랜드 키워드 의존도', unit: '광고비 중 브랜드 키워드 비중 %',
      type: 'line', min: 0, max: 100, dec: 1, suffix: '%',
      series: [
        { id: 'tot', name: '4개 채널 합계', color: 'var(--c-tot)', values: S.brand.total, emph: true },
        { id: 'cp1', name: '쿠팡 1P', color: 'var(--c-1p)', values: S.brand.cp1 },
        { id: 'cp3', name: '쿠팡 윙', color: 'var(--c-3p)', values: S.brand.cp3 },
        { id: 'nsa', name: '네이버 쇼핑검색', color: 'var(--c-nv)', values: S.brand.nsa },
        { id: 'npl', name: '네이버 파워링크', color: 'var(--c-sm)', values: S.brand.npl },
      ],
      caption: '합계는 <b>41.0%(25.1) → 15.1%(26.9)</b>. 파워링크는 브랜드 비중이 99%에 달하던 채널이었고, 26년 7월에는 쿠팡 1P 브랜드 비중을 21.7%에서 8.8%로 한 번에 낮췄습니다. 같은 달 1P ROAS 는 오히려 1,795% → 1,923%로 올랐습니다.',
      cmp: { cols: [['합계', p => p.brand.total], ['1P', p => p.brand.cp1], ['파워링크', p => p.brand.npl]], dec: 1, suffix: '', note: '광고비 중 브랜드 키워드 비중 %', deltaCol: 0, deltaUnit: '%p', lowerIsBetter: true } },
    { id: 'mix', label: '매체 믹스', title: '매체별 광고비 비중', unit: '월별 100% 누적',
      type: 'stack', dec: 1, suffix: '%',
      series: [
        { id: 'cp1', name: '쿠팡 1P', color: 'var(--c-1p)', values: S.mix.cp1 },
        { id: 'cp3', name: '쿠팡 윙', color: 'var(--c-3p)', values: S.mix.cp3 },
        { id: 'nv', name: '네이버', color: 'var(--c-nv)', values: S.mix.naver },
        { id: 'sm', name: '소액 4채널', color: 'var(--c-sm)', values: S.mix.small4 },
      ],
      caption: '입사 후 1P 에 몰려 있던 집행(25.10 56.8%)을 네이버와 윙으로 분산했습니다. 26년 9월 기준 <b>1P 27% · 윙 26% · 네이버 43%</b> — 한 채널의 정책 변화에 흔들리지 않는 구성입니다.',
      cmp: { cols: [['1P', p => p.mix.cp1], ['윙', p => p.mix.cp3], ['네이버', p => p.mix.naver]], dec: 1, suffix: '', note: '광고비 비중 %' } },
  ];
  let curView = 'amount', showLabels = false;

  function renderPerf() {
    $('#perf-basis').textContent = `${R.config.basis} · 기준일 ${R.config.asOf}`;
    const seg = $('#viewSeg');
    seg.innerHTML = VIEWS.map(v => `<button type="button" data-view="${v.id}" aria-pressed="${v.id === curView}">${v.label}</button>`).join('');
    seg.addEventListener('click', e => { const b = e.target.closest('button[data-view]'); if (!b) return; setView(b.dataset.view); });
    $('#labelBtn').addEventListener('click', () => { showLabels = !showLabels; const b = $('#labelBtn'); b.setAttribute('aria-pressed', String(showLabels)); b.textContent = showLabels ? '세부 수치 끄기' : '세부 수치 보기'; drawPerf(false); });
    $('#tableBtn').addEventListener('click', () => {
      const t = $('#perfTable'); const open = t.hidden; t.hidden = !open;
      $('#tableBtn').setAttribute('aria-expanded', String(open)); $('#tableBtn').textContent = open ? '표 닫기' : '표로 보기';
    });
    $('#phaseList').innerHTML = R.phases.map(p => `<li><span class="pn">${p.n}</span><div><b>${p.t}</b><span class="pp">${mLabel(p.from)}–${mLabel(p.to)} · ${p.s}</span><p>${p.d}</p></div></li>`).join('');
    setView(curView, true);
    observeWidth($('#perfChart'), () => drawPerf(false));
  }

  function setView(id, first) {
    curView = id;
    $$('#viewSeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === id)));
    const v = VIEWS.find(x => x.id === id);
    $('#chartTitle').textContent = v.title; $('#chartUnit').textContent = v.unit;
    $('#perfCaption').innerHTML = v.caption;
    $('#perfLegend').innerHTML = v.series.map(sr => `<span data-sid="${sr.id}"${sr.emph && v.series.length > 1 ? ' class="lg-emph"' : ''}><i class="${v.type === 'stack' || sr.id === 'spend' ? 'sq' : ''}" style="background:${sr.color}"></i>${sr.name}</span>`).join('')
      + (v.type !== 'stack' ? '<span><i style="background:var(--band-b);height:10px;width:14px;border:1px solid var(--rule-2)"></i>입사 전</span>' : '');
    renderCmp(v); renderTable(v);
    drawPerf(!first);
    const lg = $('#perfLegend');
    lg.onmouseover = e => { const sp = e.target.closest('[data-sid]'); if (sp) focusSeries(sp.dataset.sid); };
    lg.onmouseleave = () => focusSeries(null);
  }
  // 계열 하나만 또렷하게, 나머지(선 · 세부 수치 · 끝 라벨 · 범례)는 연하게 — 범례와 차트 오른쪽 끝 라벨이 함께 쓴다
  function focusSeries(sid) {
    $$('#perfChart [data-sid]').forEach(g => g.style.filter = sid == null || g.dataset.sid === sid ? '' : 'opacity(.18)');
    $$('#perfLegend [data-sid]').forEach(x => x.style.opacity = sid == null ? '' : x.dataset.sid === sid ? '1' : '.45');
  }

  function phaseBands(svg, m, step, plotB, narrow) {
    const bandG = s('g', {}, svg);
    s('rect', { x: m.l, y: m.t - 44, width: step * tenureIdx, height: plotB - m.t + 44, style: 'fill:var(--band-b)' }, bandG);
    txt(bandG, m.l + step * tenureIdx / 2, m.t - 14, '입사 전', 'phase-t', 'middle', 'fill:var(--ink-3)');
    R.phases.forEach((p, k) => {
      const a = S.months.indexOf(p.from), b = S.months.indexOf(p.to);
      const x0 = m.l + a * step, x1 = m.l + (b + 1) * step, cx = (x0 + x1) / 2;
      if (k % 2 === 0) s('rect', { x: x0, y: m.t - 44, width: x1 - x0, height: plotB - m.t + 44, style: 'fill:var(--band)' }, bandG);
      s('circle', { cx, cy: m.t - 32, r: 8.5, style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:1' }, bandG);
      txt(bandG, cx, m.t - 28.5, String(p.n), 'phase-t', 'middle', 'fill:var(--accent-ink);font-size:10.5px');
      if (!narrow) txt(bandG, cx, m.t - 11, p.t, 'phase-t', 'middle');
    });
    const tx = m.l + step * tenureIdx;
    s('line', { x1: tx, x2: tx, y1: m.t - 44, y2: plotB, style: 'stroke:var(--accent);stroke-width:1.5' }, svg);
  }

  function drawPerf(animate) {
    const v = VIEWS.find(x => x.id === curView);
    const box = $('#perfChart');
    const W = Math.max(320, box.clientWidth || 800);
    const narrow = W < 560;
    const H = narrow ? 320 : 400;
    /* 오른쪽 여백 = 끝 라벨 자리. duo 는 끝 라벨이 짧아(값 · 「9월 월 환산」) 168 이면 오른쪽이 비어 보인다 (2026-09-19) */
    const m = { l: 48, r: narrow ? 56 : (v.type === 'stack' ? 110 : v.type === 'duo' ? 96 : v.series.length > 1 ? 168 : 76), t: 62, b: 30 };
    const step = (W - m.l - m.r) / N;
    const X = i => m.l + (i + 0.5) * step;
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${v.title} 월별 차트` });
    const plotB = H - m.b;
    phaseBands(svg, m, step, plotB, narrow);
    const grid = s('g', {}, svg), marks = s('g', {}, svg);
    const dots = [];
    const xLabels = () => S.months.forEach((mo, i) => {
      const show = narrow ? (i === 0 || i === tenureIdx || i === lastIdx || mo.endsWith('-01')) : (mo.endsWith('-01') || i === tenureIdx || i === lastIdx || (+mo.slice(5)) % 3 === 1);
      if (!show) return;
      txt(grid, X(i), H - 9, mLabel(mo) + (i === lastIdx && S.partialLast ? '*' : ''), i === tenureIdx ? 'tick strong' : 'tick', 'middle', i === tenureIdx ? 'fill:var(--accent-ink)' : null);
    });

    if (v.type === 'duo') {
      // 위: 월 전환매출(선) / 아래: 월 광고비(막대) — 서로 다른 축을 겹치지 않고 위아래로 나눈다
      const gap = 26, topB = m.t + (plotB - m.t) * 0.62, botT = topB + gap;
      const rev = v.series[0].values, sp = v.series[1].values;
      const rT = niceTicks(0, Math.max(...rev), 4), sT = niceTicks(0, Math.max(...sp), 2);
      const Yr = x => m.t + (1 - x / rT[rT.length - 1]) * (topB - m.t), Ys = x => botT + (1 - x / sT[sT.length - 1]) * (plotB - botT);
      v._Yr = Yr; v._Ys = Ys;
      rT.forEach(t => { s('line', { x1: m.l, x2: W - m.r, y1: Yr(t), y2: Yr(t), style: 'stroke:var(--grid)' }, grid); txt(grid, m.l - 8, Yr(t) + 4, nf(t), 'tick', 'end'); });
      sT.forEach(t => { s('line', { x1: m.l, x2: W - m.r, y1: Ys(t), y2: Ys(t), style: 'stroke:var(--grid)' }, grid); txt(grid, m.l - 8, Ys(t) + 4, nf(t, t % 1 ? 1 : 0), 'tick', 'end'); });
      txt(grid, m.l + 6, m.t + 12, '월 전환매출 (지수)', 'tick strong', 'start');
      txt(grid, m.l + 6, botT + 12, '월 광고비 (지수)', 'tick strong', 'start');
      s('line', { x1: m.l, x2: W - m.r, y1: plotB, y2: plotB, style: 'stroke:var(--axis)' }, grid);
      xLabels();
      // 광고비 막대
      const bw = Math.max(3, step - 5);
      const gs = s('g', { 'data-sid': 'spend' }, marks), gr = s('g', { 'data-sid': 'rev' }, marks);
      sp.forEach((val, i) => {
        const proj = i === lastIdx && S.partialLast;
        s('rect', { x: X(i) - bw / 2, y: Ys(val), width: bw, height: plotB - Ys(val), rx: 2, class: 'grow', 'data-i': i, style: proj ? 'fill:none;stroke:var(--ink-3);stroke-dasharray:3 2' : `fill:${i < tenureIdx ? 'var(--before)' : 'var(--ink-3)'};opacity:${i < tenureIdx ? .6 : .85}` }, gs);
      });
      // 전환매출 선
      const pts = rev.map((val, i) => [X(i), Yr(val)]);
      s('path', { d: pathD(pts.slice(tenureIdx)) + ` L ${X(lastIdx)} ${topB} L ${X(tenureIdx)} ${topB} Z`, class: 'fade', style: 'fill:var(--accent);opacity:.08' }, gr);
      s('path', { d: pathD(pts.slice(0, tenureIdx + 1)), style: 'fill:none;stroke:var(--before);stroke-width:2;stroke-linejoin:round' }, marks);
      progLine(gr, pts, tenureIdx, 'var(--accent)', 2.2, 5);
      txt(marks, X(lastIdx) + 10, Yr(rev[lastIdx]) + 4, `${nf(rev[lastIdx], 0)}`, 'dlab', 'start');
      if (!narrow) txt(marks, X(lastIdx) + 10, Yr(rev[lastIdx]) + 20, '9월 월 환산', 'plabel', 'start', 'font-weight:500;fill:var(--ink-3)');
      txt(marks, X(lastIdx) + 10, Ys(sp[lastIdx]) + 4, `${nf(sp[lastIdx], 0)}`, 'dlab', 'start');
      v.series.forEach(sr => { sr._dots = sr.values.map((val, i) => s('circle', { cx: X(i), cy: sr.id === 'rev' ? Yr(val) : Ys(val), r: 0, style: `fill:${sr.color};stroke:var(--surface);stroke-width:2;pointer-events:none` }, marks)); dots.push(sr); });
    } else if (v.type === 'stack') {
      const Y = p => m.t + (1 - p / 100) * (plotB - m.t);
      v._Y = Y;
      [0, 25, 50, 75, 100].forEach(p => { s('line', { x1: m.l, x2: W - m.r, y1: Y(p), y2: Y(p), style: 'stroke:var(--grid)' }, grid); txt(grid, m.l - 8, Y(p) + 4, p + '%', 'tick', 'end'); });
      s('line', { x1: m.l, x2: W - m.r, y1: plotB, y2: plotB, style: 'stroke:var(--axis)' }, grid);
      xLabels();
      const bw = Math.max(3, step - 4);
      S.months.forEach((mo, i) => {
        let acc = 0;
        v.series.forEach(sr => {
          const val = sr.values[i] || 0; if (!val) return;
          const y0 = Y(acc), y1 = Y(acc + val); acc += val;
          s('rect', { x: X(i) - bw / 2, y: y1 + 1, width: bw, height: Math.max(0, y0 - y1 - 2), rx: 2, style: `fill:${sr.color};opacity:${i < tenureIdx ? .45 : 1}`, class: 'grow', 'data-i': i, 'data-sid': sr.id }, marks);
        });
      });
      let acc = 0;
      v.series.forEach(sr => { const val = sr.values[lastIdx] || 0; const mid = Y(acc + val / 2); acc += val; if (val >= 6 && !narrow) txt(marks, W - m.r + 8, mid + 4, `${sr.name} ${nf(val, 0)}%`, 'plabel', 'start'); });
    } else {
      const all = v.series.flatMap(sr => sr.values).filter(x => x != null);
      const ticks = niceTicks(Math.min(v.min, ...all), Math.max(v.max, ...all), narrow ? 4 : 5);
      const t0 = ticks[0], t1 = ticks[ticks.length - 1];
      const Y = val => m.t + (1 - (val - t0) / (t1 - t0)) * (plotB - m.t);
      v._Y = Y;
      ticks.forEach(t => { s('line', { x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t), style: 'stroke:var(--grid)' }, grid); txt(grid, m.l - 8, Y(t) + 4, nf(t), 'tick', 'end'); });
      if (v.ref) {
        const ry = Y(v.ref.v);
        s('line', { x1: m.l, x2: W - m.r, y1: ry, y2: ry, style: 'stroke:var(--ink-3);stroke-width:1;stroke-dasharray:4 4' }, grid);
        // 세부 수치를 켜면 왼쪽은 값 라벨로 붐비므로 기준선 이름을 오른쪽 끝으로
        if (showLabels) txt(grid, W - m.r - 4, ry + 14, v.ref.label, 'tick strong', 'end');
        else txt(grid, m.l + 6, ry - 6, v.ref.label, 'tick strong', 'start');
      }
      s('line', { x1: m.l, x2: W - m.r, y1: plotB, y2: plotB, style: 'stroke:var(--axis)' }, grid);
      xLabels();
      const order = [...v.series].sort((p, q) => (p.emph ? 1 : 0) - (q.emph ? 1 : 0));
      const ends = [];
      order.forEach(sr => {
        const sg = s('g', { 'data-sid': sr.id }, marks);
        const pts = sr.values.map((val, i) => val == null ? null : [X(i), Y(val)]);
        if (sr.emph) {
          s('path', { d: pathD(pts.slice(0, tenureIdx + 1)), style: `fill:none;stroke:${sr.color};stroke-width:2;opacity:.45;stroke-linejoin:round` }, sg);
          progLine(sg, pts, tenureIdx, sr.color, 2.2, 5.2);
        } else {
          s('path', { d: pathD(pts), class: 'draw', style: `fill:none;stroke:${sr.color};stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round;opacity:.85` }, sg);
        }
        const li = sr.values.length - 1 - [...sr.values].reverse().findIndex(x => x != null);
        if (!sr.emph) s('circle', { cx: X(li), cy: Y(sr.values[li]), r: 3.5, style: `fill:${sr.color};stroke:var(--surface);stroke-width:2`, class: 'fade' }, sg);
        ends.push({ sid: sr.id, y: Y(sr.values[li]), x: X(li), label: `${nf(sr.values[li], v.dec)}${v.suffix}`, name: sr.name, emph: sr.emph });
        sr._dots = sr.values.map((val, i) => val == null ? null : s('circle', { cx: X(i), cy: Y(val), r: 0, style: `fill:${sr.color};stroke:var(--surface);stroke-width:2;pointer-events:none` }, marks));
        dots.push(sr);
      });
      ends.sort((a, b) => a.y - b.y);
      for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 15) ends[k].y = ends[k - 1].y + 15;
      // 오른쪽 끝 라벨 — 계열별로 묶어(data-sid) 범례 포커스 때 함께 흐려지고,
      // 여러 계열이면 라벨에 마우스를 올려도 그 계열만 남는다 (라벨 줄 전체를 투명 칸으로 받아 잡기 쉽게)
      const multi = v.series.length > 1;
      ends.forEach(e => {
        const eg = s('g', { 'data-sid': e.sid, class: multi ? 'endlab' : null }, marks);
        if (multi) {
          s('rect', { x: e.x + 6, y: e.y - 8, width: Math.max(0, W - e.x - 6), height: 15, style: 'fill:transparent' }, eg);
          eg.addEventListener('pointerenter', () => focusSeries(e.sid));
          eg.addEventListener('pointerleave', () => focusSeries(null));
        }
        txt(eg, e.x + 10, e.y + 4, e.label, 'dlab', 'start');
        if (!narrow && multi) txt(eg, e.x + 10 + e.label.length * 7.4 + 4, e.y + 4, e.name, 'plabel', 'start', e.emph ? 'font-weight:800;fill:var(--ink)' : 'font-weight:500;fill:var(--ink-3)'); // 강조 계열(합계 등)은 검은 굵은 글씨
      });
    }

    // 크로스헤어 + 툴팁 + 키보드
    if (showLabels) drawValueLabels(v, svg, { X, m, W, narrow, plotB });
    const refs = [['전분기', 3], ['전년 동월', 12]].map(([lb, off]) => [s('line', { x1: 0, x2: 0, y1: m.t - 6, y2: plotB, style: 'stroke:var(--ink-3);stroke-width:1;stroke-dasharray:2 3;opacity:0;pointer-events:none;transition:opacity .15s' }, svg), txt(svg, 0, m.t - 1, lb, 'tick', 'middle', 'opacity:0;pointer-events:none;font-size:10.5px'), off]);
    const cross = s('line', { x1: 0, x2: 0, y1: m.t - 44, y2: plotB, style: 'stroke:var(--ink-3);stroke-width:1;opacity:0;pointer-events:none' }, svg);
    const hit = s('rect', { x: m.l, y: m.t - 44, width: W - m.l - m.r, height: plotB - m.t + 44, style: 'fill:transparent;cursor:crosshair' }, svg);
    const tipAt = (i, cx, cy) => {
      cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.style.opacity = '.5';
      dots.forEach(sr => sr._dots.forEach((c, k) => c && c.setAttribute('r', k === i ? (sr.emph ? 5 : 4) : 0)));
      if (v.type === 'stack' || v.type === 'duo') $$('rect[data-i]', marks).forEach(r => r.style.filter = +r.dataset.i === i ? '' : 'opacity(.35)');
      refs.forEach(([ln, lb, off]) => { const j = i - off; if (j >= 0) { ln.setAttribute('x1', X(j)); ln.setAttribute('x2', X(j)); ln.style.opacity = '1'; lb.setAttribute('x', X(j)); lb.style.opacity = '1'; } else { ln.style.opacity = '0'; lb.style.opacity = '0'; } });
      const phase = i < tenureIdx ? '입사 전' : (R.phases.find(p => S.months[i] >= p.from && S.months[i] <= p.to) || {}).t;
      const unitOf = sr => v.type === 'duo' ? '' : v.suffix;
      let rows = v.series.map(sr => `<div class="r"><span><i style="background:${sr.color}"></i>${sr.name}</span><b>${nf(sr.values[i], v.type === 'duo' ? 0 : v.dec)}${unitOf(sr)}</b></div>`).join('');
      if (v.type === 'duo') rows += `<div class="r"><span>광고비 1원당 매출</span><b>${nf(S.roas.total[i] / 100, 1)}원</b></div>`;
      const main = v.series.find(x => x.emph) || v.series[0], du = v.type === 'duo' ? '' : v.suffix, dd = v.type === 'duo' ? 0 : v.dec;
      const cmpRow = [['전분기', 3], ['전년 동월', 12]].filter(([, o]) => i - o >= 0 && main.values[i - o] != null).map(([lb, o]) => `${lb}(${mLabel(S.months[i - o])}) ${nf(main.values[i - o], dd)}${du}`).join(' · ');
      if (cmpRow) rows += `<div class="f" style="margin-top:4px">${main.name} — ${cmpRow}</div>`;
      const partial = i === lastIdx && S.partialLast ? (v.type === 'duo' ? ' (1~9일 → 30일 환산)' : ' (1~9일)') : '';
      showTip(`<div class="t">${S.months[i].replace('-', '년 ')}월${partial}</div>${rows}<div class="f">${phase}${i >= tenureIdx ? ' · 입사 후 ' + (i - tenureIdx + 1) + '개월째' : ''}</div>`, cx, cy);
    };
    const clear = () => { cross.style.opacity = '0'; dots.forEach(sr => sr._dots.forEach(c => c && c.setAttribute('r', 0))); $$('rect[data-i]', marks).forEach(r => r.style.filter = ''); refs.forEach(([ln, lb]) => { ln.style.opacity = '0'; lb.style.opacity = '0'; }); hideTip(); };
    hit.addEventListener('pointermove', ev => { const r = svg.getBoundingClientRect(); const i = clamp(Math.floor(((ev.clientX - r.left) / r.width * W - m.l) / step), 0, N - 1); tipAt(i, ev.clientX, ev.clientY); });
    hit.addEventListener('pointerleave', clear);
    box.tabIndex = 0; box.setAttribute('aria-label', `${v.title} 차트 — 좌우 방향키로 월을 이동합니다`);
    let ki = lastIdx;
    box.onkeydown = e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault();
      ki = clamp(ki + (e.key === 'ArrowRight' ? 1 : -1), 0, N - 1);
      const r = svg.getBoundingClientRect(); tipAt(ki, r.left + (X(ki) / W) * r.width, r.top + r.height * 0.3);
    };
    box.onblur = clear;
    box.replaceChildren(svg);
    if (animate !== false && !reduceMotion) {
      $$('path.draw', svg).forEach(p => { const len = p.getTotalLength(); p.animate?.([{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: '0' }], { duration: 1100, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'backwards' }); });
      animateSegs(svg, 200);
      $$('.fade', svg).forEach(f => f.animate?.([{ opacity: 0 }, { opacity: getComputedStyle(f).opacity }], { duration: 700, delay: 500, fill: 'backwards' }));
      $$('rect.grow', svg).forEach(r => { r.style.transformBox = 'fill-box'; r.style.transformOrigin = '50% 100%'; r.animate?.([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 520, delay: +r.dataset.i * 22, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'backwards' }); });
    }
  }

  // 「세부 수치 보기」 — 차트 위에 월별 값을 직접 적는다 (좁은 화면에서는 한 달씩 건너뛰기)
  function drawValueLabels(v, svg, o) {
    const g = s('g', { class: 'vlabs', 'pointer-events': 'none' }, svg);
    const skip = i => o.narrow && i % 2 === 1 && i !== lastIdx;
    if (v.type === 'duo') {
      S.index.revenue.forEach((val, i) => { if (!skip(i)) txt(g, o.X(i), v._Yr(val) - 9, nf(val, 0), 'vlab', 'middle'); });
      S.index.spend.forEach((val, i) => { if (!skip(i)) txt(g, o.X(i), v._Ys(val) - 4, nf(val, 0), 'vlab', 'middle'); });
    } else if (v.type === 'line') {
      // 모든 계열에 값 표시 — 계열별 묶음(data-sid)이라 범례 포커스 때 함께 흐려진다
      // 같은 달 라벨이 겹치면 점 아래로 내리거나 한 줄씩 밀어낸다
      const groups = v.series.map(sr => s('g', { 'data-sid': sr.id }, g));
      const tint = sr => sr.emph || v.series.length === 1 ? '' : `fill:color-mix(in srgb, ${sr.color} 55%, var(--ink))`;
      S.months.forEach((mo, i) => {
        if (skip(i)) return;
        const items = v.series.map((sr, k) => ({ sr, k, val: sr.values[i] })).filter(it => it.val != null).sort((a, b) => b.val - a.val);
        const placed = [];
        items.forEach(it => {
          const py = v._Y(it.val), clash = y => placed.some(p => Math.abs(p - y) < 12);
          let y = py - 9;
          if (clash(y)) y = py + 17;
          while (clash(y)) y += 12;
          placed.push(y);
          txt(groups[it.k], o.X(i), y, nf(it.val, v.dec), 'vlab', 'middle', tint(it.sr));
        });
      });
    } else if (v.type === 'stack') {
      S.months.forEach((mo, i) => { let acc = 0; v.series.forEach(sr => { const val = sr.values[i] || 0; const mid = acc + val / 2; acc += val; if (val >= 8 && !skip(i)) txt(g, o.X(i), v._Y(mid) + 3.5, nf(val, 0), 'vlab inbar', 'middle'); }); });
    }
  }

  function renderCmp(v) {
    const c = v.cmp;
    const b0 = c.cols.map(([, get]) => get(P.B));
    const head = `<thead><tr><th>기간</th>${c.cols.map(([h]) => `<th>${h}</th>`).join('')}</tr></thead>`;
    const body = PKEYS.map(k => {
      const p = P[k];
      const cells = c.cols.map(([, get], ci) => {
        const val = get(p);
        let delta = '';
        if (c.deltaCol === ci && k !== 'B' && val != null && b0[ci] != null) {
          const dv = val - b0[ci]; const good = c.lowerIsBetter ? dv < 0 : dv > 0;
          const txtD = c.deltaUnit === '%p' ? `${dv > 0 ? '+' : ''}${nf(dv, c.dec)}%p` : `${dv > 0 ? '+' : ''}${nf(dv / b0[ci] * 100, 0)}%`;
          delta = `<div class="delta ${good ? 'up' : 'down'}">${good ? '▲' : '▼'} ${txtD.replace('-', '−')}</div>`;
        }
        return `<td><span class="num">${nf(val, c.dec)}</span>${delta}</td>`;
      }).join('');
      return `<tr class="${k === 'B' ? 'is-before' : k === 'MTD' ? 'is-now' : ''}"><td>${p.name}<div style="font-size:11.5px;color:var(--ink-3)">${p.span}</div></td>${cells}</tr>`;
    }).join('');
    $('#cmpTable').innerHTML = head + `<tbody>${body}</tbody>`;
    $('#cmpNote').textContent = c.note + (c.deltaCol != null ? ' · 증감은 입사 전 6개월 대비' : '');
  }

  function renderTable(v) {
    const dec = sr => v.type === 'duo' ? 2 : v.dec;
    const head = `<thead><tr><th>월</th>${v.series.map(sr => `<th>${sr.name}${v.type === 'duo' ? ' (지수)' : ''}</th>`).join('')}</tr></thead>`;
    const body = S.months.map((mo, i) => `<tr class="${i === tenureIdx ? 'tenure-start' : ''}"><td>${mo.replace('-', '.')}${i === lastIdx && S.partialLast ? (v.type === 'duo' ? ' (30일 환산)' : ' (1~9일)') : ''}${i === tenureIdx ? ' · 입사' : ''}</td>${v.series.map(sr => `<td>${nf(sr.values[i], dec(sr))}</td>`).join('')}</tr>`).join('');
    $('#perfTable').innerHTML = `<table>${head}<tbody>${body}</tbody></table>`;
  }

  /* ------------------------------------------------------------ projects */
  const linkOf = id => id === 'dashboard' ? '#dash' : '#p-' + id;
  function renderProjects() {
    const host = $('#projects');
    R.projects.filter(p => !p.featured).forEach(p => {
      const card = el('article', { class: 'proj' + (p.wide ? ' wide' : ''), id: 'p-' + p.id, 'aria-labelledby': 'pt-' + p.id });
      const facts = p.facts.map(f => `<li><span class="fv">${f.from ? `<span class="from">${f.from}</span><span class="ar">→</span>` : ''}<span class="to" data-roll-from="${f.from ? f.from.replace(/,/g, '') : ''}" data-roll-to="${f.v}">${f.v}</span><small class="fu">${f.u || ''}</small>${f.d ? `<span class="fd">${f.d}</span>` : ''}</span><span class="fk">${f.k}</span>${f.s ? `<span class="fs">${f.s}</span>` : ''}${R.config.showAbsolute && f.abs ? `<span class="abs">${f.abs}</span>` : ''}</li>`).join('');
      card.innerHTML = `
        <div class="player" data-scene="${p.motion}" ${p.video ? `data-video="${p.video}"` : ''}><div class="stage"></div></div>
        <div class="proj-body">
          <div class="proj-meta">${p.pill ? `<span class="pill ${p.pill.c}">${p.pill.t}</span>` : ''}${p.meta.map(x => `<span>${x}</span>`).join('<span aria-hidden="true">·</span>')}</div>
          <h3 id="pt-${p.id}">${p.title}</h3>
          <p class="hook">${p.hook}</p>
          <ul class="facts">${facts}</ul>
          <ul class="how">${p.how.map(x => `<li>${x}</li>`).join('')}</ul>
        </div>`;
      host.appendChild(card);
    });
    $$('.player', host).forEach(pl => window.MOTION && window.MOTION.mount(pl, { scene: pl.dataset.scene, video: pl.dataset.video }));
    $$('.proj', host).forEach(c => onFirstView(c, () => rollNumbers(c), 0.3));
  }

  /* ------------------------------------------------------------ demo modal */
  const modal = $('#demoModal'); let lastFocus = null;
  function openDemo(src) {
    lastFocus = document.activeElement;
    const f = $('#demoFrame'); if (f.getAttribute('src') !== src) f.setAttribute('src', src);
    $('#demoNewTab').setAttribute('href', src);
    modal.hidden = false; document.body.style.overflow = 'hidden';
    window.MOTION && window.MOTION.pauseAll();
    $('[data-close].iconbtn', modal).focus();
  }
  function closeDemo() { modal.hidden = true; document.body.style.overflow = ''; lastFocus && lastFocus.focus(); }
  modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeDemo(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeDemo(); });

  /* ------------------------------------------------------------ pillars */
  function shortTitle(id) { const p = R.projects.find(x => x.id === id); return p ? p.title.split(' — ')[0] : id; }
  function renderPillars() {
    $('#pillarGrid').innerHTML = R.pillars.map(p => `
      <article class="pillar">
        <div class="ptop"><span class="pe" aria-hidden="true">${p.e || ''}</span><span class="pk">${p.k}</span></div>
        <h3>${p.h}</h3>
        <p>${p.p}</p>
        <ul class="proof">${p.proof.map(([v, u, k]) => `<li><span class="pv">${v}<small>${u}</small></span><span class="pl">${k}</span></li>`).join('')}</ul>
        ${p.ev.length ? `<div class="ev">사례 ${p.ev.map(id => `<a href="${linkOf(id)}">${shortTitle(id)}</a>`).join('')}</div>` : '<div class="ev">사례 <a href="#career">경력 — 거성디지털 · 이화에스엠피</a></div>'}
      </article>`).join('');
    $('#toolRow').innerHTML = R.tools.map(([h, list]) => `<div class="toolgrp"><h4>${h}</h4><div class="tools">${list.map(t => t[0] === '*' ? `<span class="hot">${t.slice(1)}</span>` : `<span>${t}</span>`).join('')}</div></div>`).join('');
    // 부수적인 스킬은 버튼 뒤에 숨겨 두고, 누르면 연한 작은 칩으로 펼친다
    const more = R.toolsMore, box = $('#toolMore');
    if (more && more.length && box) {
      const cnt = more.reduce((n, [, l]) => n + l.length, 0);
      $('#toolRow .toolgrp:last-child').insertAdjacentHTML('beforeend', `<button class="morebtn" id="toolMoreBtn" type="button" aria-expanded="false" aria-controls="toolMore">더 보기 <span>+${cnt}</span><i aria-hidden="true">▾</i></button>`);
      box.innerHTML = more.map(([h, list]) => `<div class="toolgrp"><h4>${h}</h4><div class="tools">${list.map(t => `<span>${t}</span>`).join('')}</div></div>`).join('');
      $('#toolMoreBtn').addEventListener('click', e => {
        const open = box.hidden; box.hidden = !open;
        e.currentTarget.setAttribute('aria-expanded', String(open));
        e.currentTarget.firstChild.textContent = open ? '접기 ' : '더 보기 ';
      });
    }
  }

  /* ------------------------------------------------------------ career */
  function ym(v) { const [y, mo] = v.split('.').map(Number); return y + (mo - 1) / 12; }
  function renderCareer() {
    const now = ym(R.config.asOf.slice(0, 7).replace('-', '.'));
    const jobs = R.jobs, exp = R.experience || [];
    const all = [...jobs.map(j => ({ ...j, kind: 'job' })), ...exp.map(e => ({ ...e, kind: 'exp' }))];
    const t0 = 2016, t1 = Math.ceil(now + 0.1);
    const host = $('#gantt');
    const draw = () => {
      // 좁은 화면(휴대폰)은 가로 스크롤 없이 한 화면에 — 회사 이름 칸과 오른쪽 여백을 줄이고 연도는 2년 간격
      const narrow = host.clientWidth < 600;
      const W = narrow ? Math.max(300, host.clientWidth - 20) : Math.max(640, host.clientWidth - 36), rowH = 30, m = narrow ? { l: 92, r: 66, t: 22, b: 8 } : { l: 150, r: 84, t: 22, b: 8 };
      const rows = [...all].sort((a, b) => ym(b.from) - ym(a.from));
      const H = m.t + rows.length * rowH + m.b;
      const X = t => m.l + (t - t0) / (t1 - t0) * (W - m.l - m.r);
      const svg = s('svg', { viewBox: `0 0 ${W} ${H}` });
      for (let y = t0; y <= t1; y++) {
        s('line', { x1: X(y), x2: X(y), y1: m.t - 6, y2: H - m.b, style: 'stroke:var(--grid)' }, svg);
        if (y < t1 && (!narrow || y % 2 === 0)) txt(svg, X(y) + 3, 12, String(y), 'tick', 'start');
      }
      rows.forEach((r, k) => {
        const y = m.t + k * rowH;
        const a = ym(r.from), b = r.to ? ym(r.to) + 1 / 12 : now + 1 / 12;
        txt(svg, 0, y + 17, r.gantt || r.co, 'g-lab', 'start', r.kind === 'exp' ? 'fill:var(--ink-3);font-weight:500' : null);
        const years = b - a; const yy = Math.floor(years + 1e-6), mm = Math.round((years - yy) * 12);
        const col = r.now ? 'var(--accent)' : r.kind === 'exp' ? 'var(--rule-2)' : 'var(--ink-2)';
        const bw = Math.max(4, X(b) - X(a));
        const row = s('g', { class: 'grow-row' + (r.now ? ' is-now' : ''), 'data-co': r.co }, svg);
        s('rect', { x: 0, y: y + 2, width: W, height: rowH - 4, rx: 6, class: 'g-hl', style: 'fill:var(--accent-soft);opacity:0' }, row);
        txt(row, 0, y + 17, r.gantt || r.co, 'g-lab', 'start', r.kind === 'exp' ? 'fill:var(--ink-3);font-weight:500' : null);
        s('rect', { x: X(a), y: y + 7, width: bw, height: 14, rx: 3, class: 'g-bar', style: `fill:${col};opacity:${r.now ? 1 : .85}` }, row);
        if (r.now) {
          // 현 직장: 막대 위로 빛줄기가 주기적으로 스친다
          const cid = 'gclip' + k;
          s('rect', { x: X(a), y: y + 7, width: bw, height: 14, rx: 3 }, s('clipPath', { id: cid }, s('defs', {}, svg)));
          s('rect', { x: X(a) - 30, y: y + 5, width: 22, height: 18, class: 'gsweep', 'clip-path': `url(#${cid})`, style: `--gw:${bw + 60}px;fill:#fff;opacity:.55` }, row);
        }
        txt(row, X(b) + 6, y + 18, `${yy ? yy + '년 ' : ''}${mm ? mm + '개월' : ''}`.trim(), 'g-sub', 'start');
      });
      host.replaceChildren(svg);
      host.scrollLeft = host.scrollWidth; // 좁은 화면에서는 최근 경력이 먼저 보이게
      // 타임라인 ↔ 경력 카드 서로 강조
      $$('.grow-row', svg).forEach(g => {
        g.addEventListener('mouseenter', () => linkCareer(g.dataset.co, true));
        g.addEventListener('mouseleave', () => linkCareer(g.dataset.co, false));
        // 회사 이름(행)을 누르면 아래 해당 경력 카드로 이동
        const card = $$('#jobs .job').find(j => j.dataset.co === g.dataset.co);
        if (!card) return;
        g.classList.add('go'); g.setAttribute('role', 'link'); g.setAttribute('tabindex', '0'); g.setAttribute('aria-label', `${g.dataset.co} 경력 보기`);
        const go = () => {
          const mastH = $('.mast').offsetHeight;
          scrollTo({ top: card.getBoundingClientRect().top + scrollY - mastH - 12, behavior: reduceMotion ? 'auto' : 'smooth' });
          card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
        };
        g.addEventListener('click', go);
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      });
    };
    draw(); observeWidth(host, draw);
    function linkCareer(co, on) {
      $$('#gantt .grow-row').forEach(g => { g.classList.toggle('dim', on && g.dataset.co !== co); g.classList.toggle('on', on && g.dataset.co === co); });
      $$('#jobs .job').forEach(j => { j.classList.toggle('linked', on && j.dataset.co === co); j.classList.toggle('dimmed', on && j.dataset.co !== co); });
    }
    $('#jobs').addEventListener('mouseover', e => { const j = e.target.closest('.job'); if (j) linkCareer(j.dataset.co, true); });
    $('#jobs').addEventListener('mouseleave', () => linkCareer('', false));
    $('#jobs').innerHTML = jobs.map(j => `
      <article class="job${j.now ? ' is-now' : ''}" data-co="${j.co}">
        <div class="job-side">
          ${j.now ? '<span class="now">재직 중</span>' : ''}
          <div class="co">${j.co}<small>${j.sub}</small></div>
          <div class="per">${j.from} – ${j.to || '현재'}</div>
          <div class="role">${j.role}</div>
        </div>
        <div class="job-main">
          <p class="scope">${j.scope}</p>
          <div class="groups">${[...j.groups].sort((a, b) => /^성과/.test(a.h) - /^성과/.test(b.h)) /* 성과(결과)는 항상 오른쪽 */
            .map(g => `<div class="${/^성과/.test(g.h) ? 'g-result' : ''}"><h4>${g.h}</h4><ul>${g.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}</div>
          ${j.see ? `<div class="see">관련 사례 ${j.see.map(id => `<a href="${linkOf(id)}">${shortTitle(id)}</a>`).join(' · ')}</div>` : ''}
        </div>
      </article>`).join('');
    draw(); // 경력 카드가 생긴 뒤 다시 그려야 회사 이름 → 카드 이동이 연결된다
    const CN = R.careerNote, cn = $('#careerNote');
    if (CN && cn) { cn.hidden = false; cn.innerHTML = `<span class="cq">${CN.q}</span><p class="ca">“${CN.a}”</p><p class="cp">${CN.p}</p>`; }
  }

  /* ------------------------------------------------------------ archive */
  function renderArchive() {
    const A = R.archive; if (!A || !A.items || !A.items.length) return;
    const sec = $('#archive'); sec.hidden = false;
    $('#archive-lede').textContent = A.lede;
    $('#archiveNote').textContent = A.note || '';
    const grid = $('#archiveGrid');
    A.items.forEach(it => {
      const f = el('figure', { class: 'arc' }, `
        <button type="button" aria-label="${it.title} 크게 보기"><img src="${it.src}" alt="${it.alt || it.title}" loading="lazy" decoding="async">${it.kind ? `<span class="kind">${it.kind}</span>` : ''}</button>
        <figcaption><b>${it.title}</b><span>${[it.co, it.year].filter(Boolean).join(' · ')}</span>${it.caption ? `<p>${it.caption}</p>` : ''}</figcaption>`);
      f.querySelector('img').addEventListener('error', () => { f.remove(); if (!grid.children.length) sec.hidden = true; });
      f.querySelector('button').addEventListener('click', () => openLightbox(it));
      grid.appendChild(f);
    });
  }
  const lb = $('#lightbox');
  function openLightbox(it) { $('#lbImg').src = it.src; $('#lbImg').alt = it.alt || it.title; $('#lbCap').textContent = `${it.title}${it.caption ? ' — ' + it.caption : ''}`; lb.hidden = false; }
  lb.addEventListener('click', () => { lb.hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) lb.hidden = true; });

  /* ------------------------------------------------------------ beliefs · facts */
  function renderRest() {
    $('#beliefList').innerHTML = R.beliefs.map(b => `<article class="belief"><span class="q" aria-hidden="true">“</span><div><h3>${b.h}</h3><p>${b.p}</p>${b.ev ? `<span class="bev">${b.ev}</span>` : ""}</div></article>`).join('');
    const F = R.facts;
    const sec = (h, list) => `<section><h3>${h}</h3><dl>${list.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></section>`;
    $('#factGrid').innerHTML = (F.seeking && F.seeking.length ? sec('찾고 있는 자리', F.seeking) : '') + sec('자격', F.certs) + sec('학력 · 교육', F.edu) + sec('기타', F.etc);
    const fa = $('#f-asof'); if (fa) fa.textContent = R.config.asOf;
    const fl = $('#footLine'); const Pf = R.profile;
    if (fl) fl.innerHTML = `© ${Pf.name} · 2026<span class="fsep">/</span><a href="mailto:${Pf.email}">${Pf.email}</a><span class="fsep">/</span><a href="tel:${Pf.phone.replace(/-/g, '')}">${Pf.phone}</a>`;
  }

  /* ------------------------------------------------------------ 직무점수 */
  function renderScores() {
    const Sc = R.scores; if (!Sc) return;
    $('#scores-h').textContent = Sc.title; $('#scores-note').textContent = Sc.note;
    const C = 2 * Math.PI * 52;
    $('#scoreGrid').innerHTML = Sc.items.map(it => `
      <article class="score">
        <div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="rt"/><circle cx="60" cy="60" r="52" class="rv" style="stroke-dasharray:${C};stroke-dashoffset:${C * (1 - it.v / 100)}"/></svg>
          <div class="rn"><span class="shine" data-roll-from="0" data-roll-to="${it.v}">${it.v}</span><small>점</small></div></div>
        <div class="sb"><h4>${it.k}</h4><p>${it.why}</p><ul>${it.ev.map(e => `<li>${e}</li>`).join('')}</ul></div>
      </article>`).join('');
    onFirstView($('#scoreGrid'), () => {
      $$('.score .rv').forEach((c, i) => c.animate?.([{ strokeDashoffset: C }, { strokeDashoffset: c.style.strokeDashoffset }], { duration: 1300, delay: i * 150, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' }));
      rollNumbers($('#scoreGrid'));
    }, 0.3);
  }

  /* ------------------------------------------------------------ ticker */
  function renderTicker() {
    const T = R.ticker; if (!T || !T.length) return;
    const item = t => `<span class="tk-item"><span aria-hidden="true">${t[0]}</span>${t[1]} <b>${t[2]}</b></span>`;
    const once = T.map(item).join('<span class="tk-sep" aria-hidden="true">·</span>');
    $('#tkTrack').innerHTML = `<span class="tk-run">${once}<span class="tk-sep" aria-hidden="true">·</span></span><span class="tk-run" aria-hidden="true">${once}<span class="tk-sep">·</span></span>`;
    /* (2026-09-19) LIVE 옆 날짜 = 보는 날(오늘) — 자동으로 최신 날짜가 된다.
       데이터 기준일(R.config.asOf)은 성과 섹션 · 꼬리말에 그대로 두고, 여기서는 말풍선으로만 알린다 */
    paintLiveDate();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) paintLiveDate(); });
  }

  function paintLiveDate() {
    const el = $('#tkAsOf'); if (!el) return;
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const ymd = String(d.getFullYear()).slice(2) + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
    if (el.textContent === ymd) return;
    el.textContent = ymd;
    const chip = el.closest('.tk-live');
    if (chip) chip.title = '오늘 ' + ymd + ' · 데이터 기준일 ' + R.config.asOf;
  }


  /* ------------------------------------------------------------ 기간 자동 계산
     "입사 후 N개월" · "N년 N개월" 을 손으로 고치지 않도록 오늘 날짜로 채운다.
     · 근속 = 입사월로부터 지난 개월(경과)
     · 총 경력 = jobs 의 각 구간을 시작월·종료월 포함으로 더한 값 (experience 는 제외) */
  function ym2n(s) { if (!s) return null; const m = String(s).match(/([0-9]{4})[^0-9]([0-9]{1,2})/); return m ? (+m[1]) * 12 + (+m[2]) : null; }
  function fmtMonths(m) { const y = Math.floor(m / 12), r = m % 12; return r ? y + '년 ' + r + '개월' : y + '년'; }
  function paintPeriods() {
    const d = new Date(), today = d.getFullYear() * 12 + (d.getMonth() + 1);
    const cur = (R.jobs || []).find(j => j.now) || (R.jobs || [])[0];
    const tenure = cur ? Math.max(0, today - ym2n(cur.from)) : 0;
    let total = 0;
    (R.jobs || []).forEach(j => {
      const f = ym2n(j.from); if (f == null) return;
      const t = j.now || !j.to ? today : ym2n(j.to);
      if (t != null && t >= f) total += t - f + 1;
    });
    const txt = { tenure: tenure + '개월', career: fmtMonths(total) };
    document.querySelectorAll('[data-auto]').forEach(el => { const v = txt[el.dataset.auto]; if (v) el.textContent = v; });
    if (total) R.profile.career = '경력 ' + txt.career;
  }

  /* ------------------------------------------------------------ 움직임 예산
     끝없이 도는 장식 애니메이션(숫자 반짝임 · 띠 쓸림 · 점 깜빡임)은
       · 화면 밖으로 나가면 멈추고
       · 다른 탭을 보고 있으면 전부 멈춘다.
     보고 있는 동안의 움직임은 그대로다 — 노트북 배터리와 발열만 줄인다. */
  const LOOPERS = '.shine, .pulse, .job.is-now, .job-side .now, .gsweep, .gi-sweep';
  function wireAnimBudget() {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('anim-idle', !e.isIntersecting)), { rootMargin: '150px 0px' });
      $$(LOOPERS).forEach(n => io.observe(n));
    }
    const hold = () => document.documentElement.classList.toggle('anim-hold', document.hidden);
    document.addEventListener('visibilitychange', hold); hold();
  }
  /* ------------------------------------------------------------ chrome */
  function wireChrome() {
    const root = document.documentElement; const label = $('#themeLabel');
    const names = { system: '자동', light: '라이트', dark: '다크' };
    const cur = () => root.getAttribute('data-theme') || 'system';
    label.textContent = names[cur()];
    $('#themeBtn').addEventListener('click', () => {
      const next = { system: 'light', light: 'dark', dark: 'system' }[cur()];
      if (next === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', next);
      try { next === 'system' ? localStorage.removeItem('psj-theme') : localStorage.setItem('psj-theme', next); } catch (e) {}
      label.textContent = names[next];
      window.MOTION && window.MOTION.redrawAll();
    });
    $('#printBtn').addEventListener('click', () => window.print());
    /* (2026-09-20) 요약 인쇄 — 전체 리포트는 A4 22장이라 메일로 보내기 무겁다.
       누르면 첫 화면 · 결정적 수치 · 역량 · 경력 · 연락처만 남겨 11장으로 줄인다. */
    const sb = $('#shortBtn');
    /* (2026-09-26) 누르면 요약 모드만 켜지고 화면에는 변화가 없어 고장 난 것처럼 보였다 —
       이제 누르면 바로 요약본으로 인쇄 창을 띄우고, 끝나면 전체로 되돌린다. */
    if (sb) sb.addEventListener('click', () => {
      document.body.classList.add('print-short');
      const off = () => { document.body.classList.remove('print-short'); removeEventListener('afterprint', off); };
      addEventListener('afterprint', off);
      window.print();
      setTimeout(off, 1500);   // afterprint 가 오지 않는 브라우저 대비
    });
    document.addEventListener('click', async e => {
      const b = e.target.closest('[data-copy]'); if (!b) return;
      const span = b.querySelector('span'); const old = span.textContent;
      try { await navigator.clipboard.writeText(b.dataset.copy); span.textContent = '복사됨'; }
      catch (err) { span.textContent = b.dataset.copy; }
      setTimeout(() => span.textContent = old, 1600);
    });
    const links = $$('.mast nav a'); const secs = links.map(a => $(a.getAttribute('href')));
    const mast = $('.mast');
    // 메뉴 이동: 고정 헤더 높이(좁은 화면에서는 두 줄)를 빼고 섹션 제목이 바로 보이는 위치로
    const setMastH = () => document.documentElement.style.setProperty('--mast-h', mast.offsetHeight + 'px');
    setMastH(); addEventListener('resize', setMastH);
    links.forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href')); if (!t) return;
      e.preventDefault();
      const y = a.getAttribute('href') === '#top' ? 0 : t.getBoundingClientRect().top + scrollY - mast.offsetHeight - 8;
      scrollTo({ top: Math.max(0, y), behavior: reduceMotion ? 'auto' : 'smooth' });
      try { history.replaceState(null, '', a.getAttribute('href')); } catch (err) {}
    }));
    // 왼쪽 위 이름(박성준 Growth Report 2026)을 누르면 맨 위로
    $('.mast .id').addEventListener('click', e => {
      e.preventDefault(); scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      try { history.replaceState(null, '', '#top'); } catch (err) {}
    });
    const spy = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      mast.style.setProperty('--p', max > 0 ? (scrollY / max).toFixed(4) : 0);
      const y = scrollY + 120; let c = -1;
      secs.forEach((sec, i) => { if (sec && sec.offsetTop <= y) c = i; });
      links.forEach((a, i) => a.setAttribute('aria-current', String(i === c)));
    };
    addEventListener('scroll', spy, { passive: true }); spy();
  }

  /* ------------------------------------------------------------ boot */
  applyAngle();
  paintPeriods();
  renderTicker();
  renderHero();
  renderBoard();
  renderGrowth();
  renderShowcase();
  renderPerf();
  renderProjects();
  renderPillars();
  renderCareer();
  renderArchive();
  renderRest();
  renderScores();
  wireChrome();
  wireAnimBudget();
  onFirstView($('#kpis'), () => setTimeout(() => rollNumbers($('#kpis')), reduceMotion ? 0 : 200), 0.2);
  onFirstView($('#perfChart'), () => drawPerf(true), 0.2);
})();
