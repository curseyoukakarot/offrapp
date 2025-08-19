import { useEffect, useState } from 'react';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { useAuth } from '../contexts/AuthContext';

export default function AdminIntegrations() {
  const { activeTenantId } = useActiveTenant();
  const { session } = useAuth();
  const [plan, setPlan] = useState('starter');

  useEffect(() => {
    const load = async () => {
      if (!activeTenantId || !session) return;
      const res = await fetch('/api/billing/summary', {
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId }
      });
      const json = await res.json();
      if (json?.tenant?.plan) setPlan(json.tenant.plan);
    };
    load();
  }, [activeTenantId, session]);

  const gated = plan === 'starter';

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold">Integrations</h2>
        {gated ? (
          <div className="mt-3">
            <div className="text-gray-700">Upgrade to Pro or Advanced to enable integrations.</div>
            <a href="/dashboard/admin/billing" className="inline-block mt-3 px-4 py-2 rounded bg-blue-600 text-white">View Billing</a>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <div className="font-medium">Zapier & Webhooks</div>
              <div className="text-sm text-gray-600 mt-1">Manage API keys and outbound webhooks. (Coming soon)</div>
            </div>
            <div className="border rounded p-4">
              <div className="font-medium">Slack</div>
              <div className="text-sm text-gray-600 mt-1">Send notifications to Slack channels. (Existing)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


