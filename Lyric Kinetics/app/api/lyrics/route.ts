import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const LRCLIB = 'https://lrclib.net/api';
const HEADERS = {
  'User-Agent': 'LyricKinetics/1.0 (https://github.com/leebingsu/claude)',
};

interface LrclibRecord {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  syncedLyrics?: string | null;
  plainLyrics?: string | null;
}

/**
 * GET /api/lyrics?artist=...&title=...&duration=215
 * Fetches timestamped (LRC) lyrics from LRCLIB — a free, open synced-lyrics
 * database. Tries an exact signature match first, then falls back to search
 * and picks the closest record that actually has synced lyrics.
 */
export async function GET(req: NextRequest) {
  const artist = req.nextUrl.searchParams.get('artist')?.trim() ?? '';
  const title = req.nextUrl.searchParams.get('title')?.trim() ?? '';
  const duration = Number(req.nextUrl.searchParams.get('duration')) || undefined;
  if (!title) {
    return NextResponse.json({ error: 'Missing "title" query parameter.' }, { status: 400 });
  }

  try {
    let record = await exactGet(artist, title, duration);
    if (!record?.syncedLyrics) record = await search(artist, title, duration);
    if (!record?.syncedLyrics) {
      return NextResponse.json(
        { error: 'No synced lyrics found for this track on LRCLIB. Try adjusting artist/title.' },
        { status: 404 },
      );
    }
    return NextResponse.json({
      trackName: record.trackName,
      artistName: record.artistName,
      albumName: record.albumName ?? null,
      duration: record.duration ?? null,
      syncedLyrics: record.syncedLyrics,
      plainLyrics: record.plainLyrics ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Lyric lookup failed: ${err instanceof Error ? err.message : 'unknown error'}` },
      { status: 502 },
    );
  }
}

async function exactGet(
  artist: string,
  title: string,
  duration?: number,
): Promise<LrclibRecord | null> {
  if (!artist) return null;
  const params = new URLSearchParams({ artist_name: artist, track_name: title });
  if (duration) params.set('duration', String(Math.round(duration)));
  const res = await fetch(`${LRCLIB}/get?${params}`, { headers: HEADERS, next: { revalidate: 86400 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`LRCLIB responded ${res.status}`);
  return res.json();
}

async function search(artist: string, title: string, duration?: number): Promise<LrclibRecord | null> {
  const params = new URLSearchParams({ track_name: title });
  if (artist) params.set('artist_name', artist);
  const res = await fetch(`${LRCLIB}/search?${params}`, { headers: HEADERS, next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`LRCLIB responded ${res.status}`);
  const records: LrclibRecord[] = await res.json();

  const synced = records.filter((r) => r.syncedLyrics);
  if (synced.length === 0) return null;
  // Prefer the record whose duration matches the user's audio.
  if (duration) {
    synced.sort(
      (a, b) =>
        Math.abs((a.duration ?? Infinity) - duration) - Math.abs((b.duration ?? Infinity) - duration),
    );
  }
  return synced[0];
}
