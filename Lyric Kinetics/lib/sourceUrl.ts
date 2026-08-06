export interface ParsedSource {
  source: 'spotify' | 'youtube';
  id: string;
  canonicalUrl: string;
}

/**
 * Recognises Spotify track URLs and the common YouTube URL shapes
 * (watch, youtu.be, shorts, music.youtube.com).
 */
export function parseSourceUrl(input: string): ParsedSource | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, '');

  if (host === 'open.spotify.com' || host === 'play.spotify.com') {
    const m = url.pathname.match(/\/(?:intl-[a-z]{2}\/)?track\/([A-Za-z0-9]+)/);
    if (m) {
      return {
        source: 'spotify',
        id: m[1],
        canonicalUrl: `https://open.spotify.com/track/${m[1]}`,
      };
    }
    return null;
  }

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return id ? youtube(id) : null;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (url.pathname === '/watch') {
      const id = url.searchParams.get('v');
      return id ? youtube(id) : null;
    }
    const shorts = url.pathname.match(/^\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{6,})/);
    if (shorts) return youtube(shorts[1]);
  }

  return null;
}

function youtube(id: string): ParsedSource {
  return { source: 'youtube', id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` };
}

/** Best-effort split of titles like "Artist - Song (Official Video)". */
export function splitArtistTitle(rawTitle: string, channel?: string): { artist: string; title: string } {
  let title = rawTitle
    .replace(/\((official\s+)?(music\s+)?(video|audio|visualizer|lyric(s)?(\s+video)?)\)/gi, '')
    .replace(/\[(official\s+)?(music\s+)?(video|audio|visualizer|lyric(s)?(\s+video)?)\]/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const sep = title.match(/^(.{1,80}?)\s*[-–—|:]\s+(.+)$/);
  if (sep) {
    return { artist: sep[1].trim(), title: sep[2].trim() };
  }
  const artist = (channel ?? '').replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim();
  return { artist, title };
}
