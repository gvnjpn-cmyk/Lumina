'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import LyricsDisplay from './LyricsDisplay';
import QueuePanel from './QueuePanel';
import ArtistPanel from './ArtistPanel';
import AlbumPanel from './AlbumPanel';

const fmt = s => !s||isNaN(s)?'0:00':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const hexToRgb = h => { if(!h) return '20,20,20'; return `${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)}`; };
const vibrate = p => { try { navigator.vibrate?.(p); } catch {} };
const SLEEP_OPTIONS = [5,10,15,30,45,60];

export default function Player({
  track, onClose,
  currentTime, duration, isPlaying,
  onTogglePlay, onSeek, onSkip,
  lyrics, lyricsLoading,
  ytError, audioLoading,
  queue, onPlayFromQueue, onRemoveFromQueue,
  onAddToPlaylist, playlists,
  sleepTimer, sleepRemaining, onSetSleep, onClearSleep,
  onPlay, onPlayNext, onAddToQueue,
  showToast, onRetry,
}) {
  const [liked, setLiked]        = useState(false);
  const [lyricsOpen, setLO]      = useState(false);
  const [queueOpen, setQO]       = useState(false);
  const [menuOpen, setMenu]      = useState(false);
  const [addPlOpen, setAddPL]    = useState(false);
  const [sleepMenu, setSleepMenu]= useState(false);
  const [artistPanel, setArtist] = useState(false);
  const [albumPanel, setAlbum]   = useState(false);
  const [lyricOffset, setOffset] = useState(0);
  const [volume, setVolume]      = useState(80);
  const [muted, setMuted]        = useState(false);
  // Repeat: 0=off, 1=all, 2=one
  const [repeat, setRepeat]      = useState(0);
  const [shuffle, setShuffle]    = useState(false);
  const [shareImg, setShareImg]  = useState(null);
  const [sharing, setSharing]    = useState(false);

  const touchStartRef = useRef(null);

  const title   = track?.name || '';
  const artist  = track?.artists?.map(a => a.name).join(', ') || '';
  const album   = track?.album?.name || '';
  const cover   = track?.album?.images?.[0]?.url || null;
  const durSec  = (track?.duration_ms||0)/1000;
  const progress= (duration||durSec) ? (currentTime/(duration||durSec))*100 : 0;
  const accentRgb = hexToRgb(track?.album?.color);
  const spotifyUrl = track?.url || null;

  const activeLine = (() => {
    if (!lyrics?.length) return '';
    let idx = -1;
    for (let i=0; i<lyrics.length; i++) { if(lyrics[i].time+lyricOffset<=currentTime+0.25) idx=i; else break; }
    return lyrics[idx]?.text || lyrics[0]?.text || '';
  })();
  const adjustedLyrics = lyrics?.map(l => ({ ...l, time: l.time+lyricOffset }));

  // Touch: vertical = lyrics panel, horizontal on artwork = skip
  const onTS = e => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, target: e.target };
  };
  const onTE = e => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = touchStartRef.current.y - e.changedTouches[0].clientY;
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy > 60) setLO(true);
      if (dy < -60) setLO(false);
    }
    touchStartRef.current = null;
  };

  // Artwork swipe
  const artTS = useRef(null);
  const onArtTS = e => { artTS.current = e.touches[0].clientX; e.stopPropagation(); };
  const onArtTE = e => {
    if (artTS.current === null) return;
    const dx = e.changedTouches[0].clientX - artTS.current;
    artTS.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) { // swipe left = next
      if (queue.length > 0) { onPlayFromQueue(queue[0]); vibrate([10,20,10]); }
      else showToast?.('No next track', '⏭');
    } else { // swipe right = restart
      onSeek(0); vibrate(10);
    }
    e.stopPropagation();
  };

  const handleTogglePlay = () => { vibrate(8); onTogglePlay(); };
  const handleSkip = s => { vibrate(12); onSkip(s); };

  const handleShare = async () => {
    if (!cover) return; setSharing(true); setMenu(false);
    try {
      const r = await fetch(`/api/card?cover=${encodeURIComponent(cover)}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
      setShareImg(URL.createObjectURL(await r.blob()));
    } catch { showToast?.('Failed to generate card', '✗'); }
    setSharing(false);
  };

  const repeatIcons = [
    <svg key="off" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
    <svg key="all" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/></svg>,
    <svg key="one" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><text x="12" y="14" textAnchor="middle" fontSize="7" fill="currentColor" fontWeight="bold">1</text></svg>,
  ];

  const fmtSleep = s => s>=60?`${Math.floor(s/60)}h${s%60>0?' '+s%60+'m':''}`.trim():`${s}m`;

  const BtnPlay = ({ size=16, cls='' }) => (
    <button onClick={handleTogglePlay} className={`btn-press bg-white rounded-full flex items-center justify-center ${cls}`}
      style={{ boxShadow:`0 4px 24px rgba(${accentRgb},0.4)` }}>
      {isPlaying
        ? <svg width={size} height={size} viewBox="0 0 24 24" fill="black"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
        : <svg width={size} height={size} viewBox="0 0 24 24" fill="black"><path d="M8 5v14l11-7z"/></svg>}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 no-select" onTouchStart={onTS} onTouchEnd={onTE} style={{ background:'#000' }}>

      {/* ═══ PLAYER ═══ */}
      <div className="absolute inset-0 flex flex-col overflow-hidden"
        style={{ transform:lyricsOpen?'translateY(-100%)':'translateY(0)', transition:'transform 0.45s cubic-bezier(0.32,0.72,0,1)' }}>

        {/* Dynamic color gradient */}
        <div className="absolute top-0 left-0 right-0 h-80 pointer-events-none"
          style={{ background:`linear-gradient(180deg, rgba(${accentRgb},0.4) 0%, transparent 100%)` }}/>

        {/* Top bar */}
        <div className="relative flex items-center justify-between px-5 pt-14 pb-6">
          <button onClick={onClose} className="btn-press w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'rgba(255,255,255,0.1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
          </button>
          <div className="text-center">
            <p className="label">Now Playing</p>
            {sleepTimer && <p className="text-white/35 text-xs mt-0.5">😴 {fmt(sleepRemaining)}</p>}
          </div>
          <button onClick={() => setMenu(m=>!m)} className="btn-press w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'rgba(255,255,255,0.1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
        </div>

        {/* Compact artwork + info */}
        <div className="relative px-6 mb-6 flex items-start gap-4 flex-shrink-0">
          {/* Artwork — swipeable */}
          <div className="flex-shrink-0 artwork-shadow" onTouchStart={onArtTS} onTouchEnd={onArtTE}
            style={{ width:120, height:120, borderRadius:16, overflow:'hidden', background:'#1c1c1e' }}>
            {cover
              ? <Image src={cover} alt={title} width={120} height={120} className="object-cover w-full h-full"/>
              : <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl">♪</div>}
          </div>

          <div className="flex-1 min-w-0 pt-2 flex flex-col gap-3">
            <div>
              <h1 className="text-white font-bold text-lg leading-tight" style={{ letterSpacing:'-0.02em', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{title||'—'}</h1>
              {/* Tappable artist */}
              <button onClick={() => setArtist(true)} className="text-white/50 text-sm truncate mt-0.5 text-left block w-full hover:text-white/80 transition-colors">
                {artist}
              </button>
              {/* Tappable album */}
              <button onClick={() => setAlbum(true)} className="text-white/25 text-xs truncate mt-0.5 text-left block w-full hover:text-white/50 transition-colors">
                {album}
              </button>
            </div>
            {audioLoading && <p className="text-white/25 text-xs animate-pulse">Searching audio…</p>}
            {ytError && (
              <button onClick={()=>onRetry?.()} className="btn-press flex items-center gap-1.5 text-white/35 text-xs">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                Retry audio
              </button>
            )}
            <div className="flex items-center gap-3">
              <button onClick={() => { setLiked(l=>!l); showToast?.(liked?'Removed from liked':'Added to liked', liked?'💔':'❤️'); }} className={`btn-press ${liked?'text-white':'text-white/30'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill={liked?'currentColor':'none'} stroke="currentColor" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              <button onClick={() => { setAddPL(true); }} className="btn-press text-white/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
              <button onClick={() => setQO(true)} className={`btn-press ${queue.length>0?'text-white':'text-white/30'}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
              </button>
              {spotifyUrl && (
                <a href={spotifyUrl} target="_blank" rel="noreferrer" className="btn-press text-white/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Ambient art / lyrics teaser */}
        <div className="flex-1 relative overflow-hidden mx-6 rounded-2xl mb-6" style={{ minHeight:0, background:'#0d0d0d' }}>
          {cover && <>
            <Image src={cover} alt="" fill className="object-cover opacity-20 blur-2xl scale-125" sizes="400px"/>
            <div className="absolute inset-0" style={{ background:'linear-gradient(to bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.75))' }}/>
          </>}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            {lyricsLoading ? (
              <div className="flex flex-col gap-3 w-full items-center">{[65,45,55].map((w,i)=><div key={i} className="skeleton h-6" style={{width:`${w}%`}}/>)}</div>
            ) : lyrics?.length ? (
              <button onClick={()=>setLO(true)} className="text-center w-full">
                <p className="text-white/80 font-bold text-xl leading-snug" style={{ letterSpacing:'-0.02em', display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{activeLine}</p>
                <p className="text-white/30 text-xs mt-3 flex items-center gap-1 justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>Full lyrics
                </p>
              </button>
            ) : <p className="text-white/20 text-sm">♪ No lyrics</p>}
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-10 flex flex-col gap-4 flex-shrink-0">
          <div className="flex flex-col gap-1.5">
            <input type="range" min={0} max={duration||durSec||100} step={0.1} value={currentTime}
              onChange={e=>onSeek(Number(e.target.value))} className="am-slider" style={{'--p':`${progress}%`}}/>
            <div className="flex justify-between text-white/30 text-xs">
              <span>{fmt(currentTime)}</span><span>-{fmt(Math.max(0,(duration||durSec)-currentTime))}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={()=>setShuffle(s=>!s)} className={`btn-press ${shuffle?'text-white':'text-white/30'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10.59 9.17 5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
            </button>
            <button onClick={()=>handleSkip(-10)} className="btn-press text-white">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
            </button>
            <BtnPlay size={26} cls="w-16 h-16"/>
            <button onClick={()=>handleSkip(10)} className="btn-press text-white">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <button onClick={()=>setRepeat(r=>(r+1)%3)} className={`btn-press relative ${repeat>0?'text-white':'text-white/30'}`}>
              {repeatIcons[repeat]}
              {repeat===2 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full text-black text-[7px] font-bold flex items-center justify-center">1</span>}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={()=>setMuted(m=>!m)} className="btn-press text-white/35 flex-shrink-0">
              {muted||volume===0
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.93 6.93 0 0 1 14 17.05v2.06A8.99 8.99 0 0 0 18.01 17L19.73 18.73 21 17.46 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>}
            </button>
            <input type="range" min={0} max={100} value={muted?0:volume} onChange={e=>{setVolume(Number(e.target.value));setMuted(false);}} className="vol-slider flex-1" style={{'--p':`${muted?0:volume}%`}}/>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(255,255,255,0.35)"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </div>
        </div>
      </div>

      {/* ═══ LYRICS PANEL ═══ */}
      <div className="absolute inset-0 flex flex-col" style={{ background:'#0a0a0a', transform:lyricsOpen?'translateY(0)':'translateY(100%)', transition:'transform 0.45s cubic-bezier(0.32,0.72,0,1)' }}>
        <div className="absolute top-0 left-0 right-0 h-40 pointer-events-none" style={{ background:`linear-gradient(180deg,rgba(${accentRgb},0.22) 0%,transparent 100%)` }}/>
        <div className="relative flex items-center justify-between px-5 pt-14 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {cover && <div style={{width:44,height:44,borderRadius:10,overflow:'hidden',flexShrink:0,position:'relative'}}><Image src={cover} alt={title} fill className="object-cover" sizes="44px"/></div>}
            <div className="min-w-0"><p className="text-white text-sm font-bold truncate">{title}</p><p className="text-white/40 text-xs truncate">{artist}</p></div>
          </div>
          <button onClick={()=>setLO(false)} className="btn-press w-8 h-8 surface-2 rounded-full flex items-center justify-center text-white/60">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>
          </button>
        </div>
        <div className="flex justify-center pb-1 flex-shrink-0"><div className="w-8 h-1 bg-white/10 rounded-full"/></div>
        <div className="flex-1 overflow-hidden">
          <LyricsDisplay lyrics={adjustedLyrics} currentTime={currentTime} onSeek={t=>onSeek(t-lyricOffset)} isLoading={lyricsLoading}/>
        </div>
        <div className="px-5 py-4 flex-shrink-0" style={{borderTop:'1px solid rgba(255,255,255,0.06)'}}>
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-white/25 text-xs">Sync</span>
            <button onClick={()=>setOffset(o=>Math.round((o-0.5)*10)/10)} className="btn-press w-7 h-7 surface-3 rounded-full flex items-center justify-center text-white/60 text-sm">-</button>
            <span className="text-white/50 text-xs font-mono w-12 text-center">{lyricOffset>0?'+':''}{lyricOffset.toFixed(1)}s</span>
            <button onClick={()=>setOffset(o=>Math.round((o+0.5)*10)/10)} className="btn-press w-7 h-7 surface-3 rounded-full flex items-center justify-center text-white/60 text-sm">+</button>
            {lyricOffset!==0&&<button onClick={()=>setOffset(0)} className="btn-press text-white/25 text-xs">reset</button>}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <input type="range" min={0} max={duration||durSec||100} step={0.1} value={currentTime} onChange={e=>onSeek(Number(e.target.value))} className="am-slider" style={{'--p':`${progress}%`}}/>
              <div className="flex justify-between text-white/25 text-xs"><span>{fmt(currentTime)}</span><span>-{fmt(Math.max(0,(duration||durSec)-currentTime))}</span></div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={()=>handleSkip(-10)} className="btn-press text-white/50"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg></button>
              <BtnPlay size={20} cls="w-12 h-12"/>
              <button onClick={()=>handleSkip(10)} className="btn-press text-white/50"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg></button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Overlays ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]" onClick={()=>setMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 panel-in pb-8" style={{background:'#1c1c1e',borderRadius:'20px 20px 0 0',border:'1px solid rgba(255,255,255,0.08)'}} onClick={e=>e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-4"><div className="w-8 h-1 bg-white/15 rounded-full"/></div>
            {[
              { label:sharing?'Generating…':'Share card', icon:'🎴', action:handleShare, disabled:sharing },
              { label:'Add to playlist', icon:'➕', action:()=>{setAddPL(true);setMenu(false);} },
              { label:'View queue', icon:'📋', action:()=>{setQO(true);setMenu(false);} },
              { label:sleepTimer?`Sleep: ${fmtSleep(sleepTimer)} (cancel)`:'Sleep timer', icon:'😴', action:()=>{setSleepMenu(true);setMenu(false);} },
              ...(spotifyUrl?[{label:'Open in Spotify',icon:'🎵',action:()=>window.open(spotifyUrl,'_blank')}]:[]),
            ].map(item=>(
              <button key={item.label} onClick={item.action} disabled={item.disabled}
                className="w-full flex items-center gap-4 px-6 py-4 text-left disabled:opacity-40"
                style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-white text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {sleepMenu && (
        <div className="fixed inset-0 z-[60]" onClick={()=>setSleepMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 panel-in pb-8" style={{background:'#1c1c1e',borderRadius:'20px 20px 0 0'}} onClick={e=>e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-8 h-1 bg-white/15 rounded-full"/></div>
            <p className="text-white font-bold px-6 pb-4" style={{letterSpacing:'-0.01em'}}>Sleep Timer 😴</p>
            <div className="grid grid-cols-3 gap-2 px-6 pb-2">
              {SLEEP_OPTIONS.map(m=>(
                <button key={m} onClick={()=>{onSetSleep(m);setSleepMenu(false);showToast?.(`Sleep in ${fmtSleep(m)}`,'😴');}}
                  className={`btn-press py-3 rounded-2xl text-sm font-semibold ${sleepTimer===m?'bg-white text-black':'surface-3 text-white/80'}`}>
                  {fmtSleep(m)}
                </button>
              ))}
            </div>
            {sleepTimer&&<button onClick={()=>{onClearSleep();setSleepMenu(false);showToast?.('Sleep timer cancelled','✓');}} className="btn-press w-full px-6 py-4 text-white/40 text-sm text-center">Cancel timer</button>}
          </div>
        </div>
      )}

      {shareImg && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6" style={{background:'rgba(0,0,0,0.85)'}} onClick={()=>setShareImg(null)}>
          <div className="flex flex-col items-center gap-4" onClick={e=>e.stopPropagation()}>
            <img src={shareImg} alt="card" className="rounded-2xl shadow-2xl" style={{maxWidth:'80vw'}}/>
            <div className="flex gap-3">
              <button onClick={()=>{const a=document.createElement('a');a.href=shareImg;a.download=`${title}-card.png`;a.click();showToast?.('Downloaded!','✓');}} className="btn-press px-5 py-2.5 bg-white rounded-full text-black text-sm font-semibold">Download</button>
              <button onClick={()=>setShareImg(null)} className="btn-press px-5 py-2.5 surface-3 rounded-full text-white text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {addPlOpen && (
        <div className="fixed inset-0 z-[60]" onClick={()=>setAddPL(false)}>
          <div className="absolute bottom-0 left-0 right-0 panel-in pb-8" style={{background:'#1c1c1e',borderRadius:'20px 20px 0 0'}} onClick={e=>e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-2"><div className="w-8 h-1 bg-white/15 rounded-full"/></div>
            <p className="text-white font-bold px-6 pb-3" style={{letterSpacing:'-0.01em'}}>Add to playlist</p>
            <div className="overflow-y-auto" style={{maxHeight:'50vh'}}>
              {playlists.length===0?<p className="text-white/30 text-sm px-6 py-4">No playlists. Create one in Library.</p>
                :playlists.map(pl=>(
                  <button key={pl.id} onClick={()=>{onAddToPlaylist(pl.id,track);setAddPL(false);showToast?.(`Added to ${pl.name}`,'✓');}}
                    className="w-full flex items-center gap-4 px-6 py-3.5 text-left" style={{borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <div className="w-10 h-10 surface-3 rounded-xl flex items-center justify-center text-lg">♪</div>
                    <div><p className="text-white text-sm font-medium">{pl.name}</p><p className="text-white/35 text-xs">{pl.tracks.length} songs</p></div>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {queueOpen && <QueuePanel queue={queue} currentTrack={track} onPlay={t=>{onPlayFromQueue(t);showToast?.('Playing from queue','▶');}} onRemove={onRemoveFromQueue} onClose={()=>setQO(false)}/>}
      {artistPanel && <ArtistPanel artistName={track?.artists?.[0]?.name} onPlay={onPlay} onClose={()=>setArtist(false)}/>}
      {albumPanel && <AlbumPanel albumName={album} artistName={artist} coverUrl={cover} onPlay={onPlay} onClose={()=>setAlbum(false)}/>}
    </div>
  );
}
