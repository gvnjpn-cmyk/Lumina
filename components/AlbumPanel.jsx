'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function AlbumPanel({ albumName, artistName, coverUrl, onPlay, onClose }) {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!albumName) return;
    setLoading(true);
    const q = `${albumName} ${artistName||''}`.trim();
    fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => {
        // Filter to tracks from this album
        const albumTracks = (d.tracks||[]).filter(t =>
          t.album?.name?.toLowerCase().includes(albumName.toLowerCase().slice(0,10))
        );
        setTracks(albumTracks.length > 0 ? albumTracks : (d.tracks||[]).slice(0,10));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [albumName, artistName]);

  const fmt = ms => { const s=Math.floor(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(12px)' }}
      onClick={onClose}>
      <div className="mt-auto flex flex-col panel-in" style={{ maxHeight:'82vh', background:'#111', borderRadius:'20px 20px 0 0', border:'1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1"><div className="w-8 h-1 bg-white/15 rounded-full"/></div>

        {/* Album header */}
        <div className="flex items-center gap-4 px-5 py-4">
          {coverUrl && (
            <div className="flex-shrink-0 artwork-shadow" style={{ width:64, height:64, borderRadius:10, overflow:'hidden' }}>
              <Image src={coverUrl} alt={albumName} width={64} height={64} className="object-cover w-full h-full"/>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-lg leading-tight truncate" style={{ letterSpacing:'-0.02em' }}>{albumName}</p>
            <p className="text-white/40 text-sm truncate">{artistName}</p>
          </div>
          <button onClick={onClose} className="btn-press w-8 h-8 surface-3 rounded-full flex items-center justify-center text-white/50 flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 pb-8">
          {loading ? (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_,i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="skeleton w-5 h-4 flex-shrink-0"/>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="skeleton h-3.5" style={{width:'65%'}}/>
                    <div className="skeleton h-3" style={{width:'40%'}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {tracks.map((t,i) => (
                <button key={t.id} onClick={() => { onPlay(t, tracks); onClose(); }}
                  className="card-row flex items-center gap-3 px-3 py-2.5 w-full text-left">
                  <span className="text-white/20 text-xs w-5 text-center flex-shrink-0">{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm font-medium truncate">{t.name}</p>
                    <p className="text-white/30 text-xs truncate">{t.artists?.map(a=>a.name).join(', ')}</p>
                  </div>
                  {t.duration_ms && <span className="text-white/25 text-xs flex-shrink-0">{fmt(t.duration_ms)}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
