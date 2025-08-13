import React, { useEffect, useState } from 'react';
import { getJSON, postJSON } from '../../lib/api';

type Announcement = { id: string; title: string; audience: string; start_at: string; end_at: string; status?: string };
type Rule = { id: string; metric: string; op: string; value: number; window: string; actions: string[]; enabled?: boolean; last_triggered_at?: string };

export default function NotificationsPage() {
  const [tab, setTab] = useState<'ann' | 'rules'>('ann');
  const [history, setHistory] = useState<Announcement[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [form, setForm] = useState<any>({ title: '', message: '', audience: 'all', plan: '', tenantIds: [], startAt: '', endAt: '' });

  useEffect(() => {
    const load = async () => {
      const h = await getJSON('/api/notifications/history').catch(() => ({ history: [] }));
      const r = await getJSON('/api/notifications/rules').catch(() => ({ rules: [] }));
      setHistory((h as any).history || []);
      setRules((r as any).rules || []);
    };
    load();
  }, []);

  const send = async () => {
    await postJSON('/api/notifications/announce', form);
    const h = await getJSON('/api/notifications/history').catch(() => ({ history: [] }));
    setHistory((h as any).history || []);
  };

  const createRule = async (rule: Partial<Rule>) => {
    const res = await postJSON('/api/notifications/rules', rule);
    setRules((prev) => [res.rule, ...prev]);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      </div>

      <div className="flex space-x-2 mb-4">
        <button className={`px-3 py-2 rounded-lg text-sm ${tab === 'ann' ? 'bg-blue-100 text-blue-700' : 'bg-white border'}`} onClick={() => setTab('ann')}>Announcements</button>
        <button className={`px-3 py-2 rounded-lg text-sm ${tab === 'rules' ? 'bg-blue-100 text-blue-700' : 'bg-white border'}`} onClick={() => setTab('rules')}>Rules</button>
      </div>

      {tab === 'ann' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Announcement</h3>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="Message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Audience</div>
                <div className="flex space-x-2">
                  {['all', 'plan', 'tenants'].map((a) => (
                    <label key={a} className={`px-3 py-2 rounded-lg text-sm cursor-pointer ${form.audience === a ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                      <input type="radio" className="hidden" name="audience" value={a} checked={form.audience === a} onChange={() => setForm({ ...form, audience: a })} />
                      {a === 'all' ? 'All tenants' : a === 'plan' ? 'By plan' : 'Specific tenants'}
                    </label>
                  ))}
                </div>
              </div>
              {form.audience === 'plan' && (
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                  <option value="">Select plan</option>
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              )}
              {form.audience === 'tenants' && (
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="Tenant IDs (comma-separated)" onChange={(e) => setForm({ ...form, tenantIds: e.target.value.split(',').map((s: string) => s.trim()) })} />
              )}
              <div className="grid grid-cols-2 gap-3">
                <input type="datetime-local" className="px-3 py-2 border border-gray-200 rounded-lg" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
                <input type="datetime-local" className="px-3 py-2 border border-gray-200 rounded-lg" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
              </div>
              <button className="w-full bg-blue-600 text-white rounded-lg px-4 py-2" onClick={send}>Send</button>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Audience</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{a.title}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{a.audience}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Date(a.start_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Date(a.end_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{a.status || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Rule */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Rule</h3>
            <div className="space-y-3">
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg" onChange={(e) => setForm({ ...form, metric: e.target.value })}>
                <option value="errorRate">errorRate</option>
                <option value="queueDepth">queueDepth</option>
                <option value="webhookFailures">webhookFailures</option>
              </select>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg" onChange={(e) => setForm({ ...form, op: e.target.value })}>
                <option value=">">&gt;</option>
                <option value="<">&lt;</option>
              </select>
              <input type="number" className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="Value" onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg" onChange={(e) => setForm({ ...form, window: e.target.value })}>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
              </select>
              <input className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="Actions (e.g., slack,#ops)" onChange={(e) => setForm({ ...form, actions: e.target.value.split(',') })} />
              <button className="w-full bg-blue-600 text-white rounded-lg px-4 py-2" onClick={() => createRule(form)}>Save Rule</button>
            </div>
          </div>

          {/* Rules Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rules</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Enabled</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Triggered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rules.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{r.metric}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.op} {r.value} over {r.window}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{(r.actions || []).join(', ')}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.enabled ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{r.last_triggered_at ? new Date(r.last_triggered_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


