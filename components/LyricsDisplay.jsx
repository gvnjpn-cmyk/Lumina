'use client';
import { useEffect, useRef, useCallback } from 'react';

export default function LyricsDisplay({ lyrics, currentTime, onSeek, isLoading, trackName, artistName }) {
  const containerRef = useRef(null);
  const activeRef = useRef(null);

  // Find active line index
  const activeIndex = (() => {
    if (!lyrics?.length) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime + 0.3) idx = i;
      else break;
    }
    return idx;
  })();

  // Auto-scroll to active line
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      const offset = activeRect.top - containerRect.top - containerRect.height / 2 + activeRect.height / 2;
      container.scrollBy({ top: offset, behavior: 'smooth' });
    }
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-6 py-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="skeleton h-6 rounded-lg" style={{ width: `${55 + Math.random() * 35}%`, opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    );
  }

  if (!lyrics || lyrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="text-4xl opacity-30">♪</div>
        <p className="text-white/30 text-sm font-mono">Lyrics not available</p>
        {trackName && (
          <p className="text-white/20 text-xs">for "{trackName}"</p>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto px-6 py-12 scroll-smooth"
      style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)' }}
    >
      <div className="flex flex-col gap-2 min-h-full">
        {/* Top padding for centering first line */}
        <div className="h-24" />

        {lyrics.map((line, i) => {
          const isActive = i === activeIndex;
          const isPast = i < activeIndex;
          const isFuture = i > activeIndex;

          return (
            <div
              key={i}
              ref={isActive ? activeRef : null}
              className={`lyric-line select-none px-2 py-1 rounded-lg ${
                isActive ? 'active' : isPast ? 'past' : 'future'
              }`}
              style={{
                fontSize: isActive ? '1.35rem' : '1.1rem',
                fontFamily: "'Playfair Display', serif",
                fontWeight: isActive ? 600 : 400,
                letterSpacing: isActive ? '-0.01em' : '0',
                paddingLeft: isActive ? '12px' : '8px',
                borderLeft: isActive ? '3px solid rgba(255,255,255,0.6)' : '3px solid transparent',
              }}
              onClick={() => onSeek && onSeek(line.time)}
              title={`Jump to ${Math.floor(line.time / 60)}:${String(Math.floor(line.time % 60)).padStart(2, '0')}`}
            >
              {line.text}
            </div>
          );
        })}

        {/* Bottom padding */}
        <div className="h-24" />
      </div>
    </div>
  );
}
