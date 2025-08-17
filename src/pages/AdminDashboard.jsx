import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [recentUsers, setRecentUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [stats, setStats] = useState({
    totalClients: 0,
    activeClients: 0,
    totalForms: 0,
    filesUploaded: 0,
  });
  const [tenantUsers, setTenantUsers] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);

  useEffect(() => {
    const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';

    const loadCounts = async () => {
      try {
        const [usersRes, formsRes, filesRes] = await Promise.all([
          fetch('/api/files/tenant-users', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } }).then((r) => r.json()).catch(() => ({ users: [] })),
          fetch('/api/forms?limit=1000', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } }).then((r) => r.json()).catch(() => ({ forms: [] })),
          fetch('/api/files?limit=1000', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } }).then((r) => r.json()).catch(() => ({ files: [] })),
        ]);
        const users = Array.isArray(usersRes?.users) ? usersRes.users : [];
        const forms = Array.isArray(formsRes?.forms) ? formsRes.forms : [];
        const files = Array.isArray(filesRes?.files) ? filesRes.files : [];
        // recent by created_at desc
        const recent = [...files].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        setTenantUsers(users);
        setRecentFiles(recent);
        setStats({
          totalClients: users.length,
          activeClients: users.length, // until we track last_sign_in_at reliably
          totalForms: forms.length,
          filesUploaded: files.length,
        });
      } catch (_e) {
        setTenantUsers([]);
        setRecentFiles([]);
        setStats({ totalClients: 0, activeClients: 0, totalForms: 0, filesUploaded: 0 });
      }
    };

    const loadRecent = async () => {
      setUsersLoading(true);
      try {
        const doFetch = async (withTenant) => {
          const headers = withTenant && tenantId ? { 'x-tenant-id': tenantId } : {};
          const res = await fetch('/api/users/recent', { headers });
          const json = await res.json();
          return { res, json };
        };
        let { res, json } = await doFetch(true);
        if (!res.ok) ({ res, json } = await doFetch(false));
        if (!res.ok) throw new Error(json?.error || json?.message || 'Failed');
        setRecentUsers(json.users || []);
      } catch (_e) {
        setRecentUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };

    loadCounts();
    loadRecent();
  }, []);

  const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    const m = Math.floor(diff / 60); if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h} hr ago`;
    const d = Math.floor(h / 24); return `${d}d ago`;
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Content only; header/sidebar provided by AdminLayout */}
      <main id="main-content" className="flex-1 p-6 block">
          {/* Stats Overview */}
          <section id="stats-section" className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Clients</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalClients.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-users text-blue-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-gray-500 ml-2">Current tenant members</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Active Clients</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.activeClients.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-user-check text-green-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-gray-500 ml-2">Active = all members (placeholder)</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Forms</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalForms.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-clipboard-list text-purple-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-gray-500 ml-2">Forms available to this tenant</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Files Uploaded</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.filesUploaded.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-cloud-upload text-orange-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-gray-500 ml-2">All files for this tenant</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload Section */}
            <section id="file-upload-section" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Files</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign to User</label>
                <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary">
                  <option value="">Select a user...</option>
                  {tenantUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.email}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                <i className="fa-solid fa-cloud-upload text-4xl text-gray-500 mb-4"></i>
                <p className="text-gray-900 font-medium mb-2">Drop files here or click to upload</p>
                <p className="text-gray-500 text-sm">Supports: PDF, DOC, XLS, JPG, PNG (Max 10MB)</p>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Choose Files
                </button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Uploads</h4>
                <div className="space-y-2">
                  {recentFiles.length === 0 && (
                    <div className="text-sm text-gray">No uploads yet.</div>
                  )}
                  {recentFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <i className="fa-solid fa-file text-gray-500"></i>
                        <span className="text-sm text-gray-900">{f.title || (f.file_url || '').split('/').pop()}</span>
                      </div>
                      <span className="text-xs text-gray-500">{timeAgo(f.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* User Management Preview */}
            <section id="user-management-preview" className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <i className="fa-solid fa-plus mr-2"></i>Add User
                </button>
              </div>

              <div className="space-y-3">
                {usersLoading && (
                  <div className="text-sm text-gray-500">Loading…</div>
                )}
                {!usersLoading && recentUsers.length === 0 && (
                  <div className="text-sm text-gray-500">No recent users.</div>
                )}
                {recentUsers.map((u) => {
                  const name = u.email?.split('@')[0] || 'User';
                  const avatar = 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg';
                  const isActive = !!u.last_sign_in_at;
                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img src={avatar} className="w-10 h-10 rounded-full" alt={name} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {isActive ? 'Active' : 'Pending'}
                        </span>
                        <button className="text-gray hover:text-text">
                          <i className="fa-solid fa-ellipsis-h"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Link to="/crm/users" className="w-full mt-4 py-2 text-primary hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium text-center block">
                View All Users
              </Link>
            </section>
          </div>
      </main>
    </div>
  );
}


