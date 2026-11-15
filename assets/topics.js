/* =========================================================================
   주제별 보기 (topics.html · 2026-11-15 시험 페이지)
   본인 「각 페이지별 드롭다운식 한 주제씩 볼 수 있는 형태 — 쇼핑 인사이트 GNB 처럼 한 주제에 하나씩만, 드래그로 보는 웹사이트처럼 · 고급스러운 수준」.
   (2026-11-16) 본인 「드래그로 화면 좌우 이동 · 한 화면 안에 인터페이스가 들어가도록 · 상단 바를 좌측 GNB 로(화면이 와이드)」 —
   넓은 화면(1180px 이상 · 높이 560px 이상, html.tm-wide)은 왼쪽 GNB + 「한 화면짜리 장」을 옆으로 넘기는 덱으로 바꿨다.
   · 내용은 본판과 같다 — app.js 가 index.html 과 같은 틀(topics.html)에 그린 절을 주제 판(panel) 8장으로 옮긴다(위치만 옮김 · 다시 그리지 않음)
   · 넓은 화면: 판 안 내용을 여러 단(multi-column)으로 흘려 한 장(화면 높이)을 넘으면 오른쪽 장으로 넘긴다. 조금(최대 25%) 넘치는 절은 zoom 으로
     한 장에 맞추고, 한 장보다 큰 카드 하나는 그 카드만 줄인다(layout). 넘기기는 장 단위 — 드래그(카드 · 링크 위에서도) · 휠 · 트랙패드 · ← → ↑ ↓ 키 ·
     화면 가장자리 화살표 · GNB 아래 이전 / 다음. GNB 는 주제 8개 + 지금 주제의 항목(지금 장에 있는 항목은 강조) · 다른 주제에 마우스를 올리면 옆에 항목 목록
   · 좁은 화면: 위 탭 + 판 안 세로 스크롤 + 아래 진행 막대(그대로). 넘기기는 주제 단위
   · 주소 #/perf · #/work/3(장 번호) — 주제가 바뀔 때만 방문 기록을 남긴다. 동작 줄이기면 미끄러짐 · 차례 등장 없이 바로 바뀐다
   · html.tabmode 일 때만 돈다 — app.js 의 스크롤 등장(wireReveal)은 이 모드에서 꺼지고, 장(판)에 들어올 때마다 여기서 차례 등장을 다시 돌린다
   ========================================================================= */
(function () {
  'use strict';
  const root = document.documentElement;
  if (!root.classList.contains('tabmode')) return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const wideMQ = matchMedia('screen and (min-width: 1180px) and (min-height: 560px)');   // topics.css 의 html.tm-wide 와 같은 조건
  const el = (tag, attrs, html) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v); if (html != null) e.innerHTML = html; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const txt = n => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
  const short = s => s.split(' — ')[0];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* 주제 — 판에 넣을 절(secs)과 항목(sub: [이름, 대상]) */
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
    const p = el('section', { class: 'tm-panel', id: 'tm-' + t.id, role: 'region', 'aria-label': `${pad(i + 1)} ${t.label}`, tabindex: '-1' });
    if (i) p.appendChild(el('div', { class: 'tm-idx', 'aria-hidden': 'true' }, pad(i + 1)));
    const inner = el('div', { class: 'tm-inner' });
    t.secs.forEach(sel => { const s = $(sel); if (s) inner.appendChild(s); });
    p.appendChild(inner); track.appendChild(p);
    return p;
  });
  const inners = panels.map(p => $('.tm-inner', p));
  stage.appendChild(track); main.appendChild(stage);
  // 항목 대상은 한 번 찾아 둔다(app.js 가 다 그린 뒤라 카드가 있다)
  const subsOf = TOPICS.map(t => (t.sub() || []).filter(x => x && x[0]).map(([name, tg]) => [name, typeof tg === 'string' ? $(tg) : tg]).filter(x => x[1]));

  /* 장(판)에 들어올 때 차례로 떠오를 덩어리 — 순번(--k)은 장마다 다시 센다(layout) */
  const ANIM = '.tm-idx, .hero-l > *, .hero-r > *, #summary .shell > *, .sec-h > *, .growth-h > *, .dash-wrap > *, .perf > *, .phases > li, .gcards > *, .gextra, .projects > .proj, .pillars > *, .toolrow, .gantt, .cnote, .jobs > *, .archive > *, .beliefs > *, .contact.big, .scorebox, .factgrid > *, .foot .shell > *';
  const anims = panels.map(p => $$(ANIM, p).filter(n => !n.closest('[hidden]')));
  anims.forEach(list => list.forEach((n, k) => { n.classList.add('tm-anim'); n.style.setProperty('--k', Math.min(k, 8)); }));
  const animPage = new Map();

  /* ---------- GNB — 넓은 화면은 왼쪽 세로(주제 + 지금 주제의 항목), 좁은 화면은 위 가로 탭 */
  const mast = $('.mast'), shell = $('.mast .shell'), oldNav = $('.mast nav');
  const nav = el('nav', { class: 'tm-nav', 'aria-label': '주제' });
  const list = el('ol', { class: 'tm-list' });
  const items = [], tabs = [];
  TOPICS.forEach((t, i) => {
    const li = el('li', { class: 'tm-item' });
    const a = el('a', { class: 'tm-tab', id: 'tmt-' + t.id, href: '#' + t.id, 'aria-controls': 'tm-' + t.id, 'data-i': i },
      `<span class="n">${pad(i + 1)}</span><span class="l">${t.label}</span><span class="pc" aria-hidden="true"></span>`);
    const sub = el('div', { class: 'tm-sub' }, `<ul>${subsOf[i].map(([name], j) => `<li><button type="button" data-go="${i}" data-j="${j}" title="${esc(name)}"><span>${esc(name)}</span></button></li>`).join('')}</ul>`);
    li.append(a, sub); list.appendChild(li); items.push(li); tabs.push(a);
  });
  const ind = el('span', { class: 'tm-ind', 'aria-hidden': 'true' });
  nav.append(list, ind);
  if (oldNav) oldNav.replaceWith(nav); else shell.appendChild(nav);
  const back = el('a', { class: 'iconbtn tm-back', href: 'index.html', title: '한 페이지로 이어 보기(본판)' }, '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 4h10M3 8h10M3 12h10"/></svg><span>스크롤로 보기</span>');
  $('.mast .tools').prepend(back);
  // 넓은 화면 GNB 아래 — 장 넘기기 + 저작권 줄(꼬리말은 넓은 화면에서 장에 넣지 않는다)
  const ARR = d => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  const pager = el('div', { class: 'tm-pager', role: 'group', 'aria-label': '장 넘기기' },
    `<button type="button" class="tm-pp" aria-label="이전 장">${ARR('M10 3 5 8l5 5')}</button><span class="tm-pcount" aria-live="polite"><b>1</b><span>/ 1</span><small></small></span><button type="button" class="tm-pn" aria-label="다음 장">${ARR('m6 3 5 5-5 5')}</button>`);
  nav.after(pager);
  const fl = $('#footLine'), copy = el('p', { class: 'tm-copy' }, esc((fl && fl.firstChild ? fl.firstChild.textContent : '').trim() || '© 박성준'));   // 「© 이름 · 2026」만(메일 · 전화는 연락처 장에)
  shell.appendChild(copy);

  /* 드롭다운(좁은 화면: 탭에 마우스 · 목차 / 넓은 화면: 다른 주제에 마우스 → GNB 옆에 항목 목록) */
  const drop = el('div', { class: 'tm-drop', id: 'tmDrop', hidden: '' });
  mast.appendChild(drop);
  let dropT = 0, dropFor = -1;
  const fillDrop = (i, all) => {
    const ks = all ? TOPICS.map((t, k) => k) : [i];
    drop.classList.toggle('all', !!all);
    drop.innerHTML = `<div class="tm-drop-in">${ks.map(k => {
      const t = TOPICS[k];
      return `<section class="tm-dg"><button type="button" class="tm-dh" data-go="${k}"><span class="n">${pad(k + 1)}</span><b>${t.label}</b><small>${t.en}</small></button>
        ${all ? '' : `<p class="tm-dd">${t.desc}</p>`}
        <ul>${subsOf[k].map(([name], j) => `<li><button type="button" data-go="${k}" data-j="${j}"><span>${esc(name)}</span><i aria-hidden="true">→</i></button></li>`).join('')}</ul></section>`;
    }).join('')}</div>`;
  };
  const openDrop = (i, all, kbd) => {
    clearTimeout(dropT);
    if (dropFor !== (all ? 'all' : i)) { fillDrop(i, all); dropFor = all ? 'all' : i; }
    if (wide && !all) {   // GNB 옆, 그 주제 줄 높이에(아래가 넘치면 위로 당김)
      const r = tabs[i].getBoundingClientRect(), mr = mast.getBoundingClientRect();
      drop.hidden = false;
      const h = drop.offsetHeight || 320;
      drop.style.setProperty('--dy', clamp(r.top - mr.top - 10, 8, Math.max(8, innerHeight - h - 12)) + 'px');
    }
    drop.hidden = false; requestAnimationFrame(() => drop.classList.add('on'));
    root.classList.toggle('tm-sheet', !!all);
    const mb = $('.tm-menu'); if (mb) mb.setAttribute('aria-expanded', String(!!all));
    if (kbd) { const b = $('button', drop); b && b.focus(); }
  };
  const closeDrop = (now) => {
    clearTimeout(dropT);
    const off = () => { drop.classList.remove('on'); root.classList.remove('tm-sheet'); const mb = $('.tm-menu'); if (mb) mb.setAttribute('aria-expanded', 'false'); setTimeout(() => { if (!drop.classList.contains('on')) { drop.hidden = true; dropFor = -1; } }, reduce ? 0 : 220); };
    if (now) off(); else dropT = setTimeout(off, 160);
  };
  tabs.forEach((a, i) => {
    a.addEventListener('mouseenter', () => {
      if (!fine.matches) return; clearTimeout(dropT);
      if (wide && i === cur) { closeDrop(); return; }   // 지금 주제의 항목은 GNB 안에 펼쳐져 있다
      dropT = setTimeout(() => openDrop(i), drop.hidden ? 120 : 0);
    });
  });
  mast.addEventListener('mouseleave', () => { if (fine.matches && !root.classList.contains('tm-sheet')) closeDrop(); });
  drop.addEventListener('mouseenter', () => clearTimeout(dropT));
  const subClick = e => {
    const b = e.target.closest('[data-go]'); if (!b) return false;
    const k = +b.dataset.go, j = b.dataset.j;
    const target = j != null ? (subsOf[k][+j] || [])[1] || null : null;
    closeDrop(true); go(k, { target, focus: true, page: target ? undefined : 0 });
    return true;
  };
  drop.addEventListener('click', subClick);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drop.hidden) { closeDrop(true); tabs[cur].focus(); } });
  document.addEventListener('pointerdown', e => { if (!drop.hidden && !drop.contains(e.target) && !e.target.closest('.tm-nav, .tm-menu')) closeDrop(true); });

  nav.addEventListener('keydown', e => {   // 좁은 화면 탭에서 ↓ = 그 주제 드롭다운
    const i = tabs.indexOf(document.activeElement); if (i < 0 || wide) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); openDrop(i, false, true); }
  });
  nav.addEventListener('click', e => {
    if (subClick(e)) return;
    const a = e.target.closest('.tm-tab'); if (!a) return;
    e.preventDefault(); closeDrop(true); go(+a.dataset.i, { page: 0 });
  });

  /* ---------- 좁은 화면 아래 진행 막대(이전 · 점 · 순번 · 다음 · 목차) */
  const dock = el('div', { class: 'tm-dock', role: 'group', 'aria-label': '주제 넘기기' });
  dock.innerHTML = `
    <button type="button" class="tm-prev" aria-label="이전 주제">${ARR('M10 3 5 8l5 5')}<span class="tm-pl"></span></button>
    <div class="tm-dots">${TOPICS.map((t, i) => `<button type="button" data-i="${i}" aria-label="${pad(i + 1)} ${t.label}"><i></i></button>`).join('')}</div>
    <span class="tm-count" aria-live="polite"><b>01</b><span>/ ${pad(N)}</span></span>
    <button type="button" class="tm-next" aria-label="다음 주제"><span class="tm-nl"></span>${ARR('m6 3 5 5-5 5')}</button>
    <button type="button" class="tm-menu" aria-controls="tmDrop" aria-expanded="false" title="모든 주제 · 항목"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg><span>목차</span></button>`;
  document.body.appendChild(dock);
  const dots = $$('.tm-dots button', dock);
  $('.tm-prev', dock).addEventListener('click', () => step(-1));
  $('.tm-next', dock).addEventListener('click', () => step(1));
  dots.forEach(b => b.addEventListener('click', () => go(+b.dataset.i, { page: 0 })));
  const menu = $('.tm-menu', dock);
  menu.addEventListener('click', () => { if (!drop.hidden && root.classList.contains('tm-sheet')) closeDrop(true); else openDrop(cur, true, !menu.matches(':hover')); });

  /* 넓은 화면 — 화면 가장자리 화살표(마우스가 가장자리에 가까울 때만) · 장 점 */
  const edgeP = el('button', { type: 'button', class: 'tm-edge prev', 'aria-label': '이전 장' }, ARR('M10 3 5 8l5 5') + '<span class="tm-el"></span>');
  const edgeN = el('button', { type: 'button', class: 'tm-edge next', 'aria-label': '다음 장' }, ARR('m6 3 5 5-5 5') + '<span class="tm-el"></span>');
  const pdots = el('div', { class: 'tm-pdots', 'aria-hidden': 'true' });
  main.append(edgeP, edgeN, pdots);
  edgeP.addEventListener('click', () => step(-1)); edgeN.addEventListener('click', () => step(1));
  $('.tm-pp', pager).addEventListener('click', () => step(-1)); $('.tm-pn', pager).addEventListener('click', () => step(1));
  main.addEventListener('pointermove', e => {
    if (!wide || e.pointerType !== 'mouse' || drag) return;
    const r = main.getBoundingClientRect(), x = e.clientX - r.left;
    main.classList.toggle('near-l', x < 110); main.classList.toggle('near-r', x > r.width - 110);
  });
  main.addEventListener('pointerleave', () => main.classList.remove('near-l', 'near-r'));

  const hint = el('div', { class: 'tm-hint', 'aria-hidden': 'true' }, '<span class="h-drag"><i></i></span><span class="ht"></span>');
  document.body.appendChild(hint);

  /* ---------- 상태 · 장 나누기(넓은 화면) */
  let wide = false, cur = -1, pg = 0, pw = 0, ph = 0, hintOff = false, lastPush = 0, drag = null, savedPg = 0, savedCur = -1, lastSig = '', resetT = 0, sealT = 0;
  const restorePg = () => (savedCur === cur ? savedPg : 0);
  const npg = TOPICS.map(() => 1);
  let subPg = TOPICS.map(() => []);
  const offOf = k => { let s = 0; for (let j = 0; j < k; j++) s += npg[j]; return s; };
  const total = () => offOf(N);
  const pageOf = (n, k) => {
    if (!wide || !n) return 0;
    const r = n.getBoundingClientRect(), ir = inners[k].getBoundingClientRect();
    if (!r.width && !r.height) return 0;
    return clamp(Math.floor((r.left - ir.left + 1) / pw), 0, npg[k] - 1);
  };
  const lastPageOf = (n, k) => {
    if (!wide || !n) return 0;
    const r = n.getBoundingClientRect(), ir = inners[k].getBoundingClientRect();
    if (!r.width && !r.height) return 0;
    return clamp(Math.floor((r.right - ir.left - 2) / pw), 0, npg[k] - 1);
  };

  const ZMIN = 0.8;   // 이만큼까지만 줄여 한 장에 맞춘다(더 줄여야 하면 여러 장으로 나눈다)
  const FIT = '.proj, .job, .belief, .pillar, .gcard, .arc, .scorebox, .perf > .panel, .gantt, .cnote';   // 한 장보다 크면 그것만 줄인다
  const hOf = n => n.getBoundingClientRect().height;
  /* [lo, hi] 배율 안에서 avail 에 들어가는 가장 큰 배율을 찾는다. lo 로도 넘치면 strict 는 hi 로 되돌리고 0, 아니면 lo 로 둔다 */
  // 배율은 0.01 단위로 내림 — 차트가 새 폭으로 다시 그려져 높이가 조금 바뀌어도 배율이 오락가락하지 않게
  const setZ = (n, z) => { z = Math.floor(z * 100 + 1e-6) / 100; if (z >= 0.999) { n.style.zoom = ''; delete n.dataset.tmZ; } else { n.style.zoom = z.toFixed(2); n.dataset.tmZ = '1'; } };
  function fitZoom(n, avail, strict, lo = ZMIN, hi = 1) {
    setZ(n, hi); if (hOf(n) <= avail + 0.5) return hi;
    setZ(n, lo);
    if (hOf(n) > avail + 0.5) { if (strict) { setZ(n, hi); return 0; } return lo; }
    for (let k = 0; k < 6; k++) { const m = (lo + hi) / 2; setZ(n, m); if (hOf(n) <= avail + 0.5) lo = m; else hi = m; }
    setZ(n, lo);
    return lo;
  }
  function unzoom() { $$('[data-tm-z]', stage).forEach(n => { n.style.zoom = ''; delete n.dataset.tmZ; }); }

  /* 넓은 화면 — 「주요 업무」 머리 문구를 모든 카드 장에 고정(본인 11-16 「헤드카피 소 주제에도 고정」).
     절 머리(.sec-h)를 판 위 고정 칸(.tm-pin)으로 옮기고 판 안은 그 높이만큼 위를 비운다. 같은 주제 안에서 장을 넘길 때는
     트랙과 반대로 같은 만큼 움직여 제자리에 있는 것처럼 보이고, 다른 주제로 갈 때는 판과 함께 미끄러진다. 좁은 화면에서는 제자리로 돌려놓는다 */
  const PIN_K = TOPICS.findIndex(t => t.id === 'work');
  let pin = null;
  function setPin(on) {
    if (on && !pin && PIN_K >= 0) {
      const h = $('#work .sec-h'); if (!h) return;
      pin = { el: h, parent: h.parentElement, next: h.nextElementSibling, box: el('div', { class: 'tm-pin' }), in: el('div', { class: 'tm-pin-in' }) };
      pin.in.appendChild(h); pin.box.appendChild(pin.in); panels[PIN_K].insertBefore(pin.box, inners[PIN_K]);   // 배율은 안쪽(.tm-pin-in)에만 — 위치 · 폭은 바깥이 장 기준으로
    } else if (!on && pin) {
      pin.parent.insertBefore(pin.el, pin.next); pin.box.remove(); inners[PIN_K].style.paddingTop = ''; inners[PIN_K].style.height = ''; pin = null;
    }
  }
  function placePin(off = 0) {
    if (!pin) return;
    const last = npg[PIN_K] - 1, q = cur === PIN_K ? pg : cur > PIN_K ? last : 0;
    const inside = cur === PIN_K && off && !((pg === 0 && off > 0) || (pg === last && off < 0));   // 같은 주제 안에서 끄는 중이면 손가락을 따라가지 않는다
    pin.box.style.transform = `translate3d(${q * pw - (inside ? off : 0)}px, 0, 0)`;
  }

  /* 넓은 화면 — 장마다 내용을 위아래 가운데로(본인 11-16 「주요 정보들 상단이 아닌 중앙에서 · 아래가 비어 보이지 않게」).
     장 하나에 통째로 들어가는 가장 큰 덩어리들(한 장짜리 절 · 여러 장 절 안의 카드)을 찾아 그 장의 빈 높이 46% 만큼 아래로 민다.
     position: relative + top 이라 단 나누기(장 수)는 바뀌지 않는다. 차례 등장 중인 transform 은 빼고 잰다 */
  const zEff = n => { let z = 1; for (let a = n; a && a !== stage; a = a.parentElement) if (a.style && a.style.zoom) z *= parseFloat(a.style.zoom); return z; };
  const tyOf = n => { const t = getComputedStyle(n).transform; if (!t || t === 'none') return 0; const m = t.match(/matrix(3d)?\(([^)]+)\)/); if (!m) return 0; const v = m[2].split(',').map(Number); return m[1] ? v[13] : v[5]; };
  function uncenter() { $$('[data-tm-c]', stage).forEach(n => { n.style.top = ''; n.style.position = ''; delete n.dataset.tmC; }); }
  function center(k) {
    const inner = inners[k], ir = inner.getBoundingClientRect(), cs = getComputedStyle(inner);
    const top0 = ir.top + parseFloat(cs.paddingTop), avail = ir.bottom - parseFloat(cs.paddingBottom) - top0;
    const pages = new Map(), blocked = new Set();
    const walk = n => {
      const st = getComputedStyle(n);
      if (st.display === 'none' || st.position === 'absolute' || st.position === 'fixed') return;
      const rs = [...n.getClientRects()].filter(r => r.width || r.height); if (!rs.length) return;
      const qs = rs.map(r => clamp(Math.floor((r.left - ir.left + 1) / pw), 0, npg[k] - 1)), a = Math.min(...qs), b = Math.max(...qs);
      if (a === b) {
        const d = tyOf(n) * zEff(n);
        if (!pages.has(a)) pages.set(a, []);
        pages.get(a).push({ n, top: Math.min(...rs.map(r => r.top)) - d, bottom: Math.max(...rs.map(r => r.bottom)) - d });
        return;
      }
      const kids = [...n.children];
      if (!kids.length) { for (let q = a; q <= b; q++) blocked.add(q); return; }   // 장 사이에서 잘린 글 덩어리 — 그 장들은 건드리지 않는다
      kids.forEach(walk);
    };
    [...inner.children].forEach(walk);
    pages.forEach((list, q) => {
      if (blocked.has(q)) return;
      const t = Math.min(...list.map(x => x.top)), b = Math.max(...list.map(x => x.bottom));
      const shift = (avail - (b - t)) * 0.46 - (t - top0);
      if (shift < 8) return;
      list.forEach(({ n }) => { if (getComputedStyle(n).position === 'static') n.style.position = 'relative'; n.style.top = (shift / zEff(n)).toFixed(1) + 'px'; n.dataset.tmC = '1'; });
    });
  }

  function layout() {
    if (!wide) return;
    pw = stage.clientWidth; ph = stage.clientHeight;
    if (!pw || !ph) return;
    root.style.setProperty('--tm-pw', pw + 'px'); root.style.setProperty('--tm-ph', ph + 'px');
    // 기준 배율 — 장 높이 800px(이 PC 1463×800)을 100% 로, 낮은 창은 발표 자료처럼 전체를 조금 줄인다(1280×720 → 90%, 최소 84%)
    const z0 = clamp(ph / 800, 0.84, 1);
    root.style.setProperty('--tm-z0', z0.toFixed(3));
    { const c0 = getComputedStyle(inners[0]); root.style.setProperty('--tm-avail', (ph - parseFloat(c0.paddingTop) - parseFloat(c0.paddingBottom)) + 'px'); }
    unzoom(); uncenter();
    setPin(true);
    if (pin) {   // 고정 머리 높이만큼 「주요 업무」 판 위를 비운다
      const ip = inners[PIN_K]; ip.style.paddingTop = ''; ip.style.height = '';
      setZ(pin.in, z0);
      const ics = getComputedStyle(ip), pt = parseFloat(ics.paddingTop) + hOf(pin.box) + 16;
      ip.style.paddingTop = pt + 'px';
      ip.style.height = (ph - pt - parseFloat(ics.paddingBottom)) + 'px';   // 위를 비운 만큼 단 높이도 줄인다(안 줄이면 이 판만 화면보다 길어 카드 아래가 잘렸다)
    }
    inners.forEach((inner, k) => {
      inner.classList.add('tm-measure');   // 한 단 · 높이 자유 — 자연 높이를 잰다
      const cs = getComputedStyle(inner), avail = ph - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const lim = avail - 8;   // 단 나누기는 소수점 · 줄 높이에 민감하다 — 딱 맞추면 마지막 덩어리가 다음 장으로 밀렸다
      [...inner.children].forEach(s => {
        if (getComputedStyle(s).display === 'none') return;
        setZ(s, z0);
        const h = hOf(s);
        if (h <= avail + 0.5) return;
        // 조금 넘치는 절 — 한 장에 맞춘다(줄이면 글줄이 넓어져 높이가 배율보다 더 준다). 전체 배율은 72% 아래로 내리지 않는다
        if (h * 0.68 <= lim && fitZoom(s, lim, true, Math.max(0.72, z0 * ZMIN), z0)) return;
        // 여러 장으로 나누는 절 — 한 장보다 큰 카드만 줄인다. 절 제목 바로 다음 카드는 제목과 한 장에 들어가게(제목만 남은 장 방지)
        const sTop = s.getBoundingClientRect().top;
        $$(FIT, s).filter(n => !n.parentElement.closest(FIT)).forEach((n, idx) => {
          const off = n.getBoundingClientRect().top - sTop;
          if (idx === 0 && off > 0 && off < avail * 0.4 && off + hOf(n) > lim && fitZoom(n, lim - off, true)) return;
          if (hOf(n) > lim) fitZoom(n, lim, false);
        });
      });
      inner.classList.remove('tm-measure');
    });
    panels.forEach((p, k) => {
      const inner = inners[k];
      const n = Math.max(1, Math.ceil((inner.scrollWidth - 4) / pw));
      npg[k] = n; p.style.width = n * pw + 'px';
    });
    inners.forEach((x, k) => center(k));
    // 장마다 차례 등장 순번 · 항목이 놓인 장
    anims.forEach((list, k) => {
      const seen = new Map();
      list.forEach(n => { const q = n.classList.contains('tm-idx') ? 0 : pageOf(n, k); animPage.set(n, q); const c = seen.get(q) || 0; seen.set(q, c + 1); n.style.setProperty('--k', Math.min(c, 8)); });
    });
    subPg = subsOf.map((subs, k) => subs.map(([, t]) => [pageOf(t, k), lastPageOf(t, k)]));
    lastSig = inners.map(n => n.scrollWidth).join(',');
    if (cur >= 0) {
      pg = clamp(pg, 0, npg[cur] - 1);
      // 자리가 그대로면 손대지 않는다 — 넘기는 중(미끄러지는 중)에 다시 나누면 끊겨 보였다
      const before = track.style.transform; place();
      if (track.style.transform !== before) { track.classList.add('tm-instant'); requestAnimationFrame(() => track.classList.remove('tm-instant')); }
      paint();
    }
  }
  let layT = 0;
  const relayout = (ms = 120) => { clearTimeout(layT); layT = setTimeout(() => { if (!drag) layout(); }, ms); };

  /* 넓은 화면 줄바꿈 다듬기(본인 11-16 「전체적인 문단 역시 변경된 UI 에 맞게 줄 바꿈 등 개선」) — 장 폭이 본판과 달라 생긴 어색한 끊김을 줄인다.
     · 「지킬 곳 1로」 「진입 14」처럼 낱말 뒤 숫자는 붙이고, 구분점 · 줄표 · 화살표 · 닫는 괄호가 줄 머리에, 화살표 · 여는 괄호가 줄 끝에 오지 않게
       공백을 줄바꿈 없는 공백(U+00A0)으로 바꾼다. 좁은 화면으로 가면 원래 글자로 되돌린다(좁은 칸에서 긴 덩어리가 글자 단위로 쪼개지지 않게) */
  const NB = ' ', glued = new Map();
  function glue(on) {
    if (!on) { glued.forEach((v, t) => { t.nodeValue = v; }); glued.clear(); return; }
    const w = document.createTreeWalker(stage, NodeFilter.SHOW_TEXT, { acceptNode: t => (t.parentElement && !t.parentElement.closest('svg, script, style, textarea, .player .stage') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    for (let t; (t = w.nextNode());) {
      const s = t.nodeValue; if (s.indexOf(' ') < 0 || glued.has(t)) continue;
      const v = s
        .replace(/ (?=[·—→÷×)\]」』])/g, NB)              // 구분점 · 줄표 · 화살표 · 닫는 괄호 앞
        .replace(/([→÷×(「『]) /g, '$1' + NB)              // 화살표 · 여는 괄호 뒤
        .replace(/ (?=\([+\-−]?\d)/g, NB)                  // 「1,893% (+468%p)」
        .replace(/([가-힣A-Za-z%]) (?=[+\-−]?\d)/g, '$1' + NB);   // 낱말 + 숫자
      if (v !== s) { glued.set(t, s); t.nodeValue = v; }
    }
  }

  function setMode(w) {
    if (w === wide) return false;
    wide = w; root.classList.toggle('tm-wide', w);
    glue(w);
    closeDrop(true); navFor = -1;
    main.classList.remove('near-l', 'near-r');
    if (!w) {
      savedPg = pg; savedCur = cur;   // 인쇄 · 창 크기로 잠깐 좁은 배치가 됐다가 돌아오면 보던 장으로(인쇄 뒤 한 장 앞으로 돌아가 있었다). 그사이 주제를 옮겼으면 첫 장
      unzoom(); uncenter(); setPin(false); panels.forEach(p => { p.style.width = ''; });
      root.style.removeProperty('--tm-pw'); root.style.removeProperty('--tm-ph');
      npg.fill(1); pg = 0; subPg = TOPICS.map(() => []);
    }
    $('.ht', hint).textContent = w ? '드래그 · 휠 · ← → 키로 넘기기' : (fine.matches ? '드래그 · ← → 키로 다음 주제' : '옆으로 밀어 다음 주제');
    return true;
  }

  /* ---------- 넘기기 */
  const killHint = () => { if (hintOff) return; hintOff = true; hint.classList.add('off'); setTimeout(() => hint.remove(), 600); };
  setTimeout(killHint, 7000);
  const atStart = () => cur === 0 && pg === 0;
  const atEnd = () => cur === N - 1 && pg === npg[N - 1] - 1;
  function place(off = 0) {
    if (wide) { track.style.transform = `translate3d(${-(offOf(cur) + pg) * pw + off}px, 0, 0)`; placePin(off); }
    else track.style.transform = `translate3d(calc(${-cur * 100}% + ${off}px), 0, 0)`;
  }
  function moveInd() {
    if (wide) return;
    const a = tabs[cur]; if (!a) return;
    ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`;
    if (nav.scrollWidth > nav.clientWidth + 1) nav.scrollTo({ left: a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  const label = (k, q) => TOPICS[k].label + (npg[k] > 1 ? ` ${q + 1}/${npg[k]}` : '');
  /* 넓은 화면 GNB — 지금 주제(이름 + 펼친 항목)가 목록 칸 안에 보이게. 펼침(0.45초)이 끝난 뒤 잰다 */
  let navT = 0, navFor = -1;
  function keepNav() {
    if (navFor === cur) return; navFor = cur;
    clearTimeout(navT);
    navT = setTimeout(() => {
      const li = items[cur]; if (!li || !wide) return;
      const top = li.offsetTop, h = li.offsetHeight, v = nav.scrollTop, ch = nav.clientHeight;
      let want = null;
      if (top < v + 4) want = top - 4;
      else if (top + h > v + ch - 4) want = Math.min(top - 4, top + h - ch + 4);
      if (want != null) nav.scrollTo({ top: Math.max(0, want), behavior: reduce ? 'auto' : 'smooth' });
    }, reduce ? 0 : 480);
  }
  function paint() {   // 지금 위치를 GNB · 진행 막대 · 가장자리 화살표에 그린다
    const i = cur;
    items.forEach((li, k) => li.classList.toggle('on', k === i));
    tabs.forEach((a, k) => { if (k === i) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); a.classList.toggle('past', k < i); $('.pc', a).textContent = wide && k === i && npg[k] > 1 ? `${pg + 1}/${npg[k]}` : ''; });
    if (wide) {
      $$('li', items[i]).forEach((li, j) => { const r = subPg[i][j]; li.classList.toggle('here', !!r && pg >= r[0] && pg <= r[1]); });
      const prevL = atStart() ? '' : (pg > 0 ? label(i, pg - 1) : label(i - 1, npg[i - 1] - 1));
      const nextL = atEnd() ? '' : (pg < npg[i] - 1 ? label(i, pg + 1) : label(i + 1, 0));
      $('.tm-el', edgeP).textContent = prevL; $('.tm-el', edgeN).textContent = nextL;
      edgeP.disabled = atStart(); edgeN.disabled = atEnd();
      edgeP.setAttribute('aria-label', '이전 장' + (prevL ? ': ' + prevL : '')); edgeN.setAttribute('aria-label', '다음 장' + (nextL ? ': ' + nextL : ''));
      $('.tm-pp', pager).disabled = atStart(); $('.tm-pn', pager).disabled = atEnd();
      $('.tm-pcount b', pager).textContent = pg + 1; $('.tm-pcount span', pager).textContent = '/ ' + npg[i];
      $('.tm-pcount small', pager).textContent = TOPICS[i].label;
      $('.tm-pcount', pager).setAttribute('aria-label', `${TOPICS[i].label} ${pg + 1} / ${npg[i]}장`);
      pdots.innerHTML = npg[i] > 1 ? Array.from({ length: npg[i] }, (x, q) => `<i class="${q === pg ? 'on' : ''}"></i>`).join('') : '';
      const t = total(); root.style.setProperty('--tm-p', t > 1 ? ((offOf(i) + pg) / (t - 1)).toFixed(4) : '1');
      keepNav();
    } else {
      dots.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-current', String(k === i)); });
      $('.tm-count b', dock).textContent = pad(i + 1);
      $('.tm-pl', dock).textContent = i > 0 ? TOPICS[i - 1].label : '';
      $('.tm-nl', dock).textContent = i < N - 1 ? TOPICS[i + 1].label : '';
      $('.tm-prev', dock).disabled = i === 0; $('.tm-next', dock).disabled = i === N - 1;
      $('.tm-prev', dock).setAttribute('aria-label', '이전 주제' + (i > 0 ? ': ' + TOPICS[i - 1].label : ''));
      $('.tm-next', dock).setAttribute('aria-label', '다음 주제' + (i < N - 1 ? ': ' + TOPICS[i + 1].label : ''));
      root.style.setProperty('--tm-p', (i / (N - 1)).toFixed(4));
    }
    moveInd();
  }
  function replay(i, page) {
    if (reduce) return;
    const list = anims[i].filter(n => page < 0 || animPage.get(n) === page || n.classList.contains('tm-idx') && page === 0);
    list.forEach(n => n.classList.remove('tm-play')); void track.offsetWidth; list.forEach(n => n.classList.add('tm-play'));
  }
  function go(i, o = {}) {
    i = clamp(i, 0, N - 1);
    let page = 0;
    if (wide) {
      if (o.target) page = pageOf(o.target, i);
      else if (o.page === -1) page = npg[i] - 1;
      else if (o.page != null) page = clamp(o.page, 0, npg[i] - 1);
      else if (i === cur) page = pg;
    }
    const changedT = i !== cur, changed = changedT || page !== pg;
    // (좁은 화면) 다른 판의 카드로 갈 때 — 위치는 차례 등장이 붙기 전에 잰다(붙은 뒤 재면 약 30px 위로 어긋났다)
    let ty = null;
    if (!wide && o.target) { const p = panels[i]; ty = o.target.getBoundingClientRect().top - p.getBoundingClientRect().top + p.scrollTop - 14; }
    cur = i; pg = page;
    if (!o.drag) settle();   // 손으로 놓은 뒤의 짧은 감속 곡선은 그 한 번만 — 키 · 탭 이동은 원래 곡선
    track.classList.toggle('tm-instant', !!o.instant || reduce);
    place();
    panels.forEach((p, k) => p.classList.toggle('on', k === i));
    // 안 보이는 판 inert · aria-hidden — 판 전체 스타일을 다시 계산하는 무거운 일이라, 손으로 놓은 뒤에는 미끄러짐이 끝난 다음에 한다
    // (놓는 순간 함께 하면 휴대폰에서 첫 프레임이 약 0.06초 멈칫했다)
    const seal = () => panels.forEach((p, k) => { const on = k === cur; if (p.inert !== !on) p.inert = !on; p.setAttribute('aria-hidden', String(!on)); });
    clearTimeout(sealT);
    if (o.drag && !reduce) sealT = setTimeout(seal, 500); else seal();
    paint();
    if (changed || o.first) {
      if (!wide && changedT && !o.target && !o.drag) panels[i].scrollTop = 0;
      // (좁은 화면) 떠난 판은 화면 밖으로 나간 뒤 맨 위로 — 끌 때 옆 판이 예전 스크롤 자리로 보였다가 도착 순간 맨 위로 튀던 것
      if (!wide && changedT) { clearTimeout(resetT); resetT = setTimeout(() => panels.forEach((p, k) => { if (k !== cur && p.scrollTop) p.scrollTop = 0; }), 900); }
      if (!o.drag) replay(i, wide ? page : -1);
      // 주제가 바뀔 때만 방문 기록(빠르게 이어 넘기면 하나로) — 같은 주제 안 장 이동은 주소만 바꾼다
      const now = performance.now(), quick = now - lastPush < 600;
      // 주소는 #work · #work-3 처럼 평범한 이름만(아티팩트 게시본은 #/경로 를 주소창과 주고받지 못한다 — 11-16). 예전 #/work/3 도 읽는다
      const url = '#' + TOPICS[i].id + (wide && page > 0 ? '-' + (page + 1) : '');
      const push = changedT && !(o.push === false || o.first || quick);
      if (changedT) lastPush = now;
      try { history[push ? 'pushState' : 'replaceState'](null, '', url); } catch (e) {}
      document.title = `${TOPICS[i].label} · 박성준 · Growth Report 2026`;
      if (!o.first) killHint();
    }
    if (o.target) {
      const t = o.target, p = panels[i], y = ty;
      setTimeout(() => {
        if (!wide) p.scrollTo({ top: Math.max(0, y), behavior: reduce || !changedT ? (reduce ? 'auto' : 'smooth') : 'auto' });
        if (t.closest('.tm-inner > *') === t && wide) return;   // 절 전체로 갈 때는 깜빡이지 않는다
        t.classList.remove('tm-flash'); void t.offsetWidth; t.classList.add('tm-flash'); setTimeout(() => t.classList.remove('tm-flash'), 1600);
      }, changed && !reduce ? (wide ? 520 : 380) : 0);
    }
    if (o.focus) setTimeout(() => panels[i].focus({ preventScroll: true }), changed && !reduce ? 700 : 0);
  }
  function step(d, o = {}) {
    if (!wide) return go(cur + d, Object.assign({ page: 0 }, o));
    if (d > 0) { if (pg < npg[cur] - 1) go(cur, Object.assign({}, o, { page: pg + 1 })); else if (cur < N - 1) go(cur + 1, Object.assign({}, o, { page: 0 })); else place(); }
    else { if (pg > 0) go(cur, Object.assign({}, o, { page: pg - 1 })); else if (cur > 0) go(cur - 1, Object.assign({}, o, { page: -1 })); else place(); }
  }

  /* 드래그 · 스와이프 — 카드 · 링크 · 차트 위에서도 끈다(가로로 10px 넘게, 세로보다 크게 움직일 때만).
     놓았을 때 장 폭의 15% 를 넘었거나 빠르게 튕기면 다음 / 이전, 아니면 제자리. 양 끝에서는 고무줄처럼 덜 끌린다. 끈 뒤의 클릭은 삼킨다.
     끌지 않는 곳: 입력 칸 · 영상 조작 막대 · 대시보드 축소판(iframe) · 가로로 스크롤되는 칸(표 · 휴대폰 성과 리포트 등) */
  const NODRAG = 'input, select, textarea, [contenteditable], iframe, .player .ctl, .tm-nodrag, .modal, .lightbox';
  const scrollsX = n => { for (; n && n !== stage; n = n.parentElement) { if (n.scrollWidth > n.clientWidth + 1) { const ox = getComputedStyle(n).overflowX; if (ox === 'auto' || ox === 'scroll') return true; } } return false; };
  stage.addEventListener('pointerdown', e => {
    if ((e.pointerType === 'mouse' && e.button !== 0) || e.target.closest(NODRAG) || scrollsX(e.target)) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, on: false, w: wide ? pw : stage.clientWidth, dx: 0, sx: 0, off: 0, hist: [] };
  });
  stage.addEventListener('dragstart', e => { if (wide) e.preventDefault(); });   // 링크 · 그림을 끌어 옮기는 브라우저 기본 동작 대신 장을 넘긴다
  /* (2026-11-16 본인 「모바일로 좌우로 넘길 때 자연스럽게」) 손을 뗀 뒤의 움직임 — 예전에는 늘 0.8초짜리 「천천히 출발 → 가속 → 감속」 곡선이라
     튕긴 속도가 끊기고 한 박자 쉬었다 가는 느낌이었다. 이제 놓는 순간의 손가락 속도로 이어 가다 부드럽게 서는(감속만 하는) 곡선을
     남은 거리에 맞춘 길이(0.2~0.46초)로 쓴다. 다음 끌기 · 다른 이동이 오면 곧바로 풀린다(settle) */
  let easeT = 0;
  function settle() { clearTimeout(easeT); track.style.transition = ''; if (pin) pin.box.style.transition = ''; }
  function ease(rem, v0) {
    if (reduce) return;
    const T = Math.round(clamp(160 + rem * 0.5, 200, 460));
    const s = clamp(v0 * T / Math.max(1, rem), 0.8, 3);   // 곡선의 첫 기울기 = 놓는 순간 속도 ÷ 평균 속도
    const tr = `transform ${T}ms cubic-bezier(.3,${(0.3 * s).toFixed(3)},.25,1)`;
    track.style.transition = tr; if (pin) pin.box.style.transition = tr;
    clearTimeout(easeT); easeT = setTimeout(settle, T + 80);
  }
  addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const rx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(rx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) >= Math.abs(rx)) { drag = null; return; }
      // 시작 문턱(10px)만큼은 빼고 따라간다 — 끌기가 시작되는 순간 화면이 10px 툭 튀던 것
      drag.on = true; drag.sx = Math.sign(rx) * 10; settle();   // 문턱만큼만 뺀다(첫 움직임 전체를 빼면 한 번에 크게 끈 마우스 드래그가 제자리로 돌아왔다)
      main.classList.add('tm-dragging'); track.classList.add('tm-instant'); main.classList.remove('near-l', 'near-r');
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      try { getSelection().removeAllRanges(); } catch (err) {}
    }
    const dx = rx - drag.sx;
    let off = dx;
    if ((atStart() && dx > 0) || (atEnd() && dx < 0) || (!wide && ((cur === 0 && dx > 0) || (cur === N - 1 && dx < 0)))) off = dx * 0.3;   // 양 끝 — 고무줄
    const now = performance.now();
    drag.dx = dx; drag.off = off; drag.hist.push([now, dx]);
    while (drag.hist.length > 2 && now - drag.hist[0][0] > 120) drag.hist.shift();   // 속도는 마지막 0.12초만으로
    place(off);
  });
  const endDrag = e => {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    const d = drag; drag = null;
    if (!d.on) return;
    main.classList.remove('tm-dragging');   // 끄는 중 표시는 판 영역(main)에만 — <html> 에 달면 문서 전체 스타일을 다시 계산했다
    // 놓는 순간 속도(px/ms) — 손을 멈췄다가 떼면 0(예전에는 멈추기 전 빠른 움직임까지 세어 「튕김」으로 잘못 읽을 수 있었다)
    const now = performance.now(), h = d.hist.filter(p => now - p[0] < 110);
    const v = h.length > 1 ? (h[h.length - 1][1] - h[0][1]) / Math.max(8, h[h.length - 1][0] - h[0][0]) : 0;
    const TH = wide ? 0.15 : 0.18;
    let dir = 0;
    if (!e || e.type !== 'pointercancel') {   // 브라우저가 가로챈 경우(시스템 손짓 등)는 제자리로
      if (Math.abs(v) > 0.35) {   // 튕김 — 끈 방향과 같을 때만(왼쪽으로 끌다 오른쪽으로 되돌려 놓으면 「취소」로 보고 제자리)
        dir = (Math.sign(d.dx) === Math.sign(v) || Math.abs(d.dx) < 12) ? (v < 0 ? 1 : -1) : 0;
      } else dir = d.dx < -d.w * TH ? 1 : d.dx > d.w * TH ? -1 : 0;
    }
    const can = dir > 0 ? (wide ? !atEnd() : cur < N - 1) : dir < 0 ? (wide ? !atStart() : cur > 0) : false;
    const target = can ? -dir * d.w : 0;   // 지금 장 기준 도착 위치
    ease(Math.abs(target - d.off), Math.abs(v));
    track.classList.remove('tm-instant');
    if (can) step(dir, { drag: true }); else place();
    const kill = ev => { ev.stopPropagation(); ev.preventDefault(); };
    addEventListener('click', kill, { capture: true, once: true }); setTimeout(() => removeEventListener('click', kill, true), 60);
  };
  addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);

  /* 휠 · 트랙패드 — 넓은 화면은 세로 휠도 장 넘김(한 번 돌림 = 한 장, 손을 멈출 때까지 다음 장으로 가지 않는다).
     안에서 스크롤되는 칸(대시보드 구축 내용 목록 등)이 그쪽으로 더 스크롤될 수 있으면 그 칸에 맡긴다. 좁은 화면은 가로 밀기만 */
  const scrollsY = (n, dy) => { for (; n && n !== stage; n = n.parentElement) { const oy = getComputedStyle(n).overflowY; if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 1) { if (dy > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0) return true; } } return false; };
  let wLock = 0, wAcc = 0, wLast = 0;
  main.addEventListener('wheel', e => {
    if (e.ctrlKey || drag) return;
    const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (!horiz && (!wide || scrollsY(e.target, e.deltaY))) return;
    if (horiz && scrollsX(e.target)) return;
    const now = performance.now();
    if (now - wLast > 220) wAcc = 0;
    wLast = now;
    if (now < wLock) { wLock = Math.max(wLock, now + 180); return; }   // 관성 꼬리는 같은 동작으로 본다
    wAcc += (horiz ? e.deltaX : e.deltaY) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);   // 줄 · 쪽 단위 휠(Firefox 등)도 픽셀로
    if (Math.abs(wAcc) < 40) return;
    step(wAcc > 0 ? 1 : -1); wAcc = 0; wLock = now + (wide ? 520 : 750);
  }, { passive: true });

  /* 키 — ← → (넓은 화면은 ↑ ↓ · PageUp/Down · Space 도). 입력 칸 · 표 · 대화 상자 안에서는 그대로 */
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable], .seg, .modal, .lightbox, .tablewrap')) return;
    const k = e.key, onBtn = e.target.closest && e.target.closest('button, a, summary');
    let d = 0;
    if (k === 'ArrowRight') d = 1; else if (k === 'ArrowLeft') d = -1;
    else if (wide && (k === 'ArrowDown' || k === 'PageDown') && !e.target.closest('.tm-nav, .tm-drop')) d = 1;
    else if (wide && (k === 'ArrowUp' || k === 'PageUp') && !e.target.closest('.tm-nav, .tm-drop')) d = -1;
    else if (wide && k === ' ' && !onBtn) d = e.shiftKey ? -1 : 1;
    if (!d) return;
    if (wide && scrollsY(e.target, d) && (k === 'ArrowDown' || k === 'ArrowUp' || k === 'PageDown' || k === 'PageUp')) return;
    e.preventDefault(); step(d);
  });
  /* 넓은 화면 — 키보드 Tab 으로 다른 장의 단추 · 링크에 가면 그 장으로 */
  document.addEventListener('focusin', e => {
    // 판 자체(go 의 focus 옵션 — 항목으로 간 뒤 판에 초점)는 따라가지 않는다: 판의 장은 늘 0 이라 키보드로 고른 항목 장에서 첫 장으로 튕겼다(교차 검증 11-16)
    if (!wide || !stage.contains(e.target) || e.target.classList.contains('tm-panel') || panels[cur].contains(e.target) === false) return;
    const q = pageOf(e.target, cur); if (q !== pg && (e.target.matches(':focus-visible') || !fine.matches)) go(cur, { page: q });
  });

  /* 페이지 안 링크(#perf · #p-cp1 …) — 그 판(장)으로 옮기고 그 자리로. 본판의 세로 스크롤 처리(app.js)보다 먼저 받는다 */
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || a.closest('.tm-nav')) return;
    const h = a.getAttribute('href'); if (!h || h === '#' || h.startsWith('#/')) return;
    let t = null; try { t = $(h); } catch (err) { return; }
    if (h === '#top' || a.classList.contains('id')) { e.preventDefault(); e.stopImmediatePropagation(); go(0, { page: 0 }); return; }
    const k = t ? panels.findIndex(p => p.contains(t)) : -1; if (k < 0) return;
    e.preventDefault(); e.stopImmediatePropagation();
    go(k, { target: t === inners[k].firstElementChild ? null : t, page: 0 });
  }, true);
  // 판 안에서 펼치기 · 보기 바꾸기를 누르면 높이가 바뀌므로 장을 다시 나눈다 — 단추를 누른 뒤 장 수(판 폭)가 달라졌을 때만.
  // 아무 클릭에나 전체를 다시 나누면 한 번에 약 1초 멈췄다(교차 검증 11-16)
  const sig = () => inners.map(n => n.scrollWidth).join(',');
  stage.addEventListener('click', e => {
    if (!wide || !e.target.closest('button, summary, [aria-expanded]')) return;
    setTimeout(() => { if (wide && !drag && sig() !== lastSig) layout(); }, 450);
  });
  // 내용 높이가 늦게 바뀌는 것(장을 나눈 뒤 차트를 새 폭으로 다시 그림 · 그림 · 숫자 굴리기)도 장 수를 바꾼다 — 성과 네 단계가 옆 장(그로스) 위로
  // 흐리게 겹쳐 보였다(11-16). 0.8초마다 판 폭만 보고 바뀌었으면 다시 나눈다(같으면 아무것도 안 함 · 5초에 3번까지)
  let polls = [];
  setInterval(() => {
    if (!wide || drag || document.hidden || sig() === lastSig) return;
    const now = performance.now(); polls = polls.filter(t => now - t < 5000); if (polls.length >= 3) return;
    polls.push(now); layout();
  }, 800);

  /* 주소 #/주제 · #/주제/장 — 뒤로 / 앞으로 */
  const fromHash = () => { const m = location.hash.match(/^#\/?([a-z]+)(?:[-\/](\d+))?$/) || []; return [TOPICS.findIndex(t => t.id === m[1]), m[2] ? +m[2] - 1 : 0]; };
  const onHash = () => { const [k, q] = fromHash(); if (k >= 0 && (k !== cur || (wide && q !== pg))) go(k, { push: false, page: q }); };
  addEventListener('popstate', onHash); addEventListener('hashchange', onHash);
  let rzT = 0;
  addEventListener('resize', () => {
    const changed = setMode(wideMQ.matches);
    if (wide) {   // 장 폭을 바로 맞추고(어긋남 방지), 나누기는 손을 멈춘 뒤
      pw = stage.clientWidth; ph = stage.clientHeight; root.style.setProperty('--tm-pw', pw + 'px'); root.style.setProperty('--tm-ph', ph + 'px');
      panels.forEach((p, k) => { p.style.width = npg[k] * pw + 'px'; });
    }
    track.classList.add('tm-instant'); place(); requestAnimationFrame(() => track.classList.remove('tm-instant'));
    const restore = changed && wide;
    // 차트는 폭이 바뀐 뒤(ResizeObserver 60ms) 다시 그려지므로 한 번 더 나눈다 — 안 하면 좁게 → 넓게 돌아온 뒤 성과가 두 장으로 남았다
    clearTimeout(rzT); rzT = setTimeout(() => { layout(); go(cur, { page: restore ? restorePg() : pg, instant: true, push: false }); relayout(500); }, changed ? 0 : 160);
    moveInd();
  });
  document.fonts && document.fonts.ready.then(() => { moveInd(); relayout(0); });
  addEventListener('load', () => { relayout(0); relayout(1500); });

  /* 인쇄 — 판을 세로로 다시 쌓는다(style 은 topics.css 인쇄 블록). 넓은 화면 배치(zoom · 장 폭)를 풀고, inert 를 풀어야 인쇄 · 복사에 다 나온다 */
  let printPg = 0;
  addEventListener('beforeprint', () => { printPg = wide ? pg : restorePg(); setMode(false); panels.forEach(p => { p.inert = false; p.removeAttribute('aria-hidden'); }); });
  addEventListener('afterprint', () => { clearTimeout(rzT); setMode(wideMQ.matches); if (wide) layout(); go(cur, { page: wide ? printPg : 0, push: false, instant: true }); relayout(400); });   // 차트가 화면 폭으로 다시 그려진 뒤 한 번 더 나눈다

  // 처음 — #/주제(/장) 가 없으면 본판식 주소(#perf · #p-cp1)도 받아 그 판 · 그 자리로
  setMode(wideMQ.matches);
  layout();
  let [k0, q0] = fromHash(), t0 = null;
  if (k0 < 0 && /^#[\w-]+$/.test(location.hash)) { try { t0 = $(location.hash); } catch (e) { t0 = null; } k0 = t0 ? panels.findIndex(p => p.contains(t0)) : -1; }   // #1abc 처럼 선택자가 안 되는 주소면 첫 판
  if (k0 < 0) { k0 = 0; q0 = 0; }
  go(k0, { instant: true, first: true, page: q0, target: t0 && t0 !== inners[k0].firstElementChild ? t0 : null });
  root.classList.add('tm-ready');
})();
