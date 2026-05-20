'use client';
import { useState, useEffect, useCallback } from 'react';

const KEY = 'lumina_playlists';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => { setPlaylists(load()); }, []);

  const persist = useCallback((next) => { setPlaylists(next); save(next); }, []);

  const create = useCallback((name) => {
    const pl = { id: Date.now().toString(), name: name.trim() || 'Playlist', tracks: [], createdAt: Date.now() };
    persist([...load(), pl]);
    return pl.id;
  }, [persist]);

  const remove = useCallback((id) => persist(load().filter(p => p.id !== id)), [persist]);

  const rename = useCallback((id, name) => {
    persist(load().map(p => p.id === id ? { ...p, name } : p));
  }, [persist]);

  const addTrack = useCallback((playlistId, track) => {
    const all = load();
    const pl = all.find(p => p.id === playlistId);
    if (!pl) return;
    if (pl.tracks.find(t => t.id === track.id)) return; // no duplicates
    pl.tracks = [...pl.tracks, track];
    persist(all);
  }, [persist]);

  const removeTrack = useCallback((playlistId, trackId) => {
    const all = load();
    const pl = all.find(p => p.id === playlistId);
    if (!pl) return;
    pl.tracks = pl.tracks.filter(t => t.id !== trackId);
    persist(all);
  }, [persist]);

  const reorderTrack = useCallback((playlistId, fromIdx, toIdx) => {
    const all = load();
    const pl = all.find(p => p.id === playlistId);
    if (!pl) return;
    const tracks = [...pl.tracks];
    const [moved] = tracks.splice(fromIdx, 1);
    tracks.splice(toIdx, 0, moved);
    pl.tracks = tracks;
    persist(all);
  }, [persist]);

  return { playlists, create, remove, rename, addTrack, removeTrack, reorderTrack };
}
