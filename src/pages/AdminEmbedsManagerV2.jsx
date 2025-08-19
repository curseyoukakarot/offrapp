import React, { useEffect, useState } from 'react';
import { useTenantConfig } from '../lib/tenantConfig';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { tenantFetch } from '../lib/tenantFetch';

export default function AdminEmbedsManagerV2() {
  const { scope, activeTenantId, loading: tenantLoading } = useActiveTenant();
  const [audience, setAudience] = useState('user-type');
  const [embeds, setEmbeds] = useState([]);
  const [loadingEmbeds, setLoadingEmbeds] = useState(true);
  const { roleLabel } = useTenantConfig();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
  const [tenantRoles, setTenantRoles] = useState([]); // Dynamic tenant roles

  useEffect(() => {
    if (tenantLoading || !activeTenantId) return; // Wait for tenant context
    
    const loadEmbeds = async () => {
      try {
        setLoadingEmbeds(true);
        const res = await tenantFetch('/api/embeds', {}, activeTenantId, scope);
        const json = await res.json();
        setEmbeds(Array.isArray(json.embeds) ? json.embeds : []);
      } catch {
        setEmbeds([]);
      } finally {
        setLoadingEmbeds(false);
      }
    };
    
    const loadTenantRoles = async () => {
      try {
        const res = await tenantFetch('/api/tenant-roles', {}, activeTenantId, scope);
        const data = await res.json();
        if (res.ok) {
          setTenantRoles(data.roles || []);
        }
      } catch (error) {
        console.error('Error loading tenant roles:', error);
      }
    };
    
    loadEmbeds();
    loadTenantRoles();
  }, [activeTenantId, scope, tenantLoading]);

  const updateEmbed = async (id, patch) => {
    await tenantFetch(`/api/embeds?id=${id}`, { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(patch) 
    }, activeTenantId, scope);
    
    const res = await tenantFetch('/api/embeds', {}, activeTenantId, scope);
    const json = await res.json();
    setEmbeds(Array.isArray(json.embeds) ? json.embeds : []);
  };

  const deleteEmbed = async (id) => {
    await tenantFetch(`/api/embeds?id=${id}`, { method: 'DELETE' }, activeTenantId, scope);
    setEmbeds((prev) => prev.filter((e) => e.id !== id));
  };

  useEffect(() => {
    if (tenantLoading || !activeTenantId) return; // Wait for tenant context
    
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const res = await tenantFetch('/api/files/tenant-users', {}, activeTenantId, scope);
        const json = await res.json();
        setUsers(Array.isArray(json.users) ? json.users : []);
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, [activeTenantId, scope, tenantLoading]);

  const Chip = ({ children }) => {
    const [active, setActive] = useState(false);
    return (
      <span
        onClick={() => setActive(!active)}
        className={`cursor-pointer hover:bg-blue-200 transition-colors ${
          active ? 'ring-2 ring-primary' : ''
        }`}
      >
        {children}
      </span>
    );
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <header id="header" className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <i className="fa-solid fa-cube text-primary text-xl"></i>
              <h1 className="text-xl font-semibold text-gray-900">Admin Embed Manager</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <i className="fa-solid fa-bell text-lg"></i>
              </button>
              <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" className="w-8 h-8 rounded-full" alt="Admin" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Embed Creation Form */}
          <div id="embed-form-section" className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Create New Embed</h2>

              {/* Step 1: Embed Details */}
              <div id="step-1" className="space-y-4 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                  <span className="font-medium text-gray-900">Embed Details</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input type="text" placeholder="e.g., Project Tracker" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={provider} onChange={(e) => setProvider(e.target.value)}>
                    <option value="">Select Provider</option>
                    <option value="notion">Notion</option>
                    <option value="calendly">Calendly</option>
                    <option value="monday">Monday.com</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Embed URL</label>
                  <input type="url" placeholder="https://..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" value={url} onChange={(e) => setUrl(e.target.value)} />
                </div>

                {/* Live Preview */}
                <div id="live-preview" className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-2">Live Preview</p>
                  {url ? (
                    <iframe title="embed-preview" src={url} className="bg-white border border-gray-200 rounded w-full h-64" allow="clipboard-write; fullscreen;" />
                  ) : (
                    <div className="bg-white border border-gray-200 rounded h-32 flex items-center justify-center">
                      <span className="text-gray-400">Enter URL to see preview</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Target Audience */}
              <div id="step-2" className="space-y-4 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                  <span className="font-medium text-gray-900">Target Audience</span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" name="audience" value="user-type" className="text-blue-600" checked={audience === 'user-type'} onChange={() => setAudience('user-type')} />
                    <span>Assign by User Type</span>
                  </label>

                  <div id="user-type-chips" className="flex flex-wrap gap-2 ml-6" style={{ display: audience === 'user-type' ? 'flex' : 'none' }}>
                    {tenantRoles.map(role => {
                      const colorClasses = {
                        blue: 'bg-blue-100 text-blue-800',
                        purple: 'bg-purple-100 text-purple-800',
                        green: 'bg-green-100 text-green-800',
                        gray: 'bg-gray-100 text-gray-800',
                        orange: 'bg-orange-100 text-orange-800',
                        red: 'bg-red-100 text-red-800'
                      };
                      const colorClass = colorClasses[role.role_color] || 'bg-gray-100 text-gray-800';
                      
                      return (
                        <Chip key={role.role_key}>
                          <span className={`${colorClass} px-3 py-1 rounded-full text-sm`}>
                            {role.role_label}
                          </span>
                        </Chip>
                      );
                    })}
                  </div>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" name="audience" value="individual" className="text-blue-600" checked={audience === 'individual'} onChange={() => setAudience('individual')} />
                    <span>Assign to Individual Users</span>
                  </label>

                  <div id="user-search" className="ml-6" style={{ display: audience === 'individual' ? 'block' : 'none' }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select user</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                      <option value="">Choose a user…</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
                    </select>
                    {loadingUsers && <div className="text-xs text-gray-500 mt-1">Loading users…</div>}
                    {!loadingUsers && users.length === 0 && <div className="text-xs text-gray-500 mt-1">No users found for this tenant.</div>}
                  </div>
                </div>
              </div>

              {/* Step 3: Settings */}
              <div id="step-3" className="space-y-4 mb-6">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                  <span className="font-medium text-gray-900">Settings</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea placeholder="Add context or notes..." rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                </div>
              </div>

              {/* Step 4: Actions */}
              <div id="step-4">
                {toast && (
                  <div className={`mb-3 text-sm px-3 py-2 rounded ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{toast.message}</div>
                )}
                <button
                  className={`w-full text-white py-3 px-6 rounded-lg font-medium transition-colors ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  onClick={async () => {
                    if (!title || !provider || !url) {
                      setToast({ type: 'error', message: 'Please fill Title, Provider and URL' });
                      setTimeout(() => setToast(null), 2500);
                      return;
                    }
                    if (audience === 'individual' && !selectedUser) {
                      setToast({ type: 'error', message: 'Please choose a user' });
                      setTimeout(() => setToast(null), 2500);
                      return;
                    }
                    try {
                      setSaving(true);
                      const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
                      const resp = await fetch('/api/embeds', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', ...(tenantId ? { 'x-tenant-id': tenantId } : {}) },
                        body: JSON.stringify({
                          title,
                          provider,
                          url,
                          embed_type: audience === 'individual' ? 'user' : 'role',
                          user_id: audience === 'individual' ? selectedUser : null,
                          role: audience === 'user-type' ? 'all' : null
                        })
                      });
                      const json = await resp.json();
                      if (!resp.ok) throw new Error(json?.error || json?.message || 'Save failed');
                      setToast({ type: 'success', message: 'Embed added' });
                      setTimeout(() => setToast(null), 2000);
                      setTitle(''); setProvider(''); setUrl(''); setSelectedUser('');
                    } catch (e) {
                      setToast({ type: 'error', message: String(e.message || e) });
                      setTimeout(() => setToast(null), 3000);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Add Embed'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Embed List */}
          <div id="embed-list-section" className="space-y-6 lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header */}
              <div id="list-header" className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <h2 className="text-lg font-semibold text-gray-900">Embed List</h2>

                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      <input type="text" placeholder="Search embeds..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent w-64" />
                    </div>

                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option>All Providers</option>
                      <option>Notion</option>
                      <option>Calendly</option>
                      <option>Monday.com</option>
                    </select>

                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                      <option>All Status</option>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div id="embed-table" className="overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Title &amp; Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loadingEmbeds && (
                      <tr><td colSpan={5} className="px-6 py-6 text-sm text-gray-500">Loading embeds…</td></tr>
                    )}
                    {!loadingEmbeds && embeds.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-6 text-sm text-gray-500">No embeds yet.</td></tr>
                    )}
                    {embeds.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors group align-top">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <i className={`fa-solid ${e.provider === 'calendly' ? 'fa-calendar' : 'fa-cube'} text-gray-600`}></i>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{e.title}</div>
                              <div className="text-sm text-gray-500 capitalize">{e.provider}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{e.embed_type === 'role' ? 'User Type' : 'Individual'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {e.embed_type === 'role' ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{roleLabel(e.role || 'all')}</span>
                          ) : (
                            <span className="text-sm text-gray-900">{(users.find((u) => u.id === e.user_id)?.email) || e.user_id || '—'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs ${e.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{e.is_active ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-gray-400 hover:text-primary transition-colors" onClick={() => updateEmbed(e.id, { is_active: !e.is_active })}>
                              <i className={`fa-solid ${e.is_active ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                            </button>
                            <button className="text-gray-400 hover:text-red-500 transition-colors" onClick={() => deleteEmbed(e.id)}>
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


