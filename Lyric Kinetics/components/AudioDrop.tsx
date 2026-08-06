'use client';

import { useRef, useState } from 'react';

interface Props {
  onFile: (file: File) => void;
  loadedName: string | null;
  analyzing: boolean;
}

/**
 * Audio intake. Browsers can't pull raw audio out of Spotify or YouTube
 * (DRM + provider terms), so the user supplies the audio file they own —
 * everything after this point is fully client-side.
 */
export default function AudioDrop({ onFile, loadedName, analyzing }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const handle = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <>
      <div
        className={`dropzone${over ? ' over' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          handle(e.dataTransfer.files);
        }}
      >
        {analyzing ? (
          <span>
            <span className="spin" />
            Decoding &amp; analysing the track (FFT, bass bands, beat grid)…
          </span>
        ) : loadedName ? (
          <span>
            <strong>{loadedName}</strong> loaded — drop another file to replace it.
          </span>
        ) : (
          <span>
            <strong>Drop the audio file</strong> (MP3 / WAV / M4A / OGG) or click to browse.
            <br />
            <small>
              Streaming services don&apos;t allow direct audio extraction, so bring the file you own.
            </small>
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        hidden
        onChange={(e) => handle(e.target.files)}
      />
    </>
  );
}
