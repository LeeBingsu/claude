/* poster.js - 사진을 어둡게 깔고 그 위에 글을 얹어 한 장의 그림으로 만든다. */

/* 라틴 낱말은 붙여 두고, 한글·한자·가나는 글자 단위로 끊는다. */
const TOKEN = /\s+|[A-Za-z0-9][A-Za-z0-9'’`-]*[.,!?;:)\]}"'’”]*|[^\s]/gu;

/*
  measure(text) 로 폭을 재면서 줄을 나눈다. 줄바꿈은 그대로 살린다.
  순수 함수라 노드에서도 검사할 수 있다.
*/
export function wrapLines(measure, text, maxWidth) {
  const out = [];
  for (const para of String(text || '').split('\n')) {
    if (!para.trim()) { out.push(''); continue; }
    let line = '';
    for (const token of para.match(TOKEN) || []) {
      const isSpace = /^\s+$/.test(token);
      if (isSpace && !line) continue;                       // 줄 첫머리 공백은 버린다
      const next = line + token;
      if (line && measure(next) > maxWidth) {
        out.push(line.trimEnd());
        line = isSpace ? '' : token;
      } else {
        line = next;
      }
      // 한 낱말이 한 줄보다 길면 글자 단위로 자른다
      while (measure(line) > maxWidth && line.length > 1) {
        let cut = line.length - 1;
        while (cut > 1 && measure(line.slice(0, cut)) > maxWidth) cut--;
        out.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

export const POSTER_DEFAULTS = {
  darken: 0.55,        // 0~1, 사진을 얼마나 어둡게
  fontScale: 0.032,    // 글자 크기 = 가로폭 × 이 값
  align: 'left',       // left | center
  position: 'bottom',  // top | center | bottom
  showTitle: true,
  format: 'image/jpeg',
  quality: 0.92,
  maxWidth: 4096       // 캔버스가 감당 못 할 만큼 큰 사진만 줄인다
};

const FONT_STACK = '"Nanum Myeongjo", "Apple SD Gothic Neo", "Noto Serif KR", "Hiragino Mincho ProN", serif';

/* 캔버스에 그려 Blob 으로 돌려준다. 브라우저에서만 쓴다. */
export async function renderPoster(image, text, options = {}) {
  const o = { ...POSTER_DEFAULTS, ...options };
  // 줄이기 전 원본이 남아 있으면 그 위에 글을 얹는다.
  const bitmap = await createImageBitmap(image.original || image.blob);
  const scale = Math.min(1, o.maxWidth / Math.max(bitmap.width, bitmap.height) || 1);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  // 사진을 어둡게 깔고, 글이 놓일 쪽을 조금 더 눌러 준다.
  ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, Math.max(0, o.darken))})`;
  ctx.fillRect(0, 0, width, height);
  if (o.position !== 'center') {
    const from = o.position === 'bottom' ? height : 0;
    const to = o.position === 'bottom' ? height * 0.45 : height * 0.55;
    const grad = ctx.createLinearGradient(0, from, 0, to);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  const pad = Math.round(width * 0.075);
  const boxWidth = width - pad * 2;
  const bodySize = Math.max(12, Math.round(width * o.fontScale));
  const titleSize = Math.round(bodySize * 1.55);
  const lineHeight = Math.round(bodySize * 1.75);
  const titleLineHeight = Math.round(titleSize * 1.3);

  const bodyFont = `${bodySize}px ${FONT_STACK}`;
  const titleFont = `700 ${titleSize}px ${FONT_STACK}`;
  const measureWith = (font) => {
    ctx.font = font;
    return (s) => ctx.measureText(s).width;
  };

  const titleLines = o.showTitle && text.title
    ? wrapLines(measureWith(titleFont), text.title, boxWidth)
    : [];
  const bodyLines = wrapLines(measureWith(bodyFont), text.body || '', boxWidth);

  const gap = titleLines.length ? Math.round(bodySize * 1.2) : 0;
  const blockHeight = titleLines.length * titleLineHeight + gap + bodyLines.length * lineHeight;

  let y;
  if (o.position === 'top') y = pad + titleSize;
  else if (o.position === 'center') y = Math.max(pad + titleSize, (height - blockHeight) / 2 + bodySize);
  else y = Math.max(pad + titleSize, height - pad - blockHeight + titleSize);

  ctx.textAlign = o.align === 'center' ? 'center' : 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
  ctx.shadowBlur = Math.round(bodySize * 0.5);
  ctx.shadowOffsetY = Math.round(bodySize * 0.08);
  const x = o.align === 'center' ? width / 2 : pad;

  ctx.fillStyle = '#ffffff';
  ctx.font = titleFont;
  for (const line of titleLines) {
    ctx.fillText(line, x, y);
    y += titleLineHeight;
  }
  if (titleLines.length) y += gap;

  ctx.font = bodyFont;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
  for (const line of bodyLines) {
    if (line) ctx.fillText(line, x, y);
    y += lineHeight;
  }

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, o.format, o.quality));
  if (!blob) throw new Error('그림을 만들지 못했습니다.');
  return blob;
}
