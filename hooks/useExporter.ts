'use client';

import { useCallback, useRef, useState } from 'react';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { ExportPhase, LyricLine, OfflineAnalysis } from '@/lib/types';
import { sinceBeatAt } from '@/lib/audioFeatures';
import { lineIndexAt } from '@/lib/lrc';
import { Renderer, STAGE_W, STAGE_H } from '@/engine/renderer';

const FPS = 60;

export interface ExportDeps {
  canvas: () => HTMLCanvasElement | null;
  audioEl: () => HTMLAudioElement | null;
  audioCaptureStream: () => MediaStream | null;
  audioBuffer: () => AudioBuffer | null;
  analysis: () => OfflineAnalysis | null;
  lines: () => LyricLine[];
  meta: () => { title: string; artist: string } | null;
  /** Pause/resume the live preview loop while the HQ exporter owns the canvas. */
  setLiveLoopEnabled: (enabled: boolean) => void;
}

export interface Exporter {
  phase: ExportPhase;
  /** WebCodecs + mp4-muxer: deterministic frame-by-frame 1080p60 MP4. */
  exportHq: () => Promise<void>;
  /** MediaRecorder: records the live canvas + audio in real time (WebM). */
  exportRealtime: () => Promise<void>;
  cancel: () => void;
  hqSupported: boolean;
  reset: () => void;
}

export function useExporter(deps: ExportDeps): Exporter {
  const [phase, setPhase] = useState<ExportPhase>({ kind: 'idle' });
  const cancelRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  const hqSupported =
    typeof window !== 'undefined' && 'VideoEncoder' in window && 'AudioEncoder' in window;

  const reset = useCallback(() => {
    if (phase.kind === 'done') URL.revokeObjectURL(phase.url);
    setPhase({ kind: 'idle' });
  }, [phase]);

  const cancel = useCallback(() => {
    cancelRef.current = true;
    recorderRef.current?.stop();
  }, []);

  // ── High-quality deterministic MP4 (WebCodecs + mp4-muxer) ───────────────

  const exportHq = useCallback(async () => {
    const canvas = deps.canvas();
    const buffer = deps.audioBuffer();
    const analysis = deps.analysis();
    const lines = deps.lines();
    if (!canvas || !buffer || !analysis) {
      setPhase({ kind: 'error', message: 'Load audio (and lyrics) before exporting.' });
      return;
    }

    cancelRef.current = false;
    deps.audioEl()?.pause();
    deps.setLiveLoopEnabled(false);
    setPhase({ kind: 'recording', mode: 'hq', progress: 0 });

    const renderer = new Renderer();
    try {
      const videoCodec = await pickVideoCodec();
      const audioCfg = await pickAudioCodec(buffer);
      const muxer = new Muxer({
        target: new ArrayBufferTarget(),
        video: { codec: videoCodec.muxCodec, width: STAGE_W, height: STAGE_H },
        audio: {
          codec: audioCfg.muxCodec,
          sampleRate: audioCfg.sampleRate,
          numberOfChannels: audioCfg.numberOfChannels,
        },
        fastStart: 'in-memory',
        firstTimestampBehavior: 'offset',
      });

      let encoderError: Error | null = null;
      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => (encoderError = e),
      });
      videoEncoder.configure({
        codec: videoCodec.codec,
        width: STAGE_W,
        height: STAGE_H,
        bitrate: 12_000_000,
        framerate: FPS,
      });

      const audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => (encoderError = e),
      });
      audioEncoder.configure({
        codec: audioCfg.codec,
        sampleRate: audioCfg.sampleRate,
        numberOfChannels: audioCfg.numberOfChannels,
        bitrate: 192_000,
      });

      // Feed audio in ~0.5 s planar chunks.
      const chunkFrames = Math.floor(buffer.sampleRate / 2);
      const channels = Math.min(2, buffer.numberOfChannels);
      for (let off = 0; off < buffer.length; off += chunkFrames) {
        const frames = Math.min(chunkFrames, buffer.length - off);
        const data = new Float32Array(frames * channels);
        for (let ch = 0; ch < channels; ch++) {
          data.set(buffer.getChannelData(ch).subarray(off, off + frames), ch * frames);
        }
        audioEncoder.encode(
          new AudioData({
            format: 'f32-planar',
            sampleRate: buffer.sampleRate,
            numberOfFrames: frames,
            numberOfChannels: channels,
            timestamp: Math.round((off / buffer.sampleRate) * 1e6),
            data,
          }),
        );
      }

      // Render every frame deterministically and encode it.
      const ctx = canvas.getContext('2d')!;
      const totalFrames = Math.ceil(buffer.duration * FPS);
      const meta = deps.meta();
      for (let f = 0; f < totalFrames; f++) {
        if (cancelRef.current) throw new Error('Export cancelled.');
        if (encoderError) throw encoderError;
        const t = f / FPS;
        renderer.render(ctx, {
          time: t,
          features: analysis.frames[Math.min(f, analysis.frames.length - 1)],
          sinceBeat: sinceBeatAt(analysis.beats, t),
          lines,
          lineIndex: lineIndexAt(lines, t),
          meta,
        });
        const frame = new VideoFrame(canvas, { timestamp: Math.round(t * 1e6) });
        videoEncoder.encode(frame, { keyFrame: f % (FPS * 2) === 0 });
        frame.close();

        // Backpressure + keep the UI responsive.
        if (videoEncoder.encodeQueueSize > 8) {
          await new Promise<void>((r) => setTimeout(r, 0));
          while (videoEncoder.encodeQueueSize > 4) {
            await new Promise<void>((r) => setTimeout(r, 4));
          }
        }
        if (f % 30 === 0) {
          setPhase({ kind: 'recording', mode: 'hq', progress: f / totalFrames });
          await new Promise<void>((r) => setTimeout(r, 0));
        }
      }

      setPhase({ kind: 'encoding' });
      await videoEncoder.flush();
      await audioEncoder.flush();
      videoEncoder.close();
      audioEncoder.close();
      if (encoderError) throw encoderError;
      muxer.finalize();

      const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
      finish(blob, 'mp4');
    } catch (err) {
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      renderer.dispose();
      deps.setLiveLoopEnabled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);

  // ── Realtime capture (MediaRecorder) ──────────────────────────────────────

  const exportRealtime = useCallback(async () => {
    const canvas = deps.canvas();
    const audioEl = deps.audioEl();
    const audioStream = deps.audioCaptureStream();
    if (!canvas || !audioEl || !audioStream) {
      setPhase({ kind: 'error', message: 'Load audio before exporting.' });
      return;
    }

    const mimeType = [
      'video/mp4;codecs=avc1.640028,mp4a.40.2',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ].find((m) => MediaRecorder.isTypeSupported(m));
    if (!mimeType) {
      setPhase({ kind: 'error', message: 'MediaRecorder is not supported in this browser.' });
      return;
    }

    cancelRef.current = false;
    const stream = new MediaStream([
      ...canvas.captureStream(FPS).getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ]);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 12_000_000,
      audioBitsPerSecond: 192_000,
    });
    recorderRef.current = recorder;
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);

    const done = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
    const onEnded = () => recorder.state !== 'inactive' && recorder.stop();
    audioEl.addEventListener('ended', onEnded);

    try {
      audioEl.currentTime = 0;
      await audioEl.play();
      recorder.start(500);
      setPhase({ kind: 'recording', mode: 'realtime', progress: 0 });

      const tick = setInterval(() => {
        if (recorder.state === 'inactive') return clearInterval(tick);
        setPhase({
          kind: 'recording',
          mode: 'realtime',
          progress: audioEl.duration ? audioEl.currentTime / audioEl.duration : 0,
        });
      }, 250);

      await done;
      clearInterval(tick);
      if (cancelRef.current && chunks.length === 0) {
        setPhase({ kind: 'idle' });
        return;
      }
      finish(new Blob(chunks, { type: mimeType.split(';')[0] }), mimeType.startsWith('video/mp4') ? 'mp4' : 'webm');
    } catch (err) {
      setPhase({ kind: 'error', message: err instanceof Error ? err.message : String(err) });
    } finally {
      audioEl.removeEventListener('ended', onEnded);
      audioEl.pause();
      recorderRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);

  function finish(blob: Blob, ext: string): void {
    const meta = deps.meta();
    const base = meta ? `${meta.artist} - ${meta.title}` : 'lyric-video';
    const filename = `${base.replace(/[^\w\s.-]/g, '').trim() || 'lyric-video'}.${ext}`;
    setPhase({ kind: 'done', url: URL.createObjectURL(blob), filename, sizeBytes: blob.size });
  }

  return { phase, exportHq, exportRealtime, cancel, hqSupported, reset };
}

async function pickVideoCodec(): Promise<{ codec: string; muxCodec: 'avc' | 'vp9' }> {
  const candidates: Array<{ codec: string; muxCodec: 'avc' | 'vp9' }> = [
    { codec: 'avc1.640028', muxCodec: 'avc' }, // H.264 High 4.0
    { codec: 'avc1.4d0028', muxCodec: 'avc' }, // H.264 Main
    { codec: 'vp09.00.41.08', muxCodec: 'vp9' },
  ];
  for (const c of candidates) {
    const { supported } = await VideoEncoder.isConfigSupported({
      codec: c.codec,
      width: STAGE_W,
      height: STAGE_H,
      bitrate: 12_000_000,
      framerate: FPS,
    });
    if (supported) return c;
  }
  throw new Error('No supported video codec for WebCodecs export.');
}

async function pickAudioCodec(buffer: AudioBuffer): Promise<{
  codec: string;
  muxCodec: 'aac' | 'opus';
  sampleRate: number;
  numberOfChannels: number;
}> {
  const numberOfChannels = Math.min(2, buffer.numberOfChannels);
  const candidates: Array<{ codec: string; muxCodec: 'aac' | 'opus' }> = [
    { codec: 'mp4a.40.2', muxCodec: 'aac' },
    { codec: 'opus', muxCodec: 'opus' },
  ];
  for (const c of candidates) {
    const { supported } = await AudioEncoder.isConfigSupported({
      codec: c.codec,
      sampleRate: buffer.sampleRate,
      numberOfChannels,
      bitrate: 192_000,
    });
    if (supported) return { ...c, sampleRate: buffer.sampleRate, numberOfChannels };
  }
  throw new Error('No supported audio codec for WebCodecs export.');
}
