/* =========================================================================
   보기 전환 시안(안 B · 2026-11-16) — toggle.html 전용
   본인 「스크롤, 페이지네이션(지금 수정 중인 양식) 버튼 교체도 가능한 방식 검토 · 안이 각각이면 둘 다 테스트 시안」.
   한 페이지 안에서 스크롤(본판) ↔ 장 넘김(주제별 보기)을 바꾼다 — 페이지를 새로 읽지 않는다. topics.js 의 TopicsDeck.start / stop 을 쓴다.
   · 스크롤 → 장: 화면 위쪽에 걸친 카드 · 절이 놓인 장에서 시작
   · 장 → 스크롤: 지금 장의 카드 · 절로 스크롤
   · 고른 보기는 이 브라우저에 기억(localStorage psj-view — 못 쓰면 늘 스크롤로 시작)
   안 A(본판 index.html 「장으로 보기」 ↔ topics.html 「스크롤로 보기」, 두 페이지를 주소로 잇기)와 나란히 비교하려는 시안이다
   ========================================================================= */
(function () {
  'use strict';
  const btn = document.getElementById('modeBtn'), D = window.TopicsDeck;
  if (!btn || !D) return;
  const $$ = s => Array.from(document.querySelectorAll(s));
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
  const save = v => { try { localStorage.setItem('psj-view', v); } catch (e) {} };
  function toDeck() {
    const t = anchorInScroll();
    D.start({ target: t, back: false });
    label(); save('deck');
  }
  function toScroll() {
    const id = D.anchorId();
    D.stop();
    try { history.replaceState(null, '', location.pathname + location.search + (id ? '#' + id : '')); } catch (e) {}
    const t = id && document.getElementById(id);
    // 바로 그 자리로(부드러운 스크롤이면 긴 거리를 굴러가는 동안 엉뚱한 곳이 보였다)
    requestAnimationFrame(() => { if (t) t.scrollIntoView({ block: 'start', behavior: 'instant' }); else window.scrollTo({ top: 0, behavior: 'instant' }); });
    label(); save('scroll');
  }
  btn.addEventListener('click', () => (D.active ? toScroll() : toDeck()));
  let v = null; try { v = localStorage.getItem('psj-view'); } catch (e) {}
  if (v === 'deck') { if (document.readyState === 'complete') toDeck(); else addEventListener('load', toDeck, { once: true }); }
  label();
})();
