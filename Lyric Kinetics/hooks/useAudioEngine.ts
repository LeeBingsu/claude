'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SPECTRUM_BANDS, type AudioFeatureFrame } from '@/lib/types';
import { energyEma, smoothFeatures, spectrumBandEdges } from '@/lib/audioFeatures';

export interface AudioEngine {
  /** Call once after a user gesture; wires the <audio> element into the graph. */
  attach: (el: HTMLAudioElement) => void;
  /** Read smoothed band features for the current moment. */
  readFeatures: () => AudioFeatureFrame;
  /** Seconds since the last live-detected beat (Infinity before the first). */
  sinceBeat: () => number;
  /** Seconds since each of the last few live beats, ascending. */
  recentBeats: () => number[];
  /** Stream carrying the track audio, for realtime MediaRecorder capture. */
  captureStream: () => MediaStream | null;
  resume: () => Promise<void>;
  ready: boolean;
}

const EDGES = spectrumBandEdges();

/**
 * Live Web Audio pipeline:
 *   <audio> → MediaElementSource → Analyser → Gain → speakers
 *                                          ↘ MediaStreamDestination (export)
 *
 * Band energies are normalised against a running peak and smoothed with the
 * same attack/release curve as the offline analysis, so the preview and the
 * HQ export react identically.
 */
export function useAudioEngine(): AudioEngine {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const binsRef = useRef<Uint8Array | null>(null);
  const featRef = useRef<AudioFeatureFrame>({
    bass: 0,
    mids: 0,
    highs: 0,
    level: 0,
    energy: 0,
    spectrum: new Array(SPECTRUM_BANDS).fill(0),
  });
  const peakRef = useRef({
    bass: 1e-4,
    mids: 1e-4,
    highs: 1e-4,
    level: 1e-4,
    spectrum: new Array(SPECTRUM_BANDS).fill(1e-4) as number[],
  });
  const beatRef = useRef({ history: [] as number[], recent: [] as number[] });
  const attachedRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);

  const attach = useCallback((el: HTMLAudioElement) => {
    if (attachedRef.current === el) return;
    // A media element can only ever feed one MediaElementSource; never re-attach.
    if (attachedRef.current) return;
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(el);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.45;
    const streamDest = ctx.createMediaStreamDestination();
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyser.connect(streamDest);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    streamDestRef.current = streamDest;
    binsRef.current = new Uint8Array(analyser.frequencyBinCount);
    attachedRef.current = el;
    setReady(true);
  }, []);

  const readFeatures = useCallback((): AudioFeatureFrame => {
    const analyser = analyserRef.current;
    const bins = binsRef.current;
    const ctx = ctxRef.current;
    if (!analyser || !bins || !ctx) return featRef.current;

    analyser.getByteFrequencyData(bins as Uint8Array<ArrayBuffer>);
    const hzPerBin = ctx.sampleRate / analyser.fftSize;
    const band = (lo: number, hi: number) => {
      const a = Math.max(1, Math.floor(lo / hzPerBin));
      const b = Math.min(bins.length - 1, Math.ceil(hi / hzPerBin));
      let sum = 0;
      for (let i = a; i <= b; i++) sum += bins[i];
      return sum / Math.max(1, b - a + 1) / 255;
    };

    const peak = peakRef.current;
    const rawSpectrum: number[] = [];
    for (let b = 0; b < SPECTRUM_BANDS; b++) {
      const v = band(EDGES[b], EDGES[b + 1]);
      peak.spectrum[b] = Math.max(peak.spectrum[b] * 0.9995, v, 0.12);
      rawSpectrum.push(v / peak.spectrum[b]);
    }

    const raw = {
      bass: band(20, 140),
      mids: band(350, 2200),
      highs: band(4000, 12000),
      level: band(20, 12000),
    };
    peak.bass = Math.max(peak.bass * 0.9995, raw.bass, 0.2);
    peak.mids = Math.max(peak.mids * 0.9995, raw.mids, 0.2);
    peak.highs = Math.max(peak.highs * 0.9995, raw.highs, 0.15);
    peak.level = Math.max(peak.level * 0.9995, raw.level, 0.2);

    const normalised: AudioFeatureFrame = {
      bass: raw.bass / peak.bass,
      mids: raw.mids / peak.mids,
      highs: raw.highs / peak.highs,
      level: raw.level / peak.level,
      energy: 0,
      spectrum: rawSpectrum,
    };
    const smoothed = smoothFeatures(featRef.current, normalised);
    smoothed.energy = energyEma(featRef.current.energy, smoothed.level, 60);
    featRef.current = smoothed;

    // Live beat detection: same energy-flux scheme as the offline analyser.
    const beat = beatRef.current;
    beat.history.push(normalised.bass);
    if (beat.history.length > 60) beat.history.shift();
    const avg = beat.history.reduce((a, b) => a + b, 0) / beat.history.length;
    const now = ctx.currentTime;
    const last = beat.recent[beat.recent.length - 1] ?? -Infinity;
    if (
      beat.history.length > 15 &&
      normalised.bass > 0.18 &&
      normalised.bass > avg * 1.38 &&
      now - last >= 0.22
    ) {
      beat.recent.push(now);
      if (beat.recent.length > 4) beat.recent.shift();
    }

    return featRef.current;
  }, []);

  const sinceBeat = useCallback(() => {
    const ctx = ctxRef.current;
    const recent = beatRef.current.recent;
    if (!ctx || recent.length === 0) return Infinity;
    return ctx.currentTime - recent[recent.length - 1];
  }, []);

  const recentBeats = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return [];
    const now = ctx.currentTime;
    return beatRef.current.recent.map((t) => now - t).sort((a, b) => a - b);
  }, []);

  const captureStream = useCallback(() => streamDestRef.current?.stream ?? null, []);

  const resume = useCallback(async () => {
    if (ctxRef.current?.state === 'suspended') await ctxRef.current.resume();
  }, []);

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return { attach, readFeatures, sinceBeat, recentBeats, captureStream, resume, ready };
}
