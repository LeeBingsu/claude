import type { AudioFeatureFrame, OfflineAnalysis } from './types';

/**
 * Offline, deterministic audio analysis. Decodes the whole track once and
 * computes per-frame band energies + beat timestamps from the raw PCM, so the
 * high-quality exporter can reproduce exactly what the live visualiser shows
 * without depending on real-time AnalyserNode readings.
 */

const FFT_SIZE = 2048;

/** In-place iterative radix-2 FFT. re/im length must equal FFT_SIZE. */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k];
        const uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}

const hann = new Float64Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i++) {
  hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
}

function bandEnergy(mags: Float64Array, sampleRate: number, loHz: number, hiHz: number): number {
  const hzPerBin = sampleRate / FFT_SIZE;
  const lo = Math.max(1, Math.floor(loHz / hzPerBin));
  const hi = Math.min(mags.length - 1, Math.ceil(hiHz / hzPerBin));
  let sum = 0;
  for (let i = lo; i <= hi; i++) sum += mags[i];
  return sum / Math.max(1, hi - lo + 1);
}

export function analyzeBuffer(buffer: AudioBuffer, fps = 60): OfflineAnalysis {
  const sampleRate = buffer.sampleRate;
  const duration = buffer.duration;
  const totalFrames = Math.ceil(duration * fps);

  // Mono mixdown
  const mono = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) mono[i] += data[i] / buffer.numberOfChannels;
  }

  const re = new Float64Array(FFT_SIZE);
  const im = new Float64Array(FFT_SIZE);
  const mags = new Float64Array(FFT_SIZE / 2);

  const rawFrames: AudioFeatureFrame[] = [];
  let maxBass = 1e-6;
  let maxMids = 1e-6;
  let maxHighs = 1e-6;
  let maxLevel = 1e-6;

  for (let f = 0; f < totalFrames; f++) {
    const center = Math.floor((f / fps) * sampleRate);
    const start = Math.max(0, Math.min(mono.length - FFT_SIZE, center - FFT_SIZE / 2));
    im.fill(0);
    for (let i = 0; i < FFT_SIZE; i++) re[i] = (mono[start + i] ?? 0) * hann[i];
    fft(re, im);
    for (let i = 0; i < FFT_SIZE / 2; i++) mags[i] = Math.hypot(re[i], im[i]);

    const bass = bandEnergy(mags, sampleRate, 20, 140);
    const mids = bandEnergy(mags, sampleRate, 350, 2200);
    const highs = bandEnergy(mags, sampleRate, 4000, 12000);
    const level = bandEnergy(mags, sampleRate, 20, 12000);

    maxBass = Math.max(maxBass, bass);
    maxMids = Math.max(maxMids, mids);
    maxHighs = Math.max(maxHighs, highs);
    maxLevel = Math.max(maxLevel, level);
    rawFrames.push({ bass, mids, highs, level });
  }

  // Normalise to 0..1 against track peaks, then apply attack/decay smoothing
  // identical in spirit to the live path so both look the same.
  const frames: AudioFeatureFrame[] = [];
  let s: AudioFeatureFrame = { bass: 0, mids: 0, highs: 0, level: 0 };
  for (const raw of rawFrames) {
    const n = {
      bass: raw.bass / maxBass,
      mids: raw.mids / maxMids,
      highs: raw.highs / maxHighs,
      level: raw.level / maxLevel,
    };
    s = smoothFeatures(s, n);
    frames.push(s);
  }

  return { fps, duration, frames, beats: detectBeats(rawFrames.map((r) => r.bass / maxBass), fps) };
}

/** Fast attack, slower release — shared by live + offline pipelines. */
export function smoothFeatures(prev: AudioFeatureFrame, next: AudioFeatureFrame): AudioFeatureFrame {
  const mix = (p: number, n: number) => (n > p ? p + (n - p) * 0.55 : p + (n - p) * 0.16);
  return {
    bass: mix(prev.bass, next.bass),
    mids: mix(prev.mids, next.mids),
    highs: mix(prev.highs, next.highs),
    level: mix(prev.level, next.level),
  };
}

/**
 * Energy-flux beat detection: a beat fires when instantaneous bass energy
 * exceeds the trailing ~1s average by a ratio, with a refractory period.
 */
function detectBeats(bass: number[], fps: number): number[] {
  const beats: number[] = [];
  const historyLen = Math.round(fps); // ~1 second
  const minGap = 0.22; // seconds
  let lastBeat = -Infinity;
  for (let i = 0; i < bass.length; i++) {
    const t = i / fps;
    const from = Math.max(0, i - historyLen);
    let avg = 0;
    for (let j = from; j < i; j++) avg += bass[j];
    avg /= Math.max(1, i - from);
    if (i > fps / 4 && bass[i] > 0.18 && bass[i] > avg * 1.38 && t - lastBeat >= minGap) {
      beats.push(t);
      lastBeat = t;
    }
  }
  return beats;
}

/** Beat pulse envelope: 1.0 on the beat, exponential decay after. */
export function beatPulse(sinceBeat: number): number {
  if (!isFinite(sinceBeat) || sinceBeat < 0) return 0;
  return Math.exp(-sinceBeat * 5.5);
}

/** Find seconds since the most recent beat at time t (binary search). */
export function sinceBeatAt(beats: number[], t: number): number {
  let lo = 0;
  let hi = beats.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (beats[mid] <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans === -1 ? Infinity : t - beats[ans];
}
