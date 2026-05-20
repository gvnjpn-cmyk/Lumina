'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import TrackCard from '@/components/TrackCard';
import Navbar from '@/components/Navbar';
import MiniPlayer from '@/components/MiniPlayer';
import { getPlaylists, savePlaylists, createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist } from '@/lib/playlist';

const Player = dynamic(() => import('@/components/Player'), { ssr: false });

/* ─── Persistent YT hook ─── */
function useYouTubePlayer({ videoId, onTimeUpdate, onPlayStateChange, onEnded }) {
  const playerRef   = useRef(null);
  const pollRef     = useRef(null);
  const initialised = useRef(false);
  const onTimeRef   = useRef(onTimeUpdate);
  const onStateRef  = useRef(onPlayStateChange);
  const onEndedRef  = useRef(onEnded);
  useEffect(() => { onTimeRef.current = onTimeUpdate; }, [onTimeUpdate]);
  useEffect(() => { onStateRef.current = onPlayStateChange; }, [onPlayStateChange]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  const startPoll = useCallback(() => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (playerRef.current?.getCurrentTime)
        onTimeRef.current(playerRef.current.getCurrentTime(), playerRef.current.getDuration() || 0);
    }, 100);
  }, []);
  const stopPoll = useCallback(() => clearInterval(pollRef.current), []);

  const createPlayer = useCallback((firstVideoId) => {
    playerRef.current = new window.YT.Player('yt-persistent', {
      videoId: firstVideoId || '',
      playerVars: { autoplay: 1, controls: 0, playsinline: 1, rel: 0 },
      events: {
        onReady: e => { e.target.setVolume(80); },
        onStateChange: e => {
          const S = window.YT.PlayerState;
          const playing = e.data === S.PLAYING;
          onStateRef.current(playing);
          playing ? startPoll() : stopPoll();
          if (e.data === S.ENDED) { onTimeRef.current(0, 0); onEndedRef.current(); }
        },
        onError: () => onStateRef.current(false),
      }
    });
    initialised.current = true;
  }, [startPoll, stopPoll]);

  useEffect(() => {
    if (window.YT?.Player) return;
    window.onYouTubeIframeAPIReady = () => {};
    if (!document.getElementById('yt-api')) {
      const s = document.createElement('script');
      s.id = 'yt-api'; s.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!videoId) return;
    const load = () => {
      if (!window.YT?.Player) { setTimeout(load, 200); return; }
      if (!initialised.current) createPlayer(videoId);
      else playerRef.current?.loadVideoById?.(videoId);
    };
    load();
  }, [videoId, createPlayer]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current; if (!p) return;
    p.getPlayerState?.() === 1 ? p.pauseVideo() : p.playVideo();
  }, []);
  const seek = useCallback(t => {
    playerRef.current?.seekTo?.(t, true);
    onTimeRef.current(t, playerRef.current?.getDuration() || 0);
  }, []);
  const skip = useCallback(s => {
    const cur = playerRef.current?.getCurrentTime?.() || 0;
    const dur = playerRef.current?.getDuration?.() || 0;
    seek(Math.max(0, Math.min(cur + s, dur)));
  }, [seek]);

  return { togglePlay, seek, skip };
}

/* ─── Home View ─── */
function HomeView({ onPlay, activeTrackId }) {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading]   = useState(true);
  useEffect(() => {
    fetch('/api/trending').then(r=>r.json()).then(d=>setTrending(d.tracks||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);
  const hour = new Date().getHours();
  const greeting = hour<12?'Good morning':hour<18?'Good afternoon':'Good evening';
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-5 pt-16 pb-5">
        <p className="text-white/40 text-sm mb-1">{greeting}</p>
        <p className="text-white text-2xl font-bold" style={{letterSpacing:'-0.02em'}}>What's hot right now</p>
      </div>
      <div className="px-4 pb-6">
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(8)].map((_,i)=>(
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="skeleton w-5 h-4 flex-shrink-0"/>
                <div className="skeleton w-11 h-11 flex-shrink-0 rounded-lg"/>
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="skeleton h-3.5" style={{width:'60%'}}/>
                  <div className="skeleton h-3" style={{width:'40%'}}/>
                </div>
              </div>
            ))}
          </div>
        ) : trending.length===0 ? (
          <p className="text-white/25 text-sm text-center py-12">Could not load trending</p>
        ) : (
          <div className="flex flex-col gap-1">
            {trending.map((t,i)=>(
              <button key={t.id} onClick={()=>onPlay(t, trending)}
                className="card-row flex items-center gap-3 px-3 py-2.5 w-full text-left">
                <span className="text-white/25 text-sm font-bold w-5 text-center flex-shrink-0">{i+1}</span>
                <div className="relative flex-shrink-0" style={{width:44,height:44,borderRadius:8,overflow:'hidden',background:'#2c2c2e'}}>
                  {(t.album?.images?.[1]?.url||t.album?.images?.[0]?.url) &&
                    <Image src={t.album?.images?.[1]?.url||t.album?.images?.[0]?.url} alt={t.name} fill className="object-cover" sizes="44px"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${activeTrackId===t.id?'text-white':'text-white/90'}`}>{t.name}</p>
                  <p className="text-white/35 text-xs truncate">{t.artists?.map(a=>a.name).join(', ')}</p>
                </div>
                {activeTrackId===t.id&&<div className="flex gap-0.5 items-end h-4 flex-shrink-0">{[0,1,2].map(j=><div key={j} className="eq-bar" style={{animationDelay:`${j*0.15}s`}}/>)}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Search View ─── */
const SUGGESTIONS = ['Surat Cinta Untuk Starla','Blinding Lights','As It Was','Flowers','Selamat Tinggal','Apa Mungkin','Stay','Dynamite','Levitating','Cruel Summer'];
function SearchView({ onPlay, activeTrackId }) {
  const [q,setQ]=[...useState('')];
  const [results,setRes]=useState(null);
  const [loading,setLoad]=useState(false);
  const [tab,setTab]=useState('tracks');
  const debRef=useRef(null);
  const search=useCallback(async v=>{
    if(!v.trim()){setRes(null);return;}
    setLoad(true);
    try{const r=await fetch(`/api/spotify/search?q=${encodeURIComponent(v)}`);setRes(await r.json());}catch{}
    setLoad(false);
  },[]);
  const handleChange=e=>{setQ(e.target.value);clearTimeout(debRef.current);debRef.current=setTimeout(()=>search(e.target.value),450);};
  const tracks=results?.tracks||[], artists=results?.artists||[], albums=results?.albums||[];
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-16 pb-3 flex-shrink-0">
        <p className="text-white text-2xl font-bold mb-4" style={{letterSpacing:'-0.02em'}}>Search</p>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
          <input value={q} onChange={handleChange} placeholder="Artists, songs…" className="search-input w-full pl-9 pr-9 py-3 text-sm"/>
          {loading&&<div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/15 border-t-white/50 rounded-full animate-spin"/>}
          {q&&!loading&&<button onClick={()=>{setQ('');setRes(null);}} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {!q?(
          <div className="fade-in"><p className="label mb-3">Try searching</p>
            <div className="flex flex-wrap gap-2">{SUGGESTIONS.map(s=><button key={s} onClick={()=>{setQ(s);search(s);}} className="pill text-white/70">{s}</button>)}</div>
          </div>
        ):results?(
          <div className="fade-in flex flex-col gap-3">
            {(tracks.length>0||artists.length>0||albums.length>0)&&(
              <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth:'none'}}>
                {[['tracks',tracks.length],['artists',artists.length],['albums',albums.length]].filter(([,c])=>c>0).map(([t])=>(
                  <button key={t} onClick={()=>setTab(t)} className={`pill capitalize flex-shrink-0 ${tab===t?'bg-white text-black':'text-white/60'}`}>{t}</button>
                ))}
              </div>
            )}
            {tab==='tracks'&&<div className="flex flex-col gap-1">{tracks.length===0?<p className="text-white/25 text-sm text-center py-8">No tracks</p>:tracks.map(t=><TrackCard key={t.id} track={t} onClick={tr=>onPlay(tr,tracks)} active={activeTrackId===t.id}/>)}</div>}
            {tab==='artists'&&<div className="flex flex-col gap-1">{artists.map(a=>(
              <button key={a.id} onClick={()=>{setQ(a.name);search(a.name);}} className="card-row flex items-center gap-3 px-3 py-2.5 w-full text-left">
                <div style={{width:44,height:44,borderRadius:99,overflow:'hidden',background:'#2c2c2e',flexShrink:0,position:'relative'}}>
                  {a.images?.[0]?.url?<Image src={a.images[0].url} alt={a.name} fill className="object-cover" sizes="44px"/>:<div className="w-full h-full flex items-center justify-center text-white/15">♪</div>}
                </div>
                <div className="min-w-0 flex-1"><p className="text-white text-sm font-semibold truncate">{a.name}</p><p className="text-white/35 text-xs">Artist</p></div>
                <svg className="text-white/20" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
              </button>
            ))}</div>}
            {tab==='albums'&&<div className="flex flex-col gap-1">{albums.map(a=>(
              <button key={a.id} onClick={()=>{const q=`${a.name} ${a.artists?.[0]?.name||''}`;setQ(q);search(q);}} className="card-row flex items-center gap-3 px-3 py-2.5 w-full text-left">
                <div style={{width:44,height:44,borderRadius:8,overflow:'hidden',background:'#2c2c2e',flexShrink:0,position:'relative'}}>
                  {a.images?.[0]?.url?<Image src={a.images[0].url} alt={a.name} fill className="object-cover" sizes="44px"/>:<div className="w-full h-full flex items-center justify-center text-white/15">♪</div>}
                </div>
                <div className="min-w-0 flex-1"><p className="text-white text-sm font-semibold truncate">{a.name}</p><p className="text-white/35 text-xs truncate">{a.artists?.map(x=>x.name).join(', ')}</p></div>
                {a.release_year&&<span className="text-white/20 text-xs flex-shrink-0">{a.release_year}</span>}
              </button>
            ))}</div>}
          </div>
        ):null}
      </div>
    </div>
  );
}

/* ─── Library View ─── */
function LibraryView({ playlists, onPlay, onCreatePlaylist, onDeletePlaylist, activeTrackId }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState('');
  const [openPl, setOpenPl]     = useState(null);

  const pl = playlists.find(p => p.id === openPl);

  if (pl) return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-16 pb-5 flex items-center gap-3 flex-shrink-0">
        <button onClick={()=>setOpenPl(null)} className="btn-press text-white/50">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
        </button>
        <div>
          <p className="text-white text-xl font-bold" style={{letterSpacing:'-0.02em'}}>{pl.name}</p>
          <p className="text-white/35 text-xs">{pl.tracks.length} songs</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {pl.tracks.length===0
          ? <p className="text-white/25 text-sm text-center py-12">No songs yet</p>
          : <div className="flex flex-col gap-1">
              {pl.tracks.map(t=><TrackCard key={t.id} track={t} onClick={tr=>onPlay(tr,pl.tracks)} active={activeTrackId===t.id}/>)}
            </div>
        }
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 pt-16 pb-4 flex items-center justify-between flex-shrink-0">
        <p className="text-white text-2xl font-bold" style={{letterSpacing:'-0.02em'}}>Library</p>
        <button onClick={()=>setCreating(true)} className="btn-press flex items-center gap-2 px-3 py-2 surface-2 rounded-full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          <span className="text-white text-xs font-medium">New</span>
        </button>
      </div>

      {creating&&(
        <div className="px-5 pb-4 flex gap-2 flex-shrink-0">
          <input value={newName} onChange={e=>setNewName(e.target.value)}
            placeholder="Playlist name…" className="search-input flex-1 px-3 py-2.5 text-sm"
            autoFocus onKeyDown={e=>{if(e.key==='Enter'&&newName.trim()){onCreatePlaylist(newName.trim());setNewName('');setCreating(false);}}}/>
          <button onClick={()=>{if(newName.trim()){onCreatePlaylist(newName.trim());setNewName('');setCreating(false);}}}
            className="btn-press px-4 py-2 bg-white rounded-xl text-black text-sm font-semibold">Create</button>
          <button onClick={()=>{setCreating(false);setNewName('');}} className="btn-press px-3 py-2 surface-3 rounded-xl text-white/60 text-sm">✕</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {playlists.length===0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-16 h-16 surface-2 rounded-2xl flex items-center justify-center text-3xl text-white/15">♪</div>
            <p className="text-white/25 text-sm">No playlists yet</p>
            <button onClick={()=>setCreating(true)} className="pill text-white/50 text-sm">Create playlist</button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {playlists.map(p=>(
              <button key={p.id} onClick={()=>setOpenPl(p.id)}
                className="card-row flex items-center gap-3 px-3 py-3 w-full text-left">
                <div className="w-12 h-12 surface-3 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {p.tracks[0]?.album?.images?.[1]?.url
                    ? <Image src={p.tracks[0].album.images[1].url} alt="" width={48} height={48} className="object-cover rounded-xl"/>
                    : '♪'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-white/35 text-xs">{p.tracks.length} songs</p>
                </div>
                <button onClick={e=>{e.stopPropagation();onDeletePlaylist(p.id);}} className="btn-press text-white/20 hover:text-white/50 p-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Root App ─── */
export default function App() {
  const [tab, setTab]           = useState('home');
  const [activeTrack, setTrack] = useState(null);
  const [playerOpen, setOpen]   = useState(false);
  const [isPlaying, setPlaying] = useState(false);
  const [currentTime, setCT]    = useState(0);
  const [duration, setDur]      = useState(0);
  const [videoId, setVid]       = useState(null);
  const [ytError, setYtErr]     = useState(false);
  const [audioLoading, setAL]   = useState(false);
  const [lyrics, setLyrics]     = useState(null);
  const [lyricsLoading, setLL]  = useState(false);
  const [queue, setQueue]       = useState([]);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => { setPlaylists(getPlaylists()); }, []);

  const onTimeUpdate = useCallback((ct, dur) => { setCT(ct); if (dur) setDur(dur); }, []);

  const loadTrack = useCallback(async (track) => {
    setTrack(track); setOpen(true);
    setYtErr(false); setAL(true); setCT(0); setDur(0);
    const t = track.name || '', a = track.artists?.[0]?.name || '';
    // Fetch video
    fetch(`/api/youtube?title=${encodeURIComponent(t)}&artist=${encodeURIComponent(a)}`)
      .then(r=>r.json()).then(d=>{ d.videoId ? setVid(d.videoId) : setYtErr(true); })
      .catch(()=>setYtErr(true)).finally(()=>setAL(false));
    // Fetch lyrics
    const alb = track.album?.name || '', dur = Math.round((track.duration_ms||0)/1000);
    setLL(true); setLyrics(null);
    fetch(`/api/lyrics?title=${encodeURIComponent(t)}&artist=${encodeURIComponent(a)}&album=${encodeURIComponent(alb)}&duration=${dur}`)
      .then(r=>r.json()).then(d=>setLyrics(d.synced||null))
      .catch(()=>setLyrics(null)).finally(()=>setLL(false));
  }, []);

  const onEnded = useCallback(() => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      loadTrack(next);
    }
  }, [queue, loadTrack]);

  const { togglePlay, seek, skip } = useYouTubePlayer({
    videoId, onTimeUpdate, onPlayStateChange: setPlaying, onEnded,
  });

  const handlePlay = useCallback(async (track, context = []) => {
    if (track.id && track.id === activeTrack?.id) { setOpen(true); return; }
    // Set queue = rest of context after this track
    const idx = context.findIndex(t => t.id === track.id);
    setQueue(idx >= 0 ? context.slice(idx + 1) : []);
    // Fetch full track info
    let full = track;
    if (track.id && !track.playcount) {
      try { const r=await fetch(`/api/spotify/track/${track.id}`); const d=await r.json(); if(d?.name) full=d; } catch {}
    }
    loadTrack(full);
  }, [activeTrack?.id, loadTrack]);

  const handleAddToPlaylist = useCallback((plId, track) => {
    addTrackToPlaylist(plId, track);
    setPlaylists(getPlaylists());
  }, []);

  const handleCreatePlaylist = useCallback((name) => {
    createPlaylist(name);
    setPlaylists(getPlaylists());
  }, []);

  const handleDeletePlaylist = useCallback((id) => {
    deletePlaylist(id);
    setPlaylists(getPlaylists());
  }, []);

  return (
    <div className="flex flex-col h-full surface-0">
      {/* Persistent YT div */}
      <div style={{position:'fixed',width:1,height:1,bottom:0,right:0,opacity:0,pointerEvents:'none',zIndex:-1}}>
        <div id="yt-persistent"/>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {tab==='home'    && <HomeView    onPlay={handlePlay} activeTrackId={activeTrack?.id}/>}
        {tab==='search'  && <SearchView  onPlay={handlePlay} activeTrackId={activeTrack?.id}/>}
        {tab==='library' && <LibraryView playlists={playlists} onPlay={handlePlay} activeTrackId={activeTrack?.id}
                              onCreatePlaylist={handleCreatePlaylist} onDeletePlaylist={handleDeletePlaylist}/>}
      </div>

      {/* Mini player */}
      {activeTrack && !playerOpen && (
        <MiniPlayer track={activeTrack} isPlaying={isPlaying} onOpen={()=>setOpen(true)} onTogglePlay={togglePlay}/>
      )}

      {/* Navbar */}
      <Navbar active={tab} onChange={setTab} queueCount={queue.length}/>

      {/* Full player (stays mounted, hidden with display:none) */}
      {activeTrack && (
        <div style={{display:playerOpen?'block':'none',position:'fixed',inset:0,zIndex:50}}>
          <Player
            track={activeTrack} onClose={()=>setOpen(false)}
            currentTime={currentTime} duration={duration} isPlaying={isPlaying}
            onTogglePlay={togglePlay} onSeek={seek} onSkip={skip}
            lyrics={lyrics} lyricsLoading={lyricsLoading}
            ytError={ytError} audioLoading={audioLoading}
            queue={queue}
            onPlayFromQueue={t=>{ setQueue(q=>{ const i=q.findIndex(x=>x.id===t.id); return i>=0?q.slice(i+1):q; }); loadTrack(t); }}
            onRemoveFromQueue={i=>setQueue(q=>q.filter((_,j)=>j!==i))}
            onAddToPlaylist={handleAddToPlaylist}
            playlists={playlists}
          />
        </div>
      )}
    </div>
  );
}
