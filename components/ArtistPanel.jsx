'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ArtistPanel({ artistName, onPlay, onClose }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!artistName) return;
    setLoading(true);
    fetch(`/api/spotify/search?q=${encodeURIComponent(artistName)}`)
      .then(r => r.json())
      .then(d => setTracks((d.tracks||[]).slice(0,12)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [artistName]);

  function fmt(ms) {
    const s = Math.floor(ms/1000);
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(12px)' }}
      onClick={onClose}>
      <div className="mt-auto flex flex-col panel-in" style={{ maxHeight:'80vh', background:'#111', borderRadius:'20px 20px 0 0', border:'1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1"><div className="w-8 h-1 bg-white/15 rounded-full"/></div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-white font-bold text-xl" style={{ letterSpacing:'-0.02em' }}>{artistName}</p>
            <p className="text-white/35 text-xs mt-0.5">Top songs</p>
          </div>
          <button onClick={onClose} className="btn-press w-8 h-8 surface-3 rounded-full flex items-center justify-center text-white/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        {/* Tracks */}
        <div className="overflow-y-auto flex-1 px-4 pb-8">
          {loading ? (
            <div className="flex flex-col gap-2 py-2">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="skeleton w-11 h-11 rounded-lg flex-shrink-0"/>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="skeleton h-3.5" style={{width:'60%'}}/>
                    <div className="skeleton h-3" style={{width:'40%'}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <p className="text-white/25 text-sm text-center py-8">No tracks found</p>
          ) : (
            <div className="flex flex-col gap-1">
              {tracks.map((t, i) => {
                const cover = t.album?.images?.[1]?.url || t.album?.images?.[0]?.url;
                return (
                  <button key={t.id} onClick={() => { onPlay(t, tracks); onClose(); }}
                    className="card-row flex items-center gap-3 px-3 py-2.5 w-full text-left">
                    <span className="text-white/20 text-xs w-4 text-center flex-shrink-0">{i+1}</span>
                    <div className="relative flex-shrink-0" style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'#2c2c2e' }}>
                      {cover && <Image src={cover} alt={t.name} fill className="object-cover" sizes="44px"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-medium truncate">{t.name}</p>
                      <p className="text-white/35 text-xs truncate">{t.album?.name}</p>
                    </div>
                    {t.duration_ms && <span className="text-white/25 text-xs flex-shrink-0">{fmt(t.duration_ms)}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
