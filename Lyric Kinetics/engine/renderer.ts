import { SPECTRUM_BANDS, type FrameInput, type LyricLine, type LyricWord } from '@/lib/types';
import { beatPulse } from '@/lib/audioFeatures';
import { LineAnimator } from './lineAnimator';
import { ParticleField } from './particles';
import { THEMES, type Theme } from './themes';

export const STAGE_W = 1920;
export const STAGE_H = 1080;

const FONT_STACK = `'Archivo Black', 'Inter', 'Helvetica Neue', Arial, sans-serif`;

type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

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
 *
 * Frame pipeline: camera shake → aurora background → god rays → shockwaves →
 * spectrum ring → particles + bokeh → typography (GSAP char states → karaoke
 * fills → kinetic scale/tilt → liquid slices → glitch → RGB split) → ghost
 * echo → beat flash → HUD → vignette + grain.
 */
export class Renderer {
  private particles = new ParticleField({ count: 110, seed: 1337 });
  private bokeh = new ParticleField({ count: 14, seed: 4242, minSize: 26, maxSize: 80, alphaScale: 0.16 });
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

  render(ctx: Ctx2D, input: FrameInput): void {
    const { time, features, sinceBeat } = input;
    const pulse = beatPulse(sinceBeat);
    const theme = THEMES[input.theme] ?? THEMES.aurora;

    // Camera shake: high-frequency deterministic wobble kicked by beats.
    const shakeAmp = pulse * (3.5 + features.bass * 9);
    const shakeX = Math.sin(time * 89.7) * shakeAmp;
    const shakeY = Math.cos(time * 113.3) * shakeAmp * 0.7;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    // Overdraw past the shaken edges so borders never show.
    ctx.fillStyle = '#04050c';
    ctx.fillRect(-24, -24, STAGE_W + 48, STAGE_H + 48);

    if (input.mode === 'blink') {
      this.drawBlink(ctx, input, pulse, theme);
      this.drawHud(ctx, input, theme);
      this.drawVignetteAndGrain(ctx, time);
      ctx.restore();
      return;
    }

    this.drawBackground(ctx, time, features.bass, features.level, pulse, theme);
    this.drawGodRays(ctx, time, features.mids, features.energy, theme);
    this.drawShockwaves(ctx, input.recentBeats, features.energy, theme);
    const lineActive = this.isLineActive(input);
    this.drawSpectrumRing(ctx, features.spectrum, features.energy, theme, lineActive ? 0.13 : 0.55);
    this.drawParticles(ctx, time, features.highs, theme);
    this.drawLyrics(ctx, input, pulse, theme);
    this.drawBeatFlash(ctx, pulse, features.energy, theme);
    this.drawHud(ctx, input, theme);
    this.drawVignetteAndGrain(ctx, time);
    ctx.restore();
  }

  // ── "Don't Blink" mode ────────────────────────────────────────────────────

  /**
   * Rapid word-by-word hard cuts in the classic "Don't Blink" kinetic
   * typography style: each word lands alone and huge the instant it's sung,
   * holds until the next one, with deterministic per-word variations —
   * black/white frame inversions, accent-coloured words, stacked and vertical
   * compositions, punch-zoom landings and a slow per-line camera push.
   */
  private drawBlink(ctx: Ctx2D, input: FrameInput, pulse: number, theme: Theme): void {
    const { time, features, lines, lineIndex } = input;
    const line = lineIndex >= 0 ? lines[lineIndex] : undefined;
    if (!line || time > line.end + 0.45) {
      this.drawTitleCard(ctx, input, pulse, theme);
      return;
    }

    // Latest word that has started (linear scan — lines are short). Held
    // on screen until the next word starts: that's the style's rhythm.
    let wi = -1;
    for (let i = 0; i < line.words.length; i++) {
      if (line.words[i].time <= time) wi = i;
      else break;
    }
    if (wi === -1) return; // breath before the line's first word
    const word: LyricWord = line.words[wi];
    const sinceWord = time - word.time;
    const h = wordHash(lineIndex, wi);

    // Per-word deterministic styling decisions.
    const inverted = h % 7 === 0;
    const accent = !inverted && h % 5 === 2;
    const vertical = !inverted && word.text.length >= 5 && h % 6 === 3;
    const stacked = !vertical && wi > 0 && h % 4 === 1;
    const alignLeft = !vertical && !stacked && h % 10 === 9;

    if (inverted) {
      ctx.fillStyle = '#f1f2f7';
      ctx.fillRect(-24, -24, STAGE_W + 48, STAGE_H + 48);
    }

    // Camera: slow push-in across the line + punch on the word landing.
    const lineProgress = clamp01((time - line.time) / Math.max(0.001, line.end - line.time));
    const punch = Math.exp(-sinceWord * 16);
    const zoom = (1 + lineProgress * 0.07) * (1 + punch * 0.16 + features.bass * 0.02);
    const rot = (((h % 9) - 4) * 0.9 * Math.PI) / 180;

    ctx.save();
    ctx.translate(STAGE_W / 2, STAGE_H / 2);
    ctx.scale(zoom, zoom);
    ctx.rotate(rot);

    const ink = inverted ? '#0a0b10' : '#f1f2f7';
    const upper = word.text.toUpperCase();

    // Ghost of the previous word in stacked compositions.
    if (stacked) {
      const prev = line.words[wi - 1].text.toUpperCase();
      const pSize = fitFontSize(ctx, prev, STAGE_W * 0.5, 150);
      ctx.font = `900 ${pSize}px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = inverted ? 0.22 : 0.3;
      ctx.fillStyle = ink;
      ctx.fillText(prev, 0, -STAGE_H * 0.27);
      ctx.globalAlpha = 1;
    }

    // Fit the word: vertical words fit the frame height, others the width.
    const size = vertical
      ? fitFontSize(ctx, upper, STAGE_H * 0.76, 430)
      : fitFontSize(ctx, upper, STAGE_W * (alignLeft ? 0.86 : 0.78), upper.length <= 3 ? 460 : 380);
    ctx.font = `900 ${size}px ${FONT_STACK}`;
    ctx.textBaseline = 'middle';

    if (vertical) {
      ctx.rotate(-Math.PI / 2);
    }
    ctx.textAlign = alignLeft ? 'left' : 'center';
    const x = alignLeft ? -STAGE_W * 0.43 : 0;
    const y = stacked ? STAGE_H * 0.06 : 0;

    // RGB split on hard hits — additive, so dark frames only.
    const split = !inverted ? Math.max(0, features.bass - 0.45) * 22 + pulse * 6 : 0;
    if (split > 1.5) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#ff2a4d';
      ctx.fillText(upper, x - split, y);
      ctx.fillStyle = '#2ad4ff';
      ctx.fillText(upper, x + split, y);
      ctx.restore();
    }

    if (accent) {
      const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
      g.addColorStop(0, theme.gradTop);
      g.addColorStop(1, theme.gradBottom);
      ctx.fillStyle = g;
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = 34 + pulse * 30;
    } else {
      ctx.fillStyle = ink;
      ctx.shadowColor = inverted ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.16)';
      ctx.shadowBlur = 14;
    }
    ctx.fillText(upper, x, y);
    ctx.shadowBlur = 0;

    // Tiny progress tick: which word of the line we're on.
    ctx.restore();
    ctx.fillStyle = inverted ? 'rgba(10,11,16,0.5)' : 'rgba(241,242,247,0.45)';
    const tickW = 26;
    const totalW = line.words.length * tickW;
    for (let i = 0; i < line.words.length; i++) {
      ctx.globalAlpha = i <= wi ? 0.9 : 0.25;
      ctx.fillRect(STAGE_W / 2 - totalW / 2 + i * tickW, STAGE_H - 92, tickW - 8, 4);
    }
    ctx.globalAlpha = 1;
  }

  private isLineActive(input: FrameInput): boolean {
    const line = input.lineIndex >= 0 ? input.lines[input.lineIndex] : undefined;
    return Boolean(line && input.time <= line.end + 0.2);
  }

  // ── Background & atmosphere ───────────────────────────────────────────────

  private drawBackground(ctx: Ctx2D, t: number, bass: number, level: number, pulse: number, theme: Theme): void {
    // Drifting aurora blobs whose radius breathes with the low end.
    const blobs: Array<[number, number, number, string]> = [
      [
        STAGE_W * (0.3 + 0.12 * Math.sin(t * 0.21)),
        STAGE_H * (0.32 + 0.1 * Math.cos(t * 0.17)),
        STAGE_H * (0.55 + bass * 0.45 + pulse * 0.18),
        `rgba(${theme.blobA}, ${0.16 + bass * 0.22})`,
      ],
      [
        STAGE_W * (0.72 + 0.1 * Math.cos(t * 0.13 + 2)),
        STAGE_H * (0.68 + 0.12 * Math.sin(t * 0.19 + 1)),
        STAGE_H * (0.6 + bass * 0.5),
        `rgba(${theme.blobB}, ${0.12 + bass * 0.18})`,
      ],
      [
        STAGE_W * 0.5,
        STAGE_H * 0.5,
        STAGE_H * (0.9 + level * 0.3),
        `rgba(${theme.blobC}, ${0.05 + level * 0.07})`,
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

  /** Slowly rotating volumetric light wedges, brightening with the section energy. */
  private drawGodRays(ctx: Ctx2D, t: number, mids: number, energy: number, theme: Theme): void {
    const alpha = 0.035 + mids * 0.08 + energy * 0.06;
    if (alpha < 0.04) return;
    const cx = STAGE_W / 2;
    const cy = STAGE_H * 0.42;
    const reach = STAGE_H * 1.6;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const angle = t * 0.06 + (i * Math.PI * 2) / 7 + Math.sin(t * 0.11 + i) * 0.18;
      const halfWidth = 0.05 + 0.03 * Math.sin(t * 0.23 + i * 1.7);
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(angle) * reach, cy + Math.sin(angle) * reach);
      g.addColorStop(0, `rgba(${theme.rays}, ${alpha})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle - halfWidth) * reach, cy + Math.sin(angle - halfWidth) * reach);
      ctx.lineTo(cx + Math.cos(angle + halfWidth) * reach, cy + Math.sin(angle + halfWidth) * reach);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /** Expanding rings radiating from centre on every detected beat. */
  private drawShockwaves(ctx: Ctx2D, recentBeats: number[], energy: number, theme: Theme): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const since of recentBeats) {
      if (since > 1.2) continue;
      const r = 150 + since * 1050;
      const fade = 1 - since / 1.2;
      ctx.strokeStyle = `rgba(${theme.rays}, ${0.3 * fade * fade * (0.45 + energy)})`;
      ctx.lineWidth = 1.5 + 16 * fade;
      ctx.beginPath();
      ctx.arc(STAGE_W / 2, STAGE_H / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Mirrored 64-bar circular spectrum analyser around the centre. */
  private drawSpectrumRing(ctx: Ctx2D, spectrum: number[], energy: number, theme: Theme, alpha: number): void {
    const cx = STAGE_W / 2;
    const cy = STAGE_H / 2;
    const baseR = 300 + energy * 40;
    const bars = SPECTRUM_BANDS * 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < bars; i++) {
      // Mirror so the ring is symmetric left/right.
      const band = i < SPECTRUM_BANDS ? i : bars - 1 - i;
      const v = spectrum[band] ?? 0;
      const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
      const len = 14 + v * v * (120 + energy * 90);
      const hue = theme.hueMin + (band / SPECTRUM_BANDS) * (theme.hueMax - theme.hueMin);
      ctx.strokeStyle = `hsla(${hue}, ${theme.particleSat}%, 70%, ${alpha * (0.35 + v * 0.65)})`;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * baseR, cy + Math.sin(angle) * baseR);
      ctx.lineTo(cx + Math.cos(angle) * (baseR + len), cy + Math.sin(angle) * (baseR + len));
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawParticles(ctx: Ctx2D, t: number, highs: number, theme: Theme): void {
    // Soft bokeh discs behind the dust.
    for (const p of this.bokeh.snapshot(t * 0.5, highs * 0.5)) {
      const x = p.x * STAGE_W;
      const y = p.y * STAGE_H;
      const hue = theme.hueMin + p.hue01 * (theme.hueMax - theme.hueMin);
      const g = ctx.createRadialGradient(x, y, 0, x, y, p.size);
      g.addColorStop(0, `hsla(${hue}, ${theme.particleSat}%, 70%, ${p.alpha})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - p.size, y - p.size, p.size * 2, p.size * 2);
    }
    for (const p of this.particles.snapshot(t, highs)) {
      const hue = theme.hueMin + p.hue01 * (theme.hueMax - theme.hueMin);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsl(${hue} ${theme.particleSat}% 75%)`;
      ctx.beginPath();
      ctx.arc(p.x * STAGE_W, p.y * STAGE_H, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /** Quick additive screen flash riding the beat envelope. */
  private drawBeatFlash(ctx: Ctx2D, pulse: number, energy: number, theme: Theme): void {
    const a = pulse * pulse * (0.08 + energy * 0.12);
    if (a < 0.01) return;
    const g = ctx.createRadialGradient(STAGE_W / 2, STAGE_H / 2, 0, STAGE_W / 2, STAGE_H / 2, STAGE_H);
    g.addColorStop(0, `rgba(${theme.flash}, ${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, STAGE_W, STAGE_H);
    ctx.restore();
  }

  // ── Typography ────────────────────────────────────────────────────────────

  private drawLyrics(ctx: Ctx2D, input: FrameInput, pulse: number, theme: Theme): void {
    const { lines, lineIndex, time, features } = input;
    const line = lineIndex >= 0 ? lines[lineIndex] : undefined;
    // Intro and instrumental interludes get the cinematic title card.
    if (!line || time > line.end + 0.45) {
      this.drawTitleCard(ctx, input, pulse, theme);
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
          const pop = 1 + wordState.pop * 0.12; // fresh words punch outward
          tctx.save();
          tctx.translate(x + w / 2, y - layout.fontSize * 0.36);
          tctx.rotate((st.rot * Math.PI) / 180);
          tctx.scale(st.scaleX * pop, st.scaleY * pop);
          tctx.translate(0, st.y * layout.fontSize);
          tctx.globalAlpha = st.alpha * fadeOut * wordState.alpha;
          if (wordState.active) {
            const g = tctx.createLinearGradient(0, -layout.fontSize, 0, layout.fontSize * 0.4);
            g.addColorStop(0, theme.gradTop);
            g.addColorStop(0.55, theme.gradMid);
            g.addColorStop(1, theme.gradBottom);
            // Accent halo outline behind the active word's fill.
            tctx.strokeStyle = theme.accentA;
            tctx.lineWidth = Math.max(2, layout.fontSize * 0.025);
            tctx.shadowColor = theme.glow;
            tctx.shadowBlur = 30 + pulse * 40;
            tctx.strokeText(ch, -w / 2, layout.fontSize * 0.36);
            tctx.fillStyle = g;
            tctx.fillText(ch, -w / 2, layout.fontSize * 0.36);
          } else {
            tctx.fillStyle = wordState.sung ? theme.sung : theme.unsung;
            tctx.shadowColor = theme.glowSoft;
            tctx.shadowBlur = 12;
            tctx.fillText(ch, -w / 2, layout.fontSize * 0.36);
          }
          tctx.restore();
        }
        x += w;
      }
    }

    // Ghost echo: the previous line drifts up and dissolves as this one lands.
    const prev = lines[lineIndex - 1];
    if (prev && localTime < 0.9) {
      const k = localTime / 0.9;
      tctx.save();
      tctx.font = `900 44px ${FONT_STACK}`;
      tctx.textAlign = 'center';
      tctx.globalAlpha = 0.28 * (1 - k);
      tctx.fillStyle = theme.unsung;
      tctx.translate(STAGE_W / 2, STAGE_H / 2 - blockH / 2 - 90 - k * 110);
      tctx.scale(1 + k * 0.25, 1 + k * 0.25);
      tctx.fillText(truncate(prev.text, 44), 0, 0);
      tctx.restore();
      tctx.textAlign = 'left';
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

    this.compositeTextLayer(ctx, input, pulse);
  }

  /**
   * Composites the text layer onto the stage through the "liquid" pipeline:
   * per-line tilt + beat-driven kinetic scale → horizontal slice displacement
   * (two stacked sine fields, amplitude riding the bass) → glitch slice bursts
   * right on the beat → RGB channel split on hard hits.
   */
  private compositeTextLayer(ctx: Ctx2D, input: FrameInput, pulse: number): void {
    const { time: t, features, lineIndex, sinceBeat } = input;
    const bass = features.bass;
    const aCtx = this.scratchA.getContext('2d') as CanvasRenderingContext2D;
    aCtx.clearRect(0, 0, STAGE_W, STAGE_H);

    // Kinetic scale + a small deterministic tilt that alternates per line.
    const scale = 1 + pulse * 0.075 + bass * 0.035 + features.energy * 0.02;
    const tilt = (((lineIndex * 2654435761) % 9) - 4) * 0.0085; // ±~2°
    aCtx.save();
    aCtx.translate(STAGE_W / 2, STAGE_H / 2);
    aCtx.rotate(tilt);
    aCtx.scale(scale, scale);
    aCtx.translate(-STAGE_W / 2, -STAGE_H / 2);
    aCtx.drawImage(this.textLayer as CanvasImageSource, 0, 0);
    aCtx.restore();

    // Liquid slice displacement.
    const bCtx = this.scratchB.getContext('2d') as CanvasRenderingContext2D;
    bCtx.clearRect(0, 0, STAGE_W, STAGE_H);
    const amp = 1.2 + bass * 16 + pulse * 22 + features.energy * 6;
    const sliceH = 6;
    for (let y = 0; y < STAGE_H; y += sliceH) {
      const dx =
        Math.sin(y * 0.011 + t * 2.3) * amp * 0.6 +
        Math.sin(y * 0.027 - t * 1.55 + Math.sin(t * 0.4) * 3) * amp * 0.4;
      bCtx.drawImage(this.scratchA as CanvasImageSource, 0, y, STAGE_W, sliceH, dx, y, STAGE_W, sliceH);
    }

    // Glitch burst: in the first ~120ms after a hard beat, tear a few wide
    // slices sideways. Seeded by the frame's time bucket → deterministic.
    if (sinceBeat < 0.12 && bass > 0.45) {
      let seed = (Math.floor(t * 30) * 2654435761) >>> 0;
      const rnd = () => {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        return (seed >>> 0) / 4294967296;
      };
      for (let i = 0; i < 5; i++) {
        const gy = Math.floor(rnd() * (STAGE_H - 80));
        const gh = 18 + Math.floor(rnd() * 60);
        const gdx = (rnd() - 0.5) * 90 * (1 - sinceBeat / 0.12);
        bCtx.drawImage(this.scratchB as CanvasImageSource, 0, gy, STAGE_W, gh, gdx, gy, STAGE_W, gh);
      }
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

  /**
   * Cinematic title card for the intro and instrumental interludes: pulsing
   * rings, tracking animation on the title, shimmer sweep, artist rule lines.
   */
  private drawTitleCard(ctx: Ctx2D, input: FrameInput, pulse: number, theme: Theme): void {
    const { features, meta, time, lines, lineIndex } = input;
    // How long this card has been on screen (intro start or last line's end).
    const cardStart = lineIndex >= 0 ? lines[lineIndex].end + 0.45 : 0;
    const local = Math.max(0, time - cardStart);
    const settle = 1 - Math.pow(Math.max(0, 1 - local / 2.6), 3); // 0→1 ease-out

    const r = 70 + features.bass * 90 + pulse * 50;
    ctx.save();
    ctx.translate(STAGE_W / 2, STAGE_H / 2);
    for (let i = 3; i >= 1; i--) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (i / 3) * (1 + 0.06 * Math.sin(time * 1.3 + i)), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${theme.rays}, ${0.08 * i + features.bass * 0.15})`;
      ctx.lineWidth = 2 + features.bass * 5;
      ctx.stroke();
    }

    if (meta) {
      const title = truncate(meta.title.toUpperCase(), 24);
      const fontSize = 96;
      ctx.font = `900 ${fontSize}px ${FONT_STACK}`;
      ctx.textBaseline = 'alphabetic';

      // Tracking animation: letters glide from wide spacing into place.
      const spacing = 30 - settle * 22;
      const widths = Array.from(title).map((c) => (ctx as CanvasRenderingContext2D).measureText(c).width);
      const total = widths.reduce((a, b) => a + b, 0) + spacing * (title.length - 1);

      // Shimmer sweep: a moving highlight band across the gradient fill.
      const sweep = ((time * 0.22) % 1.6) - 0.3;
      const g = ctx.createLinearGradient(-total / 2, 0, total / 2, 0);
      const stop = clamp01(sweep);
      g.addColorStop(Math.max(0, stop - 0.18), theme.gradBottom);
      g.addColorStop(stop, theme.gradMid);
      g.addColorStop(Math.min(1, stop + 0.18), theme.gradTop);
      ctx.fillStyle = g;
      ctx.shadowColor = theme.glow;
      ctx.shadowBlur = 26 + pulse * 36;
      ctx.globalAlpha = 0.35 + settle * 0.65;

      let x = -total / 2;
      for (let i = 0; i < title.length; i++) {
        const wob = Math.sin(time * 1.4 + i * 0.7) * 4 * (1 - settle * 0.6);
        ctx.fillText(title[i], x, -6 + wob);
        x += widths[i] + spacing;
      }

      // Artist with rule lines either side.
      ctx.font = `600 30px ${FONT_STACK}`;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(200, 210, 235, 0.85)';
      const artist = truncate(meta.artist.toUpperCase(), 40);
      ctx.fillText(artist, 0, 64);
      const aw = (ctx as CanvasRenderingContext2D).measureText(artist).width;
      ctx.strokeStyle = `rgba(${theme.rays}, 0.4)`;
      ctx.lineWidth = 1.5;
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * (aw / 2 + 28), 54);
        ctx.lineTo(dir * (aw / 2 + 28 + 90 * settle), 54);
        ctx.stroke();
      }
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // ── HUD / framing ─────────────────────────────────────────────────────────

  private drawHud(ctx: Ctx2D, input: FrameInput, theme: Theme): void {
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
      g.addColorStop(0, theme.accentA);
      g.addColorStop(1, theme.accentB);
      ctx.fillStyle = g;
      ctx.fillRect(64, STAGE_H - 36, (STAGE_W - 128) * p, 3);
    }
  }

  private drawVignetteAndGrain(ctx: Ctx2D, t: number): void {
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

  private layoutLine(ctx: CanvasRenderingContext2D, lineIndex: number, line: LyricLine): LineLayout {
    const key = `${lineIndex}:${line.text}`;
    const cached = this.layoutCache.get(key);
    if (cached) return cached;

    const maxWidth = STAGE_W * 0.84;
    // Short punchy lines go mega-size for impact.
    let fontSize = line.text.length <= 16 ? 188 : 132;
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
): { active: boolean; sung: boolean; alpha: number; pop: number } {
  let cursor = 0;
  for (const w of line.words) {
    const start = cursor;
    const end = cursor + w.text.length;
    if (charIndex >= start && charIndex < end) {
      // Punch envelope: spikes when the word starts being sung, decays fast.
      const pop = time >= w.time ? Math.exp(-(time - w.time) * 8) : 0;
      if (time >= w.time && time < w.end) return { active: true, sung: false, alpha: 1, pop };
      if (time >= w.end) return { active: false, sung: true, alpha: 1, pop };
      return { active: false, sung: false, alpha: 0.9, pop: 0 };
    }
    cursor = end + 1; // skip the joining space
  }
  return { active: false, sung: time >= line.end, alpha: 1, pop: 0 };
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

/** Deterministic per-word hash for "Don't Blink" styling decisions. */
function wordHash(lineIndex: number, wordIndex: number): number {
  let h = (lineIndex * 73856093) ^ (wordIndex * 19349663) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 0x85ebca6b);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Largest font size (≤ max) at which `text` fits within `targetWidth`. */
function fitFontSize(ctx: Ctx2D, text: string, targetWidth: number, max: number): number {
  ctx.font = `900 100px ${FONT_STACK}`;
  const w100 = (ctx as CanvasRenderingContext2D).measureText(text).width || 1;
  return Math.min(max, (targetWidth / w100) * 100);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
