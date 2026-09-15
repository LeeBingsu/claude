/* run-tests.js - 브라우저 없이 확인할 수 있는 부분만 검증한다.  실행: node test/run-tests.js */

import { deflateRawSync, crc32 } from 'node:zlib';
import { naturalCompare, naturalPathCompare, sortByName } from '../lib/sort.js';
import { listZipEntries, unzip, createZip } from '../lib/zip.js';
import {
  buildSteps, buildSystem, buildStepParts, trimContext, splitMemo, memoDue, MEMO_MARKER,
  parseMemoBlock, appendSettings, buildTimeline, stepId, stepTitle, retryNote
} from '../lib/prompt.js';
import { generate, safetySettingsFor, isRefusal, isWorthRetrying, GeminiError, SAFETY_LADDER } from '../lib/gemini.js';
import { planImageSync, normalizePassages } from '../lib/store.js';
import { buildProject, readProject, readManifest, imageEntryName, safeFileName, PROJECT_FILE } from '../lib/project.js';

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
  eq(Array.from(back.images[0].bytes), [9, 9]);
  eq(back.manifest.passages.pro.text, '도입부');
  eq(back.manifest.beats.pro, '집을 나섰다');
  eq(back.manifest.memo, '- 해원: 20대');
  eq(back.manifest.settings.instructions, '담담하게');
  ok(files.some((f) => f.name === 'story.txt'), '읽을거리도 함께');
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

/* ------------------------------------------------------------- 결과 */

if (failures.length) {
  console.error(`실패 ${failures.length}건`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log(`통과 ${passed}건`);
