'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import LyricsDisplay from './LyricsDisplay';

const fmt = s => !s || isNaN(s) ? '0:00' : `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;

export default function Player({
  track, onClose,
  // YT controls dari App (persistent)
  currentTime, duration, isPlaying,
  onTogglePlay, onSeek, onSkip,
  // Lyrics
  lyrics, lyricsLoading,
  // Status
  ytError, audioLoading,
}) {
  const [liked, setLiked]   = useState(false);
  const [lyricsOpen, setLO] = useState(false);
  const [volume, setVolume] = useState(80);
  const [muted, setMuted]   = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat]   = useState(false);
  const touchY = useRef(null);

  const title    = track?.name || '';
  const artist   = track?.artists?.map(a => a.name).join(', ') || '';
  const album    = track?.album?.name || '';
  const cover    = track?.album?.images?.[0]?.url || null;
  const durSec   = (track?.duration_ms || 0) / 1000;
  const progress = (duration || durSec) ? (currentTime / (duration || durSec)) * 100 : 0;

  const onTS = e => { touchY.current = e.touches[0].clientY; };
  const onTE = e => {
    if (touchY.current === null) return;
    const dy = touchY.current - e.changedTouches[0].clientY;
    if (dy > 60) setLO(true);
    if (dy < -60) setLO(false);
    touchY.current = null;
  };

  const activeLine = (() => {
    if (!lyrics?.length) return '';
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime + 0.25) idx = i;
      else break;
    }
    return lyrics[idx]?.text || lyrics[0]?.text || '';
  })();

  const BtnPlay = ({ size = 16, className = '' }) => (
    <button onClick={onTogglePlay}
      className={`btn-press bg-white rounded-full flex items-center justify-center ${className}`}
      style={{ boxShadow: '0 4px 20px rgba(255,255,255,0.2)' }}>
      {isPlaying
        ? <svg width={size} height={size} viewBox="0 0 24 24" fill="black"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        : <svg width={size} height={size} viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>
      }
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black no-select" onTouchStart={onTS} onTouchEnd={onTE}>

      {/* ═══ PLAYER VIEW ═══ */}
      <div className="absolute inset-0 flex flex-col"
        style={{ transform: lyricsOpen ? 'translateY(-100%)' : 'translateY(0)', transition: 'transform 0.45s cubic-bezier(0.32,0.72,0,1)' }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-14 pb-6">
          <button onClick={onClose} className="btn-press w-9 h-9 surface-2 rounded-full flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
          </button>
          <p className="label">Now Playing</p>
          <button className="btn-press w-9 h-9 surface-2 rounded-full flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>

        {/* Compact artwork + info */}
        <div className="px-6 mb-6 flex items-start gap-4 flex-shrink-0">
          <div className="flex-shrink-0 artwork-shadow" style={{ width:120, height:120, borderRadius:14, overflow:'hidden', background:'#1c1c1e' }}>
            {cover
              ? <Image src={cover} alt={title} width={120} height={120} className="object-cover w-full h-full" />
              : <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl">♪</div>}
          </div>
          <div className="flex-1 min-w-0 pt-1 flex flex-col gap-3">
            <div>
              <h1 className="text-white font-bold text-lg leading-tight truncate" style={{ letterSpacing:'-0.02em' }}>{title || '—'}</h1>
              <p className="text-white/45 text-sm truncate mt-0.5">{artist}</p>
              <p className="text-white/25 text-xs truncate mt-0.5">{album}</p>
            </div>
            {audioLoading && <p className="text-white/25 text-xs animate-pulse">Searching audio…</p>}
            {ytError && <p className="text-white/25 text-xs">⚠ No audio found</p>}
            <div className="flex items-center gap-3">
              <button onClick={() => setLiked(l => !l)} className={`btn-press ${liked ? 'text-white' : 'text-white/30'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
              <button className="btn-press text-white/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Ambient art panel with live lyric teaser */}
        <div className="flex-1 relative overflow-hidden mx-6 rounded-2xl mb-6" style={{ minHeight:0, background:'#111' }}>
          {cover && <>
            <Image src={cover} alt="" fill className="object-cover opacity-15 blur-2xl scale-110" sizes="400px" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
          </>}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            {lyricsLoading ? (
              <div className="flex flex-col gap-3 w-full items-center">
                {[65,45,55].map((w,i) => <div key={i} className="skeleton h-6" style={{ width:`${w}%` }} />)}
              </div>
            ) : lyrics?.length ? (
              <button onClick={() => setLO(true)} className="text-center w-full">
                <p className="text-white/75 font-bold text-xl leading-snug line-clamp-3" style={{ letterSpacing:'-0.02em' }}>
                  {activeLine}
                </p>
                <p className="text-white/30 text-xs mt-3 flex items-center gap-1 justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                  See full lyrics
                </p>
              </button>
            ) : (
              <p className="text-white/20 text-sm">♪ No lyrics available</p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-10 flex flex-col gap-4 flex-shrink-0">
          <div className="flex flex-col gap-1.5">
            <input type="range" min={0} max={duration || durSec || 100} step={0.1} value={currentTime}
              onChange={e => onSeek(Number(e.target.value))}
              className="am-slider" style={{ '--p': `${progress}%` }} />
            <div className="flex justify-between text-white/30 text-xs">
              <span>{fmt(currentTime)}</span>
              <span>-{fmt(Math.max(0, (duration || durSec) - currentTime))}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setShuffle(s => !s)} className={`btn-press ${shuffle ? 'text-white' : 'text-white/30'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
            </button>
            <button onClick={() => onSkip(-10)} className="btn-press text-white">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <BtnPlay size={26} className="w-16 h-16" />
            <button onClick={() => onSkip(10)} className="btn-press text-white">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <button onClick={() => setRepeat(r => !r)} className={`btn-press ${repeat ? 'text-white' : 'text-white/30'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setMuted(m => !m)} className="btn-press text-white/35 flex-shrink-0">
              {muted || volume === 0
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.93 6.93 0 0 1 14 17.05v2.06A8.99 8.99 0 0 0 18.01 17L19.73 18.73 21 17.46 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>}
            </button>
            <input type="range" min={0} max={100} value={muted ? 0 : volume}
              onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
              className="vol-slider flex-1" style={{ '--p': `${muted ? 0 : volume}%` }} />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </div>
        </div>
      </div>

      {/* ═══ LYRICS PANEL ═══ */}
      <div className="absolute inset-0 flex flex-col surface-1"
        style={{ transform: lyricsOpen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 0.45s cubic-bezier(0.32,0.72,0,1)' }}>
        <div className="flex items-center justify-between px-5 pt-14 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {cover && (
              <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', flexShrink:0, position:'relative' }}>
                <Image src={cover} alt={title} fill className="object-cover" sizes="44px" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">{title}</p>
              <p className="text-white/40 text-xs truncate">{artist}</p>
            </div>
          </div>
          <button onClick={() => setLO(false)} className="btn-press w-8 h-8 surface-2 rounded-full flex items-center justify-center text-white/60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
          </button>
        </div>
        <div className="flex justify-center pb-2 flex-shrink-0">
          <div className="w-8 h-1 bg-white/10 rounded-full" />
        </div>
        <div className="flex-1 overflow-hidden">
          <LyricsDisplay lyrics={lyrics} currentTime={currentTime} onSeek={onSeek} isLoading={lyricsLoading} />
        </div>
        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <input type="range" min={0} max={duration || durSec || 100} step={0.1} value={currentTime}
                onChange={e => onSeek(Number(e.target.value))}
                className="am-slider" style={{ '--p': `${progress}%` }} />
              <div className="flex justify-between text-white/25 text-xs">
                <span>{fmt(currentTime)}</span>
                <span>-{fmt(Math.max(0, (duration || durSec) - currentTime))}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => onSkip(-10)} className="btn-press text-white/50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
              </button>
              <BtnPlay size={20} className="w-12 h-12" />
              <button onClick={() => onSkip(10)} className="btn-press text-white/50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
