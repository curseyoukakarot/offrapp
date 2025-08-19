import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Sidebar = () => {
  const { userRole, signOut, isSuperAdmin } = useAuth();
  const { activeTenant } = useActiveTenant();
  const navigate = useNavigate();
  const [embeds, setEmbeds] = useState([]);
  const [tenantName, setTenantName] = useState(activeTenant?.name || 'Career Kitchen');

  const isAdmin = userRole === 'admin';
  const isRecruitPro = userRole === 'recruitpro' || userRole === 'role1';
  const isJobSeeker = userRole === 'jobseeker' || userRole === 'role2';
  const isClient = userRole === 'client' || userRole === 'role3';
  const isMember = ['role1', 'role2', 'role3', 'client', 'recruitpro', 'jobseeker'].includes(userRole);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  useEffect(() => {
    const fetchEmbeds = async () => {
      if (!userRole) return;
      try {
        const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
        // Tenant branding
        try {
          const tc = await fetch('/api/tenant-config', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } }).then(r => r.json()).catch(() => ({}));
          if (tc?.name) setTenantName(tc.name);
        } catch {}
        const res = await fetch('/api/embeds', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } });
        const json = await res.json();
        const all = Array.isArray(json.embeds) ? json.embeds : [];
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        const visible = all.filter(e =>
          (e.embed_type === 'role' && e.role === userRole && e.is_active) ||
          (e.embed_type === 'user' && e.user_id === userId && e.is_active)
        ).sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setEmbeds(visible);
      } catch (_e) {
        setEmbeds([]);
      }
    };
    fetchEmbeds();
  }, [userRole]);

  const getRoleTitle = () => {
    switch (userRole) {
      case 'admin':
        return 'Admin Dashboard';
      case 'recruitpro':
      case 'role1':
        return 'Team Member Dashboard';
      case 'jobseeker':
      case 'role2':
        return 'Client Dashboard';
      case 'client':
      case 'role3':
        return 'Guest Dashboard';
      default:
        return 'Member Dashboard';
    }
  };

  const getDashboardRoute = () => {
    switch (userRole) {
      case 'admin':
        return '/dashboard/admin';
      case 'recruitpro':
      case 'role1':
        return '/dashboard/client'; // All members use client dashboard
      case 'jobseeker':
      case 'role2':
        return '/dashboard/client';
      case 'client':
      case 'role3':
        return '/dashboard/client';
      default:
        return '/';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">{tenantName}</h2>
        <p className="text-sm text-gray-500">{getRoleTitle()}</p>
      </div>

      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {isSuperAdmin && (
            <NavLink to="/super" className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }>
              <i className="fa-solid fa-wand-magic-sparkles mr-3" />
              <span>Super Admin</span>
            </NavLink>
          )}
          <NavLink to={getDashboardRoute()} className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
              isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`
          }>
            <i className="fa-solid fa-house mr-3" />
            <span>Dashboard</span>
          </NavLink>

          {/* Menu Items */}
          {isAdmin ? (
            <>
              <NavLink to="/crm/users" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-users mr-3" />
                <span>Users List</span>
              </NavLink>
              <NavLink to="/files" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-folder mr-3" />
                <span>Files</span>
              </NavLink>
              {/* Removed Forms link as requested */}
              <NavLink to="/settings" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-gear mr-3" />
                <span>Settings</span>
              </NavLink>
              <NavLink to="/admin-embeds" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-layer-group mr-3" />
                <span>Admin Embeds</span>
              </NavLink>
              <NavLink to="/dashboard/admin/settings" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-gear mr-3" />
                <span>Settings</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/files" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-folder mr-3" />
                <span>Files</span>
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-gear mr-3" />
                <span>Settings</span>
              </NavLink>
              {/* Forms intentionally omitted for members */}
            </>
          )}

          {/* Dynamic Embeds */}
          {embeds.length > 0 && (
            <div className="mt-6">
              <div className="text-xs text-gray-400 uppercase mb-2">Embedded Tools</div>
              {embeds.map((embed) => (
                <NavLink
                  key={embed.id}
                  to={`/embed/${embed.id}`}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  {embed.provider === 'calendly' && <i className="fa-solid fa-calendar-days mr-3" />}
                  {embed.provider === 'monday' && <i className="fa-brands fa-monday mr-3 text-blue-500" />}
                  {embed.provider === 'notion' && <i className="fa-solid fa-n mr-3 text-gray-800" />}
                  {embed.provider === 'hirepilot' && <i className="fa-solid fa-rocket mr-3 text-indigo-500" />}
                  {embed.provider === 'custom' && <i className="fa-solid fa-link mr-3" />}
                  <span>{embed.title}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <i className="fa-solid fa-right-from-bracket mr-3" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

