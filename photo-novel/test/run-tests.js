/* run-tests.js - 브라우저 없이 확인할 수 있는 부분만 검증한다.  실행: node test/run-tests.js */

import { deflateRawSync, crc32 } from 'node:zlib';
import { naturalCompare, naturalPathCompare, sortByName } from '../lib/sort.js';
import { listZipEntries, unzip } from '../lib/zip.js';
import { buildSteps, buildSystem, buildStepParts, trimContext, splitMemo, memoDue, MEMO_MARKER } from '../lib/prompt.js';
import { generate, safetySettingsFor, SAFETY_LADDER } from '../lib/gemini.js';
import { planImageSync, normalizePassages } from '../lib/store.js';

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

await check('사진 n 장이면 사이 구간 n-1 개 + 마무리', () => {
  eq(buildSteps(4, { opening: true, ending: true }).map((s) => `${s.kind}:${s.from}`),
    ['bridge:0', 'bridge:1', 'bridge:2', 'ending:3']);
  eq(buildSteps(4, { opening: true, ending: false }).length, 3);
  eq(buildSteps(1, { opening: true, ending: false }).map((s) => s.kind), ['ending']);
  eq(buildSteps(0, { opening: true, ending: true }).length, 0);
});

await check('첫 대목에만 도입부 표시가 붙는다', () => {
  const steps = buildSteps(3, { opening: true, ending: false });
  eq([steps[0].opening, steps[1].opening], [true, false]);
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
  const parts = buildStepParts({ step, images, story: '', memo: '', opts: { includePrevImage: true, contextChars: 4000 } });
  const inline = parts.filter((p) => p.inline_data).map((p) => p.inline_data.data);
  eq(inline, ['B0', 'B1']);
  ok(parts.some((p) => p.text && p.text.includes('이야기의 시작')), '도입 지시');

  const onlyNext = buildStepParts({ step: { kind: 'bridge', from: 1, to: 2 }, images, story: '앞 이야기', memo: '메모', opts: { includePrevImage: false, contextChars: 4000 } });
  eq(onlyNext.filter((p) => p.inline_data).length, 1);
  ok(onlyNext[0].text.includes('메모'), '메모 우선');
  ok(onlyNext[1].text.includes('앞 이야기'), '앞 내용');
});

await check('마지막 사진 앞 구간은 끝으로 향하라고 알려준다', () => {
  const images = [0, 1].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: 'X' }));
  const parts = buildStepParts({
    step: { kind: 'bridge', from: 0, to: 1 }, images, story: '', memo: '',
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

await check('메모를 함께 요청할 때만 지시가 붙는다', () => {
  const images = [0, 1].map((i) => ({ name: `${i + 1}.jpg`, mimeType: 'image/jpeg', base64: 'X' }));
  const step = { kind: 'bridge', from: 0, to: 1 };
  const base = { includePrevImage: true, contextChars: 4000 };

  const without = buildStepParts({ step, images, story: '', memo: '', opts: base });
  ok(!without.some((p) => p.text && p.text.includes(MEMO_MARKER)), '기본은 없음');

  const withMemo = buildStepParts({ step, images, story: '', memo: '기존 메모', opts: { ...base, askMemo: true } });
  ok(withMemo.some((p) => p.text && p.text.includes(MEMO_MARKER)), '표시줄 안내');
  ok(withMemo.some((p) => p.text && p.text.includes('갱신해')), '기존 메모가 있으면 갱신 지시');

  const ending = buildStepParts({ step: { kind: 'ending', from: 1 }, images, story: '', memo: '', opts: { ...base, askMemo: true } });
  ok(ending.some((p) => p.text && p.text.includes(MEMO_MARKER)), '마무리 대목도 같은 형식');
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

await check('저장할 때 생성 중(busy) 상태는 남기지 않는다', () => {
  eq(normalizePassages([
    { text: '쓰다 만 글', status: 'busy' },
    { text: '', status: 'busy' },
    { text: '완성', status: 'done' },
    { text: '', status: 'error', error: '차단됨' },
    null
  ]), [
    { text: '쓰다 만 글', status: 'done', error: '' },
    { text: '', status: 'empty', error: '' },
    { text: '완성', status: 'done', error: '' },
    { text: '', status: 'error', error: '차단됨' },
    { text: '', status: 'empty', error: '' }
  ]);
  eq(normalizePassages(undefined), []);
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
