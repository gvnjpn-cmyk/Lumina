'use client';
import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import TrackCard from '@/components/TrackCard';
import Navbar from '@/components/Navbar';
import MiniPlayer from '@/components/MiniPlayer';

const Player = dynamic(() => import('@/components/Player'), { ssr: false });

const SUGGESTIONS = [
  'Surat Cinta Untuk Starla','Blinding Lights','As It Was',
  'Flowers','Selamat Tinggal','Apa Mungkin',
  'Stay','Dynamite','Levitating','Cruel Summer',
];

function SearchView({ onPlay, activeTrack }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('tracks');
  const debRef = useRef(null);

  const search = useCallback(async v => {
    if (!v.trim()) { setResults(null); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/spotify/search?q=${encodeURIComponent(v)}`);
      const d = await r.json();
      setResults(d);
    } catch {}
    setLoading(false);
  }, []);

  const handleChange = e => {
    setQ(e.target.value);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => search(e.target.value), 450);
  };

  const tracks  = results?.tracks  || [];
  const artists = results?.artists || [];
  const albums  = results?.albums  || [];

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 pt-16 pb-3 flex-shrink-0">
        <p className="text-white text-2xl font-bold mb-4" style={{ letterSpacing:'-0.02em' }}>Search</p>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
          <input value={q} onChange={handleChange} placeholder="Artists, songs, podcasts"
            className="search-input w-full pl-9 pr-4 py-3 text-sm" />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white/15 border-t-white/50 rounded-full animate-spin" />
            </div>
          )}
          {q && !loading && (
            <button onClick={() => { setQ(''); setResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {!q ? (
          <div className="fade-in">
            <p className="label mb-3">Browse categories</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => { setQ(s); search(s); }}
                  className="pill text-white/70 hover:text-white transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : results ? (
          <div className="fade-in flex flex-col gap-3">
            {/* Tabs */}
            {(tracks.length > 0 || artists.length > 0 || albums.length > 0) && (
              <div className="flex gap-2 mb-1 overflow-x-auto pb-1" style={{ scrollbarWidth:'none' }}>
                {[['tracks', tracks.length], ['artists', artists.length], ['albums', albums.length]]
                  .filter(([,c]) => c > 0)
                  .map(([t, c]) => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`pill capitalize flex-shrink-0 transition-all ${tab===t ? 'bg-white text-black' : 'text-white/60'}`}>
                      {t}
                    </button>
                  ))}
              </div>
            )}

            {tab === 'tracks' && (
              <div className="flex flex-col gap-1">
                {tracks.length === 0
                  ? <p className="text-white/25 text-sm text-center py-8">No tracks found</p>
                  : tracks.map(t => <TrackCard key={t.id} track={t} onClick={onPlay} active={activeTrack?.id===t.id} />)
                }
              </div>
            )}

            {tab === 'artists' && (
              <div className="flex flex-col gap-1">
                {artists.map(a => (
                  <button key={a.id} onClick={() => { setQ(a.name); search(a.name); }}
                    className="card-row flex items-center gap-3 px-3 py-2.5 w-full text-left">
                    <div style={{ width:44, height:44, borderRadius:99, overflow:'hidden', background:'#2c2c2e', flexShrink:0, position:'relative' }}>
                      {a.images?.[0]?.url
                        ? <Image src={a.images[0].url} alt={a.name} fill className="object-cover" sizes="44px" />
                        : <div className="w-full h-full flex items-center justify-center text-white/15">♪</div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{a.name}</p>
                      <p className="text-white/35 text-xs">Artist</p>
                    </div>
                    <svg className="ml-auto text-white/20" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                  </button>
                ))}
              </div>
            )}

            {tab === 'albums' && (
              <div className="flex flex-col gap-1">
                {albums.map(a => (
                  <button key={a.id} onClick={() => { setQ(`${a.name} ${a.artists?.[0]?.name||''}`); search(`${a.name} ${a.artists?.[0]?.name||''}`); }}
                    className="card-row flex items-center gap-3 px-3 py-2.5 w-full text-left">
                    <div style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'#2c2c2e', flexShrink:0, position:'relative' }}>
                      {a.images?.[0]?.url
                        ? <Image src={a.images[0].url} alt={a.name} fill className="object-cover" sizes="44px" />
                        : <div className="w-full h-full flex items-center justify-center text-white/15">♪</div>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-semibold truncate">{a.name}</p>
                      <p className="text-white/35 text-xs truncate">{a.artists?.map(x=>x.name).join(', ')}</p>
                    </div>
                    {a.release_year && <span className="text-white/20 text-xs ml-auto flex-shrink-0">{a.release_year}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HomeView({ onPlay, activeTrack }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const recents = SUGGESTIONS.slice(0, 6);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-16 pb-4 flex-shrink-0">
        <p className="text-white text-2xl font-bold" style={{ letterSpacing:'-0.02em' }}>{greeting}</p>
      </div>

      {/* Quick suggestions grid */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-2">
          {recents.map((s, i) => (
            <button key={s} onClick={() => onPlay({ name: s, artists:[{name:''}], album:{}, id: `s-${i}`, _search: true })}
              className="card flex items-center gap-3 p-3 text-left h-14">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex-shrink-0 flex items-center justify-center text-white/30 text-sm">♪</div>
              <span className="text-white text-xs font-semibold truncate leading-tight">{s}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mb-4">
        <p className="label mb-3">Top charts</p>
        <div className="flex flex-col gap-1">
          {SUGGESTIONS.slice(0,5).map((s,i) => (
            <div key={s} className="card-row flex items-center gap-3 px-3 py-3">
              <span className="text-white/25 text-sm font-bold w-5 text-center flex-shrink-0">{i+1}</span>
              <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 flex items-center justify-center text-white/15">♪</div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-medium truncate">{s}</p>
                <p className="text-white/35 text-xs">Popular</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('search');
  const [activeTrack, setActiveTrack] = useState(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = async (track) => {
    // If it's a search placeholder, ignore - search view handles real tracks
    if (track._search) return;
    if (track.id === activeTrack?.id) { setPlayerOpen(true); return; }
    // Fetch full track info if needed
    if (track.id && !track.playcount) {
      try {
        const r = await fetch(`/api/spotify/track/${track.id}`);
        const full = await r.json();
        if (full?.name) { setActiveTrack(full); setPlayerOpen(true); return; }
      } catch {}
    }
    setActiveTrack(track);
    setPlayerOpen(true);
  };

  return (
    <div className="flex flex-col h-full surface-0">
      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {tab === 'home'    && <HomeView   onPlay={handlePlay} activeTrack={activeTrack} />}
        {tab === 'search'  && <SearchView onPlay={handlePlay} activeTrack={activeTrack} />}
        {tab === 'library' && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 surface-2 rounded-2xl flex items-center justify-center text-3xl text-white/15">♪</div>
            <p className="text-white/25 text-sm font-medium">Library coming soon</p>
          </div>
        )}
      </div>

      {/* Mini player */}
      {activeTrack && !playerOpen && (
        <MiniPlayer
          track={activeTrack}
          isPlaying={isPlaying}
          onOpen={() => setPlayerOpen(true)}
          onTogglePlay={() => {}}
        />
      )}

      {/* Bottom nav */}
      <Navbar active={tab} onChange={setTab} />

      {/* Full player */}
      {playerOpen && activeTrack && (
        <Player
          track={activeTrack}
          onClose={() => setPlayerOpen(false)}
          onPlayPause={setIsPlaying}
        />
      )}
    </div>
  );
}
