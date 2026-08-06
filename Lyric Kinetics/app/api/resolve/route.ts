import { NextRequest, NextResponse } from 'next/server';
import { parseSourceUrl, splitArtistTitle } from '@/lib/sourceUrl';
import type { TrackMeta } from '@/lib/types';

export const runtime = 'nodejs';

const UA = 'LyricKinetics/1.0 (kinetic typography lyric studio)';

/**
 * POST { url } → TrackMeta
 * Resolves a Spotify or YouTube URL into { title, artist, thumbnail } using
 * the providers' public oEmbed endpoints (no API keys required). The client
 * lets the user correct these fields before the lyric lookup, so best-effort
 * parsing is fine here.
 */
export async function POST(req: NextRequest) {
  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = parseSourceUrl(url ?? '');
  if (!parsed) {
    return NextResponse.json(
      { error: 'Unsupported URL. Paste a Spotify track link or a YouTube video link.' },
      { status: 422 },
    );
  }

  try {
    const meta =
      parsed.source === 'spotify'
        ? await resolveSpotify(parsed.canonicalUrl)
        : await resolveYouTube(parsed.canonicalUrl);
    return NextResponse.json(meta);
  } catch (err) {
    return NextResponse.json(
      { error: `Could not resolve track metadata: ${err instanceof Error ? err.message : 'unknown error'}` },
      { status: 502 },
    );
  }
}

async function resolveSpotify(canonicalUrl: string): Promise<TrackMeta> {
  const oembed = await fetchJson(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(canonicalUrl)}`,
  );
  let artist = '';
  let title = String(oembed.title ?? '');

  // Spotify's oEmbed has no artist field; the track page's OpenGraph tags do.
  try {
    const html = await (
      await fetch(canonicalUrl, { headers: { 'User-Agent': UA }, next: { revalidate: 3600 } })
    ).text();
    const ogTitle = matchMeta(html, 'og:title');
    const ogDesc = matchMeta(html, 'og:description');
    if (ogTitle) title = ogTitle;
    // og:description looks like "Artist · Song · 2024" or "Song · song by Artist".
    if (ogDesc) {
      const bySong = ogDesc.match(/song(?:\s+and lyrics)?\s+by\s+(.+?)(?:\s*[·|]|$)/i);
      if (bySong) artist = bySong[1].trim();
      else artist = ogDesc.split('·')[0].trim();
    }
  } catch {
    // oEmbed title alone is still workable; user can fill in the artist.
  }

  return {
    source: 'spotify',
    sourceUrl: canonicalUrl,
    title,
    artist,
    thumbnail: oembed.thumbnail_url ? String(oembed.thumbnail_url) : undefined,
  };
}

async function resolveYouTube(canonicalUrl: string): Promise<TrackMeta> {
  const oembed = await fetchJson(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`,
  );
  const { artist, title } = splitArtistTitle(String(oembed.title ?? ''), String(oembed.author_name ?? ''));
  return {
    source: 'youtube',
    sourceUrl: canonicalUrl,
    title,
    artist,
    thumbnail: oembed.thumbnail_url ? String(oembed.thumbnail_url) : undefined,
  };
}

async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`upstream responded ${res.status}`);
  return res.json();
}

function matchMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    'i',
  );
  const m = html.match(re);
  const raw = m?.[1] ?? m?.[2];
  return raw ? decodeEntities(raw) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'");
}
