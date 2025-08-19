import { useEffect, useMemo, useState } from 'react';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { useAuth } from '../contexts/AuthContext';

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

function Progress({ value, max, color = 'bg-blue-600' }) {
  const pct = Math.max(0, Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0));
  return (
    <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
      <div className={classNames('h-full transition-all', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);
  if (!toast) return null;
  const base = 'fixed top-4 right-4 rounded-xl shadow-lg px-4 py-3 text-sm flex items-center gap-2';
  const kind = toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white';
  return (
    <div className={classNames(base, kind)}>
      <i className={toast.type === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'} />
      <div>{toast.message}</div>
      <button className="ml-2 opacity-70 hover:opacity-100" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
    </div>
  );
}

export default function Billing() {
  const { activeTenantId } = useActiveTenant();
  const { session, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ tenant: null, usage: null, invoices: [] });
  const [err, setErr] = useState(null);
  const [toast, setToast] = useState(null);
  const [seatsToAdd, setSeatsToAdd] = useState(1);

  const isAdmin = userRole === 'admin';

  const plan = String(summary.tenant?.plan || 'starter').toLowerCase();
  const seatsPurchased = Number(summary.tenant?.seats_purchased || 1);
  const clientsCount = Number(summary.usage?.clients_count || 0);
  const teamCount = Number(summary.usage?.team_count || 1);

  const planLimit = useMemo(() => {
    if (plan === 'starter') return 30;
    if (plan === 'pro') return 500;
    return Infinity;
  }, [plan]);

  const seatPrice = plan === 'advanced' ? 29 : 39; // USD per month

  async function fetchSummary() {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch('/api/billing/summary', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'x-tenant-id': activeTenantId || ''
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load billing');
      setSummary(json);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeTenantId && session) fetchSummary();
  }, [activeTenantId, session]);

  function notify(type, message) {
    setToast({ type, message });
  }

  async function upgrade(planTarget) {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' },
        body: JSON.stringify({ purpose: 'upgrade_plan', plan: planTarget })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Upgrade failed');
      if (json.url) window.location.href = json.url; else notify('error', 'No Stripe URL returned.');
    } catch (e) {
      notify('error', e.message);
    }
  }

  async function addSeats() {
    try {
      const qty = Math.max(1, parseInt(String(seatsToAdd || 1), 10));
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' },
        body: JSON.stringify({ purpose: 'add_seats', seats: qty })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to start seats checkout');
      if (json.url) window.location.href = json.url; else notify('error', 'No Stripe URL returned.');
    } catch (e) {
      notify('error', e.message);
    }
  }

  async function openPortal() {
    try {
      const res = await fetch('/api/billing/portal', {
        headers: { 'Authorization': `Bearer ${session?.access_token}`, 'x-tenant-id': activeTenantId || '' }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to open portal');
      if (json.url) window.location.href = json.url; else notify('error', 'No portal URL returned.');
    } catch (e) {
      notify('error', e.message);
    }
  }

  const loadingSkeleton = (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-100 rounded w-1/3" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
    </div>
  );

  if (!isAdmin) {
    return <div className="p-6 text-gray-600">Admins only.</div>;
  }

  return (
    <div className="p-6">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1 – Plan & Usage */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Current Plan</h2>
            <span className={classNames('text-xs px-2.5 py-1 rounded-full font-semibold',
              plan === 'starter' && 'bg-gray-100 text-gray-700',
              plan === 'pro' && 'bg-blue-100 text-blue-700',
              plan === 'advanced' && 'bg-indigo-100 text-indigo-700'
            )}>
              {plan.toUpperCase()}
            </span>
          </div>
          <div className="mt-5 space-y-5">
            {loading ? loadingSkeleton : (
              <>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      Clients
                      <div className="group relative inline-block">
                        <i className="fa-solid fa-info-circle text-gray-400 cursor-help"></i>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          End users who access your forms and files
                        </div>
                      </div>
                    </div>
                    <div className="font-medium">{clientsCount} / {planLimit === Infinity ? '∞' : planLimit}</div>
                  </div>
                  <div className="mt-2">
                    <Progress value={clientsCount} max={planLimit === Infinity ? clientsCount || 1 : planLimit} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      Team
                      <div className="group relative inline-block">
                        <i className="fa-solid fa-info-circle text-gray-400 cursor-help"></i>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          Team members can invite clients and manage settings
                        </div>
                      </div>
                    </div>
                    {plan === 'starter' ? (
                      <div className="font-medium text-gray-500">Team seats are a Pro/Advanced feature.</div>
                    ) : (
                      <div className="font-medium">{teamCount} / {seatsPurchased}</div>
                    )}
                  </div>
                  <div className="mt-2">
                    <Progress value={plan === 'starter' ? 1 : teamCount} max={plan === 'starter' ? 1 : Math.max(seatsPurchased, 1)} color="bg-indigo-600" />
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Manage your plan and usage. <a href="#pricing" className="underline hover:text-gray-700">Compare plans</a>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card 2 – Seats & Upgrades */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Seats & Upgrades</h2>
          <div className="mt-4 space-y-4">
            {loading ? loadingSkeleton : (
              <>
                {plan === 'starter' && (
                  <div className="space-y-4">
                    <div className="text-gray-700">Upgrade to enable team seats and more capacity.</div>
                    <div className="flex flex-wrap gap-3">
                      <button className="px-4 py-2 rounded-lg bg-blue-600 text-white" onClick={() => upgrade('pro')}>Upgrade to Pro</button>
                      <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white" onClick={() => upgrade('advanced')}>Upgrade to Advanced</button>
                    </div>
                    <div className="opacity-60 cursor-not-allowed" title="Team seats available on Pro & Advanced.">
                      <div className="text-sm">Team seats</div>
                      <div className="mt-2 flex items-center gap-2">
                        <input disabled className="w-24 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50" placeholder="1" />
                        <button disabled className="px-4 py-2 rounded-lg bg-gray-200 text-gray-500">Add Seats</button>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Team seats available on Pro & Advanced.</div>
                    </div>
                  </div>
                )}
                {plan !== 'starter' && (
                  <div className="space-y-5">
                    <div>
                      <div className="text-sm font-medium text-gray-800">Add Team Seats</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ${seatPrice}/mo per seat • Prorated by Stripe
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        You can invite up to {seatsPurchased} team members. Add seats to invite more.
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <input type="number" min={1} value={seatsToAdd}
                          onChange={(e) => setSeatsToAdd(Math.max(1, parseInt(e.target.value || '1', 10)))}
                          className="w-28 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button className="px-4 py-2 rounded-lg bg-blue-600 text-white" onClick={addSeats}>Add Seats</button>
                      </div>
                    </div>

                    {plan === 'pro' && (
                      <div className="pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-700">Need more? Switch to Advanced for unlimited clients and lower seat price.</div>
                        <button className="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white" onClick={() => upgrade('advanced')}>Switch to Advanced</button>
                      </div>
                    )}
                    {plan === 'advanced' && (
                      <div className="pt-4 border-t border-gray-100 text-sm text-gray-700">
                        Advanced includes unlimited clients and $29/seat pricing. Save more with annual billing.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Card 3 – Billing History & Payment */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Billing History & Payment</h2>
            <button className="px-3 py-2 rounded-lg bg-gray-900 text-white" onClick={openPortal}>
              <i className="fa-solid fa-arrow-up-right-from-square mr-2" /> Manage in Stripe
            </button>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Date</th>
                      <th className="text-left px-4 py-2 font-medium">Amount</th>
                      <th className="text-left px-4 py-2 font-medium">Status</th>
                      <th className="text-right px-4 py-2 font-medium">Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary.invoices || []).slice(0, 10).map((inv) => (
                      <tr key={inv.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-800">{new Date(inv.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2 text-gray-800">{(inv.amount_cents / 100).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</td>
                        <td className="px-4 py-2">
                          <span className={classNames('text-xs px-2 py-1 rounded-full',
                            inv.status === 'paid' && 'bg-green-100 text-green-700',
                            inv.status !== 'paid' && 'bg-gray-100 text-gray-700')}>{inv.status}</span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {inv.hosted_invoice_url ? (
                            <a href={inv.hosted_invoice_url} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">View</a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!summary.invoices || summary.invoices.length === 0) && (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={4}>No invoices yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


