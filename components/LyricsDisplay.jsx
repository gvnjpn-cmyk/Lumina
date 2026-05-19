'use client';
import { useEffect, useRef } from 'react';

export default function LyricsDisplay({ lyrics, currentTime, onSeek, isLoading }) {
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  const activeIndex = (() => {
    if (!lyrics?.length) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime + 0.25) idx = i;
      else break;
    }
    return idx;
  })();

  useEffect(() => {
    if (!activeRef.current || !containerRef.current) return;
    const c = containerRef.current;
    const a = activeRef.current;
    c.scrollTo({ top: a.offsetTop - c.clientHeight / 2 + a.clientHeight / 2, behavior: 'smooth' });
  }, [activeIndex]);

  if (isLoading) return (
    <div className="px-6 py-8 flex flex-col gap-5">
      {[80,60,70,50,65,55,75].map((w,i) => (
        <div key={i} className="skeleton h-8" style={{ width:`${w}%` }} />
      ))}
    </div>
  );

  if (!lyrics?.length) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-16 h-16 rounded-2xl surface-2 flex items-center justify-center text-3xl text-white/20">♪</div>
      <p className="text-white/25 text-sm font-medium">No lyrics available</p>
    </div>
  );

  return (
    <div ref={containerRef} className="h-full overflow-y-auto no-select"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}>
      <div className="px-6 py-24 flex flex-col gap-3">
        {lyrics.map((line, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          return (
            <div key={i} ref={isActive ? activeRef : null}
              className={`lyric-line ${isActive ? 'active' : isPast ? 'past' : 'future'}`}
              onClick={() => onSeek?.(line.time)}>
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
