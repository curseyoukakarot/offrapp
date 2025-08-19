import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { useAuth } from '../contexts/AuthContext';

export function useStripeActions() {
  const { activeTenantId } = useActiveTenant();
  const { session } = useAuth();

  async function checkout({ purpose, plan, seats } = {}) {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' },
      body: JSON.stringify({ purpose, plan, seats })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Checkout failed');
    return json;
  }

  async function openPortal() {
    const res = await fetch('/api/billing/portal', {
      headers: { 'Authorization': `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Portal failed');
    return json;
  }

  return { checkout, openPortal };
}


