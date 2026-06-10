import gsap from 'gsap';

/**
 * Per-character transform state sampled from a paused GSAP timeline.
 * Timelines are stepped with `.time(t)` instead of running on the ticker,
 * which makes the animation a pure function of time — identical results in
 * the live preview and in the frame-by-frame offline export.
 */
export interface CharState {
  char: string;
  /** Vertical offset in em (multiplied by font size at draw time). */
  y: number;
  /** Rotation in degrees. */
  rot: number;
  alpha: number;
  scaleX: number;
  scaleY: number;
}

interface BuiltLine {
  text: string;
  states: CharState[];
  timeline: gsap.core.Timeline;
}

const ENTRANCE_VARIANTS = [
  // Rise + unfold
  (states: CharState[], tl: gsap.core.Timeline) => {
    tl.to(states, {
      y: 0,
      rot: 0,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 0.9,
      ease: 'expo.out',
      stagger: 0.035,
    });
  },
  // Split-rotation: alternating chars swing in from opposite directions
  (states: CharState[], tl: gsap.core.Timeline) => {
    tl.to(states, {
      y: 0,
      rot: 0,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 1.05,
      ease: 'back.out(2.1)',
      stagger: { each: 0.03, from: 'center' },
    });
  },
  // Elastic vertical crush
  (states: CharState[], tl: gsap.core.Timeline) => {
    tl.to(states, {
      y: 0,
      rot: 0,
      alpha: 1,
      duration: 0.5,
      ease: 'power3.out',
      stagger: 0.025,
    }).to(
      states,
      {
        scaleX: 1,
        scaleY: 1,
        duration: 1.15,
        ease: 'elastic.out(1, 0.45)',
        stagger: 0.025,
      },
      0.08,
    );
  },
];

function initialStateFor(variant: number, index: number, char: string): CharState {
  const dir = index % 2 === 0 ? 1 : -1;
  switch (variant % ENTRANCE_VARIANTS.length) {
    case 1:
      return { char, y: 0.35 * dir, rot: dir * (24 + (index % 5) * 7), alpha: 0, scaleX: 0.7, scaleY: 0.7 };
    case 2:
      return { char, y: 0.9, rot: 0, alpha: 0, scaleX: 1.45, scaleY: 0.25 };
    default:
      return { char, y: 0.85, rot: dir * 12, alpha: 0, scaleX: 1, scaleY: 0.65 };
  }
}

export class LineAnimator {
  private built = new Map<number, BuiltLine>();

  /**
   * Samples character states for a line at `localTime` seconds after the line
   * started. Builds (and caches) a paused GSAP timeline on first request.
   */
  sample(lineIndex: number, text: string, localTime: number): CharState[] {
    let built = this.built.get(lineIndex);
    if (!built || built.text !== text) {
      built?.timeline.kill();
      built = this.build(lineIndex, text);
      this.built.set(lineIndex, built);
    }
    built.timeline.time(Math.max(0, Math.min(localTime, built.timeline.duration())));
    return built.states;
  }

  private build(lineIndex: number, text: string): BuiltLine {
    const variant = lineIndex % ENTRANCE_VARIANTS.length;
    const states = Array.from(text).map((char, i) => initialStateFor(variant, i, char));
    const timeline = gsap.timeline({ paused: true });
    ENTRANCE_VARIANTS[variant](states, timeline);
    return { text, states, timeline };
  }

  dispose(): void {
    for (const b of this.built.values()) b.timeline.kill();
    this.built.clear();
  }
}
