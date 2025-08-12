import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function CommandPalette() {
  const { isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        if (isSuperAdmin) setOpen((v) => !v);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSuperAdmin]);

  const items = [
    { label: 'Create Tenant', action: () => alert('TODO: open create-tenant modal') },
    { label: 'Impersonate User', action: () => alert('TODO: open impersonate modal') },
    { label: 'Purge Cache', action: () => fetch('/api/cache/purge', { method: 'POST' }) },
    { label: 'Rebuild Search Index', action: () => fetch('/api/search/reindex', { method: 'POST' }) },
    { label: 'Open Queues & Jobs', action: () => navigate('/super/jobs') },
    { label: 'Open Audit Logs', action: () => navigate('/super/audit') },
  ];

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] bg-black/30 flex items-start justify-center pt-24">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-xl p-4">
        <input className="w-full border rounded-lg px-3 py-2 mb-3" placeholder="Type a command..." autoFocus />
        <ul>
          {items.map((it) => (
            <li key={it.label}>
              <button onClick={() => { it.action(); setOpen(false); }} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


