import { useCallback, useEffect, useState } from 'react';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { useAuth } from '../contexts/AuthContext';

export function useBilling() {
  const { activeTenantId } = useActiveTenant();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [usage, setUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);

  // TEMPORARY FIX: Hardcode advanced plan for IgniteGTM tenant until API server is fixed
  const plan = activeTenantId === '7b7af77b-17c3-4522-9d9a-11581e3f9568' ? 'advanced' : String(tenant?.tier || tenant?.plan || 'starter').toLowerCase();

  const fetchSummary = useCallback(async () => {
    if (!activeTenantId || !session) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/billing/summary', {
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load');
      setTenant(json.tenant);
      setUsage(json.usage);
      setInvoices(json.invoices || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeTenantId, session]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  return { loading, error, tenant, usage, invoices, plan, refetch: fetchSummary };
}


