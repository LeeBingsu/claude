/* images.js - 업로드된 파일(zip 포함)을 Gemini 에 보낼 수 있는 이미지 레코드로 바꾼다. */

import { unzip } from './zip.js';
import { sortByName } from './sort.js';

const EXT_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', jpe: 'image/jpeg',
  png: 'image/png', webp: 'image/webp', gif: 'image/gif', bmp: 'image/bmp',
  heic: 'image/heic', heif: 'image/heif', avif: 'image/avif', tif: 'image/tiff', tiff: 'image/tiff'
};

/* Gemini 가 그대로 받아주는 형식. 나머지는 캔버스로 JPEG 변환한다. */
const API_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

export function extOf(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

export function isImageName(name) {
  const base = (name || '').split('/').pop();
  if (!base || base.startsWith('.')) return false;          // ._foo 같은 리소스 포크 제외
  if ((name || '').startsWith('__MACOSX/')) return false;
  return Boolean(EXT_MIME[extOf(base)]);
}

export function isZipName(name) {
  return extOf(name) === 'zip';
}

function mimeOf(name, fallback) {
  return EXT_MIME[extOf(name)] || fallback || 'application/octet-stream';
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.onload = () => {
      const s = String(reader.result);
      resolve(s.slice(s.indexOf(',') + 1));
    };
    reader.readAsDataURL(blob);
  });
}

async function reencode(blob, maxDim, quality) {
  const bitmap = await createImageBitmap(blob);
  const scale = maxDim > 0 ? Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height)) : 1;
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const out = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!out) throw new Error('이미지를 변환하지 못했습니다.');
  return { blob: out, width: w, height: h };
}

let seq = 0;

/*
  하나의 이미지 blob → 레코드
  opts: { maxDim, quality }  maxDim = 0 이면 원본 그대로 보낸다.
*/
export async function makeImageRecord(name, blob, opts = {}) {
  const maxDim = opts.maxDim ?? 1568;
  const quality = opts.quality ?? 0.85;
  let mimeType = blob.type && blob.type.startsWith('image/') ? blob.type : mimeOf(name, 'image/jpeg');
  let data = blob;
  let width = 0;
  let height = 0;
  let converted = false;

  const needsConvert = !API_MIMES.has(mimeType) || maxDim > 0;
  if (needsConvert) {
    try {
      const bm = await createImageBitmap(blob);
      width = bm.width;
      height = bm.height;
      const tooBig = maxDim > 0 && Math.max(width, height) > maxDim;
      bm.close?.();
      if (tooBig || !API_MIMES.has(mimeType)) {
        const r = await reencode(blob, tooBig ? maxDim : 0, quality);
        data = r.blob;
        width = r.width;
        height = r.height;
        mimeType = 'image/jpeg';
        converted = true;
      }
    } catch {
      // HEIC 처럼 브라우저가 못 그리는 형식은 원본을 그대로 보낸다(모델이 지원하면 통과).
      if (!API_MIMES.has(mimeType)) throw new Error(`${name}: 브라우저가 열 수 없는 이미지 형식입니다.`);
    }
  }

  return {
    id: `img${++seq}`,
    name,
    mimeType,
    width,
    height,
    bytes: data.size,
    converted,
    base64: await blobToBase64(data),
    url: URL.createObjectURL(data)
  };
}

/*
  파일 목록(이미지 + zip 섞여도 됨)을 이미지 레코드 배열로 편다.
  onProgress(done, total, name) 로 진행 상황을 알려준다.
*/
export async function collectImages(files, { maxDim, quality, onProgress } = {}) {
  const raw = [];
  const errors = [];

  for (const file of files) {
    if (isZipName(file.name)) {
      try {
        const buf = await file.arrayBuffer();
        const entries = await unzip(buf, { filter: (e) => isImageName(e.name) });
        if (!entries.length) errors.push(`${file.name}: zip 안에서 이미지를 찾지 못했습니다.`);
        for (const e of entries) {
          raw.push({ name: e.name, blob: new Blob([e.bytes], { type: mimeOf(e.name) }) });
        }
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      }
    } else if (isImageName(file.name)) {
      raw.push({ name: file.webkitRelativePath || file.name, blob: file });
    } else {
      errors.push(`${file.name}: 이미지도 zip 도 아니라서 건너뜁니다.`);
    }
  }

  const ordered = sortByName(raw);
  const out = [];
  for (let i = 0; i < ordered.length; i++) {
    onProgress?.(i, ordered.length, ordered[i].name);
    try {
      out.push(await makeImageRecord(ordered[i].name, ordered[i].blob, { maxDim, quality }));
    } catch (err) {
      errors.push(err.message);
    }
  }
  onProgress?.(ordered.length, ordered.length, '');
  return { images: out, errors };
}
