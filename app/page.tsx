'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { LyricLine, OfflineAnalysis, TrackMeta } from '@/lib/types';
import { parseLrc } from '@/lib/lrc';
import { analyzeBuffer } from '@/lib/audioFeatures';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useLyricSync } from '@/hooks/useLyricSync';
import { useExporter } from '@/hooks/useExporter';
import SvgFilters from '@/components/SvgFilters';
import UrlForm from '@/components/UrlForm';
import AudioDrop from '@/components/AudioDrop';
import KineticStage from '@/components/KineticStage';
import TransportBar from '@/components/TransportBar';
import ExportPanel from '@/components/ExportPanel';

export default function StudioPage() {
  // ── Pipeline state ────────────────────────────────────────────────────────
  const [meta, setMeta] = useState<TrackMeta | null>(null);
  const [artist, setArtist] = useState('');
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [lyricStatus, setLyricStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [lyricError, setLyricError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Refs shared across the live loop and exporters.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const analysisRef = useRef<OfflineAnalysis | null>(null);
  const liveLoopEnabled = useRef(true);
  const [analysis, setAnalysis] = useState<OfflineAnalysis | null>(null);

  const engine = useAudioEngine();
  const { timeAt } = useLyricSync(audioRef, lines);

  const displayMeta = useMemo(
    () => (title || artist ? { title: title || 'Untitled', artist: artist || 'Unknown artist' } : null),
    [title, artist],
  );
  const displayMetaRef = useRef(displayMeta);
  displayMetaRef.current = displayMeta;
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const exporter = useExporter({
    canvas: () => canvasRef.current,
    audioEl: () => audioRef.current,
    audioCaptureStream: engine.captureStream,
    audioBuffer: () => bufferRef.current,
    analysis: () => analysisRef.current,
    lines: () => linesRef.current,
    meta: () => displayMetaRef.current,
    setLiveLoopEnabled: (v) => (liveLoopEnabled.current = v),
  });

  // ── Step 1: resolve URL → metadata ───────────────────────────────────────
  const onResolved = useCallback((m: TrackMeta) => {
    setMeta(m);
    setArtist(m.artist);
    setTitle(m.title);
    setLines([]);
    setLyricStatus('idle');
  }, []);

  // ── Step 2: fetch synced lyrics ──────────────────────────────────────────
  const fetchLyrics = useCallback(async () => {
    setLyricStatus('loading');
    setLyricError(null);
    try {
      const params = new URLSearchParams({ artist, title });
      const dur = bufferRef.current?.duration;
      if (dur) params.set('duration', String(Math.round(dur)));
      const res = await fetch(`/api/lyrics?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Lyric lookup failed.');
      const parsed = parseLrc(data.syncedLyrics, dur ?? Infinity);
      if (parsed.length === 0) throw new Error('Synced lyrics were empty after parsing.');
      setLines(parsed);
      setLyricStatus('ok');
    } catch (err) {
      setLyricStatus('error');
      setLyricError(err instanceof Error ? err.message : 'Lyric lookup failed.');
    }
  }, [artist, title]);

  // Auto-fetch once metadata lands.
  useEffect(() => {
    if (meta && lyricStatus === 'idle' && (title || artist)) void fetchLyrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta]);

  // ── Step 3: audio intake → decode → offline analysis ─────────────────────
  const onAudioFile = useCallback(
    async (file: File) => {
      setAnalyzing(true);
      try {
        const arrayBuf = await file.arrayBuffer();
        const decodeCtx = new AudioContext();
        const buffer = await decodeCtx.decodeAudioData(arrayBuf);
        await decodeCtx.close();
        bufferRef.current = buffer;

        // Yield a frame so the spinner paints before the FFT pass.
        await new Promise((r) => setTimeout(r, 30));
        const result = analyzeBuffer(buffer, 60);
        analysisRef.current = result;
        setAnalysis(result);

        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(file);
        });
        setAudioName(file.name);
        // A duration is now available — retry lyrics if the first pass failed.
        if (lyricStatus === 'error') void fetchLyrics();
      } catch (err) {
        alert(`Could not decode that audio file: ${err instanceof Error ? err.message : err}`);
      } finally {
        setAnalyzing(false);
      }
    },
    [fetchLyrics, lyricStatus],
  );

  const onPlay = useCallback(() => {
    const el = audioRef.current;
    if (el) engine.attach(el);
    void engine.resume();
  }, [engine]);

  const studioReady = Boolean(audioUrl && lines.length > 0);

  return (
    <main className="shell">
      <SvgFilters />

      <header className="hero">
        <h1>LYRIC KINETICS</h1>
        <p>
          Paste a track link, drop in the audio, and watch the words move — beat-reactive kinetic
          typography rendered on canvas and exported to MP4 without a single server frame.
        </p>
      </header>

      <section className="glass panel">
        <h2>
          <span className="step">1</span> Track link
        </h2>
        <UrlForm onResolved={onResolved} />
        {meta && (
          <div className="track-card" style={{ marginTop: 18 }}>
            {meta.thumbnail && (
              <Image src={meta.thumbnail} alt="" width={84} height={84} unoptimized />
            )}
            <div className="fields">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                aria-label="Track title"
              />
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist"
                aria-label="Artist"
              />
              <button className="btn" onClick={() => void fetchLyrics()} disabled={lyricStatus === 'loading'}>
                {lyricStatus === 'loading' ? 'Searching…' : 'Refetch lyrics'}
              </button>
            </div>
            <span className={`badge${lyricStatus === 'ok' ? ' ok' : ''}`}>
              {lyricStatus === 'ok'
                ? `${lines.length} synced lines`
                : lyricStatus === 'loading'
                  ? 'Searching LRCLIB…'
                  : meta.source}
            </span>
          </div>
        )}
        {lyricStatus === 'error' && lyricError && <div className="error">{lyricError}</div>}
      </section>

      <section className="glass panel">
        <h2>
          <span className="step">2</span> Audio
        </h2>
        <AudioDrop onFile={(f) => void onAudioFile(f)} loadedName={audioName} analyzing={analyzing} />
      </section>

      <section className="glass panel">
        <h2>
          <span className="step">3</span> Stage
        </h2>
        <KineticStage
          canvasRef={canvasRef}
          lines={lines}
          meta={displayMeta}
          engine={engine}
          analysis={analysis}
          timeAt={timeAt}
          liveLoopEnabled={liveLoopEnabled}
        />
        {audioUrl && (
          <audio ref={audioRef} src={audioUrl} preload="auto" crossOrigin="anonymous" hidden />
        )}
        <TransportBar audioRef={audioRef} onPlay={onPlay} disabled={!audioUrl} />
        {!studioReady && (
          <p className="hint">
            The stage goes live once a track is resolved, synced lyrics are found and audio is
            loaded. Typography reacts to the low end in real time: beats kick the kinetic scale,
            bass drives the liquid slice distortion and RGB split.
          </p>
        )}
      </section>

      <section className="glass panel">
        <h2>
          <span className="step">4</span> Export
        </h2>
        <ExportPanel exporter={exporter} ready={studioReady} />
      </section>

      <footer>
        Metadata via Spotify / YouTube oEmbed · synced lyrics via LRCLIB · analysis, rendering and
        encoding run entirely in your browser.
        <br />
        Use audio you own the rights to. Nothing is uploaded anywhere.
      </footer>
    </main>
  );
}
