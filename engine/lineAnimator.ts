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
  // Slam zoom: chars crash down from huge scale, near-simultaneous — for drops
  (states: CharState[], tl: gsap.core.Timeline) => {
    tl.to(states, {
      y: 0,
      rot: 0,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 0.45,
      ease: 'expo.in',
      stagger: 0.012,
    }).to(
      states,
      { scaleX: 1.06, scaleY: 0.94, duration: 0.07, ease: 'power2.out', stagger: 0.006 },
      0.45,
    ).to(
      states,
      { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1.2, 0.5)', stagger: 0.006 },
      0.52,
    );
  },
  // Wave cascade: a ripple travels through the line
  (states: CharState[], tl: gsap.core.Timeline) => {
    tl.to(states, {
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 0.45,
      ease: 'power2.out',
      stagger: 0.04,
    })
      .to(states, { y: -0.16, duration: 0.34, ease: 'sine.inOut', stagger: 0.04 }, 0.1)
      .to(states, { y: 0, rot: 0, duration: 0.6, ease: 'elastic.out(1, 0.6)', stagger: 0.04 }, 0.44);
  },
  // Flip-in: chars unfold like louvres (scaleY sweep reads as a 3D flip)
  (states: CharState[], tl: gsap.core.Timeline) => {
    tl.to(states, {
      scaleY: 1,
      alpha: 1,
      duration: 0.65,
      ease: 'back.out(2.6)',
      stagger: { each: 0.03, from: 'edges' },
    }).to(states, { y: 0, rot: 0, scaleX: 1, duration: 0.7, ease: 'expo.out', stagger: 0.02 }, 0.05);
  },
];

function initialStateFor(variant: number, index: number, char: string): CharState {
  const dir = index % 2 === 0 ? 1 : -1;
  switch (variant % ENTRANCE_VARIANTS.length) {
    case 1:
      return { char, y: 0.35 * dir, rot: dir * (24 + (index % 5) * 7), alpha: 0, scaleX: 0.7, scaleY: 0.7 };
    case 2:
      return { char, y: 0.9, rot: 0, alpha: 0, scaleX: 1.45, scaleY: 0.25 };
    case 3:
      return { char, y: -0.2, rot: dir * 4, alpha: 0, scaleX: 3.4, scaleY: 3.4 };
    case 4:
      return { char, y: 0.55, rot: dir * 18, alpha: 0, scaleX: 0.85, scaleY: 0.85 };
    case 5:
      return { char, y: 0.12 * dir, rot: dir * 6, alpha: 0, scaleX: 1.25, scaleY: 0.02 };
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
    // Cheap deterministic shuffle so the variant order doesn't read as a cycle.
    const variant = ((lineIndex * 7 + (text.length % 5)) >>> 0) % ENTRANCE_VARIANTS.length;
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
