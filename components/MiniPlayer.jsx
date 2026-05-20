'use client';
import Image from 'next/image';
export default function MiniPlayer({ track, isPlaying, onOpen, onTogglePlay }) {
  if (!track) return null;
  const cover  = track.album?.images?.[0]?.url;
  const title  = track.name || '—';
  const artist = track.artists?.[0]?.name || '';
  return (
    <div className="px-3 pb-2">
      <div className="mini-player flex items-center gap-3 px-3 py-2.5 cursor-pointer" onClick={onOpen}>
        <div className="relative flex-shrink-0" style={{width:40,height:40,borderRadius:10,overflow:'hidden',background:'#2c2c2e'}}>
          {cover && <Image src={cover} alt={title} fill className="object-cover" sizes="40px"/>}
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="flex gap-0.5 items-end h-3">
                {[0,1,2].map(i=><div key={i} className="eq-bar" style={{animationDelay:`${i*0.15}s`}}/>)}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{title}</p>
          <p className="text-white/45 text-xs truncate">{artist}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button className="btn-press text-white" onClick={e=>{e.stopPropagation();onTogglePlay();}}>
            {isPlaying
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <button className="btn-press text-white/50" onClick={e=>e.stopPropagation()}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
