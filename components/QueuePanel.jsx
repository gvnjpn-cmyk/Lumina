'use client';
import Image from 'next/image';

export default function QueuePanel({ queue, currentTrack, onPlay, onRemove, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="mt-auto flex flex-col panel-in" style={{ maxHeight: '70vh', background: '#111', borderRadius: '20px 20px 0 0', borderTop: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-white font-bold text-lg" style={{ letterSpacing: '-0.02em' }}>Queue</p>
            <p className="text-white/35 text-xs mt-0.5">{queue.length} songs up next</p>
          </div>
          <button onClick={onClose} className="btn-press w-8 h-8 surface-3 rounded-full flex items-center justify-center text-white/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>

        {/* Now playing */}
        {currentTrack && (
          <div className="px-5 pb-3">
            <p className="label mb-2">Now playing</p>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="relative flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#2c2c2e' }}>
                {currentTrack.album?.images?.[1]?.url && <Image src={currentTrack.album.images[1].url} alt="" fill className="object-cover" sizes="40px" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold truncate">{currentTrack.name}</p>
                <p className="text-white/40 text-xs truncate">{currentTrack.artists?.[0]?.name}</p>
              </div>
              <div className="flex gap-0.5 items-end h-4 flex-shrink-0">
                {[0,1,2].map(i => <div key={i} className="eq-bar" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-5 pb-6">
          {queue.length === 0 ? (
            <p className="text-white/25 text-sm text-center py-8">Queue is empty</p>
          ) : (
            <div className="flex flex-col gap-1">
              {queue.map((t, i) => (
                <div key={`${t.id}-${i}`} className="card-row flex items-center gap-3 px-3 py-2.5">
                  <span className="text-white/20 text-xs w-4 flex-shrink-0">{i + 1}</span>
                  <div className="relative flex-shrink-0" style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#2c2c2e' }}>
                    {t.album?.images?.[1]?.url && <Image src={t.album.images[1].url} alt="" fill className="object-cover" sizes="40px" />}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => onPlay(t)}>
                    <p className="text-white text-sm font-medium truncate">{t.name}</p>
                    <p className="text-white/35 text-xs truncate">{t.artists?.[0]?.name}</p>
                  </div>
                  <button onClick={() => onRemove(i)} className="btn-press text-white/25 hover:text-white/60 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
