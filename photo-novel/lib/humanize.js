/*
  humanize.js - imnotai.kr 의 "AI 티 빼기" 윤문을 불러 쓴다.

  imnotai.kr 은 자기 웹앱만 쓰라고 만든 API 라서 CORS 가 열려 있지 않다.
  브라우저에서 곧장 부르면 응답을 읽지 못하므로, 사용자가 띄운 프록시를 한 단계 거친다.
  프록시 주소를 비워 두면 이 기능은 꺼진 것으로 본다.

  응답은 NDJSON(한 줄에 JSON 하나) 스트림이다.
    {"type":"progress","step":"fast","detail":"윤문하는 중"}
    {"type":"done","result":"…","source":"…","summary":{…},"degraded":false}
    {"type":"error","message":"…"}
*/

export const TARGET = 'https://imnotai.kr/api/humanize';
export const MODES = { fast: '빠르게', precision: '꼼꼼히' };
export const CHAR_LIMIT = 20000;          // 사이트가 한 번에 받는 최대 글자 수

/* 진행 단계 이름 — 사이트가 쓰는 말 그대로다. */
const STEPS = {
  fast: '윤문하는 중', audit: '다듬는 중', diagnose: 'AI 신호 진단 중', detect: 'AI 티 탐지 중',
  fidelity: '의미 보존 감사 중', naturalness: '자연성 재점검 중', refine: '2차 윤문 중',
  seam: '이음매·리듬 점검 중', stitch: '합치는 중', residual: '남은 AI 티 마무리 중'
};
export const stepLabel = (s) => STEPS[s] || s || '';

/*
  프록시 주소를 실제로 부를 주소로 바꾼다. 흔한 프록시 모양을 모두 받는다.

    https://내서버/humanize            → 그대로 (직접 띄운 중계 서버)
    https://프록시/?url={url}          → {url} 자리에 대상 주소를 넣는다
    https://프록시/?url=               → 끝에 대상 주소를 붙인다(인코딩)
    https://프록시/                    → 끝에 대상 주소를 붙인다(그대로, cors-anywhere 식)
*/
export function proxyUrl(proxy, target = TARGET) {
  const p = String(proxy || '').trim();
  if (!p) throw new Error('프록시 주소가 비어 있습니다.');
  if (p.includes('{url}')) return p.replace('{url}', encodeURIComponent(target));
  if (/[?&][^=]+=$/.test(p) || p.endsWith('?') || p.endsWith('=')) return p + encodeURIComponent(target);
  if (p.endsWith('/')) return p + target;
  return p;
}

export function humanizeRequest({ proxy, text, mode = 'fast', sanitize = true }) {
  return {
    url: proxyUrl(proxy),
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode, sanitize })
    }
  };
}

/*
  NDJSON 줄을 모아 읽는다. 마지막 줄은 아직 덜 왔을 수 있으므로 남겨 둔다.
  { lines, rest } 를 돌려주는 순수 함수라 노드에서도 검사할 수 있다.
*/
export function takeLines(buffer) {
  const parts = String(buffer).split('\n');
  const rest = parts.pop() ?? '';
  const lines = [];
  for (const raw of parts) {
    const line = raw.trim();
    if (!line) continue;
    try { lines.push(JSON.parse(line)); } catch { /* 깨진 줄은 버린다 */ }
  }
  return { lines, rest };
}

/*
  브라우저는 CORS 로 막힌 응답과 끊긴 연결을 똑같이 "Failed to fetch" 로만 알려 준다.
  그중 흔한 쪽은 중계 서버의 허용 목록에 지금 사이트 주소가 없는 경우라, 그 주소를 짚어 준다.
*/
export function unreachable(err, origin = globalThis.location?.origin) {
  const here = origin && origin !== 'null' ? origin : '';
  return here
    ? `프록시에 닿지 못했습니다 (${err.message}). 주소가 맞는지, 그리고 프록시의 허용 목록에 이 사이트 주소 ${here} 가 들어 있는지 확인하세요.`
    : `프록시에 닿지 못했습니다 (${err.message}). 파일을 직접 열었다면 웹 서버로 띄워서 열어 주세요.`;
}

/* 한 덩어리를 보내고 결과 글을 받는다. */
async function once({ proxy, text, mode, sanitize, fetch: f, signal, onProgress }) {
  const { url, init } = humanizeRequest({ proxy, text, mode, sanitize });
  let res;
  try {
    res = await f(url, { ...init, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new Error(unreachable(err));
  }
  if (!res.ok) {
    const hint = res.status === 403 || res.status === 401
      ? ' (프록시가 요청을 막았습니다)'
      : res.status === 429 ? ' (잠시 뒤 다시 해 보세요)' : '';
    throw new Error(`AI 티 빼기 서버가 ${res.status} 로 답했습니다.${hint}`);
  }
  if (!res.body) throw new Error('AI 티 빼기 응답이 비어 있습니다.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let out = '';
  let degraded = false;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { lines, rest } = takeLines(buffer);
    buffer = rest;
    for (const msg of lines) {
      if (msg.type === 'progress') onProgress?.(stepLabel(msg.step), msg);
      else if (msg.type === 'error') throw new Error(msg.message || 'AI 티 빼기에 실패했습니다.');
      else if (msg.type === 'done') { out = msg.result || ''; degraded = Boolean(msg.degraded); }
    }
  }
  // 스트림이 줄바꿈 없이 끝났을 수도 있다.
  for (const msg of takeLines(buffer + '\n').lines) {
    if (msg.type === 'error') throw new Error(msg.message || 'AI 티 빼기에 실패했습니다.');
    if (msg.type === 'done') { out = msg.result || ''; degraded = Boolean(msg.degraded); }
  }

  if (!out.trim()) throw new Error('AI 티 빼기 결과가 비어 있습니다.');
  return { text: out, degraded };
}

/* 한 번에 받는 글자 수를 넘으면 문단 경계에서 나눈다. */
export function splitLong(text, limit = CHAR_LIMIT) {
  const src = String(text ?? '');
  if (src.length <= limit) return [src];
  const out = [];
  let cur = '';
  for (const para of src.split(/(\n{2,})/)) {           // 구분자도 함께 담긴다
    if (cur && (cur + para).length > limit) { out.push(cur); cur = ''; }
    // 한 문단이 통째로 한도를 넘으면 그 안에서 줄 단위로 더 자른다
    if (para.length > limit) {
      for (const line of para.split(/(?<=\n)/)) {
        if (cur && (cur + line).length > limit) { out.push(cur); cur = ''; }
        cur += line;
      }
    } else {
      cur += para;
    }
  }
  if (cur.trim()) out.push(cur);
  return out;
}

/*
  글 하나에서 AI 티를 뺀다. 길면 나눠 보내고 이어 붙인다.
  degraded 는 사이트가 "일부만 다듬었다" 고 알려 준 경우다.
*/
export async function humanize({
  proxy, text, mode = 'fast', sanitize = true, fetch: fetchImpl, signal, onProgress
} = {}) {
  const src = String(text ?? '');
  if (!src.trim()) return { text: src, degraded: false };
  // 브라우저의 fetch 는 window 에 묶여 있어야 한다. 떼어서 부르면 거부당한다.
  const f = fetchImpl || ((...a) => globalThis.fetch(...a));

  const parts = splitLong(src);
  const out = [];
  let degraded = false;
  for (let i = 0; i < parts.length; i++) {
    if (signal?.aborted) throw new DOMException('중단', 'AbortError');
    const res = await once({
      proxy, text: parts[i], mode, sanitize, fetch: f, signal,
      onProgress: (label, msg) => onProgress?.(parts.length > 1 ? `${label} (${i + 1}/${parts.length})` : label, msg)
    });
    out.push(res.text);
    degraded = degraded || res.degraded;
  }
  return { text: out.join('\n\n'), degraded };
}
