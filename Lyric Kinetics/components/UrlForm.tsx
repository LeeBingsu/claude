'use client';

import { useState } from 'react';
import type { TrackMeta } from '@/lib/types';

interface Props {
  onResolved: (meta: TrackMeta) => void;
}

export default function UrlForm({ onResolved }: Props) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to resolve URL.');
      onResolved(data as TrackMeta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve URL.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="row">
        <input
          type="url"
          required
          placeholder="https://open.spotify.com/track/…  or  https://youtu.be/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Spotify or YouTube URL"
        />
        <button className="btn primary" type="submit" disabled={busy || !url}>
          {busy ? <span className="spin" /> : null}
          {busy ? 'Resolving…' : 'Resolve track'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
