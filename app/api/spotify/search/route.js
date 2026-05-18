import { getSpotify } from '@/lib/spotify';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  if (!q) return Response.json({ error: 'Missing query' }, { status: 400 });

  try {
    const spotify = getSpotify();
    const results = await spotify.search(q);
    return Response.json(results);
  } catch (err) {
    console.error('Spotify search error:', err.message);
    return Response.json({ error: 'Search failed', details: err.message }, { status: 500 });
  }
}
