# Lyric Kinetics

A cinematic, dark-mode kinetic-typography lyric video studio that runs **entirely in the
browser**. Paste a Spotify or YouTube link, drop in the audio file you own, and export a
beat-reactive 1080p60 MP4 — analysis, rendering and encoding all happen client-side, no
server rendering involved.

## How it works

```
Spotify / YouTube URL
        │  POST /api/resolve  — oEmbed + OpenGraph (no API keys)
        ▼
{ title, artist, art }
        │  GET /api/lyrics    — LRCLIB synced-lyrics lookup
        ▼
LRC → parseLrc() → LyricLine[] (line + estimated/enhanced word timestamps)
        │
audio file ──► decodeAudioData ──► offline FFT analysis (bass/mids/highs + beat grid)
        │                                   │
        ▼                                   ▼
useLyricSync (rAF clock)      useAudioEngine (live AnalyserNode)
        └──────────────┬────────────────────┘
                       ▼
        Renderer.render(ctx, FrameInput)   ← pure function of time
                       │
        ┌──────────────┴───────────────┐
        ▼                              ▼
  Live preview                    Exporters
  (requestAnimationFrame)         · HQ: WebCodecs (H.264/AAC) + mp4-muxer
                                  · Realtime: canvas.captureStream + MediaRecorder
```

### Why you provide the audio file

Browsers cannot extract raw audio from Spotify or YouTube — both are DRM-protected and
their terms prohibit ripping. The URL is used for what it *can* legitimately provide:
track metadata, artwork and a key into LRCLIB's open database of timestamped lyrics.
You then drop in the audio file you own; it never leaves your machine.

## Architecture highlights

- **`hooks/useLyricSync`** — frame-accurate lyric clock. `timeupdate` only fires a few
  times per second, so the hook samples `currentTime` inside a rAF loop and interpolates
  with `performance.now()` between samples; line/word lookups are binary searches.
- **`hooks/useAudioEngine`** — Web Audio graph (`MediaElementSource → Analyser → Gain →
  destination` plus a `MediaStreamDestination` tap for recording). Band energies are
  peak-normalised and smoothed with the same attack/release curve as the offline path,
  and beats are detected with an energy-flux threshold + refractory period.
- **`engine/lineAnimator`** — GSAP timelines (expo / back / elastic eases, centre-out
  staggers) built **paused** and stepped with `.time(t)`. Animation becomes a pure
  function of time, so the live preview and the frame-by-frame exporter are pixel-identical.
  Six entrance variants rotate per line: rise-and-unfold, split-rotation, elastic crush,
  slam-zoom (for drops), wave cascade and louvre flip-in.
- **`engine/renderer`** — the pure canvas pipeline, layered per frame: beat-kicked camera
  shake → aurora background → rotating god rays → beat shockwave rings → a mirrored
  64-bar circular spectrum analyser → particle field + bokeh → typography (per-character
  karaoke fills with word-punch pops and accent halos, per-line tilt, kinetic scale,
  liquid slice displacement, glitch tears on hard beats, RGB channel split) → ghost echo
  of the previous line → beat screen flash → cinematic title card for intros and
  instrumental interludes (tracking animation + shimmer sweep) → vignette and film grain.
  A slow energy EMA acts as an "epicness" meter that intensifies everything in choruses.
- **`engine/themes`** — four selectable colour systems (Aurora, Inferno, Velvet, Noir)
  that recolour blobs, rays, particles, karaoke gradients and accents consistently.
- **SVG displacement filters** — `feTurbulence` + `feDisplacementMap` (`#liquid-title`),
  with GSAP animating the turbulence frequency and displacement scale, give the DOM hero
  type its liquid breathing. The canvas implements the equivalent distortion at pixel
  level so the effect survives export.
- **`hooks/useExporter`** — two paths:
  - **Studio MP4**: deterministic offline render. The track is FFT-analysed up front,
    every frame is drawn at exactly `f / 60` s, encoded with `VideoEncoder`
    (H.264 High, 12 Mbps, AAC 192 kbps) and muxed by
    [`mp4-muxer`](https://github.com/Vanilagy/mp4-muxer) — usually faster than real time,
    never drops a frame.
  - **Live WebM**: `canvas.captureStream(60)` + the Web Audio
    `MediaStreamDestination` into `MediaRecorder` (VP9/Opus), as a
    maximum-compatibility fallback (this one plays the song once through).

Remotion was deliberately not used: it shines for React-described compositions rendered
server-side (or in headless Chromium), whereas the brief here is zero-server export —
WebCodecs + a pure renderer achieves frame-perfect output with a much smaller footprint.

## Running

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

Requires a Chromium-based browser (or recent Safari/Firefox) for the studio MP4 export;
the WebM path works anywhere `MediaRecorder` does.

## Project map

```
app/
  page.tsx            studio orchestration (4-step flow)
  layout.tsx          fonts + shell
  globals.css         dark glassmorphism design system
  api/resolve/        URL → metadata (Spotify/YouTube oEmbed + OG)
  api/lyrics/         LRCLIB synced-lyrics proxy
engine/
  renderer.ts         pure canvas frame renderer (1920×1080)
  lineAnimator.ts     paused GSAP timelines, sampled per frame
  particles.ts        seeded deterministic particle field
hooks/
  useLyricSync.ts     frame-accurate lyric clock
  useAudioEngine.ts   live Web Audio analysis + beat detection
  useExporter.ts      WebCodecs/mp4-muxer + MediaRecorder exports
lib/
  lrc.ts              LRC / enhanced-LRC parser + word-time estimation
  audioFeatures.ts    offline FFT, band energies, beat grid
  sourceUrl.ts        Spotify/YouTube URL parsing & title splitting
  types.ts            shared types
components/           glass UI (URL form, dropzone, stage, transport, export)
```
