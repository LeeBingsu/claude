'use client';

import { useEffect, useRef } from 'react';
import type { LyricLine, OfflineAnalysis } from '@/lib/types';
import { lineIndexAt } from '@/lib/lrc';
import { sinceBeatAt } from '@/lib/audioFeatures';
import { Renderer, STAGE_W, STAGE_H } from '@/engine/renderer';
import type { AudioEngine } from '@/hooks/useAudioEngine';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  lines: LyricLine[];
  meta: { title: string; artist: string } | null;
  engine: AudioEngine;
  analysis: OfflineAnalysis | null;
  /** High-resolution playhead from useLyricSync. */
  timeAt: () => number;
  /** The exporter flips this off while it owns the canvas. */
  liveLoopEnabled: React.RefObject<boolean>;
}

/**
 * Live preview loop. Each animation frame it assembles a FrameInput — the
 * precise playhead, live Web Audio features and beat clock — and hands it to
 * the same pure Renderer the exporters use.
 */
export default function KineticStage({
  canvasRef,
  lines,
  meta,
  engine,
  analysis,
  timeAt,
  liveLoopEnabled,
}: Props) {
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = STAGE_W;
    canvas.height = STAGE_H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderer = new Renderer();
    rendererRef.current = renderer;
    let raf = 0;
    let fontsReady = false;
    // The canvas can't draw a webfont until it's loaded.
    document.fonts.load(`900 100px 'Archivo Black'`).finally(() => (fontsReady = true));

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!liveLoopEnabled.current || !fontsReady) return;
      const t = timeAt();
      const features = engine.ready
        ? engine.readFeatures()
        : { bass: 0.15, mids: 0.1, highs: 0.08, level: 0.12 };
      // Prefer the offline beat grid when we have it (it's steadier); fall
      // back to live detection before analysis completes.
      const sinceBeat = analysis ? sinceBeatAt(analysis.beats, t) : engine.sinceBeat();
      renderer.render(ctx, {
        time: t,
        features,
        sinceBeat,
        lines,
        lineIndex: lineIndexAt(lines, t),
        meta,
      });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [canvasRef, lines, meta, engine, analysis, timeAt, liveLoopEnabled]);

  return (
    <div className="stage-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
