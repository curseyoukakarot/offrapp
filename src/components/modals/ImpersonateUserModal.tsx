import React, { useEffect, useState } from 'react';

type Props = { open: boolean; onClose: () => void };

export default function ImpersonateUserModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<{ id: string; email: string; role: string }[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [reason, setReason] = useState('Support request');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?query=${encodeURIComponent(query)}`);
        const json = await res.json();
        setUsers(json.users || []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [open, query]);

  if (!open) return null;

  const start = async () => {
    if (!selected) return;
    await fetch('/api/impersonate/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetUserId: selected, reason }) });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/30 flex items-start justify-center pt-24">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-xl p-4">
        <h3 className="text-lg font-semibold mb-3">Impersonate User</h3>
        <input className="w-full border rounded-lg px-3 py-2 mb-3" placeholder="Search email..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="max-h-64 overflow-auto border rounded-lg">
          {loading ? (
            <div className="p-3 text-sm text-gray-500">Searching...</div>
          ) : (
            users.map((u) => (
              <label key={u.id} className="flex items-center gap-3 p-2 border-b">
                <input type="radio" name="impersonate-user" value={u.id} checked={selected === u.id} onChange={() => setSelected(u.id)} />
                <div className="text-sm">
                  <div className="text-gray-900">{u.email}</div>
                  <div className="text-gray-500">{u.role}</div>
                </div>
              </label>
            ))
          )}
        </div>
        <div className="mt-3">
          <label className="block text-sm font-medium mb-1">Reason</label>
          <input className="w-full border rounded-lg px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700" onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white" onClick={start} disabled={!selected}>Start</button>
        </div>
      </div>
    </div>
  );
}


