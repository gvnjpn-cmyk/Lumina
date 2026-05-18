import { getSpotify } from '@/lib/spotify';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
  try {
    const spotify = getSpotify();
    const result = await spotify.album(id);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: 'album fetch failed', details: err.message }, { status: 500 });
  }
}
