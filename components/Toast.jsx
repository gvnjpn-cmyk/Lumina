'use client';
import { useEffect, useState } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = (msg, icon = '✓') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500);
  };
  return { toasts, show };
}

export default function ToastContainer({ toasts }) {
  return (
    <div className="fixed top-16 left-0 right-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4">
      {toasts.map(t => (
        <div key={t.id} className="toast glass-dark glass-border rounded-full px-4 py-2.5 flex items-center gap-2 shadow-xl">
          <span className="text-sm">{t.icon}</span>
          <span className="text-white text-sm font-medium">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
