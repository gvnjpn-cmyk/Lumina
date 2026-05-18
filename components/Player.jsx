'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import LyricsDisplay from './LyricsDisplay';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function Player({ track, onClose }) {
  const [videoId, setVideoId] = useState(null);
  const [lyrics, setLyrics] = useState(null);
  const [lyricsLoading, setLyricsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('lyrics'); // 'lyrics' | 'info'
  const [ytReady, setYtReady] = useState(false);
  const [ytError, setYtError] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);

  const playerRef = useRef(null);
  const intervalRef = useRef(null);
  const playerDivId = 'yt-player-hidden';

  const trackTitle = track?.name || '';
  const trackArtist = track?.artists?.[0]?.name || '';
  const trackAlbum = track?.album?.name || '';
  const trackDurationSec = (track?.duration_ms || 0) / 1000;
  const coverUrl = track?.album?.images?.[0]?.url || track?.album?.images?.[1]?.url || null;

  // Load YouTube IFrame API once
  useEffect(() => {
    if (window.YT && window.YT.Player) { setYtReady(true); return; }
    window.onYouTubeIframeAPIReady = () => setYtReady(true);
    if (!document.getElementById('yt-api-script')) {
      const s = document.createElement('script');
      s.id = 'yt-api-script';
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }, []);

  // Fetch YouTube video ID
  useEffect(() => {
    if (!trackTitle) return;
    setVideoId(null); setYtError(false); setVideoLoading(true);
    fetch(`/api/youtube?title=${encodeURIComponent(trackTitle)}&artist=${encodeURIComponent(trackArtist)}`)
      .then(r => r.json())
      .then(d => { if (d.videoId) setVideoId(d.videoId); else setYtError(true); setVideoLoading(false); })
      .catch(() => { setYtError(true); setVideoLoading(false); });
  }, [trackTitle, trackArtist]);

  // Fetch synced lyrics
  useEffect(() => {
    if (!trackTitle || !trackArtist) return;
    setLyricsLoading(true);
    const params = new URLSearchParams({
      title: trackTitle, artist: trackArtist,
      ...(trackAlbum && { album: trackAlbum }),
      ...(trackDurationSec && { duration: Math.round(trackDurationSec) }),
    });
    fetch(`/api/lyrics?${params}`)
      .then(r => r.json())
      .then(d => { setLyrics(d.synced || null); setLyricsLoading(false); })
      .catch(() => { setLyrics(null); setLyricsLoading(false); });
  }, [trackTitle, trackArtist, trackAlbum]);

  // Init YouTube player after videoId + ytReady
  useEffect(() => {
    if (!ytReady || !videoId) return;
    if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }

    playerRef.current = new window.YT.Player(playerDivId, {
      videoId,
      playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, playsinline: 1 },
      events: {
        onReady: (e) => {
          e.target.setVolume(volume);
          setDuration(e.target.getDuration());
          setIsPlaying(true);
          startPolling();
        },
        onStateChange: (e) => {
          const YT = window.YT;
          setIsPlaying(e.data === YT.PlayerState.PLAYING);
          if (e.data === YT.PlayerState.PLAYING) startPolling();
          else stopPolling();
          if (e.data === YT.PlayerState.ENDED) setCurrentTime(0);
        },
        onError: () => setYtError(true),
      },
    });

    return () => { stopPolling(); };
  }, [ytReady, videoId]);

  // Sync volume
  useEffect(() => {
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  function startPolling() {
    stopPolling();
    intervalRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        setCurrentTime(playerRef.current.getCurrentTime());
        const d = playerRef.current.getDuration();
        if (d) setDuration(d);
      }
    }, 100);
  }
  function stopPolling() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  };

  const seek = (time) => {
    if (playerRef.current?.seekTo) { playerRef.current.seekTo(time, true); setCurrentTime(time); }
  };

  const handleProgress = (e) => seek(Number(e.target.value));

  const skipForward = () => seek(Math.min(currentTime + 10, duration));
  const skipBack = () => seek(Math.max(currentTime - 10, 0));

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const volumeProgress = isMuted ? 0 : volume;

  return (
    <div className="fixed inset-0 z-50 flex flex-col slide-up" style={{ background: '#060608' }}>
      {/* Hidden YouTube player div */}
      <div style={{ position: 'fixed', bottom: 0, right: 0, width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <div id={playerDivId} />
      </div>

      {/* Top bar */}
      <div className="glass-strong flex items-center gap-4 px-5 py-4 flex-shrink-0">
        <button onClick={onClose} className="btn-press text-white/50 hover:text-white transition-colors p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="flex-1 text-center">
          <p className="text-white/40 text-xs tracking-widest uppercase font-mono">Now Playing</p>
        </div>
        {/* Tabs */}
        <div className="glass rounded-full flex gap-1 p-1">
          {['lyrics', 'info'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded-full text-xs font-mono transition-all capitalize ${activeTab === t ? 'tab-active' : 'text-white/40 hover:text-white/60'}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-0">

        {/* Left: Track info + controls */}
        <div className="glass flex flex-col items-center justify-between px-6 py-6 md:w-[340px] flex-shrink-0 gap-4">
          {/* Cover art */}
          <div className="relative flex-shrink-0">
            <div className="disc playing w-48 h-48 md:w-56 md:h-56 relative cover-glow rounded-full overflow-hidden"
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}>
              {coverUrl ? (
                <Image src={coverUrl} alt={trackTitle} fill className="object-cover" sizes="224px" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <span className="text-4xl opacity-30">♪</span>
                </div>
              )}
            </div>
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#060608] border border-white/10 z-10" />
            {/* Pulse ring when playing */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse-ring pointer-events-none" />
            )}
          </div>

          {/* Track info */}
          <div className="text-center w-full">
            <h1 className="text-white font-display text-xl font-semibold leading-tight mb-1 line-clamp-2"
              style={{ fontFamily: 'Playfair Display, serif' }}>
              {trackTitle || '—'}
            </h1>
            <p className="text-white/50 text-sm font-mono">
              {trackArtist}{trackAlbum && ` · ${trackAlbum}`}
            </p>
            {ytError && (
              <p className="text-white/30 text-xs mt-1">⚠ Audio unavailable</p>
            )}
            {videoLoading && !ytError && (
              <p className="text-white/30 text-xs mt-1 animate-pulse">Loading audio…</p>
            )}
          </div>

          {/* Progress */}
          <div className="w-full flex flex-col gap-2">
            <input
              type="range" min={0} max={duration || trackDurationSec || 100} step={0.1}
              value={currentTime} onChange={handleProgress}
              className="progress-bar"
              style={{ '--progress': `${progress}%` }}
            />
            <div className="flex justify-between text-white/30 text-xs font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration || trackDurationSec)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-5">
            <button onClick={skipBack} className="btn-press text-white/50 hover:text-white transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
              </svg>
            </button>
            <button onClick={togglePlay}
              className="btn-press w-14 h-14 glass-strong rounded-full flex items-center justify-center hover:bg-white/15 transition-all">
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            <button onClick={skipForward} className="btn-press text-white/50 hover:text-white transition-colors">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </svg>
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 w-full justify-center">
            <button onClick={() => setIsMuted(m => !m)} className="text-white/40 hover:text-white transition-colors">
              {isMuted || volume === 0 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18H17l-4-4-4-4H4.27zM12 4 9.91 6.09 12 8.18V4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
              )}
            </button>
            <input
              type="range" min={0} max={100} value={isMuted ? 0 : volume}
              onChange={e => { setVolume(Number(e.target.value)); setIsMuted(false); }}
              className="volume-bar"
              style={{ '--progress': `${volumeProgress}%` }}
            />
          </div>
        </div>

        {/* Right: Lyrics / Info panel */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'lyrics' ? (
            <LyricsDisplay
              lyrics={lyrics}
              currentTime={currentTime}
              onSeek={seek}
              isLoading={lyricsLoading}
              trackName={trackTitle}
              artistName={trackArtist}
            />
          ) : (
            <div className="h-full overflow-y-auto px-6 py-8 flex flex-col gap-6">
              <h2 className="text-white/40 text-xs tracking-widest uppercase font-mono">Track Info</h2>
              <div className="glass-card rounded-2xl p-5 flex flex-col gap-4">
                {[
                  { label: 'Title', value: trackTitle },
                  { label: 'Artist', value: trackArtist },
                  { label: 'Album', value: trackAlbum },
                  { label: 'Duration', value: formatTime(trackDurationSec) },
                  { label: 'Explicit', value: track?.explicit ? 'Yes' : 'No' },
                  { label: 'Play Count', value: track?.playcount ? track.playcount.toLocaleString() : '—' },
                  { label: 'Release Year', value: track?.album?.release_year || '—' },
                ].map(({ label, value }) => value && (
                  <div key={label} className="flex justify-between items-start gap-4 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <span className="text-white/30 text-xs font-mono uppercase tracking-wider flex-shrink-0">{label}</span>
                    <span className="text-white/80 text-sm text-right font-mono">{value}</span>
                  </div>
                ))}
                {track?.artists?.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-white/30 text-xs font-mono uppercase tracking-wider">All Artists</span>
                    <div className="flex flex-wrap gap-2">
                      {track.artists.map(a => (
                        <span key={a.id} className="glass px-3 py-1 rounded-full text-xs text-white/60 font-mono">{a.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
