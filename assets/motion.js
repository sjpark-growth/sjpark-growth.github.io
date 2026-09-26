/* =========================================================================
   모션 영상 — 실제 데이터로 움직이는 캔버스 장면 + 영상 플레이어
   · 가상 해상도 1280×720 에 그리고 화면 크기에 맞춰 확대/축소
   · data.js 의 video 에 mp4 경로가 있으면 같은 플레이어로 실제 영상을 재생
   ========================================================================= */
(function () {
  'use strict';
  const VW = 1280, VH = 720;
  const FS = '"Pretendard","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif';
  const FN = '"Bahnschrift","DIN Alternate","Roboto Condensed","Arial Narrow",' + FS;
  const FM = '"Cascadia Mono","SF Mono",Consolas,monospace';
  const C = {
    bg: '#0b1320', panel: '#111c2f', panel2: '#17253d', line: 'rgba(255,255,255,.08)', line2: 'rgba(255,255,255,.16)',
    ink: '#eef2f9', ink2: '#aab7cb', ink3: '#6c7d95', accent: '#8b9bff', accentD: '#5b6cf0',
    c1p: '#4a93ea', c3p: '#ee7a45', cnv: '#22b985', csm: '#e0a52c', good: '#46c97c', warn: '#f0b54a', bad: '#ef6b6b', before: '#56657c',
    sheet: '#16402d', sheetInk: '#bfe8cf',
  };
  const S = window.SERIES;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    out: t => 1 - Math.pow(1 - t, 3),
    inOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmt = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const ml = m => `${m.slice(2, 4)}.${+m.slice(5)}`;
  const N = S.months.length, TEN = S.months.indexOf(S.tenureStart);
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t));

  /* ------------------------------------------------------------ drawing kit */
  function kit(ctx) {
    const g = { ctx };
    g.font = (size, weight = 500, kind = 'sans') => {
      ctx.font = `${weight} ${size}px ${kind === 'num' ? FN : kind === 'mono' ? FM : FS}`;
      try { ctx.fontStretch = kind === 'num' ? 'semi-condensed' : 'normal'; } catch (e) {}
    };
    g.text = (str, x, y, o = {}) => {
      ctx.save(); ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
      g.font(o.size || 20, o.weight || 500, o.font || 'sans');
      ctx.fillStyle = o.color || C.ink; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
      if (o.ls != null) try { ctx.letterSpacing = o.ls + 'px'; } catch (e) {}
      ctx.fillText(str, x, y); const w = ctx.measureText(str).width; ctx.restore(); return w;
    };
    g.measure = (str, size, weight, kind) => { ctx.save(); g.font(size, weight, kind); const w = ctx.measureText(str).width; ctx.restore(); return w; };
    g.rr = (x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else ctx.rect(x, y, w, h); };
    g.box = (x, y, w, h, o = {}) => {
      if (w <= 0.5 || h <= 0.5) return;
      ctx.save(); ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
      g.rr(x, y, w, h, o.r == null ? 8 : o.r);
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
      if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 1; if (o.dash) ctx.setLineDash(o.dash); ctx.stroke(); }
      ctx.restore();
    };
    g.line = (x1, y1, x2, y2, o = {}) => {
      ctx.save(); ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
      ctx.strokeStyle = o.color || C.line2; ctx.lineWidth = o.w || 1; ctx.lineCap = 'round';
      if (o.dash) ctx.setLineDash(o.dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    };
    g.circle = (x, y, r, o = {}) => {
      if (r <= 0) return; ctx.save(); ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
      if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw || 2; ctx.stroke(); }
      ctx.restore();
    };
    g.arc = (x, y, r, a0, a1, o = {}) => {
      ctx.save(); ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
      ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.strokeStyle = o.color; ctx.lineWidth = o.w || 10; ctx.lineCap = o.cap || 'butt'; ctx.stroke(); ctx.restore();
    };
    // 진행도만큼 그리는 꺾은선. 끝점 좌표를 돌려준다
    g.poly = (pts, o = {}) => {
      const good = pts.filter(Boolean); if (good.length < 2) return null;
      const p = o.progress == null ? 1 : o.progress; const total = good.length - 1, upto = p * total;
      ctx.save(); ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
      ctx.strokeStyle = o.color || C.ink; ctx.lineWidth = o.w || 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (o.dash) ctx.setLineDash(o.dash);
      ctx.beginPath(); ctx.moveTo(good[0][0], good[0][1]);
      const k = Math.floor(upto);
      for (let i = 1; i <= k; i++) ctx.lineTo(good[i][0], good[i][1]);
      let head = good[k];
      if (k < total) { const a = good[k], b = good[k + 1], f = upto - k; head = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; ctx.lineTo(head[0], head[1]); }
      ctx.stroke(); ctx.restore();
      return head;
    };
    // 개선 구간 강조선: from 이후 구간이 오른쪽으로 갈수록 흰색에 가까워지고 굵어진다
    g.polyGlow = (pts, o = {}) => {
      const p = o.progress == null ? 1 : o.progress, total = pts.length - 1, upto = p * total, from = o.from || 0;
      const c0 = hex(o.c0 || C.accent), c1 = hex(o.c1 || '#ffffff');
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      let head = pts[0];
      for (let k = 0; k < total && k < upto; k++) {
        const a = pts[k], b = pts[k + 1]; const f = Math.min(1, upto - k);
        const e = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; head = e;
        if (k < from) { ctx.strokeStyle = o.cb || C.before; ctx.lineWidth = o.w0 || 3; ctx.globalAlpha = .8; }
        else { const q = (k - from) / Math.max(1, total - from - 1); const c = mix(c0, c1, Math.pow(q, 1.3)); ctx.strokeStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.lineWidth = lerp(o.w0 || 3, o.w1 || 7, q); ctx.globalAlpha = 1; }
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
      }
      ctx.restore(); return head;
    };
    g.area = (pts, baseY, o = {}) => {
      const good = pts.filter(Boolean); if (good.length < 2) return;
      ctx.save(); ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha);
      const grad = ctx.createLinearGradient(0, Math.min(...good.map(p => p[1])), 0, baseY);
      grad.addColorStop(0, o.color); grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.moveTo(good[0][0], baseY);
      good.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(good[good.length - 1][0], baseY); ctx.closePath(); ctx.fill(); ctx.restore();
    };
    g.alpha = (a, fn) => { if (a <= 0.001) return; ctx.save(); ctx.globalAlpha *= a; fn(); ctx.restore(); };
    g.pop = (p, cx, cy, fn) => {
      if (p <= 0.001) return; const sc = lerp(0.82, 1, E.back(clamp(p)));
      ctx.save(); ctx.globalAlpha *= clamp(p * 1.6); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-cx, -cy); fn(); ctx.restore();
    };
    g.shift = (dx, dy, fn) => { ctx.save(); ctx.translate(dx, dy); fn(); ctx.restore(); };
    g.clip = (x, y, w, h, fn) => { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); fn(); ctx.restore(); };
    g.check = (x, y, s, color, p = 1) => {
      if (p <= 0) return; ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, s * 0.15); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const pts = [[x - s * .32, y + s * .02], [x - s * .06, y + s * .28], [x + s * .36, y - s * .26]];
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      const a = clamp(p * 2), b = clamp(p * 2 - 1);
      ctx.lineTo(lerp(pts[0][0], pts[1][0], a), lerp(pts[0][1], pts[1][1], a));
      if (b > 0) ctx.lineTo(lerp(pts[1][0], pts[2][0], b), lerp(pts[1][1], pts[2][1], b));
      ctx.stroke(); ctx.restore();
    };
    g.arrow = (x1, y1, x2, y2, o = {}) => {
      const p = o.progress == null ? 1 : o.progress; if (p <= 0) return;
      const x = lerp(x1, x2, p), y = lerp(y1, y2, p);
      g.line(x1, y1, x, y, { color: o.color || C.ink3, w: o.w || 2, alpha: o.alpha });
      const a = Math.atan2(y2 - y1, x2 - x1), s = o.head || 9;
      ctx.save(); ctx.globalAlpha *= (o.alpha == null ? 1 : o.alpha); ctx.fillStyle = o.color || C.ink3; ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x - s * Math.cos(a - .45), y - s * Math.sin(a - .45)); ctx.lineTo(x - s * Math.cos(a + .45), y - s * Math.sin(a + .45)); ctx.closePath(); ctx.fill(); ctx.restore();
    };
    g.kicker = (str, x = 64, y = 74) => g.text(str, x, y, { size: 15, weight: 600, color: C.ink3, font: 'mono', ls: 1.5 });
    g.pill = (str, x, y, o = {}) => {
      const size = o.size || 16; const w = g.measure(str, size, o.weight || 600) + (o.padX || 14) * 2; const h = size + (o.padY || 9) * 2;
      const bx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      g.box(bx, y, w, h, { fill: o.fill || C.panel2, r: o.r == null ? h / 2 : o.r, stroke: o.stroke, alpha: o.alpha });
      g.text(str, bx + w / 2, y + h / 2 + size * 0.36, { size, weight: o.weight || 600, color: o.color || C.ink, align: 'center', alpha: o.alpha });
      return w;
    };
    // 전후 비교 가로 막대
    g.beforeAfter = (x, y, w, label, from, to, max, o = {}) => {
      const p = o.progress == null ? 1 : o.progress; const h = o.h || 26;
      g.text(label, x, y - 10, { size: o.labelSize || 17, weight: 600, color: C.ink2 });
      g.box(x, y, w, h, { fill: 'rgba(255,255,255,.05)', r: 6 });
      g.box(x, y, w * from / max, h, { stroke: C.before, lw: 1.5, r: 6, dash: [5, 4] });
      const cur = lerp(from, to, E.inOut(p));
      g.box(x, y, Math.max(8, w * cur / max), h, { fill: o.color || C.accent, r: 6 });
      const lbl = `${fmt(from, o.dec || 0)}${o.unit || ''} → ${fmt(cur, o.dec || 0)}${o.unit || ''}`;
      g.text(lbl, x + w + 16, y + h * 0.75, { size: o.valSize || 22, weight: 600, font: 'num', color: C.ink, align: 'left' });
    };
    return g;
  }

  // 월 축 좌표계
  function monthAxis(x, w) { const step = w / N; return { step, X: i => x + (i + 0.5) * step }; }
  function drawMonthTicks(g, ax, y, alpha = 1) {
    S.months.forEach((m, i) => {
      if (!(m.endsWith('-01') || i === TEN || i === N - 1 || +m.slice(5) === 7 && m.startsWith('2026'))) return;
      g.text(ml(m), ax.X(i), y, { size: 13, color: i === TEN ? C.accent : C.ink3, align: 'center', font: 'num', alpha, weight: i === TEN ? 700 : 500 });
    });
  }
  function tenureLine(g, ax, y1, y2, alpha = 1) {
    const x = ax.X(TEN) - ax.step / 2;
    g.line(x, y1, x, y2, { color: C.accent, w: 2, alpha });
    g.text('입사 25.7', x + 8, y1 + 16, { size: 14, weight: 700, color: C.accent, alpha });
  }

  /* ------------------------------------------------------------ scenes */
  const SCENES = {};

  /* 1 · 대시보드 구축 */
  SCENES.dashboard = {
    duration: 18, poster: 14.8,
    chapters: [[0, '매체별 엑셀 원본 9종 — 쿠팡 광고 원본만 90만 행'], [5, '원본은 건드리지 않고 파싱 → 모든 구간을 월 합계와 대조 검증'], [9.6, '예산 페이스 · 브랜드 의존도 · 일별 효율 · 품목별 성과를 한 화면에'], [15.8, '흩어진 엑셀 리포트 9종을 매일 아침 한 화면으로']],
    draw(g, t) {
      const files = ['쿠팡 광고 현황 v2.8', '쿠팡 PMC 모니터링', '쿠팡 NCA 효율', '네이버 광고 현황 V2.3', '비마트 광고 현황', '컬리 광고 현황', '이지웰 광고', '에이블리 광고', '일별 매출·카테고리'];
      const toStack = E.inOut(seg(t, 4.7, 6.1)), fadeA = 1 - seg(t, 9.0, 9.8);
      g.alpha(fadeA, () => g.kicker(t < 5 ? 'SOURCE · 매체별 워크북' : 'PIPELINE · 파싱 → 정규화 → 검증'));
      files.forEach((f, i) => {
        const r = Math.floor(i / 3), c = i % 3;
        const ap = E.out(seg(t, 0.2 + i * 0.16, 0.8 + i * 0.16));
        const x = lerp(64 + c * 272, 64, toStack), y = lerp(104 + r * 158, 104 + i * 50, toStack);
        const w = lerp(250, 250, toStack), h = lerp(140, 40, toStack);
        g.alpha(ap * fadeA, () => {
          g.box(x, y, w, h, { fill: C.panel, r: 10, stroke: C.line });
          g.box(x, y, w, Math.min(30, h), { fill: C.sheet, r: 10 });
          g.text(f, x + 14, y + Math.min(30, h) / 2 + 5, { size: 14, weight: 600, color: C.sheetInk });
          if (h > 70) for (let k = 0; k < 5; k++) {
            const yy = y + 44 + k * 18, v = 0.25 + 0.65 * ((Math.sin(i * 2.1 + k * 1.7 + t * 1.6) + 1) / 2);
            g.box(x + 14, yy, w - 28, 9, { fill: 'rgba(255,255,255,.05)', r: 3, alpha: (h - 70) / 70 });
            g.box(x + 14, yy, (w - 28) * v, 9, { fill: 'rgba(191,232,207,.22)', r: 3, alpha: (h - 70) / 70 });
          }
        });
      });
      // 행 카운터
      g.alpha(seg(t, 0.6, 1.2) * (1 - toStack), () => {
        const v = Math.floor(902290 * E.out(seg(t, 0.6, 4.3)));
        g.text('쿠팡 광고 RAW', 900, 170, { size: 18, color: C.ink3 });
        g.text(fmt(v), 900, 244, { size: 76, weight: 600, font: 'num' });
        g.text('행 · 키워드 × 지면 × 상품 × 일', 900, 282, { size: 18, color: C.ink2 });
        g.text('피벗 56개 · 버전 v1.5 → v2.8', 900, 330, { size: 18, color: C.ink3 });
      });
      // 파이프라인
      const pB = seg(t, 5.4, 9.2);
      g.alpha(pB > 0 ? Math.min(1, pB * 4) * fadeA : 0, () => {
        const nodes = [['파싱', '읽기 전용'], ['정규화', 'ROAS 기준 통일'], ['검증', '월 합계 대조']];
        nodes.forEach(([a, b], k) => {
          const p = E.out(seg(t, 5.5 + k * 0.45, 6.2 + k * 0.45)); const x = 420 + k * 270, y = 170;
          g.pop(p, x + 100, y + 45, () => {
            g.box(x, y, 200, 90, { fill: C.panel2, r: 12, stroke: k === 2 ? C.good : C.line2 });
            g.text(a, x + 100, y + 42, { size: 26, weight: 700, align: 'center' });
            g.text(b, x + 100, y + 70, { size: 15, color: C.ink2, align: 'center' });
          });
          if (k < 2) g.arrow(x + 204, y + 45, x + 266, y + 45, { progress: E.out(seg(t, 6 + k * .45, 6.5 + k * .45)), color: C.ink3 });
        });
        g.arrow(318, 215, 414, 215, { progress: E.out(seg(t, 5.6, 6.1)), color: C.ink3 });
        // 흐르는 입자
        for (let k = 0; k < 14; k++) {
          const ph = ((t * 0.55 + k / 14) % 1); const x = lerp(320, 1210, ph);
          g.circle(x, 215 + Math.sin(k * 7 + t * 3) * 6, 3, { fill: C.accent, alpha: 0.5 * seg(t, 6.4, 7) * (1 - Math.abs(ph - 0.5) * 1.4) });
        }
        const checks = [['월 합계 대조 — 21개월 전 구간', C.good], ['미집행과 결측 구분 — 주력 채널이 모두 있는 날만 합계', C.good], ['엑셀 피벗 필터에서 빠진 캠페인 3건 발견', C.warn]];
        checks.forEach(([s, col], k) => {
          const p = seg(t, 6.8 + k * 0.7, 7.3 + k * 0.7); const y = 330 + k * 70;
          g.alpha(E.out(p), () => g.shift(lerp(20, 0, E.out(p)), 0, () => {
            g.box(420, y, 740, 54, { fill: C.panel, r: 10, stroke: C.line });
            g.circle(452, y + 27, 15, { fill: col === C.good ? 'rgba(70,201,124,.16)' : 'rgba(240,181,74,.16)' });
            if (col === C.good) g.check(452, y + 27, 18, col, clamp(p * 1.6)); else g.text('!', 452, y + 35, { size: 22, weight: 800, color: col, align: 'center' });
            g.text(s, 482, y + 34, { size: 19, weight: 600 });
          }));
        });
      });
      // 대시보드 조립
      const pC = seg(t, 9.6, 15.8);
      g.alpha(E.out(seg(t, 9.6, 10.3)), () => {
        g.box(64, 64, 1152, 44, { fill: C.panel2, r: 10 });
        g.text('퍼포먼스 대시보드', 86, 93, { size: 19, weight: 700 });
        ['기간 소진', '운영 구조', 'ROAS 추이', '예산 페이스', '일별 효율', '품목별'].forEach((s, k) => g.pill(s, 620 + k * 96, 74, { size: 12, padX: 9, padY: 6, fill: 'rgba(139,155,255,.12)', color: C.ink2 }));
        // KPI 5
        const kp = ['총 광고비', '전환매출', '통합 ROAS', '예산 집행률', '광고 의존도'];
        kp.forEach((s, k) => {
          const p = E.out(seg(t, 10 + k * 0.15, 10.6 + k * 0.15)); const x = 64 + k * 234, y = 122;
          g.alpha(p, () => {
            g.box(x, y, 222, 88, { fill: C.panel, r: 10, stroke: C.line });
            g.text(s, x + 16, y + 28, { size: 15, color: C.ink2, weight: 600 });
            g.text('•••,•••', x + 16, y + 68, { size: 30, weight: 600, font: 'num', color: k === 2 ? C.accent : C.ink });
          });
        });
        // ROAS 라인 패널
        const lp = seg(t, 10.8, 13.4);
        g.box(64, 224, 700, 230, { fill: C.panel, r: 10, stroke: C.line });
        g.text('채널별 ROAS 추이', 84, 252, { size: 16, weight: 700, color: C.ink2 });
        const ax = monthAxis(90, 650);
        const Y = v => 440 - (v - 300) / (2300 - 300) * 170;
        [[S.roas.cp1, C.c1p], [S.roas.naver, C.cnv], [S.roas.cp3, C.c3p], [S.roas.total, C.ink]].forEach(([arr, col], k) => {
          g.poly(arr.map((v, i) => v == null ? null : [ax.X(i), Y(v)]), { progress: E.inOut(lp), color: col, w: k === 3 ? 3 : 2, alpha: k === 3 ? 1 : .85 });
        });
        // 히트맵
        const hp = seg(t, 11.6, 14);
        g.box(778, 224, 438, 230, { fill: C.panel, r: 10, stroke: C.line });
        g.text('브랜드 키워드 의존도', 798, 252, { size: 16, weight: 700, color: C.ink2 });
        const rows = [['쿠팡 1P', S.brand.cp1], ['쿠팡 윙', S.brand.cp3], ['쇼핑검색', S.brand.nsa], ['파워링크', S.brand.npl]];
        rows.forEach(([nm, arr], r) => {
          g.text(nm, 798, 296 + r * 40, { size: 14, color: C.ink2 });
          for (let c = 0; c < 9; c++) {
            const i = N - 9 + c, v = arr[i]; const on = clamp(hp * 13 - (r * 9 + c) * 0.3);
            const a = clamp(v / 70);
            g.box(870 + c * 37, 278 + r * 40, 33, 30, { fill: `rgba(239,107,107,${0.12 + a * 0.75})`, r: 5, alpha: on });
          }
        });
        // 예산 페이스
        const bp = seg(t, 12.4, 15);
        g.box(64, 468, 1152, 132, { fill: C.panel, r: 10, stroke: C.line });
        g.text('예산 소진 페이스', 84, 496, { size: 16, weight: 700, color: C.ink2 });
        [['쿠팡', 1.04, C.c1p], ['네이버', 1.35, C.cnv], ['비마트', 1.30, C.csm], ['컬리', .78, C.c3p]].forEach(([nm, pace, col], k) => {
          const x = 84 + k * 282, y = 520;
          g.text(nm, x, y + 16, { size: 15, weight: 600 });
          g.box(x, y + 30, 250, 10, { fill: 'rgba(255,255,255,.07)', r: 5 });
          g.box(x, y + 30, 250 * Math.min(1, 0.3 * pace) * E.out(bp) / 0.45, 10, { fill: col, r: 5 });
          g.line(x + 250 * .3 / .45, y + 24, x + 250 * .3 / .45, y + 46, { color: C.ink, w: 2 });
          const st = pace > 1.1 ? ['초과', C.warn] : pace < .9 ? ['미소진', C.bad] : ['정상', C.good];
          g.alpha(seg(t, 14, 14.6), () => g.pill(st[0], x + 188, y + 52, { size: 12, padX: 8, padY: 4, fill: 'rgba(255,255,255,.06)', color: st[1] }));
        });
      });
      // 엔딩 카드
      g.alpha(E.out(seg(t, 15.8, 16.6)), () => {
        g.box(0, 0, VW, VH, { fill: 'rgba(8,13,22,.78)', r: 0 });
        g.text('엑셀 리포트 9종 → 한 화면', VW / 2, 330, { size: 56, weight: 700, align: 'center' });
        g.text('매일 아침, 원본과 대조 검증된 숫자로', VW / 2, 384, { size: 24, color: C.ink2, align: 'center' });
      });
    },
  };

  /* 2 · 광고 밖 개선 */
  SCENES.nonad = {
    duration: 15, poster: 13.5,
    chapters: [[0, '상품 페이지에서 새는 곳부터 — 광고 담당이 손대지 않던 영역'], [5.6, '광고 유입 → 장바구니 → 오가닉·마이샵 매출로 이어지는 간접 기여'], [10.4, '광고 매출 비중은 유지한 채 전체 매출 +36.6% (26년 상반기 YoY)']],
    draw(g, t) {
      const fA = 1 - seg(t, 5.2, 5.8);
      g.kicker(t < 5.6 ? 'NON-AD FIXES · 몰 MD 협업' : t < 10.4 ? 'INDIRECT CONTRIBUTION · 유입 경로' : 'GROWTH · 26년 상반기 YoY');
      // 상품 페이지 목업
      g.alpha(E.out(seg(t, 0, .6)) * (t < 10.4 ? 1 : 1 - seg(t, 10.4, 11)), () => {
        const x = 64, y = 100, w = 430, h = 470;
        g.box(x, y, w, h, { fill: C.panel, r: 14, stroke: C.line });
        g.box(x, y, w, 36, { fill: C.panel2, r: 14 });
        [0, 1, 2].forEach(k => g.circle(x + 20 + k * 16, y + 18, 5, { fill: 'rgba(255,255,255,.18)' }));
        g.box(x + 70, y + 10, 300, 16, { fill: 'rgba(255,255,255,.08)', r: 8 });
        g.box(x + 22, y + 56, 180, 180, { fill: 'rgba(255,255,255,.07)', r: 10 });
        g.text('닭가슴살', x + 112, y + 152, { size: 20, color: C.ink3, align: 'center' });
        g.box(x + 222, y + 60, 180, 18, { fill: 'rgba(255,255,255,.14)', r: 6 });
        g.box(x + 222, y + 88, 140, 14, { fill: 'rgba(255,255,255,.08)', r: 6 });
        g.text('₩ •,•••', x + 222, y + 140, { size: 26, weight: 700, font: 'num' });
        g.box(x + 222, y + 186, 180, 44, { fill: C.accentD, r: 10 });
        g.text('구매하기', x + 312, y + 214, { size: 17, weight: 700, align: 'center' });
        ['상세', '리뷰', '문의', '배송'].forEach((s, k) => g.text(s, x + 40 + k * 96, y + 280, { size: 15, color: k === 1 ? C.ink : C.ink3, weight: 600 }));
        g.line(x + 22, y + 294, x + w - 22, y + 294, { color: C.line2 });
        for (let k = 0; k < 6; k++) g.box(x + 22, y + 314 + k * 24, (w - 44) * (0.5 + 0.45 * Math.abs(Math.sin(k * 1.9))), 10, { fill: 'rgba(255,255,255,.06)', r: 4 });
        // 스캔 라인
        const sy = y + 50 + ((t * 120) % (h - 60));
        g.alpha(fA * 0.6, () => g.line(x + 10, sy, x + w - 10, sy, { color: C.accent, w: 2 }));
      });
      // 개선 체크리스트
      const fixes = [['네이버', '노출 제한 코드 10%+ 해제'], ['네이버', '대표 카테고리 · 랭킹 패널티 해소'], ['네이버', '첫구매/재구매 쿠폰 분리 → 쿠팡 PMC 최대 −95%'], ['카카오', '오늘공구 초기 제안 · 상시 톡딜'], ['카카오', '연관상품 세팅 → 옵션 추가 노출'], ['쿠팡 윙', '품목별 자동출고일 · 속성 · 필터'], ['전체 외부몰', 'SEO 최적화 (주요몰 집중) · 가격비교 노출']];
      fixes.forEach(([ch, s], k) => {
        const p = seg(t, 0.5 + k * 0.6, 1.0 + k * 0.6); const y = 104 + k * 64;
        g.alpha(E.out(p) * fA, () => g.shift(lerp(24, 0, E.out(p)), 0, () => {
          g.box(530, y, 686, 52, { fill: C.panel, r: 10, stroke: C.line });
          g.check(560, y + 26, 20, C.good, clamp(p * 1.5));
          g.pill(ch, 586, y + 12, { size: 13, padX: 9, padY: 5, fill: 'rgba(139,155,255,.14)', color: C.accent });
          g.text(s, 586 + g.measure(ch, 13, 600) + 34, y + 33, { size: 19, weight: 600 });
        }));
      });
      // 유입 경로
      const pB = seg(t, 5.6, 10.4);
      g.alpha(E.out(seg(t, 5.6, 6.2)) * (1 - seg(t, 10.2, 10.8)), () => {
        const nodes = [['광고 유입', '검색·지면 광고', 620], ['장바구니', '담기 · 조회', 860], ['오가닉 · 마이샵', '광고 밖 지면 매출', 1100]];
        nodes.forEach(([a, b, cx], k) => {
          const p = E.out(seg(t, 5.8 + k * .5, 6.4 + k * .5));
          g.pop(p, cx, 250, () => {
            g.circle(cx, 250, 66, { fill: k === 2 ? 'rgba(70,201,124,.14)' : 'rgba(139,155,255,.12)', stroke: k === 2 ? C.good : C.accent, lw: 2 });
            g.text(a, cx, 248, { size: 20, weight: 700, align: 'center' });
            g.text(b, cx, 274, { size: 14, color: C.ink2, align: 'center' });
          });
          if (k < 2) g.arrow(cx + 72, 250, cx + 168, 250, { progress: E.out(seg(t, 6.3 + k * .5, 6.8 + k * .5)), color: C.ink3 });
        });
        for (let k = 0; k < 18; k++) {
          const ph = (t * 0.35 + k / 18) % 1; const x = lerp(560, 1160, ph);
          g.circle(x, 250 + Math.sin(k * 5.3) * 30 * Math.sin(ph * Math.PI), 4, { fill: ph > 0.7 ? C.good : C.accent, alpha: 0.7 * seg(t, 7, 7.6) });
        }
        g.alpha(seg(t, 7.8, 8.4), () => {
          g.box(560, 360, 656, 150, { fill: C.panel, r: 12, stroke: C.line });
          g.text('D1 ROAS 에는 잡히지 않는 매출', 588, 400, { size: 20, weight: 700 });
          g.text('광고로 들어와 장바구니에 담긴 고객이 나중에 검색·마이샵으로 돌아와', 588, 436, { size: 17, color: C.ink2 });
          g.text('구매하는 흐름을 유입 경로 데이터로 확인해 MD 와 공유했습니다.', 588, 464, { size: 17, color: C.ink2 });
        });
      });
      // 성장 막대
      const pC = seg(t, 10.8, 13.2);
      g.alpha(E.out(seg(t, 10.6, 11.2)), () => {
        const base = 520, maxH = 330;
        [['25년 상반기', 100, C.before], ['26년 상반기', lerp(100, 136.6, E.inOut(pC)), C.accent]].forEach(([lb, v, col], k) => {
          const x = 250 + k * 280, h = maxH * v / 140;
          g.box(x, base - h, 170, h, { fill: col, r: 8, alpha: k ? 1 : .6 });
          g.box(x, base - h * 0.34, 170, h * 0.34, { fill: 'rgba(255,255,255,.16)', r: 0 });
          g.text(lb, x + 85, base + 34, { size: 18, color: C.ink2, align: 'center', weight: 600 });
          g.text(k ? `+${fmt(v - 100, 1)}%` : '100', x + 85, base - h - 16, { size: k ? 40 : 26, weight: 600, font: 'num', align: 'center', color: k ? C.ink : C.ink2 });
        });
        g.line(220, base, 750, base, { color: C.line2 });
        g.alpha(seg(t, 12, 12.6), () => {
          g.text('전체 매출', 820, 250, { size: 20, color: C.ink2 });
          g.text('+36.6%', 820, 318, { size: 72, weight: 600, font: 'num' });
          g.box(820, 350, 360, 1, { fill: C.line2 });
          g.text('밝은 띠 = 광고 매출 비중', 820, 392, { size: 18, color: C.ink2 });
          g.text('두 해 모두 같은 비중 — 광고에 기대지 않은 성장', 820, 424, { size: 18, color: C.ink3 });
        });
      });
    },
  };

  /* 3 · 브랜드 키워드 다이어트 */
  SCENES.brand = {
    duration: 14, poster: 12.8,
    chapters: [[0, '검색 광고비 중 브랜드 키워드 비중 — 월별'], [6, '개별 채널 개선 — 개선 전 6개월 평균(%) → 26년 9월(%)'], [11, '그 사이 통합 ROAS 는 964% → 1,166% (+202%p)']],
    draw(g, t) {
      const A = 1 - seg(t, 5.6, 6.2);
      g.kicker(t < 6 ? 'BRAND KEYWORD SHARE · 4개 검색 채널' : t < 11 ? 'BY CHANNEL' : 'EFFICIENCY');
      g.alpha(A, () => {
        const ax = monthAxis(90, 1100), base = 540, top = 160, Y = v => base - v / 50 * (base - top);
        [10, 20, 30, 40, 50].forEach(v => { g.line(90, Y(v), 1190, Y(v), { color: C.line }); g.text(v + '%', 80, Y(v) + 5, { size: 13, color: C.ink3, align: 'right', font: 'num' }); });
        let cur = null;
        S.brand.total.forEach((v, i) => {
          const p = E.out(seg(t, 0.4 + i * 0.2, 0.9 + i * 0.2)); if (p <= 0) return; cur = i;
          const h = (base - Y(v)) * p, bw = ax.step - 12;
          g.box(ax.X(i) - bw / 2, base - h, bw, h, { fill: i < TEN ? C.before : i === N - 1 ? C.accent : C.ink, r: 5, alpha: i < TEN ? .8 : .92 });
        });
        tenureLine(g, ax, top - 30, base);
        drawMonthTicks(g, ax, base + 28);
        if (cur != null) {
          g.text(ml(S.months[cur]) + (cur === N - 1 ? ' (1~9일)' : ''), 1190, 110, { size: 18, color: C.ink2, align: 'right' });
          g.text(fmt(S.brand.total[cur], 1) + '%', 1190, 170, { size: 60, weight: 600, font: 'num', align: 'right', color: cur >= TEN ? C.ink : C.ink2 });
        }
      });
      const B = seg(t, 6, 11), aB = E.out(seg(t, 6, 6.5)) * (1 - seg(t, 13.6, 14));
      g.alpha(aB, () => {
        const rows = [['4개 채널 합계', 37.9, 15.1, C.ink], ['쿠팡 1P 로켓', 19.5, 6.5, C.c1p], ['쿠팡 윙', 44.6, 19.3, C.c3p], ['네이버 쇼핑검색', 53.8, 20.4, C.cnv], ['네이버 파워링크', 67.2, 16.5, C.csm]];
        rows.forEach(([lb, a, b, col], k) => g.beforeAfter(120, 140 + k * 76, 700, lb, a, b, 70, { progress: seg(t, 6.4 + k * 0.4, 8.4 + k * 0.4), color: col, unit: '%', dec: 1, h: 24 }));
        g.text('개선 전 6개월 평균  →  26년 9월', 1180, 112, { size: 16, color: C.ink2, align: 'right', alpha: seg(t, 6.2, 6.8) });
        g.alpha(seg(t, 8.8, 9.4) * (1 - seg(t, 10.8, 11.2)), () => g.text('점선 = 개선 전 6개월 평균', 120, 548, { size: 16, color: C.ink3 }));
      });
      g.alpha(E.out(seg(t, 11, 11.6)), () => {
        g.box(120, 520, 1040, 76, { fill: C.panel, r: 12, stroke: C.line });
        g.text('같은 기간 통합 ROAS', 150, 566, { size: 20, color: C.ink2, weight: 600 });
        const v = lerp(964, 1166, E.inOut(seg(t, 11.3, 12.6)));
        g.text('964%', 520, 570, { size: 30, color: C.ink3, font: 'num', weight: 600 });
        g.arrow(610, 560, 668, 560, { color: C.ink3 });
        g.text(fmt(v) + '%', 690, 572, { size: 38, weight: 600, font: 'num', color: C.good });
        g.text('+202%p · 의존도를 낮추고도 효율 상승', 880, 566, { size: 18, color: C.ink2 });
      });
    },
  };

  /* 4 · 쿠팡 1P */
  SCENES.cp1 = {
    duration: 13, poster: 11.6,
    chapters: [[0, '쿠팡 1P 로켓 월별 ROAS — 25년 12월부터 10개월 연속 입사 전 최고치(1,635%) 상회'], [7, '26년 7–8월, 전년 같은 달보다 광고비는 줄이고 매출은 늘림'], [10, '브랜드 키워드 비중은 낮추고, 전환율은 두 배로']],
    draw(g, t) {
      const A = 1 - seg(t, 6.6, 7.2);
      g.kicker(t < 7 ? 'COUPANG 1P · ROAS 월별 (순수 ROAS)' : t < 10 ? 'YoY · 26.7–8 vs 25.7–8' : 'QUALITY');
      g.alpha(A, () => {
        const ax = monthAxis(110, 1060), base = 540, top = 130, Y = v => base - (v - 1000) / (2300 - 1000) * (base - top);
        [1200, 1635, 2000].forEach(v => { const hi = v === 1635; g.line(110, Y(v), 1170, Y(v), { color: hi ? 'rgba(70,201,124,.5)' : C.line, w: hi ? 2 : 1, dash: hi ? [8, 6] : null }); g.text(fmt(v) + '%', 98, Y(v) + 5, { size: 13, color: hi ? C.good : C.ink3, align: 'right', font: 'num' }); });
        g.text('입사 전 최고 1,635%', 1170, Y(1635) - 8, { size: 13, color: C.good, align: 'right' });
        tenureLine(g, ax, top - 20, base);
        drawMonthTicks(g, ax, base + 28);
        const pts = S.roas.cp1.map((v, i) => [ax.X(i), Y(v)]);
        const pr = E.inOut(seg(t, 0.3, 5.6));
        g.area(pts.slice(0, Math.max(2, Math.ceil(pr * (N - 1)) + 1)), base, { color: 'rgba(74,147,234,.25)' });
        const head = g.polyGlow(pts, { progress: pr, from: TEN, c0: C.c1p, c1: '#ffffff', w0: 3, w1: 7.5 });
        const upto = pr * (N - 1);
        let streak = 0;
        S.roas.cp1.forEach((v, i) => { if (i > upto) return; const on = i >= 11 && v >= 1635; if (on) streak++; g.circle(pts[i][0], pts[i][1], on ? 6 : 4, { fill: on ? C.good : C.c1p, stroke: C.bg, lw: 2 }); });
        if (head) g.circle(head[0], head[1], 8, { fill: C.ink });
        if (upto >= 11) g.alpha(seg(t, 2.8, 3.3), () => {
          const x = pts[11][0], y = pts[11][1];
          g.pill('25.12 · 입사 전 최고치 돌파', x, y - 58, { size: 15, fill: 'rgba(70,201,124,.18)', color: C.good, align: 'center' });
        });
        g.text('연속', 1170, 104, { size: 18, color: C.ink2, align: 'right' });
        g.text(`${streak}개월`, 1170, 70, { size: 34, weight: 600, font: 'num', align: 'right', color: streak ? C.good : C.ink3 });
      });
      const B = seg(t, 7, 10), aB = E.out(seg(t, 7, 7.5)) * (1 - seg(t, 9.6, 10.1));
      g.alpha(aB, () => {
        [['광고비', 100, 84.1, C.ink3, '−15.9%'], ['매출', 100, 120.0, C.c1p, '+20.0%']].forEach(([lb, a, b, col, d], k) => {
          const y = 210 + k * 150, cur = lerp(a, b, E.inOut(seg(t, 7.4 + k * .3, 9 + k * .3)));
          g.text(lb, 140, y - 18, { size: 22, weight: 700 });
          g.box(140, y, 820 * a / 130, 56, { stroke: C.before, dash: [6, 5], lw: 1.5, r: 8 });
          g.box(140, y, 820 * cur / 130, 56, { fill: col, r: 8 });
          g.text(d, 1000, y + 44, { size: 46, weight: 600, font: 'num', color: k ? C.good : C.ink2 });
        });
        g.text('점선 = 25년 7–8월 (100)', 140, 540, { size: 16, color: C.ink3 });
      });
      g.alpha(E.out(seg(t, 10, 10.5)), () => {
        const p = E.inOut(seg(t, 10.3, 12));
        [['브랜드 키워드 비중', 19.5, 6.5, '%', 1, C.c1p, '입사 전 6개월 → 26.9'], ['전환율 CVR', 9.0, 17.7, '%', 1, C.good, '25.7 → 26.7 · 운영 보고서']].forEach(([lb, a, b, u, d, col, s], k) => {
          const cx = 380 + k * 520, cy = 330, r = 130;
          const cur = lerp(a, b, p);
          g.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5, { color: 'rgba(255,255,255,.07)', w: 22 });
          g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cur / (k ? 25 : 25), { color: col, w: 22, cap: 'round' });
          g.text(fmt(cur, d) + u, cx, cy + 18, { size: 56, weight: 600, font: 'num', align: 'center' });
          g.text(lb, cx, cy + r + 58, { size: 22, weight: 700, align: 'center' });
          g.text(`${fmt(a, d)}${u} → ${fmt(b, d)}${u}  ·  ${s}`, cx, cy + r + 88, { size: 16, color: C.ink2, align: 'center' });
        });
      });
    },
  };

  /* 5 · 쿠팡 윙 */
  SCENES.cp3 = {
    duration: 13, poster: 11.8,
    chapters: [[0, '쿠팡 윙 광고비 — 25년 12월 최저로 줄였다가 다시 키움 (입사 전 평균 = 100)'], [6.2, '1P 가 못 잡는 구성으로 재편 + 신규 고객 확보 광고'], [9.6, '26년 7–8월, 전년 같은 달 대비 광고비 +32.8% → 매출 +100.2%']],
    draw(g, t) {
      const A = 1 - seg(t, 5.8, 6.3);
      g.kicker(t < 6.2 ? 'COUPANG WING · 광고비 규모 (입사 전 평균 = 100)' : t < 9.6 ? 'REBUILD' : 'YoY · 26.7–8 vs 25.7–8');
      g.alpha(A, () => {
        const ax = monthAxis(110, 1060), base = 360, top = 120, Y = v => base - v / 200 * (base - top);
        g.line(110, Y(100), 1170, Y(100), { color: C.line2, dash: [6, 5] }); g.text('100', 98, Y(100) + 5, { size: 13, color: C.ink3, align: 'right', font: 'num' });
        S.index.cp3Spend.forEach((v, i) => {
          const p = E.out(seg(t, 0.3 + i * 0.16, 0.8 + i * 0.16)); if (p <= 0) return;
          const h = (base - Y(v)) * p, bw = ax.step - 12;
          const col = i < TEN ? C.before : i >= 11 ? C.c3p : 'rgba(238,122,69,.45)';
          g.box(ax.X(i) - bw / 2, base - h, bw, h, { fill: col, r: 5 });
        });
        tenureLine(g, ax, top - 20, base);
        g.alpha(seg(t, 2.4, 2.9), () => g.pill('25.12 최저 · 30', ax.X(11), Y(30) - 50, { size: 14, align: 'center', fill: 'rgba(255,255,255,.08)', color: C.ink2 }));
        g.alpha(seg(t, 3.8, 4.3), () => g.pill('26.9 · 185', ax.X(N - 1), Y(184.5) - 50, { size: 14, align: 'right', fill: 'rgba(238,122,69,.2)', color: C.c3p }));
        // ROAS 라인 (아래 패널)
        const b2 = 560, t2 = 420, Y2 = v => b2 - (v - 350) / (1000 - 350) * (b2 - t2);
        g.line(110, Y2(473.6), 1170, Y2(473.6), { color: 'rgba(239,107,107,.55)', dash: [6, 5], w: 1.5 });
        g.text('입사 전 저점 474%', 1170, Y2(473.6) + 20, { size: 13, color: C.bad, align: 'right' });
        g.text('ROAS', 98, t2 + 4, { size: 13, color: C.ink3, align: 'right' });
        g.polyGlow(S.roas.cp3.map((v, i) => [ax.X(i), Y2(v)]), { progress: E.inOut(seg(t, 0.6, 5.2)), from: TEN, c0: C.c3p, c1: '#ffffff', w0: 2.5, w1: 6 });
        drawMonthTicks(g, ax, b2 + 26);
      });
      g.alpha(E.out(seg(t, 6.2, 6.7)) * (1 - seg(t, 9.3, 9.8)), () => {
        const p = seg(t, 6.4, 8.4);
        for (let k = 0; k < 24; k++) {
          const c = k % 6, r = Math.floor(k / 6);
          const sx = 150 + (k % 8) * 70, sy = 160 + Math.floor(k / 8) * 80;
          const tx = 420 + c * 44, ty = 260 + r * 44;
          const q = E.inOut(clamp(p * 1.4 - k * 0.015));
          g.box(lerp(sx, tx, q), lerp(sy, ty, q), 38, 38, { fill: k % 3 ? 'rgba(238,122,69,.75)' : 'rgba(238,122,69,.45)', r: 6 });
        }
        g.alpha(seg(t, 8, 8.5), () => {
          g.box(404, 244, 296, 206, { stroke: C.c3p, lw: 2.5, r: 14 });
          g.text('20~30개입 업번들', 552, 490, { size: 22, weight: 700, align: 'center' });
          g.text('1P 객단가가 낮던 품목을 윙 전용 구성으로', 552, 520, { size: 16, color: C.ink2, align: 'center' });
        });
        g.alpha(seg(t, 8.2, 8.8), () => {
          g.box(780, 250, 400, 190, { fill: C.panel, r: 14, stroke: C.line });
          g.pill('NCA', 808, 276, { size: 14, fill: 'rgba(139,155,255,.16)', color: C.accent });
          g.text('신규 구매 고객 확보 광고', 808, 346, { size: 22, weight: 700 });
          g.text('CAC 기준으로 입찰 · 세그먼트 조정', 808, 380, { size: 17, color: C.ink2 });
          g.text('26.7 윙 광고비의 24%', 808, 414, { size: 17, color: C.ink2 });
        });
      });
      g.alpha(E.out(seg(t, 9.6, 10.1)), () => {
        [['광고비', 100, 132.8, C.ink3, '+32.8%'], ['매출', 100, 200.2, C.c3p, '+100.2%']].forEach(([lb, a, b, col, d], k) => {
          const y = 200 + k * 150, cur = lerp(a, b, E.inOut(seg(t, 9.9 + k * .3, 11.4 + k * .3)));
          g.text(lb, 140, y - 18, { size: 22, weight: 700 });
          g.box(140, y, 760 * a / 210, 56, { stroke: C.before, dash: [6, 5], lw: 1.5, r: 8 });
          g.box(140, y, 760 * cur / 210, 56, { fill: col, r: 8 });
          g.text(d, 940, y + 44, { size: 46, weight: 600, font: 'num', color: k ? C.good : C.ink2 });
        });
        g.text('점선 = 25년 7–8월 (100) · ROAS 437% → 659% (+222%p)', 140, 530, { size: 16, color: C.ink3 });
      });
    },
  };

  /* 6 · 네이버 */
  SCENES.naver = {
    duration: 13, poster: 11.8,
    chapters: [[0, '파워링크·쇼핑검색에 몰려 있던 브랜드 키워드를 걷어냄'], [4.8, '지면별 효율을 평탄화한 뒤 쇼핑검색 예산 비중 40% → 70%'], [8.8, 'GFA ROAS 304% → 586% (+282%p) · 상반기 광고비 +59.5%에 매출 +66.2%']],
    draw(g, t) {
      g.kicker(t < 4.8 ? 'NAVER · 브랜드 키워드 비중' : t < 8.8 ? 'BUDGET MIX · 운영 보고서' : 'RESULT');
      g.alpha(1 - seg(t, 4.4, 4.9), () => {
        [['쇼핑검색', 53.8, 20.4], ['파워링크', 67.2, 16.5]].forEach(([lb, a, b], k) => {
          const y = 190 + k * 170, p = E.inOut(seg(t, 0.6 + k * .4, 3.2 + k * .4)), cur = lerp(a, b, p);
          g.text(lb, 140, y - 20, { size: 24, weight: 700 });
          g.box(140, y, 800, 70, { fill: 'rgba(255,255,255,.05)', r: 10 });
          g.box(140, y, 800 * cur / 100, 70, { fill: 'rgba(239,107,107,.75)', r: 10 });
          g.box(140 + 800 * cur / 100 + 4, y, 800 - 800 * cur / 100 - 4, 70, { fill: 'rgba(34,185,133,.35)', r: 10 });
          g.text(`브랜드 ${fmt(cur, 1)}%`, 160, y + 45, { size: 22, weight: 700 });
          g.text('일반·경쟁 키워드', 925, y + 45, { size: 18, color: C.ink, align: 'right', weight: 600 });
          g.text(`${fmt(a, 1)}% → ${fmt(b, 1)}%`, 1180, y + 46, { size: 26, weight: 600, font: 'num', align: 'right', alpha: seg(t, 2.6 + k * .4, 3.2 + k * .4) });
        });
        g.text('입사 전 6개월 평균 → 26년 9월 · 광고비 기준', 140, 540, { size: 16, color: C.ink3 });
      });
      g.alpha(E.out(seg(t, 4.8, 5.3)) * (1 - seg(t, 8.4, 8.9)), () => {
        const p = E.inOut(seg(t, 5.4, 7.4)); const share = lerp(0.4, 0.7, p);
        const cx = 400, cy = 330, r = 150;
        g.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * share, { color: C.cnv, w: 54 });
        g.arc(cx, cy, r, -Math.PI / 2 + Math.PI * 2 * share + 0.03, Math.PI * 1.5 - 0.03, { color: 'rgba(255,255,255,.14)', w: 54 });
        g.text(fmt(share * 100) + '%', cx, cy + 18, { size: 58, weight: 600, font: 'num', align: 'center' });
        g.text('쇼핑검색 예산 비중', cx, cy + 52, { size: 17, color: C.ink2, align: 'center' });
        g.text('지면별 ROAS 를 먼저 평탄화', 700, 270, { size: 26, weight: 700 });
        g.text('효율이 비슷해진 뒤에야 규모가 큰 지면으로', 700, 310, { size: 18, color: C.ink2 });
        g.text('예산을 옮겨도 전체 효율이 떨어지지 않습니다.', 700, 338, { size: 18, color: C.ink2 });
        g.text('성별 · 연령 · 지면 · 시간 · 지역 가중치 반영', 700, 392, { size: 18, color: C.ink3 });
      });
      g.alpha(E.out(seg(t, 8.8, 9.3)), () => {
        const p = E.inOut(seg(t, 9.1, 10.8));
        const base = 520, maxH = 320;
        [['입사 전 6개월', 304, C.before], ['최근 3개월', lerp(304, 586, p), C.cnv]].forEach(([lb, v, col], k) => {
          const x = 170 + k * 220, h = maxH * v / 650;
          g.box(x, base - h, 150, h, { fill: col, r: 8 });
          g.text(fmt(v) + '%', x + 75, base - h - 16, { size: 34, weight: 600, font: 'num', align: 'center' });
          g.text(lb, x + 75, base + 32, { size: 17, color: C.ink2, align: 'center' });
        });
        g.text('GFA ROAS', 170, 150, { size: 20, weight: 700, color: C.ink2 });
        g.alpha(seg(t, 10.4, 11), () => {
          g.box(700, 200, 480, 250, { fill: C.panel, r: 14, stroke: C.line });
          g.text('26년 상반기 · 전년 동기 대비', 730, 244, { size: 17, color: C.ink2 });
          g.text('광고비', 730, 306, { size: 20, color: C.ink2 }); g.text('+59.5%', 1150, 310, { size: 38, weight: 600, font: 'num', align: 'right', color: C.ink2 });
          g.text('매출', 730, 380, { size: 20, color: C.ink2 }); g.text('+66.2%', 1150, 386, { size: 46, weight: 600, font: 'num', align: 'right', color: C.good });
          g.text('늘린 만큼 더 빠르게 따라온 매출', 730, 428, { size: 16, color: C.ink3 });
        });
      });
    },
  };

  /* 7 · 키워드 바운더리 */
  const KW = ['닭가슴살', '소스통살', '그릴드 닭가슴살', '닭다리살', '볶음밥', '주먹밥', '곤약밥', '샌드위치', '닭가슴살 볼', '저염 닭가슴살', '단백질 간식', '다이어트 도시락', '마녀스프', '소시지', '치킨까스', '너겟', '텐더', '즉석밥', '쫀드기', '사워도우', '베이글', '김부각', '훈제 닭가슴살', '냉동 도시락', '닭가슴살 큐브', '슬라이스', '스팀 닭가슴살', '헬스 식단', '간편식', '소품란', '닭가슴살 스테이크', '양배추롤', '치아바타칩', '오트밀', '프로틴', '저당 간식'];
  SCENES.keywords = {
    duration: 12, poster: 10.8,
    chapters: [[0, '광고로 잡는 월 클릭 키워드 10,170 → 20,903 (운영 보고서, 25.7 → 26.7)'], [6.4, '광고를 태우는 품목 카테고리 21 → 33 — 닭가슴살 회사에서 간편식 회사로']],
    draw(g, t) {
      g.kicker(t < 6.4 ? 'KEYWORD BOUNDARY · 쿠팡' : 'CATEGORY BOUNDARY');
      g.alpha(1 - seg(t, 6, 6.5), () => {
        const p = seg(t, 0.3, 5.4);
        const v = Math.round(lerp(10170, 20903, E.inOut(p)));
        g.text('월 클릭 키워드', 1180, 120, { size: 20, color: C.ink2, align: 'right' });
        g.text(fmt(v), 1180, 196, { size: 78, weight: 600, font: 'num', align: 'right' });
        g.text('2.06배', 1180, 240, { size: 26, weight: 600, font: 'num', align: 'right', color: C.good, alpha: seg(t, 5, 5.5) });
        const cx = 470, cy = 330;
        KW.forEach((k, i) => {
          const ang = i * 2.399, rad = 40 + Math.sqrt(i) * 52;
          const q = E.back(clamp((p * 1.15 - i / KW.length * 0.95) * 4));
          if (q <= 0) return;
          const x = cx + Math.cos(ang) * rad * 1.1, y = cy + Math.sin(ang) * rad * 0.78;
          const first = i < 8;
          g.pop(q, x, y, () => g.pill(k, x, y - 16, { size: first ? 17 : 15, align: 'center', fill: first ? 'rgba(74,147,234,.28)' : 'rgba(139,155,255,.14)', color: first ? C.ink : C.ink2 }));
        });
      });
      g.alpha(E.out(seg(t, 6.4, 6.9)), () => {
        const p = seg(t, 6.8, 10);
        const cols = 11;
        for (let k = 0; k < 33; k++) {
          const c = k % cols, r = Math.floor(k / cols); const x = 110 + c * 96, y = 170 + r * 100;
          const on = k < 21 ? 1 : clamp((p * 12) - (k - 21));
          g.box(x, y, 84, 84, { fill: k < 21 ? 'rgba(255,255,255,.1)' : `rgba(139,155,255,${0.15 + 0.45 * on})`, r: 10, stroke: k >= 21 && on > 0.9 ? C.accent : null, lw: 1.5 });
          if (k >= 21 && on > 0) g.check(x + 42, y + 42, 26, C.ink, on);
        }
        const n = 21 + Math.round(clamp(p) * 12);
        g.text('광고 집행 품목 카테고리', 110, 520, { size: 20, color: C.ink2 });
        g.text(`21 → ${n}`, 110, 576, { size: 48, weight: 600, font: 'num' });
        g.text('입사 전 6개월 → 26년 상반기 · 그로서리서울 쿠팡 광고 신규', 400, 568, { size: 17, color: C.ink3 });
      });
    },
  };

  /* 8 · 버티컬몰 */
  SCENES.vertical = {
    duration: 12, poster: 10.8,
    chapters: [[0, '자동 캠페인이 브랜드 검색에 예산을 쓰지 않도록 제외 키워드로 차단'], [5.6, '컬리는 카테고리 10위권 타사 평균의 2.9배, 비마트 ROAS 3.1배']],
    draw(g, t) {
      g.kicker(t < 5.6 ? 'AUTO CAMPAIGN · 제외 키워드' : 'RESULT · ROAS');
      g.alpha(1 - seg(t, 5.2, 5.7), () => {
        g.box(64, 110, 440, 440, { fill: C.panel, r: 14, stroke: C.line });
        g.text('제외 키워드', 92, 150, { size: 20, weight: 700 });
        const kws = ['한끼통살', '소스통살', '그릴드 닭가슴살', '한끼 통살', '한끼닭가슴살', '통살 닭가슴살'];
        const filled = Math.floor(seg(t, 0.6, 3.6) * kws.length + 0.001);
        g.text(`${Math.min(20, 14 + filled)}/20`, 476, 150, { size: 18, color: C.ink2, align: 'right', font: 'num' });
        kws.forEach((k, i) => {
          const p = seg(t, 0.6 + i * 0.5, 1.0 + i * 0.5); const y = 180 + i * 58;
          g.box(92, y, 384, 44, { fill: 'rgba(255,255,255,.04)', r: 8, stroke: C.line });
          g.alpha(E.out(p), () => { g.text(k, 112, y + 29, { size: 18, weight: 600 }); g.pill('브랜드', 456, y + 9, { size: 12, align: 'right', padY: 4, padX: 8, fill: 'rgba(239,107,107,.18)', color: C.bad }); });
        });
        // 흐름
        const cx = 820;
        g.box(cx - 110, 150, 220, 64, { fill: C.panel2, r: 12 }); g.text('자동 키워드 캠페인', cx, 190, { size: 18, weight: 700, align: 'center' });
        const block = seg(t, 2.2, 2.8);
        g.arrow(cx - 40, 220, cx - 190, 380, { color: C.bad, progress: 1, alpha: 1 - block * 0.6 });
        g.box(cx - 290, 390, 200, 60, { fill: 'rgba(239,107,107,.12)', r: 12, stroke: 'rgba(239,107,107,.5)' });
        g.text('브랜드 검색', cx - 190, 427, { size: 18, weight: 600, align: 'center' });
        g.alpha(block, () => { g.line(cx - 150, 280, cx - 90, 330, { color: C.bad, w: 6 }); g.line(cx - 90, 280, cx - 150, 330, { color: C.bad, w: 6 }); });
        g.arrow(cx + 40, 220, cx + 190, 380, { color: C.good, progress: E.out(seg(t, 2.8, 3.6)), w: 3 });
        g.alpha(seg(t, 3.2, 3.8), () => { g.box(cx + 90, 390, 220, 60, { fill: 'rgba(70,201,124,.14)', r: 12, stroke: 'rgba(70,201,124,.6)' }); g.text('신규 수요 · 일반 키워드', cx + 200, 427, { size: 18, weight: 600, align: 'center' }); });
        g.alpha(seg(t, 4, 4.5), () => g.text('기획팩 · 4개입 등 객단가 높은 구성으로 푸시', cx, 510, { size: 18, color: C.ink2, align: 'center' }));
      });
      g.alpha(E.out(seg(t, 5.6, 6.1)), () => {
        const p = E.inOut(seg(t, 5.9, 8.4));
        const groups = [['컬리 · 카테고리 10위권 비교', [['타사 평균', 834, C.before], ['자사', lerp(834, 2429, p), C.accent]], '매체 기준 · 26.1–6.21 · 성과 리뷰', '2.9배'],
                        ['비마트 ROAS', [['입사 전 6개월', 1787, C.before], ['26년 상반기', lerp(1787, 5584, p), C.csm]], '순수 ROAS · 대시보드', '3.1배']];
        groups.forEach(([ttl, bars, src, mult], k) => {
          const x0 = 110 + k * 560, base = 500, maxH = 300;
          g.text(ttl, x0, 140, { size: 20, weight: 700, color: C.ink2 });
          bars.forEach(([lb, v, col], j) => {
            const x = x0 + j * 190, h = maxH * v / (k ? 6000 : 2700);
            g.box(x, base - h, 140, h, { fill: col, r: 8 });
            g.text(fmt(v) + '%', x + 70, base - h - 14, { size: 30, weight: 600, font: 'num', align: 'center' });
            g.text(lb, x + 70, base + 30, { size: 16, color: C.ink2, align: 'center' });
          });
          g.text(mult, x0 + 420, 250, { size: 50, weight: 600, font: 'num', color: C.good, alpha: seg(t, 8.2, 8.8) });
          g.text(src, x0, 568, { size: 14, color: C.ink3 });
        });
      });
    },
  };

  /* 9 · 자동화 */
  SCENES.automation = {
    duration: 14, poster: 12.6,
    chapters: [[0, '몰·키워드별 노출 순위를 봇이 수집 — 하락하면 알림'], [5, '긍정·중립 후기는 자동 답변, 부정 후기만 사람에게'], [9.6, '경쟁사 판매가 변경을 5개 몰에서 자동 감지 — 모니터링 시간 30%+ 단축']],
    draw(g, t) {
      g.kicker(t < 5 ? 'RANK MONITOR · RPA / 스크래핑' : t < 9.6 ? 'REVIEW AUTO-REPLY' : 'PRICE WATCH');
      g.alpha(1 - seg(t, 4.6, 5.1), () => {
        g.box(64, 110, 520, 450, { fill: C.panel, r: 14, stroke: C.line });
        g.box(88, 130, 472, 40, { fill: 'rgba(255,255,255,.06)', r: 20 }); g.text('🔍  닭가슴살', 108, 157, { size: 17, color: C.ink2 });
        const items = ['A사 닭가슴살 30팩', '우리 상품 · 소스통살', 'B사 스테이크', '우리 상품 · 그릴드', 'C사 닭가슴살', 'D사 도시락', '우리 상품 · 볼'];
        const scan = seg(t, 0.6, 3.6) * items.length;
        items.forEach((s, i) => {
          const y = 190 + i * 50, mine = s.startsWith('우리');
          g.box(88, y, 472, 42, { fill: mine ? 'rgba(139,155,255,.12)' : 'rgba(255,255,255,.03)', r: 8 });
          g.text(String(i + 1), 108, y + 28, { size: 16, font: 'num', color: C.ink3 });
          g.text(s, 140, y + 28, { size: 16, weight: mine ? 700 : 500, color: mine ? C.ink : C.ink2 });
          if (i < scan) g.check(536, y + 21, 16, C.good, clamp(scan - i));
        });
        const sy = 190 + Math.min(scan, items.length - 0.2) * 50;
        g.alpha(scan < items.length ? 1 : 0, () => g.box(80, sy - 4, 488, 50, { stroke: C.accent, lw: 2, r: 10 }));
        // 표
        g.box(620, 110, 596, 450, { fill: C.panel, r: 14, stroke: C.line });
        ['키워드', '상품', '순위', '전일'].forEach((h, k) => g.text(h, [648, 790, 1020, 1110][k], 150, { size: 15, color: C.ink3, weight: 600 }));
        const rows = [['닭가슴살', '소스통살', 2, '▲1', C.good], ['닭가슴살', '그릴드', 4, '—', C.ink3], ['닭가슴살', '볼', 7, '▼3', C.bad], ['닭가슴살 스테이크', '스테이크', 3, '▲2', C.good], ['단백질 간식', '큐브', 11, '▼1', C.bad]];
        rows.forEach(([a, b, r, d, col], i) => {
          const p = seg(t, 1.2 + i * 0.5, 1.6 + i * 0.5); const y = 176 + i * 58;
          g.alpha(E.out(p), () => {
            g.line(640, y, 1196, y, { color: C.line });
            g.text(a, 648, y + 36, { size: 16 }); g.text(b, 790, y + 36, { size: 16, color: C.ink2 });
            g.text(r + '위', 1020, y + 36, { size: 18, weight: 700, font: 'num' }); g.text(d, 1110, y + 36, { size: 16, weight: 700, color: col });
          });
        });
        g.alpha(seg(t, 3.4, 3.9) * (0.6 + 0.4 * Math.sin(t * 8)), () => { g.box(640, 176 + 2 * 58 + 4, 556, 50, { stroke: C.bad, lw: 2, r: 8 }); });
        g.alpha(seg(t, 3.6, 4.1), () => g.pill('알림 · 볼 순위 하락 7위 (▼3)', 918, 478, { size: 16, align: 'center', fill: 'rgba(239,107,107,.18)', color: C.bad }));
        g.text('120위까지 오가닉/광고 순위 분리 · 전일·주·월 대비', 648, 540, { size: 15, color: C.ink3, alpha: seg(t, 2, 2.5) });
      });
      g.alpha(E.out(seg(t, 5, 5.5)) * (1 - seg(t, 9.2, 9.7)), () => {
        const lanes = [['자동 답변', C.good, 660], ['담당자 확인', C.warn, 1000]];
        lanes.forEach(([lb, col, x]) => { g.box(x - 150, 120, 300, 440, { fill: 'rgba(255,255,255,.03)', r: 14, stroke: C.line }); g.text(lb, x, 156, { size: 19, weight: 700, align: 'center', color: col }); });
        const reviews = [['★★★★★', '맛있어요 재구매해요', 0], ['★★★★☆', '양이 넉넉해요', 0], ['★★☆☆☆', '배송이 늦었어요', 1], ['★★★★★', '식단용으로 최고', 0], ['★☆☆☆☆', '포장이 터졌어요', 1]];
        reviews.forEach(([st, s, neg], i) => {
          const p = E.inOut(seg(t, 5.3 + i * 0.7, 6.3 + i * 0.7));
          const tx = neg ? 1000 : 660, ty = 190 + (neg ? (i === 2 ? 0 : 1) : (i === 0 ? 0 : i === 1 ? 1 : 2)) * 110;
          const x = lerp(220, tx, p), y = lerp(330, ty, p);
          g.alpha(clamp(p * 4), () => {
            g.box(x - 130, y, 260, 88, { fill: C.panel2, r: 12 });
            g.text(st, x - 112, y + 30, { size: 15, color: C.csm });
            g.text(s, x - 112, y + 58, { size: 16, weight: 600 });
            if (p >= 1 && !neg) g.pill('자동 답변 완료', x + 118, y + 12, { size: 12, align: 'right', padY: 4, padX: 8, fill: 'rgba(70,201,124,.18)', color: C.good });
          });
        });
        g.box(80, 230, 250, 200, { fill: C.panel, r: 14, stroke: C.line });
        g.text('신규 후기', 205, 270, { size: 18, color: C.ink2, align: 'center' });
        g.text('답변율 95%', 205, 330, { size: 30, weight: 600, font: 'num', align: 'center', alpha: seg(t, 8, 8.5) });
        g.text('오답률 0.7%', 205, 372, { size: 22, weight: 600, font: 'num', align: 'center', color: C.ink2, alpha: seg(t, 8.2, 8.7) });
        g.text('이전 직장 사례', 205, 410, { size: 14, color: C.ink3, align: 'center' });
      });
      g.alpha(E.out(seg(t, 9.6, 10.1)), () => {
        const malls = [['네이버', 'N'], ['쿠팡', 'C'], ['컬리', 'K'], ['카카오', 'T'], ['자사몰', 'O']];
        malls.forEach(([m], k) => {
          const x = 110 + k * 212, y = 170, blink = (Math.floor((t - 10) * 2.2) % 5 + 5) % 5 === k && t > 10.3;
          g.box(x, y, 190, 150, { fill: C.panel, r: 14, stroke: blink ? C.warn : C.line, lw: blink ? 2.5 : 1 });
          g.text(m, x + 20, y + 38, { size: 19, weight: 700 });
          g.text('경쟁사 판매가', x + 20, y + 76, { size: 14, color: C.ink3 });
          g.text(blink ? '₩ •,••• ▼' : '₩ •,•••', x + 20, y + 118, { size: 24, weight: 600, font: 'num', color: blink ? C.warn : C.ink2 });
        });
        g.alpha(seg(t, 11.2, 11.8), () => {
          [['30%+', '모니터링 시간 단축 (백데이터 취합)', C.good], ['8건', '업무 자동화 (26년 상반기)', C.ink], ['2,860시간', '연간 절감 · 이전 직장', C.ink2]].forEach(([v, lb, col], k) => {
            const x = 110 + k * 370;
            g.text(v, x, 440, { size: 54, weight: 600, font: 'num', color: col });
            g.text(lb, x, 478, { size: 17, color: C.ink2 });
          });
        });
      });
    },
  };

  /* 10 · GEO */
  SCENES.geo = {
    duration: 12, poster: 10.4,
    chapters: [[0, '검색창이 대화창으로 — 네이버 AI 탭 · AI 브리핑 · 쇼핑 어시스턴트'], [5.4, 'AI 답변 첫 추천에 한끼통살 — 인용되기 쉬운 상품 정보 구조로 재점검']],
    draw(g, t) {
      g.kicker('AGENTIC COMMERCE · GEO');
      const q = '닭가슴살 추천해줘';
      const morph = E.inOut(seg(t, 2.6, 3.6));
      const typed = q.slice(0, Math.floor(seg(t, 0.4, 2.2) * q.length + 0.001));
      const bw = lerp(760, 420, morph), bx = lerp(260, 1216 - 420, morph), by = lerp(300, 120, morph), bh = lerp(64, 58, morph);
      g.box(bx, by, bw, bh, { fill: morph > .5 ? C.accentD : 'rgba(255,255,255,.08)', r: lerp(32, 18, morph), stroke: morph > .5 ? null : C.line2 });
      g.text((morph < .5 ? '🔍  ' : '') + typed + (t < 2.4 && Math.floor(t * 3) % 2 ? '|' : ''), bx + (morph < .5 ? 28 : 24), by + bh / 2 + 7, { size: 20, weight: 600 });
      g.alpha(seg(t, 3.6, 4.1), () => {
        g.box(64, 210, 760, 330, { fill: C.panel, r: 16, stroke: C.line });
        g.pill('AI 브리핑', 90, 232, { size: 13, fill: 'rgba(139,155,255,.16)', color: C.accent });
        g.text('다이어트·단백질 보충용으로 많이 찾는 제품이에요.', 90, 300, { size: 18, color: C.ink2 });
        const recs = ['한끼통살 소스통살', 'A사 닭가슴살', 'B사 스테이크'];
        recs.forEach((r, i) => {
          const p = E.out(seg(t, 4.2 + i * 0.5, 4.8 + i * 0.5)); const y = 326 + i * 66;
          g.alpha(p, () => {
            g.box(90, y, 708, 54, { fill: i === 0 ? 'rgba(139,155,255,.16)' : 'rgba(255,255,255,.04)', r: 10, stroke: i === 0 && t > 5.6 ? C.accent : null, lw: 2 });
            g.text(String(i + 1), 114, y + 35, { size: 18, font: 'num', weight: 700, color: i === 0 ? C.accent : C.ink3 });
            g.text(r, 150, y + 35, { size: 19, weight: i === 0 ? 700 : 500, color: i === 0 ? C.ink : C.ink2 });
          });
        });
      });
      g.alpha(E.out(seg(t, 6, 6.6)), () => {
        const items = [['출발점 측정', 'AI 탭 유입 일 1명 미만 (6/1–7/16)'], ['GEO 재점검', '상세 · 리뷰 · FAQ 를 인용되기 쉬운 구조로'], ['신규 지면 대응', 'AI 브리핑 광고 (26.7 출시)']];
        items.forEach(([a, b], i) => {
          const p = E.out(seg(t, 6.2 + i * 0.6, 6.8 + i * 0.6)); const y = 230 + i * 104;
          g.alpha(p, () => g.shift(lerp(20, 0, p), 0, () => {
            g.box(860, y, 356, 88, { fill: C.panel, r: 12, stroke: C.line });
            g.text(a, 884, y + 36, { size: 19, weight: 700 });
            g.text(b, 884, y + 66, { size: 15, color: C.ink2 });
          }));
        });
      });
    },
  };

  /* ------------------------------------------------------------ player */
  const players = [];
  const ICON_PLAY = '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>';
  const ICON_PAUSE = '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>';
  const ICON_REPLAY = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8a5 5 0 1 0 1.5-3.6"/><path d="M3 2.5v2.5h2.5"/></svg>';
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function mount(host, opt) {
    const stage = host.querySelector('.stage') || host;
    const scene = SCENES[opt.scene];
    const isVideo = !!opt.video;
    const title = host.closest('.proj')?.querySelector('h3')?.textContent || '모션 영상';
    host.setAttribute('role', 'group'); host.setAttribute('aria-label', `영상: ${title}`); host.tabIndex = 0;
    // 영상 위: 배지·큰 재생 버튼 / 영상 아래: 자막 줄·조작부 (자막이 화면을 가리지 않게)
    stage.insertAdjacentHTML('beforeend', `
      <span class="badge">${isVideo ? 'VIDEO' : 'MOTION · 실제 데이터'}</span>
      <button class="bigplay" type="button" aria-label="재생"><span>${ICON_PLAY}</span></button>`);
    host.insertAdjacentHTML('beforeend', `
      <div class="cap" aria-hidden="true"></div>
      <div class="ctl">
        <button class="pbtn" type="button" aria-label="재생">${ICON_PLAY}</button>
        <div class="bar" role="slider" aria-label="재생 위치" aria-valuemin="0" tabindex="-1"><div class="trk"><div class="fil"></div></div></div>
        <span class="time">0:00</span>
      </div>`);
    const cap = host.querySelector('.cap'), pbtn = host.querySelector('.pbtn'), big = host.querySelector('.bigplay');
    const bar = host.querySelector('.bar'), fil = host.querySelector('.fil'), time = host.querySelector('.time');

    const P = { host, playing: false, userPaused: false, t: 0, last: 0, raf: 0, visible: false, dur: scene ? scene.duration : 0 };
    let media = null, canvas = null, ctx = null, g = null, W = 0, H = 0, dpr = 1;

    if (isVideo) {
      media = document.createElement('video');
      Object.assign(media, { muted: true, playsInline: true, loop: true, preload: 'metadata' });
      media.src = opt.video; stage.appendChild(media);
      media.addEventListener('loadedmetadata', () => { P.dur = media.duration || 0; ui(); });
      media.addEventListener('timeupdate', () => { P.t = media.currentTime; ui(); });
      media.addEventListener('error', () => { cap.textContent = `영상을 불러오지 못했습니다 (${opt.video}) — 경로를 확인해 주세요`; });
    } else if (scene) {
      canvas = document.createElement('canvas'); stage.appendChild(canvas);
      ctx = canvas.getContext('2d'); g = kit(ctx);
      // 챕터 눈금
      scene.chapters.slice(1).forEach(([ct]) => { const d = document.createElement('i'); d.className = 'chap'; d.style.left = (ct / scene.duration * 100) + '%'; host.querySelector('.trk').appendChild(d); });
      P.t = scene.poster || 0;
    }

    function resize() {
      if (!canvas) return;
      const r = stage.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = W * dpr; canvas.height = H * dpr; render();
    }
    function render() {
      if (!ctx || !W) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      const sc = Math.min(W / VW, H / VH) * dpr; const ox = (canvas.width - VW * sc) / 2, oy = (canvas.height - VH * sc) / 2;
      ctx.setTransform(sc, 0, 0, sc, ox, oy);
      // 은은한 격자 배경
      ctx.save(); ctx.globalAlpha = 0.5;
      for (let x = 0; x <= VW; x += 64) { ctx.fillStyle = 'rgba(255,255,255,.025)'; ctx.fillRect(x, 0, 1, VH); }
      ctx.restore();
      try { scene.draw(g, P.t); } catch (e) { console.error(e); }
      ui();
    }
    function ui() {
      const d = P.dur || 1; fil.style.width = (clamp(P.t / d) * 100) + '%';
      time.textContent = `${mmss(Math.min(P.t, d))} / ${mmss(d)}`;
      bar.setAttribute('aria-valuemax', String(Math.round(d))); bar.setAttribute('aria-valuenow', String(Math.round(P.t)));
      if (scene) {
        let c = ''; for (const [ct, s] of scene.chapters) if (P.t >= ct) c = s;
        if (cap.textContent !== c) cap.textContent = c;
      }
      pbtn.innerHTML = P.playing ? ICON_PAUSE : ICON_PLAY; pbtn.setAttribute('aria-label', P.playing ? '일시정지' : '재생');
      host.classList.toggle('playing', P.playing || P.t > 0.05 && !isVideo && P.started);
    }
    function frame(now) {
      if (!P.playing) return;
      const dt = Math.min(0.1, (now - P.last) / 1000); P.last = now;
      P.t += dt;
      if (P.t >= P.dur + 1.4) P.t = 0; // 마지막 장면을 잠깐 보여준 뒤 처음부터
      render();
      P.raf = requestAnimationFrame(frame);
    }
    function play(user) {
      if (user) P.userPaused = false;
      if (P.playing) return; P.playing = true; P.started = true;
      if (media) { media.play().catch(() => { P.playing = false; ui(); }); ui(); return; }
      if (P.t >= P.dur - 0.05 || (!P.everPlayed && P.t === (scene.poster || 0))) P.t = 0;
      P.everPlayed = true;
      P.last = performance.now(); P.raf = requestAnimationFrame(frame); ui();
    }
    function pause(user) {
      if (user) P.userPaused = true;
      if (!P.playing) return; P.playing = false;
      if (media) media.pause(); cancelAnimationFrame(P.raf); ui();
    }
    function seek(sec) {
      P.t = clamp(sec, 0, P.dur); P.started = true;
      if (media) media.currentTime = P.t; else render();
    }
    P.play = play; P.pause = pause; P.render = render;

    big.addEventListener('click', e => { e.stopPropagation(); play(true); });
    pbtn.addEventListener('click', e => { e.stopPropagation(); P.playing ? pause(true) : play(true); });
    stage.addEventListener('click', e => { if (e.target.closest('.bigplay')) return; P.playing ? pause(true) : play(true); });
    const scrub = e => { const r = bar.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * P.dur); };
    bar.addEventListener('pointerdown', e => { bar.setPointerCapture(e.pointerId); const was = P.playing; pause(); scrub(e);
      const mv = ev => scrub(ev), up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); if (was) play(); };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up); });
    host.addEventListener('keydown', e => {
      if (e.target !== host) return; // 안쪽 버튼은 자체 동작을 따른다
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); P.playing ? pause(true) : play(true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); seek(P.t + 2); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(P.t - 2); }
    });

    if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe(stage);
    resize();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => {
        P.visible = e.intersectionRatio >= 0.55;
        if (P.visible && !P.userPaused && !reduceMotion && document.visibilityState === 'visible') play(false);
        if (e.intersectionRatio < 0.2) pause(false);
      }), { threshold: [0, 0.2, 0.55, 0.8] }).observe(host);
    }
    players.push(P);
    return P;
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) players.forEach(p => p.pause(false)); });

  window.MOTION = {
    scenes: SCENES,
    mount,
    pauseAll: () => players.forEach(p => p.pause(true)),
    redrawAll: () => players.forEach(p => p.render && p.render()),
  };
})();
