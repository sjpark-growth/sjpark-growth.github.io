#!/usr/bin/env node
/* fx-audit — 모션 · 시각 효과(assets/fx.js)를 고친 뒤 돌리는 헤드리스 점검 (2026-11-23)
 *
 *   node .claude/skills/web-motion/scripts/fx-audit.js [--url http://localhost:8765/] [--out <폴더>] [--pdf] [--quick] [--json]
 *
 *   먼저 저장소 루트에서 정적 서버를 띄운다(예: python -m http.server 8765 · npx http-server -p 8765).
 *   필요한 것: playwright(또는 playwright-core) + 크로미움. 외부 요청 없음.
 *
 * 하는 일 (화면마다 — 1463×800 · 1280×720 · 390×844, 라이트 · 다크)
 *   1. 스크립트 오류 · 콘솔 오류 0 인지
 *   2. 가로 넘침 0 인지
 *   3. 배치가 그대로인지 — 같은 화면을 ?fx=0(효과 끔)으로 열어 주요 칸(첫 화면 · 절 머리 · 카드)의 위치 · 크기를 비교(차이 0.5px 넘으면 ✗)
 *   4. 글자 대비 — 첫 화면 글자를 투명하게 만든 뒤 그 자리 바탕을 찍어 실제 글자색과 대비를 잰다(효과 켬 / 끔). 4.5:1 아래가 새로 생기면 ✗
 *   4-1. 글자 — 끝까지 굴린 뒤 절 머리 · 첫 화면 글자가 효과 끔과 같은지(꼬리표 해독 같은 글자 효과가 원래 글자로 돌아왔는지)
 *   5. 스크롤 프레임 — 4초 동안 페이지를 끝까지 굴리며 rAF 간격(25ms 넘는 비율 · 가장 긴 프레임)을 효과 켬 / 끔으로
 *   6. 동작 줄이기(reduced motion) — fx 가 루프를 돌리지 않는지(FX.info().loops === 0)
 *   6-1. endless — 끝없이 도는 CSS · 스크립트 애니메이션(iterations Infinity)이 페이지에 하나도 없는지(2026-11-26 본인 「장식 애니메이션은 한 번만」 — 화면마다 · 장 넘김에서도)
 *   7. 장 넘김 — 「장으로 보기」를 켠 뒤 → 키 5번 · 오류 0
 *   8. --pdf: 전체 · 요약 PDF 장 수(효과 켬 / 끔이 같아야 한다)
 *   결과: 표 + <out>/fx-audit.json, 화면 그림 <out>/*.png
 *   종료 코드: ✗ 가 하나라도 있으면 1
 */
'use strict';
const fs = require('fs'), path = require('path');
let pw;
try { pw = require('playwright'); } catch (e) { try { pw = require('playwright-core'); } catch (e2) { console.error('playwright 가 없습니다 — npm i -D playwright 후 npx playwright install chromium'); process.exit(2); } }

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true); };
const BASE = String(arg('url', 'http://localhost:8765/')).replace(/\/?$/, '/');
const OUT = path.resolve(String(arg('out', path.join(process.cwd(), '_fx-audit'))));
const QUICK = !!arg('quick', false), PDF = !!arg('pdf', false), JSONOUT = !!arg('json', false);
fs.mkdirSync(OUT, { recursive: true });

const VIEWS = QUICK ? [[1463, 800], [390, 844]] : [[1463, 800], [1280, 720], [390, 844]];
const SCHEMES = QUICK ? ['light'] : ['light', 'dark'];
// 배치 비교 대상 — 효과는 배치를 바꾸지 않아야 한다(transform · opacity · 덧그림만)
const PROBES = ['.hero .shell', '.hero-l', '#h-thesis', '#kpis', '#mboard', '.mp-dash', '#summary', '#results', '#dash', '#perf', '#growth', '#work', '#pillars', '#career', '#contact', '.foot'];
// 대비를 잴 첫 화면 글자
const TEXTS = ['.eyebrow b', '#h-kicker', '#h-thesis', '.herosum li', '.hkey-h', '.hk .kpi .d', '.mb-h span', '.hk .kpi small'];

const results = []; let fails = 0;
// 끝없이 도는 애니메이션 — 이름 @ 대상(데모 iframe 안은 document.getAnimations 에 안 들어온다)
const endless = page => page.evaluate(() => document.getAnimations().filter(a => {
  try { return a.effect && a.effect.getComputedTiming().iterations === Infinity && a.playState !== 'idle'; } catch (e) { return false; }
}).map(a => { const t = a.effect.target; const c = t && (t.id ? '#' + t.id : String((t.className && t.className.baseVal !== undefined) ? t.className.baseVal : (t.className || t.tagName)).split(' ')[0]); return (a.animationName || a.id || 'script') + ' @' + (c || '?') + (a.effect.pseudoElement || ''); }));
const mark = (ok, warn) => ok ? '✓' : warn ? '△' : (fails++, '✗');

function lum([r, g, b]) { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
function contrast(a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
function parseRGB(s) { const m = /rgba?\(([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/.exec(s); return m ? [+m[1], +m[2], +m[3]] : null; }

async function open(browser, w, h, scheme, q, reduce) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: reduce ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(BASE + 'index.html' + (q || ''), { waitUntil: 'load' });
  await page.waitForTimeout(2600);
  return { ctx, page, errs };
}

// 주요 칸 + 첫 화면 · 주요 성과 · 상단 바 안의 모든 요소(효과가 더한 .fx-stage · span.fx-grad 는 빼고, 이름에 fx- 클래스는 안 넣음).
// 차트 SVG 안(움직이는 점 · 막대)은 시간에 따라 바뀌므로 빼고, 가로로 넘기는 칸(휴대폰 성과 리포트)은 넘긴 만큼 되돌려 잰다
const rects = page => page.evaluate(sels => {
  const box = n => {
    const r = n.getBoundingClientRect(); let sx = 0;
    for (let a = n.parentElement; a; a = a.parentElement) sx += a.scrollLeft || 0;
    return [r.left + scrollX + sx, r.top + scrollY, r.width, r.height].map(v => Math.round(v * 2) / 2);
  };
  const name = n => n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + Array.from(n.classList).filter(c => !/^(fx-|anim-|reveal|spot-on)/.test(c)).slice(0, 2).map(c => '.' + c).join('');
  const out = sels.map(s => { const n = document.querySelector(s); return [s, n ? box(n) : null]; });
  ['.hero', '#results', '.mast'].forEach(scope => {
    const host = document.querySelector(scope); if (!host) return;
    const seen = {};
    Array.from(host.querySelectorAll('*')).filter(n => !n.closest('.fx-stage') && !n.classList.contains('fx-grad') && !(n.ownerSVGElement))
      .forEach(n => { const k = `${scope} ${name(n)}`; seen[k] = (seen[k] || 0) + 1; out.push([`${k}#${seen[k]}`, box(n)]); });
  });
  return out;
}, PROBES);

async function contrastScan(page, file) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
  // 첫 화면 글자만 투명하게 → 바탕 그림을 찍고 글자 칸 자리의 바탕색을 고른다(가장 나쁜 점)
  const boxes = await page.evaluate(sels => {
    const out = [];
    sels.forEach(s => document.querySelectorAll(s).forEach(n => {
      const r = n.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight) return;
      out.push({ s, x: r.left, y: r.top, w: r.width, h: r.height, c: getComputedStyle(n).color });
    }));
    return out;
  }, TEXTS);
  await page.addStyleTag({ content: '.hero *, .hero *::before, .hero *::after { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; } .hero img, .hero svg { visibility: hidden !important; } .hero .fx-grad, .hero .shine { background-image: none !important; }' });   // 그라데이션 글자(background-clip: text)는 바탕을 지워야 안 보인다
  await page.waitForTimeout(250);
  const png = await page.screenshot();
  if (file) fs.writeFileSync(file, png);
  // PNG 해독 없이 픽셀을 읽으려고 브라우저 캔버스를 빌린다
  const worst = await page.evaluate(async ({ b64, boxes }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    return boxes.map(b => {
      const pts = [];
      for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
        const x = Math.round(b.x + b.w * (i + 0.5) / 5), y = Math.round(b.y + b.h * (j + 0.5) / 3);
        if (x < 0 || y < 0 || x >= c.width || y >= c.height) continue;
        const d = g.getImageData(x, y, 1, 1).data; pts.push([d[0], d[1], d[2]]);
      }
      return { s: b.s, c: b.c, pts };
    });
  }, { b64: png.toString('base64'), boxes });
  let min = 99, at = '';
  worst.forEach(w => { const fg = parseRGB(w.c); if (!fg) return; w.pts.forEach(p => { const k = contrast(fg, p); if (k < min) { min = k; at = w.s; } }); });
  return { min: Math.round(min * 100) / 100, at };
}

async function frames(page) {
  return page.evaluate(() => new Promise(res => {
    const H = document.documentElement.scrollHeight - innerHeight, T = 4000, gaps = [];
    let t0 = 0, last = 0;
    const tick = t => {
      if (!t0) { t0 = last = t; }
      else { gaps.push(t - last); last = t; }
      const k = Math.min(1, (t - t0) / T);
      window.scrollTo({ top: H * k, behavior: 'instant' });   // 사이트는 scroll-behavior: smooth — 바로 옮겨야 프레임을 잰다
      if (k < 1) requestAnimationFrame(tick);
      else { window.scrollTo({ top: 0, behavior: 'instant' }); const long = gaps.filter(g => g > 25).length; res({ n: gaps.length, longPct: Math.round(long / Math.max(1, gaps.length) * 1000) / 10, max: Math.round(Math.max(0, ...gaps)) }); }
    };
    requestAnimationFrame(tick);
  }));
}

async function pdfPages(browser, q) {
  const out = {};
  for (const kind of ['full', 'short']) {
    const { ctx, page } = await open(browser, 1440, 900, 'light', q);
    await page.evaluate(k => { if (k === 'short') document.body.classList.add('print-short'); window.dispatchEvent(new Event('beforeprint')); }, kind);
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(600);
    const buf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    out[kind] = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    await ctx.close();
  }
  return out;
}

(async () => {
  const browser = await pw.chromium.launch();
  for (const [w, h] of VIEWS) for (const scheme of SCHEMES) {
    const tag = `${w}x${h}-${scheme}`;
    const on = await open(browser, w, h, scheme, '');
    const off = await open(browser, w, h, scheme, '?fx=0');
    const fxOn = await on.page.evaluate(() => document.documentElement.classList.contains('fx-on'));
    const info = await on.page.evaluate(() => window.FX && window.FX.info ? window.FX.info() : null);
    await on.page.screenshot({ path: path.join(OUT, `hero-${tag}.png`) });
    const overflow = await on.page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    const [ra, rb] = [await rects(on.page), await rects(off.page)];
    const mb = new Map(rb);
    const shifts = ra.length !== rb.length ? [`요소 수가 다름 ${ra.length} ≠ ${rb.length}`] : ra.map(([s, a]) => { const b = mb.get(s); if (!a || !b) return a || b ? `${s} 없음` : null; const d = Math.max(...a.map((v, j) => Math.abs(v - b[j]))); return d > 0.5 ? `${s} ${d}px` : null; }).filter(Boolean).slice(0, 12);
    const fOn = await frames(on.page), fOff = await frames(off.page);
    // 글자 효과(꼬리표 해독 등)는 끝나면 원래 글자로 돌아와야 한다 — 끝까지 굴린 뒤 본문 글자를 효과 끔과 비교
    await on.page.waitForTimeout(1500); await off.page.waitForTimeout(1500);
    const txt = p => p.evaluate(() => Array.from(document.querySelectorAll('.sec-h, .growth-h, .hero-l, .mb-h')).map(n => n.innerText.replace(/\s+/g, ' ').trim()));
    const [tOn, tOff] = [await txt(on.page), await txt(off.page)];
    const textDiff = tOn.map((t, i) => t === tOff[i] ? null : `${t.slice(0, 40)} ≠ ${String(tOff[i]).slice(0, 40)}`).filter(Boolean);
    const cOn = await contrastScan(on.page, path.join(OUT, `bg-${tag}.png`)), cOff = await contrastScan(off.page);
    const loopsLeft = [...new Set((await endless(on.page)).concat(await endless(off.page)))];
    const row = { view: tag, fxOn, info, errors: on.errs.concat(off.errs), overflow, shifts, textDiff, frames: { on: fOn, off: fOff }, contrast: { on: cOn, off: cOff }, endless: loopsLeft };
    row.verdict = {
      errors: mark(!row.errors.length), overflow: mark(overflow <= 0), layout: mark(!shifts.length), text: mark(!textDiff.length),
      contrast: mark(cOn.min >= 4.5 || cOn.min >= cOff.min - 0.05, cOn.min >= 4.0),
      frames: mark(fOn.longPct <= fOff.longPct + 8, fOn.longPct <= fOff.longPct + 20),
      endless: mark(!loopsLeft.length),
    };
    results.push(row);
    await on.ctx.close(); await off.ctx.close();
  }
  // 동작 줄이기
  {
    const r = await open(browser, 1463, 800, 'light', '', true);
    const info = await r.page.evaluate(() => window.FX && window.FX.info ? window.FX.info() : null);
    results.push({ view: 'reduced-motion 1463x800', info, errors: r.errs, verdict: { errors: mark(!r.errs.length), loops: mark(!info || info.loops === 0) } });
    await r.ctx.close();
  }
  // 장 넘김
  for (const [w, h] of [[1463, 800], [390, 844]]) {
    const r = await open(browser, w, h, 'light', '');
    await r.page.click('#modeBtn').catch(() => {});
    await r.page.waitForTimeout(2500);
    const deck = await r.page.evaluate(() => !!(window.TopicsDeck && window.TopicsDeck.active));
    for (let i = 0; i < 5; i++) { await r.page.keyboard.press('ArrowRight'); await r.page.waitForTimeout(900); }
    await r.page.screenshot({ path: path.join(OUT, `deck-${w}x${h}.png`) });
    const info = await r.page.evaluate(() => window.FX && window.FX.info ? window.FX.info() : null);
    const loopsLeft = await endless(r.page);
    results.push({ view: `deck ${w}x${h}`, deck, info, errors: r.errs, endless: loopsLeft, verdict: { errors: mark(!r.errs.length), deck: mark(deck), endless: mark(!loopsLeft.length) } });
    await r.ctx.close();
  }
  if (PDF) {
    const a = await pdfPages(browser, ''), b = await pdfPages(browser, '?fx=0');
    results.push({ view: 'pdf', on: a, off: b, verdict: { same: mark(a.full === b.full && a.short === b.short) } });
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'fx-audit.json'), JSON.stringify(results, null, 2));
  if (JSONOUT) console.log(JSON.stringify(results, null, 2));
  else results.forEach(r => {
    const v = Object.entries(r.verdict).map(([k, x]) => `${x} ${k}`).join('  ');
    let extra = '';
    if (r.frames) extra = `  프레임 25ms+ ${r.frames.on.longPct}% (끔 ${r.frames.off.longPct}%) 최장 ${r.frames.on.max}ms · 대비 최저 ${r.contrast.on.min} (끔 ${r.contrast.off.min}, ${r.contrast.on.at})`;
    if (r.view === 'pdf') extra = `  전체 ${r.on.full}장 · 요약 ${r.on.short}장 (끔 ${r.off.full} · ${r.off.short})`;
    console.log(`${r.view.padEnd(26)} ${v}${extra}`);
    if (r.errors && r.errors.length) r.errors.slice(0, 5).forEach(e => console.log('    ' + e));
    if (r.shifts && r.shifts.length) console.log('    배치 바뀜: ' + r.shifts.join(' · '));
    if (r.textDiff && r.textDiff.length) console.log('    글자 다름: ' + r.textDiff.slice(0, 4).join(' · '));
    if (r.endless && r.endless.length) console.log('    끝없이 도는 것: ' + r.endless.slice(0, 8).join(' · '));
  });
  console.log(`\n${fails ? '✗ ' + fails + '개' : '모두 통과'} — 그림 · json: ${OUT}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
