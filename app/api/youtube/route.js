// Search YouTube via Piped API (no key needed) to get a video ID for playback

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://piped-api.garudalinux.org',
  'https://api.piped.yt',
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '';
  const artist = searchParams.get('artist') || '';
  if (!title) return Response.json({ error: 'Missing title' }, { status: 400 });

  const query = `${title} ${artist} official audio`.trim();

  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${base}/search?q=${encodeURIComponent(query)}&filter=music_songs`, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!res.ok) continue;
      const data = await res.json();
      const items = data.items || [];
      // Find first video result (not playlist/channel)
      const video = items.find(i => i.url?.startsWith('/watch'));
      if (!video) continue;
      const videoId = video.url.replace('/watch?v=', '');
      return Response.json({
        videoId,
        title: video.title,
        uploader: video.uploaderName,
        duration: video.duration,
        thumbnail: video.thumbnail,
      });
    } catch (e) {
      // try next instance
    }
  }

  return Response.json({ error: 'Could not find YouTube video' }, { status: 404 });
}
