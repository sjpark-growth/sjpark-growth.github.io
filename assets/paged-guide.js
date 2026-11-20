/* =========================================================================
   넘기는 법 안내 — 본판 index.html(html[data-tm-flow="on"]) 전용(2026-11-20 — 시안 paged.html 에서 시작, 같은 날 본인 「안 C로 진행」으로 본판에)
   본인 「기본을 페이지네이션으로 하되 스크롤/방향키로 이동 가능하게 하고, 이 점에 대해 최대한 잘 알려주는 구조였으면 좋겠어」.
   ① 첫 방문 카드(.pg-coach) — 기기에 맞는 넘기는 법 세 가지를 움직이는 그림으로
      넓은 화면: 휠 · 트랙패드 / 방향키 · Space / 끌어서 넘기기
      좁은 화면(마우스): 끝에서 한 번 더 스크롤 / 방향키 / 옆으로 끌기
      손가락: 옆으로 밀기 / 끝에서 한 번 더 밀어 올리기 / 아래 막대
      모달이 아니다(초점을 뺏지 않음 · 화면을 막지 않음) — 카드를 띄운 채 그대로 휠 · 키 · 손가락을 쓰면 그 칸에 ✓ 가 켜지고 잠시 뒤 저절로 닫힌다.
      한 번 본 뒤로는 이 브라우저에서 다시 띄우지 않는다(localStorage psj-guide-1 · 주소에 ?guide 를 붙이면 늘 띄움)
   ② 「?」 넘기는 법 단추 — 넓은 화면 GNB 장 넘기기 줄 · 좁은 화면 아래 막대(목차 앞). 누르면 카드를 다시 연다
   ③ 카드 안 「스크롤로 이어 보기」 — 상단 #modeBtn 을 누른다(같은 페이지 안 전환 · mode-toggle.js)
   topics.js(FLOW)가 보내는 tm:ready · tm:nav(via = wheel · key · drag · swipe · pull · end · button) · tm:mode · tm:stop 과
   mode-toggle.js 의 psj:view 를 받는다. 판 끝 「다음 주제」 띠 · 차오르는 알약은 topics.js 쪽
   ========================================================================= */
(function () {
  'use strict';
  const root = document.documentElement;
  if (root.dataset.tmFlow !== 'on') return;
  const KEY = 'psj-guide-1';
  const force = /[?&]guide(?:[=&]|$)/.test(location.search);
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
  const markSeen = () => { try { localStorage.setItem(KEY, '1'); } catch (e) {} };
  const D = () => window.TopicsDeck;
  const kind = () => (root.classList.contains('tm-wide') ? 'wide' : fine.matches ? 'narrow' : 'touch');

  /* 움직이는 그림(44×44) — 색은 글자색(currentColor), 움직임은 paged.css 의 .a-* */
  const S = 'viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const IC = {
    wheel: `<svg ${S} stroke-width="1.8"><rect x="13" y="4" width="18" height="27" rx="9"/><path d="M22 4v8" opacity=".3"/><rect class="a-wheel" x="20.6" y="9" width="2.8" height="6" rx="1.4" fill="currentColor" stroke="none"/><path class="a-down" d="M17.5 35.5 22 40l4.5-4.5"/></svg>`,
    keys: `<svg ${S} stroke-width="1.6"><g class="k k-u"><rect x="16" y="4.5" width="12" height="12" rx="3"/><path d="M19.5 12 22 9.5l2.5 2.5"/></g><g class="k k-l"><rect x="2.5" y="19.5" width="12" height="12" rx="3"/><path d="M10 23 7.5 25.5l2.5 2.5"/></g><g class="k k-d"><rect x="16" y="19.5" width="12" height="12" rx="3"/><path d="M19.5 24 22 26.5l2.5-2.5"/></g><g class="k k-r"><rect x="29.5" y="19.5" width="12" height="12" rx="3"/><path d="M34 23l2.5 2.5-2.5 2.5"/></g><rect class="k-sp" x="9" y="35.5" width="26" height="5" rx="2.5"/></svg>`,
    drag: `<svg ${S} stroke-width="1.6"><g class="a-slide"><rect x="8" y="7" width="22" height="30" rx="3.5"/><path d="M12.5 13h9M12.5 17h13" opacity=".4"/><rect x="38" y="7" width="22" height="30" rx="3.5" opacity=".5"/></g><g class="a-hand"><circle cx="27" cy="27" r="7.5" opacity=".28" fill="currentColor" stroke="none"/><circle cx="27" cy="27" r="3.4" fill="currentColor" stroke="none"/></g></svg>`,
    swipe: `<svg ${S} stroke-width="1.6"><rect x="12" y="3" width="20" height="38" rx="4.5"/><path d="M19 7h6"/><path class="a-swa" d="M20 15.5 17.5 18l2.5 2.5" opacity=".55"/><circle class="a-sw" cx="27" cy="26" r="3.4" fill="currentColor" stroke="none"/></svg>`,
    pull: `<svg ${S} stroke-width="1.6"><rect x="12" y="3" width="20" height="38" rx="4.5"/><path d="M16.5 9.5h11M16.5 13.5h8M16.5 17.5h11" opacity=".4"/><path d="M16.5 24h11" stroke-dasharray="1.5 2.5" opacity=".6"/><circle class="a-pu" cx="22" cy="34" r="3.2" fill="currentColor" stroke="none"/></svg>`,
    dock: `<svg ${S} stroke-width="1.6"><rect x="2.5" y="14.5" width="39" height="15" rx="7.5"/><path d="M11 19.5 8.5 22l2.5 2.5"/><path class="a-nx" d="M33 19.5l2.5 2.5-2.5 2.5"/><path d="M18.5 22h7" stroke-width="2.6" opacity=".55"/></svg>`,
  };
  const COPY = {
    wide: {
      t: '한 화면씩 넘겨 보는 포트폴리오',
      d: '스크롤 한 번에 <b>한 장씩</b> 넘어갑니다. 지금 위치는 왼쪽 아래 장 번호와 화면 아래 점으로 보여요.',
      try: '지금 휠을 한 번 굴리거나 → 키를 눌러 보세요',
      ways: [['wheel', '휠 · 트랙패드', '아래로 = 다음 장'], ['keys', '방향키 · Space', '← → ↑ ↓ · PageUp/Down'], ['drag', '끌어서 넘기기', '가장자리 ‹ › 단추도']],
      foot: '왼쪽 주제를 누르면 바로 이동 · 장 번호를 누르면 전체 목차',
    },
    narrow: {
      t: '주제별로 한 장씩 넘겨 보기',
      d: '한 장 안에서는 아래로 스크롤해 읽고, <b>끝에서 한 번 더 내리면</b> 다음 주제로 넘어갑니다.',
      try: '지금 → 키를 눌러 보세요',
      ways: [['wheel', '휠 · 트랙패드', '끝에서 한 번 더'], ['keys', '방향키 · Space', '← → 주제 · ↑ ↓ 읽기'], ['drag', '끌어서 넘기기', '옆으로 끌면 다음 주제']],
      foot: '위 탭을 누르면 바로 이동 · 아래 숫자를 누르면 전체 목차',
    },
    touch: {
      t: '옆으로 넘겨 보는 포트폴리오',
      d: '주제마다 한 장입니다. 위아래로 읽고, <b>옆으로 밀면</b> 다음 주제로 넘어가요.',
      try: '지금 화면을 왼쪽으로 밀어 보세요',
      ways: [['swipe', '옆으로 밀기', '왼쪽 = 다음 주제'], ['pull', '끝에서 한 번 더', '다 읽고 밀어 올리기'], ['dock', '아래 막대', '‹ › · 숫자 = 목차']],
      foot: '',
    },
  };
  const VIA = { wheel: 'wheel', key: 'keys', drag: 'drag', swipe: 'swipe', pull: 'pull', end: 'dock', button: 'dock' };
  const X = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

  let card = null, closeT = 0, k0 = '', sy0 = null;
  function build() {
    const k = kind(), c = COPY[k]; k0 = k;
    const n = document.createElement('div');
    n.className = 'pg-coach'; n.dataset.kind = k;
    n.setAttribute('role', 'dialog'); n.setAttribute('aria-modal', 'false'); n.setAttribute('aria-labelledby', 'pgT'); n.setAttribute('aria-describedby', 'pgD');
    n.innerHTML = `<button type="button" class="pg-x" aria-label="안내 닫기">${X}</button>` +
      `<p class="pg-eb"><i aria-hidden="true"></i>넘기는 법</p><h2 class="pg-t" id="pgT">${c.t}</h2><p class="pg-d" id="pgD">${c.d}</p>` +
      `<ol class="pg-ways">${c.ways.map(([id, b, s]) => `<li data-way="${id}"><span class="pg-ic" aria-hidden="true">${IC[id]}</span><b>${b}</b><small>${s}</small><i class="pg-ok" aria-hidden="true">✓</i></li>`).join('')}</ol>` +
      `<p class="pg-try" aria-live="polite"><span class="pg-pulse" aria-hidden="true"></span><span class="pg-tt">${c.try}</span></p>` +
      `<div class="pg-act"><button type="button" class="pg-go">시작하기</button>${document.getElementById('modeBtn') ? '<button type="button" class="pg-sc">스크롤로 이어 보기</button>' : ''}</div>` +
      (c.foot ? `<p class="pg-foot">${c.foot}</p>` : '');
    n.querySelector('.pg-x').addEventListener('click', () => hide(true));
    n.querySelector('.pg-go').addEventListener('click', () => hide(true));
    const sc = n.querySelector('.pg-sc');
    if (sc) sc.addEventListener('click', () => { hide(true); const b = document.getElementById('modeBtn'); if (b) b.click(); });
    return n;
  }
  function show() {
    if (!D() || !D().active) return;
    clearTimeout(closeT);
    if (card) card.remove();
    card = build(); sy0 = null;
    // 카드는 화면 전체 고정 칸(.pg-layer · contain: strict = 배치 경계) 안에 — 카드 그림이 움직일 때마다 문서 전체 배치(약 10ms)를
    // 다시 돌려, 가만히 있어도 프레임의 약 39% 를 버렸다(11-20 측정 · 2초 배치 808 → 101ms)
    let layer = document.querySelector('.pg-layer');
    if (!layer) { layer = document.createElement('div'); layer.className = 'pg-layer'; document.body.appendChild(layer); }
    layer.appendChild(card);
    root.classList.add('pg-coaching');
    requestAnimationFrame(() => requestAnimationFrame(() => { if (card) card.classList.add('on'); }));
  }
  function hide(mark) {
    clearTimeout(closeT);
    if (mark) markSeen();
    root.classList.remove('pg-coaching');
    const n = card; card = null;
    if (!n) return;
    n.classList.remove('on'); n.classList.add('off');
    setTimeout(() => n.remove(), reduce ? 0 : 320);
  }
  // 카드를 띄운 채 넘기면 — 쓴 방법 칸에 ✓, 문구를 「이렇게 넘기면 됩니다」로, 손을 멈추고 2.6초 뒤 닫힘(계속 넘겨 보면 그동안 열어 둠)
  function learned(via) {
    if (!card) return;
    const id = VIA[via], li = id ? card.querySelector(`[data-way="${id}"]`) : null;
    if (li) li.classList.add('done');
    card.classList.add('good');
    card.querySelector('.pg-tt').textContent = li ? `✓ ${li.querySelector('b').textContent} — 이렇게 넘기면 됩니다` : '✓ 이렇게 넘기면 됩니다';
    markSeen();
    clearTimeout(closeT); closeT = setTimeout(() => hide(true), 2600);
  }

  /* 「넘기는 법」 단추 — 글자로(2026-11-20 본인 「심볼이라 직관적이지 않아 — 텍스트로」, 처음엔 「?」 그림이었다).
     넓은 화면 = GNB 아래 도구 줄의 「스크롤로 보기」 옆, 좁은 화면 = 아래 막대 「목차」 앞. 아래 막대는 켤 때마다 topics.js 가 새로 만드니 그때마다 붙인다 */
  function addHelp() {
    const mode = document.getElementById('modeBtn'), tools = mode && mode.parentElement;
    [[tools, mode ? mode.nextSibling : null, 'iconbtn pg-help'], [document.querySelector('.tm-dock'), document.querySelector('.tm-dock .tm-menu'), 'pg-help']].forEach(([host, before, cls]) => {
      if (!host || host.querySelector(':scope > .pg-help')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = cls; b.title = '휠 · 방향키 · 드래그로 넘기는 법 보기';
      b.textContent = '넘기는 법';
      b.addEventListener('click', () => (card ? hide(false) : show()));
      host.insertBefore(b, before);
    });
  }
  let readyT = 0;
  function ready() {
    addHelp();
    clearTimeout(readyT);   // tm:ready 와 맨 아래 직접 부르기가 겹쳐도 타이머는 하나 — 700ms 안에 닫힌 카드가 한 번 더 뜨지 않게(교차 검증 11-20)
    if (force || !seen()) readyT = setTimeout(() => { if (!card && D() && D().active) show(); }, reduce ? 0 : 700);
  }
  document.addEventListener('tm:ready', ready);
  document.addEventListener('tm:nav', e => learned(e.detail && e.detail.via));
  document.addEventListener('tm:mode', () => { if (card && kind() !== k0) show(); });   // 창 크기로 넓은 ↔ 좁은 배치가 바뀌면 그 배치의 안내로
  // 스크롤판으로 바꾸면 상단 바의 「넘기는 법」도 뗀다(아래 막대 쪽은 topics.js 가 막대째 지운다) — 다시 장 넘김이 켜지면 tm:ready 에서 다시 붙인다
  document.addEventListener('tm:stop', () => { hide(false); document.querySelectorAll('.pg-help').forEach(b => b.remove()); });
  document.addEventListener('psj:view', e => { if (e.detail === 'scroll') hide(true); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && card) hide(true); });
  // 상단 바 · 아래 막대(주제 탭 · 목차 · 테마 등)를 누르면 닫는다 — 이미 둘러볼 줄 아는 것(「?」 단추는 빼고)
  document.addEventListener('pointerdown', e => { if (card && !card.contains(e.target) && e.target.closest && e.target.closest('.mast, .tm-dock') && !e.target.closest('.pg-help')) hide(true); }, true);
  // 카드는 휠 · 드래그 · 스와이프를 아래 화면으로 통과시킨다(paged.css pointer-events) — 그 대신 카드 위를 그냥 눌렀을 때 아래 링크 · 단추가
  // 눌리지 않게 카드 자리의 클릭은 삼킨다(창 단계 capture — topics.js 의 페이지 안 링크 처리보다 먼저). 끌다 놓은 클릭은 topics.js 가 이미 삼킨다
  window.addEventListener('click', e => {
    if (!card || card.contains(e.target)) return;
    const r = card.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  // 좁은 화면 — 카드를 띄운 채 판을 반 화면 넘게 읽어 내리면 닫는다(휴대폰에서 아래 절반을 오래 가리지 않게. 끝에 닿으면 「다음 주제」 띠가 이어서 알려 준다)
  document.addEventListener('scroll', e => {
    const p = e.target;
    if (!card || root.classList.contains('tm-wide') || !(p instanceof Element) || !p.classList.contains('tm-panel')) return;
    if (sy0 == null) { sy0 = p.scrollTop; return; }
    if (Math.abs(p.scrollTop - sy0) > p.clientHeight * 0.5) hide(true);
  }, true);
  if (D() && D().active) ready();   // topics.js 가 먼저 켜졌으면(tm:ready 를 놓쳤을 수 있다 — show 는 두 번 띄우지 않음)
})();
