/* run-tests.js - 브라우저 없이 확인할 수 있는 부분만 검증한다.  실행: node test/run-tests.js */

import { deflateRawSync, crc32 } from 'node:zlib';
import { naturalCompare, naturalPathCompare, sortByName } from '../lib/sort.js';
import { listZipEntries, unzip, createZip } from '../lib/zip.js';
import {
  buildSteps, buildSystem, buildStepParts, trimContext, splitMemo, memoDue, MEMO_MARKER,
  parseMemoBlock, appendSettings, buildTimeline, stepId, stepTitle, retryNote,
  splitTitle, buildShortSystem, buildShortParts, buildTranslateParts, LANGS
} from '../lib/prompt.js';
import {
  generate, safetySettingsFor, isRefusal, isWorthRetrying, describeFailure, GeminiError, SAFETY_LADDER
} from '../lib/gemini.js';
import { planImageSync, normalizePassages, normalizeShorts } from '../lib/store.js';
import { wrapLines } from '../lib/poster.js';
import { ownCopy } from '../lib/images.js';
import { buildSettingsFile, readSettingsFile } from '../lib/settings-file.js';
import { buildProject, readProject, readManifest, imageEntryName, safeFileName, PROJECT_FILE } from '../lib/project.js';
import {
  planChunks, byteLen, libreRequest, parseLibre, myMemoryRequest, parseMyMemory, translateText, DEFAULT_ENDPOINT
} from '../lib/translate.js';
import { proxyUrl, humanizeRequest, takeLines, splitLong, humanize, unreachable, TARGET } from '../lib/humanize.js';

let passed = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
}

function eq(actual, expected, what = '') {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${what} 기대 ${b}, 실제 ${a}`);
}
function ok(v, what = '') { if (!v) throw new Error(`${what} 참이어야 함`); }

/* ------------------------------------------------------------- 정렬 */

await check('숫자 이름은 사람 순서대로', () => {
  const names = ['10.jpg', '9.jpg', '1.jpg', '2.jpg', '100.jpg', '11.jpg'];
  eq(sortByName(names.map((name) => ({ name }))).map((x) => x.name),
    ['1.jpg', '2.jpg', '9.jpg', '10.jpg', '11.jpg', '100.jpg']);
});

await check('접두사가 있어도 숫자 순서', () => {
  const names = ['IMG_12.jpg', 'IMG_2.jpg', 'IMG_002.jpg', 'IMG_1.jpg'];
  eq(sortByName(names.map((name) => ({ name }))).map((x) => x.name),
    ['IMG_1.jpg', 'IMG_2.jpg', 'IMG_002.jpg', 'IMG_12.jpg']);
});

await check('아주 큰 숫자도 정밀도 손실 없이 비교', () => {
  ok(naturalCompare('9007199254740993.jpg', '9007199254740992.jpg') > 0);
});

await check('zip 안 경로는 폴더 단위로 비교', () => {
  const names = ['scenes/2.png', 'scenes/10.png', 'scenes/1.png', 'cover.png'];
  eq(sortByName(names.map((name) => ({ name }))).map((x) => x.name),
    ['cover.png', 'scenes/1.png', 'scenes/2.png', 'scenes/10.png']);
  ok(naturalPathCompare('a/1.png', 'a/2.png') < 0);
});

await check('한글 이름도 숫자 순서', () => {
  const names = ['장면-3.png', '장면-20.png', '장면-1.png'];
  eq(sortByName(names.map((name) => ({ name }))).map((x) => x.name),
    ['장면-1.png', '장면-3.png', '장면-20.png']);
});

/* ------------------------------------------------------------- zip */

/* 테스트용 최소 zip 작성기 (저장 0 / deflate 8) */
function makeZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const data = Buffer.from(f.data);
    const deflated = f.method === 8 ? deflateRawSync(data) : data;
    const crc = crc32(data);

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x800, 6);            // UTF-8 이름 플래그
    lh.writeUInt16LE(f.method, 8);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(deflated.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    locals.push(lh, nameBuf, deflated);

    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x800, 8);
    ch.writeUInt16LE(f.method, 10);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(deflated.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);

    offset += lh.length + nameBuf.length + deflated.length;
  }

  const localPart = Buffer.concat(locals);
  const centralPart = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralPart.length, 12);
  eocd.writeUInt32LE(localPart.length, 16);
  const all = Buffer.concat([localPart, centralPart, eocd]);
  return all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength);
}

const zipBuf = makeZip([
  { name: '2.jpg', data: 'second-scene-data', method: 0 },
  { name: '1.jpg', data: 'first-scene-data'.repeat(40), method: 8 },
  { name: '사진/10.png', data: 'tenth', method: 8 }
]);

await check('zip 엔트리 목록을 읽는다', () => {
  const entries = listZipEntries(zipBuf);
  eq(entries.map((e) => e.name), ['2.jpg', '1.jpg', '사진/10.png']);
  eq(entries[1].method, 8);
});

await check('stored 와 deflate 를 모두 풀고 이름순으로 정렬된다', async () => {
  const out = await unzip(zipBuf, { filter: (e) => /\.(jpg|png)$/i.test(e.name) });
  const dec = new TextDecoder();
  eq(out.map((e) => e.name), ['2.jpg', '1.jpg', '사진/10.png']);
  eq(dec.decode(out[0].bytes), 'second-scene-data');
  eq(dec.decode(out[1].bytes), 'first-scene-data'.repeat(40));
  eq(sortByName(out).map((e) => e.name), ['1.jpg', '2.jpg', '사진/10.png']);
});

await check('zip 이 아니면 알아볼 수 있는 오류', () => {
  let msg = '';
  try { listZipEntries(new Uint8Array(100).buffer); } catch (e) { msg = e.message; }
  ok(msg.includes('zip'), 'zip 오류 메시지');
});

/* ------------------------------------------------------------- 프롬프트 */

await check('사진 n 장이면 도입부 + 사이 구간 n-1 개 + 마무리', () => {
  eq(buildSteps(4, { prologue: true, opening: true, ending: true }).map(stepId),
    ['pro', 'b0', 'b1', 'b2', 'end']);
  eq(buildSteps(4, { prologue: false, opening: true, ending: true }).map(stepId),
    ['b0', 'b1', 'b2', 'end']);
  eq(buildSteps(4, { prologue: false, opening: true, ending: false }).length, 3);
  eq(buildSteps(1, { prologue: true, ending: false }).map(stepId), ['pro', 'end']);
  eq(buildSteps(0, { prologue: true, opening: true, ending: true }).length, 0);
});

await check('대목 이름표는 옵션이 바뀌어도 그대로다', () => {
  const a = buildSteps(3, { prologue: false, ending: false }).map(stepId);
  const b = buildSteps(3, { prologue: true, ending: true }).map(stepId);
  ok(a.every((id) => b.includes(id)), `${a} ⊂ ${b}`);
  eq(stepTitle({ kind: 'prologue', to: 0 }), '1번 장면 앞 · 도입부');
  eq(stepTitle({ kind: 'bridge', from: 1, to: 2 }), '2→3번 장면 사이');
  eq(stepTitle({ kind: 'ending', from: 2 }), '3번 장면 뒤 · 마무리');
});

await check('앞에 도입부를 쓰면 첫 대목이 다시 이야기를 열지 않는다', () => {
  eq(buildSteps(3, { opening: true, prologue: false })[0].opening, true);
  eq(buildSteps(3, { opening: true, prologue: true })[1].opening, false);
});

await check('도입부 대목은 1번 사진만 보고 그 순간에 도착하게 한다', () => {
  const images = [0, 1].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: `B${i}` }));
  const parts = buildStepParts({
    step: { kind: 'prologue', to: 0 }, images, story: '', memo: '', timeline: '',
    opts: { contextChars: 4000 }
  });
  eq(parts.filter((p) => p.inline_data).map((p) => p.inline_data.data), ['B0']);
  ok(parts.at(-1).text.includes('첫 장면'), '첫 장면 안내');
  ok(parts.at(-1).text.includes('도입부'), '도입부 지시');
});

await check('맞춤 지시사항이 시스템 프롬프트에 들어간다', () => {
  const sys = buildSystem({ instructions: '주인공 이름은 해원', language: '한국어', pov: 'first', tense: 'past', length: 'long' });
  ok(sys.includes('주인공 이름은 해원'), '지시사항');
  ok(sys.includes('1인칭'), '시점');
  ok(sys.includes('과거 시제'), '시제');
  ok(sys.includes('700~1000자'), '분량');
  ok(sys.includes('사진 속에는'), '메타 표현 금지 규칙');
});

await check('사이 구간은 앞뒤 사진을 모두 넣는다', () => {
  const images = [0, 1, 2].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: `B${i}` }));
  const step = { kind: 'bridge', from: 0, to: 1, opening: true };
  const parts = buildStepParts({ step, images, story: '', memo: '', timeline: '', opts: { includePrevImage: true, contextChars: 4000 } });
  const inline = parts.filter((p) => p.inline_data).map((p) => p.inline_data.data);
  eq(inline, ['B0', 'B1']);
  ok(parts.some((p) => p.text && p.text.includes('이야기의 시작')), '도입 지시');

  const onlyNext = buildStepParts({ step: { kind: 'bridge', from: 1, to: 2 }, images, story: '앞 이야기', memo: '메모', timeline: '', opts: { includePrevImage: false, contextChars: 4000 } });
  eq(onlyNext.filter((p) => p.inline_data).length, 1);
  ok(onlyNext[0].text.includes('메모'), '메모 우선');
  ok(onlyNext[1].text.includes('앞 이야기'), '앞 내용');
});

await check('마지막 사진 앞 구간은 끝으로 향하라고 알려준다', () => {
  const images = [0, 1].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: 'X' }));
  const parts = buildStepParts({
    step: { kind: 'bridge', from: 0, to: 1 }, images, story: '', memo: '', timeline: '',
    opts: { includePrevImage: true, contextChars: 100, ending: false }
  });
  ok(parts.at(-1).text.includes('마지막 장면'), '끝 안내');
});

await check('문맥은 뒤쪽만 남기고 잘린다', () => {
  const long = 'ㄱ'.repeat(5000);
  const t = trimContext(long, 1000);
  ok(t.length < 1100, '길이');
  ok(t.startsWith('…(앞부분 생략)'), '생략 표시');
  eq(trimContext('짧음', 1000), '짧음');
});

/* ------------------------------------------------------------- 메모 */

await check('한 응답에서 본문과 메모를 가른다', () => {
  eq(splitMemo(`해가 기울었다.\n\n${MEMO_MARKER}\n해원: 20대, 존댓말.`),
    { passage: '해가 기울었다.', memo: '해원: 20대, 존댓말.' });
  eq(splitMemo('표시줄이 없으면 전부 본문'), { passage: '표시줄이 없으면 전부 본문', memo: '' });
  eq(splitMemo(''), { passage: '', memo: '' });
});

await check('표시줄에 장식이 붙어도 본문에 새지 않는다', () => {
  eq(splitMemo(`앞 문장.\n**${MEMO_MARKER}**\n메모 내용`), { passage: '앞 문장.', memo: '메모 내용' });
  eq(splitMemo(`앞 문장.\n### ${MEMO_MARKER}\n메모 내용`), { passage: '앞 문장.', memo: '메모 내용' });
});

await check('스트리밍 중 반쯤 온 표시줄은 화면에 내보내지 않는다', () => {
  eq(splitMemo('본문입니다. <<<메').passage, '본문입니다.');
  eq(splitMemo('본문입니다. <<<메모>>').passage, '본문입니다.');
  eq(splitMemo('본문입니다.').passage, '본문입니다.');
});

await check('메모는 주기대로, 마지막 대목에서는 요청하지 않는다', () => {
  eq([0, 1, 2, 3].map((i) => memoDue(i, 4, 1)), [true, true, true, false]);
  eq([0, 1, 2, 3].map((i) => memoDue(i, 4, 2)), [false, true, false, false]);
  eq([0, 1, 2, 3, 4, 5].map((i) => memoDue(i, 6, 3)), [false, false, true, false, false, false]);
  eq(memoDue(0, 1, 1), false, '대목이 하나뿐이면');
  eq(memoDue(0, 4, 0), false, '주기가 0이면');
});

await check('메모를 함께 요청할 때만 지시가 붙고, 설정은 주기에만 묻는다', () => {
  const images = [0, 1].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: 'X' }));
  const step = { kind: 'bridge', from: 0, to: 1 };
  const base = { includePrevImage: true, contextChars: 4000 };

  const without = buildStepParts({ step, images, story: '', memo: '', timeline: '', opts: base });
  ok(!without.some((p) => p.text && p.text.includes(MEMO_MARKER)), '기본은 없음');

  const beatOnly = buildStepParts({ step, images, story: '', memo: '', timeline: '', opts: { ...base, askMemo: true } });
  const beatText = beatOnly.map((p) => p.text || '').join('\n');
  ok(beatText.includes(MEMO_MARKER), '표시줄 안내');
  ok(beatText.includes('줄거리:'), '줄거리 한 줄');
  ok(!beatText.includes('설정:'), '설정은 묻지 않음');

  const both = buildStepParts({ step, images, story: '', memo: '', timeline: '', opts: { ...base, askMemo: true, askSettings: true } });
  ok(both.map((p) => p.text || '').join('\n').includes('설정:'), '주기가 되면 설정도');

  const ending = buildStepParts({ step: { kind: 'ending', from: 1 }, images, story: '', memo: '', timeline: '', opts: { ...base, askMemo: true } });
  ok(ending.some((p) => p.text && p.text.includes(MEMO_MARKER)), '마무리 대목도 같은 형식');
});

await check('메모 블록을 줄거리와 설정으로 가른다', () => {
  eq(parseMemoBlock('줄거리: 둘은 버스를 탔다.\n설정: 지오는 반말을 쓴다.'),
    { beat: '둘은 버스를 탔다.', settings: '지오는 반말을 쓴다.' });
  eq(parseMemoBlock('- 줄거리: 비가 왔다.\n- 설정: 없음'), { beat: '비가 왔다.', settings: '' });
  eq(parseMemoBlock('형식을 안 지킨 한 줄'), { beat: '형식을 안 지킨 한 줄', settings: '' });
  eq(parseMemoBlock(''), { beat: '', settings: '' });
});

await check('설정은 덧붙이되 같은 줄은 넣지 않는다', () => {
  eq(appendSettings('', '해원: 20대'), '- 해원: 20대');
  eq(appendSettings('- 해원: 20대', '해원: 20대'), '- 해원: 20대');
  eq(appendSettings('- 해원: 20대', '지오: 반말\n비 오는 저녁'), '- 해원: 20대\n- 지오: 반말\n- 비 오는 저녁');
  const long = appendSettings('- 가'.repeat(1) + '\n- 나\n- 다', '라', 8);
  ok(long.length <= 8, `길이 제한 (${long})`);
  ok(long.includes('라'), '새 줄은 남는다');
});

await check('줄거리는 구간 이름과 함께 쌓인다', () => {
  const steps = buildSteps(3, { prologue: true, ending: true });
  const beats = { pro: '집을 나섰다', b0: '버스를 탔다', b1: '바다에 닿았다', end: '집에 돌아왔다' };
  eq(buildTimeline(steps, beats, 2), '1번 장면 앞 · 도입부: 집을 나섰다\n1→2번 장면 사이: 버스를 탔다');
  eq(buildTimeline(steps, {}), '');
});

await check('줄거리를 보내면 프롬프트에 구간별로 실린다', () => {
  const images = [0, 1, 2].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: 'X' }));
  const parts = buildStepParts({
    step: { kind: 'bridge', from: 1, to: 2 }, images, story: '앞 본문', memo: '- 해원: 20대',
    timeline: '1→2번 장면 사이: 버스를 탔다',
    opts: { includePrevImage: false, contextChars: 4000 }
  });
  ok(parts[0].text.includes('해원'), '설정 먼저');
  ok(parts[1].text.includes('버스를 탔다'), '줄거리 다음');
  ok(parts[2].text.includes('앞 본문'), '본문 마지막');
});

/* ------------------------------------------------------------- 안전 설정 */

await check('가장 느슨한 단계는 5개 카테고리 모두 OFF', () => {
  const s = safetySettingsFor(0);
  eq(s.length, 5);
  ok(s.every((x) => x.threshold === 'OFF'), 'OFF');
});

await check('단계를 내리면 BLOCK_NONE, 마지막은 기본값', () => {
  eq(safetySettingsFor(1).length, 4);
  ok(safetySettingsFor(2).every((x) => x.threshold === 'BLOCK_NONE'), 'BLOCK_NONE');
  eq(safetySettingsFor(SAFETY_LADDER.length - 1), null);
});

/* ------------------------------------------------------------- 자동 저장 */

await check('이미 저장한 사진은 다시 쓰지 않고, 빠진 사진만 지운다', () => {
  eq(planImageSync(['a', 'b', 'c'], ['b', 'c', 'd']), { put: ['d'], del: ['a'] });
  eq(planImageSync([], ['a']), { put: ['a'], del: [] });
  eq(planImageSync(['a'], []), { put: [], del: ['a'] });
  eq(planImageSync(['a', 'b'], ['b', 'a']), { put: [], del: [] });   // 순서만 바뀐 경우
});

await check('쓰다 만 대목은 저장하지 않는다', () => {
  eq(normalizePassages([
    { text: '쓰다 만 글', status: 'busy' },
    { text: '', status: 'busy' },
    { text: '완성', status: 'done' },
    { text: '', status: 'error', error: '차단됨' },
    null
  ]), [
    { text: '', status: 'empty', error: '' },
    { text: '', status: 'empty', error: '' },
    { text: '완성', status: 'done', error: '' },
    { text: '', status: 'error', error: '차단됨' },
    { text: '', status: 'empty', error: '' }
  ]);
  eq(normalizePassages(undefined), {});
});

await check('이름표로 저장할 때 빈 대목과 쓰다 만 대목은 빼고 담는다', () => {
  eq(normalizePassages({
    pro: { text: '완성된 도입부', status: 'done' },
    half: { text: '쓰다 만', status: 'busy' },
    b0: { text: '', status: 'empty' },
    b1: { text: '', status: 'error', error: '차단됨' }
  }), {
    pro: { text: '완성된 도입부', status: 'done', error: '' },
    b1: { text: '', status: 'error', error: '차단됨' }
  });
});

/* ------------------------------------------------------------- 구멍 메우기 */

await check('건너뛴 구간은 줄거리에 비었다고 적힌다', () => {
  const steps = buildSteps(4, { prologue: true, ending: false });
  const beats = { pro: '집을 나섰다', b1: '바다에 닿았다' };
  eq(buildTimeline(steps, beats, Infinity, new Set(['b0'])),
    '1번 장면 앞 · 도입부: 집을 나섰다\n1→2번 장면 사이: (비어 있음 — 아직 쓰지 않은 구간)\n2→3번 장면 사이: 바다에 닿았다');
  // 아직 차례가 오지 않은 뒷구간은 알리지 않는다
  eq(buildTimeline(steps, beats, 2, new Set(['b0'])),
    '1번 장면 앞 · 도입부: 집을 나섰다\n1→2번 장면 사이: (비어 있음 — 아직 쓰지 않은 구간)');
  // 글은 있는데 줄거리 한 줄만 없는 구간은 조용히 건너뛴다
  eq(buildTimeline(steps, beats, Infinity, new Set()),
    '1번 장면 앞 · 도입부: 집을 나섰다\n2→3번 장면 사이: 바다에 닿았다');
});

await check('앞이 비면 그 사이를 메우라고 시킨다', () => {
  const images = [0, 1, 2].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: 'X' }));
  const base = { includePrevImage: true, contextChars: 4000 };
  const parts = buildStepParts({
    step: { kind: 'bridge', from: 1, to: 2 }, images, story: '앞 본문', memo: '', timeline: '',
    gapBefore: '1→2번 장면 사이', opts: base
  });
  const all = parts.map((x) => x.text || '').join('\n');
  ok(all.includes('비어 있다'), '빈 구간을 알려 준다');
  ok(all.includes('흘려 넣어'), '메우라고 시킨다');

  const clean = buildStepParts({ step: { kind: 'bridge', from: 1, to: 2 }, images, story: '', memo: '', timeline: '', opts: base });
  ok(!clean.map((x) => x.text || '').join('\n').includes('비어 있다'), '구멍이 없으면 붙지 않는다');
});

await check('뒤에 이미 쓴 글이 있으면 거기에 닿게 시킨다', () => {
  const images = [0, 1, 2].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: 'X' }));
  const parts = buildStepParts({
    step: { kind: 'bridge', from: 0, to: 1 }, images, story: '', memo: '', timeline: '',
    nextText: '그는 방파제에 서 있었다.', opts: { includePrevImage: true, contextChars: 4000 }
  });
  const all = parts.map((x) => x.text || '').join('\n');
  ok(all.includes('그는 방파제에 서 있었다.'), '뒷글을 보여 준다');
  ok(all.includes('되풀이하지 마라'), '겹치지 않게');
  ok(all.includes('자연스럽게 닿도록'), '이어지게');
});

/* ------------------------------------------------------------- 거부 재시도 */

await check('거부·빈 응답을 가려낸다', () => {
  eq(isRefusal({ text: '본문', finishReason: 'STOP' }), false);
  eq(isRefusal({ text: '잘린 본문', finishReason: 'MAX_TOKENS' }), false, '잘린 건 거부가 아니다');
  eq(isRefusal({ text: '', finishReason: 'STOP' }), true, '빈 응답');
  eq(isRefusal({ text: '   ', finishReason: 'STOP' }), true, '공백뿐');
  eq(isRefusal({ text: '본문', finishReason: 'PROHIBITED_CONTENT' }), true);
  eq(isRefusal({ text: '본문', finishReason: 'SAFETY' }), true);
  eq(isRefusal({ text: '본문', finishReason: 'STOP', blockReason: 'SAFETY' }), true, '프롬프트가 막힌 경우');
  eq(isRefusal(null), true);
});

await check('보낸 것이 막힌 건지 쓰다가 막힌 건지 구분해 알려 준다', () => {
  const sent = describeFailure({ text: '', blockReason: 'PROHIBITED_CONTENT' });
  eq(sent.where, 'input');
  ok(sent.message.includes('보낸 내용'), '입력이 원인');
  ok(sent.message.includes('사진·지시사항·앞 본문'), '어디를 볼지 알려 준다');
  ok(sent.message.includes('PROHIBITED_CONTENT'), '코드도 남긴다');

  const wrote = describeFailure({ text: '', finishReason: 'PROHIBITED_CONTENT' });
  eq(wrote.where, 'output');
  ok(wrote.message.includes('쓰던 중'), '출력이 원인');

  const safety = describeFailure({ text: '', finishReason: 'SAFETY' });
  ok(safety.message.includes('안전 필터'), '안전 필터');

  eq(describeFailure({ text: '', finishReason: 'STOP' }).where, 'empty');
  eq(describeFailure({ text: '본문', finishReason: 'STOP' }), null, '성공은 아무 말 없음');
  ok(describeFailure({ text: '', blockReason: 'PROHIBITED_CONTENT' }).message.includes('끌 수 없는'),
    '안전 설정으로 못 끄는 층이라고 알려 준다');
});

await check('다시 걸어 볼 오류와 그렇지 않은 오류를 가른다', () => {
  eq(isWorthRetrying(new GeminiError('쿼터', { status: 429 })), true);
  eq(isWorthRetrying(new GeminiError('서버', { status: 503 })), true);
  eq(isWorthRetrying(new GeminiError('네트워크', { status: 0 })), true);
  eq(isWorthRetrying(new GeminiError('API key not valid', { status: 400 })), false, '설정 잘못');
  eq(isWorthRetrying(new GeminiError('권한 없음', { status: 403 })), false);
  eq(isWorthRetrying(new DOMException('중단됨', 'AbortError')), false, '사용자가 멈춘 것');
});

await check('다시 보낼 때만 재시도 안내가 붙는다', () => {
  eq(retryNote(0, true), '');
  ok(retryNote(1, false).includes('다른 문장으로'), '다시 쓰라고');
  ok(!retryNote(1, true).includes('암시'), '한 번 실패로는 우회 요청까지 가지 않는다');
  ok(retryNote(2, true).includes('암시'), '여러 번이면 우회 요청');
  ok(!retryNote(2, false).includes('암시'), '끄면 붙지 않는다');

  const images = [0, 1].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: 'X' }));
  const parts = buildStepParts({
    step: { kind: 'bridge', from: 0, to: 1 }, images, story: '', memo: '', timeline: '',
    opts: { includePrevImage: true, contextChars: 4000, retryNote: retryNote(1, false) }
  });
  ok(parts.at(-1).text.includes('앞선 시도'), '맨 끝에 붙는다');

  const plain = buildStepParts({
    step: { kind: 'prologue', to: 0 }, images, story: '', memo: '', timeline: '',
    opts: { contextChars: 4000 }
  });
  ok(!plain.some((x) => x.text && x.text.includes('앞선 시도')), '기본은 없음');
});

/* ------------------------------------------------------------- 한 장씩 단편 */

await check('제목 줄과 본문을 가른다', () => {
  eq(splitTitle('제목: 여름의 끝\n\n바다가 보였다.'), { title: '여름의 끝', body: '바다가 보였다.' });
  eq(splitTitle('**제목: 여름**\n본문'), { title: '여름', body: '본문' });
  eq(splitTitle('タイトル: 夏\n\n海が見えた。'), { title: '夏', body: '海が見えた。' });
  eq(splitTitle('제목 없이 시작하는 글'), { title: '', body: '제목 없이 시작하는 글' });
  eq(splitTitle(''), { title: '', body: '' });
});

await check('단편은 한 장만 보고 쓰라고 시킨다', () => {
  const image = { name: '1.jpg', mimeType: 'image/jpeg', base64: 'B' };
  const parts = buildShortParts({ image, index: 0, total: 3, opts: {} });
  eq(parts.filter((p) => p.inline_data).length, 1, '사진 한 장만');
  ok(parts[0].text.includes('1/3'), '몇 번째인지');
  ok(parts.at(-1).text.includes('한 장만'), '이 사진만');

  const sys = buildShortSystem({
    shortLang: 'ja',
    shortInstructions: '300자 안팎, 제목 없이',
    instructions: '연작용 지시사항 — 다음 장면으로 이어라',   // 연작 쪽은 끌어오지 않는다
    pov: 'first',
    length: 'xlong'
  });
  ok(!sys.includes('연작용 지시사항'), '연작 지시사항은 섞이지 않는다');
  ok(!sys.includes('1인칭'), '연작 쪽 시점 설정도 끌어오지 않는다');
  ok(sys.includes('일본어'), '쓸 언어');
  ok(sys.includes('300자 안팎, 제목 없이'), '단편 전용 지시사항');
  ok(sys.includes('이어질 필요가 없다'), '독립된 한 편');
  ok(sys.includes('분량과 형식은 아래 맞춤 지시사항을 따른다'), '분량·형식은 지시사항이 정한다');
  ok(sys.includes('제목이 필요 없으면'), '제목은 선택');
  ok(!/\d+자 안팎으로 맞춘다|분량은 .*정도로/.test(sys), '앱이 분량을 정하지 않는다');
});

await check('번역은 원문을 싣고 형식을 맞춘다', () => {
  const parts = buildTranslateParts({ title: '여름의 끝', body: '바다가 보였다.', target: 'en' });
  const text = parts[0].text;
  ok(text.includes('영어로 옮겨라'), '대상 언어');
  ok(text.includes('여름의 끝') && text.includes('바다가 보였다.'), '원문 전달');
  ok(text.includes('제목:'), '형식');
  ok(text.includes('더하거나 빼지 마라'), '덧붙이지 말라고');
  eq(Object.keys(LANGS), ['ko', 'en', 'ja']);
});

await check('글줄은 폭에 맞춰 나뉜다', () => {
  // 한글 16px, 영문 8px, 공백 5px 로 재는 셈 치고
  const m = (s) => [...s].reduce((a, c) => a + (/\s/.test(c) ? 5 : /[A-Za-z0-9]/.test(c) ? 8 : 16), 0);
  eq(wrapLines(m, '바다가 보였다. 그는 말이 없었다.', 100),
    ['바다가 보였', '다. 그는 말', '이 없었다.']);
  eq(wrapLines(m, 'The quick brown fox', 100), ['The quick', 'brown fox']);
  eq(wrapLines(m, '첫 문단.\n\n둘째 문단.', 200), ['첫 문단.', '', '둘째 문단.'], '빈 줄은 살린다');
  eq(wrapLines(m, 'supercalifragilistic', 40).length, 4, '긴 낱말은 글자 단위로 자른다');
  eq(wrapLines(m, '', 100), ['']);
});

await check('쓰다 만 단편은 저장하지 않는다', () => {
  eq(normalizeShorts({
    a: { base: 'ko', lang: 'en', texts: { ko: { title: '제목', body: '본문' }, en: { title: 'T', body: 'B' } }, status: 'done' },
    b: { base: 'ko', texts: {}, status: 'busy' },
    c: { base: 'ko', lang: 'ko', texts: {}, status: 'error', error: '막힘' }
  }), {
    a: { base: 'ko', lang: 'en', texts: { ko: { title: '제목', body: '본문' }, en: { title: 'T', body: 'B' } }, status: 'done', error: '' },
    c: { base: 'ko', lang: 'ko', texts: {}, status: 'error', error: '막힘' }
  });
  eq(normalizeShorts(undefined), {});
});

/* ------------------------------------------------------------- 전체 내보내기 */

await check('zip 을 써서 다시 읽으면 그대로 나온다', async () => {
  const blob = await createZip([
    { name: 'a.json', data: '{"긴":"글"}'.repeat(30), compress: true },
    { name: 'images/001-사진.jpg', data: new Uint8Array([1, 2, 3, 4, 5]) }
  ]);
  const entries = await unzip(await blob.arrayBuffer());
  eq(entries.map((e) => e.name), ['a.json', 'images/001-사진.jpg']);
  eq(new TextDecoder().decode(entries[0].bytes), '{"긴":"글"}'.repeat(30));
  eq(Array.from(entries[1].bytes), [1, 2, 3, 4, 5]);
  eq(listZipEntries(await blob.arrayBuffer())[0].method, 8, '텍스트는 압축');
  eq(listZipEntries(await blob.arrayBuffer())[1].method, 0, '사진은 그대로');
});

await check('파일 이름은 경로와 특수문자를 걷어낸다', () => {
  eq(imageEntryName(0, 'a/b/1.jpg'), 'images/001-1.jpg');
  eq(imageEntryName(11, '사진?.png'), 'images/012-사진_.png');
  eq(safeFileName('../../x.jpg'), 'x.jpg');
  eq(safeFileName(''), 'image');
});

await check('프로젝트를 담고 되읽는다', async () => {
  const images = [
    { id: 'i1', name: '1.jpg', mimeType: 'image/jpeg', width: 800, height: 600, converted: true, blob: new Blob([new Uint8Array([9, 9])]) },
    { id: 'i2', name: '2.jpg', mimeType: 'image/jpeg', width: 800, height: 600, converted: false, blob: new Blob([new Uint8Array([7])]) }
  ];
  const { files } = buildProject({
    images,
    passages: { pro: { text: '도입부', status: 'done' }, b0: { text: '사이 글', status: 'done' } },
    beats: { pro: '집을 나섰다' },
    memo: '- 해원: 20대',
    settings: { instructions: '담담하게', model: 'gemini-2.5-pro' },
    story: '사람이 읽는 본문'
  });
  const back = readProject(await unzip(await (await createZip(files)).arrayBuffer()));
  eq(back.error, undefined);
  eq(back.images.map((m) => m.name), ['1.jpg', '2.jpg']);
  eq(back.shortImages, []);
  eq(Array.from(back.images[0].bytes), [9, 9]);
  eq(back.manifest.passages.pro.text, '도입부');
  eq(back.manifest.beats.pro, '집을 나섰다');
  eq(back.manifest.memo, '- 해원: 20대');
  eq(back.manifest.settings.instructions, '담담하게');
  ok(files.some((f) => f.name === 'story.txt'), '읽을거리도 함께');
});

await check('단편도 한 zip 에 함께 담긴다', async () => {
  const shortImg = { id: 'h1', name: '바다.jpg', mimeType: 'image/jpeg', blob: new Blob([new Uint8Array([5, 5])]) };
  const { files } = buildProject({
    images: [], passages: {}, beats: {}, memo: '', settings: {},
    shorts: { images: [shortImg], items: { h1: { base: 'ko', lang: 'ko', texts: { ko: { title: '여름', body: '바다.' } }, status: 'done' } } },
    shortsText: '사람이 읽는 단편'
  });
  ok(files.some((f) => f.name === 'shorts/001-바다.jpg'), '단편 사진은 따로 담는다');
  ok(files.some((f) => f.name === 'shorts.txt'), '읽을거리도');

  const back = readProject(await unzip(await (await createZip(files)).arrayBuffer()));
  eq(back.shortImages.map((m) => m.name), ['바다.jpg']);
  eq(Array.from(back.shortImages[0].bytes), [5, 5]);
  eq(back.manifest.shorts.items.h1.texts.ko.title, '여름');
  eq(back.images, [], '연작 사진은 비어 있다');
});

await check('단편이 없던 예전 파일도 그대로 읽힌다', () => {
  const old = readManifest(JSON.stringify({ app: 'photo-novel', version: 1, images: [], passages: {} }));
  eq(old.error, undefined);
  eq(old.manifest.shorts, { images: [], items: {} });
});

await check('API 키는 파일에 담기지 않는다', async () => {
  const { manifest, files } = buildProject({
    images: [], passages: {}, beats: {}, memo: '',
    settings: { instructions: '비밀 아님', model: 'gemini-2.5-pro' }
  });
  const dumped = JSON.stringify(manifest) + files.map((f) => (typeof f.data === 'string' ? f.data : '')).join('');
  ok(!/apiKey|AIza/.test(dumped), '키 흔적 없음');
});

await check('남의 zip 이나 깨진 파일은 알아볼 수 있게 거절한다', async () => {
  ok(readManifest('{"app":"other"}').error.includes('사진 소설'), '다른 앱');
  ok(readManifest('깨진 JSON').error.includes('읽지 못했'), '깨진 파일');
  ok(readManifest(JSON.stringify({ app: 'photo-novel', version: 99 })).error.includes('새 버전'), '더 새 버전');

  const plain = await unzip(await (await createZip([{ name: '1.jpg', data: new Uint8Array([1]) }])).arrayBuffer());
  eq(readProject(plain).plainZip, true, '사진만 든 zip');
});

await check('사진이 빠진 파일은 남은 것만 되살린다', async () => {
  const images = [{ id: 'i1', name: '1.jpg', mimeType: 'image/jpeg', blob: new Blob([new Uint8Array([1])]) }];
  const { files } = buildProject({ images, passages: {}, beats: {}, memo: '', settings: {} });
  const onlyJson = files.filter((f) => f.name === PROJECT_FILE);
  const back = readProject(await unzip(await (await createZip(onlyJson)).arrayBuffer()));
  eq(back.images.length, 0);
  eq(back.missing, ['images/001-1.jpg']);
});

/* ------------------------------------------------------------- API 호출 */

function sseResponse(chunks) {
  const body = new ReadableStream({
    start(c) {
      const enc = new TextEncoder();
      for (const ch of chunks) c.enqueue(enc.encode(`data: ${JSON.stringify(ch)}\n\n`));
      c.close();
    }
  });
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

await check('OFF 를 거부하면 자동으로 한 단계 낮춰 다시 시도', async () => {
  const sent = [];
  globalThis.fetch = async (url, init) => {
    sent.push(JSON.parse(init.body));
    if (sent.length === 1) {
      return new Response(JSON.stringify({ error: { message: 'Invalid value at safety_settings[0].threshold: OFF' } }), { status: 400 });
    }
    return sseResponse([
      { candidates: [{ content: { parts: [{ text: '해가 기울었다. ' }] } }] },
      { candidates: [{ content: { parts: [{ text: '그는 문을 열었다.' }], role: 'model' }, finishReason: 'STOP' }] }
    ]);
  };

  const deltas = [];
  const st = {};
  const res = await generate({
    apiKey: 'k', model: 'gemini-2.5-pro', system: 's',
    parts: [{ text: 'p' }], state: st, onDelta: (t) => deltas.push(t)
  });
  eq(res.text, '해가 기울었다. 그는 문을 열었다.');
  eq(res.finishReason, 'STOP');
  eq(deltas.length, 2);
  eq(st.safetyStep, 1, '완화 단계 기억');
  eq(sent[0].safetySettings[0].threshold, 'OFF');
  eq(sent[1].safetySettings.length, 4);
  ok(sent[1].systemInstruction.parts[0].text === 's', '시스템 지시 전달');
});

await check('thinking 미지원 모델이면 옵션을 빼고 재시도', async () => {
  const sent = [];
  globalThis.fetch = async (url, init) => {
    sent.push(JSON.parse(init.body));
    if (sent.length === 1) {
      return new Response(JSON.stringify({ error: { message: 'Thinking config is not supported for this model' } }), { status: 400 });
    }
    return sseResponse([{ candidates: [{ content: { parts: [{ text: '본문' }] }, finishReason: 'STOP' }] }]);
  };
  const st = {};
  const res = await generate({ apiKey: 'k', model: 'm', parts: [{ text: 'p' }], thinkingBudget: 0, state: st });
  eq(res.text, '본문');
  ok(st.noThinking === true, '기억');
  ok(sent[0].generationConfig.thinkingConfig, '첫 요청에는 있었다');
  ok(!sent[1].generationConfig.thinkingConfig, '두 번째에는 없다');
});

await check('생각(thought) 조각은 본문에서 제외하고 차단 사유는 그대로 전달', async () => {
  globalThis.fetch = async () => sseResponse([
    { candidates: [{ content: { parts: [{ text: '속으로 생각', thought: true }, { text: '진짜 본문' }] } }] },
    { promptFeedback: { blockReason: 'SAFETY' }, candidates: [{ finishReason: 'SAFETY' }] }
  ]);
  const res = await generate({ apiKey: 'k', model: 'm', parts: [{ text: 'p' }], state: {} });
  eq(res.text, '진짜 본문');
  eq(res.blockReason, 'SAFETY');
});

await check('고칠 수 없는 오류는 메시지를 그대로 올린다', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'API key not valid' } }), { status: 400 });
  let msg = '';
  try {
    await generate({ apiKey: 'bad', model: 'm', parts: [{ text: 'p' }], state: {} });
  } catch (e) { msg = e.message; }
  ok(msg.includes('API key not valid'), `오류 전달 (${msg})`);
});

/* ------------------------------------------------------------- 번역 */

await check('나눈 조각을 도로 이으면 원문이 된다', () => {
  const text = '첫 문단입니다. 꽤 길게 이어집니다.\n\n둘째 문단. 여기도 문장이 여럿이다. 셋째 문장까지.\n마지막 줄';
  const chunks = planChunks(text, 30);
  eq(chunks.map((c) => c.text + c.sep).join(''), text, '원문 복원');
});

await check('한 조각은 한도를 넘지 않는다', () => {
  const text = '비가 내리는 저녁이었다. 그는 문을 열었다. 아무도 없었다. 먼지 냄새가 났다.';
  for (const c of planChunks(text, 40)) {
    ok(byteLen(c.text) <= 40 || [...c.text].length === 1, `조각 길이 ${byteLen(c.text)}`);
  }
});

await check('띄어쓰기 없는 긴 덩어리도 잘린다', () => {
  const text = '가'.repeat(100);                       // 한글 한 글자 = 3바이트
  const chunks = planChunks(text, 30);
  ok(chunks.length >= 10, `조각 수 ${chunks.length}`);
  for (const c of chunks) ok(byteLen(c.text) <= 30, `조각 길이 ${byteLen(c.text)}`);
  eq(chunks.map((c) => c.text + c.sep).join(''), text, '원문 복원');
});

await check('빈 줄은 번역하지 않고 그대로 둔다', () => {
  const chunks = planChunks('한 줄\n\n다른 줄', 100);
  eq(chunks.map((c) => c.text), ['한 줄', '', '다른 줄'], '조각');
});

await check('LibreTranslate 요청 모양', () => {
  const { url, init } = libreRequest('https://example.org/', { text: '밤', from: 'ko', to: 'ja' });
  eq(url, 'https://example.org/translate', '주소');
  eq(JSON.parse(init.body), { q: '밤', source: 'ko', target: 'ja', format: 'text' }, '본문');
  eq(parseLibre({ translatedText: '夜' }), '夜', '응답');
});

await check('MyMemory 요청과 한도 경고', () => {
  const { url } = myMemoryRequest({ text: '밤', from: 'ko', to: 'en', email: ' me@example.com ' });
  ok(url.includes('langpair=ko%7Cen'), `언어쌍 (${url})`);
  ok(url.includes('de=me%40example.com'), `이메일 (${url})`);
  eq(parseMyMemory({ responseStatus: 200, responseData: { translatedText: 'night' } }), 'night', '응답');
  let msg = '';
  try {
    parseMyMemory({ responseStatus: 200, responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS' } });
  } catch (e) { msg = e.message; }
  ok(msg.includes('한도'), `한도 안내 (${msg})`);
});

await check('긴 글은 나눠 보내고 줄 모양 그대로 돌아온다', async () => {
  const seen = [];
  const fake = async (url, init) => {
    seen.push(JSON.parse(init.body).q);
    return new Response(JSON.stringify({ translatedText: `[${JSON.parse(init.body).q}]` }), { status: 200 });
  };
  const out = await translateText({
    engine: 'libre', text: '첫 줄이다. 조금 더 길게 쓴다.\n\n둘째 줄', from: 'ko', to: 'ja',
    endpoint: DEFAULT_ENDPOINT, fetch: fake
  });
  ok(seen.length >= 2, `나눠 보냄 (${seen.length}조각)`);
  ok(!seen.includes(''), '빈 줄은 보내지 않는다');
  eq(out.split('\n').length, 3, '줄 수');
  ok(out.includes('[둘째 줄]'), `번역 결과 (${out})`);
});

await check('번역 서버가 실패하면 그 사실을 올린다', async () => {
  const fake = async () => new Response('nope', { status: 429 });
  let msg = '';
  try {
    await translateText({ engine: 'libre', text: '밤', from: 'ko', to: 'ja', fetch: fake });
  } catch (e) { msg = e.message; }
  ok(msg.includes('429'), `오류 전달 (${msg})`);
});

await check('같은 언어면 부르지 않는다', async () => {
  let called = 0;
  const out = await translateText({
    engine: 'libre', text: '밤', from: 'ko', to: 'ko',
    fetch: async () => { called++; return new Response('{}', { status: 200 }); }
  });
  eq(called, 0, '요청 수');
  eq(out, '밤', '원문 그대로');
});

/* --------------------------------------------------------- 설정 파일 */

await check('설정 파일은 저장한 그대로 돌아온다', () => {
  const text = buildSettingsFile({ settings: { instructions: '담담하게', model: 'gemini-2.5-pro', optEnding: true, temperature: '1.1' }, theme: 'dark', proseScale: 1.25, apiKey: 'AIza-test' });
  const got = readSettingsFile(text);
  eq(got.settings, { instructions: '담담하게', model: 'gemini-2.5-pro', optEnding: true, temperature: '1.1' }, '설정');
  eq([got.theme, got.proseScale, got.apiKey], ['dark', 1.25, 'AIza-test'], '테마·글자·키');
});

await check('키를 빼면 파일에 키가 없다', () => {
  const text = buildSettingsFile({ settings: { a: 1 }, apiKey: '' });
  ok(!text.includes('apiKey'), '키 칸 없음');
  eq(readSettingsFile(text).apiKey, '', '빈 키');
});

await check('엉뚱한 파일은 이유와 함께 거절한다', () => {
  const why = (s) => { try { readSettingsFile(s); return ''; } catch (e) { return e.message; } };
  ok(why('not json').includes('JSON'), '깨진 JSON');
  ok(why('[1,2]').includes('모양'), '배열');
  ok(why('{"x":1}').includes('설정'), '설정 없음');
  eq(readSettingsFile('{"settings":{"a":"b","bad":{"x":1}}}').settings, { a: 'b' }, '값만 받음');
});

/* ------------------------------------------------------- 사진 복사본 */

await check('올린 사진은 원본 파일과 무관한 복사본으로 담는다', async () => {
  const src = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' });
  const copy = await ownCopy(src);
  ok(copy !== src, '다른 객체');
  eq(copy.type, 'image/png', '형식 유지');
  eq([...new Uint8Array(await copy.arrayBuffer())], [1, 2, 3, 4], '바이트 동일');
  eq((await ownCopy(src, 'image/jpeg')).type, 'image/jpeg', '형식 지정');
});

/* --------------------------------------------------------- AI 티 빼기 */

await check('프록시 주소 모양을 모두 받는다', () => {
  eq(proxyUrl('https://내서버/humanize'), 'https://내서버/humanize', '직접 중계');
  eq(proxyUrl('https://p/?url={url}'), `https://p/?url=${encodeURIComponent(TARGET)}`, '{url} 자리');
  eq(proxyUrl('https://p/?url='), `https://p/?url=${encodeURIComponent(TARGET)}`, '= 로 끝남');
  eq(proxyUrl('https://p/'), `https://p/${TARGET}`, '/ 로 끝남');
  let msg = '';
  try { proxyUrl('  '); } catch (e) { msg = e.message; }
  ok(msg.includes('비어'), `빈 주소 (${msg})`);
});

await check('보내는 본문은 사이트가 받는 모양 그대로', () => {
  const { init } = humanizeRequest({ proxy: 'https://p/x', text: '밤', mode: 'precision', sanitize: false });
  eq(JSON.parse(init.body), { text: '밤', mode: 'precision', sanitize: false }, '본문');
  eq(init.method, 'POST', '메서드');
});

await check('NDJSON 은 줄 단위로 읽고 덜 온 줄은 남긴다', () => {
  const { lines, rest } = takeLines('{"type":"progress","step":"fast"}\n{"type":"do');
  eq(lines.length, 1, '완성된 줄');
  eq(lines[0].step, 'fast', '내용');
  eq(rest, '{"type":"do', '남은 조각');
  eq(takeLines('깨진 줄\n{"a":1}\n').lines, [{ a: 1 }], '깨진 줄은 버린다');
});

await check('2만 자가 넘으면 문단에서 나눈다', () => {
  const para = `${'가'.repeat(500)}\n\n`;
  const text = para.repeat(60);                     // 3만 자 남짓
  const parts = splitLong(text, 20000);
  ok(parts.length > 1, `조각 수 ${parts.length}`);
  for (const p of parts) ok(p.length <= 20000, `조각 길이 ${p.length}`);
  eq(parts.join('').replace(/\s/g, ''), text.replace(/\s/g, ''), '글자는 그대로');
});

await check('스트림에서 결과를 뽑아낸다', async () => {
  const body = [
    '{"type":"progress","step":"fast","detail":"윤문하는 중"}',
    '{"type":"progress","step":"audit"}',
    '{"type":"done","result":"다듬은 글","degraded":false}'
  ].join('\n') + '\n';
  const steps = [];
  const res = await humanize({
    proxy: 'https://p/x', text: '원래 글',
    fetch: async () => new Response(body, { status: 200 }),
    onProgress: (label) => steps.push(label)
  });
  eq(res.text, '다듬은 글', '결과');
  eq(steps, ['윤문하는 중', '다듬는 중'], '진행 단계 이름');
});

await check('서버가 error 를 보내면 그대로 올린다', async () => {
  let msg = '';
  try {
    await humanize({
      proxy: 'https://p/x', text: '글',
      fetch: async () => new Response('{"type":"error","message":"너무 깁니다"}\n', { status: 200 })
    });
  } catch (e) { msg = e.message; }
  eq(msg, '너무 깁니다', '오류 전달');
});

await check('결과가 없으면 성공으로 보지 않는다', async () => {
  let msg = '';
  try {
    await humanize({
      proxy: 'https://p/x', text: '글',
      fetch: async () => new Response('{"type":"progress","step":"fast"}\n', { status: 200 })
    });
  } catch (e) { msg = e.message; }
  ok(msg.includes('비어'), `빈 결과 (${msg})`);
});

await check('연결이 안 되면 넣어야 할 사이트 주소를 짚어 준다', async () => {
  let msg = '';
  try {
    await humanize({ proxy: 'https://p/x', text: '글', fetch: async () => { throw new TypeError('Failed to fetch'); } });
  } catch (e) { msg = e.message; }
  ok(msg.includes('Failed to fetch') && msg.includes('프록시에 닿지'), `원인 안내 (${msg})`);
  ok(unreachable(new TypeError('Failed to fetch'), 'http://opus.kro.kr').includes('http://opus.kro.kr'), '사이트 주소');
  ok(unreachable(new TypeError('x'), 'null').includes('웹 서버'), '파일로 열었을 때');
});

await check('프록시가 막으면 그렇게 알려 준다', async () => {
  let msg = '';
  try {
    await humanize({ proxy: 'https://p/x', text: '글', fetch: async () => new Response('no', { status: 403 }) });
  } catch (e) { msg = e.message; }
  ok(msg.includes('403') && msg.includes('프록시'), `403 안내 (${msg})`);
});

/* ------------------------------------------------------------- 결과 */

if (failures.length) {
  console.error(`실패 ${failures.length}건`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log(`통과 ${passed}건`);
