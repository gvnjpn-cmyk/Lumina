'use client';
import Image from 'next/image';

function fmt(ms) {
  const s = Math.floor(ms/1000);
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}

export default function TrackCard({ track, onClick, active }) {
  const cover = track?.album?.images?.[1]?.url || track?.album?.images?.[0]?.url;
  const artist = track?.artists?.map(a => a.name).join(', ') || '—';
  return (
    <button onClick={() => onClick(track)}
      className="card-row flex items-center gap-3 px-3 py-2.5 w-full text-left">
      <div className="relative w-11 h-11 flex-shrink-0 bg-white/5" style={{ borderRadius: 8, overflow:'hidden' }}>
        {cover
          ? <Image src={cover} alt={track.name} fill className="object-cover" sizes="44px" />
          : <div className="w-full h-full flex items-center justify-center text-white/15 text-lg">♪</div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${active ? 'text-white' : 'text-white/90'}`}>{track.name}</p>
        <p className="text-white/40 text-xs truncate mt-0.5">{artist}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {active && (
          <div className="flex gap-0.5 items-end h-4">
            {[1,2,3].map((i,idx) => (
              <div key={i} className="eq-bar" style={{ animationDelay: `${idx*0.15}s` }} />
            ))}
          </div>
        )}
        {track.explicit && <span className="text-white/20 text-[9px] border border-white/15 px-1 rounded">E</span>}
        {track.duration_ms && <span className="text-white/25 text-xs">{fmt(track.duration_ms)}</span>}
      </div>
    </button>
  );
}
