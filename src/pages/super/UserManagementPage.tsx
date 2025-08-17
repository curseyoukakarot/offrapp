import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabaseClient.js';

type Tenant = {
  id: string;
  name: string;
  slug: string;
  tier: 'starter' | 'pro' | 'advanced';
  seats_total: number;
  seats_used: number;
  status: 'active' | 'suspended' | 'trial';
};

type TenantUser = {
  id: string;
  email: string;
  name: string | null;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'pending';
  last_login_at: string | null;
};

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(' ');
}

function TierBadge({ tier }: { tier: Tenant['tier'] }) {
  const map = {
    starter: 'bg-blue-100 text-blue-800',
    pro: 'bg-purple-100 text-purple-800',
    advanced: 'bg-pink-100 text-pink-800',
  } as const;
  const label = tier === 'starter' ? 'Starter' : tier === 'pro' ? 'Pro' : 'Advanced';
  return <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', map[tier])}>{label}</span>;
}

function StatusPill({ status }: { status: Tenant['status'] }) {
  const map = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    trial: 'bg-yellow-100 text-yellow-800',
  } as const;
  const label = status[0].toUpperCase() + status.slice(1);
  return <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', map[status])}>{label}</span>;
}

export default function UserManagementPage() {
  const API_BASE = (import.meta as any).env && (import.meta as any).env.DEV ? 'http://localhost:3001' : '';
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [tenantsLoading, setTenantsLoading] = useState(false);
  const [tenantsError, setTenantsError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);
  const [users, setUsers] = useState<TenantUser[] | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState<'existing' | 'new'>('existing');
  const [tenantDrawerOpen, setTenantDrawerOpen] = useState(false);
  const [userDrawerUser, setUserDrawerUser] = useState<TenantUser | null>(null);

  useEffect(() => {
    async function loadTenants() {
      setTenantsLoading(true);
      setTenantsError(null);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (tierFilter) params.set('tier', tierFilter);
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`${API_BASE}/api/super/tenants?${params.toString()}`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error(`Failed to load tenants (${res.status})`);
        const json = await res.json();
        setTenants(json.items || []);
      } catch (e: any) {
        setTenantsError(e.message || 'Error loading tenants');
      } finally {
        setTenantsLoading(false);
      }
    }
    loadTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tierFilter, statusFilter]);

  async function drillIntoTenant(tenant: Tenant) {
    setActiveTenant(tenant);
    setUsers(null);
    setUsersLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`${API_BASE}/api/super/tenants/${tenant.id}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error('Failed to load users');
      const json = await res.json();
      setUsers(json.items || []);
    } catch (e) {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }

  function openInviteModal(presetExistingTenant?: boolean) {
    if (presetExistingTenant) setInviteMode('existing');
    setInviteOpen(true);
  }

  function openNewTenantModal() {
    setInviteMode('new');
    setInviteOpen(true);
  }

  const filteredTenants = useMemo(() => tenants || [], [tenants]);

  return (
    <div className="bg-gray-50">
      <header id="header" className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
            </div>
            {activeTenant && (
              <nav id="breadcrumb">
                <ol className="flex items-center space-x-2 text-sm text-gray-500">
                  <li>
                    <button onClick={() => setActiveTenant(null)} className="hover:text-gray-700">Tenants</button>
                  </li>
                  <li><i className="fas fa-chevron-right text-xs" /></li>
                  <li id="tenant-name" className="text-gray-900 font-medium">{activeTenant.name}</li>
                </ol>
              </nav>
            )}
          </div>
        </div>
      </header>

      <main id="main-content" className="px-6 py-6">
        {!activeTenant && (
          <div id="tenants-view">
            <div id="tenants-toolbar" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search tenants..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <i className="fas fa-search absolute left-3 top-3 text-gray-400" />
                  </div>
                  <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">All Tiers</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
                <div className="flex items-center space-x-3">
                  <button onClick={() => openInviteModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <i className="fas fa-user-plus mr-2" />Invite User
                  </button>
                  <button onClick={openNewTenantModal} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <i className="fas fa-plus mr-2" />New Tenant
                  </button>
                </div>
              </div>
            </div>

            <div id="tenants-table" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seats</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tenantsLoading && (
                    <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan={5}>Loading...</td></tr>
                  )}
                  {tenantsError && !tenantsLoading && (
                    <tr><td className="px-6 py-4 text-sm text-red-600" colSpan={5}>{tenantsError}</td></tr>
                  )}
                  {!tenantsLoading && filteredTenants.length === 0 && (
                    <tr><td className="px-6 py-6 text-center text-sm text-gray-500" colSpan={5}>No tenants found.</td></tr>
                  )}
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => drillIntoTenant(t)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <i className="fas fa-folder text-blue-500 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{t.name}</div>
                            <div className="text-sm text-gray-500">{t.slug}.example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <TierBadge tier={t.tier} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{t.seats_used}/{t.seats_total}</td>
                      <td className="px-6 py-4">
                        <StatusPill status={t.status} />
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveTenant(t); setTenantDrawerOpen(true); }}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label="Tenant actions"
                        >
                          <i className="fas fa-ellipsis-h" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTenant && (
          <div id="users-view">
            <div id="tenant-header" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <h2 id="tenant-title" className="text-xl font-semibold text-gray-900">{activeTenant.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <TierBadge tier={activeTenant.tier} />
                      <StatusPill status={activeTenant.status} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div id="users-toolbar" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input type="text" placeholder="Search users..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                    <i className="fas fa-search absolute left-3 top-3 text-gray-400" />
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>All Roles</option>
                    <option>Owner</option>
                    <option>Admin</option>
                    <option>Member</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Pending</option>
                  </select>
                </div>
                <button onClick={() => openInviteModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <i className="fas fa-user-plus mr-2" />Invite User
                </button>
              </div>
            </div>

            <div id="users-table" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersLoading && <tr><td className="px-6 py-4 text-sm text-gray-500" colSpan={6}>Loading...</td></tr>}
                  {!usersLoading && (users || []).length === 0 && (
                    <tr><td className="px-6 py-6 text-center text-sm text-gray-500" colSpan={6}>No users yet.</td></tr>
                  )}
                  {(users || []).map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full mr-3 bg-gray-200" />
                          <div className="text-sm font-medium text-gray-900">{u.name || u.email.split('@')[0]}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          u.role === 'owner' ? 'bg-red-100 text-red-800' : u.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                        )}>{u.role[0].toUpperCase() + u.role.slice(1)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={classNames('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        )}>{u.status === 'active' ? 'Active' : 'Pending'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '—'}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => setUserDrawerUser(u)} className="text-gray-400 hover:text-gray-600" aria-label="User actions">
                          <i className="fas fa-ellipsis-h" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {inviteOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onKeyDown={(e) => { if (e.key === 'Escape') setInviteOpen(false); }}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" role="document">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Invite User</h3>
                <button onClick={() => setInviteOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close invite dialog">
                  <i className="fas fa-times" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <button onClick={() => setInviteMode('existing')} className={classNames('flex-1 px-3 py-2 text-sm rounded-lg', inviteMode === 'existing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>Existing Tenant</button>
                  <button onClick={() => setInviteMode('new')} className={classNames('flex-1 px-3 py-2 text-sm rounded-lg', inviteMode === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>New Tenant</button>
                </div>
                {inviteMode === 'existing' ? (
                  <ExistingInviteForm defaultTenantId={activeTenant?.id} onDone={() => { setInviteOpen(false); }} />
                ) : (
                  <NewTenantInviteForm onDone={() => { setInviteOpen(false); }} />
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setInviteOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Drawer */}
      {tenantDrawerOpen && activeTenant && (
        <aside className={classNames('fixed inset-y-0 right-0 w-96 bg-white shadow-xl slide-over z-40 open')} role="dialog" aria-modal="true">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Tenant Details</h3>
              <button onClick={() => setTenantDrawerOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close tenant drawer">
                <i className="fas fa-times" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Overview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Name:</span><span className="text-gray-900">{activeTenant.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Slug:</span><span className="text-gray-900">{activeTenant.slug}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tier:</span><span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">{activeTenant.tier === 'pro' ? 'Pro' : activeTenant.tier === 'starter' ? 'Starter' : 'Advanced'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Seats:</span><span className="text-gray-900">{activeTenant.seats_used}/{activeTenant.seats_total}</span></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setTenantDrawerOpen(false); if (activeTenant) drillIntoTenant(activeTenant); }} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Manage Users</button>
                <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Settings</button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* User Drawer */}
      {userDrawerUser && (
        <aside className={classNames('fixed inset-y-0 right-0 w-96 bg-white shadow-xl slide-over z-40 open')} role="dialog" aria-modal="true">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
              <button onClick={() => setUserDrawerUser(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close user drawer">
                <i className="fas fa-times" />
              </button>
            </div>
          </div>
          <div className="p-6 text-sm">
            <div className="mb-4"><span className="text-gray-500">Email:</span> <span className="text-gray-900">{userDrawerUser.email}</span></div>
            <div className="mb-4"><span className="text-gray-500">Role:</span> <span className="text-gray-900">{userDrawerUser.role}</span></div>
            <div className="mb-4"><span className="text-gray-500">Status:</span> <span className="text-gray-900">{userDrawerUser.status}</span></div>
            <div className="mb-4"><span className="text-gray-500">Last Active:</span> <span className="text-gray-900">{userDrawerUser.last_login_at ? new Date(userDrawerUser.last_login_at).toLocaleString() : '—'}</span></div>
          </div>
        </aside>
      )}
    </div>
  );
}

function ExistingInviteForm({ defaultTenantId, onDone }: { defaultTenantId?: string; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'owner' | 'admin' | 'member' | ''>('');
  const [tenantId, setTenantId] = useState<string>(defaultTenantId || '');
  const [submitting, setSubmitting] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/super/tenants');
      const json = await res.json();
      setTenants(json.items || []);
    })();
  }, []);

  async function submit() {
    if (!email || !role || !tenantId) return;
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`${API_BASE}/api/super/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email, role, tenant_id: tenantId }),
      });
      if (!res.ok) throw new Error('Failed');
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3" />
      <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3">
        <option value="">Select Role</option>
        <option value="owner">Owner</option>
        <option value="admin">Admin</option>
        <option value="member">Member</option>
      </select>
      <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
        <option value="">Select Tenant</option>
        {tenants.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
      </select>
      <div className="flex justify-end space-x-3 mt-6">
        <button onClick={submit} disabled={submitting || !email || !role || !tenantId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Sending…' : 'Send Invite'}</button>
      </div>
    </div>
  );
}

function NewTenantInviteForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tier, setTier] = useState<'starter' | 'pro' | 'advanced' | ''>('');
  const [seats, setSeats] = useState<number>(3);
  const [email, setEmail] = useState('');
  const [bypass, setBypass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const auto = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setSlug(auto);
  }, [name]);

  async function submit() {
    if (!name || !tier || !email) return;
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch(`${API_BASE}/api/super/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ tenant: { name, slug, tier, seats_total: seats }, admin: { email }, bypass_billing: bypass }),
      });
      if (!res.ok) throw new Error('Failed');
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <input type="text" placeholder="Tenant Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
      <input type="text" placeholder="Slug (auto-generated)" value={slug} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50" />
      <select value={tier} onChange={(e) => setTier(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
        <option value="">Select Tier</option>
        <option value="starter">Starter</option>
        <option value="pro">Pro</option>
        <option value="advanced">Advanced</option>
      </select>
      <input type="number" placeholder="Seats" value={seats} onChange={(e) => setSeats(parseInt(e.target.value || '0', 10))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
      <input type="email" placeholder="First Admin Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
      <label className="flex items-center"><input type="checkbox" checked={bypass} onChange={(e) => setBypass(e.target.checked)} className="mr-2" /><span className="text-sm text-gray-700">Bypass Billing</span></label>
      <div className="flex justify-end space-x-3 mt-6">
        <button onClick={submit} disabled={submitting || !name || !tier || !email} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Creating…' : 'Create & Invite'}</button>
      </div>
    </div>
  );
}


