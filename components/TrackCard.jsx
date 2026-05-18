'use client';
import Image from 'next/image';

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function TrackCard({ track, onClick }) {
  const cover = track?.album?.images?.[1]?.url || track?.album?.images?.[0]?.url;
  const artist = track?.artists?.map(a => a.name).join(', ') || '—';

  return (
    <button
      onClick={() => onClick(track)}
      className="glass-card rounded-2xl p-3 flex items-center gap-3 w-full text-left group"
    >
      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white/5">
        {cover ? (
          <Image src={cover} alt={track.name} fill className="object-cover" sizes="48px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xl">♪</div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-mono font-medium truncate">{track.name}</p>
        <p className="text-white/40 text-xs font-mono truncate">{artist}</p>
        {track.album?.name && (
          <p className="text-white/25 text-xs font-mono truncate">{track.album.name}</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {track.duration_ms && (
          <span className="text-white/30 text-xs font-mono">{formatDuration(track.duration_ms)}</span>
        )}
        {track.explicit && (
          <span className="text-white/30 text-[10px] border border-white/15 px-1 rounded font-mono">E</span>
        )}
      </div>
    </button>
  );
}
