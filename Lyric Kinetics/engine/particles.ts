/**
 * Deterministic particle field. Every particle's position is a pure function
 * of (seed, time), so live playback and offline export render identically and
 * seeking never desynchronises the field.
 */

export interface ParticleSnapshot {
  x: number; // 0..1
  y: number; // 0..1
  size: number; // px at 1080p
  alpha: number;
  /** 0..1 — mapped onto the active theme's hue range at draw time. */
  hue01: number;
}

interface ParticleDef {
  baseX: number;
  baseY: number;
  driftX: number;
  driftY: number;
  speedX: number;
  speedY: number;
  phaseX: number;
  phaseY: number;
  rise: number;
  size: number;
  twinkle: number;
  hue01: number;
}

export interface ParticleFieldOptions {
  count?: number;
  seed?: number;
  /** Base size range in px at 1080p. */
  minSize?: number;
  maxSize?: number;
  /** Base alpha scale. */
  alphaScale?: number;
}

// Mulberry32 — tiny seeded PRNG so the field is stable across sessions.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class ParticleField {
  private defs: ParticleDef[];
  private alphaScale: number;

  constructor({ count = 110, seed = 1337, minSize = 1, maxSize = 3.6, alphaScale = 1 }: ParticleFieldOptions = {}) {
    const rnd = mulberry32(seed);
    this.alphaScale = alphaScale;
    this.defs = Array.from({ length: count }, () => ({
      baseX: rnd(),
      baseY: rnd(),
      driftX: 0.02 + rnd() * 0.06,
      driftY: 0.015 + rnd() * 0.05,
      speedX: 0.12 + rnd() * 0.5,
      speedY: 0.1 + rnd() * 0.45,
      phaseX: rnd() * Math.PI * 2,
      phaseY: rnd() * Math.PI * 2,
      rise: 0.004 + rnd() * 0.02,
      size: minSize + rnd() * (maxSize - minSize),
      twinkle: 0.5 + rnd() * 2.2,
      hue01: rnd(),
    }));
  }

  snapshot(time: number, energy: number): ParticleSnapshot[] {
    return this.defs.map((d) => {
      const y = ((d.baseY - time * d.rise) % 1 + 1) % 1;
      return {
        x: ((d.baseX + Math.sin(time * d.speedX + d.phaseX) * d.driftX) % 1 + 1) % 1,
        y: ((y + Math.sin(time * d.speedY + d.phaseY) * d.driftY) % 1 + 1) % 1,
        size: d.size * (1 + energy * 1.6),
        alpha:
          (0.12 + 0.5 * Math.abs(Math.sin(time * d.twinkle + d.phaseX)) * (0.4 + energy)) *
          this.alphaScale,
        hue01: d.hue01,
      };
    });
  }
}
