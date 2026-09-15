/* store.js - 사진과 본문을 IndexedDB 에 담아 두고 다음 방문에 되살린다.
   사진은 Blob 그대로 넣는다(localStorage 는 5MB 남짓이라 사진이 들어가지 않는다). */

const DB_NAME = 'photoNovel';
const DB_VERSION = 1;
const META = 'meta';
const IMAGES = 'images';
const CURRENT = 'current';

export function storageAvailable() {
  return typeof indexedDB !== 'undefined';
}

function req(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDb() {
  if (!storageAvailable()) return Promise.reject(new Error('이 브라우저에서는 자동 저장을 쓸 수 없습니다.'));
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(IMAGES)) db.createObjectStore(IMAGES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
    open.onblocked = () => reject(new Error('다른 탭이 저장소를 잡고 있습니다.'));
  });
}

function done(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('저장이 중단되었습니다.'));
  });
}

/* 이미 넣어 둔 사진은 다시 쓰지 않는다. 사라진 사진만 지운다. */
export function planImageSync(existingIds, wantedIds) {
  const have = new Set(existingIds);
  const want = new Set(wantedIds);
  return {
    put: wantedIds.filter((id) => !have.has(id)),
    del: existingIds.filter((id) => !want.has(id))
  };
}

/* 생성 도중 상태(busy)는 저장하지 않는다. 다음에 열었을 때 멈춘 채로 남지 않도록.
   대목은 b0, end 같은 이름표를 키로 하는 객체다(예전 배열 형식도 그대로 받는다). */
export function normalizePassages(passages) {
  const one = (p) => {
    if (!p) return { text: '', status: 'empty', error: '' };
    const text = p.text || '';
    if (p.status === 'error') return { text, status: 'error', error: p.error || '' };
    return { text, status: text.trim() ? 'done' : 'empty', error: '' };
  };
  if (Array.isArray(passages)) return passages.map(one);
  const out = {};
  for (const [id, p] of Object.entries(passages || {})) {
    const norm = one(p);
    if (norm.text || norm.status === 'error') out[id] = norm;   // 빈 대목은 저장하지 않는다
  }
  return out;
}

export async function saveWork({ images, passages, beats, memo }) {
  const db = await openDb();
  try {
    const wanted = images.map((i) => i.id);
    const existing = await req(db.transaction(IMAGES, 'readonly').objectStore(IMAGES).getAllKeys());
    const plan = planImageSync(existing.map(String), wanted);

    const t = db.transaction([IMAGES, META], 'readwrite');
    const imageStore = t.objectStore(IMAGES);
    for (const id of plan.del) imageStore.delete(id);
    for (const id of plan.put) {
      const img = images.find((x) => x.id === id);
      if (!img?.blob) continue;
      imageStore.put({
        id: img.id,
        name: img.name,
        mimeType: img.mimeType,
        width: img.width,
        height: img.height,
        converted: img.converted,
        blob: img.blob
      });
    }
    t.objectStore(META).put({
      order: wanted,
      passages: normalizePassages(passages),
      beats: beats || {},
      memo: memo || '',
      updatedAt: Date.now()
    }, CURRENT);
    await done(t);
  } finally {
    db.close();
  }
}

export async function loadWork() {
  const db = await openDb();
  try {
    const meta = await req(db.transaction(META, 'readonly').objectStore(META).get(CURRENT));
    if (!meta) return null;
    const store = db.transaction(IMAGES, 'readonly').objectStore(IMAGES);
    const images = [];
    for (const id of meta.order || []) {
      const row = await req(store.get(id));
      if (row?.blob) images.push(row);          // 중간에 지워진 사진은 건너뛴다
    }
    return {
      images,
      passages: meta.passages || {},
      beats: meta.beats || {},
      memo: meta.memo || '',
      updatedAt: meta.updatedAt || 0
    };
  } finally {
    db.close();
  }
}

export async function clearWork() {
  const db = await openDb();
  try {
    const t = db.transaction([IMAGES, META], 'readwrite');
    t.objectStore(IMAGES).clear();
    t.objectStore(META).delete(CURRENT);
    await done(t);
  } finally {
    db.close();
  }
}
