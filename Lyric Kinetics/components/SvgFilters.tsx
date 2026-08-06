'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Custom SVG displacement filters for the DOM typography. GSAP drives the
 * feTurbulence frequency and feDisplacementMap scale so the hero title
 * "breathes" with a liquid distortion. (The canvas stage implements its own
 * pixel-level liquid pipeline so the effect survives video export.)
 */
export default function SvgFilters() {
  const turbRef = useRef<SVGFETurbulenceElement>(null);
  const dispRef = useRef<SVGFEDisplacementMapElement>(null);

  useEffect(() => {
    const turb = turbRef.current;
    const disp = dispRef.current;
    if (!turb || !disp) return;

    const state = { freq: 0.012, scale: 4 };
    const apply = () => {
      turb.setAttribute('baseFrequency', `${state.freq} ${state.freq * 2.4}`);
      disp.setAttribute('scale', String(state.scale));
    };

    const tl = gsap.timeline({ repeat: -1, yoyo: true, onUpdate: apply });
    tl.to(state, { freq: 0.028, scale: 14, duration: 3.2, ease: 'sine.inOut' }).to(state, {
      freq: 0.016,
      scale: 7,
      duration: 2.1,
      ease: 'sine.inOut',
    });
    apply();
    return () => {
      tl.kill();
    };
  }, []);

  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
      <defs>
        <filter id="liquid-title" x="-20%" y="-40%" width="140%" height="180%">
          <feTurbulence
            ref={turbRef}
            type="fractalNoise"
            baseFrequency="0.012 0.03"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            ref={dispRef}
            in="SourceGraphic"
            in2="noise"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
