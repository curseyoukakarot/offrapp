import React, { useEffect, useState } from 'react';

export default function AdminEmbedsManagerV2() {
  const [audience, setAudience] = useState('user-type');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    // Table row hover effects to show actions
    const rows = document.querySelectorAll('#embed-table tbody tr:not(.bg-gray-50)');
    rows.forEach((row) => {
      row.classList.add('group');
    });
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
      try {
        setLoadingUsers(true);
        const res = await fetch('/api/files/tenant-users', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } });
        const json = await res.json();
        setUsers(Array.isArray(json.users) ? json.users : []);
      } catch {
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    loadUsers();
  }, []);

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Embed Creation Form */}
          <div id="embed-form-section" className="space-y-6">
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
                  <input type="text" placeholder="e.g., Project Tracker" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                    <option>Select Provider</option>
                    <option>Notion</option>
                    <option>Calendly</option>
                    <option>Monday.com</option>
                    <option>Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Embed URL</label>
                  <input type="url" placeholder="https://..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" />
                </div>

                {/* Live Preview */}
                <div id="live-preview" className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-2">Live Preview</p>
                  <div className="bg-white border border-gray-200 rounded h-32 flex items-center justify-center">
                    <span className="text-gray-400">Enter URL to see preview</span>
                  </div>
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
                    <input type="radio" name="audience" value="user-type" className="text-primary" checked={audience === 'user-type'} onChange={() => setAudience('user-type')} />
                    <span>Assign by User Type</span>
                  </label>

                  <div id="user-type-chips" className="flex flex-wrap gap-2 ml-6" style={{ display: audience === 'user-type' ? 'flex' : 'none' }}>
                    <Chip>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Job Seeker</span>
                    </Chip>
                    <Chip>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Client</span>
                    </Chip>
                    <Chip>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">RecruitPro</span>
                    </Chip>
                    <Chip>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">Admin</span>
                    </Chip>
                  </div>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="radio" name="audience" value="individual" className="text-primary" checked={audience === 'individual'} onChange={() => setAudience('individual')} />
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea placeholder="Add context or notes..." rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"></textarea>
                </div>
              </div>

              {/* Step 4: Actions */}
              <div id="step-4">
                <button className="w-full bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                  Add Embed
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Embed List */}
          <div id="embed-list-section" className="space-y-6">
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
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title &amp; Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Notion Group */}
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-3">
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-chevron-down text-gray-400"></i>
                          <i className="fa-solid fa-cube text-gray-600"></i>
                          <span className="font-medium text-gray-900">Notion (2)</span>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <i className="fa-solid fa-cube text-gray-600"></i>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Project Tracker</div>
                            <div className="text-sm text-gray-500">Notion</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">User Type</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Job Seeker</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-gray-400 hover:text-primary transition-colors">
                            <i className="fa-solid fa-edit"></i>
                          </button>
                          <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                            <i className="fa-solid fa-toggle-on"></i>
                          </button>
                          <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <i className="fa-solid fa-cube text-gray-600"></i>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Team Dashboard</div>
                            <div className="text-sm text-gray-500">Notion</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">Individual</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <img src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" className="w-6 h-6 rounded-full" alt="User" />
                          <span className="text-sm text-gray-900">john@example.com</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Inactive</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-primary transition-colors">
                            <i className="fa-solid fa-edit"></i>
                          </button>
                          <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                            <i className="fa-solid fa-toggle-off"></i>
                          </button>
                          <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Calendly Group */}
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-3">
                        <div className="flex items-center space-x-2">
                          <i className="fa-solid fa-chevron-down text-gray-400"></i>
                          <i className="fa-solid fa-calendar text-gray-600"></i>
                          <span className="font-medium text-gray-900">Calendly (1)</span>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <i className="fa-solid fa-calendar text-gray-600"></i>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Booking Calendar</div>
                            <div className="text-sm text-gray-500">Calendly</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">User Type</td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Client</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-primary transition-colors">
                            <i className="fa-solid fa-edit"></i>
                          </button>
                          <button className="text-gray-400 hover:text-yellow-500 transition-colors">
                            <i className="fa-solid fa-toggle-on"></i>
                          </button>
                          <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
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


