/* app.js - 화면 로직. 설정은 localStorage 에만 저장한다. */

import { collectImages, recordFromStored, makeImageRecord } from './lib/images.js';
import { sortByName } from './lib/sort.js';
import { generate, listModels, isRefusal, isWorthRetrying, describeFailure, SAFETY_LADDER } from './lib/gemini.js';
import {
  buildSystem, buildSteps, buildStepParts, buildMemoParts, splitMemo, parseMemoBlock,
  appendSettings, buildTimeline, stepId, stepTitle, memoDue, retryNote, LENGTHS,
  buildShortSystem, buildShortParts, buildTranslateParts, splitTitle, LANGS
} from './lib/prompt.js';
import { saveWork, loadWork, clearWork, storageAvailable } from './lib/store.js';
import { createZip, unzip } from './lib/zip.js';
import { buildProject, readProject, safeFileName } from './lib/project.js';
import { renderPoster, POSTER_DEFAULTS } from './lib/poster.js';
import { translateText, ENGINES, DEFAULT_ENDPOINT } from './lib/translate.js';
import { humanize, MODES as HUMAN_MODES } from './lib/humanize.js';

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
  tab: 'series',
  shorts: { images: [], items: {} },   // items: 사진 id → { base, lang, texts, status, error }
  images: [],
  passages: {},          // 대목 이름 → { text, status: 'empty' | 'busy' | 'done' | 'error', error }
  beats: {},             // 대목 이름 → 그 구간에서 일어난 일 한 줄
  steps: [],
  memo: '',
  running: false,
  proseScale: 1,         // 화면 본문 글자 크기 배율
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
  ['optWakeLock', 'checked'], ['optAutoResume', 'checked'], ['optLightRetry', 'checked'],
  ['dropMemo', 'checked'], ['dropTimeline', 'checked'], ['dropStory', 'checked'],
  ['dropPrevImage', 'checked'], ['dropInstructions', 'checked'], ['imagesBox', 'open'],
  ['shortLang', 'value'], ['shortInstructions', 'value'], ['sImagesBox', 'open'],
  ['transEngine', 'value'], ['transEndpoint', 'value'], ['transEmail', 'value'],
  ['humanProxy', 'value'], ['humanMode', 'value'], ['humanWhen', 'value'],
  ['humanSanitize', 'checked'], ['humanBox', 'open'],
  ['posterDark', 'value'], ['posterFont', 'value'], ['posterPos', 'value'],
  ['posterAlign', 'value'], ['posterFormat', 'value'], ['posterTitle', 'checked'], ['optAutosave', 'checked'], ['saveKey', 'checked']
];

function saveSettings() {
  const out = { theme: document.documentElement.dataset.theme, tab: state.tab, proseScale: state.proseScale };
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
  if (s.tab) state.tab = s.tab;
  setProseScale(s.proseScale ?? 1, { save: false });
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
    shortLang: $('shortLang').value,
    shortInstructions: $('shortInstructions').value,
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
    lightRetry: $('optLightRetry').checked,
    drop: {
      memo: $('dropMemo').checked,
      timeline: $('dropTimeline').checked,
      story: $('dropStory').checked,
      prevImage: $('dropPrevImage').checked,
      instructions: $('dropInstructions').checked
    },
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
    await saveWork({
      images: state.images,
      passages: state.passages,
      beats: state.beats,
      memo: state.memo,
      shorts: state.shorts
    });
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
  $('savedInfo').textContent = state.images.length || storyChars() || state.shorts.images.length
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
  const hasShorts = (work.shorts?.images || []).length > 0;
  if (!work.images.length && !hasText && !hasShorts) return;

  try {
    const images = [];
    for (const row of work.images) images.push(await recordFromStored(row));
    state.images = images;
    state.passages = passages;
    state.beats = work.beats || {};
    state.memo = work.memo;

    const shortImages = [];
    for (const row of work.shorts?.images || []) shortImages.push(await recordFromStored(row));
    state.shorts = { images: shortImages, items: work.shorts?.items || {} };
  } catch (err) {
    setStatus(`저장된 사진을 여는 데 실패했습니다: ${err.message}`, true);
    return;
  }

  renderImages();
  renderStory();
  renderShortImages();
  renderShorts();
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

/* 단편 쪽에서 아직 글이 없는 사진 수 */
function shortsUnfinishedCount() {
  return state.shorts.images.filter((img) => state.shorts.items[img.id]?.status !== 'done').length;
}

/*
  다시 열었을 때 이어 쓰기.
  지금 보고 있는 탭만 스스로 이어 쓴다. 다른 탭 것은 알려만 주고 건드리지 않는다
  (단편을 쓰려는데 연작이 혼자 돌아가면 안 된다).
*/
function maybeAutoResume() {
  const series = {
    left: unfinishedCount(),
    written: Object.values(state.passages).some((p) => p?.status === 'done' && p.text.trim()),
    unit: '대목',
    button: '빈 대목만 이어서',
    note: setStatus,
    run: () => runAll({ onlyEmpty: true }),
    remaining: unfinishedCount
  };
  const shorts = {
    left: shortsUnfinishedCount(),
    written: Object.values(state.shorts.items).some((x) => x?.status === 'done'),
    unit: '사진',
    button: '빈 사진만 이어서',
    note: sStatus,
    run: () => runShorts({ onlyEmpty: true }),
    remaining: shortsUnfinishedCount
  };
  const here = state.tab === 'shorts' ? shorts : series;
  const there = state.tab === 'shorts' ? series : shorts;

  // 보고 있지 않은 탭은 알려만 준다
  if (there.left && there.written) {
    there.note(`남은 ${there.unit}이 ${there.left}개 있습니다. 그 탭에서 "${there.button}" 로 이어 쓸 수 있습니다.`);
  }

  if (!here.left || !here.written) return;            // 아직 시작도 안 한 작업은 건드리지 않는다
  if (!$('apiKey').value.trim()) {
    here.note(`남은 ${here.unit}이 ${here.left}개 있습니다. API 키를 넣고 "${here.button}" 를 누르세요.`);
    return;
  }
  if (!$('optAutoResume').checked) {
    here.note(`남은 ${here.unit}이 ${here.left}개 있습니다. "${here.button}" 로 이어 쓸 수 있습니다.`);
    return;
  }
  here.note(`나갔던 자리에서 이어 씁니다 · 남은 ${here.unit} ${here.left}개 (멈추려면 중단)`);
  setTimeout(() => {
    if (!state.running && here.remaining()) here.run();
  }, 1500);
}

/* ------------------------------------------------------------- 초기 UI */

function fillSelects() {
  const len = $('length');
  for (const [id, v] of Object.entries(LENGTHS)) {
    len.append(new Option(v.label, id));
  }
  len.value = 'medium';

  const shortLang = $('shortLang');
  for (const [code, v] of Object.entries(LANGS)) shortLang.append(new Option(v.label, code));
  shortLang.value = 'ko';

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
  $('listHint').textContent = state.images.length ? `(${state.images.length}장 · 누르면 접기/펴기)` : '(0장)';

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
    const before = state.images.length;
    state.images = state.images.concat(images);
    // 사진이 많아지는 순간 목록을 한 번 접어 준다. 매번 스크롤하지 않도록.
    if (before <= 8 && state.images.length > 8 && $('imagesBox').open) {
      $('imagesBox').open = false;
      saveSettings();
    }
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
  const human = document.createElement('button');
  human.type = 'button';
  human.textContent = 'AI 티 빼기';
  human.hidden = !humanReady();
  human.disabled = !p.text.trim();
  human.addEventListener('click', () => humanizePassages([id]));
  head.append(label, spacer, human, again, clear);

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

/* 아직 글이 없는 구간들의 이름표 */
function gapIds() {
  const out = new Set();
  for (const st of state.steps) {
    const p = state.passages[stepId(st)];
    if (!(p && p.status === 'done' && p.text.trim())) out.add(stepId(st));
  }
  return out;
}

/* 바로 앞 구간이 비어 있으면 그 이름. 없으면 빈 문자열. */
function gapBefore(si) {
  const prev = state.steps[si - 1];
  if (!prev) return '';
  const p = state.passages[stepId(prev)];
  return p && p.status === 'done' && p.text.trim() ? '' : stepTitle(prev);
}

/* 이 대목 뒤에 이미 쓰여 있는 본문. 구멍을 메우거나 다시 쓸 때 거기에 닿게 한다. */
function storyAfter(si) {
  for (let i = si + 1; i < state.steps.length; i++) {
    const p = state.passages[stepId(state.steps[i])];
    if (p && p.status === 'done' && p.text.trim()) return p.text;
  }
  return '';
}

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

const DROP_LABEL = {
  memo: '설정 메모',
  timeline: '줄거리',
  story: '앞뒤 본문',
  prevImage: '직전 사진',
  instructions: '맞춤 지시사항'
};

const FINISH_MESSAGE = {
  SAFETY: '안전 필터에 막혔습니다. 고급 옵션에서 안전 필터 단계를 바꾸거나 지시사항을 조정해 보세요.',
  PROHIBITED_CONTENT: '모델이 정책상 생성을 거부했습니다.',
  BLOCKLIST: '차단 목록에 걸렸습니다.',
  RECITATION: '학습 데이터 인용 문제로 중단되었습니다. 다시 시도해 보세요.',
  MAX_TOKENS: '최대 출력 토큰에서 잘렸습니다. 고급 옵션에서 값을 늘려 보세요.',
  OTHER: '모델이 알 수 없는 이유로 중단했습니다.'
};

/* 한 대목을 한 번 생성해 본다. 결과 판정은 부르는 쪽에서 한다. */
async function attemptPassage({ si, o, signal, attempt, light, askMemo, askSettings, inlineMemo }) {
  const step = state.steps[si];
  const id = stepId(step);
  const p = passageAt(id);
  p.text = '';
  p.error = '';
  p.status = 'busy';
  renderStory();

  // 여러 번 막혔다면 딸려 가는 것 중 무언가가 원인이다. 무엇을 뺄지는 사용자가 고른다.
  const drop = light ? o.drop : {};
  const memoOn = o.memoMode !== 'off';
  const parts = buildStepParts({
    step,
    images: state.images,
    story: drop.story ? '' : storyBefore(si),
    memo: !memoOn || drop.memo ? '' : state.memo,
    timeline: !memoOn || drop.timeline ? '' : buildTimeline(state.steps, state.beats, si, gapIds()),
    nextText: drop.story ? '' : storyAfter(si),
    gapBefore: drop.story ? '' : gapBefore(si),
    opts: {
      ...o,
      includePrevImage: drop.prevImage ? false : o.includePrevImage,
      askMemo: inlineMemo,
      askSettings,
      retryNote: retryNote(attempt, o.soften)
    }
  });

  let raw = '';

  const res = await generate({
    apiKey: $('apiKey').value.trim(),
    model: modelName(),
    system: buildSystem(drop.instructions ? { ...o, instructions: '' } : o),
    parts,
    generationConfig: genConfig(),
    thinkingBudget: thinkingBudget(),
    state: state.api,
    signal,
    onDelta: (t) => {
      raw += t;
      // 메모를 같이 받는 중이면 표시줄 뒤쪽은 화면에 내보내지 않는다.
      p.text = splitMemo(raw).passage;          // 표시줄이 없으면 그대로 본문이다
      const node = proseEl(id);
      if (node) node.textContent = p.text;
      updateCharCount();
    }
  });

  const cut = splitMemo(res.text || '');
  p.text = cut.passage.trim();
  // 부탁한 적 없는데 메모가 붙어 오기도 한다. 본문에서는 떼되, 받아 두는 건 부탁했을 때만.
  if (inlineMemo && cut.memo) {
    const note = parseMemoBlock(cut.memo);
    if (note.beat) state.beats[id] = note.beat;
    if (note.settings) state.memo = appendSettings(state.memo, note.settings);
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
  // 고른 횟수를 다 쓰면 마지막으로 문맥을 덜어 한 번 더 보낸다(될 때까지면 4번째부터 계속).
  // "그냥 넘어가기" 를 골랐으면 그 한 번도 하지 않는다.
  const dropped = Object.entries(DROP_LABEL).filter(([key]) => o.drop[key]).map(([, label]) => label);
  const lightOn = o.lightRetry && limit !== 0 && dropped.length > 0;
  const lightFrom = lightOn ? (limit < 0 ? 3 : limit + 1) : Infinity;
  const maxAttempt = limit < 0 ? Infinity : limit + (lightOn ? 1 : 0);
  const label = stepTitle(step);
  const p = passageAt(id);

  let res = null;
  let attempt = 0;
  let usedLight = false;
  for (;;) {
    const light = attempt >= lightFrom;
    let failure = '';
    try {
      await waitForOnline(signal);
      const out = await attemptPassage({ si, o, signal, attempt, light, askMemo, askSettings, inlineMemo });
      res = out.res;
      if (!isRefusal({ text: p.text, finishReason: res.finishReason, blockReason: res.blockReason })) {
        usedLight = light;
        break;
      }
      failure = describeFailure({ text: p.text, finishReason: res.finishReason, blockReason: res.blockReason })?.message
        || '빈 응답을 받았습니다.';
    } catch (err) {
      if (err.name === 'AbortError' || !isWorthRetrying(err) || limit === 0) throw err;
      failure = err.message;
    }

    if (attempt >= maxAttempt) {
      p.status = 'error';
      p.error = attempt ? `${attempt + 1}번 시도했지만 계속 막혔습니다 — ${failure}` : failure;
      renderStory();
      scheduleSave(0);
      return p;
    }

    attempt++;
    const wait = Math.min(15000, 1000 * 2 ** (attempt - 1)) + (o.delayMs || 0);
    const how = attempt >= lightFrom ? `${dropped.join('·')} 없이 ` : '';
    p.status = 'error';
    p.error = `${failure} · ${Math.round(wait / 1000)}초 뒤 ${how}${attempt}번째 다시 시도합니다`;
    renderStory();
    setStatus(`${label} — ${failure} ${how}다시 시도 ${attempt}${limit > 0 ? `/${limit}` : ''}회째…`);
    await sleep(wait, signal);
  }

  p.status = 'done';
  p.error = res.finishReason === 'MAX_TOKENS' ? FINISH_MESSAGE.MAX_TOKENS : '';
  if (usedLight) {
    p.error = `${dropped.join('·')} 없이 쓴 대목입니다. 앞뒤가 맞는지 확인해 주세요.${p.error ? ` ${p.error}` : ''}`;
  }
  if (attempt) setStatus(`${label} — ${attempt}번 다시 시도해서 받았습니다.${usedLight ? ` (${dropped.join('·')} 없이 시도)` : ''}`);
  renderStory();
  scheduleSave(0);

  // 자동 AI 티 빼기 — 뒤 대목이 참고하는 앞 글도 다듬어진 글이 된다.
  if (humanReady() && $('humanWhen').value === 'auto' && p.status === 'done') {
    await humanizePassages([id], { signal, note: setStatus });
  }

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
  if (!state.images.length && !Object.keys(state.passages).length && !state.shorts.images.length) {
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
      shorts: state.shorts,
      settings: exportableSettings(),
      story: plainText(),
      shortsText: shortsPlainText()
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

    const toRecords = async (list, tag) => {
      const out = [];
      for (const [i, meta] of (list || []).entries()) {
        const blob = new Blob([meta.bytes], { type: meta.mimeType || 'image/jpeg' });
        // 예전 파일에는 id 가 없을 수 있어 그때는 새로 붙인다.
        out.push(await recordFromStored({ ...meta, id: meta.id || `imp${Date.now().toString(36)}${tag}${i}`, blob }));
      }
      return out;
    };
    const images = await toRecords(project.images, 's');
    // 단편 사진은 원본으로 담겨 오므로, 보낼 크기는 지금 설정대로 다시 만든다.
    const shortImages = [];
    for (const meta of project.shortImages || []) {
      const blob = new Blob([meta.bytes], { type: meta.mimeType || 'image/jpeg' });
      const rec = await makeImageRecord(meta.name, blob, {
        maxDim: Math.max(0, Number($('maxDim').value) || 0),
        keepOriginal: true
      });
      shortImages.push({ ...rec, id: meta.id || rec.id });
    }

    state.images.forEach((img) => URL.revokeObjectURL(img.url));
    state.shorts.images.forEach((img) => URL.revokeObjectURL(img.url));
    state.images = images;
    state.passages = project.manifest.passages;
    state.beats = project.manifest.beats;
    state.memo = project.manifest.memo;
    state.shorts = { images: shortImages, items: project.manifest.shorts?.items || {} };

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
    renderShortImages();
    renderShorts();
    saveSettings();
    scheduleSave(0);

    const when = project.manifest.exportedAt ? ` (${clockOf(Date.parse(project.manifest.exportedAt))} 내보낸 파일)` : '';
    const lost = project.missing?.length ? ` · 사진 ${project.missing.length}장은 파일에 없어 빠졌습니다` : '';
    const shortsNote = shortImages.length ? ` · 단편 사진 ${shortImages.length}장` : '';
    setStatus(`불러왔습니다 · 사진 ${images.length}장${shortsNote} · ${storyChars().toLocaleString('ko-KR')}자${when}${lost}`, Boolean(lost));
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

/*
  화면 본문(연작 대목·단편 글·제목) 글자 크기.
  CSS 의 --prose-scale 배율만 바꾸므로 줄 간격과 여백이 같이 따라간다.
  그림으로 저장할 때의 글자 크기는 따로 있다(4번 칸의 "글자 크기").
*/
const PROSE_STEPS = [0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.4, 1.6, 1.8, 2];

function setProseScale(next, { save = true } = {}) {
  const near = PROSE_STEPS.reduce((a, b) => (Math.abs(b - next) < Math.abs(a - next) ? b : a), PROSE_STEPS[0]);
  state.proseScale = near;
  document.documentElement.style.setProperty('--prose-scale', String(near));
  const pct = Math.round(near * 100);
  $('fontVal').textContent = `\uAC00 ${pct}%`;
  $('fontVal').disabled = near === 1;
  $('fontDown').disabled = near === PROSE_STEPS[0];
  $('fontUp').disabled = near === PROSE_STEPS[PROSE_STEPS.length - 1];
  if (save) saveSettings();
}

function stepProseScale(dir) {
  const i = PROSE_STEPS.indexOf(state.proseScale);
  const at = i === -1 ? PROSE_STEPS.indexOf(1) : i;
  setProseScale(PROSE_STEPS[Math.min(PROSE_STEPS.length - 1, Math.max(0, at + dir))]);
}

$('fontDown').addEventListener('click', () => stepProseScale(-1));
$('fontUp').addEventListener('click', () => stepProseScale(1));
$('fontVal').addEventListener('click', () => setProseScale(1));

function syncTransBox() {
  const engine = $('transEngine').value;
  const auto = engine === 'auto';
  $('transEndpointBox').hidden = !(auto || ENGINES[engine]?.endpoint);
  $('transEmailBox').hidden = !(auto || ENGINES[engine]?.email);
  $('transHint').textContent = engine === 'gemini'
    ? '문체는 가장 잘 살지만, 내용에 따라 모델이 번역을 거부할 수 있습니다. 위 설정의 API 키와 모델을 씁니다.'
    : '키가 필요 없고 글을 검열하지 않습니다. 원문 그대로 옮깁니다.';
}

$('transEngine').addEventListener('change', () => { syncTransBox(); saveSettings(); });

$('humanTest').addEventListener('click', testHumanProxy);
$('humanProxy').addEventListener('change', () => { renderStory(); renderShorts(); saveSettings(); });
$('humanAll').addEventListener('click', () => {
  if (!humanReady()) { setStatus('AI 티 빼기 프록시 주소를 먼저 적어 주세요 (설정 → AI 티 빼기).', true); return; }
  humanizePassages(state.steps.map(stepId).filter((id) => passageAt(id).text.trim()));
});
$('sHumanAll').addEventListener('click', () => {
  if (!humanReady()) { sStatus('AI 티 빼기 프록시 주소를 먼저 적어 주세요 (설정 → AI 티 빼기).', true); return; }
  humanizeShorts(state.shorts.images.filter((img) => shortAt(img.id).status === 'done').map((img) => img.id));
});

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

function syncDropBox() {
  $('dropBox').classList.toggle('off', !$('optLightRetry').checked);
  for (const id of ['dropMemo', 'dropTimeline', 'dropStory', 'dropPrevImage', 'dropInstructions']) {
    $(id).disabled = !$('optLightRetry').checked;
  }
}
$('optLightRetry').addEventListener('change', syncDropBox);
$('imagesBox').addEventListener('toggle', saveSettings);

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

/* =========================================================== 한 장씩 단편 */

const LANG_ORDER = ['ko', 'en', 'ja'];

function shortAt(id) {
  if (!state.shorts.items[id]) {
    state.shorts.items[id] = { base: '', lang: '', texts: {}, status: 'empty', error: '' };
  }
  return state.shorts.items[id];
}

function shortText(item) {
  return item.texts[item.lang || item.base] || { title: '', body: '' };
}

function sStatus(text, bad) {
  const el = $('sStatus');
  el.textContent = text;
  el.classList.toggle('err', Boolean(bad));
}

function renderShortImages() {
  const list = $('sImageList');
  list.textContent = '';
  $('sCountVal').textContent = String(state.shorts.images.length);
  $('sListHint').textContent = state.shorts.images.length
    ? `(${state.shorts.images.length}장 · 누르면 접기/펴기)` : '(0장)';

  state.shorts.images.forEach((img, i) => {
    const li = document.createElement('li');
    li.className = 'thumb';
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
    const done = state.shorts.items[img.id]?.status === 'done';
    sub.textContent = `${img.width ? `${img.width}×${img.height} · ` : ''}${done ? '단편 있음' : '아직 없음'}`;
    meta.append(name, sub);
    const acts = document.createElement('div');
    acts.className = 'acts';
    acts.append(
      actBtn('▲', '위로', () => moveShort(i, -1)),
      actBtn('▼', '아래로', () => moveShort(i, 1)),
      actBtn('✕', '삭제', () => removeShort(i))
    );
    li.append(idx, thumb, meta, acts);
    list.append(li);
  });
}

function moveShort(i, d) {
  const j = i + d;
  if (j < 0 || j >= state.shorts.images.length) return;
  const [x] = state.shorts.images.splice(i, 1);
  state.shorts.images.splice(j, 0, x);
  renderShortImages();
  renderShorts();
  scheduleSave();
}

function removeShort(i) {
  const [x] = state.shorts.images.splice(i, 1);
  URL.revokeObjectURL(x.url);
  delete state.shorts.items[x.id];
  renderShortImages();
  renderShorts();
  scheduleSave(0);
}

function renderShorts() {
  const box = $('shortList');
  const keep = window.scrollY;
  box.textContent = '';
  $('sDoneVal').textContent = String(
    Object.values(state.shorts.items).filter((x) => x.status === 'done').length
  );

  if (!state.shorts.images.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = '아직 쓴 단편이 없습니다.';
    box.append(p);
    window.scrollTo(0, keep);
    return;
  }

  state.shorts.images.forEach((img, i) => box.append(shortNode(img, i)));
  window.scrollTo(0, keep);
}

function shortNode(img, index) {
  const item = shortAt(img.id);
  const text = shortText(item);

  const card = document.createElement('article');
  card.className = `short ${item.status === 'busy' ? 'busy' : ''} ${item.status === 'error' ? 'fail' : ''}`;
  card.dataset.s = img.id;

  const photo = document.createElement('img');
  photo.src = img.url;
  photo.alt = img.name;
  photo.loading = 'lazy';

  const body = document.createElement('div');
  body.className = 'short-body';

  const head = document.createElement('div');
  head.className = 'short-head';
  const label = document.createElement('span');
  label.textContent = `${index + 1} · ${img.name}`;
  head.append(label);

  // 언어 단추 — 아직 없는 언어를 누르면 그때 옮긴다
  for (const code of LANG_ORDER) {
    const btn = document.createElement('button');
    btn.type = 'button';
    const has = Boolean(item.texts[code]);
    btn.textContent = LANGS[code].label + (code === item.base ? ' (원문)' : has ? '' : ' +');
    btn.setAttribute('aria-pressed', String((item.lang || item.base) === code));
    btn.disabled = item.status !== 'done' && !has;
    btn.addEventListener('click', () => pickLang(img.id, code));
    head.append(btn);
  }

  const spacer = document.createElement('span');
  spacer.className = 'spacer';
  const again = document.createElement('button');
  again.type = 'button';
  again.textContent = item.status === 'done' ? '다시 쓰기' : '이 사진 쓰기';
  again.addEventListener('click', () => runShorts({ only: img.id }));
  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = '그림으로 저장';
  save.disabled = item.status !== 'done';
  save.addEventListener('click', () => savePoster(img.id));
  const human = document.createElement('button');
  human.type = 'button';
  human.textContent = 'AI 티 빼기';
  human.hidden = !humanReady();
  human.disabled = item.status !== 'done';
  human.addEventListener('click', () => humanizeShorts([img.id]));
  head.append(spacer, human, again, save);

  const title = document.createElement('h3');
  title.className = 'short-title';
  title.contentEditable = state.running ? 'false' : 'true';
  title.spellcheck = false;
  title.textContent = text.title;
  title.addEventListener('input', () => {
    const cur = item.texts[item.lang || item.base];
    if (cur) { cur.title = title.innerText.trim(); scheduleSave(1200); }
  });

  const prose = document.createElement('div');
  prose.className = 'prose';
  prose.contentEditable = state.running ? 'false' : 'true';
  prose.spellcheck = false;
  prose.textContent = text.body;
  prose.addEventListener('input', () => {
    const cur = item.texts[item.lang || item.base];
    if (cur) { cur.body = prose.innerText; scheduleSave(1200); }
  });

  body.append(head, title, prose);
  if (item.error) {
    const e = document.createElement('p');
    e.className = 'err';
    e.textContent = item.error;
    body.append(e);
  }
  card.append(photo, body);
  return card;
}

function shortProse(id) {
  return document.querySelector(`.short[data-s="${id}"] .prose`);
}

/* ------------------------------------------------------------- 생성 */

function shortPreflight() {
  if (!$('apiKey').value.trim()) { sStatus('API 키를 입력해 주세요.', true); return false; }
  if (!modelName()) { sStatus('모델을 선택하거나 이름을 입력해 주세요.', true); return false; }
  if (!state.shorts.images.length) { sStatus('사진을 먼저 올려 주세요.', true); return false; }
  return true;
}

function setShortsRunning(on) {
  state.running = on;
  for (const id of ['sRunBtn', 'sResumeBtn', 'runBtn', 'resumeBtn']) $(id).disabled = on;
  $('sStopBtn').hidden = !on;
  document.querySelectorAll('.short .prose, .short-title').forEach((el) => {
    el.contentEditable = on ? 'false' : 'true';
  });
}

async function writeShort(img, o, signal) {
  const item = shortAt(img.id);
  const index = state.shorts.images.indexOf(img);
  item.status = 'busy';
  item.error = '';
  renderShorts();

  const limit = Number(o.retryRefusal) || 0;
  let attempt = 0;
  for (;;) {
    let failure = '';
    try {
      await waitForOnline(signal);
      let raw = '';
      const res = await generate({
        apiKey: $('apiKey').value.trim(),
        model: modelName(),
        system: buildShortSystem(o),
        parts: buildShortParts({
          image: img,
          index,
          total: state.shorts.images.length,
          opts: { retryNote: retryNote(attempt, o.soften) }
        }),
        generationConfig: genConfig(),
        thinkingBudget: thinkingBudget(),
        state: state.api,
        signal,
        onDelta: (t) => {
          raw += t;
          const node = shortProse(img.id);
          if (node) node.textContent = splitTitle(raw).body;
        }
      });
      const cut = splitTitle(res.text || '');
      if (cut.body.trim()) {
        item.base = o.shortLang;
        item.lang = o.shortLang;
        item.texts = { [o.shortLang]: { title: cut.title, body: cut.body.trim() } };
        item.status = 'done';
        item.error = res.finishReason === 'MAX_TOKENS' ? FINISH_MESSAGE.MAX_TOKENS : '';
        renderShorts();
        scheduleSave(0);
        if (humanReady() && $('humanWhen').value === 'auto') {
          await humanizeShorts([img.id], { signal, note: sStatus });
        }
        return item;
      }
      failure = describeFailure({ text: cut.body, finishReason: res.finishReason, blockReason: res.blockReason })?.message
        || '빈 응답을 받았습니다.';
    } catch (err) {
      if (err.name === 'AbortError' || !isWorthRetrying(err) || limit === 0) throw err;
      failure = err.message;
    }

    if (limit >= 0 && attempt >= limit) {
      item.status = 'error';
      item.error = attempt ? `${attempt + 1}번 시도했지만 계속 막혔습니다 — ${failure}` : failure;
      renderShorts();
      scheduleSave(0);
      return item;
    }
    attempt++;
    const wait = Math.min(15000, 1000 * 2 ** (attempt - 1)) + (o.delayMs || 0);
    item.status = 'error';
    item.error = `${failure} · ${Math.round(wait / 1000)}초 뒤 ${attempt}번째 다시 시도합니다`;
    renderShorts();
    sStatus(`${index + 1}번 사진 — ${failure} 다시 시도 ${attempt}회째…`);
    await sleep(wait, signal);
  }
}

async function runShorts({ onlyEmpty = false, only = null } = {}) {
  if (state.running || !shortPreflight()) return;
  const o = opts();
  state.api.safetyStep = Number($('safety').value) || 0;

  const targets = state.shorts.images.filter((img) => {
    if (only) return img.id === only;
    if (!onlyEmpty) return true;
    return state.shorts.items[img.id]?.status !== 'done';
  });
  if (!targets.length) { sStatus('쓸 사진이 없습니다.'); return; }

  const ac = new AbortController();
  state.abort = ac;
  setShortsRunning(true);
  holdScreen();
  saveSettings();

  let done = 0;
  $('sBarIn').style.width = '0%';
  try {
    for (const img of targets) {
      sStatus(`(${done + 1}/${targets.length}) ${img.name} 쓰는 중…`);
      await writeShort(img, o, ac.signal);
      done++;
      $('sBarIn').style.width = `${Math.round((done / targets.length) * 100)}%`;
      if (o.delayMs && done < targets.length) await sleep(o.delayMs, ac.signal);
    }
    const failed = targets.filter((img) => state.shorts.items[img.id]?.status === 'error').length;
    sStatus(failed ? `완료 (실패 ${failed}편 — 다시 쓰기를 눌러 보세요)` : '완료되었습니다.', Boolean(failed));
  } catch (err) {
    for (const img of targets) {
      const item = state.shorts.items[img.id];
      if (item?.status === 'busy') {
        item.status = 'error';
        item.error = err.name === 'AbortError' ? '중단했습니다.' : err.message;
      }
    }
    sStatus(err.name === 'AbortError' ? '중단했습니다.' : `오류: ${err.message}`, err.name !== 'AbortError');
    renderShorts();
    scheduleSave(0);
  } finally {
    setShortsRunning(false);
    releaseScreen();
    state.abort = null;
  }
}

/* --------------------------------------------------------- AI 티 빼기 */

/*
  imnotai.kr 의 윤문을 불러 쓴다. 그 API 는 자기 웹앱용이라 CORS 가 열려 있지 않아서
  사용자가 띄운 중계(프록시)를 한 단계 거친다. 주소가 비어 있으면 기능 자체가 꺼진다.
*/
function humanReady() {
  return Boolean($('humanProxy').value.trim());
}

function humanOpts() {
  return {
    proxy: $('humanProxy').value.trim(),
    mode: $('humanMode').value,
    sanitize: $('humanSanitize').checked
  };
}

/* 한 편을 돌린다. 실패는 부르는 쪽에서 받는다. */
async function humanizeOne(text, signal, note) {
  const res = await humanize({
    ...humanOpts(),
    text,
    signal,
    onProgress: (label) => note(label)
  });
  return res;
}

async function humanizePassages(ids, { signal, note = setStatus } = {}) {
  if (!humanReady() || !ids.length) return;
  const own = !signal;
  const ac = own ? new AbortController() : null;
  if (own) {
    if (state.running) return;
    state.abort = ac;
    setRunning(true);
  }
  let moved = 0;
  try {
    for (const id of ids) {
      const p = passageAt(id);
      if (!p.text.trim()) continue;
      const st = state.steps.find((step) => stepId(step) === id);
      const label = st ? stepTitle(st) : id;
      try {
        const res = await humanizeOne(p.text, own ? ac.signal : signal, (step) => note(`${label} — AI 티 빼는 중… ${step}`));
        p.text = res.text;
        p.status = 'done';
        p.error = res.degraded ? 'AI 티 빼기가 일부만 적용됐습니다.' : '';
        moved++;
        renderStory();
        updateCharCount();
        scheduleSave(0);
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        // 윤문 실패가 본문을 지우면 안 된다. 원문을 그대로 두고 알리기만 한다.
        p.error = `AI 티 빼기 실패 — ${err.message}`;
        renderStory();
        note(p.error, true);
      }
    }
    if (moved) note(`AI 티 빼기를 ${moved}개 대목에 적용했습니다.`);
  } catch (err) {
    if (err.name !== 'AbortError') note(`AI 티 빼기를 멈췄습니다: ${err.message}`, true);
  } finally {
    if (own) { setRunning(false); state.abort = null; }
  }
}

async function humanizeShorts(ids, { signal, note = sStatus } = {}) {
  if (!humanReady() || !ids.length) return;
  const own = !signal;
  const ac = own ? new AbortController() : null;
  if (own) {
    if (state.running) return;
    state.abort = ac;
    setShortsRunning(true);
  }
  let moved = 0;
  try {
    for (const id of ids) {
      const item = shortAt(id);
      const lang = item.lang || item.base;
      const cur = item.texts[lang];
      if (!cur || !cur.body.trim()) continue;
      const img = state.shorts.images.find((i) => i.id === id);
      const label = `${state.shorts.images.indexOf(img) + 1}번 사진`;
      try {
        const res = await humanizeOne(cur.body, own ? ac.signal : signal, (step) => note(`${label} — AI 티 빼는 중… ${step}`));
        cur.body = res.text;
        item.error = res.degraded ? 'AI 티 빼기가 일부만 적용됐습니다.' : '';
        moved++;
        renderShorts();
        scheduleSave(0);
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        item.error = `AI 티 빼기 실패 — ${err.message}`;
        renderShorts();
        note(item.error, true);
      }
    }
    if (moved) note(`AI 티 빼기를 단편 ${moved}편에 적용했습니다.`);
  } catch (err) {
    if (err.name !== 'AbortError') note(`AI 티 빼기를 멈췄습니다: ${err.message}`, true);
  } finally {
    if (own) { setShortsRunning(false); state.abort = null; }
  }
}

/* 연결 확인 — 짧은 한 문장만 보내 본다. */
async function testHumanProxy() {
  const note = $('humanNote');
  note.hidden = false;
  note.textContent = '확인하는 중…';
  if (!humanReady()) { note.textContent = '프록시 주소를 먼저 적어 주세요.'; return; }
  try {
    const res = await humanize({ ...humanOpts(), text: '비가 내리는 저녁이었다. 그는 문을 열고 들어갔다.' });
    note.textContent = `연결됐습니다. 돌려받은 글: ${res.text.trim().slice(0, 60)}`;
  } catch (err) {
    note.textContent = `연결하지 못했습니다: ${err.message}`;
  }
}

/* ------------------------------------------------------------- 번역 */

async function pickLang(id, code) {
  const item = shortAt(id);
  if (item.texts[code]) {                       // 이미 있으면 보여 주기만
    item.lang = code;
    renderShorts();
    scheduleSave(0);
    return;
  }
  if (item.status !== 'done' || state.running) return;
  const engine = $('transEngine').value;
  // 무료 번역기는 키도 모델도 필요 없다. 사진만 있으면 된다.
  if (engine === 'gemini' ? !shortPreflight() : !state.shorts.images.length) {
    if (engine !== 'gemini') sStatus('사진을 먼저 올려 주세요.', true);
    return;
  }

  const source = item.texts[item.base];
  if (!source) return;
  const ac = new AbortController();
  state.abort = ac;
  setShortsRunning(true);
  sStatus(`${LANGS[code].label}로 옮기는 중…`);
  if (engine !== 'gemini') {
    await translateByApi(item, code, source, engine, ac);
    setShortsRunning(false);
    state.abort = null;
    renderShorts();
    scheduleSave(0);
    return;
  }
  try {
    const res = await generate({
      apiKey: $('apiKey').value.trim(),
      model: modelName(),
      system: '너는 소설을 옮기는 번역가다. 요청한 형식의 번역문만 출력한다.',
      parts: buildTranslateParts({ title: source.title, body: source.body, target: code }),
      generationConfig: { ...genConfig(), temperature: Math.min(1, Number($('temperature').value) || 1) },
      thinkingBudget: thinkingBudget(),
      state: state.api,
      signal: ac.signal
    });
    const cut = splitTitle(res.text || '');
    if (!cut.body.trim()) {
      item.error = describeFailure({ text: cut.body, finishReason: res.finishReason, blockReason: res.blockReason })?.message
        || '번역이 비어 있습니다.';
      sStatus(item.error, true);
    } else {
      item.texts[code] = { title: cut.title || source.title, body: cut.body.trim() };
      item.lang = code;
      item.error = '';
      sStatus(`${LANGS[code].label}로 옮겼습니다.`);
    }
  } catch (err) {
    if (err.name !== 'AbortError') sStatus(`옮기지 못했습니다: ${err.message}`, true);
  } finally {
    setShortsRunning(false);
    state.abort = null;
    renderShorts();
    scheduleSave(0);
  }
}

/*
  무료 번역 API 로 옮긴다. 제목과 본문을 따로 보내고, 본문이 길면 나눠 보낸다.
  검열이 없어 모델이 거부하던 글도 그대로 옮겨진다.
*/
async function translateByApi(item, code, source, engine, ac) {
  const common = {
    from: item.base,
    to: code,
    endpoint: $('transEndpoint').value.trim() || DEFAULT_ENDPOINT,
    email: $('transEmail').value.trim(),
    signal: ac.signal
  };

  async function runWith(eng) {
    const label = LANGS[code].label;
    const body = await translateText({
      ...common,
      engine: eng,
      text: source.body,
      onStep: (done, total) => {
        if (total > 1) sStatus(`${label}로 옮기는 중… ${done}/${total} · ${ENGINES[eng].label}`);
      }
    });
    if (!body.trim()) throw new Error('번역이 비어 있습니다.');
    const title = source.title ? await translateText({ ...common, engine: eng, text: source.title }) : '';
    return { title: title.trim() || source.title, body: body.trim() };
  }

  // 자동이면 공개 서버가 막혔을 때 다른 번역기로 한 번 더 해 본다.
  const chain = engine === 'auto' ? ['libre', 'mymemory'] : [engine];
  const failed = [];
  for (const eng of chain) {
    try {
      const text = await runWith(eng);
      item.texts[code] = text;
      item.lang = code;
      item.error = '';
      sStatus(`${LANGS[code].label}로 옮겼습니다 (${ENGINES[eng].label}).`);
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      failed.push(`${ENGINES[eng].label}: ${err.message}`);
      if (eng !== chain[chain.length - 1]) sStatus(`${ENGINES[eng].label} 가 막혔습니다. 다른 번역기로 다시 해 봅니다…`);
    }
  }
  item.error = `옮기지 못했습니다 — ${failed.join(' / ')}`;
  sStatus(item.error, true);
}

/* ------------------------------------------------------- 그림으로 저장 */

function posterOpts() {
  return {
    ...POSTER_DEFAULTS,
    darken: Number($('posterDark').value) / 100,
    fontScale: Number($('posterFont').value) / 1000,
    position: $('posterPos').value,
    align: $('posterAlign').value,
    format: $('posterFormat').value,
    showTitle: $('posterTitle').checked
  };
}

function posterName(img, item, index, ext) {
  const text = shortText(item);
  const base = text.title ? safeFileName(text.title) : safeFileName(img.name).replace(/\.[^.]+$/, '');
  return `${String(index + 1).padStart(2, '0')}-${base}.${ext}`;
}

async function savePoster(id) {
  const img = state.shorts.images.find((x) => x.id === id);
  const item = state.shorts.items[id];
  if (!img || item?.status !== 'done') return;
  const o = posterOpts();
  try {
    sStatus('그림을 만드는 중…');
    const blob = await renderPoster(img, shortText(item), o);
    download(posterName(img, item, state.shorts.images.indexOf(img), o.format === 'image/png' ? 'png' : 'jpg'), blob);
    sStatus(`그림으로 저장했습니다 · ${Math.max(1, Math.round(blob.size / 1024))}KB`);
  } catch (err) {
    sStatus(`그림을 만들지 못했습니다: ${err.message}`, true);
  }
}

async function saveAllPosters() {
  const ready = state.shorts.images.filter((img) => state.shorts.items[img.id]?.status === 'done');
  if (!ready.length) { sStatus('저장할 단편이 없습니다.', true); return; }
  const o = posterOpts();
  const ext = o.format === 'image/png' ? 'png' : 'jpg';
  $('sSaveAll').disabled = true;
  try {
    const files = [];
    for (const [i, img] of ready.entries()) {
      sStatus(`그림 만드는 중 ${i + 1}/${ready.length}…`);
      const item = state.shorts.items[img.id];
      files.push({ name: posterName(img, item, state.shorts.images.indexOf(img), ext), data: await renderPoster(img, shortText(item), o) });
    }
    const blob = await createZip(files);
    download(`photo-shorts-${stamp()}.zip`, blob);
    sStatus(`${ready.length}장을 zip 으로 저장했습니다 · ${(blob.size / 1048576).toFixed(1)}MB`);
  } catch (err) {
    sStatus(`저장하지 못했습니다: ${err.message}`, true);
  } finally {
    $('sSaveAll').disabled = false;
  }
}

function shortsPlainText() {
  const out = [];
  state.shorts.images.forEach((img, i) => {
    const item = state.shorts.items[img.id];
    if (item?.status !== 'done') return;
    const text = shortText(item);
    out.push(`[${i + 1}. ${img.name}]`, text.title ? `제목: ${text.title}` : '', '', text.body, '', '');
  });
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ------------------------------------------------------------- 이벤트 */

async function addShortFiles(files) {
  const arr = Array.from(files || []);
  if (!arr.length) return;
  const note = $('sLoadNote');
  note.hidden = true;
  sStatus('사진을 읽는 중…');
  try {
    const { images, errors } = await collectImages(arr, {
      maxDim: Math.max(0, Number($('maxDim').value) || 0),
      keepOriginal: true,                  // 그림으로 저장할 때 원본 위에 글을 얹는다
      onProgress: (d, t, name) => sStatus(`사진 처리 중 ${d}/${t} ${name}`)
    });
    const before = state.shorts.images.length;
    state.shorts.images = state.shorts.images.concat(images);
    if (before <= 8 && state.shorts.images.length > 8 && $('sImagesBox').open) {
      $('sImagesBox').open = false;
      saveSettings();
    }
    renderShortImages();
    renderShorts();
    scheduleSave(0);
    if (errors.length) { note.hidden = false; note.textContent = errors.join('\n'); }
    sStatus(state.shorts.images.length ? `${state.shorts.images.length}장 준비됨.` : '읽어들인 사진이 없습니다.');
  } catch (err) {
    note.hidden = false;
    note.textContent = err.message;
    sStatus('사진을 읽지 못했습니다.', true);
  }
}

$('sFileInput').addEventListener('change', (e) => { addShortFiles(e.target.files); e.target.value = ''; });
$('sPickFiles').addEventListener('click', () => $('sFileInput').click());
$('sDrop').addEventListener('click', () => $('sFileInput').click());
$('sDrop').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('sFileInput').click(); }
});
['dragenter', 'dragover'].forEach((t) => $('sDrop').addEventListener(t, (e) => {
  e.preventDefault();
  $('sDrop').classList.add('over');
}));
['dragleave', 'drop'].forEach((t) => $('sDrop').addEventListener(t, (e) => {
  e.preventDefault();
  $('sDrop').classList.remove('over');
}));
$('sDrop').addEventListener('drop', (e) => {
  if (e.dataTransfer?.files?.length) addShortFiles(e.dataTransfer.files);
});

$('sSortNow').addEventListener('click', () => {
  state.shorts.images = sortByName(state.shorts.images);
  renderShortImages();
  renderShorts();
  scheduleSave();
});
$('sClearImages').addEventListener('click', () => {
  if (state.shorts.images.length && !confirm('사진과 단편을 모두 지울까요?')) return;
  state.shorts.images.forEach((i) => URL.revokeObjectURL(i.url));
  state.shorts.images = [];
  state.shorts.items = {};
  renderShortImages();
  renderShorts();
  scheduleSave(0);
});
$('sClearAll').addEventListener('click', () => {
  if (Object.keys(state.shorts.items).length && !confirm('쓴 단편을 모두 지울까요? 사진은 남습니다.')) return;
  state.shorts.items = {};
  renderShortImages();
  renderShorts();
  scheduleSave(0);
});

$('sRunBtn').addEventListener('click', () => {
  const written = Object.values(state.shorts.items).some((x) => x.status === 'done');
  if (written && !confirm('이미 쓴 단편을 지우고 처음부터 다시 쓸까요?')) return;
  runShorts({});
});
$('sResumeBtn').addEventListener('click', () => runShorts({ onlyEmpty: true }));
$('sStopBtn').addEventListener('click', () => state.abort?.abort());
$('sSaveAll').addEventListener('click', saveAllPosters);
$('sSaveTxt').addEventListener('click', () => {
  const text = shortsPlainText();
  if (!text) { sStatus('저장할 단편이 없습니다.', true); return; }
  download(`photo-shorts-${stamp()}.txt`, new Blob([text], { type: 'text/plain;charset=utf-8' }));
});

$('posterDark').addEventListener('input', () => { $('posterDarkVal').textContent = `${$('posterDark').value}%`; });
$('posterFont').addEventListener('input', () => { $('posterFontVal').textContent = `${(Number($('posterFont').value) / 10).toFixed(1)}%`; });

/* ------------------------------------------------------------- 탭 */

function showTab(name) {
  state.tab = name === 'shorts' ? 'shorts' : 'series';
  $('viewSeries').hidden = state.tab !== 'series';
  $('viewShorts').hidden = state.tab !== 'shorts';
  document.querySelectorAll('.tabs button').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.view === state.tab));
  });
  saveSettings();
}

document.querySelectorAll('.tabs button').forEach((b) => {
  b.addEventListener('click', () => showTab(b.dataset.view));
});

/* ------------------------------------------------------------- 시작 */

fillSelects();
loadSettings();
$('customModel').hidden = !$('customModelOn').checked;
$('model').disabled = $('customModelOn').checked;
$('temperatureVal').textContent = Number($('temperature').value).toFixed(2);
$('topPVal').textContent = Number($('topP').value).toFixed(2);
syncDropBox();
if (!$('transEndpoint').value.trim()) $('transEndpoint').value = DEFAULT_ENDPOINT;
syncTransBox();
showTab(state.tab);
$('posterDarkVal').textContent = `${$('posterDark').value}%`;
$('posterFontVal').textContent = `${(Number($('posterFont').value) / 10).toFixed(1)}%`;
renderImages();
renderStory();
renderShortImages();
renderShorts();
if (!storageAvailable()) {
  $('optAutosave').checked = false;
  $('optAutosave').disabled = true;
  $('savedInfo').textContent = '이 브라우저에서는 자동 저장을 쓸 수 없습니다.';
} else {
  await restoreWork();
}
