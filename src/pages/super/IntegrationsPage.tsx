import React, { useEffect, useState } from 'react';
import { getJSON, patchJSON } from '../../lib/api';

type GlobalKey = { key: string; description: string; lastUsedAt?: string; masked?: string };
type TenantIntegration = { id: string; name: string; slug: string; integrations: Record<string, boolean> };
type Webhook = { id: string; event: string; status: number; deliveredAt: string };

export default function IntegrationsPage() {
  const [globals, setGlobals] = useState<Record<string, GlobalKey>>({});
  const [tenants, setTenants] = useState<TenantIntegration[]>([]);
  const [drawerTenant, setDrawerTenant] = useState<TenantIntegration | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);

  useEffect(() => {
    const load = async () => {
      const g = await getJSON('/api/integrations');
      const t = await getJSON('/api/tenants?includeIntegrations=true');
      setGlobals((g as any).globals || {});
      setTenants((t as any).tenants || []);
    };
    load();
  }, []);

  const saveGlobal = async (key: string, value: string) => {
    const res = await patchJSON(`/api/integrations/${key}`, { value });
    setGlobals((prev) => ({ ...prev, [key]: res.global }));
  };

  const toggleTenant = async (tenantId: string, key: string) => {
    const res = await patchJSON(`/api/tenants/${tenantId}/integrations`, { key, enabled: !findTenant(tenantId).integrations[key] });
    setTenants((prev) => prev.map((t) => (t.id === tenantId ? { ...t, integrations: res.integrations } : t)));
  };

  const openWebhookDebugger = async (tenant: TenantIntegration) => {
    setDrawerTenant(tenant);
    const data = await getJSON(`/api/integrations/webhooks?tenantId=${tenant.id}`);
    setWebhooks((data as any).deliveries || []);
  };

  const replay = async (id: string) => {
    await patchJSON('/api/integrations/webhooks/replay', { id });
  };

  const findTenant = (id: string) => tenants.find((t) => t.id === id)!;

  const globalCards = [
    { key: 'slack', title: 'Slack', icon: 'fa-brands fa-slack' },
    { key: 'sendgrid', title: 'SendGrid', icon: 'fa-solid fa-envelope' },
    { key: 'google', title: 'Google OAuth', icon: 'fa-brands fa-google' },
    { key: 'microsoft', title: 'Microsoft OAuth', icon: 'fa-brands fa-microsoft' },
    { key: 'cloudflare', title: 'Cloudflare/LE', icon: 'fa-solid fa-cloud' },
    { key: 'automation', title: 'Zapier/Make', icon: 'fa-solid fa-robot' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Global Keys */}
        <div className="space-y-4">
          {globalCards.map((c) => {
            const g = (globals as any)[c.key] as GlobalKey | undefined;
            const [value, setValue] = React.useState('');
            return (
              <div key={c.key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <i className={`${c.icon} text-gray-700`}></i>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{c.title}</div>
                      <div className="text-sm text-gray-500">{g?.description || 'Configure global credentials'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">{g?.lastUsedAt ? `Last used ${new Date(g.lastUsedAt).toLocaleString()}` : ''}</div>
                </div>
                <div className="mt-4 flex items-center space-x-2">
                  <input type="password" placeholder={g?.masked || '••••'} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" value={value} onChange={(e) => setValue(e.target.value)} />
                  <button className="px-3 py-2 bg-blue-600 text-white rounded-lg" onClick={() => saveGlobal(c.key, value)}>Save</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Per-Tenant Toggles */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Per-Tenant Toggles</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Slack</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SendGrid</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Google</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Microsoft</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Webhooks</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenants.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{t.name}</td>
                    {['slack', 'sendgrid', 'google', 'microsoft', 'webhooks'].map((k) => (
                      <td key={k} className="px-4 py-2 text-sm">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={!!t.integrations[k]} onChange={() => toggleTenant(t.id, k)} />
                          <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right">
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg" onClick={() => openWebhookDebugger(t)}>Webhook Debugger</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Webhook Drawer */}
      {drawerTenant && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDrawerTenant(null)}></div>
          <div className="absolute right-0 top-0 bottom-0 w-[520px] bg-white shadow-xl border-l border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Webhook Debugger • {drawerTenant.name}</h3>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setDrawerTenant(null)}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Delivered</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {webhooks.map((w) => (
                    <tr key={w.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">{w.event}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{w.status}</td>
                      <td className="px-4 py-2 text-sm text-gray-700">{new Date(w.deliveredAt).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right">
                        <button className="px-3 py-1 bg-blue-600 text-white rounded-lg" onClick={() => replay(w.id)}>Replay</button>
                      </td>
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


