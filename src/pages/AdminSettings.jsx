import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useActiveTenant } from '../contexts/ActiveTenantContext';

export default function AdminSettings() {
  const { activeTenantId, loading: tenantLoading } = useActiveTenant();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // {type,message}

  const [brand, setBrand] = useState({ name: '', support_email: '', logo_url: '', favicon_url: '' });
  const [roles, setRoles] = useState({
    admin: { label: 'Admin', color: 'blue' },
    role1: { label: 'Team Member', color: 'purple' },
    role2: { label: 'Client', color: 'green' },
    role3: { label: 'Guest', color: 'gray' },
  });
  const [savingBrand, setSavingBrand] = useState(false);

  // Domains state
  const [domains, setDomains] = useState([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdTxt, setCreatedTxt] = useState(null); // { domain, type, txtRecord }
  const [verifying, setVerifying] = useState(''); // domain string
  const [removing, setRemoving] = useState('');
  const [customDomainEnabled, setCustomDomainEnabled] = useState(true);

  useEffect(() => {
    if (tenantLoading || !activeTenantId) return; // Wait for tenant context
    
    const load = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        // Profile
        const { data: profile } = await supabase.from('profiles').select('first_name,last_name,phone,linkedin').eq('id', uid).maybeSingle();
        setFirstName(profile?.first_name || '');
        setLastName(profile?.last_name || '');
        setPhone(profile?.phone || '');
        setLinkedin(profile?.linkedin || '');
        setEmail(session?.user?.email || '');
        // Tenant branding + features
        const tenantId = activeTenantId;
        const res = await fetch('/api/tenant-config', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } });
        const json = await res.json();
        setBrand({
          name: json?.name || '',
          support_email: json?.support_email || '',
          logo_url: json?.logo_url || '',
          favicon_url: json?.favicon_url || ''
        });
        // Load tenant-specific custom roles
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const rolesRes = await fetch('/api/tenant-roles', { 
            headers: { 
              Authorization: `Bearer ${session?.access_token || ''}`,
              ...(tenantId ? { 'x-tenant-id': tenantId } : {}) 
            } 
          });
          if (rolesRes.ok) {
            const rolesJson = await rolesRes.json();
            const rolesData = {};
            (rolesJson.roles || []).forEach(role => {
              rolesData[role.role_key] = { 
                label: role.role_label, 
                color: role.role_color 
              };
            });
            if (Object.keys(rolesData).length > 0) {
              setRoles(rolesData);
            }
          }
        } catch (rolesError) {
          console.warn('Failed to load custom roles:', rolesError);
        }
        const enabled = json?.features?.custom_domain !== false;
        setCustomDomainEnabled(!!enabled);
        await fetchDomains();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTenantId, tenantLoading]);

  const fetchDomains = async () => {
    try {
      setLoadingDomains(true);
      const tenantId = activeTenantId;
      if (!tenantId) {
        setDomains([]);
        setToast({ type: 'error', message: 'No active tenant selected. Please switch a workspace first.' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/domains`, { headers: { Authorization: `Bearer ${session?.access_token || ''}`, 'x-tenant-id': tenantId } });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      if (!res.ok) {
        const msg = isJson ? (await res.json())?.error || 'Failed to load domains' : 'Failed to load domains';
        setToast({ type: 'error', message: msg });
        setTimeout(() => setToast(null), 2500);
        setDomains([]);
        return;
      }
      const json = isJson ? await res.json() : { domains: [] };
      setDomains(json?.domains || []);
    } catch (_e) {
      setDomains([]);
    } finally {
      setLoadingDomains(false);
    }
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setToast({ type: 'success', message: 'Copied!' }); setTimeout(() => setToast(null), 1200); } catch (_e) {}
  };

  const addDomain = async (e) => {
    e.preventDefault();
    if (!newDomain) return;
    try {
      setCreating(true);
      const tenantId = activeTenantId;
      if (!tenantId) {
        setToast({ type: 'error', message: 'No active tenant selected. Please switch a workspace first.' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/domains`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token || ''}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain })
      });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const json = isJson ? await res.json() : null;
      if (!res.ok) throw new Error(json?.error || 'Failed');
      setCreatedTxt(json);
      setNewDomain('');
      await fetchDomains();
    } catch (e2) {
      setToast({ type: 'error', message: e2.message || 'Add failed' });
      setTimeout(() => setToast(null), 2500);
    } finally {
      setCreating(false);
    }
  };

  const verifyDomain = async (domain) => {
    try {
      setVerifying(domain);
      const tenantId = activeTenantId;
      if (!tenantId) {
        setToast({ type: 'error', message: 'No active tenant selected. Please switch a workspace first.' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/domains-verify`, {
        method: 'POST', headers: { Authorization: `Bearer ${session?.access_token || ''}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' }, body: JSON.stringify({ domain })
      });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const json = isJson ? await res.json() : null;
      if (!res.ok) throw new Error(json?.reason || json?.error || 'Verify failed');
      await fetchDomains();
      setToast({ type: 'success', message: 'Domain verified' });
      setTimeout(() => setToast(null), 2000);
    } catch (e2) {
      setToast({ type: 'error', message: e2.message || 'Verification failed' });
      setTimeout(() => setToast(null), 2500);
    } finally { setVerifying(''); }
  };

  const removeDomain = async (domain) => {
    if (!window.confirm(`Remove ${domain}?`)) return;
    try {
      setRemoving(domain);
      const tenantId = activeTenantId;
      if (!tenantId) {
        setToast({ type: 'error', message: 'No active tenant selected. Please switch a workspace first.' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/domains?domain=${encodeURIComponent(domain)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token || ''}`, 'x-tenant-id': tenantId } });
      if (!res.ok && res.status !== 204) {
        let msg = 'Remove failed';
        try { msg = (await res.json())?.error || msg; } catch(_e) {}
        throw new Error(msg);
      }
      await fetchDomains();
    } catch (e2) {
      setToast({ type: 'error', message: e2.message || 'Remove failed' });
      setTimeout(() => setToast(null), 2500);
    } finally { setRemoving(''); }
  };

  const saveContact = async (e) => {
    e.preventDefault();
    try {
      setToast(null);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      await supabase.from('profiles').upsert({ id: uid, first_name: firstName, last_name: lastName, phone, linkedin });
      if (email && email !== session?.user?.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
      }
      setToast({ type: 'success', message: 'Profile saved' });
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setToast({ type: 'error', message: e.message || 'Save failed' });
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const currentPassword = form.get('current');
    const newPassword = form.get('new');
    const confirmPassword = form.get('confirm');
    if (!newPassword || newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords must match' });
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const emailAddr = session?.user?.email;
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: emailAddr, password: currentPassword });
      if (signInError) throw new Error('Current password is incorrect');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setToast({ type: 'success', message: 'Password updated' });
      setTimeout(() => setToast(null), 2000);
      e.currentTarget.reset();
    } catch (e2) {
      setToast({ type: 'error', message: e2.message || 'Update failed' });
    }
  };

  const saveBrand = async () => {
    try {
      setSavingBrand(true);
      const tenantId = activeTenantId;
      const { data: { session } } = await supabase.auth.getSession();
      
      // Save brand settings
      await fetch('/api/tenant-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}`, ...(tenantId ? { 'x-tenant-id': tenantId } : {}) },
        body: JSON.stringify({
          name: brand.name,
          support_email: brand.support_email,
          logo_url: brand.logo_url,
          favicon_url: brand.favicon_url,
        })
      });
      
      // Save custom roles
      await fetch('/api/tenant-roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}`, ...(tenantId ? { 'x-tenant-id': tenantId } : {}) },
        body: JSON.stringify({
          roles: Object.entries(roles).map(([key, value]) => ({
            role_key: key,
            role_label: value.label,
            role_color: value.color
          }))
        })
      });
      
      setToast({ type: 'success', message: 'Settings saved' });
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setToast({ type: 'error', message: e.message || 'Save failed' });
    } finally {
      setSavingBrand(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`${'text-sm px-3 py-2 rounded'} ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{toast.message}</div>
      )}

      {/* Brand & Legal */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Brand &amp; Legal</h2>
          <div className="space-x-2">
            <button className="px-3 py-1.5 text-sm rounded bg-gray-100" onClick={() => setBrand({ name: '', support_email: '', logo_url: '', favicon_url: '' })}>Reset</button>
            <button className={`${'px-3 py-1.5 text-sm rounded text-white'} ${savingBrand ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} onClick={saveBrand} disabled={savingBrand}>Save</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border rounded px-3 py-2" placeholder="App name" value={brand.name} onChange={(e) => setBrand((b) => ({ ...b, name: e.target.value }))} />
          <input className="border rounded px-3 py-2" placeholder="Support email" value={brand.support_email} onChange={(e) => setBrand((b) => ({ ...b, support_email: e.target.value }))} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Logo URL" value={brand.logo_url} onChange={(e) => setBrand((b) => ({ ...b, logo_url: e.target.value }))} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Favicon URL" value={brand.favicon_url} onChange={(e) => setBrand((b) => ({ ...b, favicon_url: e.target.value }))} />
        </div>
      </section>

      {/* Domain Settings */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Domains</h2>
        </div>
        {!customDomainEnabled ? (
          <div className="p-4 border rounded-lg bg-yellow-50 text-yellow-800 mb-4 text-sm">
            Custom domains are not included in your current plan. <a href="#/billing" className="underline">Upgrade</a> to enable.
          </div>
        ) : null}
        {customDomainEnabled && (
          <form onSubmit={addDomain} className="flex items-center gap-3 mb-4">
            <input className="border rounded px-3 py-2 flex-1" placeholder="client.com or app.client.com" value={newDomain} onChange={(e) => setNewDomain(e.target.value)} />
            <button disabled={creating || !newDomain} className={`${'px-4 py-2 rounded text-white'} ${creating ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>{creating ? 'Adding…' : 'Add domain'}</button>
          </form>
        )}
        {createdTxt && customDomainEnabled && (
          <div className="border rounded-lg p-4 bg-gray-50 mb-4">
            <div className="text-sm text-gray-700 mb-2">Add this DNS TXT record to verify ownership:</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center justify-between border rounded px-3 py-2 bg-white">
                <div><div className="text-gray-500">Host/Name</div><div className="font-mono text-gray-900">{createdTxt.txtRecord?.name}</div></div>
                <button type="button" className="text-blue-600" onClick={() => copy(createdTxt.txtRecord?.name)}>Copy</button>
              </div>
              <div className="flex items-center justify-between border rounded px-3 py-2 bg-white">
                <div><div className="text-gray-500">Type</div><div className="font-mono text-gray-900">TXT</div></div>
              </div>
              <div className="flex items-center justify-between border rounded px-3 py-2 bg-white md:col-span-1">
                <div><div className="text-gray-500">Value</div><div className="font-mono text-gray-900 truncate max-w-[280px]" title={createdTxt.txtRecord?.value}>{createdTxt.txtRecord?.value}</div></div>
                <button type="button" className="text-blue-600" onClick={() => copy(createdTxt.txtRecord?.value)}>Copy</button>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">DNS changes can take a few minutes to propagate.</div>
            <div className="mt-3">
              <button type="button" className="px-3 py-1.5 rounded bg-green-600 text-white" onClick={() => verifyDomain(createdTxt.domain)} disabled={!!verifying}>
                {verifying ? 'Provisioning SSL (step 2/2)…' : 'Verify Now'}
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              Point this TXT record at your DNS provider, wait a few minutes, then click Verify. After verification, SSL may take up to a minute.
            </div>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">Domain</th>
                <th className="text-left px-4 py-2">Type</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Verified At</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingDomains && (
                <tr><td className="px-4 py-3" colSpan={5}>Loading…</td></tr>
              )}
              {!loadingDomains && domains.length === 0 && (
                <tr><td className="px-4 py-3 text-gray-500" colSpan={5}>No domains yet.</td></tr>
              )}
              {domains.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-2">{d.domain}</td>
                  <td className="px-4 py-2 uppercase">{d.type}</td>
                  <td className="px-4 py-2">
                    {d.ssl_status === 'ready' ? (
                      <span className="inline-flex items-center gap-1 text-green-700"><span className="w-2 h-2 rounded-full bg-green-500"></span> SSL active</span>
                    ) : d.ssl_status === 'failed' ? (
                      <span className="inline-flex items-center gap-1 text-red-700"><span className="w-2 h-2 rounded-full bg-red-500"></span> Failed</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-yellow-700"><span className="w-2 h-2 rounded-full bg-yellow-400"></span> Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{d.verified_at ? new Date(d.verified_at).toLocaleString() : '—'}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    {customDomainEnabled ? (
                      <>
                        <button className={`px-2 py-1 rounded ${verifying === d.domain ? 'bg-gray-200' : 'bg-gray-100 hover:bg-gray-200'}`} onClick={() => verifyDomain(d.domain)} disabled={!!verifying}>Verify</button>
                        <a className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" href={`https://${d.domain}`} target="_blank" rel="noreferrer">Open</a>
                        <button className={`px-2 py-1 rounded ${removing === d.domain ? 'bg-red-200' : 'bg-red-100 hover:bg-red-200'}`} onClick={() => removeDomain(d.domain)} disabled={!!removing}>Remove</button>
                      </>
                    ) : (
                      <a className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200" href={`https://${d.domain}`} target="_blank" rel="noreferrer">Open</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
        <form onSubmit={saveContact} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>
          <input className="border rounded px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Save Profile</button>
        </form>
      </section>

      {/* Role Types & Banner Colors */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Role Types &amp; Banner Colors</h2>
          <div className="space-x-2">
            <button 
              className="px-3 py-1.5 text-sm rounded bg-gray-100" 
              onClick={() => setRoles({
                admin: { label: 'Admin', color: 'blue' },
                role1: { label: 'Team Member', color: 'purple' },
                role2: { label: 'Client', color: 'green' },
                role3: { label: 'Guest', color: 'gray' },
              })}
            >
              Reset
            </button>
            <button 
              className={`px-3 py-1.5 text-sm rounded text-white ${savingBrand ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} 
              onClick={saveBrand} 
              disabled={savingBrand}
            >
              {savingBrand ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(roles).map((key, idx) => (
            <div key={key} className="border rounded p-4 space-y-2">
              <div className="text-sm text-gray-500 uppercase">{key === 'admin' ? 'ADMIN' : idx === 1 ? 'ROLE TYPE 2' : idx === 2 ? 'ROLE TYPE 3' : 'ROLE TYPE 4'}</div>
              <input className="border rounded px-3 py-2 w-full" value={roles[key].label} onChange={(e) => setRoles((r) => ({ ...r, [key]: { ...r[key], label: e.target.value } }))} />
              <select className="border rounded px-3 py-2 w-full" value={roles[key].color} onChange={(e) => setRoles((r) => ({ ...r, [key]: { ...r[key], color: e.target.value } }))}>
                <option value="blue">Blue</option>
                <option value="purple">Purple</option>
                <option value="green">Green</option>
                <option value="gray">Gray</option>
                <option value="orange">Orange</option>
                <option value="red">Red</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <input className="border rounded px-3 py-2" name="current" type="password" placeholder="Current password" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" name="new" type="password" placeholder="New password" />
            <input className="border rounded px-3 py-2" name="confirm" type="password" placeholder="Confirm new password" />
          </div>
          <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Update Password</button>
        </form>
      </section>
    </div>
  );
}


