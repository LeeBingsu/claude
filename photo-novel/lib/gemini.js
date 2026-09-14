/* gemini.js - Gemini REST API 호출. 키는 브라우저 밖으로 나가지 않고 구글 엔드포인트로만 간다. */

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const HARM_CATEGORIES = [
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
  'HARM_CATEGORY_CIVIC_INTEGRITY'
];

/* 차단을 최대한 푸는 순서. 앞쪽이 가장 느슨하고, 모델이 거부하면 한 칸씩 내려간다.
   OFF 는 필터 자체를 끄는 값이고(지원 모델 한정), BLOCK_NONE 은 "차단하지 않음" 이다. */
export const SAFETY_LADDER = [
  { id: 'off-all', label: '필터 끔(OFF) · 전체', threshold: 'OFF', civic: true },
  { id: 'off-nocivic', label: '필터 끔(OFF) · 시민무결성 제외', threshold: 'OFF', civic: false },
  { id: 'none-all', label: '차단 안 함(BLOCK_NONE) · 전체', threshold: 'BLOCK_NONE', civic: true },
  { id: 'none-nocivic', label: '차단 안 함(BLOCK_NONE) · 시민무결성 제외', threshold: 'BLOCK_NONE', civic: false },
  { id: 'default', label: '모델 기본값', threshold: null, civic: false }
];

export function safetySettingsFor(step) {
  const rung = SAFETY_LADDER[Math.min(step, SAFETY_LADDER.length - 1)];
  if (!rung.threshold) return null;
  return HARM_CATEGORIES
    .filter((c) => rung.civic || c !== 'HARM_CATEGORY_CIVIC_INTEGRITY')
    .map((category) => ({ category, threshold: rung.threshold }));
}

export class GeminiError extends Error {
  constructor(message, { status = 0, body = null } = {}) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.body = body;
  }
}

function headers(apiKey) {
  return { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey };
}

async function errorFrom(res) {
  let body = null;
  let text = '';
  try {
    text = await res.text();
    body = JSON.parse(text);
  } catch { /* 텍스트 그대로 둔다 */ }
  const msg = body?.error?.message || text || `HTTP ${res.status}`;
  return new GeminiError(msg, { status: res.status, body });
}

/* 사용 가능한 모델 목록. generateContent 를 지원하는 것만 남긴다. */
export async function listModels(apiKey, { signal } = {}) {
  const models = [];
  let pageToken = '';
  for (let page = 0; page < 10; page++) {
    const url = `${BASE}/models?pageSize=200${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const res = await fetch(url, { headers: headers(apiKey), signal });
    if (!res.ok) throw await errorFrom(res);
    const data = await res.json();
    for (const m of data.models || []) {
      const methods = m.supportedGenerationMethods || [];
      if (!methods.includes('generateContent')) continue;
      models.push({
        id: String(m.name || '').replace(/^models\//, ''),
        label: m.displayName || '',
        inputTokenLimit: m.inputTokenLimit || 0
      });
    }
    pageToken = data.nextPageToken || '';
    if (!pageToken) break;
  }
  return models;
}

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

function isSafetyArgError(err) {
  if (err.status !== 400) return false;
  const m = String(err.message).toLowerCase();
  return m.includes('safety') || m.includes('threshold') || m.includes('harm_category') || m.includes('harmblock');
}

function isThinkingArgError(err) {
  if (err.status !== 400) return false;
  return String(err.message).toLowerCase().includes('thinking');
}

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('중단됨', 'AbortError')); }, { once: true });
});

/* SSE 한 줄씩 읽어 델타 텍스트를 흘려보낸다. */
async function streamSse(res, onDelta) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let text = '';
  let finishReason = '';
  let blockReason = '';
  let usage = null;

  const handle = (payload) => {
    if (payload.promptFeedback?.blockReason) blockReason = payload.promptFeedback.blockReason;
    if (payload.usageMetadata) usage = payload.usageMetadata;
    const cand = payload.candidates?.[0];
    if (!cand) return;
    if (cand.finishReason) finishReason = cand.finishReason;
    for (const part of cand.content?.parts || []) {
      if (typeof part.text === 'string' && part.text && !part.thought) {
        text += part.text;
        onDelta?.(part.text);
      }
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith('data:')) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === '[DONE]') continue;
      try { handle(JSON.parse(raw)); } catch { /* 조각난 줄은 무시 */ }
    }
  }
  return { text, finishReason, blockReason, usage };
}

/*
  본문 생성. state 는 { safetyStep, noThinking } 형태의 가변 객체로,
  한 번 거부당한 옵션을 세션 내내 기억해 같은 실패를 반복하지 않는다.
*/
export async function generate({
  apiKey,
  model,
  system,
  parts,
  generationConfig = {},
  thinkingBudget = null,
  state = {},
  signal,
  onDelta,
  maxRetries = 4
}) {
  if (!apiKey) throw new GeminiError('API 키를 입력해 주세요.');
  if (!model) throw new GeminiError('모델을 선택해 주세요.');
  if (state.safetyStep == null) state.safetyStep = 0;

  const url = `${BASE}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
  let attempt = 0;

  for (;;) {
    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: { ...generationConfig }
    };
    if (system) body.systemInstruction = { parts: [{ text: system }] };
    const safety = safetySettingsFor(state.safetyStep);
    if (safety) body.safetySettings = safety;
    if (thinkingBudget != null && !state.noThinking) {
      body.generationConfig.thinkingConfig = { thinkingBudget };
    }

    let res;
    try {
      res = await fetch(url, { method: 'POST', headers: headers(apiKey), body: JSON.stringify(body), signal });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      if (attempt++ >= maxRetries) throw new GeminiError(`네트워크 오류: ${err.message}`);
      await sleep(800 * 2 ** (attempt - 1), signal);
      continue;
    }

    if (!res.ok) {
      const err = await errorFrom(res);
      if (isSafetyArgError(err) && state.safetyStep < SAFETY_LADDER.length - 1) {
        state.safetyStep++;                       // 한 단계 완화 옵션을 낮춰 다시 시도
        continue;
      }
      if (isThinkingArgError(err) && !state.noThinking) {
        state.noThinking = true;
        continue;
      }
      if (RETRYABLE.has(res.status) && attempt++ < maxRetries) {
        await sleep(1200 * 2 ** (attempt - 1), signal);
        continue;
      }
      throw err;
    }

    const out = await streamSse(res, onDelta);
    out.safetyStep = state.safetyStep;
    return out;
  }
}
