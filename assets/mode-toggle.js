/* =========================================================================
   보기 전환(안 B 시안 2026-11-16 toggle.html 에서 시작 · 2026-11-20 본판 index.html 도 — 안 C 결정)
   본인 「스크롤, 페이지네이션(지금 수정 중인 양식) 버튼 교체도 가능한 방식 검토 · 안이 각각이면 둘 다 테스트 시안」.
   한 페이지 안에서 스크롤(본판) ↔ 장 넘김(주제별 보기)을 바꾼다 — 페이지를 새로 읽지 않는다. topics.js 의 TopicsDeck.start / stop 을 쓴다.
   · 스크롤 → 장: 화면 위쪽에 걸친 카드 · 절이 놓인 장에서 시작
   · 장 → 스크롤: 지금 장의 카드 · 절로 스크롤
   · 고른 보기는 이 브라우저에 기억(localStorage psj-view — 못 쓰면 늘 처음 보기로 시작)
     (2026-11-20) 단추에 data-store="session" 이면 sessionStorage(이 탭에서만 — 새로 들어오면 늘 기본 보기 · 본판 index.html), data-key 로 이름을 따로
   · 바꾼 뒤 document 에 psj:view(detail = 'deck' | 'scroll') — 안내(paged-guide.js)가 받는다
   안 A(본판 index.html 「장으로 보기」 ↔ topics.html 「스크롤로 보기」, 두 페이지를 주소로 잇기)와 나란히 비교하려는 시안이다
   ========================================================================= */
(function () {
  'use strict';
  const btn = document.getElementById('modeBtn'), D = window.TopicsDeck;
  if (!btn || !D) return;
  const $$ = s => Array.from(document.querySelectorAll(s));
  const KEY = btn.dataset.key || 'psj-view';
  const store = () => (btn.dataset.store === 'session' ? window.sessionStorage : window.localStorage);
  const label = () => {
    const deck = D.active;
    btn.querySelector('span').textContent = deck ? '스크롤로 보기' : '장으로 보기';
    btn.title = deck ? '한 페이지로 이어 보기 — 지금 보던 자리로' : '한 주제씩 장으로 넘겨 보기 — 지금 보던 자리로';
    btn.setAttribute('aria-pressed', String(deck));
  };
  const anchorInScroll = () => {
    const y = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mast-h')) || 60) + 30;
    const hit = n => { const r = n.getBoundingClientRect(); return r.top <= y && r.bottom > y; };
    return $$('.proj[id], .xd[id]').find(hit) || $$('main > section[id]').find(hit) || null;
  };
  const save = v => { try { store().setItem(KEY, v); } catch (e) {} };
  const tell = v => { try { document.dispatchEvent(new CustomEvent('psj:view', { detail: v })); } catch (e) {} };
  function toDeck() {
    const t = anchorInScroll();
    D.start({ target: t, back: false });
    label(); save('deck'); tell('deck');
  }
  function toScroll() {
    const id = D.anchorId();
    D.stop();
    try { history.replaceState(null, '', location.pathname + location.search + (id ? '#' + id : '')); } catch (e) {}
    const t = id && document.getElementById(id);
    // 바로 그 자리로(부드러운 스크롤이면 긴 거리를 굴러가는 동안 엉뚱한 곳이 보였다)
    requestAnimationFrame(() => { if (t) t.scrollIntoView({ block: 'start', behavior: 'instant' }); else window.scrollTo({ top: 0, behavior: 'instant' }); });
    label(); save('scroll'); tell('scroll');
  }
  /* (2026-11-23) 스크롤 → 장은 판을 새로 나누느라 넓은 화면에서 1~2초 걸린다(헤드리스 1463×800 약 1.9초) — 그동안 아무 반응이 없어 멈춘 것처럼 보이지 않게
     단추에 「바꾸는 중…」을 먼저 그린 뒤(다음 프레임) 바꾼다. 장 → 스크롤은 0.1초 안이라 그대로 */
  let busy = false;
  btn.addEventListener('click', () => {
    if (D.active) { toScroll(); return; }
    if (busy) return;
    busy = true;
    btn.querySelector('span').textContent = '바꾸는 중…'; btn.setAttribute('aria-busy', 'true'); btn.style.cursor = 'progress';
    requestAnimationFrame(() => setTimeout(() => {
      try { toDeck(); } finally { busy = false; btn.removeAttribute('aria-busy'); btn.style.cursor = ''; label(); }
    }, 0));
  });
  // 기억한 보기로 — 스크롤로 시작하는 페이지(toggle.html · 11-23 부터 본판 index.html)는 「장」을, 장으로 시작하는 페이지(게시본 아티팩트)는 「스크롤」을 기억했을 때 바꾼다
  /* (2026-11-22 본인 「첫 화면이 페이지네이션 형태로 나오게 하고 스크롤로 변경 가능하게」) 단추에 data-restore="off" 면(본판 index.html) 기억한 보기를 되살리지 않는다 —
     같은 탭에서 「스크롤로 보기」를 누른 뒤 새로고침 · 다시 열기를 하면 스크롤로 시작해 「장 넘김이 안 된다」로 보였다. 늘 장 넘김으로 시작하고 바꾸기는 단추로 */
  /* (2026-11-23 본인 「스크롤이 메인 페이지로 노출되게」) 본판 index.html 은 이제 스크롤판으로 시작한다(html.tabmode 없음 · data-restore="off" 그대로 — 늘 스크롤로 시작) */
  let v = null; if (btn.dataset.restore !== 'off') { try { v = store().getItem(KEY); } catch (e) {} }
  const later = fn => { if (document.readyState === 'complete') setTimeout(fn, 0); else addEventListener('load', fn, { once: true }); };
  if (v === 'deck' && !D.active) later(toDeck);
  else if (v === 'scroll' && D.active) later(toScroll);
  /* 스크롤판으로 열렸는데 주소가 장 넘김 꼴(#work-3 · #/work/3 · #intro — 11-20 ~ 11-22 장 넘김에서 복사한 링크)이면 그 주제의 절로 간다(첫 화면 intro 는 맨 위) */
  const deckHash = run => {
    if (D.active) return;
    const m = location.hash.match(/^#\/?([a-z]+)(?:[-\/](\d+))?$/);
    if (!m || !(m[2] || m[1] === 'intro' || !document.getElementById(m[1]))) return;
    const base = m[1] === 'intro' ? null : document.getElementById(m[1]);
    if (!base && m[1] !== 'intro') return;
    try { history.replaceState(null, '', location.pathname + location.search + (base ? '#' + m[1] : '')); } catch (e) {}
    run(() => { if (base) base.scrollIntoView({ block: 'start', behavior: 'instant' }); else window.scrollTo({ top: 0, behavior: 'instant' }); });
  };
  deckHash(later);
  addEventListener('hashchange', () => deckHash(fn => fn()));   // 같은 페이지 안에서 장 넘김 꼴 주소로 옮겨 갈 때(장 넘김이 켜져 있으면 topics.js 가 받는다)
  label();
})();
