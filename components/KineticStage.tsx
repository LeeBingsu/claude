'use client';

import { useEffect, useRef } from 'react';
import { EMPTY_FEATURES, type LyricLine, type OfflineAnalysis, type ThemeName } from '@/lib/types';
import { lineIndexAt } from '@/lib/lrc';
import { recentBeatsAt, sinceBeatAt } from '@/lib/audioFeatures';
import { Renderer, STAGE_W, STAGE_H } from '@/engine/renderer';
import type { AudioEngine } from '@/hooks/useAudioEngine';

interface Props {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  lines: LyricLine[];
  meta: { title: string; artist: string } | null;
  engine: AudioEngine;
  analysis: OfflineAnalysis | null;
  theme: ThemeName;
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
  theme,
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
        : { ...EMPTY_FEATURES, bass: 0.15, mids: 0.1, highs: 0.08, level: 0.12 };
      // Prefer the offline beat grid when we have it (it's steadier); fall
      // back to live detection before analysis completes.
      const sinceBeat = analysis ? sinceBeatAt(analysis.beats, t) : engine.sinceBeat();
      const recentBeats = analysis ? recentBeatsAt(analysis.beats, t) : engine.recentBeats();
      renderer.render(ctx, {
        time: t,
        features,
        sinceBeat,
        recentBeats,
        lines,
        lineIndex: lineIndexAt(lines, t),
        meta,
        theme,
      });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [canvasRef, lines, meta, engine, analysis, theme, timeAt, liveLoopEnabled]);

  return (
    <div className="stage-wrap">
      <canvas ref={canvasRef} />
    </div>
  );
}
