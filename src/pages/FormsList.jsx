import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FormsList() {
  const navigate = useNavigate();
  const [isCardView, setIsCardView] = useState(true);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
        const res = await fetch('/api/forms?limit=200', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } });
        const isJson = (res.headers.get('content-type') || '').includes('application/json');
        const json = isJson ? await res.json() : { forms: [] };
        if (!res.ok) throw new Error(json?.error || json?.message || 'Failed to load forms');
        setForms(json.forms || []);
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
              <div className="text-sm text-gray-500">No forms found.</div>
            )}
            {!loading && !error && forms.map((form) => (
            <div key={form.id} className="bg-white border border-gray-200 rounded-2xl p-6 mb-4 hover:shadow-lg transition-shadow cursor-pointer group">
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
                  <button title="Preview" className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg" onClick={(e) => { e.stopPropagation(); navigate(`/forms/${form.id}`); }}>
                    <i className="fa-solid fa-eye"></i>
                  </button>
                  <button title="Edit" className="p-2 text-gray-400 hover:text-accent hover:bg-gray-100 rounded-lg" onClick={(e) => { e.stopPropagation(); navigate(`/forms/new?edit=${form.id}`); }}>
                    <i className="fa-solid fa-edit"></i>
                  </button>
                  <button title="Copy" className="p-2 text-gray-400 hover:text-secondary hover:bg-gray-100 rounded-lg" onClick={async (e) => {
                    e.stopPropagation();
                    const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
                    const res = await fetch(`/api/forms/${form.id}/copy`, { method: 'POST', headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } });
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

        <div id="right-panel" className="w-1/2 bg-gray-50 relative">
          <div id="form-details-header" className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Employee Feedback Form</h2>
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <i className="fa-solid fa-eye mr-2"></i>View Live
                </button>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  <i className="fa-solid fa-edit mr-2"></i>Edit
                </button>
              </div>
            </div>
            <p className="text-gray-600 mb-4">Quarterly employee satisfaction survey to gather feedback on workplace culture, management, and overall job satisfaction.</p>

            <div id="tabs" className="flex space-x-6 border-b border-gray-200">
              <button className="pb-3 border-b-2 border-primary text-primary font-medium">Role Assignment</button>
              <button className="pb-3 text-gray-500 hover:text-gray-700">Preview</button>
              <button className="pb-3 text-gray-500 hover:text-gray-700">Responses</button>
            </div>
          </div>

          <div id="role-assignment-tab" className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Assign Roles</h3>
              <p className="text-sm text-gray-600 mb-4">Select which user roles can access this form</p>

              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mr-3 text-primary" />
                  <div className="flex items-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-3">Admin</span>
                    <span className="text-gray-700">Full access to all forms and responses</span>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="mr-3 text-primary" />
                  <div className="flex items-center">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-3">Jobseeker</span>
                    <span className="text-gray-700">Can view and submit assigned forms</span>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" className="mr-3 text-primary" />
                  <div className="flex items-center">
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium mr-3">Client</span>
                    <span className="text-gray-700">Limited access to client-specific forms</span>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" defaultChecked className="mr-3 text-primary" />
                  <div className="flex items-center">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium mr-3">HR Manager</span>
                    <span className="text-gray-700">Access to HR-related forms and analytics</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Current Assignments</h4>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-medium flex items-center">
                  Admin
                  <button className="ml-2 text-blue-600 hover:text-blue-800">
                    <i className="fa-solid fa-times"></i>
                  </button>
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-2 rounded-full text-sm font-medium flex items-center">
                  HR Manager
                  <button className="ml-2 text-purple-600 hover:text-purple-800">
                    <i className="fa-solid fa-times"></i>
                  </button>
                </span>
              </div>
              <div className="text-sm text-gray-500 mb-4">
                <i className="fa-solid fa-users mr-2"></i>
                2 roles assigned • Last updated by John Doe
              </div>
            </div>
          </div>

          <div id="save-button-container" className="absolute bottom-6 right-6">
            <button className="bg-secondary text-white px-8 py-3 rounded-xl hover:bg-green-600 transition-colors shadow-lg">
              <i className="fa-solid fa-save mr-2"></i>Save Assignments
            </button>
          </div>
        </div>
      </div>
      {/* Global CTA to create a new form */}
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
