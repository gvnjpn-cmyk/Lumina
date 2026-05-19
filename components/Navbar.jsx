'use client';

const tabs = [
  { id: 'home', label: 'Listen Now',
    icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth={a?0:1.8}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg> },
  { id: 'search', label: 'Search',
    icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg> },
  { id: 'library', label: 'Library',
    icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a?'currentColor':'none'} stroke="currentColor" strokeWidth={a?0:1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
];

export default function Navbar({ active, onChange }) {
  return (
    <div className="nav-bar flex-shrink-0">
      <div className="flex items-center">
        {tabs.map(t => (
          <button key={t.id} onClick={() => onChange(t.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 btn-press transition-colors ${active===t.id ? 'text-white' : 'text-white/35'}`}>
            {t.icon(active === t.id)}
            <span className="text-[10px] font-medium" style={{ letterSpacing:'0.02em' }}>{t.label}</span>
          </button>
        ))}
      </div>
      {/* iPhone home bar spacer */}
      <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </div>
  );
}
