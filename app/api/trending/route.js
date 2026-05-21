import { getSpotify } from '@/lib/spotify';

const CATEGORIES = {
  foryou:    ['top hits 2026', 'viral songs 2026', 'best songs right now 2026'],
  indonesia: ['hits indonesia 2026', 'lagu indonesia terpopuler 2026', 'trending indonesia 2026'],
  global:    ['global top songs 2026', 'billboard hot 100 2026', 'most streamed songs 2026'],
  kpop:      ['kpop hits 2026', 'korean pop 2026', 'kpop trending 2026'],
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cat = searchParams.get('cat') || 'foryou';
  const queries = CATEGORIES[cat] || CATEGORIES.foryou;

  try {
    const spotify = getSpotify();
    const [r1, r2] = await Promise.allSettled([
      spotify.search(queries[0]),
      spotify.search(queries[1]),
    ]);
    const t1 = r1.status==='fulfilled' ? (r1.value?.tracks||[]) : [];
    const t2 = r2.status==='fulfilled' ? (r2.value?.tracks||[]) : [];
    const seen = new Set();
    const tracks = [...t1,...t2].filter(t => {
      if (!t?.id || seen.has(t.id)) return false;
      seen.add(t.id); return true;
    }).slice(0, 15);
    return Response.json({ tracks });
  } catch (err) {
    return Response.json({ tracks:[], error:err.message }, { status:500 });
  }
}
