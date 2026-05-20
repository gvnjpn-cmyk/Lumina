const RECENT_KEY  = 'lumina_recent';
const HISTORY_KEY = 'lumina_history';

export function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
export function addRecent(track) {
  const list = getRecent().filter(t => t.id !== track.id);
  list.unshift(track);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 20)));
}

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
export function addHistory(q) {
  if (!q?.trim()) return;
  const list = getHistory().filter(h => h.toLowerCase() !== q.toLowerCase());
  list.unshift(q.trim());
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 10)));
}
export function clearHistory() { localStorage.removeItem(HISTORY_KEY); }
