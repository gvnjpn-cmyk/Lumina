// GET /api/card?cover=URL&title=...&artist=...&bg=URL
// Returns PNG image of Spotify-style card
// Uses spotifycard.js (sharp-based image generator)

import { drawCardSpotify } from '@/lib/spotifycard';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cover  = searchParams.get('cover')  || '';
  const title  = searchParams.get('title')  || 'Unknown';
  const artist = searchParams.get('artist') || 'Unknown';
  const bg     = searchParams.get('bg')     || '';

  if (!cover) {
    return new Response('Missing cover param', { status: 400 });
  }

  try {
    const buffer = await drawCardSpotify({ cover, title, artist, ...(bg && { bg }) });
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('Card generation error:', err.message);
    return new Response('Card generation failed: ' + err.message, { status: 500 });
  }
}
