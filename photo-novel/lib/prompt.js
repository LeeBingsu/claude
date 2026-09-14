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
  step: { kind: 'bridge' | 'ending', from, to, opening }
  images: 전체 이미지 배열 (index 로 접근)
*/
export function buildStepParts({ step, images, story, memo, opts }) {
  const parts = [];
  const total = images.length;
  const context = trimContext(story, opts.contextChars ?? 4000);

  if (memo) parts.push({ text: `[이야기 메모 — 지금까지의 설정]\n${memo}` });
  if (context) parts.push({ text: `[지금까지 쓴 소설 본문]\n${context}` });

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
    return parts;
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
  parts.push({ text: task.join('\n') });
  return parts;
}

/* 장기 일관성용 메모를 갱신하는 별도 호출의 프롬프트 */
export function buildMemoParts({ memo, passage }) {
  return [{
    text: [
      '아래는 소설의 설정 메모와 방금 새로 쓴 본문이다.',
      '메모를 갱신해 다시 출력해라. 인물(이름·호칭·외모·말투), 관계, 장소, 시간의 흐름, 반복되는 소품, 문체와 어조만 담는다.',
      '600자를 넘기지 말고, 목록 형태의 짧은 문장으로만 쓴다. 메모 외의 말은 하지 마라.',
      '',
      `[기존 메모]\n${memo || '(없음)'}`,
      '',
      `[새로 쓴 본문]\n${passage}`
    ].join('\n')
  }];
}

/* 이미지 배열로부터 생성 단계 목록을 만든다. */
export function buildSteps(count, opts) {
  const steps = [];
  for (let i = 0; i < count - 1; i++) {
    steps.push({ kind: 'bridge', from: i, to: i + 1, opening: i === 0 && opts.opening });
  }
  if (opts.ending && count > 0) steps.push({ kind: 'ending', from: count - 1 });
  if (steps.length === 0 && count === 1) steps.push({ kind: 'ending', from: 0 });
  return steps;
}
