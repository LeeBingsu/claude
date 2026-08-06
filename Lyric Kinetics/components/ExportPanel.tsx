'use client';

import type { Exporter } from '@/hooks/useExporter';

interface Props {
  exporter: Exporter;
  ready: boolean;
}

export default function ExportPanel({ exporter, ready }: Props) {
  const { phase, exportHq, exportRealtime, cancel, hqSupported, reset } = exporter;
  const busy = phase.kind === 'recording' || phase.kind === 'encoding';

  return (
    <>
      <div className="export-grid">
        <div className="export-card">
          <h3>Studio MP4 · 1080p60</h3>
          <p>
            WebCodecs renders every frame deterministically, encodes H.264 + AAC and muxes the MP4
            in-browser. Faster than real time and frame-perfect — no dropped frames.
          </p>
          <button
            className="btn primary"
            disabled={!ready || busy || !hqSupported}
            onClick={() => void exportHq()}
          >
            {hqSupported ? 'Export MP4' : 'WebCodecs unavailable'}
          </button>
        </div>
        <div className="export-card">
          <h3>Live capture · WebM</h3>
          <p>
            MediaRecorder captures the canvas stream and Web Audio mix while the track plays once
            through. Maximum compatibility fallback.
          </p>
          <button className="btn" disabled={!ready || busy} onClick={() => void exportRealtime()}>
            Record WebM
          </button>
        </div>
      </div>

      {phase.kind === 'recording' && (
        <>
          <div className="progress">
            <div style={{ width: `${Math.round(phase.progress * 100)}%` }} />
          </div>
          <p className="hint">
            {phase.mode === 'hq' ? 'Rendering & encoding frames… ' : 'Recording live… '}
            {Math.round(phase.progress * 100)}%{' '}
            <button className="btn" style={{ padding: '6px 14px', marginLeft: 10 }} onClick={cancel}>
              Cancel
            </button>
          </p>
        </>
      )}

      {phase.kind === 'encoding' && (
        <p className="hint">
          <span className="spin" />
          Finalising encoders &amp; muxing the container…
        </p>
      )}

      {phase.kind === 'done' && (
        <p className="hint">
          ✅ Ready ({(phase.sizeBytes / 1024 / 1024).toFixed(1)} MB) —{' '}
          <a
            className="btn primary"
            style={{ display: 'inline-block', padding: '8px 18px', textDecoration: 'none' }}
            href={phase.url}
            download={phase.filename}
          >
            Download {phase.filename}
          </a>{' '}
          <button className="btn" style={{ padding: '8px 14px' }} onClick={reset}>
            Dismiss
          </button>
        </p>
      )}

      {phase.kind === 'error' && <div className="error">{phase.message}</div>}
    </>
  );
}
