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
}

/** Pre-computed offline analysis of a whole track. */
export interface OfflineAnalysis {
  fps: number;
  duration: number;
  frames: AudioFeatureFrame[];
  /** Absolute beat timestamps in seconds. */
  beats: number[];
}

/** Everything the pure canvas renderer needs to draw one frame. */
export interface FrameInput {
  time: number;
  features: AudioFeatureFrame;
  /** Seconds since the most recent detected beat (Infinity if none yet). */
  sinceBeat: number;
  lines: LyricLine[];
  lineIndex: number;
  meta: { title: string; artist: string } | null;
}

export type ExportPhase =
  | { kind: 'idle' }
  | { kind: 'recording'; mode: 'realtime' | 'hq'; progress: number }
  | { kind: 'encoding' }
  | { kind: 'done'; url: string; filename: string; sizeBytes: number }
  | { kind: 'error'; message: string };
