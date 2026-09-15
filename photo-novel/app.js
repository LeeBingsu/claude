/* app.js - 화면 로직. 설정은 localStorage 에만 저장한다. */

import { collectImages, recordFromStored } from './lib/images.js';
import { sortByName } from './lib/sort.js';
import { generate, listModels, isRefusal, isWorthRetrying, SAFETY_LADDER } from './lib/gemini.js';
import {
  buildSystem, buildSteps, buildStepParts, buildMemoParts, splitMemo, parseMemoBlock,
  appendSettings, buildTimeline, stepId, stepTitle, memoDue, retryNote, LENGTHS
} from './lib/prompt.js';
import { saveWork, loadWork, clearWork, storageAvailable } from './lib/store.js';
import { createZip, unzip } from './lib/zip.js';
import { buildProject, readProject } from './lib/project.js';

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
  passages: {},          // 대목 이름 → { text, status: 'empty' | 'busy' | 'done' | 'error', error }
  beats: {},             // 대목 이름 → 그 구간에서 일어난 일 한 줄
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
  ['optPrologue', 'checked'], ['optOpening', 'checked'], ['optEnding', 'checked'], ['optPrevImage', 'checked'],
  ['memoMode', 'value'], ['memoEvery', 'value'], ['retryRefusal', 'value'], ['optSoften', 'checked'],
  ['optWakeLock', 'checked'], ['optAutoResume', 'checked'], ['optAutosave', 'checked'], ['saveKey', 'checked']
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
  // 예전 버전의 체크박스 설정을 새 선택값으로 옮긴다.
  if (s.memoMode === undefined && s.optMemo !== undefined) s.memoMode = s.optMemo ? 'separate' : 'off';
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
    prologue: $('optPrologue').checked,
    memoMode: $('memoMode').value,
    retryRefusal: Number($('retryRefusal').value),   // 0 안 함, -1 될 때까지
    soften: $('optSoften').checked,
    memoEvery: Number($('memoEvery').value) || 1,
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

/* ------------------------------------------------------------- 자동 저장 */

let saveTimer = 0;
let saveStopped = '';     // 저장 공간 부족 등으로 멈춘 이유

function autosaveOn() {
  return $('optAutosave').checked && !saveStopped && storageAvailable();
}

/* 잦은 호출을 한 번으로 묶는다. */
function scheduleSave(delay = 600) {
  if (!autosaveOn()) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, delay);
}

async function flushSave() {
  if (!autosaveOn()) return;
  clearTimeout(saveTimer);
  try {
    await saveWork({ images: state.images, passages: state.passages, beats: state.beats, memo: state.memo });
    showSaved(Date.now());
  } catch (err) {
    saveStopped = err.name === 'QuotaExceededError'
      ? '브라우저 저장 공간이 부족합니다. 고급 옵션의 이미지 최대 변 길이를 줄이거나 저장된 작업을 지워 주세요.'
      : err.message;
    $('savedInfo').textContent = `자동 저장을 멈췄습니다 — ${saveStopped}`;
  }
}

function storyChars() {
  return Object.values(state.passages).reduce((a, p) => a + (p?.text?.length || 0), 0);
}

function clockOf(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  const today = new Date().toDateString() === d.toDateString();
  return today ? `${p(d.getHours())}:${p(d.getMinutes())}` : `${d.getMonth() + 1}월 ${d.getDate()}일 ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function showSaved(ts) {
  $('savedInfo').textContent = state.images.length || storyChars()
    ? `자동 저장됨 · 사진 ${state.images.length}장 · ${storyChars().toLocaleString('ko-KR')}자 · ${clockOf(ts)}`
    : '저장된 작업이 없습니다.';
}

/* 예전에는 대목을 배열 순서로 저장했다. 이름표(b0, end …)로 옮겨 준다. */
function migratePassages(saved, imageCount) {
  if (!saved) return {};
  if (!Array.isArray(saved)) return saved;
  const out = {};
  saved.forEach((p, i) => {
    if (!p || !p.text) return;
    out[i >= Math.max(0, imageCount - 1) ? 'end' : `b${i}`] = p;
  });
  return out;
}

/* 지난번 작업을 되살린다. */
async function restoreWork() {
  if (!$('optAutosave').checked || !storageAvailable()) return;
  let work = null;
  try {
    work = await loadWork();
  } catch (err) {
    setStatus(`저장된 작업을 불러오지 못했습니다: ${err.message}`, true);
    return;
  }
  if (!work) return;
  const passages = migratePassages(work.passages, work.images.length);
  const hasText = Object.values(passages).some((p) => p?.text);
  if (!work.images.length && !hasText) return;

  try {
    const images = [];
    for (const row of work.images) images.push(await recordFromStored(row));
    state.images = images;
    state.passages = passages;
    state.beats = work.beats || {};
    state.memo = work.memo;
  } catch (err) {
    setStatus(`저장된 사진을 여는 데 실패했습니다: ${err.message}`, true);
    return;
  }

  renderImages();
  renderStory();
  showSaved(work.updatedAt || Date.now());
  setStatus(`지난 작업을 불러왔습니다 · 사진 ${state.images.length}장 · ${storyChars().toLocaleString('ko-KR')}자 (${clockOf(work.updatedAt || Date.now())} 저장)`);
  maybeAutoResume();
}

/* 쓰다 만 작업이 남아 있고 키가 저장돼 있으면, 다시 열었을 때 이어서 쓴다. */
function unfinishedCount() {
  if (!state.images.length) return 0;
  return state.steps.filter((st) => {
    const p = state.passages[stepId(st)];
    return !(p && p.status === 'done' && p.text.trim());
  }).length;
}

function maybeAutoResume() {
  const left = unfinishedCount();
  const written = Object.values(state.passages).some((p) => p?.status === 'done' && p.text.trim());
  if (!left || !written) return;                      // 아직 시작도 안 한 작업은 건드리지 않는다
  if (!$('apiKey').value.trim()) {
    setStatus(`남은 대목이 ${left}개 있습니다. API 키를 넣고 "빈 대목만 이어서" 를 누르세요.`);
    return;
  }
  if (!$('optAutoResume').checked) {
    setStatus(`남은 대목이 ${left}개 있습니다. "빈 대목만 이어서" 로 이어 쓸 수 있습니다.`);
    return;
  }
  setStatus(`나갔던 자리에서 이어 씁니다 · 남은 대목 ${left}개 (멈추려면 중단)`);
  setTimeout(() => {
    if (!state.running && unfinishedCount()) runAll({ onlyEmpty: true });
  }, 1500);
}

/* ------------------------------------------------------------- 초기 UI */

function fillSelects() {
  const len = $('length');
  for (const [id, v] of Object.entries(LENGTHS)) {
    len.append(new Option(v.label, id));
  }
  len.value = 'medium';

  $('memoMode').value = 'inline';      // 추가 요청 없이 일관성을 지킬 수 있으므로 기본값
  $('retryRefusal').value = '3';       // 그냥 넘어가면 이야기에 구멍이 생긴다
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
  scheduleSave();
}

function remove(i) {
  const [x] = state.images.splice(i, 1);
  URL.revokeObjectURL(x.url);
  renderImages();
  renderStory();
  scheduleSave();
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
  scheduleSave();
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
    scheduleSave(0);
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
  scheduleSave();
});
$('clearImages').addEventListener('click', () => {
  if (state.images.length && !confirm('사진을 모두 지울까요?')) return;
  state.images.forEach((i) => URL.revokeObjectURL(i.url));
  state.images = [];
  renderImages();
  renderStory();
  scheduleSave(0);
});

/* ------------------------------------------------------------- 결과 화면 */

function passageAt(id) {
  if (!state.passages[id]) state.passages[id] = { text: '', status: 'empty', error: '' };
  return state.passages[id];
}

function passageText(id) {
  return state.passages[id]?.text || '';
}

function renderStory() {
  state.steps = buildSteps(state.images.length, opts());
  const box = $('story');
  const keepScroll = window.scrollY;      // 다시 그리는 동안 보던 자리를 지킨다
  box.textContent = '';

  if (!state.images.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = '아직 쓴 글이 없습니다.';
    box.append(p);
    updateCharCount();
    window.scrollTo(0, keepScroll);
    return;
  }

  const prologue = state.steps.find((st) => st.kind === 'prologue');
  if (prologue) box.append(passageNode(prologue));

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
    const after = state.steps.find((st) => st.kind !== 'prologue' && st.from === i);
    if (after) box.append(passageNode(after));
  });

  updateCharCount();
  renderMemo();
  window.scrollTo(0, keepScroll);
}

function passageNode(step) {
  const id = stepId(step);
  const p = passageAt(id);

  const wrap = document.createElement('section');
  wrap.className = `passage ${p.status === 'busy' ? 'busy' : ''} ${p.status === 'error' ? 'fail' : ''}`;
  wrap.dataset.p = id;

  const head = document.createElement('div');
  head.className = 'passage-head';
  const label = document.createElement('span');
  label.textContent = stepTitle(step);
  const spacer = document.createElement('span');
  spacer.className = 'spacer';
  const again = document.createElement('button');
  again.type = 'button';
  again.textContent = p.text ? '다시 쓰기' : '이 대목 쓰기';
  again.addEventListener('click', () => runOne(state.steps.indexOf(step)));
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.textContent = '지우기';
  clear.addEventListener('click', () => {
    state.passages[id] = { text: '', status: 'empty', error: '' };
    delete state.beats[id];
    renderStory();
    scheduleSave(0);
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
    scheduleSave(1200);
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

function proseEl(id) {
  return document.querySelector(`.passage[data-p="${id}"] .prose`);
}

/* 구간별 줄거리를 "1→2번 장면 사이: …" 꼴의 여러 줄로 */
function beatsToText() {
  return state.steps
    .filter((st) => state.beats[stepId(st)])
    .map((st) => `${stepTitle(st)}: ${state.beats[stepId(st)]}`)
    .join('\n');
}

/* 사용자가 고친 줄거리를 다시 구간별로 되돌린다. 앞머리가 맞는 줄만 반영한다. */
function textToBeats(text) {
  const byTitle = new Map(state.steps.map((st) => [stepTitle(st), stepId(st)]));
  const next = {};
  for (const line of text.split('\n')) {
    const at = line.indexOf(':');
    if (at < 0) continue;
    const id = byTitle.get(line.slice(0, at).trim());
    if (!id) continue;
    const body = line.slice(at + 1).trim();
    if (body) next[id] = body;
  }
  return next;
}

function renderMemo() {
  const box = $('memoBox');
  const beats = beatsToText();
  const on = $('memoMode').value !== 'off' || Boolean(state.memo) || Boolean(beats);
  box.hidden = !on;
  if (document.activeElement !== $('beatsText')) $('beatsText').value = beats;
  if (document.activeElement !== $('memoText')) $('memoText').value = state.memo;
  const n = Object.keys(state.beats).length;
  $('memoLen').textContent = n ? `줄거리 ${n}줄 · 설정 ${state.memo.length}자` : '(아직 없음)';
}

function updateCharCount() {
  const n = Object.values(state.passages).reduce((a, p) => a + (p?.text?.length || 0), 0);
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

/* ------------------------------------------------------------- 자리 비움 대비 */

let wakeLock = null;

/* 휴대폰에서 화면이 꺼지면 페이지가 얼어붙어 생성이 멈춘다. 그동안만 잡아 둔다. */
async function holdScreen() {
  if (!$('optWakeLock').checked || !navigator.wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener?.('release', () => { wakeLock = null; });
  } catch { /* 배터리 절약 모드 등에서는 거절된다 */ }
}

function releaseScreen() {
  try { wakeLock?.release(); } catch { /* 이미 풀렸으면 그만 */ }
  wakeLock = null;
}

// 탭을 다시 보면 브라우저가 풀어 둔 잠금을 다시 잡는다.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.running && !wakeLock) holdScreen();
});

/* 연결이 끊겼으면 다시 붙을 때까지 기다린다(재시도 횟수를 축내지 않는다). */
function waitForOnline(signal) {
  if (navigator.onLine !== false) return Promise.resolve();
  setStatus('인터넷 연결이 끊겼습니다. 다시 연결되면 이어서 씁니다…');
  return new Promise((resolve, reject) => {
    const done = () => {
      window.removeEventListener('online', done);
      resolve();
    };
    window.addEventListener('online', done);
    signal?.addEventListener('abort', () => {
      window.removeEventListener('online', done);
      reject(new DOMException('중단됨', 'AbortError'));
    }, { once: true });
  });
}

/* ------------------------------------------------------------- 생성 */

/* 바로 앞까지 쓴 본문. 줄거리 메모가 앞쪽을 대신하므로 길이는 옵션으로 자른다. */
function storyBefore(si) {
  return state.steps
    .slice(0, si)
    .map((st) => {
      const p = state.passages[stepId(st)];
      return p && p.status !== 'error' ? p.text : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

function thinkingBudget() {
  const v = $('thinking').value;
  return v === '' ? null : Number(v);
}

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(resolve, ms);
  signal?.addEventListener('abort', () => {
    clearTimeout(timer);
    reject(new DOMException('중단됨', 'AbortError'));
  }, { once: true });
});

const FINISH_MESSAGE = {
  SAFETY: '안전 필터에 막혔습니다. 고급 옵션에서 안전 필터 단계를 바꾸거나 지시사항을 조정해 보세요.',
  PROHIBITED_CONTENT: '모델이 정책상 생성을 거부했습니다.',
  BLOCKLIST: '차단 목록에 걸렸습니다.',
  RECITATION: '학습 데이터 인용 문제로 중단되었습니다. 다시 시도해 보세요.',
  MAX_TOKENS: '최대 출력 토큰에서 잘렸습니다. 고급 옵션에서 값을 늘려 보세요.',
  OTHER: '모델이 알 수 없는 이유로 중단했습니다.'
};

/* 한 대목을 한 번 생성해 본다. 결과 판정은 부르는 쪽에서 한다. */
async function attemptPassage({ si, o, signal, attempt, askMemo, askSettings, inlineMemo }) {
  const step = state.steps[si];
  const id = stepId(step);
  const p = passageAt(id);
  p.text = '';
  p.error = '';
  p.status = 'busy';
  renderStory();

  const parts = buildStepParts({
    step,
    images: state.images,
    story: storyBefore(si),
    memo: o.memoMode !== 'off' ? state.memo : '',
    timeline: o.memoMode !== 'off' ? buildTimeline(state.steps, state.beats, si) : '',
    opts: { ...o, askMemo: inlineMemo, askSettings, retryNote: retryNote(attempt, o.soften) }
  });

  let raw = '';

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
      raw += t;
      // 메모를 같이 받는 중이면 표시줄 뒤쪽은 화면에 내보내지 않는다.
      p.text = inlineMemo ? splitMemo(raw).passage : raw;
      const node = proseEl(id);
      if (node) node.textContent = p.text;
      updateCharCount();
    }
  });

  if (inlineMemo) {
    const cut = splitMemo(res.text || '');
    p.text = cut.passage.trim();
    if (cut.memo) {                           // 표시줄이 없으면 이전 메모를 그대로 둔다
      const note = parseMemoBlock(cut.memo);
      if (note.beat) state.beats[id] = note.beat;
      if (note.settings) state.memo = appendSettings(state.memo, note.settings);
    }
  } else {
    p.text = (res.text || '').trim();
  }
  return { res, id, p };
}

/* 거부·빈 응답으로 끝나면 설정한 만큼 다시 시도한다. */
async function generateStep(si, o, signal) {
  const step = state.steps[si];
  const id = stepId(step);
  // 줄거리 한 줄은 매 대목마다(마지막 대목 제외), 설정은 고른 주기대로만 받는다.
  const askMemo = o.memoMode !== 'off' && si < state.steps.length - 1;
  const askSettings = askMemo && memoDue(si, state.steps.length, o.memoEvery);
  const inlineMemo = askMemo && o.memoMode === 'inline';
  const limit = Number(o.retryRefusal) || 0;      // 0 = 안 함, -1 = 될 때까지
  const label = stepTitle(step);
  const p = passageAt(id);

  let res = null;
  let attempt = 0;
  for (;;) {
    let failure = '';
    try {
      await waitForOnline(signal);
      const out = await attemptPassage({ si, o, signal, attempt, askMemo, askSettings, inlineMemo });
      res = out.res;
      if (!isRefusal({ text: p.text, finishReason: res.finishReason, blockReason: res.blockReason })) break;
      failure = FINISH_MESSAGE[res.blockReason] || FINISH_MESSAGE[res.finishReason] || '빈 응답을 받았습니다.';
    } catch (err) {
      if (err.name === 'AbortError' || !isWorthRetrying(err) || limit === 0) throw err;
      failure = err.message;
    }

    const more = limit < 0 || attempt < limit;
    if (!more) {
      p.status = 'error';
      p.error = attempt ? `${attempt + 1}번 시도했지만 계속 막혔습니다 — ${failure}` : failure;
      renderStory();
      scheduleSave(0);
      return p;
    }

    attempt++;
    const wait = Math.min(15000, 1000 * 2 ** (attempt - 1)) + (o.delayMs || 0);
    p.status = 'error';
    p.error = `${failure} · ${Math.round(wait / 1000)}초 뒤 ${attempt}번째 다시 시도합니다` + (limit > 0 ? ` (최대 ${limit}번)` : '');
    renderStory();
    setStatus(`${label} — ${failure} 다시 시도 ${attempt}${limit > 0 ? `/${limit}` : ''}회째…`);
    await sleep(wait, signal);
  }

  p.status = 'done';
  p.error = res.finishReason === 'MAX_TOKENS' ? FINISH_MESSAGE.MAX_TOKENS : '';
  if (attempt) setStatus(`${label} — ${attempt}번 다시 시도해서 받았습니다.`);
  renderStory();
  scheduleSave(0);

  if (askMemo && o.memoMode === 'separate' && p.status === 'done') {
    try {
      const memoRes = await generate({
        apiKey: $('apiKey').value.trim(),
        model: modelName(),
        system: '너는 소설의 작업 노트를 관리하는 편집자다. 요청한 형식의 노트만 출력한다.',
        parts: buildMemoParts({ memo: state.memo, passage: p.text, wantSettings: askSettings }),
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        thinkingBudget: 0,
        state: state.api,
        signal
      });
      const note = parseMemoBlock(memoRes.text || '');
      if (note.beat) state.beats[id] = note.beat;
      if (note.settings) state.memo = appendSettings(state.memo, note.settings);
      if (note.beat || note.settings) {
        renderMemo();
        scheduleSave(0);
      }
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

/* 쓰다 만 대목은 조각을 남기지 않는다. 이어쓰기가 이 대목을 다시 쓴다. */
function dropHalfWritten(note) {
  for (const [id, p] of Object.entries(state.passages)) {
    if (p?.status !== 'busy') continue;
    state.passages[id] = { text: '', status: 'error', error: note };
  }
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
    state.passages = {};
    state.beats = {};
    state.memo = '';
  }
  renderStory();

  const ac = new AbortController();
  state.abort = ac;
  setRunning(true);
  holdScreen();
  saveSettings();

  const total = state.steps.length;
  let done = 0;
  setProgress(0, total);

  try {
    for (let si = 0; si < total; si++) {
      const cur = state.passages[stepId(state.steps[si])];
      if (onlyEmpty && cur && cur.status === 'done' && cur.text.trim()) { done++; setProgress(done, total); continue; }
      setStatus(`(${si + 1}/${total}) ${stepTitle(state.steps[si])} 쓰는 중…`);
      await generateStep(si, o, ac.signal);
      done++;
      setProgress(done, total);
      if (o.delayMs && si < total - 1) await sleep(o.delayMs, ac.signal);
    }
    const failed = Object.values(state.passages).filter((p) => p && p.status === 'error').length;
    setStatus(failed ? `완료 (실패한 대목 ${failed}개 — 다시 쓰기를 눌러 보세요)` : '완료되었습니다.', Boolean(failed));
  } catch (err) {
    if (err.name === 'AbortError') {
      dropHalfWritten('중단했습니다. "빈 대목만 이어서" 로 이 대목부터 다시 씁니다.');
      setStatus('중단했습니다. "빈 대목만 이어서" 로 이어서 쓸 수 있습니다.');
    } else {
      dropHalfWritten(err.message);
      setStatus(`오류: ${err.message}`, true);
    }
    renderStory();
    scheduleSave(0);
  } finally {
    setRunning(false);
    releaseScreen();
    state.abort = null;
  }
}

async function runOne(si) {
  if (state.running || !preflight()) return;
  const o = opts();
  state.steps = buildSteps(state.images.length, o);
  if (si < 0 || si >= state.steps.length) return;
  const ac = new AbortController();
  state.abort = ac;
  setRunning(true);
  holdScreen();
  state.api.safetyStep = Number($('safety').value) || 0;
  setStatus(`${stepTitle(state.steps[si])} 다시 쓰는 중…`);
  try {
    await generateStep(si, o, ac.signal);
    setStatus('완료되었습니다.');
  } catch (err) {
    if (err.name === 'AbortError') {
      dropHalfWritten('중단했습니다.');
      renderStory();
      scheduleSave(0);
      setStatus('중단했습니다.');
    } else {
      const p = passageAt(stepId(state.steps[si]));
      p.text = '';
      p.status = 'error';
      p.error = err.message;
      setStatus(`오류: ${err.message}`, true);
      renderStory();
      scheduleSave(0);
    }
  } finally {
    setRunning(false);
    releaseScreen();
    state.abort = null;
  }
}

$('runBtn').addEventListener('click', () => {
  if (Object.values(state.passages).some((p) => p && p.text)
    && !confirm('이미 쓴 본문을 지우고 처음부터 다시 쓸까요?')) return;
  runAll({ onlyEmpty: false });
});
$('resumeBtn').addEventListener('click', () => runAll({ onlyEmpty: true }));
$('stopBtn').addEventListener('click', () => state.abort?.abort());

/* ------------------------------------------------------------- 내보내기 */

/* 사진 앞에 오는 도입부와, 각 사진 뒤에 오는 대목을 순서대로 훑는다. */
function walkStory(onPassage, onImage) {
  const pro = state.steps.find((st) => st.kind === 'prologue');
  if (pro) onPassage(passageText(stepId(pro)), pro);
  state.images.forEach((img, i) => {
    onImage(img, i);
    const after = state.steps.find((st) => st.kind !== 'prologue' && st.from === i);
    if (after) onPassage(passageText(stepId(after)), after);
  });
}

function plainText() {
  const out = [];
  walkStory(
    (text) => { if (text) out.push('', text, ''); },
    (img, i) => out.push(`[사진 ${i + 1} — ${img.name}]`)
  );
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
  const chunks = [];
  walkStory((t) => { if (t) chunks.push(t); }, () => {});
  const text = chunks.join('\n\n');
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
  walkStory(
    (text) => { if (text) out.push(text, ''); },
    (img, i) => out.push(`![${i + 1}번 장면](${img.name})`, '')
  );
  download(`photo-novel-${stamp()}.md`, new Blob([out.join('\n')], { type: 'text/markdown;charset=utf-8' }));
});

$('saveHtml').addEventListener('click', () => {
  const chunks = [];
  walkStory(
    (text) => {
      if (text) chunks.push(`<p>${escapeHtml(text).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`);
    },
    (img, i) => chunks.push(
      `<figure><img src="data:${img.mimeType};base64,${img.base64}" alt="${escapeHtml(String(i + 1))}번 장면"></figure>`
    )
  );
  const body = chunks.join('\n');

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

/* 설정 중 파일에 담아도 되는 것만 (API 키는 절대 담지 않는다) */
function exportableSettings() {
  const out = {};
  for (const [id, prop] of FIELDS) {
    if (id === 'saveKey') continue;
    const el = $(id);
    if (el) out[id] = el[prop];
  }
  return out;
}

$('exportProject').addEventListener('click', async () => {
  if (!state.images.length && !Object.keys(state.passages).length) {
    setStatus('내보낼 것이 없습니다.', true);
    return;
  }
  const btn = $('exportProject');
  btn.disabled = true;
  setStatus('전체 내보내기를 만드는 중…');
  try {
    const { files } = buildProject({
      images: state.images,
      passages: state.passages,
      beats: state.beats,
      memo: state.memo,
      settings: exportableSettings(),
      story: plainText()
    });
    const blob = await createZip(files);
    download(`photo-novel-${stamp()}.zip`, blob);
    const size = blob.size >= 1048576 ? `${(blob.size / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(blob.size / 1024))}KB`;
    setStatus(`전체 내보내기 완료 · 사진 ${state.images.length}장 · ${size}`);
  } catch (err) {
    setStatus(`내보내지 못했습니다: ${err.message}`, true);
  } finally {
    btn.disabled = false;
  }
});

$('importProject').addEventListener('click', () => $('importInput').click());

$('importInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  if (state.running) { setStatus('생성 중에는 불러올 수 없습니다.', true); return; }
  setStatus('파일을 여는 중…');
  try {
    const buf = await file.arrayBuffer();
    const entries = await unzip(buf);
    const project = readProject(entries);
    if (project.error) { setStatus(project.error, true); return; }

    if (project.plainZip) {
      setStatus('사진만 들어 있는 zip 입니다. 사진 올리기로 넣어 주세요.', true);
      return;
    }
    const has = state.images.length || Object.values(state.passages).some((p) => p?.text);
    if (has && !confirm('지금 작업을 덮어쓰고 파일의 내용을 불러올까요?')) { setStatus('불러오기를 취소했습니다.'); return; }

    const images = [];
    for (const [i, meta] of project.images.entries()) {
      const blob = new Blob([meta.bytes], { type: meta.mimeType || 'image/jpeg' });
      // 예전 파일에는 id 가 없을 수 있어 그때는 새로 붙인다.
      images.push(await recordFromStored({ ...meta, id: meta.id || `imp${Date.now().toString(36)}${i}`, blob }));
    }

    state.images.forEach((img) => URL.revokeObjectURL(img.url));
    state.images = images;
    state.passages = project.manifest.passages;
    state.beats = project.manifest.beats;
    state.memo = project.manifest.memo;

    // 설정도 함께 복원한다. 키는 파일에 없으니 화면의 것을 그대로 둔다.
    for (const [id, prop] of FIELDS) {
      const el = $(id);
      if (el && id !== 'saveKey' && project.manifest.settings[id] !== undefined) {
        if (id === 'model' && !Array.from(el.options).some((o) => o.value === project.manifest.settings[id])) {
          el.append(new Option(project.manifest.settings[id], project.manifest.settings[id]));
        }
        el[prop] = project.manifest.settings[id];
      }
    }
    $('customModel').hidden = !$('customModelOn').checked;
    $('model').disabled = $('customModelOn').checked;
    $('temperatureVal').textContent = Number($('temperature').value).toFixed(2);
    $('topPVal').textContent = Number($('topP').value).toFixed(2);

    renderImages();
    renderStory();
    saveSettings();
    scheduleSave(0);

    const when = project.manifest.exportedAt ? ` (${clockOf(Date.parse(project.manifest.exportedAt))} 내보낸 파일)` : '';
    const lost = project.missing?.length ? ` · 사진 ${project.missing.length}장은 파일에 없어 빠졌습니다` : '';
    setStatus(`불러왔습니다 · 사진 ${images.length}장 · ${storyChars().toLocaleString('ko-KR')}자${when}${lost}`, Boolean(lost));
  } catch (err) {
    setStatus(`불러오지 못했습니다: ${err.message}`, true);
  }
});

$('clearStory').addEventListener('click', () => {
  if (Object.values(state.passages).some((p) => p && p.text) && !confirm('본문을 모두 지울까요?')) return;
  state.passages = {};
  state.beats = {};
  state.memo = '';
  renderStory();
  setProgress(0, 1);
  setStatus('본문을 지웠습니다.');
  scheduleSave(0);
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

$('memoMode').addEventListener('change', renderMemo);

$('memoText').addEventListener('input', () => {
  state.memo = $('memoText').value;
  scheduleSave(1200);
});

$('beatsText').addEventListener('input', () => {
  state.beats = textToBeats($('beatsText').value);
  scheduleSave(1200);
});

$('optAutosave').addEventListener('change', async () => {
  saveStopped = '';
  if ($('optAutosave').checked) {
    await flushSave();
    return;
  }
  try { await clearWork(); } catch { /* 지울 게 없으면 그만 */ }
  $('savedInfo').textContent = '자동 저장이 꺼져 있습니다. 새로고침하면 사진과 본문이 사라집니다.';
});

$('clearSaved').addEventListener('click', async () => {
  if (!confirm('이 브라우저에 저장된 사진과 본문을 지울까요? 화면에 있는 내용은 그대로 남습니다.')) return;
  try {
    await clearWork();
    saveStopped = '';
    $('savedInfo').textContent = $('optAutosave').checked
      ? '저장된 작업을 지웠습니다. 다음 변경부터 다시 저장됩니다.'
      : '저장된 작업을 지웠습니다.';
  } catch (err) {
    $('savedInfo').textContent = `지우지 못했습니다: ${err.message}`;
  }
});

// 탭을 덮거나 닫을 때, 아직 미뤄 둔 저장을 흘려보낸다.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
window.addEventListener('pagehide', () => { flushSave(); });

$('temperature').addEventListener('input', () => { $('temperatureVal').textContent = Number($('temperature').value).toFixed(2); });
$('topP').addEventListener('input', () => { $('topPVal').textContent = Number($('topP').value).toFixed(2); });

for (const [id] of FIELDS) {
  const el = $(id);
  if (el) el.addEventListener('change', saveSettings);
}
$('apiKey').addEventListener('change', saveSettings);
['optOpening', 'optEnding', 'optPrologue'].forEach((id) => $(id).addEventListener('change', renderStory));

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
if (!storageAvailable()) {
  $('optAutosave').checked = false;
  $('optAutosave').disabled = true;
  $('savedInfo').textContent = '이 브라우저에서는 자동 저장을 쓸 수 없습니다.';
} else {
  await restoreWork();
}
