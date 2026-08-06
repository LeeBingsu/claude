'use client';

import { useEffect, useState } from 'react';

interface Props {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Current audio source URL — the effect must re-attach when it changes. */
  src: string | null;
  onPlay: () => void;
  disabled: boolean;
}

function fmt(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

export default function TransportBar({ audioRef, src, onPlay, disabled }: Props) {
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Re-run when `src` changes: the <audio> element may have just mounted or
    // swapped sources, and the ref object's identity never changes on its own.
    const el = audioRef.current;
    if (!el) return;
    const sync = () => {
      setPlaying(!el.paused);
      setTime(el.currentTime);
      setDuration(el.duration || 0);
    };
    sync();
    const id = setInterval(sync, 200);
    el.addEventListener('play', sync);
    el.addEventListener('pause', sync);
    el.addEventListener('loadedmetadata', sync);
    return () => {
      clearInterval(id);
      el.removeEventListener('play', sync);
      el.removeEventListener('pause', sync);
      el.removeEventListener('loadedmetadata', sync);
    };
  }, [audioRef, src]);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      onPlay(); // resumes AudioContext on the user gesture
      await el.play();
    } else {
      el.pause();
    }
  };

  return (
    <div className="transport">
      <button className="btn primary" onClick={toggle} disabled={disabled} aria-label="Play / pause">
        {playing ? '❚❚ Pause' : '▶ Play'}
      </button>
      <span className="time">
        {fmt(time)} / {fmt(duration)}
      </span>
      <input
        className="seek"
        type="range"
        min={0}
        max={duration || 1}
        step={0.01}
        value={time}
        disabled={disabled}
        aria-label="Seek"
        onChange={(e) => {
          const el = audioRef.current;
          if (el) el.currentTime = Number(e.target.value);
        }}
      />
    </div>
  );
}
