/* app.js - 화면 로직. 설정은 localStorage 에만 저장한다. */

import { collectImages } from './lib/images.js';
import { sortByName } from './lib/sort.js';
import { generate, listModels, SAFETY_LADDER } from './lib/gemini.js';
import { buildSystem, buildSteps, buildStepParts, buildMemoParts, LENGTHS } from './lib/prompt.js';

const $ = (id) => document.getElementById(id);
const STORE_KEY = 'photoNovel.settings.v1';
const KEY_KEY = 'photoNovel.apiKey.v1';

const DEFAULT_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash'
];

const state = {
  images: [],
  passages: [],          // { text, status: 'empty' | 'busy' | 'done' | 'error', error }
  steps: [],
  memo: '',
  running: false,
  abort: null,
  api: { safetyStep: 0 } // 안전 옵션 자동 완화 기록
};

/* ------------------------------------------------------------- 설정 저장 */

const FIELDS = [
  ['model', 'value'], ['customModel', 'value'], ['customModelOn', 'checked'],
  ['instructions', 'value'], ['length', 'value'], ['language', 'value'],
  ['pov', 'value'], ['tense', 'value'], ['safety', 'value'], ['thinking', 'value'],
  ['temperature', 'value'], ['topP', 'value'], ['maxTokens', 'value'],
  ['contextChars', 'value'], ['delayMs', 'value'], ['maxDim', 'value'],
  ['optOpening', 'checked'], ['optEnding', 'checked'], ['optPrevImage', 'checked'],
  ['optMemo', 'checked'], ['saveKey', 'checked']
];

function saveSettings() {
  const out = { theme: document.documentElement.dataset.theme };
  for (const [id, prop] of FIELDS) {
    const el = $(id);
    if (el) out[id] = el[prop];
  }
  try { localStorage.setItem(STORE_KEY, JSON.stringify(out)); } catch { /* 시크릿 모드 등 */ }
  try {
    if ($('saveKey').checked) localStorage.setItem(KEY_KEY, $('apiKey').value);
    else localStorage.removeItem(KEY_KEY);
  } catch { /* 무시 */ }
}

function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}'); } catch { s = {}; }
  if (s.theme) document.documentElement.dataset.theme = s.theme;
  for (const [id, prop] of FIELDS) {
    const el = $(id);
    if (!el || s[id] === undefined) continue;
    // 예전에 목록에서 고른 모델이 기본 목록에 없으면 항목을 되살린다.
    if (id === 'model' && s[id] && !Array.from(el.options).some((o) => o.value === s[id])) {
      el.append(new Option(s[id], s[id]));
    }
    el[prop] = s[id];
  }
  try {
    const k = localStorage.getItem(KEY_KEY);
    if (k) { $('apiKey').value = k; $('saveKey').checked = true; }
  } catch { /* 무시 */ }
}

function opts() {
  return {
    instructions: $('instructions').value,
    language: $('language').value.trim(),
    pov: $('pov').value,
    tense: $('tense').value,
    length: $('length').value,
    opening: $('optOpening').checked,
    ending: $('optEnding').checked,
    includePrevImage: $('optPrevImage').checked,
    memo: $('optMemo').checked,
    contextChars: Math.max(0, Number($('contextChars').value) || 4000),
    delayMs: Math.max(0, Number($('delayMs').value) || 0)
  };
}

function modelName() {
  return ($('customModelOn').checked ? $('customModel').value.trim() : $('model').value.trim());
}

function genConfig() {
  return {
    temperature: Number($('temperature').value),
    topP: Number($('topP').value),
    maxOutputTokens: Math.max(64, Number($('maxTokens').value) || 4096),
    candidateCount: 1
  };
}

/* ------------------------------------------------------------- 초기 UI */

function fillSelects() {
  const len = $('length');
  for (const [id, v] of Object.entries(LENGTHS)) {
    len.append(new Option(v.label, id));
  }
  len.value = 'medium';

  const safety = $('safety');
  SAFETY_LADDER.forEach((rung, i) => safety.append(new Option(rung.label, String(i))));
  safety.value = '0';

  setModelOptions(DEFAULT_MODELS.map((id) => ({ id, label: '' })));
  $('model').value = DEFAULT_MODELS[0];
}

function setModelOptions(models, keep) {
  const sel = $('model');
  const prev = keep ?? sel.value;
  sel.textContent = '';
  for (const m of models) {
    sel.append(new Option(m.label && m.label !== m.id ? `${m.id} — ${m.label}` : m.id, m.id));
  }
  if (prev && models.some((m) => m.id === prev)) sel.value = prev;
}

async function fetchModels() {
  const key = $('apiKey').value.trim();
  if (!key) { setHint('먼저 API 키를 입력해 주세요.', true); return; }
  const btn = $('loadModels');
  btn.disabled = true;
  setHint('모델 목록을 불러오는 중…');
  try {
    const models = await listModels(key);
    const good = models.filter((m) => !/embedding|aqa|imagen|veo|tts|image-generation/i.test(m.id));
    setModelOptions(good.length ? good : models);
    setHint(`${good.length || models.length}개 모델을 찾았습니다.`);
    saveSettings();
  } catch (err) {
    setHint(`목록을 불러오지 못했습니다: ${err.message}`, true);
  } finally {
    btn.disabled = false;
  }
}

function setHint(text, bad) {
  const el = $('modelHint');
  el.textContent = text;
  el.style.color = bad ? 'var(--bad)' : '';
}

/* ------------------------------------------------------------- 사진 목록 */

function renderImages() {
  const list = $('imageList');
  list.textContent = '';
  $('countVal').textContent = String(state.images.length);

  state.images.forEach((img, i) => {
    const li = document.createElement('li');
    li.className = 'thumb';
    li.draggable = true;
    li.dataset.i = String(i);

    const grip = document.createElement('span');
    grip.className = 'grip';
    grip.textContent = '⠿';

    const idx = document.createElement('span');
    idx.className = 'idx';
    idx.textContent = String(i + 1);

    const thumb = document.createElement('img');
    thumb.src = img.url;
    thumb.alt = img.name;
    thumb.loading = 'lazy';

    const meta = document.createElement('div');
    meta.className = 'meta';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = img.name;
    const sub = document.createElement('div');
    sub.className = 'sub';
    const size = `${(img.bytes / 1024).toFixed(0)} KB`;
    const dim = img.width ? `${img.width}×${img.height}` : '';
    sub.textContent = [dim, size, img.converted ? '변환됨' : ''].filter(Boolean).join(' · ');
    meta.append(name, sub);

    const acts = document.createElement('div');
    acts.className = 'acts';
    acts.append(
      actBtn('▲', '위로', () => move(i, -1)),
      actBtn('▼', '아래로', () => move(i, 1)),
      actBtn('✕', '삭제', () => remove(i))
    );

    li.append(grip, idx, thumb, meta, acts);
    list.append(li);
  });
}

function actBtn(label, title, fn) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.title = title;
  b.addEventListener('click', fn);
  return b;
}

function move(i, d) {
  const j = i + d;
  if (j < 0 || j >= state.images.length) return;
  const [x] = state.images.splice(i, 1);
  state.images.splice(j, 0, x);
  renderImages();
  renderStory();
}

function remove(i) {
  const [x] = state.images.splice(i, 1);
  URL.revokeObjectURL(x.url);
  renderImages();
  renderStory();
}

/* 드래그로 순서 바꾸기 */
let dragFrom = -1;
$('imageList').addEventListener('dragstart', (e) => {
  const li = e.target.closest('.thumb');
  if (!li) return;
  dragFrom = Number(li.dataset.i);
  li.classList.add('drag');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', String(dragFrom));
});
$('imageList').addEventListener('dragover', (e) => {
  e.preventDefault();
  const li = e.target.closest('.thumb');
  if (!li) return;
  document.querySelectorAll('.thumb.over').forEach((n) => n.classList.remove('over'));
  li.classList.add('over');
});
$('imageList').addEventListener('drop', (e) => {
  e.preventDefault();
  const li = e.target.closest('.thumb');
  document.querySelectorAll('.thumb.over, .thumb.drag').forEach((n) => n.classList.remove('over', 'drag'));
  if (!li || dragFrom < 0) return;
  const to = Number(li.dataset.i);
  if (to === dragFrom) return;
  const [x] = state.images.splice(dragFrom, 1);
  state.images.splice(to, 0, x);
  dragFrom = -1;
  renderImages();
  renderStory();
});
$('imageList').addEventListener('dragend', () => {
  document.querySelectorAll('.thumb.over, .thumb.drag').forEach((n) => n.classList.remove('over', 'drag'));
  dragFrom = -1;
});

/* ------------------------------------------------------------- 파일 입력 */

async function addFiles(files) {
  const arr = Array.from(files || []);
  if (!arr.length) return;
  const note = $('loadNote');
  note.hidden = true;
  setStatus('사진을 읽는 중…');
  try {
    const { images, errors } = await collectImages(arr, {
      maxDim: Math.max(0, Number($('maxDim').value) || 0),
      onProgress: (done, total, name) => setStatus(`사진 처리 중 ${done}/${total} ${name}`)
    });
    // 새로 넣은 묶음은 이름순으로 들어오고, 이미 손으로 맞춰 둔 순서는 건드리지 않는다.
    state.images = state.images.concat(images);
    renderImages();
    renderStory();
    if (errors.length) {
      note.hidden = false;
      note.textContent = errors.join('\n');
    }
    setStatus(state.images.length ? `${state.images.length}장 준비됨. 생성을 시작할 수 있습니다.` : '읽어들인 사진이 없습니다.');
  } catch (err) {
    note.hidden = false;
    note.textContent = err.message;
    setStatus('사진을 읽지 못했습니다.', true);
  }
}

$('fileInput').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
$('dirInput').addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
$('pickFiles').addEventListener('click', () => $('fileInput').click());
$('pickDir').addEventListener('click', () => $('dirInput').click());
$('drop').addEventListener('click', () => $('fileInput').click());
$('drop').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('fileInput').click(); }
});
['dragenter', 'dragover'].forEach((t) => $('drop').addEventListener(t, (e) => {
  e.preventDefault();
  $('drop').classList.add('over');
}));
['dragleave', 'drop'].forEach((t) => $('drop').addEventListener(t, (e) => {
  e.preventDefault();
  $('drop').classList.remove('over');
}));
$('drop').addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  if (dt?.files?.length) addFiles(dt.files);
});

$('sortNow').addEventListener('click', () => {
  state.images = sortByName(state.images);
  renderImages();
  renderStory();
});
$('clearImages').addEventListener('click', () => {
  if (state.images.length && !confirm('사진을 모두 지울까요?')) return;
  state.images.forEach((i) => URL.revokeObjectURL(i.url));
  state.images = [];
  renderImages();
  renderStory();
});

/* ------------------------------------------------------------- 결과 화면 */

function passageAt(i) {
  if (!state.passages[i]) state.passages[i] = { text: '', status: 'empty', error: '' };
  return state.passages[i];
}

function stepLabel(step) {
  if (step.kind === 'ending') return `${step.from + 1}번 장면 이후 · 마무리`;
  return `${step.from + 1}번 → ${step.to + 1}번 장면 사이`;
}

function renderStory() {
  state.steps = buildSteps(state.images.length, opts());
  const box = $('story');
  box.textContent = '';

  if (!state.images.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = '아직 쓴 글이 없습니다.';
    box.append(p);
    updateCharCount();
    return;
  }

  state.images.forEach((img, i) => {
    const fig = document.createElement('figure');
    fig.className = 'scene';
    const im = document.createElement('img');
    im.src = img.url;
    im.alt = `${i + 1}번 장면`;
    im.loading = 'lazy';
    const cap = document.createElement('figcaption');
    cap.textContent = `${i + 1} / ${state.images.length} · ${img.name}`;
    fig.append(im, cap);
    box.append(fig);

    // 이 사진 뒤에 오는 대목 (i → i+1 다리, 또는 마지막 사진의 마무리)
    const si = state.steps.findIndex((s) => s.from === i);
    if (si >= 0) box.append(passageNode(si));
  });

  updateCharCount();
}

function passageNode(si) {
  const step = state.steps[si];
  const p = passageAt(si);

  const wrap = document.createElement('section');
  wrap.className = `passage ${p.status === 'busy' ? 'busy' : ''} ${p.status === 'error' ? 'fail' : ''}`;
  wrap.dataset.p = String(si);

  const head = document.createElement('div');
  head.className = 'passage-head';
  const label = document.createElement('span');
  label.textContent = stepLabel(step);
  const spacer = document.createElement('span');
  spacer.className = 'spacer';
  const again = document.createElement('button');
  again.type = 'button';
  again.textContent = p.text ? '다시 쓰기' : '이 대목 쓰기';
  again.addEventListener('click', () => runOne(si));
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.textContent = '지우기';
  clear.addEventListener('click', () => {
    state.passages[si] = { text: '', status: 'empty', error: '' };
    renderStory();
  });
  head.append(label, spacer, again, clear);

  const prose = document.createElement('div');
  prose.className = 'prose';
  prose.contentEditable = state.running ? 'false' : 'true';
  prose.spellcheck = false;
  prose.textContent = p.text;
  prose.addEventListener('input', () => {
    p.text = prose.innerText;
    p.status = p.text.trim() ? 'done' : 'empty';
    updateCharCount();
  });

  wrap.append(head, prose);
  if (p.error) {
    const e = document.createElement('p');
    e.className = 'err';
    e.textContent = p.error;
    wrap.append(e);
  }
  return wrap;
}

function proseEl(si) {
  return document.querySelector(`.passage[data-p="${si}"] .prose`);
}

function updateCharCount() {
  const n = state.passages.reduce((a, p) => a + (p?.text?.length || 0), 0);
  $('charVal').textContent = String(n);
}

function setStatus(text, bad) {
  const el = $('status');
  el.textContent = text;
  el.classList.toggle('err', Boolean(bad));
}

function setProgress(done, total) {
  $('barIn').style.width = total ? `${Math.round((done / total) * 100)}%` : '0%';
}

/* ------------------------------------------------------------- 생성 */

function storyBefore(si) {
  return state.passages
    .slice(0, si)
    .map((p) => (p && p.status !== 'error' ? p.text : ''))
    .filter(Boolean)
    .join('\n\n');
}

function thinkingBudget() {
  const v = $('thinking').value;
  return v === '' ? null : Number(v);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FINISH_MESSAGE = {
  SAFETY: '안전 필터에 막혔습니다. 고급 옵션에서 안전 필터 단계를 바꾸거나 지시사항을 조정해 보세요.',
  PROHIBITED_CONTENT: '모델이 정책상 생성을 거부했습니다.',
  BLOCKLIST: '차단 목록에 걸렸습니다.',
  RECITATION: '학습 데이터 인용 문제로 중단되었습니다. 다시 시도해 보세요.',
  MAX_TOKENS: '최대 출력 토큰에서 잘렸습니다. 고급 옵션에서 값을 늘려 보세요.',
  OTHER: '모델이 알 수 없는 이유로 중단했습니다.'
};

async function generateStep(si, o, signal) {
  const step = state.steps[si];
  const p = passageAt(si);
  p.text = '';
  p.error = '';
  p.status = 'busy';
  renderStory();
  const el = proseEl(si);
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' });

  const parts = buildStepParts({
    step,
    images: state.images,
    story: storyBefore(si),
    memo: o.memo ? state.memo : '',
    opts: o
  });

  const res = await generate({
    apiKey: $('apiKey').value.trim(),
    model: modelName(),
    system: buildSystem(o),
    parts,
    generationConfig: genConfig(),
    thinkingBudget: thinkingBudget(),
    state: state.api,
    signal,
    onDelta: (t) => {
      p.text += t;
      const node = proseEl(si);
      if (node) node.textContent = p.text;
      updateCharCount();
    }
  });

  p.text = (res.text || '').trim();
  if (!p.text) {
    p.status = 'error';
    p.error = FINISH_MESSAGE[res.blockReason] || FINISH_MESSAGE[res.finishReason] || '빈 응답을 받았습니다.';
  } else {
    p.status = 'done';
    if (res.finishReason === 'MAX_TOKENS') p.error = FINISH_MESSAGE.MAX_TOKENS;
  }
  renderStory();

  if (o.memo && p.status === 'done') {
    try {
      const memoRes = await generate({
        apiKey: $('apiKey').value.trim(),
        model: modelName(),
        system: '너는 소설의 설정 메모를 관리하는 편집자다. 요청한 메모만 출력한다.',
        parts: buildMemoParts({ memo: state.memo, passage: p.text }),
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        thinkingBudget: 0,
        state: state.api,
        signal
      });
      if (memoRes.text.trim()) state.memo = memoRes.text.trim();
    } catch (err) {
      if (err.name === 'AbortError') throw err;   // 메모 실패는 본문 생성을 막지 않는다
    }
  }
  return p;
}

function preflight() {
  if (!$('apiKey').value.trim()) { setStatus('API 키를 입력해 주세요.', true); return false; }
  if (!modelName()) { setStatus('모델을 선택하거나 이름을 입력해 주세요.', true); return false; }
  if (!state.images.length) { setStatus('사진을 먼저 올려 주세요.', true); return false; }
  return true;
}

function setRunning(on) {
  state.running = on;
  $('runBtn').disabled = on;
  $('resumeBtn').disabled = on;
  $('stopBtn').hidden = !on;
  document.querySelectorAll('.prose').forEach((el) => { el.contentEditable = on ? 'false' : 'true'; });
}

async function runAll({ onlyEmpty }) {
  if (state.running || !preflight()) return;
  const o = opts();
  state.steps = buildSteps(state.images.length, o);
  state.api.safetyStep = Number($('safety').value) || 0;
  if (!onlyEmpty) {
    state.passages = [];
    state.memo = '';
  }
  renderStory();

  const ac = new AbortController();
  state.abort = ac;
  setRunning(true);
  saveSettings();

  const total = state.steps.length;
  let done = 0;
  setProgress(0, total);

  try {
    for (let si = 0; si < total; si++) {
      const cur = state.passages[si];
      if (onlyEmpty && cur && cur.status === 'done' && cur.text.trim()) { done++; setProgress(done, total); continue; }
      setStatus(`(${si + 1}/${total}) ${stepLabel(state.steps[si])} 쓰는 중…`);
      await generateStep(si, o, ac.signal);
      done++;
      setProgress(done, total);
      if (o.delayMs && si < total - 1) await sleep(o.delayMs);
    }
    const failed = state.passages.filter((p) => p && p.status === 'error').length;
    setStatus(failed ? `완료 (실패한 대목 ${failed}개 — 다시 쓰기를 눌러 보세요)` : '완료되었습니다.', Boolean(failed));
  } catch (err) {
    if (err.name === 'AbortError') {
      setStatus('중단했습니다. "빈 대목만 이어서" 로 이어서 쓸 수 있습니다.');
    } else {
      const p = state.passages.find((x) => x && x.status === 'busy');
      if (p) { p.status = 'error'; p.error = err.message; }
      setStatus(`오류: ${err.message}`, true);
      renderStory();
    }
  } finally {
    setRunning(false);
    state.abort = null;
  }
}

async function runOne(si) {
  if (state.running || !preflight()) return;
  const o = opts();
  state.steps = buildSteps(state.images.length, o);
  if (si >= state.steps.length) return;
  const ac = new AbortController();
  state.abort = ac;
  setRunning(true);
  state.api.safetyStep = Number($('safety').value) || 0;
  setStatus(`${stepLabel(state.steps[si])} 다시 쓰는 중…`);
  try {
    await generateStep(si, o, ac.signal);
    setStatus('완료되었습니다.');
  } catch (err) {
    if (err.name === 'AbortError') {
      setStatus('중단했습니다.');
    } else {
      const p = passageAt(si);
      p.status = 'error';
      p.error = err.message;
      setStatus(`오류: ${err.message}`, true);
      renderStory();
    }
  } finally {
    setRunning(false);
    state.abort = null;
  }
}

$('runBtn').addEventListener('click', () => {
  if (state.passages.some((p) => p && p.text) && !confirm('이미 쓴 본문을 지우고 처음부터 다시 쓸까요?')) return;
  runAll({ onlyEmpty: false });
});
$('resumeBtn').addEventListener('click', () => runAll({ onlyEmpty: true }));
$('stopBtn').addEventListener('click', () => state.abort?.abort());

/* ------------------------------------------------------------- 내보내기 */

function plainText() {
  const out = [];
  state.images.forEach((img, i) => {
    out.push(`[사진 ${i + 1} — ${img.name}]`);
    const si = state.steps.findIndex((s) => s.from === i);
    const p = si >= 0 ? state.passages[si] : null;
    if (p?.text) out.push('', p.text, '');
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

$('copyBtn').addEventListener('click', async () => {
  const text = state.passages.map((p) => p?.text || '').filter(Boolean).join('\n\n');
  try {
    await navigator.clipboard.writeText(text);
    setStatus('본문을 복사했습니다.');
  } catch {
    setStatus('복사에 실패했습니다. 본문을 직접 선택해 복사해 주세요.', true);
  }
});

$('saveTxt').addEventListener('click', () => {
  download(`photo-novel-${stamp()}.txt`, new Blob([plainText()], { type: 'text/plain;charset=utf-8' }));
});

$('saveMd').addEventListener('click', () => {
  const out = ['# 사진 소설', ''];
  state.images.forEach((img, i) => {
    out.push(`![${i + 1}번 장면](${img.name})`, '');
    const si = state.steps.findIndex((s) => s.from === i);
    const p = si >= 0 ? state.passages[si] : null;
    if (p?.text) out.push(p.text, '');
  });
  download(`photo-novel-${stamp()}.md`, new Blob([out.join('\n')], { type: 'text/markdown;charset=utf-8' }));
});

$('saveHtml').addEventListener('click', () => {
  const body = state.images.map((img, i) => {
    const si = state.steps.findIndex((s) => s.from === i);
    const p = si >= 0 ? state.passages[si] : null;
    const fig = `<figure><img src="data:${img.mimeType};base64,${img.base64}" alt="${escapeHtml(String(i + 1))}번 장면"></figure>`;
    const text = p?.text ? `<p>${escapeHtml(p.text).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>` : '';
    return fig + text;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>사진 소설</title>
<style>
body{max-width:720px;margin:0 auto;padding:32px 18px 64px;background:#faf9f7;color:#1c1a17;
 font:17px/1.95 "Nanum Myeongjo","Apple SD Gothic Neo","Noto Serif KR",Georgia,serif}
img{width:100%;border-radius:10px;display:block}
figure{margin:0 0 22px}
p{margin:0 0 1.1em;white-space:pre-wrap}
@media (prefers-color-scheme:dark){body{background:#14151a;color:#e7e5e0}}
</style></head><body>
${body}
</body></html>`;
  download(`photo-novel-${stamp()}.html`, new Blob([html], { type: 'text/html;charset=utf-8' }));
});

$('clearStory').addEventListener('click', () => {
  if (state.passages.some((p) => p && p.text) && !confirm('본문을 모두 지울까요?')) return;
  state.passages = [];
  state.memo = '';
  renderStory();
  setProgress(0, 1);
  setStatus('본문을 지웠습니다.');
});

/* ------------------------------------------------------------- 기타 UI */

$('themeBtn').addEventListener('click', () => {
  const root = document.documentElement;
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  saveSettings();
});

$('keyToggle').addEventListener('click', () => {
  const el = $('apiKey');
  el.type = el.type === 'password' ? 'text' : 'password';
});

$('customModelOn').addEventListener('change', () => {
  const on = $('customModelOn').checked;
  $('customModel').hidden = !on;
  $('model').disabled = on;
  saveSettings();
});

$('loadModels').addEventListener('click', fetchModels);

$('temperature').addEventListener('input', () => { $('temperatureVal').textContent = Number($('temperature').value).toFixed(2); });
$('topP').addEventListener('input', () => { $('topPVal').textContent = Number($('topP').value).toFixed(2); });

for (const [id] of FIELDS) {
  const el = $(id);
  if (el) el.addEventListener('change', saveSettings);
}
$('apiKey').addEventListener('change', saveSettings);
['optOpening', 'optEnding'].forEach((id) => $(id).addEventListener('change', renderStory));

window.addEventListener('beforeunload', (e) => {
  if (state.running) { e.preventDefault(); e.returnValue = ''; }
});

/* ------------------------------------------------------------- 시작 */

fillSelects();
loadSettings();
$('customModel').hidden = !$('customModelOn').checked;
$('model').disabled = $('customModelOn').checked;
$('temperatureVal').textContent = Number($('temperature').value).toFixed(2);
$('topPVal').textContent = Number($('topP').value).toFixed(2);
renderImages();
renderStory();
