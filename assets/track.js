/* track.js — 방문 흐름 · 이탈 분석 (2026-11-25 본인 「뷰저블 같은 방식으로 이탈 분석 — GTM + GA4 + 클래리티」). CLAUDE.md 5-7
   · 사이트는 dataLayer 에만 이벤트를 넣는다. 어디로 보낼지(GA4 · Clarity)는 GTM 화면에서 정한다 — 설정법 tools/analytics/GTM_설정.md
   · GTM 은 ① GTM_ID 가 있고 ② 공개 주소(sjpark-growth.github.io)이고 ③ 본인 · 자동 점검 · 추적 거부가 아닐 때만, 페이지가 다 뜬 뒤 한가할 때 받는다
     → 첫 화면 요청 · 용량은 그대로. GTM_ID 가 비어 있거나 로컬 · 워크트리 · 아티팩트에서는 외부 요청 0
   · 본인 방문 빼기: 주소에 ?notrack 을 한 번 붙여 열면 이 브라우저는 계속 빠진다(?notrack=0 이면 다시 셈)
   · 개인 정보는 보내지 않는다 — 메일 · 전화 글자, 입력값 없음. 유입 표시(?src= · utm_source)는 영문 · 숫자 · _ - 40자만
   · 인쇄 · PDF 에는 아무것도 더하지 않는다(안내 문구는 인쇄에서 숨김) */
(function () {
  'use strict';
  var GTM_ID = 'GTM-P9NRDTDV';                       // GTM 컨테이너(2026-11-25 · 계정 sjpark-growth). 비우면('') GTM 을 받지 않는다
  var HOST = /^sjpark-growth\.github\.io$/;
  var W = window, D = document, root = D.documentElement;
  var T = W.PSJ_TRACK_TEST || null;                  // 헤드리스 시험용(페이지보다 먼저 넣는다) — { gtm: 'GTM-TEST' }
  var gtm = (T && T.gtm) || GTM_ID;
  var now = function () { return Date.now(); };
  var arg = function (name) {
    var m = new RegExp('[?&]' + name + '(?:=([^&#]*))?(?:&|#|$)').exec(location.search);
    if (!m) return null; try { return m[1] === undefined ? '' : decodeURIComponent(m[1]); } catch (e) { return ''; }
  };
  var store = function (s, k, v) {
    try { var o = W[s]; if (v === undefined) return o.getItem(k); if (v === null) o.removeItem(k); else o.setItem(k, v); } catch (e) {}
    return null;
  };
  var clean = function (v) { return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40); };

  /* ---------- 보낼지 판정 ---------- */
  var nt = arg('notrack'); if (nt !== null) store('localStorage', 'psj-notrack', nt === '0' ? null : '1');
  var optout = store('localStorage', 'psj-notrack') === '1' || navigator.doNotTrack === '1' || W.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  var live = !!gtm && /^GTM-[A-Z0-9]+$/.test(gtm) && !optout && (T ? true : HOST.test(location.hostname) && navigator.webdriver !== true);

  /* ---------- 맥락(모든 이벤트에 같이 실림 — GTM 데이터 영역 변수) ---------- */
  var path = location.pathname;
  var page = /en\.html$/.test(path) ? 'en' : /resume-pdf\.html$/.test(path) ? 'resume_pdf' : /(^|\/)(index\.html)?$/.test(path) ? 'home' : 'other';
  var src = clean(arg('src') || arg('utm_source')); if (src) store('sessionStorage', 'psj-src', src);
  src = store('sessionStorage', 'psj-src') || '(direct)';
  var angle = clean(arg('for')); if (angle) store('sessionStorage', 'psj-for', angle);
  angle = store('sessionStorage', 'psj-for') || 'default';
  var share = root.classList.contains('share-view') ? 'on' : 'off';
  var view = function () { return page !== 'home' ? 'page' : root.classList.contains('tabmode') ? 'deck' : 'scroll'; };

  var dl = W.dataLayer = W.dataLayer || [];
  if (live) dl.push({ 'gtm.start': now(), event: 'gtm.js' });     // 표준 GTM 조각과 같은 순서(먼저 시작 표시 → 스크립트는 나중에)
  var push = function (o) { dl.push(o); };
  // Clarity — GTM 의 Clarity 태그(공식 조각)가 같은 대기열(window.clarity.q)을 이어받는다
  var clarity = function () {
    if (!live) return;
    W.clarity = W.clarity || function () { (W.clarity.q = W.clarity.q || []).push(arguments); };
    try { W.clarity.apply(null, arguments); } catch (e) {}
  };
  var ctx = function () { return { psj_page: page, psj_view: view(), psj_angle: angle, psj_share: share, psj_src: src }; };
  var setCtx = function () {
    var c = ctx(); push(Object.assign({ event: 'psj_ctx' }, c));
    Object.keys(c).forEach(function (k) { clarity('set', k.replace('psj_', ''), c[k]); });
  };
  setCtx();

  /* ---------- 지금 보는 곳 · 가장 깊이 본 곳 · 머문 시간 ---------- */
  var cur = null, curIdx = -1, curN = 0, since = 0, maxIdx = -1, maxN = 0, seen = {}, nSeen = 0, secT = 0;
  var dwell = 0, visAt = D.visibilityState === 'visible' ? now() : 0, leaves = 0;
  var depth = function () { return maxN ? Math.round((maxIdx + 1) / maxN * 100) : 0; };
  function enter(id, idx, n, via) {
    if (!id || id === cur) return;
    cur = id; curIdx = idx; curN = n; since = now();
    if (!seen[id]) { seen[id] = 1; nSeen++; }
    if (n !== maxN) { maxN = n; maxIdx = -1; }                     // 장 넘김 ↔ 스크롤로 바뀌면 전체 수가 달라져 깊이를 새로 센다
    if (idx > maxIdx) maxIdx = idx;
    clarity('set', 'last_section', id); clarity('set', 'max_depth', String(depth()));
    clearTimeout(secT);                                             // 빨리 지나친 곳(0.8초 안)은 이벤트를 남기지 않는다 — 마지막 위치 표시는 바로 바뀜
    secT = setTimeout(function () {
      push({ event: 'psj_section', psj_section: id, psj_section_index: idx + 1, psj_section_total: n, psj_depth: depth(), psj_via: via || '', psj_view: view() });
    }, 800);
  }

  // 스크롤로 볼 때 — 화면 위에서 45% 줄을 지난 마지막 덩어리
  var LIST = {
    home: [['.hero', 'intro'], ['#summary'], ['#results'], ['#dash'], ['#xdash'], ['#perf'], ['#growth'], ['#work'], ['#pillars'], ['#career'], ['#beliefs'], ['#contact']],
    en: null, resume_pdf: null, other: null
  };
  function marks() {
    if (page === 'home') return LIST.home.map(function (x) { var n = D.querySelector(x[0]); return n && n.offsetParent !== null ? [n, x[1] || x[0].slice(1)] : null; }).filter(Boolean);
    if (page === 'en') return [[D.querySelector('main') || D.body, 'top']].concat([].map.call(D.querySelectorAll('h2[id]'), function (h) { return [h, h.id]; }));
    if (page === 'resume_pdf') return [].map.call(D.querySelectorAll('.pg'), function (p, i) { return [p, 'p' + (i + 1)]; });
    return [[D.body, 'top']];
  }
  var scrollT = 0;
  function onScroll() {
    if (scrollT || view() === 'deck') return;
    scrollT = setTimeout(function () {
      scrollT = 0; if (view() === 'deck') return;
      var m = marks(), line = innerHeight * 0.45, k = 0;
      for (var i = 0; i < m.length; i++) if (m[i][0].getBoundingClientRect().top <= line) k = i;
      // 페이지 끝에 닿으면 마지막 덩어리(짧은 마지막 절은 45% 줄까지 못 올라온다)
      if (innerHeight + scrollY >= D.documentElement.scrollHeight - 4) k = m.length - 1;
      if (m[k]) enter(m[k][1], k, m.length, 'scroll');
    }, 250);
  }
  addEventListener('scroll', onScroll, { passive: true });

  // 장으로 볼 때 — topics.js 가 넘길 때마다 tm:nav, 켤 때 tm:ready (주소 #work · #work-3)
  function deckNow(via) {
    var I = W.TopicsDeck && W.TopicsDeck.info && W.TopicsDeck.info(); if (!I) return;
    var m = /^#([a-z]+)/.exec(location.hash || ''), id = (m ? m[1] : 'intro') + (I.pages > 1 ? '-' + (I.pg + 1) : '');
    enter(id, I.at, I.total, via);
  }
  D.addEventListener('tm:ready', function () { setTimeout(function () { deckNow('start'); }, 0); });
  D.addEventListener('tm:nav', function (e) { deckNow(e.detail && e.detail.via); });
  D.addEventListener('psj:view', function (e) {
    var v = e.detail === 'deck' ? 'deck' : 'scroll';
    push(Object.assign({ event: 'psj_view_change' }, ctx(), { psj_view: v })); clarity('set', 'view', v); clarity('event', 'view_' + v);
    cur = null; setTimeout(function () { if (v === 'deck') deckNow('toggle'); else onScroll(); }, 50);
  });

  /* ---------- 떠날 때(탭 숨김 · 닫기) — 마지막으로 본 곳 · 깊이 · 머문 시간 ---------- */
  function hidden() {
    if (visAt) { dwell += now() - visAt; visAt = 0; }
    if (!cur) return;
    leaves++;
    push({ event: 'psj_leave', psj_section: cur, psj_section_index: curIdx + 1, psj_section_total: curN, psj_depth: depth(), psj_seen: nSeen,
      psj_engaged_sec: Math.round(dwell / 1000), psj_section_sec: Math.round((now() - since) / 1000), psj_leave_n: leaves, psj_view: view() });
  }
  D.addEventListener('visibilitychange', function () { if (D.visibilityState === 'hidden') hidden(); else if (!visAt) visAt = now(); });
  addEventListener('pagehide', function () { if (D.visibilityState !== 'hidden') hidden(); });

  /* ---------- 누른 것 ---------- */
  var act = function (type, target) {
    push({ event: 'psj_click', psj_click: type, psj_target: target || '', psj_section: cur || '', psj_view: view() });
    clarity('event', type);
  };
  D.addEventListener('click', function (e) {
    var el = e.target && e.target.closest && e.target.closest('a,button'); if (!el) return;
    var h = el.getAttribute('href') || '', m;
    if (el.id === 'printBtn') return act('print_click', 'full');
    if (el.id === 'shortBtn') return act('print_click', 'short');
    if (el.id === 'demoNewTab') return act('demo_newtab', (/([a-z]+)-demo\.html/.exec(h) || [])[1]);
    if (/resume-pdf\.html/.test(h)) return act('resume_view');
    if (/\.pdf([?#]|$)/i.test(h)) return act(el.hasAttribute('download') ? 'resume_download' : 'resume_open');
    if ((m = /([a-z]+)-demo\.html/.exec(h))) return act('demo_open', m[1]);
    if (/^mailto:/i.test(h)) return act('email_click');           // 주소는 보내지 않는다
    if (/^tel:/i.test(h)) return act('phone_click');
    if (el.hasAttribute('data-copy')) return act('email_copy');
    if (el.id === 'enBtn' || /(^|\/)en\.html/.test(h)) return act('en_open');
    if (page !== 'home' && (/^\.\/(\?[^#]*)?$/.test(h) || /(^|\/)index\.html/.test(h))) return act('home_open');   // en · 이력서 보기 → 포트폴리오
    if (el.host && el.host !== location.host && /^https?:/i.test(el.href || '')) return act('outbound', el.hostname);
  }, true);
  // 대시보드 데모 크게 보기(모달 — app.js openDemo, 링크가 아니라 단추 · 그림에서 연다)
  var modal = D.getElementById('demoModal');
  if (modal && W.MutationObserver) new MutationObserver(function () {
    if (modal.hidden) return;
    setTimeout(function () { var f = D.getElementById('demoFrame'), s = f && (f.getAttribute('src') || ''); act('demo_open', (/([a-z]+)-demo\.html/.exec(s) || [])[1] || 'dashboard'); }, 0);
  }).observe(modal, { attributes: true, attributeFilter: ['hidden'] });
  addEventListener('beforeprint', function () { push({ event: 'psj_print', psj_section: cur || '', psj_view: view() }); clarity('event', 'print'); });

  /* ---------- 안내 문구(보낼 때만 · 화면에서만) ---------- */
  function note() {
    if (!live) return;
    var st = D.createElement('style');
    st.textContent = '.trk-note{font-size:12px;line-height:1.5;color:var(--ink-3,#5d6b80);margin:6px 0 0}@media print{.trk-note{display:none!important}}';
    D.head.appendChild(st);
    var en = page === 'en', p = D.createElement(en ? 'span' : 'p'); p.className = 'trk-note';
    p.textContent = en ? 'This site uses Google Analytics and Microsoft Clarity to collect anonymous visit data (sections viewed, clicks) to improve the page. Opt out: add ?notrack to the address.'
      : '읽기 쉽게 고치려고 Google 애널리틱스 · Microsoft Clarity 로 익명 방문 기록(본 화면 · 누른 곳)을 모읍니다. 빼려면 주소 끝에 ?notrack';
    var host = en ? D.querySelector('.en-foot') : D.querySelector('.foot .shell') || D.querySelector('.rp-end') || D.body;
    if (en && host) { host.appendChild(D.createElement('br')); p.style.display = 'inline-block'; }
    host.appendChild(p);
  }

  /* ---------- GTM 받기 — 페이지가 다 뜬 뒤 한가할 때 ---------- */
  function load() {
    if (!live || load.done) return; load.done = true;
    var s = D.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(gtm);
    D.head.appendChild(s);
  }
  function boot() {
    note();
    if (view() === 'deck') deckNow('start'); else onScroll();
    if (W.requestIdleCallback) requestIdleCallback(load, { timeout: 4000 }); else setTimeout(load, 1500);
  }
  if (D.readyState === 'complete') boot(); else addEventListener('load', boot, { once: true });

  // 시험 · 진단용(콘솔에서 PSJTrack.state())
  W.PSJTrack = { state: function () { return { live: live, gtm: gtm, optout: optout, page: page, view: view(), src: src, angle: angle, share: share, cur: cur, depth: depth(), seen: nSeen }; } };
})();
