import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminFilesManager() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [roles] = useState(['admin', 'recruitpro', 'jobseeker', 'client']);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && drawerOpen) setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  useEffect(() => {
    const load = async () => {
      const { data: u } = await supabase.from('users').select('id, email').order('email');
      setUsers(u || []);
      const { data: f } = await supabase.from('files').select('*').order('created_at', { ascending: false }).limit(100);
      setFiles(f || []);
    };
    load();
  }, []);

  const handleUploadAssign = async () => {
    if (!file) return alert('Choose a file');
    if (!selectedUser && selectedRoles.length === 0) return alert('Select a user or roles');
    const { data: { session } } = await supabase.auth.getSession();
    const storagePath = `${selectedUser || 'roles'}/${file.name}`;
    const { error: upErr } = await supabase.storage.from('user-files').upload(storagePath, file);
    if (upErr) return alert('Upload failed: ' + upErr.message);
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const fileUrl = `${baseUrl}/storage/v1/object/public/user-files/${storagePath}`;
    const payload = { title: title || file.name, file_url: fileUrl, uploaded_by: session?.user?.id || null, user_id: selectedUser || null, assigned_roles: selectedRoles.length ? selectedRoles : null };
    const { error: insErr } = await supabase.from('files').insert([payload]);
    if (insErr) return alert('Save failed: ' + insErr.message);
    setTitle(''); setSelectedUser(''); setSelectedRoles([]); setFile(null);
    const { data: f } = await supabase.from('files').select('*').order('created_at', { ascending: false }).limit(100);
    setFiles(f || []);
    alert('Uploaded & assigned');
  };

  return (
    <div className="bg-gray-50 font-sans">
      {/* Header */}
      <header id="header" className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-900">Files</h1>
            <nav className="text-sm text-gray-500">
              <span>Admin</span> <i className="fa-solid fa-chevron-right mx-2"></i> <span className="text-gray-900">Files</span>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <i className="fa-solid fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input type="text" placeholder="Search files..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-80" />
            </div>
            <button id="upload-btn" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-all">
              <i className="fa-solid fa-upload mr-2"></i>Upload
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-6 py-6">
        {/* Toolbar */}
        <div id="toolbar" className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">User:</label>
              <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option>All Users</option>
                <option>John Smith</option>
                <option>Sarah Wilson</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option>All Types</option>
                <option>PDF</option>
                <option>Image</option>
                <option>Document</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500">
                <option>All</option>
                <option>Sent</option>
                <option>Viewed</option>
              </select>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <button className="text-gray-600 hover:text-gray-900 px-3 py-1.5 text-sm font-medium transition-all">
                <i className="fa-solid fa-download mr-1"></i>Download
              </button>
              <button className="text-red-600 hover:text-red-700 px-3 py-1.5 text-sm font-medium transition-all">
                <i className="fa-solid fa-trash mr-1"></i>Delete
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Upload Card & Files Table */}
          <div className="lg:col-span-3 space-y-6">
            {/* Upload Card */}
            <div id="upload-card" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
                <button className="text-gray-400 hover:text-gray-600 transition-all">
                  <i className="fa-solid fa-chevron-up"></i>
                </button>
              </div>

              {/* Drag & Drop Zone */}
              <label className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-all cursor-pointer block">
                <i className="fa-solid fa-cloud-upload text-4xl text-gray-400 mb-4"></i>
                <p className="text-lg font-medium text-gray-700 mb-2">Drop files here or click to browse</p>
                <p className="text-sm text-gray-500">Support for PDF, DOC, images up to 100MB</p>
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>

              {/* Upload Form */}
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipient</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
                      <option value="">Select user…</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.email}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                    <input type="text" placeholder="Add tags..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                  <textarea placeholder="Add a note for the recipient..." rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"></textarea>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Notify user</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">Assign to roles:</div>
                    <div className="flex items-center gap-2">
                      {roles.map((r) => (
                        <label key={r} className="inline-flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={selectedRoles.includes(r)} onChange={(e) => setSelectedRoles((prev) => e.target.checked ? [...prev, r] : prev.filter((x) => x !== r))} /> {r}
                        </label>
                      ))}
                    </div>
                    <button onClick={handleUploadAssign} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all">Upload &amp; Assign</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Files Table */}
            <div id="files-table" className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Files</h3>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-600">Select all</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setDrawerOpen(true)}>
                        <td className="px-6 py-4">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <i className="fa-solid fa-file text-gray-500 mr-3"></i>
                            <span className="text-sm font-medium text-gray-900">{f.title || f.file_url.split('/').pop()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{f.user_id || (Array.isArray(f.assigned_roles) && f.assigned_roles.join(', ')) || '—'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">—</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">—</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(f.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <button className="text-gray-400 hover:text-gray-600 transition-all">
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div id="recent-activity" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" className="w-8 h-8 rounded-full" alt="A" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Alex Johnson</span> uploaded
                  </p>
                  <p className="text-sm text-gray-600">Contract_Draft.pdf</p>
                  <p className="text-xs text-gray-500">for Maria Garcia • 30 min ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg" className="w-8 h-8 rounded-full" alt="B" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Sarah Wilson</span> viewed
                  </p>
                  <p className="text-sm text-gray-600">Resume_Final.pdf</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" className="w-8 h-8 rounded-full" alt="C" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Mike Chen</span> uploaded
                  </p>
                  <p className="text-sm text-gray-600">Budget_2024.xlsx</p>
                  <p className="text-xs text-gray-500">for David Park • 1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* File Preview Drawer */}
      <div id="file-preview-drawer" className={`fixed inset-y-0 right-0 w-[560px] bg-white shadow-xl border-l border-gray-200 transform transition-transform z-50 ${drawerOpen ? '' : 'translate-x-full hidden'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <i className="fa-solid fa-file-pdf text-red-500 text-xl"></i>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Resume_Final.pdf</h3>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">PDF</span>
              </div>
            </div>
            <button id="close-drawer" className="text-gray-400 hover:text-gray-600 transition-all" onClick={() => setDrawerOpen(false)}>
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">Preview</button>
                <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">Details</button>
                <button className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">Activity</button>
              </nav>
            </div>

            <div className="p-6">
              <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <i className="fa-solid fa-file-pdf text-6xl text-red-500 mb-4"></i>
                  <p className="text-gray-600">PDF Preview</p>
                  <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
                    <i className="fa-solid fa-download mr-2"></i>Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


