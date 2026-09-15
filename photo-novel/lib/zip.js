/* zip.js - 외부 라이브러리 없이 zip 을 읽는다.
   중앙 디렉터리만 파싱하고, 압축 해제는 브라우저 기본 DecompressionStream('deflate-raw') 에 맡긴다. */

const EOCD_SIG = 0x06054b50;
const EOCD64_LOCATOR_SIG = 0x07064b50;
const EOCD64_SIG = 0x06064b50;
const CEN_SIG = 0x02014b50;

const utf8 = new TextDecoder('utf-8');
const utf8Strict = new TextDecoder('utf-8', { fatal: true });

/* 윈도우에서 만든 zip 은 한글 이름이 CP949 인 경우가 많다. */
function decodeName(bytes, isUtf8Flag) {
  if (isUtf8Flag) return utf8.decode(bytes);
  try {
    return utf8Strict.decode(bytes);
  } catch {
    try {
      return new TextDecoder('euc-kr').decode(bytes);   // CP949 상위집합
    } catch {
      return utf8.decode(bytes);
    }
  }
}

function findEocd(view, len) {
  const max = Math.min(len, 22 + 0xffff);
  for (let i = 22; i <= max; i++) {
    const at = len - i;
    if (view.getUint32(at, true) === EOCD_SIG) return at;
  }
  throw new Error('zip 파일이 아니거나 손상되었습니다 (EOCD 없음).');
}

/* zip64 확장 필드(0x0001)에서 0xFFFFFFFF 로 표시된 값을 실제 값으로 바꿔준다. */
function readZip64Extra(view, start, length, need) {
  let p = start;
  const end = start + length;
  while (p + 4 <= end) {
    const id = view.getUint16(p, true);
    const size = view.getUint16(p + 2, true);
    if (id === 0x0001) {
      let q = p + 4;
      const out = {};
      for (const field of need) {
        if (q + 8 > p + 4 + size) break;
        out[field] = Number(view.getBigUint64(q, true));
        q += 8;
      }
      return out;
    }
    p += 4 + size;
  }
  return {};
}

/* zip 의 엔트리 목록(압축 해제 전)을 돌려준다. */
export function listZipEntries(buffer) {
  const view = new DataView(buffer);
  const len = buffer.byteLength;
  const eocd = findEocd(view, len);

  let count = view.getUint16(eocd + 10, true);
  let cenOffset = view.getUint32(eocd + 16, true);

  // zip64 라면 EOCD 바로 앞에 locator 가 있다.
  if (eocd >= 20 && view.getUint32(eocd - 20, true) === EOCD64_LOCATOR_SIG) {
    const eocd64 = Number(view.getBigUint64(eocd - 20 + 8, true));
    if (eocd64 >= 0 && eocd64 + 56 <= len && view.getUint32(eocd64, true) === EOCD64_SIG) {
      count = Number(view.getBigUint64(eocd64 + 32, true));
      cenOffset = Number(view.getBigUint64(eocd64 + 48, true));
    }
  }

  const entries = [];
  let p = cenOffset;
  for (let i = 0; i < count; i++) {
    if (p + 46 > len || view.getUint32(p, true) !== CEN_SIG) break;
    const flags = view.getUint16(p + 8, true);
    const method = view.getUint16(p + 10, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    let compressedSize = view.getUint32(p + 20, true);
    let uncompressedSize = view.getUint32(p + 24, true);
    let localOffset = view.getUint32(p + 42, true);

    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff || localOffset === 0xffffffff) {
      const need = [];
      if (uncompressedSize === 0xffffffff) need.push('uncompressedSize');
      if (compressedSize === 0xffffffff) need.push('compressedSize');
      if (localOffset === 0xffffffff) need.push('localOffset');
      const z = readZip64Extra(view, p + 46 + nameLen, extraLen, need);
      if (z.uncompressedSize !== undefined) uncompressedSize = z.uncompressedSize;
      if (z.compressedSize !== undefined) compressedSize = z.compressedSize;
      if (z.localOffset !== undefined) localOffset = z.localOffset;
    }

    const nameBytes = new Uint8Array(buffer, p + 46, nameLen);
    const name = decodeName(nameBytes, (flags & 0x800) !== 0);
    entries.push({
      name,
      method,
      compressedSize,
      uncompressedSize,
      localOffset,
      encrypted: (flags & 0x1) !== 0,
      directory: name.endsWith('/') || uncompressedSize === 0 && name.endsWith('\\')
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflateRaw(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('이 브라우저는 zip 압축 해제를 지원하지 않습니다. 사진을 그대로 여러 장 선택해 주세요.');
  }
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/* 엔트리 하나의 원본 바이트를 돌려준다. */
export async function readZipEntry(buffer, entry) {
  if (entry.encrypted) throw new Error(`암호가 걸린 파일입니다: ${entry.name}`);
  const view = new DataView(buffer);
  const lo = entry.localOffset;
  if (view.getUint32(lo, true) !== 0x04034b50) throw new Error(`엔트리 헤더가 깨졌습니다: ${entry.name}`);
  const nameLen = view.getUint16(lo + 26, true);
  const extraLen = view.getUint16(lo + 28, true);
  const start = lo + 30 + nameLen + extraLen;
  const raw = new Uint8Array(buffer, start, entry.compressedSize);
  if (entry.method === 0) return raw.slice();
  if (entry.method === 8) return inflateRaw(raw);
  throw new Error(`지원하지 않는 압축 방식(${entry.method})입니다: ${entry.name}`);
}

/* zip 전체를 열고 filter 를 통과한 엔트리만 압축 해제한다. */
export async function unzip(buffer, { filter } = {}) {
  const entries = listZipEntries(buffer).filter((e) => !e.directory && (!filter || filter(e)));
  const out = [];
  for (const entry of entries) {
    out.push({ name: entry.name, bytes: await readZipEntry(buffer, entry) });
  }
  return out;
}

/* ------------------------------------------------------------- zip 쓰기 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

async function deflateRaw(bytes) {
  if (typeof CompressionStream === 'undefined') return null;
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/* zip 은 1980년 기준 DOS 시각을 쓴다. */
function dosTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
  };
}

async function toBytes(data) {
  if (data instanceof Uint8Array) return data;
  if (typeof data === 'string') return new TextEncoder().encode(data);
  if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  throw new Error('zip 에 넣을 수 없는 자료입니다.');
}

/*
  entries: [{ name, data, compress }]
  compress 를 켜면 deflate 로 줄인다(텍스트용). 사진은 이미 압축돼 있어 그대로 담는다.
*/
export async function createZip(entries, { date = new Date() } = {}) {
  const enc = new TextEncoder();
  const stamp = dosTime(date);
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name);
    const raw = await toBytes(entry.data);
    const crc = crc32(raw);

    let method = 0;
    let body = raw;
    if (entry.compress) {
      const packed = await deflateRaw(raw);
      if (packed && packed.length < raw.length) {
        method = 8;
        body = packed;
      }
    }

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x800, true);            // 이름은 UTF-8
    local.setUint16(8, method, true);
    local.setUint16(10, stamp.time, true);
    local.setUint16(12, stamp.date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, body.length, true);
    local.setUint32(22, raw.length, true);
    local.setUint16(26, nameBytes.length, true);
    locals.push(new Uint8Array(local.buffer), nameBytes, body);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x800, true);
    central.setUint16(10, method, true);
    central.setUint16(12, stamp.time, true);
    central.setUint16(14, stamp.date, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, body.length, true);
    central.setUint32(24, raw.length, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint32(42, offset, true);
    centrals.push(new Uint8Array(central.buffer), nameBytes);

    offset += 30 + nameBytes.length + body.length;
  }

  const centralSize = centrals.reduce((a, b) => a + b.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(8, entries.length, true);
  eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, offset, true);

  return new Blob([...locals, ...centrals, new Uint8Array(eocd.buffer)], { type: 'application/zip' });
}
