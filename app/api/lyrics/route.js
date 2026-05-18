// Fetch synced LRC lyrics from lrclib.net (free, no API key)
// Returns: { synced: [{time, text}], plain: string, found: bool }

function parseLRC(lrc) {
  if (!lrc) return [];
  const lines = lrc.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

  for (const line of lines) {
    const match = line.match(timeRegex);
    if (!match) continue;
    const mins = parseInt(match[1]);
    const secs = parseInt(match[2]);
    const ms = parseInt(match[3].padEnd(3, '0'));
    const time = mins * 60 + secs + ms / 1000;
    const text = line.replace(timeRegex, '').trim();
    if (text) result.push({ time, text });
  }

  return result.sort((a, b) => a.time - b.time);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '';
  const artist = searchParams.get('artist') || '';
  const album = searchParams.get('album') || '';
  const duration = searchParams.get('duration') || '';

  if (!title || !artist) {
    return Response.json({ error: 'Missing title or artist' }, { status: 400 });
  }

  try {
    // Try to get synced lyrics with duration match first
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
      ...(album && { album_name: album }),
      ...(duration && { duration }),
    });

    const res = await fetch(`https://lrclib.net/api/get?${params}`, {
      signal: AbortSignal.timeout(6000),
      headers: { 'Lrclib-Client': 'Lumina/1.0 (https://lumina-music.vercel.app)' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.syncedLyrics) {
        return Response.json({
          found: true,
          synced: parseLRC(data.syncedLyrics),
          plain: data.plainLyrics || null,
          trackName: data.trackName,
          artistName: data.artistName,
        });
      }
      if (data.plainLyrics) {
        return Response.json({
          found: true,
          synced: null,
          plain: data.plainLyrics,
        });
      }
    }

    // Fallback: search lrclib
    const searchRes = await fetch(
      `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (searchRes.ok) {
      const results = await searchRes.json();
      const best = results.find(r => r.syncedLyrics) || results[0];
      if (best) {
        return Response.json({
          found: true,
          synced: parseLRC(best.syncedLyrics),
          plain: best.plainLyrics || null,
        });
      }
    }

    return Response.json({ found: false, synced: null, plain: null });
  } catch (err) {
    return Response.json({ found: false, synced: null, plain: null, error: err.message });
  }
}
