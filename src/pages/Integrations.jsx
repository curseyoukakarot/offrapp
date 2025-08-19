import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { PlanBadge } from '../components/common/PlanBadge.jsx';
import { Money } from '../components/common/Money.jsx';
import { useBilling } from '../lib/useBilling.js';
import { useStripeActions } from '../lib/useStripeActions.js';

function Tooltip({ children, content }) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {content}
      </div>
    </div>
  );
}

function ConfirmButton({ onConfirm, children, confirmText, className = '' }) {
  const [confirming, setConfirming] = useState(false);
  
  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <button 
          className="px-2 py-1 text-xs bg-red-600 text-white rounded"
          onClick={() => { onConfirm(); setConfirming(false); }}
          aria-label={`Confirm ${confirmText}`}
        >
          Confirm
        </button>
        <button 
          className="px-2 py-1 text-xs border rounded"
          onClick={() => setConfirming(false)}
          aria-label="Cancel"
        >
          Cancel
        </button>
      </div>
    );
  }
  
  return (
    <button 
      className={className}
      onClick={() => setConfirming(true)}
      aria-label={confirmText}
    >
      {children}
    </button>
  );
}

function Section({ title, children, helper }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {helper && <div className="text-xs text-gray-500">{helper}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function Integrations() {
  const { userRole, session } = useAuth();
  const { activeTenantId } = useActiveTenant();
  const isAdmin = userRole === 'admin';
  const { plan, tenant, loading, error, refetch } = useBilling();
  const { checkout } = useStripeActions();

  const planHelper = useMemo(() => {
    if (plan === 'pro') return 'Seat price $39/mo. Client limit 500.';
    if (plan === 'advanced') return 'Seat price $29/mo. Unlimited clients.';
    return null;
  }, [plan]);

  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [creatingKey, setCreatingKey] = useState(false);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({ url: '', events: 'all', enabled: true });
  const [showNewKey, setShowNewKey] = useState(null);

  async function loadData() {
    try {
      // Placeholder: call future backend endpoints
      const kRes = await fetch('/api/integrations/api-keys', { headers: { Authorization: `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' } });
      if (kRes.ok) setApiKeys((await kRes.json())?.keys || []);
      const wRes = await fetch('/api/integrations/webhooks', { headers: { Authorization: `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' } });
      if (wRes.ok) setWebhooks((await wRes.json())?.webhooks || []);
    } catch (_e) {
      // silently ignore until backend exists
    }
  }

  useEffect(() => {
    if (activeTenantId && session && plan !== 'starter') loadData();
  }, [activeTenantId, session, plan]);

  async function generateKey() {
    try {
      setCreatingKey(true);
      const res = await fetch('/api/integrations/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' },
      });
      const json = await res.json();
      if (res.ok) {
        setApiKeys([json.key, ...apiKeys]);
        setShowNewKey(json.key);
        setTimeout(() => setShowNewKey(null), 30000); // Hide after 30s
      }
    } finally {
      setCreatingKey(false);
    }
  }

  async function revokeKey(id) {
    await fetch(`/api/integrations/api-keys/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' } });
    setApiKeys(apiKeys.filter(k => k.id !== id));
  }

  async function createWebhook() {
    try {
      setCreatingWebhook(true);
      const res = await fetch('/api/integrations/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' },
        body: JSON.stringify(newWebhook)
      });
      const json = await res.json();
      if (res.ok) setWebhooks([json.webhook, ...webhooks]);
    } finally {
      setCreatingWebhook(false);
    }
  }

  async function testWebhook(id) {
    await fetch(`/api/integrations/webhooks/${id}/test`, { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' } });
  }

  if (!isAdmin) return <div className="p-6 text-gray-600">Admins only.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-xl font-semibold">Integrations</div>
        <PlanBadge plan={plan} />
      </div>

      {plan === 'starter' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start justify-between">
          <div>
            <div className="font-medium text-amber-900">API & Webhooks are available on Pro & Advanced.</div>
            <div className="text-sm text-amber-800 mt-1">Upgrade to unlock powerful integrations and automation features.</div>
          </div>
          <div className="flex gap-2">
            <a 
              href="/dashboard/admin/billing" 
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Upgrade to Pro plan"
            >
              Upgrade to Pro
            </a>
            <a 
              href="/dashboard/admin/billing" 
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label="Upgrade to Advanced plan"
            >
              Advanced
            </a>
          </div>
        </div>
      )}

      <Section title="API Access" helper={planHelper}>
        {plan === 'starter' ? (
          <div className="text-gray-500 text-center py-8">
            <i className="fa-solid fa-lock text-2xl text-gray-300 mb-2"></i>
            <div>Team seats are a Pro/Advanced feature.</div>
            <div className="text-sm mt-1">Upgrade to manage API keys for your integrations.</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Create API keys for your integrations. 
                <Tooltip content="Keys are shown once for security. Store them safely.">
                  <i className="fa-solid fa-info-circle ml-1 text-gray-400 cursor-help"></i>
                </Tooltip>
              </div>
              <button 
                disabled={creatingKey} 
                className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50" 
                onClick={generateKey}
                aria-label="Generate new API key"
              >
                {creatingKey ? 'Generating…' : 'Generate Key'}
              </button>
            </div>
            {showNewKey && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-green-900">New API Key Created</div>
                    <div className="text-sm text-green-800 mt-1">Copy this key now - it won't be shown again.</div>
                    <div className="mt-2 font-mono text-sm bg-white border rounded px-2 py-1 break-all">
                      {showNewKey.key}
                    </div>
                  </div>
                  <button 
                    className="text-green-600 hover:text-green-800"
                    onClick={() => setShowNewKey(null)}
                    aria-label="Dismiss new key notification"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Label</th>
                    <th className="text-left px-4 py-2 font-medium">Created</th>
                    <th className="text-left px-4 py-2 font-medium">Last Used</th>
                    <th className="text-right px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map(k => (
                    <tr key={k.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-800">{k.label || 'API Key'}</td>
                      <td className="px-4 py-2 text-gray-600">{k.created_at ? new Date(k.created_at).toLocaleString() : '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : '—'}</td>
                                             <td className="px-4 py-2 text-right">
                        <ConfirmButton
                          onConfirm={() => revokeKey(k.id)}
                          confirmText="revoke API key"
                          className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                        >
                          Revoke
                        </ConfirmButton>
                      </td>
                    </tr>
                  ))}
                  {apiKeys.length === 0 && (
                    <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>No keys yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      <Section title="Webhooks" helper={planHelper}>
        {plan === 'starter' ? (
          <div className="text-gray-500 text-center py-8">
            <i className="fa-solid fa-webhook text-2xl text-gray-300 mb-2"></i>
            <div>Webhook automation is a Pro/Advanced feature.</div>
            <div className="text-sm mt-1">Upgrade to receive real-time notifications.</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-700">
              Create webhook endpoints to receive real-time notifications.
              <Tooltip content="We'll POST JSON data to your endpoint when events occur.">
                <i className="fa-solid fa-info-circle ml-1 text-gray-400 cursor-help"></i>
              </Tooltip>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input 
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="https://example.com/webhooks" 
                value={newWebhook.url} 
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                aria-label="Webhook URL"
              />
              <select 
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                value={newWebhook.events} 
                onChange={(e) => setNewWebhook({ ...newWebhook, events: e.target.value })}
                aria-label="Event types to listen for"
              >
                <option value="all">All events</option>
                <option value="forms">Form submitted</option>
                <option value="files">File uploaded</option>
              </select>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-700 flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={newWebhook.enabled} 
                    onChange={(e) => setNewWebhook({ ...newWebhook, enabled: e.target.checked })}
                    className="focus:ring-2 focus:ring-blue-500"
                    aria-label="Enable webhook immediately"
                  /> 
                  Enabled
                </label>
                <button 
                  disabled={creatingWebhook || !newWebhook.url} 
                  className="ml-auto px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50" 
                  onClick={createWebhook}
                  aria-label="Create new webhook"
                >
                  {creatingWebhook ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">URL</th>
                    <th className="text-left px-4 py-2 font-medium">Events</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                    <th className="text-right px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map(w => (
                    <tr key={w.id} className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-800 break-all">{w.url}</td>
                      <td className="px-4 py-2 text-gray-600">{w.events || 'all'}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${w.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {w.enabled ? 'enabled' : 'disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right space-x-3">
                        <button 
                          className="text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded" 
                          onClick={() => testWebhook(w.id)}
                          aria-label={`Test webhook ${w.url}`}
                        >
                          Test
                        </button>
                        <ConfirmButton
                          onConfirm={async () => { 
                            await fetch(`/api/integrations/webhooks/${w.id}`, { 
                              method: 'DELETE', 
                              headers: { Authorization: `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' } 
                            }); 
                            setWebhooks(webhooks.filter(x => x.id !== w.id)); 
                          }}
                          confirmText="delete webhook"
                          className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                        >
                          Delete
                        </ConfirmButton>
                      </td>
                    </tr>
                  ))}
                  {webhooks.length === 0 && (
                    <tr><td className="px-4 py-6 text-gray-500" colSpan={4}>No webhooks yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Section>

      <Section title="Documentation">
        <div className="prose max-w-none">
          <h3>Authentication</h3>
          <p>Include your API key in the Authorization header:</p>
          <pre className="bg-gray-50 p-3 rounded text-sm"><code>Authorization: Bearer YOUR_API_KEY</code></pre>
          <h3>Webhook Signature</h3>
          <p>All webhook requests include a signature header for verification:</p>
          <pre className="bg-gray-50 p-3 rounded text-sm"><code>X-Webhook-Signature: sha256=...</code></pre>
          <h3>Examples</h3>
          <p>Fetch your forms:</p>
          <pre className="bg-gray-50 p-3 rounded text-sm"><code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "x-tenant-id: YOUR_TENANT_ID" \\
     https://www.nestbase.io/api/forms`}</code></pre>
        </div>
      </Section>
    </div>
  );
}


