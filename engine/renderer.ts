import type { FrameInput, LyricLine } from '@/lib/types';
import { beatPulse } from '@/lib/audioFeatures';
import { LineAnimator } from './lineAnimator';
import { ParticleField } from './particles';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

const FONT_STACK = `'Archivo Black', 'Inter', 'Helvetica Neue', Arial, sans-serif`;

interface LayoutRow {
  /** Index of first char of this row within line.text */
  start: number;
  text: string;
  width: number;
}

interface LineLayout {
  fontSize: number;
  rows: LayoutRow[];
  charWidths: number[];
}

/**
 * Renders one frame of the lyric video. Everything here is a pure function of
 * FrameInput (time + precomputed/live audio features), so the live preview,
 * the realtime recorder and the frame-stepped HQ exporter all produce the
 * same pixels for the same inputs.
 */
export class Renderer {
  private particles = new ParticleField();
  private animator = new LineAnimator();
  private textLayer: HTMLCanvasElement | OffscreenCanvas;
  private scratchA: HTMLCanvasElement | OffscreenCanvas;
  private scratchB: HTMLCanvasElement | OffscreenCanvas;
  private grain: HTMLCanvasElement | OffscreenCanvas;
  private layoutCache = new Map<string, LineLayout>();

  constructor() {
    this.textLayer = makeCanvas(STAGE_W, STAGE_H);
    this.scratchA = makeCanvas(STAGE_W, STAGE_H);
    this.scratchB = makeCanvas(STAGE_W, STAGE_H);
    this.grain = makeGrain();
  }

  dispose(): void {
    this.animator.dispose();
  }

  render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, input: FrameInput): void {
    const { time, features, sinceBeat } = input;
    const pulse = beatPulse(sinceBeat);

    this.drawBackground(ctx, time, features.bass, features.level, pulse);
    this.drawParticles(ctx, time, features.highs);
    this.drawLyrics(ctx, input, pulse);
    this.drawHud(ctx, input);
    this.drawVignetteAndGrain(ctx, time);
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    t: number,
    bass: number,
    level: number,
    pulse: number,
  ): void {
    ctx.fillStyle = '#04050c';
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);

    // Two drifting aurora blobs whose radius breathes with the low end.
    const blobs: Array<[number, number, number, string]> = [
      [
        STAGE_W * (0.3 + 0.12 * Math.sin(t * 0.21)),
        STAGE_H * (0.32 + 0.1 * Math.cos(t * 0.17)),
        STAGE_H * (0.55 + bass * 0.45 + pulse * 0.18),
        `rgba(64, 92, 255, ${0.16 + bass * 0.22})`,
      ],
      [
        STAGE_W * (0.72 + 0.1 * Math.cos(t * 0.13 + 2)),
        STAGE_H * (0.68 + 0.12 * Math.sin(t * 0.19 + 1)),
        STAGE_H * (0.6 + bass * 0.5),
        `rgba(168, 64, 255, ${0.12 + bass * 0.18})`,
      ],
      [
        STAGE_W * 0.5,
        STAGE_H * 0.5,
        STAGE_H * (0.9 + level * 0.3),
        `rgba(24, 210, 220, ${0.05 + level * 0.07})`,
      ],
    ];
    for (const [x, y, r, color] of blobs) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    }
  }

  private drawParticles(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    t: number,
    highs: number,
  ): void {
    for (const p of this.particles.snapshot(t, highs)) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsl(${p.hue} 90% 75%)`;
      ctx.beginPath();
      ctx.arc(p.x * STAGE_W, p.y * STAGE_H, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ── Typography ────────────────────────────────────────────────────────────

  private drawLyrics(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    input: FrameInput,
    pulse: number,
  ): void {
    const { lines, lineIndex, time, features } = input;
    const line = lineIndex >= 0 ? lines[lineIndex] : undefined;
    if (!line) {
      this.drawIdleMark(ctx, input, pulse);
      return;
    }

    const tctx = this.textLayer.getContext('2d') as CanvasRenderingContext2D;
    tctx.clearRect(0, 0, STAGE_W, STAGE_H);

    // Outro fade: last 0.35s of the line slot.
    const fadeOut = clamp01((line.end - time) / 0.35);
    const localTime = time - line.time;
    const layout = this.layoutLine(tctx, lineIndex, line);
    const chars = this.animator.sample(lineIndex, line.text, localTime);

    tctx.textBaseline = 'alphabetic';
    tctx.font = `900 ${layout.fontSize}px ${FONT_STACK}`;

    const lineGap = layout.fontSize * 1.14;
    const blockH = layout.rows.length * lineGap;
    const baseY = STAGE_H / 2 - blockH / 2 + layout.fontSize * 0.78;

    for (let r = 0; r < layout.rows.length; r++) {
      const row = layout.rows[r];
      let x = STAGE_W / 2 - row.width / 2;
      const y = baseY + r * lineGap;
      for (let c = 0; c < row.text.length; c++) {
        const gi = row.start + c; // global char index in line.text
        const ch = row.text[c];
        const w = layout.charWidths[gi];
        if (ch !== ' ') {
          const st = chars[gi];
          const wordState = wordStateAt(line, gi, time);
          tctx.save();
          tctx.translate(x + w / 2, y - layout.fontSize * 0.36);
          tctx.rotate((st.rot * Math.PI) / 180);
          tctx.scale(st.scaleX, st.scaleY);
          tctx.translate(0, st.y * layout.fontSize);
          tctx.globalAlpha = st.alpha * fadeOut * wordState.alpha;
          if (wordState.active) {
            const g = tctx.createLinearGradient(0, -layout.fontSize, 0, layout.fontSize * 0.4);
            g.addColorStop(0, '#9ef3ff');
            g.addColorStop(0.55, '#ffffff');
            g.addColorStop(1, '#c6a8ff');
            tctx.fillStyle = g;
            tctx.shadowColor = 'rgba(120, 200, 255, 0.95)';
            tctx.shadowBlur = 26 + pulse * 34;
          } else {
            tctx.fillStyle = wordState.sung ? 'rgba(235, 240, 255, 0.96)' : 'rgba(160, 172, 205, 0.5)';
            tctx.shadowColor = 'rgba(90, 120, 255, 0.35)';
            tctx.shadowBlur = 12;
          }
          tctx.fillText(ch, -w / 2, layout.fontSize * 0.36);
          tctx.restore();
        }
        x += w;
      }
    }

    // Upcoming line whisper.
    const next = lines[lineIndex + 1];
    if (next && next.time - time < 4) {
      tctx.font = `600 ${Math.round(layout.fontSize * 0.3)}px ${FONT_STACK}`;
      tctx.textAlign = 'center';
      tctx.globalAlpha = 0.3 * clamp01((time - line.time) / 0.6) * fadeOut;
      tctx.fillStyle = '#aab4d8';
      tctx.shadowBlur = 0;
      tctx.fillText(truncate(next.text, 60), STAGE_W / 2, STAGE_H / 2 + blockH / 2 + layout.fontSize * 0.55);
      tctx.globalAlpha = 1;
      tctx.textAlign = 'left';
    }

    this.compositeTextLayer(ctx, input.time, features.bass, pulse);
  }

  /**
   * Composites the text layer onto the stage through the "liquid" pipeline:
   * beat-driven kinetic scale → horizontal slice displacement (two stacked
   * sine fields, amplitude riding the bass) → RGB channel split on hard hits.
   */
  private compositeTextLayer(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    t: number,
    bass: number,
    pulse: number,
  ): void {
    const aCtx = this.scratchA.getContext('2d') as CanvasRenderingContext2D;
    aCtx.clearRect(0, 0, STAGE_W, STAGE_H);

    // Kinetic scale about the centre.
    const scale = 1 + pulse * 0.075 + bass * 0.035;
    aCtx.save();
    aCtx.translate(STAGE_W / 2, STAGE_H / 2);
    aCtx.scale(scale, scale);
    aCtx.translate(-STAGE_W / 2, -STAGE_H / 2);
    aCtx.drawImage(this.textLayer as CanvasImageSource, 0, 0);
    aCtx.restore();

    // Liquid slice displacement.
    const bCtx = this.scratchB.getContext('2d') as CanvasRenderingContext2D;
    bCtx.clearRect(0, 0, STAGE_W, STAGE_H);
    const amp = 1.2 + bass * 16 + pulse * 22;
    const sliceH = 6;
    for (let y = 0; y < STAGE_H; y += sliceH) {
      const dx =
        Math.sin(y * 0.011 + t * 2.3) * amp * 0.6 +
        Math.sin(y * 0.027 - t * 1.55 + Math.sin(t * 0.4) * 3) * amp * 0.4;
      bCtx.drawImage(this.scratchA as CanvasImageSource, 0, y, STAGE_W, sliceH, dx, y, STAGE_W, sliceH);
    }

    // RGB split when the low end slams.
    const split = Math.max(0, bass - 0.42) * 26 + pulse * 7;
    if (split > 1.5) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.5;
      ctx.drawImage(tint(this.scratchB, this.scratchA, '#ff2a4d'), -split, 0);
      ctx.drawImage(tint(this.scratchB, this.scratchA, '#2ad4ff'), split, 0);
      ctx.restore();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(this.scratchB as CanvasImageSource, 0, 0);
      ctx.globalAlpha = 1;
    } else {
      ctx.drawImage(this.scratchB as CanvasImageSource, 0, 0);
    }
  }

  /** Pulsing monogram shown during intros/interludes with no active line. */
  private drawIdleMark(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    input: FrameInput,
    pulse: number,
  ): void {
    const { features, meta, time } = input;
    const r = 70 + features.bass * 90 + pulse * 50;
    ctx.save();
    ctx.translate(STAGE_W / 2, STAGE_H / 2);
    for (let i = 3; i >= 1; i--) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (i / 3) * (1 + 0.06 * Math.sin(time * 1.3 + i)), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(140, 180, 255, ${0.08 * i + features.bass * 0.15})`;
      ctx.lineWidth = 2 + features.bass * 5;
      ctx.stroke();
    }
    if (meta) {
      ctx.font = `900 64px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(225, 232, 255, 0.85)';
      ctx.shadowColor = 'rgba(120, 200, 255, 0.8)';
      ctx.shadowBlur = 24 + pulse * 30;
      ctx.fillText(truncate(meta.title, 28), 0, -10);
      ctx.font = `600 30px ${FONT_STACK}`;
      ctx.fillStyle = 'rgba(160, 175, 215, 0.8)';
      ctx.shadowBlur = 0;
      ctx.fillText(truncate(meta.artist, 40), 0, 44);
    }
    ctx.restore();
  }

  // ── HUD / framing ─────────────────────────────────────────────────────────

  private drawHud(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    input: FrameInput,
  ): void {
    const { meta, lines, time } = input;
    if (meta && input.lineIndex >= 0) {
      ctx.font = `700 26px ${FONT_STACK}`;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(190, 200, 230, 0.55)';
      ctx.fillText(`${truncate(meta.title, 40)} — ${truncate(meta.artist, 30)}`.toUpperCase(), 64, STAGE_H - 56);
    }
    // Progress hairline.
    const total = lines.length ? lines[lines.length - 1].end : 0;
    if (total > 0) {
      const p = clamp01(time / total);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(64, STAGE_H - 36, STAGE_W - 128, 3);
      const g = ctx.createLinearGradient(64, 0, STAGE_W - 64, 0);
      g.addColorStop(0, '#36d6ff');
      g.addColorStop(1, '#b36bff');
      ctx.fillStyle = g;
      ctx.fillRect(64, STAGE_H - 36, (STAGE_W - 128) * p, 3);
    }
  }

  private drawVignetteAndGrain(
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    t: number,
  ): void {
    const v = ctx.createRadialGradient(
      STAGE_W / 2,
      STAGE_H / 2,
      STAGE_H * 0.42,
      STAGE_W / 2,
      STAGE_H / 2,
      STAGE_H * 0.95,
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);

    // Animated film grain: deterministic tile offset per frame index.
    const fi = Math.floor(t * 60);
    const ox = (fi * 97) % 160;
    const oy = (fi * 53) % 160;
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.globalCompositeOperation = 'overlay';
    const pattern = ctx.createPattern(this.grain as CanvasImageSource, 'repeat');
    if (pattern) {
      ctx.translate(-ox, -oy);
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, STAGE_W + 160, STAGE_H + 160);
    }
    ctx.restore();
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  private layoutLine(
    ctx: CanvasRenderingContext2D,
    lineIndex: number,
    line: LyricLine,
  ): LineLayout {
    const key = `${lineIndex}:${line.text}`;
    const cached = this.layoutCache.get(key);
    if (cached) return cached;

    const maxWidth = STAGE_W * 0.84;
    let fontSize = 132;
    let rows: LayoutRow[] = [];
    for (; fontSize >= 56; fontSize -= 8) {
      ctx.font = `900 ${fontSize}px ${FONT_STACK}`;
      rows = wrap(ctx, line.text, maxWidth);
      if (rows.length <= (line.text.length > 70 ? 3 : 2)) break;
    }
    ctx.font = `900 ${fontSize}px ${FONT_STACK}`;
    const charWidths = Array.from(line.text).map((c) => ctx.measureText(c).width);
    for (const row of rows) {
      row.width = 0;
      for (let i = 0; i < row.text.length; i++) row.width += charWidths[row.start + i];
    }
    const layout = { fontSize, rows, charWidths };
    this.layoutCache.set(key, layout);
    return layout;
  }
}

// ── helpers ───────────────────────────────────────────────────────────────

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): LayoutRow[] {
  const words = text.split(' ');
  const rows: LayoutRow[] = [];
  let rowText = '';
  let rowStart = 0;
  let cursor = 0;
  for (const word of words) {
    const candidate = rowText ? `${rowText} ${word}` : word;
    if (rowText && ctx.measureText(candidate).width > maxWidth) {
      rows.push({ start: rowStart, text: rowText, width: 0 });
      rowStart = cursor;
      rowText = word;
    } else {
      rowText = candidate;
    }
    cursor += word.length + 1;
  }
  if (rowText) rows.push({ start: rowStart, text: rowText, width: 0 });
  return rows;
}

function wordStateAt(
  line: LyricLine,
  charIndex: number,
  time: number,
): { active: boolean; sung: boolean; alpha: number } {
  let cursor = 0;
  for (const w of line.words) {
    const start = cursor;
    const end = cursor + w.text.length;
    if (charIndex >= start && charIndex < end) {
      if (time >= w.time && time < w.end) return { active: true, sung: false, alpha: 1 };
      if (time >= w.end) return { active: false, sung: true, alpha: 1 };
      return { active: false, sung: false, alpha: 0.9 };
    }
    cursor = end + 1; // skip the joining space
  }
  return { active: false, sung: time >= line.end, alpha: 1 };
}

function tint(
  src: HTMLCanvasElement | OffscreenCanvas,
  scratch: HTMLCanvasElement | OffscreenCanvas,
  color: string,
): CanvasImageSource {
  const c = scratch.getContext('2d') as CanvasRenderingContext2D;
  c.clearRect(0, 0, STAGE_W, STAGE_H);
  c.drawImage(src as CanvasImageSource, 0, 0);
  c.save();
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = color;
  c.fillRect(0, 0, STAGE_W, STAGE_H);
  c.restore();
  return scratch as CanvasImageSource;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  return new OffscreenCanvas(w, h);
}

function makeGrain(): HTMLCanvasElement | OffscreenCanvas {
  const c = makeCanvas(160, 160);
  const ctx = c.getContext('2d') as CanvasRenderingContext2D;
  const img = ctx.createImageData(160, 160);
  // Seeded so exports are reproducible.
  let s = 0x9e3779b9;
  for (let i = 0; i < img.data.length; i += 4) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    const v = (s >>> 0) % 256;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
