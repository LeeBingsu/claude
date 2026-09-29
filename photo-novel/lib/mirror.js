/*
  mirror.js - 작업 전체(사진 원본·글·설정·글꼴)를 zip 하나로 묶어 브라우저 저장소에 "두 번째 사본" 으로 둔다.

  기본 자동 저장(store.js)은 IndexedDB 의 photoNovel 창고에 사진과 글을 나눠 담는다. 그 창고가 깨지거나
  읽히지 않아도(예: 예전 버전의 저장 방식 문제) 이 사본에서 되살릴 수 있도록, 별도의 창고(photoNovelMirror)에
  프로젝트 zip 을 통째로 하나 더 둔다. 주소가 https 라서 Cache Storage 를 쓸 수 있으면 거기에도 함께 둔다.

  한계: 두 곳 모두 같은 사이트의 브라우저 저장소라서, 브라우저의 "사이트 데이터 삭제"를 하면 함께 사라진다.
  그런 경우를 위해 파일 백업(zip 내려받기)이 따로 있다.
*/

const DB_NAME = 'photoNovelMirror';
const STORE = 'files';
const KEY = 'latest';
const CACHE = 'photo-novel-mirror-v1';
const CACHE_URL = 'photo-novel-mirror/latest.zip';   // 가짜 주소. 실제로 요청되지 않는다

export const MIRROR_MAX_BYTES = 250 * 1024 * 1024;   // 이보다 크면 메모리 부담이 커서 사본을 만들지 않는다

export function mirrorAvailable() {
  return typeof indexedDB !== 'undefined';
}

function open() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('다른 탭이 저장소를 잡고 있습니다.'));
  });
}

const wrap = (req) => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });

/* info: { savedAt, photos, bytes } — 화면에 "몇 시 · 사진 n장" 을 보여 줄 때 쓴다. */
export async function saveMirror(blob, info = {}) {
  const meta = { savedAt: Date.now(), size: blob.size, ...info };
  const db = await open();
  try {
    const t = db.transaction(STORE, 'readwrite');
    t.objectStore(STORE).put({ blob, meta }, KEY);
    await new Promise((resolve, reject) => { t.oncomplete = resolve; t.onerror = () => reject(t.error); t.onabort = () => reject(t.error || new Error('저장이 중단되었습니다.')); });
  } finally {
    db.close();
  }
  // Cache Storage 는 https(또는 localhost)에서만 있다. 없으면 건너뛴다.
  if (typeof caches !== 'undefined') {
    try {
      const c = await caches.open(CACHE);
      await c.put(CACHE_URL, new Response(blob, { headers: { 'Content-Type': 'application/zip', 'X-Saved-At': String(meta.savedAt) } }));
    } catch { /* 두 번째 사본의 사본이니 실패해도 그만이다 */ }
  }
  return meta;
}

/* 가장 최근 사본. 없으면 null. IndexedDB 를 못 읽으면 Cache Storage 에서 찾는다. */
export async function loadMirror() {
  try {
    const db = await open();
    try {
      const row = await wrap(db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY));
      if (row?.blob) return { blob: row.blob, meta: row.meta || {} };
    } finally {
      db.close();
    }
  } catch { /* 아래에서 Cache Storage 를 본다 */ }
  if (typeof caches !== 'undefined') {
    try {
      const res = await (await caches.open(CACHE)).match(CACHE_URL);
      if (res) return { blob: await res.blob(), meta: { savedAt: Number(res.headers.get('X-Saved-At')) || 0 } };
    } catch { /* 없는 것으로 본다 */ }
  }
  return null;
}

export async function mirrorInfo() {
  try {
    const db = await open();
    try {
      const row = await wrap(db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY));
      return row?.meta || null;
    } finally {
      db.close();
    }
  } catch {
    return null;
  }
}

export async function clearMirror() {
  try {
    const db = await open();
    try {
      const t = db.transaction(STORE, 'readwrite');
      t.objectStore(STORE).delete(KEY);
      await new Promise((resolve) => { t.oncomplete = resolve; t.onerror = resolve; t.onabort = resolve; });
    } finally {
      db.close();
    }
  } catch { /* 지울 것이 없다 */ }
  if (typeof caches !== 'undefined') {
    try { await caches.delete(CACHE); } catch { /* 무시 */ }
  }
}

/*
  브라우저에 "이 사이트의 저장 공간을 함부로 비우지 말라" 고 요청한다. 브라우저는 저장 공간이 모자랄 때
  이런 표시가 없는 사이트의 데이터부터 지운다. 요청은 https(또는 localhost)에서만 가능하다.
  돌려주는 것: true(보호됨) / false(거절·아직 아님) / null(이 주소에서는 요청할 수 없음)
*/
export async function requestPersistence() {
  if (!globalThis.isSecureContext || !navigator.storage?.persist) return null;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/* 사용량과 보호 상태. 못 알아내면 null 항목이 섞인다. */
export async function storageInfo() {
  const out = { usage: null, quota: null, persisted: null, secure: Boolean(globalThis.isSecureContext) };
  try {
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate();
      out.usage = e.usage ?? null;
      out.quota = e.quota ?? null;
    }
    if (navigator.storage?.persisted) out.persisted = await navigator.storage.persisted();
  } catch { /* 알아낸 만큼만 */ }
  return out;
}
