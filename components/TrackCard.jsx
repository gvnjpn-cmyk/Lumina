'use client';
import { useRef, useState } from 'react';
import Image from 'next/image';

function fmt(ms) {
  const s = Math.floor(ms/1000);
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}

export default function TrackCard({ track, onClick, active, onAddToQueue, onPlayNext, onAddToPlaylist }) {
  const cover = track?.album?.images?.[1]?.url || track?.album?.images?.[0]?.url;
  const artist = track?.artists?.map(a => a.name).join(', ') || '—';
  const [menuOpen, setMenuOpen] = useState(false);
  const longPressRef = useRef(null);

  const onTouchStart = () => {
    longPressRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(30);
      setMenuOpen(true);
    }, 500);
  };
  const onTouchEnd = () => clearTimeout(longPressRef.current);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => onClick(track)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="card-row flex items-center gap-3 px-3 py-2.5 w-full text-left"
        >
          <div className="relative flex-shrink-0" style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'#2c2c2e' }}>
            {cover
              ? <Image src={cover} alt={track.name} fill className="object-cover" sizes="44px"/>
              : <div className="w-full h-full flex items-center justify-center text-white/15">♪</div>}
            {active && (
              <div className="absolute inset-0 flex items-center justify-center gap-0.5" style={{ background:'rgba(0,0,0,0.45)' }}>
                {[0,1,2].map(i => <div key={i} className="eq-bar" style={{ animationDelay:`${i*0.2}s` }}/>)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold truncate ${active?'text-white':'text-white/90'}`}>{track.name}</p>
            <p className="text-white/40 text-xs truncate">{artist}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {track.explicit && <span className="text-white/20 text-[9px] border border-white/15 px-1 rounded">E</span>}
            {track.duration_ms && <span className="text-white/25 text-xs">{fmt(track.duration_ms)}</span>}
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(true); }}
              className="btn-press text-white/25 hover:text-white/60 w-6 h-6 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
          </div>
        </button>
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[70]" onClick={() => setMenuOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 panel-in pb-8"
            style={{ background:'#1c1c1e', borderRadius:'20px 20px 0 0', border:'1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-3"><div className="w-8 h-1 bg-white/15 rounded-full"/></div>

            {/* Track info */}
            <div className="flex items-center gap-3 px-5 pb-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="relative flex-shrink-0" style={{ width:44, height:44, borderRadius:8, overflow:'hidden', background:'#2c2c2e' }}>
                {cover && <Image src={cover} alt={track.name} fill className="object-cover" sizes="44px"/>}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{track.name}</p>
                <p className="text-white/40 text-xs truncate">{artist}</p>
              </div>
            </div>

            {[
              { label:'Play now', icon:'▶', action:()=>{ onClick(track); setMenuOpen(false); } },
              { label:'Play next', icon:'⏭', action:()=>{ onPlayNext?.(track); setMenuOpen(false); } },
              { label:'Add to queue', icon:'➕', action:()=>{ onAddToQueue?.(track); setMenuOpen(false); } },
              { label:'Add to playlist', icon:'🎵', action:()=>{ onAddToPlaylist?.(track); setMenuOpen(false); } },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className="w-full flex items-center gap-4 px-6 py-4 text-left"
                style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-lg">{item.icon}</span>
                <span className="text-white text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
