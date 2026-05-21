'use client';
import { useRef } from 'react';
import Image from 'next/image';

export default function MiniPlayer({ track, isPlaying, currentTime, duration, onOpen, onTogglePlay, onSkipNext, onClose }) {
  if (!track) return null;
  const cover  = track.album?.images?.[0]?.url;
  const title  = track.name || '—';
  const artist = track.artists?.[0]?.name || '';
  const progress = duration ? (currentTime / duration) * 100 : 0;

  const touchX = useRef(null);
  const touchY = useRef(null);
  const onTS = e => { touchX.current = e.touches[0].clientX; touchY.current = e.touches[0].clientY; };
  const onTE = e => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    const dy = e.changedTouches[0].clientY - touchY.current;
    if (Math.abs(dy) > Math.abs(dx)) { if (dy > 50) onClose?.(); }
    else { if (dx < -60) onSkipNext?.(); if (dx > 60) onTogglePlay?.(); }
    touchX.current = null; touchY.current = null;
  };

  return (
    <div className="px-3 pb-2" onTouchStart={onTS} onTouchEnd={onTE}>
      <div className="mini-player overflow-hidden cursor-pointer" onClick={onOpen}>
        <div className="flex items-center gap-3 px-3 py-2.5">
          {/* Art */}
          <div className="relative flex-shrink-0" style={{ width:42, height:42, borderRadius:10, overflow:'hidden', background:'#2c2c2e' }}>
            {cover && <Image src={cover} alt={title} fill className="object-cover" sizes="42px"/>}
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center gap-0.5" style={{ background:'rgba(0,0,0,0.45)' }}>
                {[0,1,2,3,4].map(i => <div key={i} className="wave-bar" style={{ animationDelay:`${i*0.1}s` }}/>)}
              </div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">{title}</p>
            <p className="text-white/45 text-xs truncate">{artist}</p>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button className="btn-press text-white w-9 h-9 flex items-center justify-center"
              onClick={e => { e.stopPropagation(); onTogglePlay(); }}>
              {isPlaying
                ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <button className="btn-press text-white/50 w-9 h-9 flex items-center justify-center"
              onClick={e => { e.stopPropagation(); onSkipNext?.(); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height:2, background:'rgba(255,255,255,0.08)', margin:'0 0 0 0' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:'rgba(255,255,255,0.7)', borderRadius:1, transition:'width 0.1s linear' }}/>
        </div>
      </div>
    </div>
  );
}
