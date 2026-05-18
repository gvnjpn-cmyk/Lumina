import { getSpotify } from '@/lib/spotify';

export async function GET(request, { params }) {
  const { id } = params;
  try {
    const spotify = getSpotify();
    const track = await spotify.track(id);
    return Response.json(track);
  } catch (err) {
    return Response.json({ error: 'Track fetch failed', details: err.message }, { status: 500 });
  }
}
