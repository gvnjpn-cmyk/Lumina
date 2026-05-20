const KEY = 'lumina_playlists';

export function getPlaylists() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function savePlaylists(pls) {
  localStorage.setItem(KEY, JSON.stringify(pls));
}
export function createPlaylist(name) {
  const pls = getPlaylists();
  const pl = { id: Date.now().toString(), name, tracks: [], createdAt: Date.now() };
  savePlaylists([...pls, pl]);
  return pl;
}
export function deletePlaylist(id) {
  savePlaylists(getPlaylists().filter(p => p.id !== id));
}
export function addTrackToPlaylist(playlistId, track) {
  const pls = getPlaylists();
  const pl = pls.find(p => p.id === playlistId);
  if (!pl || pl.tracks.find(t => t.id === track.id)) return;
  pl.tracks.push(track);
  savePlaylists(pls);
}
export function removeTrackFromPlaylist(playlistId, trackId) {
  const pls = getPlaylists();
  const pl = pls.find(p => p.id === playlistId);
  if (!pl) return;
  pl.tracks = pl.tracks.filter(t => t.id !== trackId);
  savePlaylists(pls);
}
