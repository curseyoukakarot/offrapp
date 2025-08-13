import React, { useEffect, useState } from 'react';
import { getJSON, patchJSON } from '../../lib/api';

type Settings = {
  brand?: { appName?: string; logoUrl?: string; faviconUrl?: string; privacyUrl?: string; termsUrl?: string; supportEmail?: string };
  auth?: { require2fa?: boolean; providers?: string[]; sessionMaxHours?: number; sessionIdleMinutes?: number };
  security?: { ipAllowlist?: string[]; passwordMin?: number; passwordComplexity?: string; domainAllowlist?: string[] };
  retention?: { auditDays?: number; webhookDays?: number; exportDays?: number; policy?: string };
  rate?: { globalRpm?: number; perTenantRpm?: number };
};

export default function SettingsPage() {
  const [cfg, setCfg] = useState<Settings>({});
  const [flags, setFlags] = useState<{ key: string; enabled: boolean; description?: string }[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const s = await getJSON('/api/settings').catch(() => ({}));
      setCfg(s as Settings);
      const f = await getJSON('/api/flags').catch(() => ({ flags: [] }));
      setFlags((f as any).flags || []);
    };
    load();
  }, []);

  const save = async (path: keyof Settings, partial: any) => {
    const res = await patchJSON('/api/settings', { [path]: partial });
    setCfg(res);
    setToast('Saved');
    setTimeout(() => setToast(null), 2000);
  };

  const toggleFlag = async (key: string, enabled: boolean) => {
    const res = await patchJSON(`/api/flags/${key}`, { enabled });
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: res.enabled } : f)));
  };

  const validateCIDRs = (lines: string[]) => lines.every((l) => /^\s*$/.test(l) || /^(\d{1,3}\.){3}\d{1,3}(?:\/\d{1,2})?$/.test(l));

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {toast && <div className="fixed top-6 right-6 bg-emerald-600 text-white px-4 py-2 rounded">{toast}</div>}

      <div className="space-y-6">
        {/* Brand & Legal */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Brand &amp; Legal</h3>
            <div className="space-x-2">
              <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => window.location.reload()}>Reset</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => save('brand', cfg.brand)}>Save</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="App name" value={cfg.brand?.appName || ''} onChange={(e) => setCfg({ ...cfg, brand: { ...cfg.brand, appName: e.target.value } })} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Support email" value={cfg.brand?.supportEmail || ''} onChange={(e) => setCfg({ ...cfg, brand: { ...cfg.brand, supportEmail: e.target.value } })} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Logo URL" value={cfg.brand?.logoUrl || ''} onChange={(e) => setCfg({ ...cfg, brand: { ...cfg.brand, logoUrl: e.target.value } })} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Favicon URL" value={cfg.brand?.faviconUrl || ''} onChange={(e) => setCfg({ ...cfg, brand: { ...cfg.brand, faviconUrl: e.target.value } })} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Privacy URL" value={cfg.brand?.privacyUrl || ''} onChange={(e) => setCfg({ ...cfg, brand: { ...cfg.brand, privacyUrl: e.target.value } })} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Terms URL" value={cfg.brand?.termsUrl || ''} onChange={(e) => setCfg({ ...cfg, brand: { ...cfg.brand, termsUrl: e.target.value } })} />
          </div>
        </div>

        {/* Auth */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Auth</h3>
            <div className="space-x-2">
              <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => window.location.reload()}>Reset</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => save('auth', cfg.auth)}>Save</button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="inline-flex items-center space-x-2">
              <input type="checkbox" checked={!!cfg.auth?.require2fa} onChange={(e) => setCfg({ ...cfg, auth: { ...cfg.auth, require2fa: e.target.checked } })} />
              <span>Require 2FA for admins</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {['google', 'microsoft', 'slack', 'github'].map((p) => (
                <label key={p} className="inline-flex items-center space-x-2">
                  <input type="checkbox" checked={cfg.auth?.providers?.includes(p) || false} onChange={(e) => {
                    const set = new Set(cfg.auth?.providers || []);
                    e.target.checked ? set.add(p) : set.delete(p);
                    setCfg({ ...cfg, auth: { ...cfg.auth, providers: Array.from(set) } });
                  }} />
                  <span>{p}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input type="number" className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Session max (hours)" value={cfg.auth?.sessionMaxHours || 0} onChange={(e) => setCfg({ ...cfg, auth: { ...cfg.auth, sessionMaxHours: Number(e.target.value) } })} />
              <input type="number" className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Session idle (minutes)" value={cfg.auth?.sessionIdleMinutes || 0} onChange={(e) => setCfg({ ...cfg, auth: { ...cfg.auth, sessionIdleMinutes: Number(e.target.value) } })} />
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
            <div className="space-x-2">
              <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => window.location.reload()}>Reset</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => save('security', cfg.security)}>Save</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <textarea className={`px-3 py-2 border rounded-lg md:col-span-2 ${cfg.security?.ipAllowlist && !validateCIDRs(cfg.security.ipAllowlist) ? 'border-red-500' : 'border-gray-200'}`} rows={4} placeholder="IP/CIDR allowlist (one per line)"
              value={(cfg.security?.ipAllowlist || []).join('\n')}
              onChange={(e) => setCfg({ ...cfg, security: { ...cfg.security, ipAllowlist: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) } })} />
            <div className="space-y-3">
              <input type="number" className="px-3 py-2 border border-gray-200 rounded-lg w-full" placeholder="Password min length" value={cfg.security?.passwordMin || 8}
                onChange={(e) => setCfg({ ...cfg, security: { ...cfg.security, passwordMin: Number(e.target.value) } })} />
              <input className="px-3 py-2 border border-gray-200 rounded-lg w-full" placeholder="Password complexity (e.g., upper,number,symbol)" value={cfg.security?.passwordComplexity || ''}
                onChange={(e) => setCfg({ ...cfg, security: { ...cfg.security, passwordComplexity: e.target.value } })} />
              <input className="px-3 py-2 border border-gray-200 rounded-lg w-full" placeholder="Signup domain allowlist (comma-separated)" value={(cfg.security?.domainAllowlist || []).join(',')}
                onChange={(e) => setCfg({ ...cfg, security: { ...cfg.security, domainAllowlist: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) } })} />
            </div>
          </div>
        </div>

        {/* Data & Retention */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Data &amp; Retention</h3>
            <div className="space-x-2">
              <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => window.location.reload()}>Reset</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => save('retention', cfg.retention)}>Save</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="number" className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Audit logs (days)" value={cfg.retention?.auditDays || 0} onChange={(e) => setCfg({ ...cfg, retention: { ...cfg.retention, auditDays: Number(e.target.value) } })} />
            <input type="number" className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Webhooks (days)" value={cfg.retention?.webhookDays || 0} onChange={(e) => setCfg({ ...cfg, retention: { ...cfg.retention, webhookDays: Number(e.target.value) } })} />
            <input type="number" className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Exports (days)" value={cfg.retention?.exportDays || 0} onChange={(e) => setCfg({ ...cfg, retention: { ...cfg.retention, exportDays: Number(e.target.value) } })} />
            <input className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Export/Delete policy" value={cfg.retention?.policy || ''} onChange={(e) => setCfg({ ...cfg, retention: { ...cfg.retention, policy: e.target.value } })} />
          </div>
        </div>

        {/* Rate Limits */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rate Limits</h3>
            <div className="space-x-2">
              <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => window.location.reload()}>Reset</button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={() => save('rate', cfg.rate)}>Save</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Global requests/min" value={cfg.rate?.globalRpm || 0} onChange={(e) => setCfg({ ...cfg, rate: { ...cfg.rate, globalRpm: Number(e.target.value) } })} />
            <input type="number" className="px-3 py-2 border border-gray-200 rounded-lg" placeholder="Per-tenant requests/min" value={cfg.rate?.perTenantRpm || 0} onChange={(e) => setCfg({ ...cfg, rate: { ...cfg.rate, perTenantRpm: Number(e.target.value) } })} />
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Feature Flags</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {flags.map((f) => (
              <label key={f.key} className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-900">{f.key}</span>
                <input type="checkbox" checked={!!f.enabled} onChange={(e) => toggleFlag(f.key, e.target.checked)} />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


