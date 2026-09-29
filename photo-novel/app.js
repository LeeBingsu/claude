/* app.js - 화면 로직. 설정은 localStorage 에만 저장한다. */

import { collectImages, recordFromStored, makeImageRecord, placeholderRecord, ownCopy } from './lib/images.js';
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
import { buildSettingsFile, readSettingsFile } from './lib/settings-file.js';
import {
  mirrorAvailable, saveMirror, loadMirror, mirrorInfo, clearMirror, requestPersistence, storageInfo, MIRROR_MAX_BYTES
} from './lib/mirror.js';
import {
  SHAPES, TYPES, FONT_PRESETS, FONT_SETS, fontSetFor, applyFontSet, loadFonts, fontKey, makeBubble, normalizeBubble, normalizeComic, copyStyle, parseDialogue,
  sizeBubble, bubblesFromDialogue, hitTest, drawBubbles, drawHandles, renderComic, renderComicStrip,
  comicPlainText, buildComicSystem, buildComicParts, newBubbleId, placeBubble, nextUnplaced, defaultTail
} from './lib/comic.js';

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
  comic: { images: [], items: {}, fonts: [] },   // items: 사진 id → { scenario, bubbles, status, error }
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
  ['autoBackup', 'value'], ['optMirror', 'checked'],
  ['comicCast', 'value'], ['comicInstructions', 'value'], ['comicLang', 'value'], ['comicMax', 'value'],
  ['comicContext', 'checked'], ['comicFormat', 'value'], ['comicFontSet', 'value'], ['cImagesBox', 'open'],
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
let saveDirty = false;    // 저장하지 않은 변경이 있는가. 탭을 덮을 때는 변경이 있을 때만 저장한다
let saveStopped = '';     // 저장 공간 부족 등으로 멈춘 이유

/*
  지난 작업을 다 읽기 전에는 저장하지 않는다.
  읽는 도중(사진이 많으면 몇 초 걸린다) 화면이 꺼지거나 다른 앱으로 넘어가면 pagehide·
  visibilitychange 가 저장을 부르는데, 그때의 화면은 아직 비어 있어서 빈 작업이
  저장된 작업을 덮어써 버렸다. 읽기에 실패했을 때도 마찬가지로 덮어쓰지 않는다.
    pending — 아직 읽는 중,  ok — 읽기를 마쳤거나 읽을 것이 없음,  failed — 읽지 못함
*/
let restoreState = 'pending';

function autosaveOn() {
  return $('optAutosave').checked && !saveStopped && storageAvailable() && restoreState === 'ok';
}

/* 저장된 작업을 읽지 못했을 때 — 빈 화면으로 덮어쓰지 않도록 저장을 멈춘다. */
function holdSaving(reason) {
  restoreState = 'failed';
  clearTimeout(saveTimer);
  saveStopped = `${reason} — 저장된 작업을 덮어쓰지 않도록 자동 저장을 멈췄습니다. 새로고침해 보세요.`;
  $('savedInfo').textContent = saveStopped;
  setStatus(saveStopped, true);
}

/* 잦은 호출을 한 번으로 묶는다. */
function scheduleSave(delay = 600) {
  if (!autosaveOn()) return;
  saveDirty = true;
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
      shorts: state.shorts,
      comic: state.comic
    });
    saveDirty = false;
    showSaved(Date.now());
    scheduleMirror();
    if (!persistAsked) { persistAsked = true; requestPersistence().then(refreshStorageInfo); }
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
  $('savedInfo').textContent = state.images.length || storyChars() || state.shorts.images.length || state.comic.images.length
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
  if (!$('optAutosave').checked || !storageAvailable()) { restoreState = 'ok'; return; }
  let work = null;
  try {
    work = await loadWork();
  } catch (err) {
    holdSaving(`저장된 작업을 불러오지 못했습니다: ${err.message}`);
    return;
  }
  if (!work) { restoreState = 'ok'; return; }
  const passages = migratePassages(work.passages, work.images.length);
  const hasText = Object.values(passages).some((p) => p?.text);
  const hasShorts = (work.shorts?.images || []).length > 0;
  const hasComic = (work.comic?.images || []).length > 0 || Object.keys(work.comic?.items || {}).length > 0;
  if (!work.images.length && !hasText && !hasShorts && !hasComic) { restoreState = 'ok'; return; }

  // 사진은 한 장씩 연다. 못 읽은 사진이 있어도 나머지와 글은 모두 되살린다.
  let broken = 0;
  const open = async (row) => {
    if (!row.unreadable) {
      try { return await recordFromStored(row); } catch { /* 아래에서 자리만 지킨다 */ }
    }
    broken++;
    return placeholderRecord(row);
  };
  try {
    const images = [];
    for (const row of work.images) images.push(await open(row));
    state.images = images;
    state.passages = passages;
    state.beats = work.beats || {};
    state.memo = work.memo;

    const shortImages = [];
    for (const row of work.shorts?.images || []) shortImages.push(await open(row));
    state.shorts = { images: shortImages, items: work.shorts?.items || {} };

    const comicImages = [];
    for (const row of work.comic?.images || []) comicImages.push(await open(row));
    state.comic = { images: comicImages, items: normalizeComic(work.comic?.items), fonts: [] };
    for (const f of work.comic?.fonts || []) await registerComicFont(f.name, f.blob, { persist: false });
  } catch (err) {
    holdSaving(`저장된 사진을 여는 데 실패했습니다: ${err.message}`);
    return;
  }
  restoreState = 'ok';
  // 예전 방식(폰 파일 참조)으로 저장된 사진은 지금 읽힌 김에 복사본으로 다시 저장해 둔다.
  if ([...state.images, ...state.shorts.images, ...state.comic.images].some((i) => i.rewrite)) scheduleSave(0);

  renderImages();
  renderStory();
  renderShortImages();
  renderShorts();
  renderComicImages();
  renderComicList();
  showSaved(work.updatedAt || Date.now());
  const shortsNote = (state.shorts.images.length ? ` · 단편 ${state.shorts.images.length}편` : '')
    + (state.comic.images.length ? ` · 만화 ${state.comic.images.length}컷` : '');
  setStatus(`지난 작업을 불러왔습니다 · 사진 ${state.images.length}장 · ${storyChars().toLocaleString('ko-KR')}자${shortsNote} (${clockOf(work.updatedAt || Date.now())} 저장)`
    + (broken ? `\n사진 ${broken}장은 읽지 못해 회색 칸으로 자리만 지켰습니다. 백업 파일이 있다면 "백업에서 되살리기" 로 불러오세요.` : ''), Boolean(broken));
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
  const comic = {
    left: comicUnfinishedCount(),
    written: Object.values(state.comic.items).some((x) => x?.status === 'done'),
    unit: '컷',
    button: '빈 컷만 이어서',
    note: cStatus,
    run: () => runComic({ onlyEmpty: true }),
    remaining: comicUnfinishedCount
  };
  const tabs = { series, shorts, comic };
  const here = tabs[state.tab] || series;

  // 보고 있지 않은 탭은 알려만 준다
  for (const [name, there] of Object.entries(tabs)) {
    if (name === state.tab || !there.left || !there.written) continue;
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

  const comicLang = $('comicLang');
  for (const [code, v] of Object.entries(LANGS)) comicLang.append(new Option(v.label, code));
  comicLang.value = 'ko';

  const fontSet = $('comicFontSet');
  for (const [key, v] of Object.entries(FONT_SETS)) fontSet.append(new Option(v.label, key));
  fontSet.value = 'shonen';

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
      keepOriginal: true,                  // 줄이기 전 원본도 함께 저장·백업한다
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

/* 세 탭이 하나의 실행 잠금을 쓴다. 하나가 돌면 나머지 시작 단추는 잠근다. */
const RUN_BUTTONS = ['runBtn', 'resumeBtn', 'sRunBtn', 'sResumeBtn', 'cRunBtn', 'cResumeBtn'];
function lockRunButtons(on) {
  for (const id of RUN_BUTTONS) $(id).disabled = on;
}

function setRunning(on) {
  state.running = on;
  lockRunButtons(on);
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
    maybeAutoBackup(setStatus, $('status'));
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

/* 설정 값을 화면 칸에 넣고, 값에 딸린 표시(보이고 숨는 칸, 숫자 표시)를 맞춘다. */
function applyFieldValues(settings) {
  for (const [id, prop] of FIELDS) {
    const el = $(id);
    if (!el || id === 'saveKey' || settings?.[id] === undefined) continue;
    if (id === 'model' && !Array.from(el.options).some((o) => o.value === settings[id])) {
      el.append(new Option(settings[id], settings[id]));
    }
    el[prop] = settings[id];
  }
  $('customModel').hidden = !$('customModelOn').checked;
  $('model').disabled = $('customModelOn').checked;
  $('temperatureVal').textContent = Number($('temperature').value).toFixed(2);
  $('topPVal').textContent = Number($('topP').value).toFixed(2);
  $('posterDarkVal').textContent = `${$('posterDark').value}%`;
  $('posterFontVal').textContent = `${(Number($('posterFont').value) / 10).toFixed(1)}%`;
  syncDropBox();
  syncTransBox();
}

/* ------------------------------------------------------------ 설정 파일 */

$('settingsSave').addEventListener('click', () => {
  const withKey = $('settingsWithKey').checked;
  const apiKey = withKey ? $('apiKey').value.trim() : '';
  const text = buildSettingsFile({
    settings: exportableSettings(),
    theme: document.documentElement.dataset.theme,
    proseScale: state.proseScale,
    apiKey
  });
  download(`photo-novel-settings-${stamp()}.json`, new Blob([text], { type: 'application/json' }));
  const note = state.tab === 'shorts' ? sStatus : setStatus;
  note(`설정 파일을 내려받았습니다${apiKey ? ' (API 키 포함 — 남과 공유하지 마세요)' : ' (API 키 없음)'}.`);
});

$('settingsLoad').addEventListener('click', () => $('settingsInput').click());

$('settingsInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  const note = state.tab === 'shorts' ? sStatus : setStatus;
  if (state.running) { note('생성 중에는 설정을 바꿀 수 없습니다.', true); return; }
  try {
    const got = readSettingsFile(await file.text());
    applyFieldValues(got.settings);
    if (got.theme) document.documentElement.dataset.theme = got.theme;
    if (got.proseScale) setProseScale(got.proseScale, { save: false });
    if (got.apiKey) {
      $('apiKey').value = got.apiKey;
      $('saveKey').checked = true;          // 불러온 키는 다음에도 쓰도록 이 브라우저에 남긴다
    }
    saveSettings();
    renderStory();
    renderShorts();
    const n = Object.keys(got.settings).length;
    note(`설정을 불러왔습니다 · 항목 ${n}개${got.apiKey ? ' · API 키 포함' : ''}`);
  } catch (err) {
    note(`설정을 불러오지 못했습니다: ${err.message}`, true);
  }
});

function hasWork() {
  return Boolean(state.images.length || Object.keys(state.passages).length || state.shorts.images.length || state.comic.images.length);
}

/* 사진 원본·본문·단편·설정을 zip 하나로 — 전체 내보내기와 백업이 같은 파일을 만든다. */
async function projectZip() {
  const { files } = buildProject({
    images: state.images,
    passages: state.passages,
    beats: state.beats,
    memo: state.memo,
    shorts: state.shorts,
    comic: comicForExport(),
    settings: exportableSettings(),
    story: plainText(),
    shortsText: shortsPlainText(),
    comicText: comicPlainText(state.comic.images, state.comic.items)
  });
  return createZip(files);
}

function sizeText(n) {
  return n >= 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`;
}

/*
  백업 파일을 휴대폰에 내려받는다. 사진 원본까지 들어 있어서, 폰에서 사진을 지우거나
  브라우저 저장소가 비워져도 "백업에서 되살리기" 로 그대로 돌아온다.
*/
async function downloadBackup({ note = setStatus, auto = false } = {}) {
  if (!hasWork()) { if (!auto) note('백업할 것이 없습니다.', true); return; }
  note(auto ? '자동 백업 파일을 만드는 중…' : '백업 파일을 만드는 중…');
  try {
    const blob = await projectZip();
    download(`photo-novel-backup-${stamp()}.zip`, blob);
    note(`${auto ? '자동 백업' : '백업'}을 내려받았습니다 · 사진 ${state.images.length + state.shorts.images.length}장 · ${sizeText(blob.size)}`
      + ' — 다운로드 폴더에 있습니다.');
  } catch (err) {
    note(`백업을 만들지 못했습니다: ${err.message}`, true);
  }
}

/*
  글쓰기가 끝날 때마다 자동으로 받는다(설정에서 끌 수 있다).
  "완료 (실패한 대목 n개 …)" 같은 끝 안내는 지우지 않고, 백업 소식을 그 아래 줄에 붙인다.
*/
function maybeAutoBackup(note, el) {
  if ($('autoBackup').value !== 'done') return;
  const before = el.textContent;
  const wasErr = el.classList.contains('err');
  downloadBackup({ note: (msg, err) => note(`${before}\n${msg}`, Boolean(err) || wasErr), auto: true });
}

/* ------------------------------------------------- 브라우저 저장소 사본 */

/*
  자동 저장(IndexedDB)과 별도로, 프로젝트 전체를 zip 하나로 다른 저장소에 한 번 더 둔다.
  기본 저장소가 깨지거나 비어도 이 사본에서 되살린다. 사진이 많으면 만드는 데 시간과 메모리가 들어서
  바뀐 뒤 잠깐 기다렸다가(글쓰기 도중이면 끝난 뒤에) 만든다.
*/
let mirrorTimer = 0;
let mirrorDirty = false;
let mirroring = false;
let persistAsked = false;

function mirrorOn() {
  return $('optMirror').checked && $('optAutosave').checked && mirrorAvailable() && storageAvailable();
}

function workBytes() {
  const sum = (list) => list.reduce((n, i) => n + (i.original?.size || i.blob?.size || 0), 0);
  return sum(state.images) + sum(state.shorts.images) + sum(state.comic.images)
    + state.comic.fonts.reduce((n, f) => n + f.blob.size, 0);
}

function mbText(n) {
  return n >= 1073741824 ? `${(n / 1073741824).toFixed(1)}GB` : `${Math.max(0.1, n / 1048576).toFixed(n >= 10485760 ? 0 : 1)}MB`;
}

async function refreshStorageInfo() {
  const meta = await mirrorInfo();
  $('mirrorInfo').textContent = !$('optMirror').checked
    ? '브라우저 사본이 꺼져 있습니다.'
    : meta
      ? `브라우저 사본: ${clockOf(meta.savedAt)} 저장 · 사진 ${meta.photos ?? '?'}장 · ${mbText(meta.size)}`
      : '브라우저 사본: 아직 없습니다. 작업을 하면 잠시 뒤 만들어집니다.';
  const info = await storageInfo();
  const use = info.usage != null && info.quota != null ? `저장 공간 ${mbText(info.usage)} 사용 (한도 ${mbText(info.quota)})` : '저장 공간 사용량을 알 수 없습니다';
  const keep = info.persisted === true ? ' · 브라우저가 이 사이트 데이터를 지우지 않도록 보호 중'
    : info.secure ? ' · 보호 요청 전 또는 거절됨 (저장 공간이 모자라면 브라우저가 먼저 지울 수 있음)'
      : ' · 이 주소(http)에서는 저장 공간 보호를 요청할 수 없습니다 — https 주소로 열면 가능합니다';
  $('storageInfo').textContent = use + keep;
}

function scheduleMirror(delay = 15000) {
  if (!mirrorOn() || restoreState !== 'ok') return;      // 지난 작업을 다 읽기 전엔 사본을 덮지 않는다
  mirrorDirty = true;
  clearTimeout(mirrorTimer);
  mirrorTimer = setTimeout(mirrorNow, delay);
}

async function mirrorNow({ force = false } = {}) {
  clearTimeout(mirrorTimer);
  if (!mirrorOn() || restoreState !== 'ok' || mirroring) return false;
  if (!mirrorDirty && !force) return false;
  if (state.running) { mirrorTimer = setTimeout(mirrorNow, 10000); return false; }   // 쓰는 중에는 끝난 뒤에
  if (!hasWork()) {                                        // 다 지웠다면 사본도 지운다
    mirrorDirty = false;
    await clearMirror();
    refreshStorageInfo();
    return true;
  }
  if (workBytes() > MIRROR_MAX_BYTES) {
    $('mirrorInfo').textContent = `사진이 ${mbText(workBytes())}로 커서 브라우저 사본은 만들지 않았습니다(한도 ${mbText(MIRROR_MAX_BYTES)}). 파일 백업을 쓰세요.`;
    mirrorDirty = false;
    return false;
  }
  mirroring = true;
  try {
    const blob = await projectZip();
    await saveMirror(blob, { photos: state.images.length + state.shorts.images.length + state.comic.images.length });
    mirrorDirty = false;
    await refreshStorageInfo();
    return true;
  } catch (err) {
    $('mirrorInfo').textContent = `브라우저 사본을 만들지 못했습니다: ${err.name === 'QuotaExceededError' ? '저장 공간이 부족합니다' : err.message}`;
    return false;
  } finally {
    mirroring = false;
  }
}

/* 사본에서 되살린다. auto 면 묻지 않는다(화면이 비어 있을 때 열면서 자동으로). */
async function restoreFromMirror({ auto = false } = {}) {
  const note = auto ? setStatus : tabNote();
  const m = await loadMirror();
  if (!m) { note('브라우저 사본이 없습니다.', true); return false; }
  const ok = await importProjectFile(m.blob, { note, ask: !auto });
  if (ok) {
    const at = m.meta.savedAt ? ` (${clockOf(m.meta.savedAt)} 사본)` : '';
    note(`${auto ? '저장소가 비어 있어 ' : ''}브라우저 사본에서 되살렸습니다${at}. 사진 ${state.images.length + state.shorts.images.length + state.comic.images.length}장 · ${storyChars().toLocaleString('ko-KR')}자`);
  }
  return ok;
}

$('mirrorNow').addEventListener('click', async () => {
  const note = tabNote();
  if (!$('optMirror').checked) { note('브라우저 사본이 꺼져 있습니다. 체크를 켜 주세요.', true); return; }
  if (!hasWork()) { note('사본으로 둘 작업이 없습니다.', true); return; }
  note('브라우저 사본을 만드는 중…');
  const ok = await mirrorNow({ force: true });
  note(ok ? '브라우저 사본을 만들었습니다.' : '브라우저 사본을 만들지 못했습니다. 위 안내를 확인해 주세요.', !ok);
});
$('mirrorRestore').addEventListener('click', () => restoreFromMirror());
$('optMirror').addEventListener('change', async () => {
  if ($('optMirror').checked) { scheduleMirror(1000); }
  else { clearTimeout(mirrorTimer); mirrorDirty = false; await clearMirror(); }
  refreshStorageInfo();
  saveSettings();
});

$('backupNow').addEventListener('click', () => downloadBackup({ note: state.tab === 'shorts' ? sStatus : setStatus }));
$('backupRestore').addEventListener('click', () => $('importInput').click());

$('exportProject').addEventListener('click', async () => {
  if (!hasWork()) {
    setStatus('내보낼 것이 없습니다.', true);
    return;
  }
  const btn = $('exportProject');
  btn.disabled = true;
  setStatus('전체 내보내기를 만드는 중…');
  try {
    const blob = await projectZip();
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

/* 지금 보고 있는 탭의 상태줄 */
function tabNote() {
  return state.tab === 'shorts' ? sStatus : state.tab === 'comic' ? cStatus : setStatus;
}

$('importInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  await importProjectFile(file, { note: tabNote() });
});

/*
  프로젝트 zip(백업·전체 내보내기·브라우저 사본)을 열어 화면에 올린다.
  ask 가 false 면 지금 작업을 덮어쓰는지 묻지 않는다(빈 화면에서 사본을 되살릴 때).
*/
async function importProjectFile(file, { note, ask = true }) {
  if (state.running) { note('생성 중에는 불러올 수 없습니다.', true); return false; }
  note('파일을 여는 중…');
  try {
    const buf = await file.arrayBuffer();
    const entries = await unzip(buf);
    const project = readProject(entries);
    if (project.error) { note(project.error, true); return false; }

    if (project.plainZip) {
      note('사진만 들어 있는 zip 입니다. 사진 올리기로 넣어 주세요.', true);
      return false;
    }
    const has = state.images.length || state.shorts.images.length || state.comic.images.length || Object.values(state.passages).some((p) => p?.text);
    if (ask && has && !confirm('지금 작업을 덮어쓰고 파일의 내용을 불러올까요?')) { note('불러오기를 취소했습니다.'); return false; }

    // 연작·단편·만화 사진은 모두 원본으로 담겨 오므로, 모델에 보낼 크기는 지금 설정대로 다시 만든다.
    // 예전 파일(줄인 사진만 든 것)도 그대로 읽힌다.
    const rebuild = async (list, tag) => {
      const out = [];
      for (const [i, meta] of (list || []).entries()) {
        const blob = new Blob([meta.bytes], { type: meta.mimeType || 'image/jpeg' });
        const rec = await makeImageRecord(meta.name, blob, {
          maxDim: Math.max(0, Number($('maxDim').value) || 0),
          keepOriginal: true
        });
        // 예전 파일에는 id 가 없을 수 있어 그때는 새로 붙인다.
        out.push({ ...rec, id: meta.id || `imp${Date.now().toString(36)}${tag}${i}` });
      }
      return out;
    };
    const images = await rebuild(project.images, 's');
    const shortImages = await rebuild(project.shortImages, 't');
    const comicImages = await rebuild(project.comicImages, 'c');

    state.images.forEach((img) => URL.revokeObjectURL(img.url));
    state.shorts.images.forEach((img) => URL.revokeObjectURL(img.url));
    state.comic.images.forEach((img) => URL.revokeObjectURL(img.url));
    state.images = images;
    state.passages = project.manifest.passages;
    state.beats = project.manifest.beats;
    state.memo = project.manifest.memo;
    state.shorts = { images: shortImages, items: project.manifest.shorts?.items || {} };
    state.comic = { images: comicImages, items: normalizeComic(project.manifest.comic?.items), fonts: [] };
    for (const f of project.comicFonts || []) {
      await registerComicFont(f.name, new Blob([f.bytes], { type: 'font/ttf' }), { persist: false });
    }

    // 설정도 함께 복원한다. 키는 파일에 없으니 화면의 것을 그대로 둔다.
    applyFieldValues(project.manifest.settings);

    renderImages();
    renderStory();
    renderShortImages();
    renderShorts();
    renderComicImages();
    renderComicList();
    saveSettings();
    // 직접 고른 파일로 바꾸는 것이니, 저장본을 읽지 못해 멈춰 둔 저장도 다시 연다.
    restoreState = 'ok';
    saveStopped = '';
    scheduleSave(0);

    const when = project.manifest.exportedAt ? ` (${clockOf(Date.parse(project.manifest.exportedAt))} 내보낸 파일)` : '';
    const lost = project.missing?.length ? ` · 사진 ${project.missing.length}장은 파일에 없어 빠졌습니다` : '';
    const shortsNote = (shortImages.length ? ` · 단편 사진 ${shortImages.length}장` : '')
      + (comicImages.length ? ` · 만화 컷 ${comicImages.length}장` : '');
    note(`불러왔습니다 · 사진 ${images.length}장${shortsNote} · ${storyChars().toLocaleString('ko-KR')}자${when}${lost}`, Boolean(lost));
    return true;
  } catch (err) {
    note(`불러오지 못했습니다: ${err.message}`, true);
    return false;
  }
}

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
  try { await clearWork(); restoreState = 'ok'; } catch { /* 지울 게 없으면 그만 */ }
  clearTimeout(mirrorTimer);
  mirrorDirty = false;
  await clearMirror();                       // 자동 저장을 끄면 두 번째 사본도 함께 지운다
  refreshStorageInfo();
  $('savedInfo').textContent = '자동 저장이 꺼져 있습니다. 새로고침하면 사진과 본문이 사라집니다.';
});

$('clearSaved').addEventListener('click', async () => {
  if (!confirm('이 브라우저에 저장된 사진과 본문을 지울까요? (두 번째 사본도 함께 지웁니다.) 화면에 있는 내용은 그대로 남습니다.')) return;
  try {
    clearTimeout(saveTimer);
    saveDirty = false;            // 화면에 남은 내용을 탭을 닫을 때 다시 저장하지 않는다
    await clearWork();
    clearTimeout(mirrorTimer);
    mirrorDirty = false;
    await clearMirror();          // 사본이 남아 있으면 열 때마다 되살아나므로 함께 지운다
    refreshStorageInfo();
    saveStopped = '';
    restoreState = 'ok';          // 지켜야 할 저장본이 없으니 다시 저장해도 된다
    $('savedInfo').textContent = $('optAutosave').checked
      ? '저장된 작업을 지웠습니다. 다음 변경부터 다시 저장됩니다.'
      : '저장된 작업을 지웠습니다.';
  } catch (err) {
    $('savedInfo').textContent = `지우지 못했습니다: ${err.message}`;
  }
});

// 탭을 덮거나 닫을 때, 아직 미뤄 둔 저장을 흘려보낸다.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { if (saveDirty) flushSave(); mirrorNow(); } });
window.addEventListener('pagehide', () => { if (saveDirty) flushSave(); });

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
  lockRunButtons(on);
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
    maybeAutoBackup(sStatus, $('sStatus'));
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

/* =============================================================== 만화 */

/*
  사진 한 장이 한 컷. 컷마다 시나리오를 적으면 Gemini 가 사진과 시나리오를 보고 대사를 쓰고,
  그것이 말풍선 데이터(lib/comic.js)로 바뀌어 사진 위에 얹힌다. 말풍선은 끌어서 옮기고 크기·꼬리·모양·
  색·글자체를 고칠 수 있고, 미리보기와 저장 그림이 같은 그리기 코드를 쓴다.
*/

const PREVIEW_W = 1000;                 // 미리보기 캔버스와 크기 계산의 기준 가로폭
const comicView = new Map();            // 컷 id → { canvas, el, W, H, ready, raf }
const comicUi = { panelId: '', bubbleId: '', pendingId: '' };   // pendingId: 다음에 터치로 놓을 말풍선
let comicLastStyle = null;              // 마지막으로 고친 글자체·색. 새로 만드는 말풍선이 이어받는다.

function comicAt(id) {
  if (!state.comic.items[id]) state.comic.items[id] = { scenario: '', bubbles: [], status: 'empty', error: '' };
  return state.comic.items[id];
}

function cStatus(text, bad) {
  const el = $('cStatus');
  el.textContent = text;
  el.classList.toggle('err', Boolean(bad));
}

function comicUnfinishedCount() {
  return state.comic.images.filter((img) => state.comic.items[img.id]?.status !== 'done').length;
}

/* 글 폭을 재는 도구. 말풍선 크기를 글에 맞출 때 쓴다. */
const measureCtx = document.createElement('canvas').getContext('2d');
function measureFor(font) {
  measureCtx.font = font;
  return (s) => measureCtx.measureText(s).width;
}

function comicDims(img) {
  const ratio = img.width && img.height ? img.height / img.width : 0.75;
  return { W: PREVIEW_W, H: Math.round(PREVIEW_W * ratio) };
}

function comicForExport() {
  return { images: state.comic.images, items: normalizeComic(state.comic.items), fonts: state.comic.fonts };
}

/* ------------------------------------------------------------ 글꼴 */

function fontOptions() {
  const sel = $('cpFont');
  sel.textContent = '';
  const groups = {};
  for (const [key, f] of Object.entries(FONT_PRESETS)) {
    if (!groups[f.group]) { groups[f.group] = document.createElement('optgroup'); groups[f.group].label = f.group; }
    groups[f.group].append(new Option(f.label, key));
  }
  for (const g of Object.values(groups)) sel.append(g);
  if (state.comic.fonts.length) {
    const up = document.createElement('optgroup');
    up.label = '올린 글꼴';
    for (const f of state.comic.fonts) up.append(new Option(f.name, f.name));
    sel.append(up);
  }
  sel.append(new Option('직접 입력…', '__custom'));
}

/* 글꼴 파일을 브라우저에 등록한다. 등록해 두면 글꼴 이름만으로 그리기에 쓰인다. */
async function registerComicFont(name, blob, { persist = true } = {}) {
  const face = new FontFace(name, await blob.arrayBuffer());
  await face.load();
  document.fonts.add(face);
  const own = persist ? await ownCopy(blob, blob.type) : blob;
  const at = state.comic.fonts.findIndex((f) => f.name === name);
  if (at >= 0) state.comic.fonts[at] = { name, blob: own };
  else state.comic.fonts.push({ name, blob: own });
  fontOptions();
  if (persist) scheduleSave(0);
}

/* ------------------------------------------------------------ 사진 목록 */

function renderComicImages() {
  const list = $('cImageList');
  list.textContent = '';
  $('cCountVal').textContent = String(state.comic.images.length);
  $('cListHint').textContent = state.comic.images.length
    ? `(${state.comic.images.length}컷 · 누르면 접기/펴기)` : '(0컷)';

  state.comic.images.forEach((img, i) => {
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
    const n = state.comic.items[img.id]?.bubbles?.length || 0;
    sub.textContent = `${img.width ? `${img.width}×${img.height} · ` : ''}${n ? `말풍선 ${n}개` : '말풍선 없음'}`;
    meta.append(name, sub);
    const acts = document.createElement('div');
    acts.className = 'acts';
    acts.append(
      actBtn('▲', '위로', () => moveComic(i, -1)),
      actBtn('▼', '아래로', () => moveComic(i, 1)),
      actBtn('✕', '삭제', () => removeComic(i))
    );
    li.append(idx, thumb, meta, acts);
    list.append(li);
  });
}

function moveComic(i, d) {
  const j = i + d;
  if (j < 0 || j >= state.comic.images.length) return;
  const [x] = state.comic.images.splice(i, 1);
  state.comic.images.splice(j, 0, x);
  renderComicImages();
  renderComicList();
  scheduleSave();
}

function removeComic(i) {
  const [x] = state.comic.images.splice(i, 1);
  URL.revokeObjectURL(x.url);
  delete state.comic.items[x.id];
  if (comicUi.panelId === x.id) selectBubble('', '');
  renderComicImages();
  renderComicList();
  scheduleSave(0);
}

/* ------------------------------------------------------------ 컷 편집 화면 */

function bubbleLabel(b, n) {
  const who = b.speaker ? `${b.speaker}: ` : '';
  const txt = (b.text || '').replace(/\s+/g, ' ');
  return `${n + 1} · ${who}${txt.length > 14 ? `${txt.slice(0, 14)}…` : txt || '(빈 말풍선)'}`;
}

function renderComicList() {
  const box = $('cList');
  const keep = window.scrollY;
  // 고치는 칸은 목록을 지우기 전에 빼 둔다. 그대로 두면 함께 지워진다.
  $('viewComic').append($('comicProps'));
  $('comicProps').hidden = true;
  for (const v of comicView.values()) cancelAnimationFrame(v.raf);
  comicView.clear();
  box.textContent = '';
  $('cDoneVal').textContent = String(
    Object.values(state.comic.items).filter((x) => x.status === 'done').length
  );

  if (!state.comic.images.length) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = '사진을 올리면 컷이 여기에 나타납니다.';
    box.append(p);
    return;
  }
  state.comic.images.forEach((img, i) => box.append(comicCard(img, i)));
  if (comicUi.panelId && comicUi.bubbleId) selectBubble(comicUi.panelId, comicUi.bubbleId);
  window.scrollTo(0, keep);
}

function comicCard(img, index) {
  const item = comicAt(img.id);
  const card = document.createElement('section');
  card.className = `comic ${item.status === 'busy' ? 'busy' : ''} ${item.status === 'error' ? 'fail' : ''}`;
  card.dataset.c = img.id;

  const head = document.createElement('div');
  head.className = 'comic-head';
  const label = document.createElement('span');
  label.textContent = `컷 ${index + 1} · ${img.name}`;
  const spacer = document.createElement('span');
  spacer.className = 'spacer';
  const write = document.createElement('button');
  write.type = 'button';
  write.textContent = item.bubbles.length ? '대사 다시 만들기' : '대사 만들기';
  write.addEventListener('click', () => runComic({ only: img.id }));
  const add = document.createElement('button');
  add.type = 'button';
  add.textContent = '＋ 말풍선';
  add.addEventListener('click', () => addBubble(img.id));
  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = '그림으로 저장';
  save.addEventListener('click', () => saveComicPanel(img.id));
  head.append(label, spacer, write, add, save);

  const scenario = document.createElement('textarea');
  scenario.className = 'comic-scenario';
  scenario.rows = 2;
  scenario.value = item.scenario;
  scenario.placeholder = '이 컷의 시나리오를 간단히. 예) 하린이 문을 열자 지오가 놀라 돌아본다. 지오는 "왜 이제 와?" 라고 묻는다.';
  scenario.addEventListener('input', () => {
    item.scenario = scenario.value;
    scheduleSave(1200);
  });

  const hint = document.createElement('p');
  hint.className = 'place-hint';
  hint.hidden = true;

  const stage = document.createElement('div');
  stage.className = 'comic-stage';
  const canvas = document.createElement('canvas');
  canvas.className = 'comic-canvas';
  const { W, H } = comicDims(img);
  canvas.width = W;
  canvas.height = H;
  stage.append(canvas);

  const chips = document.createElement('div');
  chips.className = 'chips';
  const slot = document.createElement('div');
  slot.className = 'props-slot';
  const err = document.createElement('p');
  err.className = 'err';
  err.textContent = item.error || '';
  err.hidden = !item.error;

  card.append(head, scenario, hint, stage, chips, slot, err);

  const view = { canvas, chips, hint, el: new Image(), W, H, ready: false, raf: 0 };
  comicView.set(img.id, view);
  view.el.onload = () => { view.ready = true; drawComic(img.id); };
  view.el.src = img.url;
  bindCanvas(img.id, canvas);
  renderChips(img.id);
  return card;
}

function renderChips(id) {
  const view = comicView.get(id);
  if (!view) return;
  const item = comicAt(id);
  view.chips.textContent = '';
  const pend = nextUnplaced(item.bubbles, comicUi.pendingId);
  item.bubbles.forEach((b, n) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `chip ${b.placed ? '' : 'todo'}`;
    btn.textContent = `${b.placed ? '' : '미배치 · '}${bubbleLabel(b, n)}`;
    btn.setAttribute('aria-pressed', String(comicUi.panelId === id && comicUi.bubbleId === b.id));
    if (pend && pend.id === b.id) btn.dataset.next = '1';
    btn.addEventListener('click', () => {
      if (!b.placed) comicUi.pendingId = b.id;               // 놓을 차례를 이 말풍선으로
      selectBubble(id, b.id);
    });
    view.chips.append(btn);
  });
  renderPlaceHint(id);
}

/* 사진 위에 아직 놓지 않은 말풍선이 있으면, 무엇을 놓을 차례인지 알려 준다. */
function renderPlaceHint(id) {
  const view = comicView.get(id);
  if (!view) return;
  const item = comicAt(id);
  const left = item.bubbles.filter((b) => !b.placed);
  const pend = nextUnplaced(item.bubbles, comicUi.pendingId);
  view.hint.hidden = !pend;
  view.canvas.classList.toggle('placing', Boolean(pend));
  if (!pend) return;
  const n = item.bubbles.indexOf(pend);
  view.hint.textContent = `👆 사진을 터치해서 「${bubbleLabel(pend, n)}」 말풍선을 놓으세요`
    + ` (남은 ${left.length}개). 터치한 채 말하는 사람 쪽으로 끌면 꼬리가 그쪽을 가리킵니다.`
    + ' 다른 것을 먼저 놓으려면 아래 목록에서 고르세요.';
}

/* 쓰는 글꼴이 바뀌었으면 불러온 뒤 다시 그린다. 그 사이에는 대체 글꼴로 먼저 보여 준다. */
function ensureComicFonts(id) {
  const view = comicView.get(id);
  const item = state.comic.items[id];
  if (!view || !item) return;
  const key = fontKey(item.bubbles);
  if (view.fontKey === key) return;
  view.fontKey = key;
  loadFonts(item.bubbles).then(() => scheduleDraw(id));
}

function drawComic(id) {
  const view = comicView.get(id);
  if (!view?.ready) return;
  const item = comicAt(id);
  ensureComicFonts(id);
  const ctx = view.canvas.getContext('2d');
  ctx.clearRect(0, 0, view.W, view.H);
  ctx.drawImage(view.el, 0, 0, view.W, view.H);
  drawBubbles(ctx, item.bubbles, view.W, view.H);
  if (comicUi.panelId === id) {
    const b = item.bubbles.find((x) => x.id === comicUi.bubbleId);
    if (b?.placed) drawHandles(ctx, b, view.W, view.H);
  }
}

function scheduleDraw(id) {
  const view = comicView.get(id);
  if (!view) return;
  cancelAnimationFrame(view.raf);
  view.raf = requestAnimationFrame(() => drawComic(id));
}

function redrawAllComic() {
  for (const id of comicView.keys()) scheduleDraw(id);
}

/* ---------------------------------------------------- 끌어서 옮기기 */

function bindCanvas(id, canvas) {
  let drag = null;
  const point = (e) => {
    const r = canvas.getBoundingClientRect();
    return { nx: (e.clientX - r.left) / r.width, ny: (e.clientY - r.top) / r.height, k: canvas.width / r.width };
  };
  const hitAt = (e) => {
    const { nx, ny, k } = point(e);
    const item = comicAt(id);
    const sel = comicUi.panelId === id ? comicUi.bubbleId : '';
    return { nx, ny, hit: hitTest(item.bubbles, nx, ny, canvas.width, canvas.height, sel, 16 * k) };
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (state.running) return;
    const { nx, ny, hit } = hitAt(e);
    if (!hit) {
      // 놓을 말풍선이 남아 있으면 터치한 자리에 놓는다. 자리는 언제나 사용자가 정한다.
      const item = comicAt(id);
      const pend = nextUnplaced(item.bubbles, comicUi.pendingId);
      if (pend) {
        placeBubble(pend, nx, ny);
        item.status = 'done';
        comicUi.pendingId = '';
        drag = { part: 'place', id: pend.id, x0: e.clientX, y0: e.clientY, moved: false };
        canvas.setPointerCapture(e.pointerId);
        selectBubble(id, pend.id);
        scheduleSave(600);
        e.preventDefault();
        return;
      }
      selectBubble('', '');
      return;
    }
    const b = comicAt(id).bubbles.find((x) => x.id === hit.id);
    if (comicUi.panelId !== id || comicUi.bubbleId !== hit.id) selectBubble(id, hit.id);
    drag = { part: hit.part, id: hit.id, nx, ny, snap: { x: b.x, y: b.y, w: b.w, h: b.h } };
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag) {
      const { hit } = hitAt(e);
      canvas.style.cursor = !hit ? 'default' : hit.part === 'resize' ? 'nwse-resize' : hit.part === 'tail' ? 'crosshair' : 'move';
      return;
    }
    const { nx, ny } = point(e);
    const b = comicAt(id).bubbles.find((x) => x.id === drag.id);
    if (!b) return;
    if (drag.part === 'place') {
      // 놓은 뒤 터치한 채 끌면 꼬리 끝이 손가락을 따라간다. 조금 움직인 것은 흔들림으로 본다.
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 12) return;
      drag.moved = true;
      b.tail = { on: b.shape !== 'box' && b.shape !== 'text', x: nx, y: ny };
      scheduleDraw(id);
      return;
    }
    const dx = nx - drag.nx;
    const dy = ny - drag.ny;
    if (drag.part === 'body') {
      b.x = Math.min(1.5, Math.max(-0.5, drag.snap.x + dx));
      b.y = Math.min(1.5, Math.max(-0.5, drag.snap.y + dy));
    } else if (drag.part === 'resize') {
      b.w = Math.min(1.5, Math.max(0.04, drag.snap.w + dx));
      b.h = Math.min(1.5, Math.max(0.03, drag.snap.h + dy));
    } else {
      b.tail.x = nx;
      b.tail.y = ny;
    }
    syncProps();
    scheduleDraw(id);
  });

  const end = () => {
    if (!drag) return;
    const placed = drag.part === 'place';
    drag = null;
    scheduleSave(600);
    if (placed) { renderChips(id); syncProps(); }     // 다음에 놓을 말풍선 안내로
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  // 손가락으로 말풍선을 끄는 동안에는 화면이 스크롤되지 않게 한다.
  canvas.addEventListener('touchmove', (e) => { if (drag && e.cancelable) e.preventDefault(); }, { passive: false });
}

/* ------------------------------------------------------------ 말풍선 고르기 */

function selectedBubble() {
  const item = state.comic.items[comicUi.panelId];
  const b = item?.bubbles.find((x) => x.id === comicUi.bubbleId);
  return b ? { item, b, id: comicUi.panelId } : null;
}

function selectBubble(panelId, bubbleId) {
  const prev = comicUi.panelId;
  comicUi.panelId = panelId;
  comicUi.bubbleId = bubbleId;
  const sel = selectedBubble();
  if (sel && !sel.b.placed) comicUi.pendingId = sel.b.id;
  const props = $('comicProps');
  if (sel) {
    const slot = document.querySelector(`.comic[data-c="${sel.id}"] .props-slot`);
    if (slot) slot.append(props);
    props.hidden = false;
    syncProps();
  } else {
    props.hidden = true;
    comicUi.panelId = '';
    comicUi.bubbleId = '';
  }
  for (const id of new Set([prev, panelId])) {
    if (!id) continue;
    scheduleDraw(id);
    renderChips(id);
  }
}

/* ------------------------------------------------------------ 고치는 칸 */

const num = (id) => Number($(id).value);

/* 칸 값을 고른 말풍선에서 읽어 채운다. 값을 넣어도 입력 이벤트는 나지 않는다. */
function syncProps() {
  const sel = selectedBubble();
  if (!sel) return;
  const b = sel.b;
  const n = sel.item.bubbles.indexOf(b);
  $('cpTitle').textContent = `말풍선 ${n + 1} · ${TYPES[b.type]}`;
  $('cpText').value = b.text;
  $('cpSpeaker').value = b.speaker;
  $('cpShape').value = b.shape;
  const known = Object.keys(FONT_PRESETS).includes(b.font) || state.comic.fonts.some((f) => f.name === b.font);
  $('cpFont').value = known ? b.font : '__custom';
  $('cpFontCustom').hidden = known;
  $('cpFontCustom').value = known ? '' : b.font;
  $('cpAlign').value = b.align;
  $('cpFill').value = b.fill.length === 4 ? `#${[...b.fill.slice(1)].map((c) => c + c).join('')}` : b.fill;
  $('cpStroke').value = b.stroke.length === 4 ? `#${[...b.stroke.slice(1)].map((c) => c + c).join('')}` : b.stroke;
  $('cpColor').value = b.color.length === 4 ? `#${[...b.color.slice(1)].map((c) => c + c).join('')}` : b.color;
  $('cpAlpha').value = Math.round(b.fillAlpha * 100);
  $('cpAlphaVal').textContent = `${Math.round(b.fillAlpha * 100)}%`;
  $('cpStrokeW').value = Math.round(b.strokeW * 1000);
  $('cpStrokeWVal').textContent = String(Math.round(b.strokeW * 1000));
  $('cpFs').value = Math.round(b.fs * 1000);
  $('cpFsVal').textContent = String(Math.round(b.fs * 1000));
  for (const [id, v] of [['cpX', b.x], ['cpY', b.y], ['cpW', b.w], ['cpH', b.h]]) {
    $(id).value = Math.round(v * 100);
    $(`${id}Val`).textContent = `${Math.round(v * 100)}%`;
  }
  $('cpBold').checked = b.bold;
  $('cpItalic').checked = b.italic;
  $('cpAutoFit').checked = b.autoFit;
  $('cpTail').checked = b.tail.on;
  $('cpTail').disabled = b.shape === 'box' || b.shape === 'text';
  $('cpUnplace').disabled = !b.placed;
  $('cpTitle').textContent += b.placed ? '' : ' · 아직 안 놓음';
}

/* 글꼴·색을 직접 고쳤을 때만(remember) 새로 만드는 말풍선이 그 모양을 이어받는다. */
function editBubble(fn, { remember = false } = {}) {
  const sel = selectedBubble();
  if (!sel) return;
  fn(sel.b, sel);
  sel.item.status = 'done';
  if (remember) comicLastStyle = { ...comicLastStyle, font: sel.b.font, color: sel.b.color, stroke: sel.b.stroke, strokeW: sel.b.strokeW };
  scheduleDraw(sel.id);
  scheduleSave(800);
}

function bindProps() {
  const on = (id, evt, fn) => $(id).addEventListener(evt, fn);
  fontOptions();
  const shape = $('cpShape');
  for (const [k, label] of Object.entries(SHAPES)) shape.append(new Option(label, k));

  on('cpText', 'input', () => {
    editBubble((b, s) => { b.text = $('cpText').value; renderChipsSoon(s.id); });
  });
  on('cpSpeaker', 'input', () => editBubble((b, s) => { b.speaker = $('cpSpeaker').value; renderChipsSoon(s.id); }));
  on('cpShape', 'change', () => {
    editBubble((b) => {
      b.shape = $('cpShape').value;
      if (b.shape === 'box' || b.shape === 'text') b.tail.on = false;
    });
    syncProps();
  });
  on('cpFont', 'change', () => {
    const v = $('cpFont').value;
    if (v === '__custom') { $('cpFontCustom').hidden = false; $('cpFontCustom').focus(); return; }
    $('cpFontCustom').hidden = true;
    editBubble((b) => { b.font = v; }, { remember: true });
  });
  on('cpFontCustom', 'input', () => editBubble((b) => { b.font = $('cpFontCustom').value.trim() || 'gothic'; }, { remember: true }));
  on('cpAlign', 'change', () => editBubble((b) => { b.align = $('cpAlign').value; }));
  on('cpFill', 'input', () => editBubble((b) => { b.fill = $('cpFill').value; }));
  on('cpStroke', 'input', () => editBubble((b) => { b.stroke = $('cpStroke').value; }, { remember: true }));
  on('cpColor', 'input', () => editBubble((b) => { b.color = $('cpColor').value; }, { remember: true }));
  on('cpAlpha', 'input', () => {
    editBubble((b) => { b.fillAlpha = num('cpAlpha') / 100; });
    $('cpAlphaVal').textContent = `${num('cpAlpha')}%`;
  });
  on('cpStrokeW', 'input', () => {
    editBubble((b) => { b.strokeW = num('cpStrokeW') / 1000; });
    $('cpStrokeWVal').textContent = String(num('cpStrokeW'));
  });
  on('cpFs', 'input', () => {
    editBubble((b) => { b.fs = num('cpFs') / 1000; });
    $('cpFsVal').textContent = String(num('cpFs'));
  });
  for (const [id, key] of [['cpX', 'x'], ['cpY', 'y'], ['cpW', 'w'], ['cpH', 'h']]) {
    on(id, 'input', () => {
      editBubble((b) => { b[key] = num(id) / 100; if (!b.placed) { b.placed = true; b.tail = defaultTail(b); } });
      renderChips(comicUi.panelId);
      $(`${id}Val`).textContent = `${num(id)}%`;
    });
  }
  on('cpBold', 'change', () => editBubble((b) => { b.bold = $('cpBold').checked; }));
  on('cpItalic', 'change', () => editBubble((b) => { b.italic = $('cpItalic').checked; }));
  on('cpAutoFit', 'change', () => editBubble((b) => { b.autoFit = $('cpAutoFit').checked; }));
  on('cpTail', 'change', () => editBubble((b) => { b.tail.on = $('cpTail').checked; }));

  on('cpFit', 'click', () => {
    const sel = selectedBubble();
    if (!sel) return;
    const { W, H } = comicDims(state.comic.images.find((i) => i.id === sel.id));
    editBubble((b) => sizeBubble(b, measureFor, W, H));
    syncProps();
  });
  on('cpTailReset', 'click', () => {
    editBubble((b) => { b.tail = { on: b.shape !== 'box' && b.shape !== 'text', x: b.x + b.w / 2, y: b.y + b.h + 0.08 }; });
    syncProps();
  });
  on('cpDup', 'click', () => {
    const sel = selectedBubble();
    if (!sel) return;
    const copy = normalizeBubble({ ...structuredClone(sel.b), id: newBubbleId(), x: sel.b.x + 0.03, y: sel.b.y + 0.03 });
    copy.tail = { ...copy.tail, x: sel.b.tail.x, y: sel.b.tail.y };
    sel.item.bubbles.splice(sel.item.bubbles.indexOf(sel.b) + 1, 0, copy);
    scheduleSave(600);
    selectBubble(sel.id, copy.id);
  });
  on('cpDel', 'click', () => {
    const sel = selectedBubble();
    if (!sel) return;
    sel.item.bubbles.splice(sel.item.bubbles.indexOf(sel.b), 1);
    if (!sel.item.bubbles.length) sel.item.status = 'empty';
    scheduleSave(600);
    selectBubble('', '');
    renderChips(sel.id);
    renderComicImages();
    $('cDoneVal').textContent = String(Object.values(state.comic.items).filter((x) => x.status === 'done').length);
  });
  on('cpUnplace', 'click', () => {
    const sel = selectedBubble();
    if (!sel) return;
    sel.b.placed = false;
    comicUi.pendingId = sel.b.id;                      // 바로 다시 터치해서 놓을 수 있게
    scheduleDraw(sel.id);
    scheduleSave(600);
    renderChips(sel.id);
    syncProps();
  });
  on('cpFront', 'click', () => reorderBubble(1));
  on('cpBack', 'click', () => reorderBubble(-1));
  on('cpStyleCut', 'click', () => {
    const sel = selectedBubble();
    if (!sel) return;
    for (const other of sel.item.bubbles) if (other !== sel.b) copyStyle(sel.b, other);
    scheduleDraw(sel.id);
    scheduleSave(600);
    cStatus('이 컷의 모든 말풍선에 같은 모양을 적용했습니다.');
  });
  on('cpStyleAll', 'click', () => {
    const sel = selectedBubble();
    if (!sel) return;
    let n = 0;
    for (const item of Object.values(state.comic.items)) {
      for (const other of item.bubbles) if (other !== sel.b) { copyStyle(sel.b, other); n++; }
    }
    redrawAllComic();
    scheduleSave(600);
    cStatus(`모든 컷의 말풍선 ${n}개에 같은 모양을 적용했습니다.`);
  });

  on('cpFontUpload', 'click', () => $('cpFontFile').click());
  on('cpFontFile', 'change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const name = file.name.replace(/\.[^.]+$/, '').replace(/["'\;{}<>]/g, '').trim().slice(0, 40) || 'font';
    try {
      await registerComicFont(name, file);
      editBubble((b) => { b.font = name; }, { remember: true });
      syncProps();
      redrawAllComic();
      cStatus(`글꼴 "${name}" 을 올렸습니다. 저장·백업에도 함께 들어갑니다.`);
    } catch (err) {
      cStatus(`글꼴을 열지 못했습니다: ${err.message}`, true);
    }
  });
}

function renderChipsSoon(id) {
  const view = comicView.get(id);
  if (!view) return;
  // 글을 치는 동안 칩 하나의 글만 바꿔 준다. 목록을 다시 만들면 입력이 끊긴다.
  const sel = selectedBubble();
  const n = sel ? sel.item.bubbles.indexOf(sel.b) : -1;
  const chip = view.chips.children[n];
  if (chip && sel) chip.textContent = bubbleLabel(sel.b, n);
}

function reorderBubble(dir) {
  const sel = selectedBubble();
  if (!sel) return;
  const list = sel.item.bubbles;
  const at = list.indexOf(sel.b);
  const to = dir > 0 ? list.length - 1 : 0;
  if (at === to) return;
  list.splice(at, 1);
  list.splice(to, 0, sel.b);
  scheduleDraw(sel.id);
  renderChips(sel.id);
  syncProps();
  scheduleSave(600);
}

/* ------------------------------------------------------------ 말풍선 더하기 */

async function addBubble(id) {
  const img = state.comic.images.find((i) => i.id === id);
  if (!img) return;
  const item = comicAt(id);
  const { W, H } = comicDims(img);
  const b = makeBubble({ type: 'say', text: '새 말풍선' }, { fontSet: $('comicFontSet').value, ...(comicLastStyle || {}) });
  await loadFonts([b]);
  sizeBubble(b, measureFor, W, H);
  b.placed = false;                                    // 자리는 사진을 터치해서 정한다
  b.tail = defaultTail(b);
  item.bubbles.push(b);
  item.status = 'done';
  comicUi.pendingId = b.id;
  renderComicImages();
  $('cDoneVal').textContent = String(Object.values(state.comic.items).filter((x) => x.status === 'done').length);
  scheduleSave(600);
  selectBubble(id, b.id);
  cStatus('사진을 터치해서 새 말풍선을 놓으세요.');
}

/* ------------------------------------------------------------ 대사 만들기 */

function comicPreflight() {
  if (!$('apiKey').value.trim()) { cStatus('API 키를 입력해 주세요.', true); return false; }
  if (!modelName()) { cStatus('모델을 선택하거나 이름을 입력해 주세요.', true); return false; }
  if (!state.comic.images.length) { cStatus('컷 사진을 먼저 올려 주세요.', true); return false; }
  return true;
}

function setComicRunning(on) {
  state.running = on;
  lockRunButtons(on);
  $('cStopBtn').hidden = !on;
  $('cRunBtn').textContent = '말풍선 글 만들기';
}

/* 앞선 컷의 시나리오와 대사를 글로 모아 준다. 인물 이름·말투를 이어 가게 하는 참고용이다. */
function comicHistory(index) {
  const out = [];
  for (let i = Math.max(0, index - 6); i < index; i++) {
    const img = state.comic.images[i];
    const item = state.comic.items[img.id];
    if (!item?.bubbles.length) continue;
    out.push({
      index: i,
      scenario: item.scenario.trim().slice(0, 240),
      lines: item.bubbles.map((b) => `${b.speaker || TYPES[b.type]}: ${b.text.replace(/\n/g, ' ')}`)
    });
  }
  return out;
}

async function writeComic(img, o, signal) {
  const item = comicAt(img.id);
  const index = state.comic.images.indexOf(img);
  const keepStyle = item.bubbles.find((b) => b.type === 'say') || item.bubbles[0];
  item.status = 'busy';
  item.error = '';
  renderComicList();

  const max = Math.min(12, Math.max(1, Number($('comicMax').value) || 4));
  const limit = Number(o.retryRefusal) || 0;
  let attempt = 0;
  for (;;) {
    let failure = '';
    try {
      await waitForOnline(signal);
      const res = await generate({
        apiKey: $('apiKey').value.trim(),
        model: modelName(),
        system: buildComicSystem({
          comicInstructions: $('comicInstructions').value,
          comicLangName: LANGS[$('comicLang').value]?.name || '한국어'
        }),
        parts: buildComicParts({
          image: img,
          index,
          total: state.comic.images.length,
          scenario: item.scenario,
          cast: $('comicCast').value,
          history: $('comicContext').checked ? comicHistory(index) : [],
          max,
          retryNote: retryNote(attempt, o.soften)
        }),
        generationConfig: genConfig(),
        thinkingBudget: thinkingBudget(),
        state: state.api,
        signal
      });
      const dialogue = parseDialogue(res.text || '', max);
      if (dialogue.length) {
        // 다시 만들어도 정해 둔 글자체·색은 그대로 두고 글과 자리만 새로 만든다.
        // 정해 둔 색·모양은 이어 가고, 글꼴은 세트의 기본과 다를 때(직접 고른 것)만 이어 간다.
        const fontSet = $('comicFontSet').value;
        const style = keepStyle
          ? {
            color: keepStyle.color, stroke: keepStyle.stroke, strokeW: keepStyle.strokeW,
            fill: keepStyle.fill, shape: keepStyle.shape,
            ...(keepStyle.font !== fontSetFor(fontSet, keepStyle.type) ? { font: keepStyle.font } : {})
          }
          : comicLastStyle || {};
        style.fontSet = fontSet;
        await loadFonts(dialogue.map((d) => makeBubble(d, style)));   // 크기를 재기 전에 글꼴부터
        const { W, H } = comicDims(img);
        item.bubbles = bubblesFromDialogue(dialogue, { measureFor, W, H, style });
        item.status = 'done';
        item.error = res.finishReason === 'MAX_TOKENS' ? FINISH_MESSAGE.MAX_TOKENS : '';
        comicUi.panelId = '';
        comicUi.bubbleId = '';
        comicUi.pendingId = '';
        renderComicImages();
        renderComicList();
        scheduleSave(0);
        return item;
      }
      failure = describeFailure({ text: res.text || '', finishReason: res.finishReason, blockReason: res.blockReason })?.message
        || '대사를 읽지 못했습니다. 모델이 정해진 형식으로 답하지 않았습니다.';
    } catch (err) {
      if (err.name === 'AbortError' || !isWorthRetrying(err) || limit === 0) throw err;
      failure = err.message;
    }

    if (limit >= 0 && attempt >= limit) {
      item.status = 'error';
      item.error = attempt ? `${attempt + 1}번 시도했지만 계속 막혔습니다 — ${failure}` : failure;
      renderComicList();
      scheduleSave(0);
      return item;
    }
    attempt++;
    const wait = Math.min(15000, 1000 * 2 ** (attempt - 1)) + (o.delayMs || 0);
    item.status = 'error';
    item.error = `${failure} · ${Math.round(wait / 1000)}초 뒤 ${attempt}번째 다시 시도합니다`;
    renderComicList();
    cStatus(`컷 ${index + 1} — ${failure} 다시 시도 ${attempt}회째…`);
    await sleep(wait, signal);
  }
}

async function runComic({ onlyEmpty = false, only = null } = {}) {
  if (state.running || !comicPreflight()) return;
  const o = opts();
  state.api.safetyStep = Number($('safety').value) || 0;

  const targets = state.comic.images.filter((img) => {
    if (only) return img.id === only;
    if (!onlyEmpty) return true;
    return state.comic.items[img.id]?.status !== 'done';
  });
  if (!targets.length) { cStatus('만들 컷이 없습니다.'); return; }

  // 손으로 고친 말풍선을 말없이 덮어쓰지 않는다.
  const has = targets.filter((img) => state.comic.items[img.id]?.bubbles?.length);
  if (has.length && !onlyEmpty && !confirm(`이미 말풍선이 있는 컷 ${has.length}개를 새로 만들면 지금 말풍선(손으로 고친 것 포함)이 사라집니다. 계속할까요?`)) {
    return;
  }

  const ac = new AbortController();
  state.abort = ac;
  setComicRunning(true);
  holdScreen();
  saveSettings();

  let done = 0;
  $('cBarIn').style.width = '0%';
  try {
    for (const img of targets) {
      cStatus(`(${done + 1}/${targets.length}) 컷 ${state.comic.images.indexOf(img) + 1} 대사 만드는 중…`);
      await writeComic(img, o, ac.signal);
      done++;
      $('cBarIn').style.width = `${Math.round((done / targets.length) * 100)}%`;
      if (o.delayMs && done < targets.length) await sleep(o.delayMs, ac.signal);
    }
    const failed = targets.filter((img) => state.comic.items[img.id]?.status === 'error').length;
    cStatus(failed ? `완료 (실패 ${failed}컷 — 다시 만들기를 눌러 보세요)` : '대사를 만들었습니다. 각 컷의 사진을 터치해서 말풍선을 놓으세요.', Boolean(failed));
    maybeAutoBackup(cStatus, $('cStatus'));
  } catch (err) {
    for (const img of targets) {
      const item = state.comic.items[img.id];
      if (item?.status === 'busy') {
        item.status = item.bubbles.length ? 'done' : 'error';
        item.error = err.name === 'AbortError' ? '중단했습니다.' : err.message;
      }
    }
    cStatus(err.name === 'AbortError' ? '중단했습니다.' : `오류: ${err.message}`, err.name !== 'AbortError');
    renderComicList();
    scheduleSave(0);
  } finally {
    setComicRunning(false);
    releaseScreen();
    state.abort = null;
  }
}

/* ------------------------------------------------------------ 저장 */

function comicFileName(index, img, ext) {
  const base = safeFileName(img.name).replace(/\.[^.]+$/, '');
  return `comic-${String(index + 1).padStart(3, '0')}-${base}.${ext}`;
}

function comicRenderOpts() {
  const format = $('comicFormat').value === 'image/png' ? 'image/png' : 'image/jpeg';
  return { format, ext: format === 'image/png' ? 'png' : 'jpg' };
}

/* 그림에 들어가지 않는(아직 안 놓은) 말풍선 수 */
function unplacedCount(ids) {
  return ids.reduce((n, id) => n + comicAt(id).bubbles.filter((b) => !b.placed).length, 0);
}
const unplacedNote = (n) => (n ? ` · 아직 안 놓은 말풍선 ${n}개는 그림에 넣지 않았습니다` : '');

async function saveComicPanel(id) {
  const img = state.comic.images.find((i) => i.id === id);
  if (!img) return;
  const { format, ext } = comicRenderOpts();
  cStatus('그림을 만드는 중…');
  try {
    const blob = await renderComic(img, comicAt(id).bubbles, { format });
    download(comicFileName(state.comic.images.indexOf(img), img, ext), blob);
    cStatus(`그림으로 저장했습니다 · ${sizeText(blob.size)}${unplacedNote(unplacedCount([id]))}`);
  } catch (err) {
    cStatus(`저장하지 못했습니다: ${err.message}`, true);
  }
}

$('cSaveAll').addEventListener('click', async () => {
  if (!state.comic.images.length) { cStatus('저장할 컷이 없습니다.', true); return; }
  const { format, ext } = comicRenderOpts();
  const btn = $('cSaveAll');
  btn.disabled = true;
  try {
    const files = [];
    for (const [i, img] of state.comic.images.entries()) {
      cStatus(`그림을 만드는 중 ${i + 1}/${state.comic.images.length}`);
      files.push({ name: comicFileName(i, img, ext), data: await renderComic(img, comicAt(img.id).bubbles, { format }) });
    }
    const blob = await createZip(files);
    download(`comic-${stamp()}.zip`, blob);
    cStatus(`전체 ${files.length}컷을 저장했습니다 · ${sizeText(blob.size)}${unplacedNote(unplacedCount(state.comic.images.map((i) => i.id)))}`);
  } catch (err) {
    cStatus(`저장하지 못했습니다: ${err.message}`, true);
  } finally {
    btn.disabled = false;
  }
});

$('cSaveStrip').addEventListener('click', async () => {
  if (!state.comic.images.length) { cStatus('저장할 컷이 없습니다.', true); return; }
  const { format, ext } = comicRenderOpts();
  const btn = $('cSaveStrip');
  btn.disabled = true;
  cStatus('세로로 이어 붙이는 중…');
  try {
    const blob = await renderComicStrip(
      state.comic.images.map((img) => ({ image: img, bubbles: comicAt(img.id).bubbles })),
      { format }
    );
    download(`comic-strip-${stamp()}.${ext}`, blob);
    cStatus(`한 장으로 저장했습니다 · ${sizeText(blob.size)}${unplacedNote(unplacedCount(state.comic.images.map((i) => i.id)))}`);
  } catch (err) {
    cStatus(`저장하지 못했습니다: ${err.message}`, true);
  } finally {
    btn.disabled = false;
  }
});

$('cSaveTxt').addEventListener('click', () => {
  if (!state.comic.images.length) { cStatus('저장할 것이 없습니다.', true); return; }
  download(`comic-${stamp()}.txt`, new Blob([comicPlainText(state.comic.images, state.comic.items)], { type: 'text/plain;charset=utf-8' }));
});

$('cClearAll').addEventListener('click', () => {
  const any = Object.values(state.comic.items).some((x) => x.bubbles.length);
  if (any && !confirm('모든 컷의 말풍선을 지울까요? 시나리오와 사진은 남습니다.')) return;
  for (const item of Object.values(state.comic.items)) { item.bubbles = []; item.status = 'empty'; item.error = ''; }
  selectBubble('', '');
  renderComicImages();
  renderComicList();
  scheduleSave(0);
});

/* ------------------------------------------------------------ 사진 올리기 */

async function addComicFiles(files) {
  const arr = Array.from(files || []);
  if (!arr.length) return;
  const note = $('cLoadNote');
  note.hidden = true;
  cStatus('사진을 읽는 중…');
  try {
    const { images, errors } = await collectImages(arr, {
      maxDim: Math.max(0, Number($('maxDim').value) || 0),
      keepOriginal: true,                  // 저장할 때 원본 위에 말풍선을 얹는다
      onProgress: (d, t, name) => cStatus(`사진 처리 중 ${d}/${t} ${name}`)
    });
    const before = state.comic.images.length;
    state.comic.images = state.comic.images.concat(images);
    if (before <= 8 && state.comic.images.length > 8 && $('cImagesBox').open) {
      $('cImagesBox').open = false;
      saveSettings();
    }
    renderComicImages();
    renderComicList();
    scheduleSave(0);
    if (errors.length) { note.hidden = false; note.textContent = errors.join('\n'); }
    cStatus(state.comic.images.length ? `${state.comic.images.length}컷 준비됨. 컷마다 시나리오를 적어 주세요.` : '읽어들인 사진이 없습니다.');
  } catch (err) {
    note.hidden = false;
    note.textContent = err.message;
    cStatus('사진을 읽지 못했습니다.', true);
  }
}

$('cFileInput').addEventListener('change', (e) => { addComicFiles(e.target.files); e.target.value = ''; });
$('cPickFiles').addEventListener('click', () => $('cFileInput').click());
$('cDrop').addEventListener('click', () => $('cFileInput').click());
$('cDrop').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('cFileInput').click(); }
});
['dragenter', 'dragover'].forEach((t) => $('cDrop').addEventListener(t, (e) => {
  e.preventDefault();
  $('cDrop').classList.add('over');
}));
['dragleave', 'drop'].forEach((t) => $('cDrop').addEventListener(t, (e) => {
  e.preventDefault();
  $('cDrop').classList.remove('over');
}));
$('cDrop').addEventListener('drop', (e) => addComicFiles(e.dataTransfer?.files));
$('cSortNow').addEventListener('click', () => {
  state.comic.images = sortByName(state.comic.images);
  renderComicImages();
  renderComicList();
  scheduleSave();
});
$('cClearImages').addEventListener('click', () => {
  if (state.comic.images.length && !confirm('컷 사진과 말풍선을 모두 지울까요?')) return;
  state.comic.images.forEach((i) => URL.revokeObjectURL(i.url));
  state.comic.images = [];
  state.comic.items = {};
  selectBubble('', '');
  renderComicImages();
  renderComicList();
  scheduleSave(0);
});

$('cFontSetApply').addEventListener('click', async () => {
  const set = $('comicFontSet').value;
  const total = Object.values(state.comic.items).reduce((n, it) => n + it.bubbles.length, 0);
  if (!total) { cStatus('적용할 말풍선이 없습니다.'); return; }
  if (!confirm(`말풍선 ${total}개의 글꼴을 "${FONT_SETS[set].label}" 로 바꿀까요? 손으로 고른 글꼴도 바뀝니다.`)) return;
  for (const item of Object.values(state.comic.items)) applyFontSet(item.bubbles, set);
  comicLastStyle = null;
  const sel = selectedBubble();
  if (sel) syncProps();
  redrawAllComic();
  scheduleSave(600);
  cStatus(`글꼴 세트를 적용했습니다 · ${FONT_SETS[set].label}`);
});

$('cRunBtn').addEventListener('click', () => runComic({}));
$('cResumeBtn').addEventListener('click', () => runComic({ onlyEmpty: true }));
$('cStopBtn').addEventListener('click', () => state.abort?.abort());
$('comicFormat').addEventListener('change', saveSettings);

bindProps();

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
  state.tab = name === 'shorts' || name === 'comic' ? name : 'series';
  $('viewSeries').hidden = state.tab !== 'series';
  $('viewShorts').hidden = state.tab !== 'shorts';
  $('viewComic').hidden = state.tab !== 'comic';
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
renderComicImages();
renderComicList();
if (!storageAvailable()) {
  $('optAutosave').checked = false;
  $('optAutosave').disabled = true;
  $('savedInfo').textContent = '이 브라우저에서는 자동 저장을 쓸 수 없습니다.';
} else {
  await restoreWork();
  // 기본 저장소가 비었거나 읽히지 않았는데 두 번째 사본이 있으면 거기서 되살린다.
  if (mirrorOn() && !hasWork() && await mirrorInfo()) await restoreFromMirror({ auto: true });
  else if (mirrorOn() && hasWork() && !(await mirrorInfo())) scheduleMirror(4000);   // 사본이 아직 없으면 만든다
  refreshStorageInfo();
}
