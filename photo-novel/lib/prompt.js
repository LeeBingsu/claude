/* prompt.js - 장면과 장면 사이를 잇는 소설 본문을 얻기 위한 프롬프트를 만든다. */

export const LENGTHS = {
  xshort: { label: '아주 짧게 (100~180자)', hint: '한국어 기준 100~180자, 1~2문단' },
  short: { label: '짧게 (200~350자)', hint: '한국어 기준 200~350자, 2문단 내외' },
  medium: { label: '보통 (400~600자)', hint: '한국어 기준 400~600자, 2~3문단' },
  long: { label: '길게 (700~1000자)', hint: '한국어 기준 700~1000자, 3~4문단' },
  xlong: { label: '아주 길게 (1200자 이상)', hint: '한국어 기준 1200자 이상, 4문단 이상' }
};

export const POVS = {
  auto: '',
  first: '1인칭 주인공 시점',
  third: '3인칭 제한적 시점',
  omniscient: '3인칭 전지적 시점'
};

export const TENSES = { auto: '', past: '과거 시제', present: '현재 시제' };

/* 매 호출에 같이 보내는 시스템 지시문 */
export function buildSystem(opts) {
  const lines = [
    '너는 사진 연작을 한 편의 소설로 엮는 소설가다.',
    '사용자가 순서대로 찍은 사진을 보여주면, 너는 사진과 사진 사이에 들어갈 "소설 본문"만 쓴다.',
    '',
    '원칙:',
    '- 사진은 이야기의 한 순간을 보여주는 장면이다. 사진을 설명하거나 해설하지 말고, 그 순간이 자연스럽게 포함된 이야기를 써라.',
    '- "사진 속에는", "이 장면에서는", "다음 장면" 같은 메타 표현을 절대 쓰지 마라.',
    '- 제목, 소제목, 장면 번호, 머리말, 목록, 마크다운 기호를 쓰지 마라. 순수한 서사 문장만 출력한다.',
    '- 인물의 외모·이름·호칭·말투, 장소, 계절, 시간대, 소품은 앞부분과 어긋나지 않게 유지한다.',
    '- 이미 쓴 문장을 다시 요약하거나 반복하지 마라. 이야기는 항상 앞으로 나아간다.',
    '- 사진에 보이지 않는 시간의 흐름, 인물의 감정과 생각, 대화, 주변의 소리와 냄새를 채워 넣어 두 장면이 끊기지 않게 이어라.',
    '- 각 대목의 마지막 문장은 다음 사진이 보여주는 바로 그 순간에 도착해야 한다.'
  ];

  if (opts.language) lines.push(`- 모든 출력은 ${opts.language}로 쓴다.`);
  const pov = POVS[opts.pov] || '';
  if (pov) lines.push(`- 시점은 ${pov}으로 고정한다.`);
  const tense = TENSES[opts.tense] || '';
  if (tense) lines.push(`- 서술은 ${tense}로 쓴다.`);
  const len = LENGTHS[opts.length] || LENGTHS.medium;
  lines.push(`- 한 대목의 분량은 ${len.hint} 정도로 맞춘다.`);

  if (opts.instructions && opts.instructions.trim()) {
    lines.push(
      '',
      '사용자 맞춤 지시사항 (위 원칙과 충돌하면 이쪽을 우선한다):',
      opts.instructions.trim()
    );
  }
  return lines.join('\n');
}

/* 본문과 메모를 한 응답 안에서 가르는 표시줄 */
export const MEMO_MARKER = '<<<메모>>>';

const MEMO_LINE = /^[\s*_#>-]*<<<\s*메모\s*>>>[\s*_#:>-]*$/m;

/* 스트리밍 도중 표시줄이 반쯤 도착한 경우("<<<메") 화면에 새지 않게 잘라낸다. */
function trimPartialMarker(text) {
  for (let n = Math.min(MEMO_MARKER.length - 1, text.length); n > 0; n--) {
    if (text.endsWith(MEMO_MARKER.slice(0, n))) return text.slice(0, text.length - n);
  }
  return text;
}

/* 한 응답을 본문과 메모로 가른다. 표시줄이 없으면 전부 본문으로 본다. */
export function splitMemo(text) {
  if (!text) return { passage: '', memo: '' };
  let at = -1;
  let len = 0;
  const line = MEMO_LINE.exec(text);
  if (line) {
    at = line.index;
    len = line[0].length;
  } else {
    const i = text.indexOf(MEMO_MARKER);
    if (i >= 0) { at = i; len = MEMO_MARKER.length; }
  }
  if (at < 0) return { passage: trimPartialMarker(text).trimEnd(), memo: '' };
  return {
    // 표시줄에 ** 같은 장식이 붙어 오는 경우가 있어 양쪽에서 걷어낸다.
    passage: text.slice(0, at).replace(/[\s*_#>-]+$/, ''),
    memo: text.slice(at + len).replace(/^[\s*_#:>-]+/, '').trim()
  };
}

/* 같은 요청에서 메모까지 받아 올 때 덧붙이는 지시.
   메모 전체를 다시 쓰게 하지 않고, 이번 대목의 줄거리 한 줄과 달라진 설정만 받는다. */
export function memoInstruction(wantSettings) {
  const lines = [
    '',
    '본문을 다 쓴 뒤 아래 표시줄을 그대로 한 줄에 적고, 그 아래에 작업 노트를 적어라.',
    MEMO_MARKER,
    '줄거리: 이 대목에서 실제로 일어난 일을 한 줄(80자 이내)로 적는다.'
  ];
  if (wantSettings) {
    lines.push('설정: 이번에 새로 생기거나 달라진 설정(인물 이름·호칭·외모·말투, 관계, 장소, 시간대, 소품, 문체)만 한두 줄로 적는다. 달라진 것이 없으면 "없음" 이라고만 적는다.');
  }
  lines.push('표시줄 위에는 소설 본문만 있어야 한다. 이 요청에 한해 "본문만 출력" 규칙보다 이 지시가 우선한다.');
  return lines.join('\n');
}

/* 메모 블록을 줄거리 한 줄과 설정 변경으로 가른다. */
export function parseMemoBlock(text) {
  if (!text) return { beat: '', settings: '' };
  const clean = text.replace(/^[\s*_#>-]+/gm, '');
  const beatAt = clean.search(/^줄거리\s*[:：]/m);
  const setAt = clean.search(/^설정\s*[:：]/m);

  let beat = '';
  let settings = '';
  if (beatAt < 0 && setAt < 0) {
    beat = clean.trim();                      // 형식을 안 지키면 통째로 줄거리로 본다
  } else {
    if (beatAt >= 0) {
      const end = setAt > beatAt ? setAt : clean.length;
      beat = clean.slice(beatAt, end).replace(/^줄거리\s*[:：]/, '').trim();
    }
    if (setAt >= 0) {
      const end = beatAt > setAt ? beatAt : clean.length;
      settings = clean.slice(setAt, end).replace(/^설정\s*[:：]/, '').trim();
    }
  }
  if (/^(없음|없다|변화\s*없음|해당\s*없음)[.。]?$/.test(settings)) settings = '';
  return { beat: beat.replace(/\s+/g, ' ').trim(), settings };
}

/* 설정 메모에 새 줄을 더한다. 같은 내용은 넣지 않고, 너무 길어지면 오래된 줄부터 버린다. */
export function appendSettings(memo, add, cap = 3000) {
  const clean = (add || '').trim();
  if (!clean) return memo || '';
  const incoming = clean.split('\n')
    .map((l) => l.replace(/^[\s*_#>-]+/, '').trim())
    .filter(Boolean)
    .map((l) => `- ${l}`);
  const out = [];
  const seen = new Set();
  for (const line of (memo ? memo.split('\n') : []).concat(incoming)) {
    const key = line.replace(/\s+/g, '');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  while (out.join('\n').length > cap && out.length > 1) out.shift();
  return out.join('\n');
}

/* 대목을 가리키는 고정 이름. 옵션을 바꿔도 이미 쓴 글과 어긋나지 않게 한다. */
export function stepId(step) {
  if (step.kind === 'prologue') return 'pro';
  if (step.kind === 'ending') return 'end';
  return `b${step.from}`;
}

export function stepTitle(step) {
  if (step.kind === 'prologue') return '1번 장면 앞 · 도입부';
  if (step.kind === 'ending') return `${step.from + 1}번 장면 뒤 · 마무리`;
  return `${step.from + 1}→${step.to + 1}번 장면 사이`;
}

/*
  지금까지의 줄거리를 구간별 한 줄로 늘어놓는다.
  gaps 에 든 구간(아직 글이 없는 자리)은 비었다고 적어 준다.
  그래야 뒤 대목이 그 자리를 없는 셈 치지 않는다.
*/
export function buildTimeline(steps, beats, upto = Infinity, gaps = null) {
  const end = Math.min(steps.length, upto);
  const lines = [];
  for (let i = 0; i < end; i++) {
    const id = stepId(steps[i]);
    const beat = beats?.[id];
    if (beat) lines.push(`${stepTitle(steps[i])}: ${beat}`);
    else if (gaps?.has(id)) lines.push(`${stepTitle(steps[i])}: (비어 있음 — 아직 쓰지 않은 구간)`);
  }
  return lines.join('\n');
}

/* 메모를 갱신할 차례인지. 마지막 대목 뒤에는 쓸 곳이 없으니 건너뛴다. */
export function memoDue(stepIndex, totalSteps, every) {
  const n = Number(every) || 0;
  if (n <= 0) return false;
  if (stepIndex >= totalSteps - 1) return false;
  return (stepIndex + 1) % n === 0;
}

function imagePart(image) {
  return { inline_data: { mime_type: image.mimeType, data: image.base64 } };
}

/* 앞부분이 길어지면 끝쪽만 남긴다. */
export function trimContext(story, limit) {
  if (!story) return '';
  if (story.length <= limit) return story;
  return `…(앞부분 생략)\n${story.slice(-limit)}`;
}

/*
  step: { kind: 'prologue' | 'bridge' | 'ending', from, to, opening }
  images: 전체 이미지 배열 (index 로 접근)
*/
/* 막혔을 때 다시 보내며 덧붙이는 말. soften 을 켜면 표현을 우회하도록 부탁한다. */
export function retryNote(attempt, soften) {
  if (attempt <= 0) return '';
  const lines = [`앞선 시도(${attempt}번)가 중간에 끊겼다. 같은 장면을 다시, 다른 문장으로 써라.`];
  if (soften && attempt >= 2) {
    lines.push('직접적인 묘사 대신 암시와 여백으로 같은 흐름을 전해라. 이야기의 내용과 방향은 그대로 둔다.');
  }
  return lines.join('\n');
}

export function buildStepParts({ step, images, story, memo, timeline, nextText, gapBefore, opts }) {
  const parts = [];
  // 재시도 안내는 어느 갈래든 맨 끝에 붙인다.
  const finish = (list) => (opts.retryNote ? [...list, { text: opts.retryNote }] : list);
  const total = images.length;
  const context = trimContext(story, opts.contextChars ?? 4000);

  if (memo) parts.push({ text: `[이야기 메모 — 지금까지의 설정]\n${memo}` });
  if (timeline) parts.push({ text: `[지금까지의 줄거리 — 구간별로 무슨 일이 있었는지]\n${timeline}` });
  if (context) parts.push({ text: `[바로 앞까지 쓴 소설 본문]\n${context}` });
  if (nextText) parts.push({ text: `[이 대목 바로 뒤에 이어질 본문 — 이미 쓰여 있다]\n${trimContext(nextText, 1200)}` });

  // 앞이 비어 있거나 뒤가 이미 쓰여 있으면, 그 사이를 메우는 것이 이 대목의 일이다.
  const seam = [];
  if (gapBefore) {
    seam.push(
      `직전 구간(${gapBefore})은 아직 쓰이지 않아 비어 있다.`,
      '이 대목을 시작할 때, 그 사이에 있었던 일을 한두 문장으로 자연스럽게 흘려 넣어 이야기가 끊기지 않게 해라.'
    );
  }
  if (nextText) {
    seam.push(
      '이 대목이 끝나면 위의 "뒤에 이어질 본문" 이 곧바로 이어진다.',
      '그 첫 문장에 자연스럽게 닿도록 끝내고, 거기 이미 쓰인 내용을 되풀이하지 마라.'
    );
  }
  if (seam.length) parts.push({ text: seam.join('\n') });

  if (step.kind === 'prologue') {
    const first = images[0];
    parts.push({ text: `[첫 장면 사진 · 1/${total} — 파일명 ${first.name}]` });
    parts.push(imagePart(first));
    parts.push({
      text: [
        '이 사진이 이야기의 첫 장면이다. 이 순간에 이르기까지의 도입부를 써라.',
        '인물과 장소, 지금 어떤 상황인지를 자연스럽게 소개하고,',
        '마지막 문장이 이 사진이 보여주는 바로 그 순간에 도착하면서 끝나야 한다.',
        '앞 내용은 아직 없으니 되짚지 말고, 이야기를 여기서 연다.',
        '본문만 출력한다.'
      ].join('\n')
    });
    if (opts.askMemo) parts.push({ text: memoInstruction(opts.askSettings) });
    return finish(parts);
  }

  if (step.kind === 'ending') {
    const last = images[step.from];
    parts.push({ text: `[마지막 장면 사진 · ${step.from + 1}/${total} — 파일명 ${last.name}]` });
    parts.push(imagePart(last));
    parts.push({
      text: [
        '위 마지막 장면에서 이어지는 이야기의 마무리 대목을 써라.',
        '새로운 사진은 더 없다. 여운이 남는 결말로 끝맺되, 교훈이나 요약으로 정리하지 마라.',
        '본문만 출력한다.'
      ].join('\n')
    });
    if (opts.askMemo) parts.push({ text: memoInstruction(opts.askSettings) });
    return finish(parts);
  }

  const prev = images[step.from];
  const next = images[step.to];

  if (opts.includePrevImage) {
    parts.push({ text: `[직전 장면 사진 · ${step.from + 1}/${total} — 파일명 ${prev.name}]` });
    parts.push(imagePart(prev));
  }
  parts.push({ text: `[다음 장면 사진 · ${step.to + 1}/${total} — 파일명 ${next.name}]` });
  parts.push(imagePart(next));

  const task = [];
  if (step.opening) {
    task.push(
      `지금은 이야기의 시작이다. ${step.from + 1}번 장면(첫 번째 사진)에서 이야기를 열고,`,
      '인물과 장소를 자연스럽게 소개한 뒤 다음 장면으로 이어라.'
    );
  } else {
    task.push('직전 장면에서 곧바로 이어지는 대목을 써라.');
  }
  task.push(
    '이 대목은 두 사진 사이에 놓인다. 앞 장면의 순간이 끝난 직후부터 시작해,',
    '다음 사진이 보여주는 순간에 정확히 도착하면서 끝나야 한다.',
    '다음 사진의 상황·인물·장소·분위기가 갑작스럽지 않도록 그 사이의 시간과 감정을 채워라.'
  );
  if (step.to === total - 1 && !opts.ending) {
    task.push('다음 사진이 마지막 장면이므로, 이 대목이 이야기의 끝으로 향하도록 마무리해라.');
  }
  task.push('설명 없이 소설 본문만 출력한다.');
  if (opts.askMemo) task.push(memoInstruction(opts.askSettings));
  parts.push({ text: task.join('\n') });
  return finish(parts);
}

/* 메모를 따로 요청할 때의 프롬프트. 같은 요청 방식과 형식을 맞춘다. */
export function buildMemoParts({ memo, passage, wantSettings }) {
  const lines = [
    '아래는 소설의 설정 메모와 방금 새로 쓴 대목이다. 작업 노트를 아래 형식 그대로 적어라.',
    '',
    '줄거리: 이 대목에서 실제로 일어난 일을 한 줄(80자 이내)로.'
  ];
  if (wantSettings) {
    lines.push('설정: 이번에 새로 생기거나 달라진 설정만 한두 줄로. 달라진 것이 없으면 "없음".');
  }
  lines.push(
    '두 줄 외의 말은 하지 마라.',
    '',
    `[기존 설정 메모]\n${memo || '(없음)'}`,
    '',
    `[새로 쓴 대목]\n${passage}`
  );
  return [{ text: lines.join('\n') }];
}

/* 이미지 배열로부터 생성 단계 목록을 만든다. */
export function buildSteps(count, opts) {
  const steps = [];
  if (count === 0) return steps;
  if (opts.prologue) steps.push({ kind: 'prologue', to: 0 });
  for (let i = 0; i < count - 1; i++) {
    // 앞에 도입부를 따로 쓰면 첫 대목이 다시 이야기를 열 필요가 없다.
    steps.push({ kind: 'bridge', from: i, to: i + 1, opening: i === 0 && opts.opening && !opts.prologue });
  }
  if (opts.ending) steps.push({ kind: 'ending', from: count - 1 });
  if (!steps.some((s) => s.kind !== 'prologue') && count === 1) steps.push({ kind: 'ending', from: 0 });
  return steps;
}
