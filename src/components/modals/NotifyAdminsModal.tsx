import React, { useState } from 'react';

type Props = { open: boolean; onClose: () => void };

export default function NotifyAdminsModal({ open, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'all' | 'plan' | 'tenants'>('all');
  const [plan, setPlan] = useState<string>('pro');
  const [tenantIds, setTenantIds] = useState<string>(''); // comma-separated input for simplicity
  const [startAt, setStartAt] = useState<string>('');
  const [endAt, setEndAt] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        title,
        message,
        audience,
        plan: audience === 'plan' ? plan : null,
        tenantIds: audience === 'tenants' ? tenantIds.split(',').map((s) => s.trim()).filter(Boolean) : [],
        startAt: startAt ? new Date(startAt).toISOString() : new Date().toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : new Date(Date.now() + 86400e3).toISOString(),
      };
      const res = await fetch('/api/notifications/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to announce');
      alert('Announcement queued');
      onClose();
    } catch (err) {
      alert(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Notify Admins</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input className="w-full border rounded-lg px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea className="w-full border rounded-lg px-3 py-2" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">Audience</label>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="radio" checked={audience==='all'} onChange={() => setAudience('all')} /> All tenants</label>
              <label className="flex items-center gap-2"><input type="radio" checked={audience==='plan'} onChange={() => setAudience('plan')} /> By plan</label>
              <label className="flex items-center gap-2"><input type="radio" checked={audience==='tenants'} onChange={() => setAudience('tenants')} /> Specific tenants</label>
            </div>
          </div>
          {audience === 'plan' && (
            <div>
              <label className="block text-sm font-medium mb-1">Plan</label>
              <select className="w-full border rounded-lg px-3 py-2" value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          )}
          {audience === 'tenants' && (
            <div>
              <label className="block text-sm font-medium mb-1">Tenant IDs (comma-separated)</label>
              <input className="w-full border rounded-lg px-3 py-2" value={tenantIds} onChange={(e) => setTenantIds(e.target.value)} placeholder="uuid, uuid, ..." />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start</label>
              <input type="datetime-local" className="w-full border rounded-lg px-3 py-2" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End</label>
              <input type="datetime-local" className="w-full border rounded-lg px-3 py-2" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-blue-600 text-white">{submitting ? 'Sending...' : 'Send'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


