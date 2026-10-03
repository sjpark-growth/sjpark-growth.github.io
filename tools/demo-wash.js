#!/usr/bin/env node
/* 데모 가림 도구 — 공개 데모 3종(대시보드 · 브리핑룸 · 재고 신호판)에서 품목 · 상품 실명을 가린다.
 *
 *   node tools/demo-wash.js            세 데모를 가리고 덮어쓴다(바뀐 것이 없으면 그대로)
 *   node tools/demo-wash.js --check    덮어쓰지 않고 검사만 — 가릴 것이 남았으면 종료 코드 1
 *   node tools/demo-wash.js a.html …   파일을 골라서
 *   node tools/demo-wash.js --staged   pre-commit 훅용 — 커밋에 들어가는 데모 · 본문 파일만 가리고 다시 스테이징
 *
 * 규칙(자세한 것은 CLAUDE.md 「5-3. 데모 가림」)
 *  1. 범주 값(SKU · PRODUCT · PMC · STOCK …의 품목 칸)은 대응표의 코드로 바꾼다. 처음 보는 범주는 새 코드를 붙여 대응표에 더한다.
 *  2. 상품명 · 규격 · 검색어 칸은 「허용 목록」 방식이다. 일반어(냉동 · 세트 · 개입 …) · 숫자 · 가린 코드만 남기고,
 *     범주명은 코드로, 「~맛」은 맛 코드로 바꾸고, 나머지 낱말은 지운다 — 새 상품이 생겨도 실명이 남지 않는다.
 *  3. 캠페인 수정 메모는 상품명에서 지운 낱말 · 범주명 · 맛 이름만 골라 「○○」 · 코드로 바꾸고,
 *     사내 운영 흔적(결재자 · 대화 인용 · 사내 게시글 · 시트 이름 — 대응표의 memo 규칙)을 지운다.
 *  4. 대시보드 머리(doctype · 뷰포트 · [hidden] 숨김 규칙 · 마진 가림)가 빠져 있으면 되살린다 — 없으면 빈 ✕ 팝업이 뜬다.
 *  5. 본문 파일(대응표의 site — 모션 영상 · data.js · index · en)도 같은 대응표로 본다. 낱말 하나로 떨어진 품목명은
 *     데모와 같은 코드로 바꾸고, 조사가 붙어 자동으로 못 바꾼 것은 줄 번호를 알려 주며 실패한다.
 *
 * 대응표(tools/demo-wash.json)에는 실명을 적지 않는다. 실명은 해시로만 남고 코드만 평문이다 — 이 저장소는 공개라서.
 * 같은 입력이면 늘 같은 결과(멱등)라서 두 번 돌려도 바뀌지 않는다.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const CONF_PATH = path.join(__dirname, 'demo-wash.json');
const conf = JSON.parse(fs.readFileSync(CONF_PATH, 'utf8'));
const DEFAULT_FILES = Object.keys(conf.files);

const HAN = /[가-힣]/;
const CODE_CAT = /^[A-Z]{1,3}제품$/;
const CODE_WORD = /^([A-Z]{1,3}(제품|맛|브랜드)|타브랜드[A-Z]?)$/;
const UNITS = '개입씩|개입|개씩|입씩|팩세트|봉지|박스|세트|개|종|팩|봉|입|매|인|구|장|포|병|캔|회|일|주|월|원|차|년|위|단계|시간|kg|ml|mL|p|P|g|L';
const QTY = new RegExp('^[0-9][0-9xX]*(' + UNITS + ')?$');
const PART = new RegExp('([A-Z]{1,3}(?:제품|맛|브랜드)|타브랜드[A-Z]?|[0-9][0-9xX]*(?:' + UNITS + ')?|[A-Za-z]+|[가-힣]+)');
const ALLOW = new Set(conf.allow);
const KEEP_CATS = new Set(conf.keepCats);
const KEEP_CAT_RE = /^([A-Z]_)?타브랜드[A-Z]?$/;
const MASK = '○○';
const maxLen = 12;   // 낱말 최대 길이(해시로 찾을 때)

const hash = (w) => crypto.createHash('sha256').update(conf.salt + '\u0000' + w).digest('hex').slice(0, 12);
const deny = new Set(conf.deny);
let confDirty = false;
let PUBLIC_TEXT = '';   // 데이터 밖(화면 문구 · 코드)의 글 — 여기에 쓰이는 일반어는 「지운 낱말」 목록에 넣지 않는다

/* ── 코드 배정 ─────────────────────────────────────────── */
function* letters() { const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; for (const a of A) yield a; for (const a of A) for (const b of A) yield a + b; for (const a of A) for (const b of A) for (const c of A) yield a + b + c; }
const usedCat = new Set(), usedFlavor = new Set();   // 세 파일에 이미 있는 코드 — 새 코드가 겹치면 두 품목이 한 줄로 합쳐진다
function noteUsed(text) {
  for (const m of text.matchAll(/([A-Z]{1,3})제품/g)) usedCat.add(m[1] + '제품');
  for (const m of text.matchAll(/([A-Z]{1,3})맛/g)) usedFlavor.add(m[1] + '맛');
}
function nextCode(suffix, used, taken) { for (const l of letters()) { const c = l + suffix; if (!used.has(c) && !taken.has(c)) return c; } throw new Error('코드가 모자람'); }

/* 범주 값 → 코드 (가릴 것이 아니면 그대로) */
function catCode(v, f) {
  if (typeof v !== 'string' || !HAN.test(v)) return v;
  if (f.remap && Object.prototype.hasOwnProperty.call(conf.remap, v)) return conf.remap[v];
  if (CODE_CAT.test(v) || KEEP_CATS.has(v) || KEEP_CAT_RE.test(v)) return v;
  const h = hash(v);
  if (!conf.cats[h]) {
    conf.cats[h] = nextCode('제품', usedCat, new Set(Object.values(conf.cats).concat(Object.values(conf.remap))));
    confDirty = true;
  }
  return conf.cats[h];
}
function flavorCode(w) {
  const h = hash(w);
  if (!conf.flavors[h]) { conf.flavors[h] = nextCode('맛', usedFlavor, new Set(Object.values(conf.flavors))); confDirty = true; }
  return conf.flavors[h];
}
function remember(w) {
  if (w.length < 2 || !/^[가-힣]+$/.test(w) || PUBLIC_TEXT.includes(w) || conf.keepCats.some((c) => c.includes(w))) return;
  const h = hash(w); if (!deny.has(h)) { deny.add(h); confDirty = true; }
}

/* ── 상품명 · 규격 · 검색어: 허용 목록 ────────────────────── */
const ALLOW2 = [...ALLOW].filter((w) => w.length >= 2);
function allowed(w) {                                           // 「실온주력」처럼 허용어끼리 붙은 말
  if (ALLOW.has(w)) return true;
  const ok = [true]; for (let i = 1; i <= w.length; i++) ok[i] = ALLOW2.some((a) => a.length <= i && ok[i - a.length] && w.endsWith(a, i));
  return ok[w.length];
}
function washWord(w, f, st) {
  if (!HAN.test(w)) return w;                                   // 숫자 · 영문
  if (f.remap && conf.remap[w]) return conf.remap[w];
  if (CODE_WORD.test(w)) return w;
  const dbl = w.match(/^([A-Z]{1,3}맛)맛+$/); if (dbl) return dbl[1];   // 동기화가 남긴 「W맛맛」
  if (QTY.test(w) || allowed(w)) return w;
  const h = hash(w);
  if (conf.cats[h]) { st.hit = true; return conf.cats[h]; }
  if (/[A-Za-z0-9]/.test(w)) {                                  // 「AO제품5」 · 「A브랜드+품목명」 · 「낱말+N제품」처럼 코드와 붙은 말
    const parts = w.split(PART).filter(Boolean);
    if (parts.length > 1) {
      const out = parts.map((p) => washWord(p, f, st)).filter(Boolean);
      return out.reduce((s, p) => s + (s && !/^[0-9]/.test(p) && HAN.test(p) ? ' ' : '') + p, '');
    }
  }
  if (w.length >= 3 && w.endsWith('맛')) { st.hit = true; return flavorCode(w); }
  // 붙은 한글 말(「품목명+주력」 · 「수식어+품목명」)은 앞에서부터 허용어 · 범주명을 찾아 살리고 나머지 조각은 지운다
  const keep = []; let junk = '';
  const flush = () => { if (junk) { remember(junk); st.drop = true; junk = ''; } };
  for (let i = 0; i < w.length;) {
    let hit = null;
    for (let L = Math.min(maxLen, w.length - i); L >= 2 && !hit; L--) {
      const x = w.substr(i, L);
      if (ALLOW.has(x)) hit = [L, x]; else if (conf.cats[hash(x)]) { hit = [L, conf.cats[hash(x)]]; st.hit = true; }
    }
    if (hit) { flush(); keep.push(hit[1]); i += hit[0]; } else { junk += w[i]; i++; }
  }
  flush();
  return keep.join(' ');
}
function tidy(s) {
  return s
    .replace(/[ \t]+/g, ' ')
    .replace(/([(\[])\s+/g, '$1').replace(/\s+([)\]])/g, '$1')
    .replace(/([(\[])[\s,·\/_+*&|-]+/g, '$1').replace(/[\s,·\/_+*&|-]+([)\]])/g, '$1')
    .replace(/\(\)|\[\]/g, '')
    .replace(/([,·\/_+*&|.-])(\s*[,·\/_+*&|.-])+/g, (m, a) => (/_/.test(m) ? '_' : a))
    .replace(/\s+,/g, ',')
    .replace(/(^|\s)[\/,·+&](?=\s|$)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/^[\s,·\/_+*&|.-]+|[\s,·\/_+*&|.-]+$/g, '');
}
function washName(s, f, cat) {
  if (typeof s !== 'string' || !HAN.test(s)) return s;
  const st = { drop: false, hit: false };
  const pieces = s.split(/([가-힣A-Za-z0-9]+)/);
  for (let i = 1; i < pieces.length; i += 2) pieces[i] = washWord(pieces[i], f, st);
  let out = pieces.join('');
  if (out !== s) out = tidy(out);
  if (cat && CODE_CAT.test(cat) && (st.drop || st.hit) && !/[A-Z]{1,3}제품/.test(out)) {
    const b = out.match(/^(.*?(?:[A-Z]브랜드|타브랜드[A-Z]?)\]?)(.*)$/);   // 상품명에 품목 코드가 하나도 안 남으면 브랜드(대괄호면 닫는 괄호) 뒤에 붙인다
    out = b ? b[1] + ' ' + cat + (b[2] && !/^[\s,_]/.test(b[2]) ? ' ' : '') + b[2]
            : out.replace(/^((?:\[[^\]]*\]\s*)*)/, (m) => m + cat + (out.length > m.length ? ' ' : ''));
  }
  return out || MASK;
}

/* ── 메모: 알려진 낱말만 ───────────────────────────────── */
function scrubNote(s, f) {
  if (typeof s !== 'string' || !HAN.test(s)) return s;
  return s.replace(/[가-힣]+/g, (run) => {
    let out = '', i = 0;
    while (i < run.length) {
      let hit = null;
      for (let L = Math.min(maxLen, run.length - i); L >= 2 && !hit; L--) {
        if (L === 2 && i > 0) break;                              // 두 글자는 낱말 머리에서만(「볼 수」 같은 오탐을 줄인다)
        const w = run.substr(i, L);
        if (allowed(w)) continue;
        if (f.remap && conf.remap[w]) { hit = [L, conf.remap[w]]; break; }
        const h = hash(w);
        if (conf.cats[h]) hit = [L, conf.cats[h]];
        else if (conf.flavors[h]) hit = [L, conf.flavors[h]];
        else if (deny.has(h)) hit = [L, MASK];
      }
      if (hit) { out += hit[1]; i += hit[0]; } else { out += run[i]; i++; }
    }
    return out;
  });
}

const MEMO = (conf.memo || []).map(([re, to]) => [new RegExp(re, 'g'), to]);
function scrubMemo(s) {                                         // 사내 운영 흔적 — 운영 기록(예산 · 목표 · 초기화 …)은 남긴다
  if (typeof s !== 'string' || !s) return s;
  let out = s;
  for (const [re, to] of MEMO) out = out.replace(re, to);
  if (out === s) return s;
  return out.replace(/\(\s*\)/g, '').replace(/\s*·\s*(·\s*)+/g, ' · ').replace(/^\s*·\s*|\s*·\s*$/g, '').replace(/\s{2,}/g, ' ').trim();
}

/* ── 파일 구조 ─────────────────────────────────────────── */
function blocks(src) {
  const re = /^[ \t]*(?:var|const|let) ([A-Za-z_][A-Za-z0-9_]*) = *(?:\/\*W\*\/)? *([\[{])/gm; const out = []; let m;
  while ((m = re.exec(src))) {
    const s = m.index + m[0].length - 1; let e = src.indexOf('\n', s); if (e < 0) e = src.length;
    let t = src.slice(s, e).replace(/\s+$/, ''); if (t.endsWith(';')) t = t.slice(0, -1).replace(/\s+$/, '');
    try { out.push({ name: m[1], start: s, end: s + t.length, value: JSON.parse(t) }); } catch (x) { /* JSON 이 아닌 줄 */ }
  }
  return out;
}
const mapKeys = (o, fn) => { if (!o || typeof o !== 'object' || Array.isArray(o)) return o; const r = {}; for (const [k, v] of Object.entries(o)) r[fn(k)] = v; return r; };

/* 칸별 처리 — 동기화가 구조를 바꾸면 여기에 칸을 더한다(검사 모드가 남은 실명을 알려 준다) */
function washBlocks(B, f) {
  const C = (v) => catCode(v, f), N = (s, c) => washName(s, f, c), M = (s) => scrubMemo(scrubNote(s, f));
  const sku = (rows) => (rows || []).forEach((r) => { r[2] = C(r[2]); r[4] = N(r[4], r[2]); r[5] = N(r[5]); });
  if (B.SKU && B.SKU.rows) sku(B.SKU.rows);
  if (B.BR && B.BR.sku) sku(B.BR.sku.rows);
  if (B.PRODUCT && B.PRODUCT.rows) B.PRODUCT.rows.forEach((r) => { r[2] = C(r[2]); });
  if (B.PMC) {
    if (B.PMC.cats) B.PMC.cats = B.PMC.cats.map(C);
    if (B.PMC.items) B.PMC.items.forEach((r) => { r[1] = N(r[1], B.PMC.cats && B.PMC.cats[r[3]]); });
  }
  if (B.STOCK && B.STOCK.cats) {
    B.STOCK.cats = mapKeys(B.STOCK.cats, C);
    for (const [k, c] of Object.entries(B.STOCK.cats)) {
      if (c.groups) c.groups = c.groups.map(C);
      if (c.bott) { c.bott.nm = N(c.bott.nm, k); c.bott.fl = N(c.bott.fl); }
    }
  }
  if (B.CAMPCHG && B.CAMPCHG.rows) B.CAMPCHG.rows.forEach((r) => { r[5] = M(r[5]); });
  // 재고 신호판
  if (B.G && Array.isArray(B.G)) B.G.forEach((g) => {
    g.g = C(g.g);
    (g.items || []).forEach((i) => { i.nm = N(i.nm, g.g); i.fl = N(i.fl); });
    if (g.bott) { g.bott.nm = N(g.bott.nm, g.g); g.bott.fl = N(g.bott.fl); }
    g.stf = N(g.stf);
  });
  if (B.MALL && !Array.isArray(B.MALL)) {
    B.MALL = mapKeys(B.MALL, C);
    for (const [k, arr] of Object.entries(B.MALL)) (arr || []).forEach((x) => { x.n = N(x.n, k); x.o = N(x.o); });
  }
  if (B.ADS && B.ADS.groups) {
    B.ADS.groups = mapKeys(B.ADS.groups, C);
    for (const g of Object.values(B.ADS.groups)) (g.kw || []).forEach((kw) => { if (Array.isArray(kw)) kw[0] = N(kw[0]); });
  }
  if (B.WEEK) for (const k of ['v', 'cv', 'md']) if (B.WEEK[k]) B.WEEK[k] = mapKeys(B.WEEK[k], C);
}

/* 대시보드 머리 — 직전 게시본과 같은 꼴 */
const HEAD_EXTRA = '<meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
  + '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
  + 'html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}'
  + 'img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style>'
  + '<style> #mgLock, #mgBody, [data-erpv="margin"], #go-margin { display: none !important; }</style>';
function fixHead(src) {
  const top = src.slice(0, 4096);
  const dt = top.search(/<!doctype html>/i);
  if (dt > 0) src = src.slice(dt);                               // doctype 앞의 글자(예: <meta charset>)는 쿼크 모드를 부른다
  else if (dt < 0) src = '<!doctype html>' + src;
  if (!/\[hidden\]:not\(\[hidden=until-found i\]\)\{display:none!important\}/.test(src.slice(0, 4096))) {
    const at = src.slice(0, 4096).search(/<meta name="robots"[^>]*>/);
    const cut = at >= 0 ? at + src.slice(at).indexOf('>') + 1 : src.indexOf('>', src.search(/<head>/i)) + 1;
    src = src.slice(0, cut) + HEAD_EXTRA + src.slice(cut);
  }
  return src;
}

function washFile(name, src) {
  const f = conf.files[name] || {};
  let out = f.head ? fixHead(src) : src;
  const bl = blocks(out).sort((a, b) => b.start - a.start);
  for (const b of bl) {
    const B = { [b.name]: JSON.parse(JSON.stringify(b.value)) };
    washBlocks(B, f);
    const t = JSON.stringify(B[b.name]);
    if (t !== JSON.stringify(b.value)) out = out.slice(0, b.start) + t + out.slice(b.end);
  }
  // 코드 안의 범주 문자열(예: CHICKEN_CATS)도 같은 코드로 — 따옴표 하나가 통째로 범주명일 때만
  out = out.replace(/"([^"\\\n<>]{1,30})"/g, (m, v) => {
    if (!HAN.test(v)) return m;
    if (f.remap && conf.remap[v]) return '"' + conf.remap[v] + '"';
    const c = conf.cats[hash(v)]; return c ? '"' + c + '"' : m;
  });
  if (f.catAlias) out = out.replace(/var CAT_ALIAS = \[[\s\S]*?\]\];[^\n]*/, conf.catAlias);
  return out;
}

/* ── 본문 파일(모션 영상 · data.js · index · en) ─────────────── */
// 품목명이 낱말 하나로 떨어져 있으면(「우리 상품 · 그 품목」 · 「B사 그 품목」) 데모와 같은 코드로 바꾼다.
// 한 글자 품목명은 따옴표 · 「· 」 바로 뒤이거나 문자열 끝(「닭가슴살 그것'」)일 때만 — 「볼 수 있다」 같은 말을 건드리지 않게.
function oneChar(all, off, run) {
  const prev = all[off - 1] || '', next = all[off + run.length] || '';
  const head = /['"`]/.test(prev) || all.slice(Math.max(0, off - 2), off) === '· ';
  return (head && (next === '' || /['"`\s]/.test(next))) || (prev === ' ' && /['"`]/.test(next));
}
function washSite(src) {
  return src.replace(/[가-힣]+/g, (run, off, all) => {
    const h = hash(run), code = conf.cats[h] || conf.flavors[h];
    if (!code) return run;
    const prev = all[off - 1] || '', next = all[off + run.length] || '';
    if (/[A-Za-z0-9]/.test(prev) || /[A-Za-z0-9]/.test(next)) return run;
    return run.length >= 2 || oneChar(all, off, run) ? code : run;
  });
}
function siteResidue(text) {                                    // [줄 번호, 낱말] — 조사가 붙은 말처럼 자동으로 못 바꾼 것
  const out = [];
  for (const m of text.matchAll(/[가-힣]+/g)) {
    const run = m[0]; let w = null;
    if (run.length === 1) { if (conf.cats[hash(run)] && oneChar(text, m.index, run)) w = run; }
    else for (let i = 0; i < run.length && !w; i++) for (let L = Math.min(maxLen, run.length - i); L >= 2 && !w; L--) {
      if (L === 2 && (i > 0 || run.length > 2 && !/^[이가은는을를의도만와과로에]/.test(run.slice(2)))) continue;   // 두 글자는 낱말 머리 + 조사일 때만
      const x = run.substr(i, L), h = hash(x); if (conf.cats[h] || conf.flavors[h]) w = x;
    }
    if (w) out.push([text.slice(0, m.index).split('\n').length, w]);
  }
  return out;
}

/* 데이터 밖의 글(화면 문구 · 코드) */
function publicText(src) {
  let out = '', p = 0;
  for (const b of blocks(src).sort((a, c) => a.start - c.start)) { out += src.slice(p, b.start) + '\n'; p = b.end; }
  return (out + src.slice(p)).replace(/data:[a-z\/+-]+;base64,[A-Za-z0-9+\/=]+/g, '').replace(/var CAT_ALIAS = \[[\s\S]*?\]\];/, '');
}

/* 검사 — 가린 뒤에도 남은 실명을 찾는다. 범주명 · 맛 이름은 파일 어디서든, 상품명에서 지운 낱말은 데이터 안에서만 본다 */
function residue(text) {
  const hits = new Map();
  const add = (h) => hits.set(h, (hits.get(h) || 0) + 1);
  const scan = (body, withDeny) => {
    for (const m of body.matchAll(/[가-힣]+/g)) {
      const run = m[0];
      for (let i = 0; i < run.length; i++) for (let L = Math.min(maxLen, run.length - i); L >= 3; L--) {
        const w = run.substr(i, L), h = hash(w);
        if ((conf.cats[h] || conf.flavors[h] || (withDeny && deny.has(h))) && !allowed(w)) add(h);
      }
    }
  };
  scan(publicText(text), false);
  for (const b of blocks(text)) scan(JSON.stringify(b.value), true);
  for (const m of text.matchAll(/"([가-힣]{1,2})"/g)) if (conf.cats[hash(m[1])]) add(hash(m[1]));
  return hits;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check'), staged = args.includes('--staged');
  const SITE = conf.site || [];
  let files = args.filter((a) => !a.startsWith('--')).map((a) => a.replace(/\\/g, '/').replace(/^\.\//, ''));
  if (staged) {                                                 // pre-commit 훅: 커밋에 들어가는 파일만
    const { execSync } = require('child_process');
    const names = execSync('git diff --cached --name-only --diff-filter=ACM', { cwd: ROOT }).toString().split('\n').filter(Boolean);
    files = names.filter((n) => DEFAULT_FILES.includes(n) || SITE.includes(n));
    if (!files.length) process.exit(0);
  }
  const list = files.length ? files.map((a) => (SITE.includes(a) ? a : path.basename(a))) : DEFAULT_FILES.concat(SITE);
  const srcs = {};
  for (const n of DEFAULT_FILES) { const p = path.join(ROOT, n); if (fs.existsSync(p)) { srcs[n] = fs.readFileSync(p, 'utf8'); noteUsed(srcs[n]); PUBLIC_TEXT += publicText(srcs[n]); } }
  for (const v of Object.values(conf.cats).concat(Object.values(conf.remap))) usedCat.delete(v);   // 우리가 붙인 코드는 「이미 있음」에서 뺀다
  for (const v of Object.values(conf.flavors)) usedFlavor.delete(v);
  let bad = 0;
  const outs = {}, written = [];
  for (let pass = 0; pass < 2; pass++) for (const n of DEFAULT_FILES) if (srcs[n]) outs[n] = washFile(n, srcs[n]);   // 첫 바퀴에 모은 낱말로 둘째 바퀴의 메모를 가린다
  for (const n of list) {
    const isSite = SITE.includes(n);
    if (isSite) { const p = path.join(ROOT, n); if (!fs.existsSync(p)) continue; srcs[n] = fs.readFileSync(p, 'utf8'); outs[n] = washSite(srcs[n]); }
    if (!srcs[n]) { if (files.length) console.error(`· ${n}: 파일 없음`); continue; }
    const out = outs[n];
    const again = isSite ? washSite(out) : washFile(n, out);
    if (again !== out) { console.error(`✗ ${n}: 두 번 돌리면 또 바뀜 — 규칙 확인 필요`); bad = 1; }
    if (isSite) {
      const left = siteResidue(out);
      if (left.length) {                                        // 공개 저장소의 Actions 기록에는 낱말을 찍지 않는다
        console.error(`✗ ${n}: 품목 · 맛 실명 ${left.length}곳 — 데모와 같은 코드(「F제품」 식)나 일반 표현으로 고친다: `
          + left.map(([ln, w]) => (process.env.CI ? `${ln}줄` : `${ln}줄 「${w}」`)).join(', '));
        bad = 1;
      }
    } else {
      const left = residue(out);
      if (left.size) { console.error(`✗ ${n}: 가린 뒤에도 실명 의심 ${[...left.values()].reduce((a, b) => a + b, 0)}곳 (해시 ${[...left.keys()].slice(0, 5).join(', ')}…)`); bad = 1; }
    }
    if (out === srcs[n]) { console.log(`✓ ${n}: 가릴 것 없음`); continue; }
    if (check) { console.error(`✗ ${n}: 가리지 않은 실명이 있음 — node tools/demo-wash.js 로 가린다`); bad = 1; continue; }
    fs.writeFileSync(path.join(ROOT, n), out); written.push(n);
    console.log(`✓ ${n}: 가림 (${srcs[n].length} → ${out.length} 글자)`);
  }
  if (confDirty && !check) {
    conf.deny = [...deny].sort();
    fs.writeFileSync(CONF_PATH, JSON.stringify(conf, null, 1) + '\n'); written.push('tools/demo-wash.json');
    console.log('· 대응표에 새 낱말 · 코드를 더했다 — tools/demo-wash.json 도 같이 커밋한다');
  } else if (confDirty && check) { console.error('✗ 대응표에 없는 새 품목 · 맛 · 낱말이 있음'); bad = 1; }
  if (staged && written.length) require('child_process').execFileSync('git', ['add', '--'].concat(written), { cwd: ROOT });
  if (staged && bad) console.error('demo-wash: 실명이 남아 커밋을 멈췄다 — 위 줄을 고친 뒤 다시 커밋한다(CLAUDE.md 4 · 5-3)');
  process.exit(bad);
}
if (require.main === module) main();
else module.exports = { washFile, washName, washSite, siteResidue, scrubNote, catCode, residue, hash, conf, noteUsed, publicText, setPublic: (t) => { PUBLIC_TEXT = t; } };
