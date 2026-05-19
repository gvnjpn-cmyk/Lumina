'use client';
import Image from 'next/image';

export default function MiniPlayer({ track, isPlaying, onOpen, onTogglePlay }) {
  if (!track) return null;
  const cover = track.album?.images?.[0]?.url;
  const title = track.name || '—';
  const artist = track.artists?.[0]?.name || '';

  return (
    <div className="px-3 pb-2">
      <div className="mini-player flex items-center gap-3 px-3 py-2.5 cursor-pointer" onClick={onOpen}>
        {/* Art */}
        <div className="w-10 h-10 rounded-8 overflow-hidden relative flex-shrink-0 bg-white/10" style={{ borderRadius: 8 }}>
          {cover && <Image src={cover} alt={title} fill className="object-cover" sizes="40px" />}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate leading-tight">{title}</p>
          <p className="text-white/45 text-xs truncate leading-tight">{artist}</p>
        </div>
        {/* Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button className="btn-press text-white" onClick={e => { e.stopPropagation(); onTogglePlay(); }}>
            {isPlaying
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
          </button>
          <button className="btn-press text-white/60" onClick={e => { e.stopPropagation(); }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
