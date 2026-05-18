'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import TrackCard from '@/components/TrackCard';

const Player = dynamic(() => import('@/components/Player'), { ssr: false });

const SUGGESTIONS = [
  'Surat Cinta Untuk Starla', 'Blinding Lights', 'Flowers Miley',
  'As It Was Harry Styles', 'Levitating Dua Lipa', 'Selamat Tinggal SEVENTEEN',
  'Apa Mungkin Maroon 5', 'Stay The Kid LAROI', 'Dynamite BTS',
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTrack, setActiveTrack] = useState(null);
  const [activeTab, setActiveTab] = useState('tracks');
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults(null); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data);
    } catch (e) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 500);
  };

  const handleSuggestion = (s) => {
    setQuery(s);
    search(s);
  };

  const openTrack = async (track) => {
    // If we only have basic track info from search, fetch full track
    if (!track.duration_ms || !track.playcount) {
      try {
        const res = await fetch(`/api/spotify/track/${track.id}`);
        const full = await res.json();
        setActiveTrack(full?.name ? full : track);
      } catch {
        setActiveTrack(track);
      }
    } else {
      setActiveTrack(track);
    }
  };

  const tracks = results?.tracks || [];
  const artists = results?.artists || [];
  const albums = results?.albums || [];

  const tabCount = { tracks: tracks.length, artists: artists.length, albums: albums.length };

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-20 px-5 py-4 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full glass-strong flex items-center justify-center">
            <span className="text-white text-sm">♪</span>
          </div>
          <span className="text-white font-display text-lg font-semibold tracking-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}>Lumina</span>
        </div>

        {/* Search bar */}
        <div className="flex-1 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="Search songs, artists…"
            className="search-input w-full pl-10 pr-4 py-2.5 text-sm font-mono"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          )}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setResults(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">

        {/* Error */}
        {error && (
          <div className="glass-card rounded-2xl p-4 text-white/50 text-sm font-mono text-center mb-4">
            ⚠ {error}
          </div>
        )}

        {/* No query: suggestions */}
        {!query && !results && (
          <div className="fade-in flex flex-col gap-6">
            <div>
              <h2 className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3">Try searching for</h2>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => handleSuggestion(s)}
                    className="glass-card px-3 py-2 rounded-full text-xs font-mono text-white/60 hover:text-white transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Hero text */}
            <div className="text-center py-12">
              <div className="text-7xl mb-4 animate-float inline-block">♫</div>
              <h1 className="font-display text-3xl text-white/20 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Music with synced lyrics
              </h1>
              <p className="text-white/15 text-sm font-mono">Search any song to start listening</p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="fade-in flex flex-col gap-4">
            {/* Tabs */}
            <div className="glass rounded-full flex gap-1 p-1 w-fit">
              {['tracks', 'artists', 'albums'].map(t => (
                tabCount[t] > 0 && (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all capitalize flex items-center gap-1.5 ${activeTab === t ? 'tab-active' : 'text-white/40 hover:text-white/60'}`}>
                    {t}
                    <span className={`text-[10px] ${activeTab === t ? 'text-white/50' : 'text-white/25'}`}>
                      {tabCount[t]}
                    </span>
                  </button>
                )
              ))}
            </div>

            {/* Track results */}
            {activeTab === 'tracks' && (
              <div className="flex flex-col gap-2">
                {tracks.length === 0 ? (
                  <p className="text-white/30 text-sm font-mono text-center py-8">No tracks found</p>
                ) : tracks.map(t => (
                  <TrackCard key={t.id} track={t} onClick={openTrack} />
                ))}
              </div>
            )}

            {/* Artist results */}
            {activeTab === 'artists' && (
              <div className="grid grid-cols-2 gap-3">
                {artists.map(a => (
                  <button key={a.id} className="glass-card rounded-2xl p-4 flex flex-col items-center gap-3 text-center group"
                    onClick={() => setQuery(a.name)}>
                    <div className="w-16 h-16 rounded-full overflow-hidden glass flex-shrink-0">
                      {a.images?.[0]?.url ? (
                        <img src={a.images[0].url} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">♪</div>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm font-mono font-medium">{a.name}</p>
                      <p className="text-white/30 text-xs font-mono mt-0.5">Artist</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Album results */}
            {activeTab === 'albums' && (
              <div className="grid grid-cols-2 gap-3">
                {albums.map(a => (
                  <button key={a.id} className="glass-card rounded-2xl p-3 flex flex-col gap-2 text-left group"
                    onClick={() => setQuery(`${a.name} ${a.artists?.[0]?.name || ''}`)}>
                    <div className="w-full aspect-square rounded-xl overflow-hidden glass">
                      {a.images?.[0]?.url ? (
                        <img src={a.images[0].url} alt={a.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">♪</div>
                      )}
                    </div>
                    <div>
                      <p className="text-white text-xs font-mono font-medium truncate">{a.name}</p>
                      <p className="text-white/35 text-xs font-mono truncate">{a.artists?.map(x => x.name).join(', ')}</p>
                      {a.release_year && <p className="text-white/20 text-xs font-mono">{a.release_year}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Player overlay */}
      {activeTrack && (
        <Player track={activeTrack} onClose={() => setActiveTrack(null)} />
      )}
    </div>
  );
}
