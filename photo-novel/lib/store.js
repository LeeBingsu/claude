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
    // 쓰다 만 대목(busy)은 완성본이 아니다. 조각을 남기면 이어쓰기가 건너뛰어 버린다.
    if (p.status === 'busy') return { text: '', status: 'empty', error: '' };
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

/* 쓰다 만 단편은 저장하지 않는다. 대목과 같은 규칙. */
export function normalizeShorts(items) {
  const out = {};
  for (const [id, item] of Object.entries(items || {})) {
    if (!item || item.status === 'busy') continue;
    const texts = {};
    for (const [lang, t] of Object.entries(item.texts || {})) {
      if (t && (t.title || t.body)) texts[lang] = { title: t.title || '', body: t.body || '' };
    }
    if (!Object.keys(texts).length && item.status !== 'error') continue;
    out[id] = {
      base: item.base || '',
      lang: item.lang || item.base || '',
      texts,
      status: Object.keys(texts).length ? 'done' : 'error',
      error: item.status === 'error' ? item.error || '' : ''
    };
  }
  return out;
}

export async function saveWork({ images, passages, beats, memo, shorts }) {
  const db = await openDb();
  const shortImages = shorts?.images || [];
  try {
    // 두 탭이 같은 사진 창고를 쓰므로, 둘을 합친 것이 "남길 사진" 이다.
    const all = [...images, ...shortImages];
    const wanted = [...new Set(all.map((i) => i.id))];
    const existing = await req(db.transaction(IMAGES, 'readonly').objectStore(IMAGES).getAllKeys());
    const plan = planImageSync(existing.map(String), wanted);

    // 예전 버전이 폰 파일 참조로 저장해 둔 사진은 메모리 복사본으로 한 번 다시 쓴다.
    const have = new Set(existing.map(String));
    const rewrite = all.filter((i) => i.rewrite && !i.broken && have.has(i.id)).map((i) => i.id);

    const t = db.transaction([IMAGES, META], 'readwrite');
    const imageStore = t.objectStore(IMAGES);
    for (const id of plan.del) imageStore.delete(id);
    for (const id of [...plan.put, ...rewrite]) {
      const img = all.find((x) => x.id === id);
      if (!img?.blob || img.broken) continue;      // 못 읽은 사진의 자리표는 저장본을 덮지 않는다
      imageStore.put({
        id: img.id,
        name: img.name,
        mimeType: img.mimeType,
        width: img.width,
        height: img.height,
        converted: img.converted,
        own: true,                        // 폰 파일과 무관한 복사본이라는 표시
        blob: img.blob,
        original: img.original || null   // 그림으로 저장할 때 쓰는 원본
      });
    }
    t.objectStore(META).put({
      order: images.map((i) => i.id),
      passages: normalizePassages(passages),
      beats: beats || {},
      memo: memo || '',
      shorts: { order: shortImages.map((i) => i.id), items: normalizeShorts(shorts?.items) },
      updatedAt: Date.now()
    }, CURRENT);
    await done(t);
    for (const img of all) if (img.rewrite) img.rewrite = false;
  } finally {
    db.close();
  }
}

export async function loadWork() {
  const db = await openDb();
  try {
    const meta = await req(db.transaction(META, 'readonly').objectStore(META).get(CURRENT));
    if (!meta) return null;
    const pick = async (order) => {
      const out = [];
      for (const id of order || []) {
        let row = null;
        // 한 장을 못 읽어도 나머지 사진과 글은 살린다. 못 읽은 자리는 id 만 넘겨 자리를 지킨다.
        // 실패한 요청은 트랜잭션을 통째로 멈추므로 한 장마다 새 트랜잭션으로 읽는다.
        try {
          row = await req(db.transaction(IMAGES, 'readonly').objectStore(IMAGES).get(id));
        } catch {
          row = { id, unreadable: true };
        }
        if (row?.blob || row?.unreadable) out.push(row);   // 중간에 지워진 사진은 건너뛴다
      }
      return out;
    };
    return {
      images: await pick(meta.order),
      passages: meta.passages || {},
      beats: meta.beats || {},
      memo: meta.memo || '',
      shorts: { images: await pick(meta.shorts?.order), items: meta.shorts?.items || {} },
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
