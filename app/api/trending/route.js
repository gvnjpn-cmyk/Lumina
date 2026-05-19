import { getSpotify } from '@/lib/spotify';

const QUERIES = [
  'top hits 2025', 'viral songs 2025',
  'trending indonesia 2025', 'pop hits 2025',
];

export async function GET() {
  try {
    const spotify = getSpotify();
    const [r1, r2] = await Promise.allSettled([
      spotify.search(QUERIES[Math.floor(Math.random() * 2)]),
      spotify.search(QUERIES[2 + Math.floor(Math.random() * 2)]),
    ]);
    const t1 = r1.status === 'fulfilled' ? (r1.value?.tracks || []) : [];
    const t2 = r2.status === 'fulfilled' ? (r2.value?.tracks || []) : [];
    const seen = new Set();
    const tracks = [...t1, ...t2].filter(t => {
      if (!t?.id || seen.has(t.id)) return false;
      seen.add(t.id); return true;
    }).slice(0, 15);
    return Response.json({ tracks });
  } catch (err) {
    return Response.json({ tracks: [], error: err.message }, { status: 500 });
  }
}
