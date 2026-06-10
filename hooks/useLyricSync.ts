'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LyricLine } from '@/lib/types';
import { lineIndexAt } from '@/lib/lrc';

export interface LyricSyncState {
  index: number;
  line: LyricLine | null;
  /** 0..1 progress through the active line's slot. */
  lineProgress: number;
  /** Index into line.words of the word being sung, or -1. */
  wordIndex: number;
}

/**
 * Frame-accurate lyric clock. `media.currentTime` only updates a few times a
 * second via the `timeupdate` event, so instead we sample it inside a
 * requestAnimationFrame loop and interpolate between samples with
 * `performance.now()` while playback is running. Lookups are O(log n) binary
 * searches, so thousand-line tracks are fine.
 */
export function useLyricSync(
  media: React.RefObject<HTMLAudioElement | null>,
  lines: LyricLine[],
): { state: LyricSyncState; timeAt: () => number } {
  const [state, setState] = useState<LyricSyncState>({
    index: -1,
    line: null,
    lineProgress: 0,
    wordIndex: -1,
  });
  const anchorRef = useRef({ mediaTime: 0, wallTime: 0, playing: false });

  /** High-resolution estimate of the playhead, callable from any rAF loop. */
  const timeAt = useCallback((): number => {
    const el = media.current;
    if (!el) return 0;
    const a = anchorRef.current;
    if (a.playing && !el.paused) {
      return a.mediaTime + ((performance.now() - a.wallTime) / 1000) * el.playbackRate;
    }
    return el.currentTime;
  }, [media]);

  useEffect(() => {
    let raf = 0;
    let lastIndex = -2;
    let lastWord = -2;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const el = media.current;
      if (!el) return;

      const a = anchorRef.current;
      // Re-anchor whenever the element reports a fresh time (or on seek/pause).
      if (el.paused || el.seeking) {
        a.playing = false;
        a.mediaTime = el.currentTime;
        a.wallTime = performance.now();
      } else if (!a.playing || Math.abs(el.currentTime - timeAt()) > 0.08) {
        a.playing = true;
        a.mediaTime = el.currentTime;
        a.wallTime = performance.now();
      }

      const t = timeAt();
      const index = lineIndexAt(lines, t);
      const line = index >= 0 && t < lines[index].end + 0.001 ? lines[index] : index >= 0 ? lines[index] : null;
      let wordIndex = -1;
      let lineProgress = 0;
      if (line) {
        lineProgress = Math.min(1, Math.max(0, (t - line.time) / Math.max(0.001, line.end - line.time)));
        for (let i = 0; i < line.words.length; i++) {
          if (t >= line.words[i].time && t < line.words[i].end) {
            wordIndex = i;
            break;
          }
        }
      }
      // Only push to React when something discrete changed — the canvas reads
      // `timeAt()` directly, React just powers the DOM lyric list.
      if (index !== lastIndex || wordIndex !== lastWord) {
        lastIndex = index;
        lastWord = wordIndex;
        setState({ index, line, lineProgress, wordIndex });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [media, lines, timeAt]);

  return { state, timeAt };
}
