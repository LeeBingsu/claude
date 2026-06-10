import type { LyricLine, LyricWord } from './types';

const LINE_TAG = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
const WORD_TAG = /<(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?>/g;

function tagToSeconds(min: string, sec: string, frac?: string): number {
  const ms = frac ? Number(frac.padEnd(3, '0')) : 0;
  return Number(min) * 60 + Number(sec) + ms / 1000;
}

/**
 * Parses standard and "enhanced" (word-timestamped) LRC into LyricLines.
 * Lines without word tags get per-word times estimated by character weight,
 * which is what karaoke renderers conventionally do.
 */
export function parseLrc(lrc: string, trackDuration = Infinity): LyricLine[] {
  const raw: { time: number; body: string }[] = [];

  for (const line of lrc.split(/\r?\n/)) {
    LINE_TAG.lastIndex = 0;
    const stamps: number[] = [];
    let m: RegExpExecArray | null;
    let lastEnd = 0;
    while ((m = LINE_TAG.exec(line)) !== null && m.index === lastEnd) {
      stamps.push(tagToSeconds(m[1], m[2], m[3]));
      lastEnd = LINE_TAG.lastIndex;
    }
    if (stamps.length === 0) continue; // metadata tag or plain text
    const body = line.slice(lastEnd).trim();
    for (const t of stamps) raw.push({ time: t, body });
  }

  raw.sort((a, b) => a.time - b.time);

  const lines: LyricLine[] = raw.map((entry, i) => {
    const next = raw[i + 1];
    const end = Math.min(next ? next.time : entry.time + 8, trackDuration);
    const { text, words } = parseBody(entry.body, entry.time, end);
    return { time: entry.time, end, text, words };
  });

  // Drop empty interlude lines but keep them as gaps (renderer handles gaps).
  return lines.filter((l) => l.text.length > 0);
}

function parseBody(body: string, start: number, end: number): { text: string; words: LyricWord[] } {
  WORD_TAG.lastIndex = 0;
  if (!WORD_TAG.test(body)) {
    return { text: body, words: estimateWords(body, start, end) };
  }

  // Enhanced LRC: "<00:12.34>Hello <00:12.80>world"
  WORD_TAG.lastIndex = 0;
  const words: LyricWord[] = [];
  const parts: { time: number; text: string }[] = [];
  let m: RegExpExecArray | null;
  let lastIndex = 0;
  let lastTime = start;
  while ((m = WORD_TAG.exec(body)) !== null) {
    const chunk = body.slice(lastIndex, m.index).trim();
    if (chunk) parts.push({ time: lastTime, text: chunk });
    lastTime = tagToSeconds(m[1], m[2], m[3]);
    lastIndex = WORD_TAG.lastIndex;
  }
  const tail = body.slice(lastIndex).trim();
  if (tail) parts.push({ time: lastTime, text: tail });

  for (let i = 0; i < parts.length; i++) {
    for (const w of parts[i].text.split(/\s+/)) {
      words.push({ text: w, time: parts[i].time, end: parts[i + 1]?.time ?? end });
    }
  }
  return { text: words.map((w) => w.text).join(' '), words };
}

function estimateWords(text: string, start: number, end: number): LyricWord[] {
  const tokens = text.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  // Weight by character count; longer words get sung longer, roughly.
  const weights = tokens.map((t) => t.length + 1);
  const total = weights.reduce((a, b) => a + b, 0);
  // Vocals rarely occupy the whole slot — leave a small breath at the end.
  const usable = Math.max(0.4, (end - start) * 0.92);
  const words: LyricWord[] = [];
  let cursor = start;
  for (let i = 0; i < tokens.length; i++) {
    const dur = (weights[i] / total) * usable;
    words.push({ text: tokens[i], time: cursor, end: cursor + dur });
    cursor += dur;
  }
  return words;
}

/** Binary search for the active line index at time t, or -1 before the first line. */
export function lineIndexAt(lines: LyricLine[], t: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}
