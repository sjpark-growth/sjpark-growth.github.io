/* =========================================================================
   주제별 보기 (topics.html · 2026-11-15 시험 페이지)
   본인 「각 페이지별 드롭다운식 한 주제씩 볼 수 있는 형태 — 쇼핑 인사이트 GNB 처럼 한 주제에 하나씩만, 드래그로 보는 웹사이트처럼 · 고급스러운 수준」.
   · 내용은 본판과 같다 — app.js 가 index.html 과 같은 틀(topics.html)에 그린 절을 주제 판(panel) 8장으로 옮겨 가로로 늘어놓는다(위치만 옮김 · 다시 그리지 않음)
   · 위 탭(주제 이름) = 한 번에 한 판. 탭에 마우스를 올리면 그 주제 안 항목이 드롭다운으로 펼쳐지고, 누르면 그 판의 그 자리로 간다
   · 넘기기: 좌우 드래그 · 손가락 스와이프 · ← → 키 · 트랙패드 가로 밀기 · 아래 진행 점 · 이전 / 다음. 판 안은 세로로 스크롤
   · 주소 #/perf 처럼 판마다 따로(뒤로 가기 됨). 동작 줄이기면 미끄러짐 · 차례 등장 없이 바로 바뀐다
   · html.tabmode 일 때만 돈다 — app.js 의 스크롤 등장(wireReveal)은 이 모드에서 꺼지고, 판에 들어올 때마다 여기서 차례 등장을 다시 돌린다
   ========================================================================= */
(function () {
  'use strict';
  const root = document.documentElement;
  if (!root.classList.contains('tabmode')) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const el = (tag, attrs, html) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v); if (html != null) e.innerHTML = html; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const txt = n => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const short = s => s.split(' — ')[0];

  /* 주제 — 판에 넣을 절(secs)과 드롭다운 항목(sub: [이름, 대상] 또는 함수) */
  const TOPICS = [
    { id: 'intro', label: '소개', en: 'Intro', desc: '첫인상 — 성과 리포트 · 핵심 성과 · 핵심 요약', secs: ['.hero', '#summary'],
      sub: () => [['성과 리포트', '.mboard-wrap'], ['핵심 성과', '.hkey'], ['핵심 요약', '#summary .sum-l'], ['그 밖의 개선', '#summary .more']] },
    { id: 'dash', label: '대시보드', en: 'Dashboard', desc: '직접 만든 운영 도구 — 화면의 숫자는 모두 임의 값', secs: ['#dash'],
      sub: () => [['대시보드 데모', '.dash-frame'], ['구축 내용', '.dash-side']] },
    { id: 'perf', label: '성과', en: 'Performance', desc: '16개월, 네 단계로 바꾼 숫자', secs: ['#perf'],
      sub: () => [['성과 차트', '#perf .perf > .panel:first-child'], ['기간 비교', '#perf .cmp'], ['네 단계', '#phaseList']] },
    { id: 'growth', label: '그로스', en: 'Growth', desc: '광고 밖 — 첫 화면 · 카테고리 · 쿠폰 구조', secs: ['#growth'],
      sub: () => $$('#gcards .gcard').map(c => [txt($('h3', c)), c]) },
    { id: 'work', label: '주요 업무', en: 'Projects', desc: '실제 데이터로 움직이는 영상과 함께 보는 프로젝트', secs: ['#work'],
      sub: () => $$('#projects .proj').map(c => [short(txt($('h3', c))), c]) },
    { id: 'pillars', label: '역량', en: 'Capabilities', desc: 'MD · 퍼포먼스 · 자동화 · 리더십', secs: ['#pillars'],
      sub: () => $$('#pillarGrid .pillar').map(c => [txt($('h3', c)), c]).concat([['툴', '#toolRow']]) },
    { id: 'career', label: '경력', en: 'Career', desc: '상품 매칭 · 가격비교로 시작해 그로스까지', secs: ['#career', '#archive'],
      sub: () => [['경력 타임라인', '#gantt']].concat($$('#jobs .job').map(j => [j.dataset.co || txt($('.co', j)), j])).concat($('#archive') && !$('#archive').hidden ? [['참고 자료', '#archive']] : []) },
    { id: 'contact', label: '원칙 · 연락처', en: 'Contact', desc: '일하는 원칙 네 가지와 연락처 · 직무 점수', secs: ['#beliefs', '#contact', '.foot'],
      sub: () => [['일하는 원칙', '#beliefs'], ['연락처', '#contact .sec-h'], ['직무 점수', '.scorebox'], ['인적 사항', '#factGrid']] },
  ];
  const N = TOPICS.length;
  const pad = n => String(n).padStart(2, '0');

  /* ---------- 판 만들기 — 절을 옮긴다(이벤트 · 관찰자는 그대로 따라간다) */
  const main = $('main');
  const stage = el('div', { class: 'tm-stage' });
  const track = el('div', { class: 'tm-track' });
  const panels = TOPICS.map((t, i) => {
    const p = el('section', { class: 'tm-panel', id: 'tm-' + t.id, role: 'tabpanel', 'aria-labelledby': 'tmt-' + t.id, tabindex: '-1' });
    if (i) p.appendChild(el('div', { class: 'tm-idx', 'aria-hidden': 'true' }, pad(i + 1)));
    const inner = el('div', { class: 'tm-inner' });
    t.secs.forEach(sel => { const s = $(sel); if (s) inner.appendChild(s); });
    p.appendChild(inner); track.appendChild(p);
    return p;
  });
  stage.appendChild(track); main.appendChild(stage);

  /* 판에 들어올 때 차례로 떠오를 덩어리(--k = 순번, 8 에서 멈춤) */
  const ANIM = '.tm-idx, .hero-l > *, .hero-r > *, #summary .shell > *, .sec-h > *, .growth-h > *, .dash-wrap > *, .perf > *, .phases > li, .gcards > *, .gextra, .projects > .proj, .pillars > *, .toolrow, .gantt, .cnote, .jobs > *, .archive > *, .beliefs > *, .contact.big, .scorebox, .factgrid > *, .foot .shell > *';
  panels.forEach(p => {
    const vh = innerHeight; let k = 0;
    $$(ANIM, p).forEach(n => {
      if (n.closest('[hidden]')) return;
      n.classList.add('tm-anim');
      // 판 첫 화면 안에 들어오는 것만 차례로(아래쪽은 같은 늦춤 — 스크롤해 내려가면 이미 떠 있다)
      n.style.setProperty('--k', Math.min(k++, 8));
    });
  });

  /* ---------- 위 탭(GNB) · 미끄러지는 표시 · 드롭다운 */
  const mast = $('.mast'), oldNav = $('.mast nav');
  const nav = el('nav', { class: 'tm-nav', role: 'tablist', 'aria-label': '주제' });
  const tabs = TOPICS.map((t, i) => {
    const a = el('a', { class: 'tm-tab', id: 'tmt-' + t.id, role: 'tab', href: '#/' + t.id, 'aria-controls': 'tm-' + t.id, 'aria-selected': 'false', tabindex: '-1', 'data-i': i },
      `<span class="n">${pad(i + 1)}</span><span class="l">${t.label}</span>`);
    nav.appendChild(a); return a;
  });
  const ind = el('span', { class: 'tm-ind', 'aria-hidden': 'true' });
  nav.appendChild(ind);
  if (oldNav) oldNav.replaceWith(nav); else $('.mast .shell').appendChild(nav);
  const back = el('a', { class: 'iconbtn tm-back', href: 'index.html', title: '한 페이지로 이어 보기(본판)' }, '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 4h10M3 8h10M3 12h10"/></svg><span>스크롤로 보기</span>');
  $('.mast .tools').prepend(back);

  const drop = el('div', { class: 'tm-drop', id: 'tmDrop', hidden: '' });
  mast.appendChild(drop);
  let dropT = 0, dropFor = -1;
  const fillDrop = (i, all) => {
    const list = all ? TOPICS.map((t, k) => [k, t]) : [[i, TOPICS[i]]];
    drop.classList.toggle('all', !!all);
    drop.innerHTML = `<div class="tm-drop-in">${list.map(([k, t]) => {
      const sub = (t.sub() || []).filter(x => x && x[0]);
      return `<section class="tm-dg"><button type="button" class="tm-dh" data-go="${k}"><span class="n">${pad(k + 1)}</span><b>${t.label}</b><small>${t.en}</small></button>
        ${all ? '' : `<p class="tm-dd">${t.desc}</p>`}
        <ul>${sub.map(([name], j) => `<li><button type="button" data-go="${k}" data-j="${j}"><span>${name}</span><i aria-hidden="true">→</i></button></li>`).join('')}</ul></section>`;
    }).join('')}</div>`;
    drop._subs = list.map(([k, t]) => [k, t.sub()]);
  };
  const openDrop = (i, all, kbd) => {
    clearTimeout(dropT);
    if (dropFor !== (all ? 'all' : i)) { fillDrop(i, all); dropFor = all ? 'all' : i; }
    drop.hidden = false; requestAnimationFrame(() => drop.classList.add('on'));
    root.classList.toggle('tm-sheet', !!all);
    if (kbd) { const b = $('button', drop); b && b.focus(); }
  };
  const closeDrop = (now) => {
    clearTimeout(dropT);
    const off = () => { drop.classList.remove('on'); root.classList.remove('tm-sheet'); setTimeout(() => { if (!drop.classList.contains('on')) { drop.hidden = true; dropFor = -1; } }, reduce ? 0 : 220); };
    if (now) off(); else dropT = setTimeout(off, 160);
  };
  tabs.forEach((a, i) => {
    a.addEventListener('mouseenter', () => { if (!fine.matches) return; clearTimeout(dropT); dropT = setTimeout(() => openDrop(i), drop.hidden ? 110 : 0); });
  });
  mast.addEventListener('mouseleave', () => { if (fine.matches && !root.classList.contains('tm-sheet')) closeDrop(); });
  drop.addEventListener('mouseenter', () => clearTimeout(dropT));
  drop.addEventListener('click', e => {
    const b = e.target.closest('[data-go]'); if (!b) return;
    const k = +b.dataset.go, j = b.dataset.j;
    let target = null;
    if (j != null) { const sub = (drop._subs.find(x => x[0] === k) || [])[1] || []; const t = sub[+j] && sub[+j][1]; target = typeof t === 'string' ? $(t) : t; }
    closeDrop(true); go(k, { target, focus: true });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drop.hidden) { closeDrop(true); tabs[cur].focus(); } });
  document.addEventListener('pointerdown', e => { if (!drop.hidden && !drop.contains(e.target) && !e.target.closest('.tm-nav, .tm-menu')) closeDrop(true); });

  /* 탭 줄 키보드 — ← → 로 옮기며 바로 연다, ↓ 로 드롭다운 */
  nav.addEventListener('keydown', e => {
    const i = tabs.indexOf(document.activeElement); if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); const n = clamp(i + (e.key === 'ArrowRight' ? 1 : -1), 0, N - 1); go(n); tabs[n].focus(); e.stopPropagation(); }
    else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); const n = e.key === 'Home' ? 0 : N - 1; go(n); tabs[n].focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); openDrop(i, false, true); }
  });
  nav.addEventListener('click', e => { const a = e.target.closest('.tm-tab'); if (!a) return; e.preventDefault(); closeDrop(true); go(+a.dataset.i); });

  /* ---------- 아래 진행 막대(이전 · 점 · 순번 · 다음 · 목차) */
  const dock = el('div', { class: 'tm-dock', role: 'group', 'aria-label': '주제 넘기기' });
  dock.innerHTML = `
    <button type="button" class="tm-prev" aria-label="이전 주제"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg><span class="tm-pl"></span></button>
    <div class="tm-dots">${TOPICS.map((t, i) => `<button type="button" data-i="${i}" aria-label="${pad(i + 1)} ${t.label}"><i></i></button>`).join('')}</div>
    <span class="tm-count" aria-live="polite"><b>01</b><span>/ ${pad(N)}</span></span>
    <button type="button" class="tm-next" aria-label="다음 주제"><span class="tm-nl"></span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 3 5 5-5 5"/></svg></button>
    <button type="button" class="tm-menu" aria-controls="tmDrop" aria-expanded="false" title="모든 주제 · 항목"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg><span>목차</span></button>`;
  document.body.appendChild(dock);
  const hint = el('div', { class: 'tm-hint', 'aria-hidden': 'true' }, '<span class="h-drag"><i></i></span>' + (fine.matches ? '드래그 · ← → 키로 다음 주제' : '옆으로 밀어 다음 주제'));
  document.body.appendChild(hint);
  const dots = $$('.tm-dots button', dock);
  $('.tm-prev', dock).addEventListener('click', () => go(cur - 1));
  $('.tm-next', dock).addEventListener('click', () => go(cur + 1));
  dots.forEach(b => b.addEventListener('click', () => go(+b.dataset.i)));
  const menu = $('.tm-menu', dock);
  menu.addEventListener('click', () => { if (!drop.hidden && root.classList.contains('tm-sheet')) { closeDrop(true); menu.setAttribute('aria-expanded', 'false'); } else { openDrop(cur, true, !menu.matches(':hover')); menu.setAttribute('aria-expanded', 'true'); } });

  /* ---------- 넘기기 */
  let cur = -1, hintOff = false;
  const killHint = () => { if (hintOff) return; hintOff = true; hint.classList.add('off'); setTimeout(() => hint.remove(), 600); };
  setTimeout(killHint, 7000);
  const place = (off = 0) => { track.style.transform = `translate3d(calc(${-cur * 100}% + ${off}px), 0, 0)`; };
  function moveInd() {
    const a = tabs[cur]; if (!a) return;
    ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`;
    if (nav.scrollWidth > nav.clientWidth + 1) nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  function enter(p) {
    if (reduce) return;
    p.classList.remove('tm-in'); void p.offsetWidth; p.classList.add('tm-in');
  }
  function go(i, o = {}) {
    i = clamp(i, 0, N - 1);
    const prev = cur, changed = i !== cur; cur = i;
    track.classList.toggle('tm-instant', !!o.instant || reduce);
    place();
    panels.forEach((p, k) => { const on = k === i; p.inert = !on; p.setAttribute('aria-hidden', String(!on)); p.classList.toggle('on', on); });
    tabs.forEach((a, k) => { a.setAttribute('aria-selected', String(k === i)); a.tabIndex = k === i ? 0 : -1; a.classList.toggle('past', k < i); });
    dots.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-current', String(k === i)); });
    $('.tm-count b', dock).textContent = pad(i + 1);
    $('.tm-pl', dock).textContent = i > 0 ? TOPICS[i - 1].label : '';
    $('.tm-nl', dock).textContent = i < N - 1 ? TOPICS[i + 1].label : '';
    $('.tm-prev', dock).disabled = i === 0; $('.tm-next', dock).disabled = i === N - 1;
    root.style.setProperty('--tm-p', (i / (N - 1)).toFixed(4));
    moveInd();
    if (changed || o.first) {
      if (!o.target) panels[i].scrollTop = 0;
      enter(panels[i]);
      try { history[o.push === false || o.first ? 'replaceState' : 'pushState'](null, '', '#/' + TOPICS[i].id); } catch (e) {}
      document.title = `${TOPICS[i].label} · 박성준 · Growth Report 2026`;
      if (prev >= 0) killHint();
    }
    if (o.target) {
      const t = o.target, p = panels[i];
      const y = t.getBoundingClientRect().top - p.getBoundingClientRect().top + p.scrollTop - 14;
      setTimeout(() => {
        p.scrollTo({ top: Math.max(0, y), behavior: reduce || !changed ? (reduce ? 'auto' : 'smooth') : 'auto' });
        t.classList.remove('tm-flash'); void t.offsetWidth; t.classList.add('tm-flash'); setTimeout(() => t.classList.remove('tm-flash'), 1600);
      }, changed && !reduce ? 380 : 0);
    }
    if (o.focus) setTimeout(() => panels[i].focus({ preventScroll: true }), changed && !reduce ? 700 : 0);
  }

  /* 드래그 · 스와이프 — 가로로 10px 넘게, 세로보다 크게 움직일 때만 판을 끈다(세로는 판 안 스크롤).
     놓았을 때 판 폭의 18% 를 넘었거나 빠르게 튕기면 다음 / 이전, 아니면 제자리. 양 끝에서는 고무줄처럼 덜 끌린다 */
  const NODRAG = 'a, button, input, select, textarea, label, iframe, summary, [contenteditable], .chartbox, .tablewrap, .mboard, .gantt, .player, .dash-frame, .tm-nodrag';
  let drag = null;
  stage.addEventListener('pointerdown', e => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || e.target.closest(NODRAG)) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now(), on: false, w: stage.clientWidth, dx: 0, hist: [] };
  });
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) >= Math.abs(dx)) { drag = null; return; }
      drag.on = true; root.classList.add('tm-dragging'); track.classList.add('tm-instant');
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      try { getSelection().removeAllRanges(); } catch (err) {}
    }
    let off = dx;
    if ((cur === 0 && dx > 0) || (cur === N - 1 && dx < 0)) off = dx * 0.28;
    drag.dx = dx; drag.hist.push([performance.now(), dx]); if (drag.hist.length > 6) drag.hist.shift();
    place(off);
  });
  const endDrag = e => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag; drag = null;
    if (!d.on) return;
    root.classList.remove('tm-dragging'); track.classList.remove('tm-instant');
    const h = d.hist, v = h.length > 1 ? (h[h.length - 1][1] - h[0][1]) / Math.max(1, h[h.length - 1][0] - h[0][0]) : 0;
    if ((d.dx < -d.w * 0.18 || v < -0.5) && cur < N - 1) go(cur + 1);
    else if ((d.dx > d.w * 0.18 || v > 0.5) && cur > 0) go(cur - 1);
    else place();
    const kill = ev => { ev.stopPropagation(); ev.preventDefault(); };
    addEventListener('click', kill, { capture: true, once: true }); setTimeout(() => removeEventListener('click', kill, true), 60);
  };
  addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);

  /* 트랙패드 가로 밀기 */
  let wheelLock = 0, wheelAcc = 0;
  stage.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || e.target.closest('.tablewrap, .chartbox')) return;
    wheelAcc += e.deltaX; const now = performance.now();
    if (now < wheelLock || Math.abs(wheelAcc) < 60) return;
    go(cur + (wheelAcc > 0 ? 1 : -1)); wheelAcc = 0; wheelLock = now + 750;
  }, { passive: true });

  /* ← → 키(입력 칸 · 탭 줄 · 표 · 대화 상자 밖에서) */
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable], .tm-nav, .seg, .modal, .lightbox, .tablewrap')) return;
    if (e.key === 'ArrowRight') { go(cur + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { go(cur - 1); e.preventDefault(); }
  });

  /* 페이지 안 링크(#perf · #p-cp1 …) — 그 판으로 옮기고 그 자리로. 본판의 세로 스크롤 처리(app.js)보다 먼저 받는다 */
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || a.closest('.tm-nav')) return;
    const h = a.getAttribute('href'); if (!h || h === '#' || h.startsWith('#/')) return;
    let t = null; try { t = $(h); } catch (err) { return; }
    if (h === '#top' || a.classList.contains('id')) { e.preventDefault(); e.stopImmediatePropagation(); go(0); return; }
    const k = t ? panels.findIndex(p => p.contains(t)) : -1; if (k < 0) return;
    e.preventDefault(); e.stopImmediatePropagation(); go(k, { target: t.closest('.tm-inner > *') === t ? null : t });
  }, true);

  /* 주소 #/주제 — 뒤로 / 앞으로 */
  const fromHash = () => { const id = (location.hash.match(/^#\/([\w-]+)/) || [])[1]; const k = TOPICS.findIndex(t => t.id === id); return k; };
  addEventListener('popstate', () => { const k = fromHash(); if (k >= 0 && k !== cur) go(k, { push: false }); });
  addEventListener('resize', () => { moveInd(); track.classList.add('tm-instant'); place(); requestAnimationFrame(() => track.classList.remove('tm-instant')); });
  document.fonts && document.fonts.ready.then(moveInd);

  /* 인쇄 — 판을 세로로 다시 쌓는다(style 은 topics.css 인쇄 블록). inert 를 풀어야 인쇄 · 복사에 다 나온다 */
  addEventListener('beforeprint', () => panels.forEach(p => { p.inert = false; p.removeAttribute('aria-hidden'); }));
  addEventListener('afterprint', () => go(cur, { push: false }));

  // #/주제 가 없으면 본판식 주소(#perf · #p-cp1)도 받아 그 판 · 그 자리로
  let k0 = fromHash(), t0 = null;
  if (k0 < 0 && /^#[\w-]+$/.test(location.hash)) { t0 = $(location.hash); k0 = t0 ? panels.findIndex(p => p.contains(t0)) : -1; }
  go(k0 >= 0 ? k0 : 0, { instant: true, first: true, target: t0 && t0.closest('.tm-inner > *') !== t0 ? t0 : null });
  root.classList.add('tm-ready');
})();
