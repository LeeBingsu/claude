/*
  translate.js - 무료 번역 API 로 단편을 다른 언어로 옮긴다.

  모델에게 번역을 시키면 내용에 따라 정책상 거부당한다. 번역기는 글을 검열하지 않고
  들어온 문장을 그대로 옮기므로, 기본값을 이쪽으로 둔다.
  키가 필요 없고 브라우저에서 바로 부를 수 있는(CORS 가 열린) 곳만 넣었다.
*/

export const ENGINES = {
  libre: {
    label: 'LibreTranslate (무료 · 키 없음)',
    limit: 1800,          // 한 번에 보내는 글자 수(바이트 기준)
    gap: 0,               // 요청 사이 쉬는 시간(ms)
    endpoint: true
  },
  mymemory: {
    label: 'MyMemory (무료 · 키 없음)',
    limit: 450,           // 문서상 한 번에 500바이트까지다
    gap: 400,
    email: true
  },
  gemini: {
    label: '고른 Gemini 모델로 번역',
    model: true
  }
};

export const DEFAULT_ENDPOINT = 'https://translate.disroot.org';

/* 번역기마다 쓰는 언어 코드. 지금은 셋 다 같지만, 늘어나면 여기서 갈린다. */
const CODES = { ko: 'ko', en: 'en', ja: 'ja' };
const code = (c) => CODES[c] || c;

const encoder = new TextEncoder();
export const byteLen = (s) => encoder.encode(s).length;

/* 문장 끝에서 끊는다. 뒤따르는 닫는 따옴표와 공백까지 한 덩어리로 본다. */
const SENTENCE = /[^.!?。！？…]*(?:[.!?。！？…]+["'’”」』)\]]*\s*|$)/gy;

function sentences(line) {
  SENTENCE.lastIndex = 0;
  const out = [];
  while (SENTENCE.lastIndex < line.length) {
    const m = SENTENCE.exec(line);
    if (!m || !m[0]) break;
    out.push(m[0]);
  }
  return out.length ? out : [line];
}

/* 글자 단위로 자른다. 한 문장이 한도보다 길 때만 쓴다. */
function hardCut(piece, limit) {
  const out = [];
  let cur = '';
  for (const ch of piece) {
    if (cur && byteLen(cur + ch) > limit) { out.push(cur); cur = ''; }
    cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/*
  번역해 보낼 조각으로 나눈다.

  { text, sep } 의 목록을 돌려주고, text 를 옮긴 뒤 sep 을 그대로 붙여 이으면
  원문의 줄 모양이 그대로 살아난다(빈 줄은 text 가 '' 이라 번역하지 않는다).
  한도는 바이트 기준이다 — 한글은 글자당 3바이트다.
*/
export function planChunks(text, limit) {
  const src = String(text ?? '');
  if (!src) return [];
  const out = [];
  const lines = src.split('\n');

  lines.forEach((line, i) => {
    const sep = i === lines.length - 1 ? '' : '\n';
    if (!line.trim()) { out.push({ text: line, sep }); return; }
    if (byteLen(line) <= limit) { out.push({ text: line, sep }); return; }

    // 긴 줄은 문장 단위로 모아 담고, 그래도 넘치면 글자 단위로 자른다.
    const pieces = [];
    let cur = '';
    for (const s of sentences(line)) {
      for (const part of byteLen(s) > limit ? hardCut(s, limit) : [s]) {
        if (cur && byteLen(cur + part) > limit) { pieces.push(cur); cur = ''; }
        cur += part;
      }
    }
    if (cur) pieces.push(cur);
    pieces.forEach((p, k) => out.push({ text: p, sep: k === pieces.length - 1 ? sep : '' }));
  });

  return out;
}

/* ------------------------------------------------------------ 번역기별 */

export function libreRequest(endpoint, { text, from, to }) {
  const base = String(endpoint || DEFAULT_ENDPOINT).trim().replace(/\/+$/, '');
  return {
    url: `${base}/translate`,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: code(from), target: code(to), format: 'text' })
    }
  };
}

export function parseLibre(data) {
  if (data && typeof data.translatedText === 'string') return data.translatedText;
  const msg = data?.error || data?.message;
  throw new Error(msg ? `번역 서버가 거절했습니다: ${msg}` : '번역 서버가 예상 밖의 답을 보냈습니다.');
}

export function myMemoryRequest({ text, from, to, email }) {
  const q = new URLSearchParams({ q: text, langpair: `${code(from)}|${code(to)}` });
  if (email && email.trim()) q.set('de', email.trim());
  return { url: `https://api.mymemory.translated.net/get?${q}`, init: { method: 'GET' } };
}

export function parseMyMemory(data) {
  const status = Number(data?.responseStatus);
  const out = data?.responseData?.translatedText;
  const detail = String(data?.responseDetails || '');
  // 한도를 넘기면 200 으로 오면서 본문에 경고를 담아 보낸다.
  if (/MYMEMORY WARNING|QUOTA|LIMIT/i.test(String(out)) || /QUOTA|LIMIT/i.test(detail)) {
    throw new Error('MyMemory 하루 한도를 다 썼습니다. 이메일을 적어 한도를 늘리거나 LibreTranslate 로 바꿔 보세요.');
  }
  if (status && status !== 200) throw new Error(`번역 서버가 거절했습니다(${status}) ${detail}`.trim());
  if (typeof out !== 'string') throw new Error('번역 서버가 예상 밖의 답을 보냈습니다.');
  return out;
}

const BUILD = {
  libre: (o) => libreRequest(o.endpoint, o),
  mymemory: (o) => myMemoryRequest(o)
};
const PARSE = { libre: parseLibre, mymemory: parseMyMemory };

/* 한 조각을 옮긴다. */
async function once(engine, opts) {
  const { url, init } = BUILD[engine](opts);
  const res = await opts.fetch(url, { ...init, signal: opts.signal });
  if (!res.ok) {
    const hint = res.status === 429 ? ' (잠시 뒤 다시 시도하거나 다른 번역기를 골라 보세요)' : '';
    throw new Error(`번역 서버가 ${res.status} 로 답했습니다.${hint}`);
  }
  let data;
  try { data = await res.json(); } catch { throw new Error('번역 서버의 답을 읽지 못했습니다.'); }
  return PARSE[engine](data);
}

const wait = (ms, signal) => new Promise((resolve, reject) => {
  if (!ms) return resolve();
  const t = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('중단', 'AbortError')); }, { once: true });
});

/*
  글 하나를 통째로 옮긴다. 길면 나눠 보내고 원래 줄 모양대로 다시 붙인다.
  onStep(끝난 조각 수, 전체 조각 수) 로 진행을 알린다.
*/
export async function translateText({
  engine = 'libre', text, from, to, endpoint, email,
  fetch: fetchImpl, signal, onStep
} = {}) {
  const spec = ENGINES[engine];
  if (!spec || !BUILD[engine]) throw new Error(`모르는 번역기입니다: ${engine}`);
  const src = String(text ?? '');
  if (!src.trim()) return src;
  if (from === to) return src;

  // 브라우저의 fetch 는 window 에 묶여 있어야 한다. 떼어서 부르면 거부당한다.
  const f = fetchImpl || ((...a) => globalThis.fetch(...a));
  const chunks = planChunks(src, spec.limit);
  const todo = chunks.filter((c) => c.text.trim()).length;
  let done = 0;
  let out = '';

  for (const chunk of chunks) {
    if (signal?.aborted) throw new DOMException('중단', 'AbortError');
    if (!chunk.text.trim()) { out += chunk.text + chunk.sep; continue; }
    if (done && spec.gap) await wait(spec.gap, signal);
    const moved = await once(engine, { text: chunk.text, from, to, endpoint, email, fetch: f, signal });
    // 앞뒤 공백은 원문 것을 쓴다. 번역기가 마음대로 붙이거나 떼는 일이 있다.
    const head = /^\s*/.exec(chunk.text)[0];
    const tail = /\s*$/.exec(chunk.text)[0];
    out += head + String(moved).trim() + tail + chunk.sep;
    onStep?.(++done, todo);
  }
  return out;
}
