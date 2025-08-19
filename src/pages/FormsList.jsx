import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { tenantFetch } from '../lib/tenantFetch';

export default function FormsList() {
  const navigate = useNavigate();
  const { scope, activeTenantId, loading: tenantLoading } = useActiveTenant();
  const [isCardView, setIsCardView] = useState(true);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState('roles'); // roles | preview | responses

  const activeForm = useMemo(() => forms.find((f) => f.id === activeId) || null, [forms, activeId]);
  const [assignedRoles, setAssignedRoles] = useState([]);
  useEffect(() => {
    setAssignedRoles(Array.isArray(activeForm?.assigned_roles) ? activeForm.assigned_roles : []);
  }, [activeForm?.id]);

  // Responses state
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [respDrawerOpen, setRespDrawerOpen] = useState(false);
  const [activeResponse, setActiveResponse] = useState(null);

  useEffect(() => {
    if (tenantLoading || (!activeTenantId && scope === 'tenant')) return;
    
    const load = async () => {
      setLoading(true);
      try {
        const res = await tenantFetch('/api/forms?limit=200', {}, activeTenantId, scope);
        const isJson = (res.headers.get('content-type') || '').includes('application/json');
        const json = isJson ? await res.json() : { forms: [] };
        if (!res.ok) throw new Error(json?.error || json?.message || 'Failed to load forms');
        setForms(json.forms || []);
        if ((json.forms || []).length > 0) setActiveId(json.forms[0].id);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeTenantId, scope, tenantLoading]);

  useEffect(() => {
    if (tab !== 'responses' || !activeId) return;
    const load = async () => {
      setLoadingResponses(true);
      try {
        const res = await tenantFetch(`/api/form-responses?formId=${encodeURIComponent(activeId)}`, {}, activeTenantId, scope);
        const json = await res.json();
        setResponses(json.responses || []);
      } catch (_e) {
        setResponses([]);
      } finally {
        setLoadingResponses(false);
      }
    };
    load();
      }, [tab, activeId, activeTenantId, scope]);

  const saveAssignments = async () => {
    if (!activeForm) return;
    const res = await tenantFetch('/api/forms', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: activeForm.id, assigned_roles: assignedRoles })
    }, activeTenantId, scope);
    const json = await res.json();
    if (res.ok) {
      setForms((prev) => prev.map((f) => f.id === activeForm.id ? { ...f, assigned_roles: assignedRoles, updated_at: new Date().toISOString() } : f));
    } else {
      alert(json?.error || 'Failed to save');
    }
  };

  const toggleRole = (k) => {
    const set = new Set(assignedRoles);
    set.has(k) ? set.delete(k) : set.add(k);
    setAssignedRoles(Array.from(set));
  };

  const RoleRow = ({ roleKey, label, desc, color }) => (
    <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
      <input type="checkbox" className="mr-3 text-primary" checked={assignedRoles.includes(roleKey)} onChange={() => toggleRole(roleKey)} />
      <div className="flex items-center">
        <span className={`${color} px-3 py-1 rounded-full text-sm font-medium mr-3`}>{label}</span>
        <span className="text-gray-700">{desc}</span>
      </div>
    </label>
  );

  return (
    <div className="bg-gray-50">
      <div id="header" className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Form Management</h1>
              <div className="bg-gray-100 px-3 py-1 rounded-full">
                <span className="text-sm text-gray-600">{loading ? 'Loading…' : `${forms.length} forms`}</span>
              </div>
            </div>
            <button
              id="new-form-btn"
              onClick={() => navigate('/forms/new')}
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <i className="fa-solid fa-plus"></i>
              <span>New Form</span>
            </button>
          </div>
        </div>
      </div>

      <div id="main-layout" className="flex h-[calc(100vh-80px)]">
        {/* Left side: forms list */}
        <div id="left-panel" className="w-1/2 border-r border-gray-200 bg-white">
          <div id="search-filter-bar" className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="flex items-center space-x-4 mb-4">
              <div className="relative flex-1">
                <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input type="text" placeholder="Search forms..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary">
                <option>All Status</option>
                <option>Published</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">View:</span>
                <button
                  id="card-view-btn"
                  onClick={() => setIsCardView(true)}
                  className={`p-2 rounded-md ${isCardView ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  <i className="fa-solid fa-grip"></i>
                </button>
                <button
                  id="table-view-btn"
                  onClick={() => setIsCardView(false)}
                  className={`p-2 rounded-md ${!isCardView ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                  <i className="fa-solid fa-list"></i>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                  <option>Last Updated</option>
                  <option>Name</option>
                  <option>Responses</option>
                </select>
              </div>
            </div>
          </div>

          <div id="forms-list" className="p-6 overflow-y-auto">
            {loading && (
              <div className="text-sm text-gray-500">Loading forms…</div>
            )}
            {!loading && error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && forms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <i className="fa-solid fa-clipboard-list text-4xl mb-4 text-gray-400"></i>
                <p className="text-lg font-medium text-gray-600">No forms yet</p>
                <p className="text-sm text-gray-500 mb-4">Create your first form to collect responses</p>
                <button
                  onClick={() => navigate('/forms/new')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i className="fa-solid fa-plus mr-2"></i>
                  Create Form
                </button>
              </div>
            )}
            {!loading && !error && forms.map((form) => (
            <div key={form.id} className={`bg-white border ${activeId === form.id ? 'border-primary' : 'border-gray-200'} rounded-2xl p-6 mb-4 hover:shadow-lg transition-shadow cursor-pointer group`} onClick={() => setActiveId(form.id)}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">{form.title || 'Untitled Form'}</h3>
                  <p className="text-sm text-gray-600 mb-3">{form.description || ''}</p>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${form.status === 'published' ? 'bg-green-100 text-green-800' : form.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>{(form.status || 'draft').replace(/^./, c => c.toUpperCase())}</span>
                    <span className="text-xs text-gray-500">Last updated {new Date(form.updated_at || form.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(form.assigned_roles) ? form.assigned_roles : []).map((r) => (
                      <span key={r} className={`px-2 py-1 rounded-full text-xs ${r === 'admin' ? 'bg-blue-100 text-blue-800' : r === 'recruitpro' ? 'bg-purple-100 text-purple-800' : r === 'jobseeker' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r}</span>
                    ))}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                  <button title="Preview" className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg" onClick={(e) => { e.stopPropagation(); setActiveId(form.id); setTab('preview'); }}>
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button title="Edit" className="p-2 text-gray-400 hover:text-accent hover:bg-gray-100 rounded-lg" onClick={(e) => { e.stopPropagation(); navigate(`/forms/new?edit=${form.id}`); }}>
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button title="Copy" className="p-2 text-gray-400 hover:text-secondary hover:bg-gray-100 rounded-lg" onClick={async (e) => {
                    e.stopPropagation();
                    const res = await tenantFetch(`/api/forms/${form.id}/copy`, { method: 'POST' }, activeTenantId, scope);
                    const json = await res.json();
                    if (res.ok) setForms((prev) => [json.form, ...prev]);
                  }}>
                    <i className="fa-solid fa-copy"></i>
                  </button>
                  <button title="Delete" className="p-2 text-gray-400 hover:text-danger hover:bg-gray-100 rounded-lg" onClick={async (e) => {
                    e.stopPropagation();
                    if (!window.confirm('Delete this form?')) return;
                    const res = await fetch(`/api/forms/${form.id}`, { method: 'DELETE' });
                    if (res.ok) setForms((prev) => prev.filter((f) => f.id !== form.id));
                  }}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{form.responses_count ?? 0} responses</span>
                <span>{form.completion_rate ? `${form.completion_rate}% completion rate` : '-'}</span>
              </div>
            </div>
            ))}
          </div>
        </div>

        {/* Right panel: active form */}
        <div id="right-panel" className="w-1/2 bg-gray-50 relative">
          {activeForm ? (
            <>
              <div id="form-details-header" className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{activeForm.title || 'Untitled Form'}</h2>
                  <div className="flex space-x-2">
                    <button className={`px-4 py-2 ${tab === 'preview' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'} rounded-lg`} onClick={() => setTab('preview')}>
                      <i className="fa-solid fa-eye mr-2"></i>Preview
                    </button>
                    <button className={`px-4 py-2 ${tab === 'roles' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'} rounded-lg`} onClick={() => setTab('roles')}>
                      <i className="fa-solid fa-user-shield mr-2"></i>Role Assignment
                    </button>
                    <button className={`px-4 py-2 ${tab === 'responses' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'} rounded-lg`} onClick={() => setTab('responses')}>
                      <i className="fa-solid fa-chart-line mr-2"></i>Responses
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{activeForm.description || ''}</p>
              </div>

              {tab === 'roles' && (
                <div id="role-assignment-tab" className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Assign Roles</h3>
                    <p className="text-sm text-gray-600 mb-4">Select which user roles can access this form</p>

                    <div className="space-y-3">
                      <RoleRow roleKey="admin" label="Admin" desc="Full access to all forms and responses" color="bg-blue-100 text-blue-800" />
                      <RoleRow roleKey="jobseeker" label="Jobseeker" desc="Can view and submit assigned forms" color="bg-green-100 text-green-800" />
                      <RoleRow roleKey="client" label="Client" desc="Limited access to client-specific forms" color="bg-red-100 text-red-800" />
                      <RoleRow roleKey="recruitpro" label="HR Manager" desc="Access to HR-related forms and analytics" color="bg-purple-100 text-purple-800" />
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Current Assignments</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {assignedRoles.map((r) => (
                        <span key={r} className={`px-3 py-2 rounded-full text-sm font-medium flex items-center ${r === 'admin' ? 'bg-blue-100 text-blue-800' : r === 'jobseeker' ? 'bg-green-100 text-green-800' : r === 'client' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}`}>
                          {r}
                          <button className="ml-2" onClick={() => toggleRole(r)}>
                            <i className="fa-solid fa-times"></i>
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 mb-4">
                      <i className="fa-solid fa-users mr-2"></i>
                      {assignedRoles.length} roles assigned
                    </div>
                    <div className="text-right">
                      <button className="bg-secondary text-white px-6 py-2 rounded-lg hover:bg-green-600" onClick={saveAssignments}>
                        <i className="fa-solid fa-save mr-2"></i>Save Assignments
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'preview' && (
                <div className="p-6">
                  <div className="bg-white border rounded-2xl p-6 min-h-[420px]">
                    <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
                    <div className="text-sm text-gray-500">Use the Form Builder to edit questions and theme. Preview is placeholder until schema rendering is added.</div>
                  </div>
                </div>
              )}

              {tab === 'responses' && (
                <div className="p-6">
                  <div className="bg-white border rounded-2xl p-6 min-h-[420px]">
                    <h3 className="text-lg font-semibold mb-4">Responses</h3>
                    {loadingResponses ? (
                      <div className="text-sm text-gray-500">Loading…</div>
                    ) : responses.length === 0 ? (
                      <div className="text-sm text-gray-500">No responses yet.</div>
                    ) : (
                      <div className="divide-y">
                        {responses.map((r) => (
                          <button key={r.id} className="w-full text-left py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded" onClick={() => { setActiveResponse(r); setRespDrawerOpen(true); }}>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{r.user_email || r.user_id || 'Anonymous'}</div>
                              <div className="text-xs text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
                            </div>
                            <i className="fa-solid fa-chevron-right text-gray-400"></i>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">Select a form to view details</div>
          )}
        </div>
      </div>

      {/* Response Drawer */}
      <div className={`fixed inset-y-0 right-0 w-[520px] bg-white shadow-xl border-l border-gray-200 transform transition-transform z-50 ${respDrawerOpen ? '' : 'translate-x-full hidden'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Response</div>
              <div className="text-lg font-semibold">{activeResponse?.user_email || activeResponse?.user_id || 'Anonymous'}</div>
              <div className="text-xs text-gray-500">{activeResponse?.created_at ? new Date(activeResponse.created_at).toLocaleString() : ''}</div>
            </div>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => setRespDrawerOpen(false)}>
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeResponse ? (
              <pre className="text-xs bg-gray-50 border rounded p-4 whitespace-pre-wrap break-words">{JSON.stringify(activeResponse.answers || activeResponse.data || activeResponse, null, 2)}</pre>
            ) : null}
          </div>
        </div>
      </div>

      {/* Floating CTA */}
      <button
        onClick={() => navigate('/forms/new')}
        className="fixed bottom-24 right-6 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center gap-2 ring-1 ring-blue-700/20"
        aria-label="Create new form"
      >
        <i className="fa-solid fa-plus"></i>
        <span className="hidden sm:inline">New Form</span>
      </button>
    </div>
  );
}
