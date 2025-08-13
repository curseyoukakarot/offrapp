import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminDashboard() {
  const [recentUsers, setRecentUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    // Counter animation
    function animateCounter(element) {
      const targetAttr = element.getAttribute('data-count') || '0';
      const target = parseInt(String(targetAttr).replace(/,/g, ''), 10) || 0;
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
      }, 16);
    }
    const counters = document.querySelectorAll('.counter');
    counters.forEach((counter) => {
      setTimeout(() => animateCounter(counter), Math.random() * 500);
    });
  }, []);

  useEffect(() => {
    const loadRecent = async () => {
      setUsersLoading(true);
      try {
        const tenantId = localStorage.getItem('offrapp-active-tenant-id');
        if (tenantId) {
          // Pull newest by membership.created_at within active tenant
          const { data, error } = await supabase
            .from('memberships')
            .select('created_at, user:users(id, email, role, created_at, last_sign_in_at, profiles(first_name, last_name, avatar_url))')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false })
            .limit(3);
          if (error) throw error;
          const mapped = (data || []).map((m) => m.user).filter(Boolean);
          setRecentUsers(mapped);
        } else {
          // Fallback: latest created users visible to this admin
          const { data, error } = await supabase
            .from('users')
            .select('id, email, role, created_at, last_sign_in_at, profiles(first_name, last_name, avatar_url)')
            .order('created_at', { ascending: false })
            .limit(3);
          if (error) throw error;
          setRecentUsers(data || []);
        }
      } catch (e) {
        console.warn('Failed to load recent users', e.message || e);
        setRecentUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };
    loadRecent();
  }, []);

  return (
    <div className="bg-bg">
      {/* Content only; header/sidebar provided by AdminLayout */}
      <main id="main-content" className="flex-1 p-6">
          {/* Stats Overview */}
          <section id="stats-section" className="mb-8 fade-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-card rounded-xl p-6 shadow-sm hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray text-sm font-medium">Total Clients</p>
                    <p className="text-3xl font-bold text-text counter" data-count="1,247">0</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-users text-primary"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i>
                    12%
                  </span>
                  <span className="text-gray ml-2">vs last month</span>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray text-sm font-medium">Active Clients</p>
                    <p className="text-3xl font-bold text-text counter" data-count="892">0</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-user-check text-green-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i>
                    8%
                  </span>
                  <span className="text-gray ml-2">vs last month</span>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray text-sm font-medium">Total Forms</p>
                    <p className="text-3xl font-bold text-text counter" data-count="156">0</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-clipboard-list text-purple-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i>
                    24%
                  </span>
                  <span className="text-gray ml-2">vs last month</span>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm hover-lift">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray text-sm font-medium">Files Uploaded</p>
                    <p className="text-3xl font-bold text-text counter" data-count="2,431">0</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-cloud-upload text-orange-600"></i>
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-green-600 flex items-center">
                    <i className="fa-solid fa-arrow-up mr-1"></i>
                    16%
                  </span>
                  <span className="text-gray ml-2">vs last month</span>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload Section */}
            <section id="file-upload-section" className="bg-card rounded-xl p-6 shadow-sm hover-lift fade-in">
              <h3 className="text-lg font-semibold text-text mb-4">Upload Files</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray mb-2">Assign to User</label>
                <select className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:border-primary">
                  <option>Select a user...</option>
                  <option>John Doe</option>
                  <option>Jane Smith</option>
                  <option>Mike Johnson</option>
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                <i className="fa-solid fa-cloud-upload text-4xl text-gray mb-4"></i>
                <p className="text-text font-medium mb-2">Drop files here or click to upload</p>
                <p className="text-gray text-sm">Supports: PDF, DOC, XLS, JPG, PNG (Max 10MB)</p>
                <button className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Choose Files
                </button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray mb-3">Recent Uploads</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-file-pdf text-red-500"></i>
                      <span className="text-sm text-text">document.pdf</span>
                    </div>
                    <span className="text-xs text-gray">2 min ago</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <i className="fa-solid fa-file-excel text-green-500"></i>
                      <span className="text-sm text-text">spreadsheet.xlsx</span>
                    </div>
                    <span className="text-xs text-gray">5 min ago</span>
                  </div>
                </div>
              </div>
            </section>

            {/* User Management Preview */}
            <section id="user-management-preview" className="bg-card rounded-xl p-6 shadow-sm hover-lift fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text">Recent Users</h3>
                <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                  <i className="fa-solid fa-plus mr-2"></i>Add User
                </button>
              </div>

              <div className="space-y-3">
                {usersLoading && (
                  <div className="text-sm text-gray">Loading…</div>
                )}
                {!usersLoading && recentUsers.length === 0 && (
                  <div className="text-sm text-gray">No recent users.</div>
                )}
                {recentUsers.map((u) => {
                  const first = u?.profiles?.first_name || '';
                  const last = u?.profiles?.last_name || '';
                  const name = (first || last) ? `${first} ${last}`.trim() : (u.email?.split('@')[0] || 'User');
                  const avatar = u?.profiles?.avatar_url || 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg';
                  const isActive = !!u.last_sign_in_at;
                  return (
                    <div key={u.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img src={avatar} className="w-10 h-10 rounded-full" alt={name} />
                        <div>
                          <p className="text-sm font-medium text-text">{name}</p>
                          <p className="text-xs text-gray">{u.email}</p>
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


