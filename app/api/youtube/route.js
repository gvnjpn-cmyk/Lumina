const PIPED = [
  'https://pipedapi.adminforge.de',
  'https://piped-api.garudalinux.org',
  'https://pipedapi.kavin.rocks',
  'https://api.piped.yt',
  'https://pipedapi.drgns.space',
  'https://pipedapi.in.projectsegfau.lt',
  'https://pipedapi.syncpundit.io',
];

const INVIDIOUS = [
  'https://invidious.snopyta.org',
  'https://vid.puffyan.us',
  'https://invidious.kavin.rocks',
  'https://y.com.sb',
  'https://invidious.nerdvpn.de',
];

async function tryPiped(query) {
  for (const base of PIPED) {
    try {
      const res = await fetch(
        `${base}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
        { signal: AbortSignal.timeout(4000), headers: { 'User-Agent': 'Mozilla/5.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const video = (data.items || []).find(i => i.url?.startsWith('/watch'));
      if (video) return video.url.replace('/watch?v=', '');
    } catch {}
  }
  return null;
}

async function tryInvidious(query) {
  for (const base of INVIDIOUS) {
    try {
      const res = await fetch(
        `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&sort_by=relevance`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const video = (data || []).find(v => v.type === 'video');
      if (video?.videoId) return video.videoId;
    } catch {}
  }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '';
  const artist = searchParams.get('artist') || '';
  if (!title) return Response.json({ error: 'Missing title' }, { status: 400 });

  const query = `${artist} ${title} audio`.trim();
  const query2 = `${title} ${artist}`.trim();

  let videoId = await tryPiped(query);
  if (!videoId) videoId = await tryInvidious(query);
  if (!videoId) videoId = await tryPiped(query2);
  if (!videoId) videoId = await tryInvidious(query2);

  if (!videoId) return Response.json({ error: 'No video found' }, { status: 404 });
  return Response.json({ videoId });
}
