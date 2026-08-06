/** A single word inside a lyric line, with absolute timestamps in seconds. */
export interface LyricWord {
  text: string;
  /** Absolute start time in seconds. */
  time: number;
  /** Absolute end time in seconds. */
  end: number;
}

/** A timestamped lyric line. */
export interface LyricLine {
  /** Absolute start time in seconds. */
  time: number;
  /** Absolute end time in seconds (start of next line, capped). */
  end: number;
  text: string;
  words: LyricWord[];
}

/** Track metadata resolved from a Spotify / YouTube URL. */
export interface TrackMeta {
  source: 'spotify' | 'youtube';
  sourceUrl: string;
  title: string;
  artist: string;
  thumbnail?: string;
  durationSec?: number;
}

/** Number of log-spaced spectrum bands carried per frame. */
export const SPECTRUM_BANDS = 32;

/** Per-frame audio features, every value normalised to roughly 0..1. */
export interface AudioFeatureFrame {
  /** Low band energy (kick / bass). */
  bass: number;
  /** Mid band energy (vocals / synths). */
  mids: number;
  /** High band energy (hats / air). */
  highs: number;
  /** Overall loudness. */
  level: number;
  /** Slow-moving loudness average — "how epic is this section" (0..1). */
  energy: number;
  /** SPECTRUM_BANDS log-spaced bands, 0..1, for the spectrum ring. */
  spectrum: number[];
}

/** Pre-computed offline analysis of a whole track. */
export interface OfflineAnalysis {
  fps: number;
  duration: number;
  frames: AudioFeatureFrame[];
  /** Absolute beat timestamps in seconds. */
  beats: number[];
}

export type ThemeName = 'aurora' | 'inferno' | 'velvet' | 'noir';

/**
 * Rendering philosophy for the stage:
 * - 'cinematic': full-line karaoke typography with atmosphere layers.
 * - 'blink': "Don't Blink"-style rapid word-by-word hard cuts — one huge word
 *   filling the frame, black/white inversions, punch-zooms, stacked/vertical
 *   compositions.
 */
export type VisualMode = 'cinematic' | 'blink';

/** Everything the pure canvas renderer needs to draw one frame. */
export interface FrameInput {
  time: number;
  features: AudioFeatureFrame;
  /** Seconds since the most recent detected beat (Infinity if none yet). */
  sinceBeat: number;
  /** Seconds since each of the last few beats, ascending (for shockwaves). */
  recentBeats: number[];
  lines: LyricLine[];
  lineIndex: number;
  meta: { title: string; artist: string } | null;
  theme: ThemeName;
  mode: VisualMode;
}

export const EMPTY_FEATURES: AudioFeatureFrame = {
  bass: 0,
  mids: 0,
  highs: 0,
  level: 0,
  energy: 0,
  spectrum: new Array(SPECTRUM_BANDS).fill(0),
};

export type ExportPhase =
  | { kind: 'idle' }
  | { kind: 'recording'; mode: 'realtime' | 'hq'; progress: number }
  | { kind: 'encoding' }
  | { kind: 'done'; url: string; filename: string; sizeBytes: number }
  | { kind: 'error'; message: string };
