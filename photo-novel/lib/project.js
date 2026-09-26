/* project.js - 사진과 글 전체를 zip 한 덩어리로 내보내고 다시 읽어 들인다. */

export const PROJECT_FILE = 'photo-novel.json';
export const STORY_FILE = 'story.txt';
export const SHORTS_FILE = 'shorts.txt';
export const FORMAT = 'photo-novel';
export const FORMAT_VERSION = 1;

const UNSAFE = new RegExp('[<>:"|?*\\u0000-\\u001f]', 'g');

/* zip 안에서 쓸 안전한 파일 이름. 경로와 특수문자를 걷어낸다. */
export function safeFileName(name) {
  const base = String(name || '').split(/[/\\]/).pop() || 'image';
  const clean = base.replace(UNSAFE, '_').replace(/^\.+/, '_').trim();
  return clean || 'image';
}

/* 순서가 파일 목록에서도 보이도록 번호를 앞에 붙인다. */
export function imageEntryName(index, name, folder = 'images') {
  return `${folder}/${String(index + 1).padStart(3, '0')}-${safeFileName(name)}`;
}

function imageMeta(img, i, folder) {
  return {
    id: img.id,
    file: imageEntryName(i, img.name, folder),
    name: img.name,
    mimeType: img.mimeType,
    width: img.width || 0,
    height: img.height || 0,
    converted: Boolean(img.converted)
  };
}

/*
  내보낼 zip 의 내용물을 만든다.
  images 는 blob 을 들고 있는 레코드, settings 에는 API 키를 넣지 않는다.
*/
export function buildProject({
  images, passages, beats, memo, settings, story,
  shorts = null, shortsText = '', date = new Date()
}) {
  const shortImages = shorts?.images || [];
  const manifest = {
    app: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: date.toISOString(),
    images: images.map((img, i) => imageMeta(img, i, 'images')),
    passages: passages || {},
    beats: beats || {},
    memo: memo || '',
    shorts: {
      images: shortImages.map((img, i) => imageMeta(img, i, 'shorts')),
      items: shorts?.items || {}
    },
    settings: settings || {}
  };

  const files = [{ name: PROJECT_FILE, data: JSON.stringify(manifest, null, 2), compress: true }];
  if (story) files.push({ name: STORY_FILE, data: story, compress: true });
  if (shortsText) files.push({ name: SHORTS_FILE, data: shortsText, compress: true });
  images.forEach((img, i) => {
    files.push({ name: imageEntryName(i, img.name, 'images'), data: img.blob });  // 사진은 이미 압축돼 있다
  });
  shortImages.forEach((img, i) => {
    // 단편은 원본 위에 글을 얹으므로, 남아 있으면 원본 쪽을 담는다.
    files.push({ name: imageEntryName(i, img.name, 'shorts'), data: img.original || img.blob });
  });
  return { manifest, files };
}

export function readManifest(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: '파일 안의 정보를 읽지 못했습니다. 이 앱에서 내보낸 zip 이 맞는지 확인해 주세요.' };
  }
  if (!data || data.app !== FORMAT) {
    return { error: '사진 소설에서 내보낸 파일이 아닙니다.' };
  }
  if (Number(data.version) > FORMAT_VERSION) {
    return { error: `더 새 버전(v${data.version})에서 만든 파일입니다. 앱을 새로고침해 보세요.` };
  }
  return {
    manifest: {
      exportedAt: data.exportedAt || '',
      images: Array.isArray(data.images) ? data.images : [],
      shorts: {
        images: Array.isArray(data.shorts?.images) ? data.shorts.images : [],
        items: data.shorts?.items && typeof data.shorts.items === 'object' ? data.shorts.items : {}
      },
      passages: data.passages && typeof data.passages === 'object' ? data.passages : {},
      beats: data.beats && typeof data.beats === 'object' ? data.beats : {},
      memo: typeof data.memo === 'string' ? data.memo : '',
      settings: data.settings && typeof data.settings === 'object' ? data.settings : {}
    }
  };
}

/*
  zip 에서 읽은 엔트리 목록을 프로젝트로 되돌린다.
  entries: [{ name, bytes }]
  photo-novel.json 이 없으면 그냥 사진만 든 zip 으로 본다.
*/
export function readProject(entries) {
  const byName = new Map(entries.map((e) => [e.name, e.bytes]));
  const file = byName.get(PROJECT_FILE);
  if (!file) return { plainZip: true, images: [] };

  const parsed = readManifest(new TextDecoder().decode(file));
  if (parsed.error) return { error: parsed.error };

  const missing = [];
  const attach = (list) => {
    const out = [];
    for (const meta of list) {
      const bytes = byName.get(meta.file);
      if (!bytes) { missing.push(meta.file); continue; }
      out.push({ ...meta, bytes });
    }
    return out;
  };
  return {
    manifest: parsed.manifest,
    images: attach(parsed.manifest.images),
    shortImages: attach(parsed.manifest.shorts.images),
    missing
  };
}
