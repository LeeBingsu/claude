/*
  comic.js - 만화 컷: 말풍선 데이터, 모델이 준 대사 읽기, 터치한 자리에 놓기, 그리기, 그림으로 굽기.

  좌표는 모두 사진 크기에 대한 비율이다 (x, w 는 가로폭 기준, y, h 는 세로 기준,
  글자 크기 fs 와 테두리 strokeW 는 가로폭 기준). 그래서 화면 미리보기와 원본 크기로 굽는 그림이
  똑같이 보인다. 그리기 말고는 브라우저 없이 노드에서도 돈다.
*/

import { wrapLines } from './poster.js';
import { imagePart } from './prompt.js';

/* ------------------------------------------------------------------ 종류 */

export const SHAPES = {
  oval: '타원',
  round: '둥근 사각',
  cloud: '구름 (생각)',
  burst: '뾰족 (외침)',
  whisper: '점선 (속삭임)',
  box: '네모 (설명 글상자)',
  text: '글자만'
};

export const TYPES = { say: '말', think: '생각', shout: '외침', whisper: '속삭임', narration: '설명' };

/* 글자가 들어갈 안쪽 사각형이 말풍선 크기에서 차지하는 비율 */
const INNER = { oval: 0.72, whisper: 0.72, cloud: 0.66, burst: 0.6, round: 0.9, box: 0.94, text: 1 };
const LINE_H = 1.28;

/*
  글자체 11종. 눈누(noonnu.cc)의 "무료 상용 폰트" 중 만화 대사에 어울리는 것을 골랐고, 쓰임은 눈누 안내를 따랐다.
  fonts/ 에 담은 8종(OFL)은 바로 쓰이고, 재배포가 금지된 KoPub바탕·KoPub돋움·미원체는 담지 못했다.
  이 셋은 공식 사이트에서 받아 "글꼴 파일 올리기"로 올리면(own) 그 이름으로 쓰이고, 올리기 전에는 stack 의 다음 글꼴로 보인다.
  fonts/LICENSES.md 참고.
*/
const KO_SANS = '"Apple SD Gothic Neo", "Malgun Gothic", "Nanum Gothic", sans-serif';
const KO_SERIF = '"Nanum Myeongjo", "Noto Serif KR", "Apple Myungjo", "Batang", serif';
export const FONT_PRESETS = {
  ridi: { group: '본문 대사', label: '리디바탕 · 기본 대사 (강조는 굵게)', stack: `"PN RIDIBatang", "RIDIBatang", ${KO_SERIF}` },
  kopubbatang: {
    group: '본문 대사', label: 'KoPub 바탕 · 본문·모노로그·진지한 내용 (파일 올려야 함)',
    own: { alias: 'KoPub 바탕', match: /kopub.*(batang|바탕)|바탕체/i },
    stack: `"KoPub 바탕", "KoPubWorldBatang", "KoPubWorld바탕체", "KoPubWorld Batang", "PN RIDIBatang", ${KO_SERIF}`
  },
  kopubdotum: {
    group: '본문 대사', label: 'KoPub 돋움 · 본문·네 컷 만화 등 캐주얼 (파일 올려야 함)',
    own: { alias: 'KoPub 돋움', match: /kopub.*(dotum|돋움)|돋움체/i },
    stack: `"KoPub 돋움", "KoPubWorldDotum", "KoPubWorld돋움체", "KoPubWorld Dotum", "PN NanumSquare Neo", ${KO_SANS}`
  },
  dangdang: { group: '독백·감성', label: '카페24 당당해 · 모노로그', stack: `"PN Cafe24 Dangdanghae", "Cafe24 Dangdanghae", ${KO_SANS}` },
  simple: { group: '독백·감성', label: '카페24 심플해 · 꿈꾸는 느낌의 대사', stack: `"PN Cafe24 Simplehae", "Cafe24 Simplehae", ${KO_SANS}` },
  surround: { group: '독백·감성', label: '카페24 써라운드 · 장난치거나 귀여운 대사', stack: `"PN Cafe24 Ssurround", "Cafe24 Ssurround", ${KO_SANS}` },
  dohyeon: { group: '강조·외침', label: '배민 도현 · 소리칠 때 (굵게·기울임)', stack: `"PN BM Dohyeon", "BM DoHyeon", "BMDOHYEON", ${KO_SANS}` },
  miwon: {
    group: '강조·외침', label: '미원체 · 매우 진지하거나 무서운 이야기 (파일 올려야 함)',
    own: { alias: '미원체', match: /miwon|미원/i },
    stack: `"미원체", "Miwon", "PN NanumSquare Neo", ${KO_SANS}`, weight: 900, boldWeight: 900
  },
  squareneo: { group: '강조·외침', label: '나눔스퀘어 네오 · 안내판·설명', stack: `"PN NanumSquare Neo", "NanumSquare Neo", ${KO_SANS}` },
  squareheavy: { group: '강조·외침', label: '나눔스퀘어 네오 Heavy · 강조', stack: `"PN NanumSquare Neo", "NanumSquare Neo", ${KO_SANS}`, weight: 900, boldWeight: 900 },
  restart: { group: '속닥이는 대사', label: '나눔손글씨 다시 시작해', stack: `"PN Nanum Restart", "Nanum DaSiSiJagHae", cursive, ${KO_SANS}` },
  hippie: { group: '속닥이는 대사', label: '나눔손글씨 바른히피', stack: `"PN Nanum BareunHippie", "Nanum BaReunHiPi", cursive, ${KO_SANS}` }
};

/* 예전에 저장된 말풍선이 쓰던 글꼴 이름 → 가장 가까운 새 글꼴. 불러올 때 한 번 바꿔 준다. */
const LEGACY_FONTS = {
  gothic: 'ridi', dodum: 'kopubdotum', serif: 'kopubbatang', recall: 'kopubbatang', round: 'surround',
  black: 'squareheavy', dohyeon: 'dohyeon', mono: 'ridi',
  hand: 'restart', gaegu: 'hippie', himelody: 'hippie', poorstory: 'restart', yeonsung: 'restart',
  singleday: 'hippie', gamja: 'hippie', dokdo: 'restart'
};
export const presetKey = (font) => {
  const k = String(font ?? '');
  return FONT_PRESETS[k] ? k : LEGACY_FONTS[k] || k;
};

/* 올린 파일 이름이 담지 못한 글꼴이면 그 글꼴로 등록할 이름을 알려 준다. */
export function ownFontFor(fileName) {
  for (const [key, p] of Object.entries(FONT_PRESETS)) {
    if (p.own && p.own.match.test(String(fileName))) return { key, alias: p.own.alias };
  }
  return null;
}

export const DEFAULT_FONT = 'ridi';

/*
  글꼴 세트 — 말의 종류마다 어울리는 글꼴. 눈누에 적힌 쓰임을 그대로 옮겼다.
  기본: 대사=리디바탕, 생각=당당해(모노로그), 외침=도현, 속삭임=다시 시작해, 설명=KoPub 바탕
*/
export const FONT_SETS = {
  basic: { label: '기본 (대사 리디바탕 · 독백 당당해 · 외침 도현)', say: 'ridi', think: 'dangdang', shout: 'dohyeon', whisper: 'restart', narration: 'kopubbatang' },
  casual: { label: '캐주얼 네 컷 (KoPub 돋움 · 써라운드)', say: 'kopubdotum', think: 'simple', shout: 'dohyeon', whisper: 'hippie', narration: 'squareneo' },
  dreamy: { label: '꿈꾸는·귀여운 (심플해 · 써라운드)', say: 'surround', think: 'simple', shout: 'dohyeon', whisper: 'hippie', narration: 'simple' },
  serious: { label: '진지·공포 (KoPub 바탕 · 미원체)', say: 'kopubbatang', think: 'dangdang', shout: 'miwon', whisper: 'restart', narration: 'miwon' }
};

export function fontSetFor(setKey, type) {
  return (FONT_SETS[setKey] || FONT_SETS.basic)[type] || DEFAULT_FONT;
}

export function resolveFont(font) {
  const key = presetKey(font || DEFAULT_FONT);
  if (FONT_PRESETS[key]) return FONT_PRESETS[key].stack;
  const clean = key.replace(/["'\;{}<>]/g, '').trim().slice(0, 60) || DEFAULT_FONT;
  return `"${clean}", "Apple SD Gothic Neo", "PN RIDIBatang", "Malgun Gothic", sans-serif`;
}

/* 굵게를 켰을 때와 아닐 때의 글자 굵기. 글꼴마다 실제로 있는 굵기를 쓴다. */
export function fontWeight(b) {
  const p = FONT_PRESETS[presetKey(b.font)];
  return b.bold ? p?.boldWeight || 700 : p?.weight || 400;
}

export function fontCss(b, fsPx) {
  return `${b.italic ? 'italic ' : ''}${fontWeight(b)} ${Math.max(1, fsPx)}px ${resolveFont(b.font)}`;
}

/* ------------------------------------------------------------ 말풍선 데이터 */

const DEFAULT_STYLE = {
  fill: '#ffffff', fillAlpha: 1, stroke: '#111111', strokeW: 0.0035, color: '#111111',
  font: DEFAULT_FONT, fs: 0.04, bold: false, italic: false, align: 'center', autoFit: true
};

/* 말의 종류마다 처음 모양이 다르다. 나중에 화면에서 얼마든지 바꿀 수 있다. */
const TYPE_STYLE = {
  say: { shape: 'oval' },
  think: { shape: 'cloud' },
  shout: { shape: 'burst', bold: true, italic: true, fsMul: 1.15 },   // 눈누 안내: 소리칠 때는 Bold/Italic 효과를 준다
  whisper: { shape: 'whisper', fsMul: 0.85 },
  narration: { shape: 'box', fill: '#fff6d6', align: 'left', tail: false }
};

export const STYLE_KEYS = ['shape', 'fill', 'fillAlpha', 'stroke', 'strokeW', 'color', 'font', 'fs', 'bold', 'italic', 'align', 'autoFit'];

const clampNum = (v, lo, hi, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
const colorOr = (v, d) => (typeof v === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim()) ? v.trim() : d);

export function newBubbleId() {
  return `b${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

/* 저장된 것·불러온 것·화면에서 만든 것 모두 이 함수를 거쳐 안전한 값만 남긴다. */
export function normalizeBubble(raw = {}) {
  const shape = SHAPES[raw.shape] ? raw.shape : 'oval';
  const type = TYPES[raw.type] ? raw.type : 'say';
  const tail = raw.tail && typeof raw.tail === 'object' ? raw.tail : {};
  const x = clampNum(raw.x, -0.5, 1.5, 0.05);
  const y = clampNum(raw.y, -0.5, 1.5, 0.05);
  const w = clampNum(raw.w, 0.04, 1.5, 0.3);
  const h = clampNum(raw.h, 0.03, 1.5, 0.16);
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newBubbleId(),
    type,
    shape,
    text: typeof raw.text === 'string' ? raw.text : '',
    speaker: typeof raw.speaker === 'string' ? raw.speaker.slice(0, 40) : '',
    x, y, w, h,
    tail: {
      on: typeof tail.on === 'boolean' ? tail.on : shape !== 'box' && shape !== 'text',
      x: clampNum(tail.x, -0.5, 1.5, x + w / 2),
      y: clampNum(tail.y, -0.5, 1.5, y + h + 0.08)
    },
    placed: raw.placed !== false,             // false: 대사만 있고 아직 사진 위에 놓지 않은 말풍선
    fill: colorOr(raw.fill, DEFAULT_STYLE.fill),
    fillAlpha: clampNum(raw.fillAlpha, 0, 1, DEFAULT_STYLE.fillAlpha),
    stroke: colorOr(raw.stroke, DEFAULT_STYLE.stroke),
    strokeW: clampNum(raw.strokeW, 0, 0.03, DEFAULT_STYLE.strokeW),
    color: colorOr(raw.color, DEFAULT_STYLE.color),
    font: typeof raw.font === 'string' && raw.font.trim() ? presetKey(raw.font.trim().slice(0, 60)) : DEFAULT_STYLE.font,
    fs: clampNum(raw.fs, 0.008, 0.2, DEFAULT_STYLE.fs),
    bold: Boolean(raw.bold),
    italic: Boolean(raw.italic),
    align: raw.align === 'left' ? 'left' : 'center',
    autoFit: raw.autoFit === undefined ? DEFAULT_STYLE.autoFit : Boolean(raw.autoFit)
  };
}

/* 말의 종류에 맞는 처음 모양으로 새 말풍선을 만든다. */
export function makeBubble({ type = 'say', text = '', speaker = '' } = {}, style = {}) {
  const t = TYPES[type] ? type : 'say';
  const ts = TYPE_STYLE[t];
  const { fontSet, ...own } = style;
  const base = { ...DEFAULT_STYLE, ...ts, font: fontSetFor(fontSet, t), ...own };
  base.fs = (own.fs ?? DEFAULT_STYLE.fs) * (ts.fsMul || 1);
  return normalizeBubble({
    ...base, type: t, text, speaker,
    tail: { on: ts.tail !== false && base.shape !== 'box' && base.shape !== 'text' }
  });
}

/* 한 컷의 저장 모양. 쓰다 만 것(busy)은 저장하지 않는다. */
export function normalizeComic(items) {
  const out = {};
  for (const [id, item] of Object.entries(items || {})) {
    if (!item || typeof item !== 'object') continue;
    const bubbles = (Array.isArray(item.bubbles) ? item.bubbles : []).map(normalizeBubble);
    const scenario = typeof item.scenario === 'string' ? item.scenario : '';
    if (!bubbles.length && !scenario.trim() && item.status !== 'error') continue;
    out[id] = {
      scenario,
      bubbles,
      status: bubbles.length || item.status === 'done' ? 'done' : item.status === 'error' ? 'error' : 'empty',
      error: item.status === 'error' && !bubbles.length ? item.error || '' : ''
    };
  }
  return out;
}

/* 이미 만든 말풍선들의 글꼴을 세트에 맞춘다 (외침은 기울임도 함께). */
export function applyFontSet(list, setKey) {
  for (const b of list) {
    b.font = fontSetFor(setKey, b.type);
    b.italic = b.type === 'shout';
    b.bold = b.type === 'shout';
  }
  return list;
}

/*
  캔버스는 CSS 글꼴을 저절로 불러오지 않는다. 그리기 전에 쓰는 글꼴을 모두 불러와야 한다.
  글꼴이 없거나 못 불러와도 던지지 않는다(그 경우 대체 글꼴로 그려진다).
*/
export async function loadFonts(list, doc = globalThis.document) {
  if (!doc?.fonts?.load) return;
  const seen = new Set();
  const jobs = [];
  for (const b of list) {
    const css = `${b.italic ? 'italic ' : ''}${fontWeight(b)} 32px ${resolveFont(b.font)}`;
    if (seen.has(css)) continue;
    seen.add(css);
    jobs.push(doc.fonts.load(css, b.text || '가').catch(() => {}));
  }
  await Promise.all(jobs);
}

/* 어떤 글꼴들이 쓰이는지 나타내는 표. 바뀌면 다시 불러온다. */
export function fontKey(list) {
  return [...new Set(list.map((b) => `${presetKey(b.font)}|${b.bold ? 1 : 0}|${b.italic ? 1 : 0}`))].sort().join(',');
}

/* 이 컷의 말풍선 모양을 다른 말풍선에 그대로 옮긴다 (글·위치·크기는 그대로 둔다). */
export function copyStyle(from, to) {
  const shapeChanged = to.shape !== from.shape;
  for (const k of STYLE_KEYS) to[k] = from[k];
  if (shapeChanged && (from.shape === 'box' || from.shape === 'text')) to.tail.on = false;
  return to;
}

/* ------------------------------------------------------------- 대사 읽기 */

const TYPE_ALIAS = [
  [/think|생각|속마음|독백/i, 'think'],
  [/shout|scream|yell|외침|소리|비명/i, 'shout'],
  [/whisper|속삭/i, 'whisper'],
  [/narrat|caption|설명|나레이션|해설|지문/i, 'narration']
];

function typeOf(v) {
  const s = String(v || '').trim();
  if (TYPES[s]) return s;
  for (const [re, t] of TYPE_ALIAS) if (re.test(s)) return t;
  return 'say';
}

function cleanText(s) {
  return String(s ?? '').replace(/^["'“”‘’「」『』]+|["'“”‘’「」『』]+$/g, '').replace(/\r/g, '').trim();
}

/*
  모델 답에서 대사 목록을 뽑는다. JSON 배열이 정상이고, 코드 울타리나 앞뒤 군말이 붙어도 읽는다.
  JSON 이 아니면 "이름: 대사" 줄로 읽어 본다.
  돌려주는 것: [{ speaker, type, text }]
*/
export function parseDialogue(text, max = 8) {
  const raw = String(text || '').replace(/```(?:json)?/gi, '').trim();
  let list = null;
  const a = raw.indexOf('[');
  const z = raw.lastIndexOf(']');
  if (a !== -1 && z > a) {
    try { list = JSON.parse(raw.slice(a, z + 1)); } catch { list = null; }
  }
  if (!list) {
    const o = raw.indexOf('{');
    const e = raw.lastIndexOf('}');
    if (o !== -1 && e > o) {
      try {
        const obj = JSON.parse(raw.slice(o, e + 1));
        list = obj.bubbles || obj.dialogue || obj.lines || null;
      } catch { list = null; }
    }
  }

  let out = [];
  if (Array.isArray(list)) {
    out = list.map((it) => (typeof it === 'string'
      ? { speaker: '', type: 'say', text: cleanText(it) }
      : {
        speaker: String(it?.speaker ?? it?.name ?? '').trim().slice(0, 40),
        type: typeOf(it?.type),
        text: cleanText(it?.text ?? it?.line ?? it?.dialogue)
      }));
  } else {
    // "이름 (생각): 대사" 줄 모양으로 읽는다
    const re = /^\s*(?:\d+[.)]\s*)?([^:：()（）]{1,20}?)\s*(?:[(（]([^)）]*)[)）])?\s*[:：]\s*(.+)$/;
    for (const line of raw.split('\n')) {
      const m = re.exec(line);
      if (m) out.push({ speaker: m[1].trim(), type: typeOf(m[2]), text: cleanText(m[3]) });
    }
  }
  return out.filter((d) => d.text).slice(0, Math.max(1, max));
}

/* ----------------------------------------------------------------- 크기·배치 */

/*
  글자 수에 맞춰 말풍선 크기를 정한다. measureFor(fontCss) 는 글 폭을 재는 함수를 돌려준다.
  너무 길쭉해지지 않게, 가로를 조금씩 넓혀 가며 세로가 가로에 비해 낮아질 때까지 본다.
*/
export function sizeBubble(b, measureFor, W, H) {
  const k = INNER[b.shape] ?? 0.72;
  const fsPx = b.fs * W;
  const lh = fsPx * LINE_H;
  const measure = measureFor(fontCss(b, fsPx));
  const text = b.text || ' ';
  let best = { innerW: fsPx * 3, innerH: lh };
  for (let cols = 3; cols <= 24; cols++) {
    const innerW = cols * fsPx;
    const lines = wrapLines(measure, text, innerW).length;
    best = { innerW, innerH: lines * lh };
    if (best.innerH <= innerW * 0.85 || innerW / k > W * 0.62) break;
  }
  const pad = fsPx * 0.7;
  b.w = Math.min(0.9, (best.innerW / k + pad) / W);
  b.h = Math.min(0.7, (best.innerH / k + pad) / H);
  return b;
}

/* 기본 꼬리: 말풍선 아래로 짧게. 화자 쪽으로는 사용자가 끌어서 정한다. */
export function defaultTail(b) {
  return { on: b.shape !== 'box' && b.shape !== 'text' && b.type !== 'narration', x: b.x + b.w / 2, y: Math.min(1.02, b.y + b.h + 0.08) };
}

/*
  (nx, ny) 를 터치한 자리에 말풍선을 놓는다. 터치한 곳이 말풍선의 가운데가 되고, 사진 밖으로 나가지 않는다.
  자리는 앱이 정하지 않는다 — 언제나 사용자가 사진에서 직접 고른다.
*/
export function placeBubble(b, nx, ny, { margin = 0.01 } = {}) {
  b.x = Math.min(1 - b.w - margin, Math.max(margin, nx - b.w / 2));
  b.y = Math.min(1 - b.h - margin, Math.max(margin, ny - b.h / 2));
  b.placed = true;
  b.tail = defaultTail(b);
  return b;
}

/* 아직 놓지 않은 말풍선 중 다음 것. preferId 가 아직 안 놓였으면 그것을 먼저 준다. */
export function nextUnplaced(list, preferId = '') {
  return list.find((b) => b.id === preferId && !b.placed) || list.find((b) => !b.placed) || null;
}

/*
  모델이 준 대사를 말풍선들로 만든다: 만들고 글에 맞게 크기를 잡는다.
  자리는 잡지 않는다. 모두 "아직 안 놓은" 상태로 두고, 사용자가 사진을 터치해 하나씩 놓는다.
*/
export function bubblesFromDialogue(dialogue, { measureFor, W, H, style = {} }) {
  // 손으로 정해 둔 색·글자체는 다시 만들어도 이어 간다. 설명 글상자는 자기 바탕색을 지키고,
  // 모양(shape)은 보통의 말풍선에만 이어 준다 — 외침·생각은 종류에 맞는 모양이 있다.
  const { fill, shape, ...rest } = style;
  const styleFor = (type) => {
    if (type === 'narration') return rest;
    if (type === 'say') return style;
    return fill === undefined ? rest : { ...rest, fill };
  };
  const bubbles = dialogue.map((d) => makeBubble(d, styleFor(d.type)));
  bubbles.forEach((b) => {
    sizeBubble(b, measureFor, W, H);
    b.x = 0.05;
    b.y = 0.05;
    b.placed = false;
    b.tail = defaultTail(b);
  });
  return bubbles;
}

/* ------------------------------------------------------------ 눌러 잡기 */

const inBubble = (b, nx, ny) => {
  if (b.shape === 'box' || b.shape === 'round' || b.shape === 'text') {
    return nx >= b.x && nx <= b.x + b.w && ny >= b.y && ny <= b.y + b.h;
  }
  const dx = (nx - (b.x + b.w / 2)) / (b.w / 2);
  const dy = (ny - (b.y + b.h / 2)) / (b.h / 2);
  return dx * dx + dy * dy <= 1.08;
};

/*
  (nx, ny) 는 사진 크기에 대한 비율. 뽑힌 말풍선의 꼬리 끝·오른쪽 아래 모서리를 먼저 본다.
  돌려주는 것: { id, part: 'tail' | 'resize' | 'body' } 또는 null
*/
export function hitTest(list, nx, ny, W, H, selectedId, tolPx = 14) {
  const px = nx * W;
  const py = ny * H;
  const sel = list.find((b) => b.id === selectedId && b.placed);
  if (sel) {
    if (sel.tail.on && Math.hypot(px - sel.tail.x * W, py - sel.tail.y * H) <= tolPx) return { id: sel.id, part: 'tail' };
    if (Math.hypot(px - (sel.x + sel.w) * W, py - (sel.y + sel.h) * H) <= tolPx) return { id: sel.id, part: 'resize' };
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].placed && inBubble(list[i], nx, ny)) return { id: list[i].id, part: 'body' };
  }
  return null;
}

/* ----------------------------------------------------------------- 꼬리 */

/*
  말풍선 꼬리의 모양. 끝이 풍선 안에 있으면 그리지 않는다.
  구름은 점점 작아지는 동그라미 세 개, 나머지는 곡선 삼각형이다.
*/
export function tailGeometry(b, W, H) {
  if (!b.tail.on || b.shape === 'box' || b.shape === 'text') return null;
  const cx = (b.x + b.w / 2) * W;
  const cy = (b.y + b.h / 2) * H;
  const rx = (b.w * W) / 2;
  const ry = (b.h * H) / 2;
  const tx = b.tail.x * W;
  const ty = b.tail.y * H;
  const nx = (tx - cx) / rx;
  const ny = (ty - cy) / ry;
  if (Math.hypot(nx, ny) < 1.08) return null;
  const th = Math.atan2(ny, nx);

  if (b.shape === 'cloud') {
    const sx = cx + rx * 0.96 * Math.cos(th);
    const sy = cy + ry * 0.96 * Math.sin(th);
    const r0 = Math.min(rx, ry) * 0.2;
    const circles = [0.2, 0.55, 0.92].map((t, i) => ({
      x: sx + (tx - sx) * t, y: sy + (ty - sy) * t, r: Math.max(2, r0 * (1 - i * 0.3))
    }));
    return { kind: 'dots', circles };
  }
  // 꼬리 밑변은 풍선 깊숙이 둔다. 뾰족한 모양은 가장자리가 들쭉날쭉해서, 얕게 두면 홈에 밑변이 드러난다.
  const d = 0.42;
  const at = (a) => ({ x: cx + rx * 0.55 * Math.cos(a), y: cy + ry * 0.55 * Math.sin(a) });
  const base1 = at(th - d);
  const base2 = at(th + d);
  const len = Math.hypot(tx - (base1.x + base2.x) / 2, ty - (base1.y + base2.y) / 2);
  const bend = len * 0.14;
  const dirx = (base2.x - base1.x);
  const diry = (base2.y - base1.y);
  const dl = Math.hypot(dirx, diry) || 1;
  const px = (-diry / dl) * bend;
  const py = (dirx / dl) * bend;
  return {
    kind: 'wedge',
    base1, base2, tip: { x: tx, y: ty },
    c1: { x: (base1.x + tx) / 2 + px, y: (base1.y + ty) / 2 + py },
    c2: { x: (base2.x + tx) / 2 + px, y: (base2.y + ty) / 2 + py }
  };
}

/* ----------------------------------------------------------------- 글자 */

/*
  말풍선 안에 글이 놓이는 모양. autoFit 이면 넘칠 때 글자를 조금씩 줄여 맞춘다(35% 까지).
  measureFor(fontCss) → (문자열) → 폭(px)
*/
export function layoutText(b, W, H, measureFor) {
  const k = INNER[b.shape] ?? 0.72;
  const innerW = b.w * W * k;
  const innerH = b.h * H * k;
  const cx = (b.x + b.w / 2) * W;
  const cy = (b.y + b.h / 2) * H;
  let fs = b.fs * W;
  const minFs = fs * 0.35;
  let lines = [];
  let lh = fs * LINE_H;
  for (let i = 0; i < 30; i++) {
    lines = wrapLines(measureFor(fontCss(b, fs)), b.text || '', innerW);
    lh = fs * LINE_H;
    if (!b.autoFit || lines.length * lh <= innerH || fs <= minFs) break;
    fs = Math.max(minFs, fs * 0.94);
  }
  return { lines, fs, lh, cx, cy, innerW, innerH, overflow: lines.length * lh > innerH * 1.02 };
}

/* ----------------------------------------------------------------- 그리기 */

function bodyPath(shape, x, y, w, h) {
  const p = new Path2D();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  if (shape === 'text') return p;
  if (shape === 'box') { p.rect(x, y, w, h); return p; }
  if (shape === 'round') {
    const r = Math.min(w, h) * 0.22;
    p.moveTo(x + r, y);
    p.arcTo(x + w, y, x + w, y + h, r);
    p.arcTo(x + w, y + h, x, y + h, r);
    p.arcTo(x, y + h, x, y, r);
    p.arcTo(x, y, x + w, y, r);
    p.closePath();
    return p;
  }
  if (shape === 'cloud') {
    const n = Math.min(20, Math.max(9, Math.round((Math.PI * (rx + ry)) / (Math.min(rx, ry) * 0.55))));
    const pt = (a, k) => [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)];
    p.moveTo(...pt(0, 0.86));
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      const c = pt((a0 + a1) / 2, 1.25);
      const e = pt(a1, 0.86);
      p.quadraticCurveTo(c[0], c[1], e[0], e[1]);
    }
    p.closePath();
    return p;
  }
  if (shape === 'burst') {
    const n = 14;
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + ((i * 37) % 7 - 3) * 0.012;
      const k = i % 2 === 0 ? 1 : 0.74 - ((i * 13) % 5) * 0.012;
      const px = cx + rx * k * Math.cos(a);
      const py = cy + ry * k * Math.sin(a);
      if (i === 0) p.moveTo(px, py); else p.lineTo(px, py);
    }
    p.closePath();
    return p;
  }
  p.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  return p;
}

function defaultCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

/*
  말풍선 하나를 그린다. 풍선과 꼬리를 하나로 합쳐 테두리를 이음매 없이 만들고,
  반투명 채우기도 겹쳐 진해지지 않도록 따로 그린 뒤 사진 위에 얹는다.
*/
export function drawBubble(ctx, b, W, H, env = {}) {
  const createCanvas = env.createCanvas || defaultCanvas;
  const bx = b.x * W;
  const by = b.y * H;
  const bw = b.w * W;
  const bh = b.h * H;
  const sw = b.strokeW * W;
  const tail = tailGeometry(b, W, H);

  // 놓일 자리: 풍선 + 꼬리 끝 + 테두리 여유
  let minX = bx;
  let minY = by;
  let maxX = bx + bw;
  let maxY = by + bh;
  if (tail?.kind === 'wedge') {
    for (const q of [tail.tip, tail.c1, tail.c2]) {
      minX = Math.min(minX, q.x); maxX = Math.max(maxX, q.x);
      minY = Math.min(minY, q.y); maxY = Math.max(maxY, q.y);
    }
  } else if (tail?.kind === 'dots') {
    for (const c of tail.circles) {
      minX = Math.min(minX, c.x - c.r); maxX = Math.max(maxX, c.x + c.r);
      minY = Math.min(minY, c.y - c.r); maxY = Math.max(maxY, c.y + c.r);
    }
  }
  const m = sw * 2 + bw * 0.12 + 6;                    // 뾰족·구름이 살짝 튀어나오는 것까지
  minX -= m; minY -= m; maxX += m; maxY += m;

  const off = createCanvas(maxX - minX, maxY - minY);
  const t = off.getContext('2d');
  t.translate(-minX, -minY);
  t.lineJoin = 'round';
  t.lineCap = 'round';

  const all = new Path2D();
  all.addPath(bodyPath(b.shape, bx, by, bw, bh));
  if (tail?.kind === 'wedge') {
    const w = new Path2D();
    w.moveTo(tail.base1.x, tail.base1.y);
    w.quadraticCurveTo(tail.c1.x, tail.c1.y, tail.tip.x, tail.tip.y);
    w.quadraticCurveTo(tail.c2.x, tail.c2.y, tail.base2.x, tail.base2.y);
    w.closePath();
    all.addPath(w);
  } else if (tail?.kind === 'dots') {
    for (const c of tail.circles) {
      const d = new Path2D();
      d.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      all.addPath(d);
    }
  }

  if (b.shape !== 'text') {
    if (sw > 0) {
      // 테두리 굵기의 두 배로 긋고 안쪽 절반을 지우면, 바깥 절반만 남아 하나로 이어진 테두리가 된다.
      t.lineWidth = sw * 2;
      t.strokeStyle = b.stroke;
      if (b.shape === 'whisper') t.setLineDash([sw * 3.2, sw * 2.4]);
      t.stroke(all);
      t.setLineDash([]);
      t.globalCompositeOperation = 'destination-out';
      t.fill(all);
      t.globalCompositeOperation = 'source-over';
    }
    t.globalAlpha = b.fillAlpha;
    t.fillStyle = b.fill;
    t.fill(all);
    t.globalAlpha = 1;
  }

  const measureFor = (font) => { t.font = font; return (s) => t.measureText(s).width; };
  const L = layoutText(b, W, H, measureFor);
  t.font = fontCss(b, L.fs);
  t.textBaseline = 'middle';
  t.textAlign = b.align === 'left' ? 'left' : 'center';
  const x = b.align === 'left' ? L.cx - L.innerW / 2 : L.cx;
  const top = L.cy - (L.lines.length * L.lh) / 2 + L.lh / 2;
  L.lines.forEach((line, i) => {
    if (!line) return;
    if (b.shape === 'text' && sw > 0) {
      t.lineWidth = sw * 2.4;
      t.strokeStyle = b.stroke;
      t.strokeText(line, x, top + i * L.lh);
    }
    t.fillStyle = b.color;
    t.fillText(line, x, top + i * L.lh);
  });

  ctx.drawImage(off, minX, minY);
  return L;
}

export function drawBubbles(ctx, list, W, H, env) {
  for (const b of list) if (b.placed) drawBubble(ctx, b, W, H, env);   // 아직 안 놓은 것은 그림에 넣지 않는다
}

/* 고른 말풍선의 테두리·잡는 점. 미리보기에만 그린다. */
export function drawHandles(ctx, b, W, H) {
  const u = Math.max(1, W / 900);
  const accent = '#7c3aed';
  ctx.save();
  ctx.lineWidth = 2 * u;
  ctx.strokeStyle = accent;
  ctx.setLineDash([6 * u, 4 * u]);
  ctx.strokeRect(b.x * W, b.y * H, b.w * W, b.h * H);
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff';
  const dot = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); };
  dot((b.x + b.w) * W, (b.y + b.h) * H, 7 * u);
  if (b.tail.on) {
    ctx.fillStyle = accent;
    dot(b.tail.x * W, b.tail.y * H, 7 * u);
  }
  ctx.restore();
}

/* ------------------------------------------------------------ 그림으로 굽기 */

async function bitmapOf(image) {
  try {
    return await createImageBitmap(image.original || image.blob);
  } catch (err) {
    if (!image.original) throw err;
    return createImageBitmap(image.blob);            // 원본을 못 읽으면 줄인 사진으로
  }
}

/* 사진 한 컷에 말풍선을 얹어 캔버스로 돌려준다. width 를 주면 그 가로폭에 맞춘다. */
export async function paintPanel(image, bubbles, { width = 0, maxWidth = 4096 } = {}) {
  await loadFonts(bubbles);
  const bmp = await bitmapOf(image);
  const longest = Math.max(bmp.width, bmp.height);
  let scale = Math.min(1, maxWidth / longest);
  if (width) scale = width / bmp.width;
  const W = Math.max(1, Math.round(bmp.width * scale));
  const H = Math.max(1, Math.round(bmp.height * scale));
  const canvas = defaultCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bmp, 0, 0, W, H);
  bmp.close?.();
  drawBubbles(ctx, bubbles, W, H);
  return canvas;
}

const toBlob = (canvas, format, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('그림을 만들지 못했습니다.'))), format, quality);
});

export async function renderComic(image, bubbles, { format = 'image/jpeg', quality = 0.92, maxWidth = 4096 } = {}) {
  return toBlob(await paintPanel(image, bubbles, { maxWidth }), format, quality);
}

/* 모든 컷을 세로로 이어 한 장으로 (웹툰 모양). */
export async function renderComicStrip(panels, { width = 1080, gap = 0, background = '#ffffff', format = 'image/jpeg', quality = 0.9 } = {}) {
  const canvases = [];
  for (const p of panels) canvases.push(await paintPanel(p.image, p.bubbles, { width }));
  const total = canvases.reduce((a, c) => a + c.height, 0) + gap * Math.max(0, canvases.length - 1);
  if (total > 32000) throw new Error('컷이 너무 많아 한 장으로 잇기에는 세로가 너무 깁니다. 컷을 나눠 저장해 주세요.');
  const out = defaultCanvas(width, total);
  const ctx = out.getContext('2d');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, total);
  let y = 0;
  for (const c of canvases) { ctx.drawImage(c, 0, y); y += c.height + gap; }
  return toBlob(out, format, quality);
}

/* ------------------------------------------------------------------ 글 뽑기 */

/* 컷마다 시나리오와 대사를 글로 뽑는다. */
export function comicPlainText(images, items) {
  const out = [];
  images.forEach((img, i) => {
    const item = items[img.id];
    out.push(`[컷 ${i + 1} — ${img.name}]`);
    if (item?.scenario?.trim()) out.push(`시나리오: ${item.scenario.trim()}`);
    for (const b of item?.bubbles || []) {
      const who = b.speaker ? `${b.speaker}${b.type !== 'say' ? ` (${TYPES[b.type]})` : ''}` : TYPES[b.type];
      out.push(`${who}: ${b.text.replace(/\n/g, ' ')}`);
    }
    out.push('');
  });
  return out.join('\n').trim();
}

/* ------------------------------------------------------------------ 프롬프트 */

export function buildComicSystem(opts) {
  const lang = opts.comicLangName || '한국어';
  const lines = [
    '너는 만화 대사 작가다. 컷 한 장(사진)과 작가가 적은 짧은 시나리오를 받아, 그 컷의 말풍선에 들어갈 글을 쓴다.',
    '',
    '원칙:',
    '- 시나리오가 정한 사건·관계를 벗어나지 말고, 사진에 보이는 인물·표정·자세·분위기를 근거로 삼아라.',
    '- 사진을 설명하지 마라. "사진 속", "이미지" 같은 말을 쓰지 마라. 그 인물이 실제로 할 법한 말을 써라.',
    '- 말풍선 하나에는 한두 문장만 넣는다. 길게 늘어놓지 마라.',
    '- 앞선 컷의 대사가 주어지면 이름·말투·관계를 그대로 이어라. 같은 인물은 같은 이름으로 적어라.',
    '- 마크다운을 쓰지 마라.',
    `- 대사는 ${lang}로 쓴다.`
  ];
  if (opts.comicInstructions && opts.comicInstructions.trim()) {
    lines.push('', '사용자 맞춤 지시사항 (말투·분량·인물 성격은 이쪽이 정한다):', opts.comicInstructions.trim());
  }
  lines.push(
    '',
    '출력 형식 (앱이 읽으므로 반드시 지킨다): 설명 없이 JSON 배열 하나만 출력한다.',
    '[{"speaker":"말하는 인물 이름","type":"say","text":"말풍선에 들어갈 글"}, …]',
    '- type 은 say(말), think(속마음), shout(외침), whisper(속삭임), narration(설명 글상자) 중 하나.',
    '- 배열의 순서가 읽는 순서다. 말풍선의 위치는 작가가 직접 정하므로 위치는 적지 않는다.'
  );
  return lines.join('\n');
}

/*
  history: 앞선 컷들 [{ index, scenario, lines: ['이름: 대사', …] }]
*/
export function buildComicParts({ image, index, total, scenario, cast, history = [], max = 4, retryNote = '' }) {
  const parts = [{ text: `[컷 ${index + 1}/${total} — 파일명 ${image.name}]` }, imagePart(image)];
  const task = [];
  task.push(`이 컷의 시나리오:\n${scenario && scenario.trim() ? scenario.trim() : '(적어 둔 시나리오가 없다. 사진만 보고 자연스러운 한두 마디를 붙여라.)'}`);
  if (cast && cast.trim()) task.push(`등장인물:\n${cast.trim()}`);
  if (history.length) {
    const h = history.map((p) => [`[컷 ${p.index + 1}] ${p.scenario || '(시나리오 없음)'}`, ...p.lines.map((l) => `  ${l}`)].join('\n'));
    task.push(`앞선 컷들의 시나리오와 대사 (이어 쓰기 참고용):\n${h.join('\n')}`);
  }
  task.push(`말풍선은 최대 ${max}개까지 쓴다. 이 컷에 필요한 만큼만 쓰고, 억지로 채우지 마라.`);
  if (retryNote) task.push(retryNote);
  parts.push({ text: task.join('\n\n') });
  return parts;
}
