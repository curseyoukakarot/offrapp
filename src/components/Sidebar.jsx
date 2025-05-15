import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const Sidebar = () => {
  const { userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [embeds, setEmbeds] = useState([]);

  const isAdmin = userRole === 'admin';
  const isRecruitPro = userRole === 'recruitpro';
  const isJobSeeker = userRole === 'jobseeker';
  const isClient = userRole === 'client';

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  useEffect(() => {
    const fetchEmbeds = async () => {
      if (!userRole) return;
      
      // Fetch role-based embeds
      const { data: roleEmbeds, error: roleError } = await supabase
        .from('embeds')
        .select('*')
        .eq('embed_type', 'role')
        .eq('role', userRole)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      // Fetch user-specific embeds
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      
      const { data: userEmbeds, error: userError } = await supabase
        .from('embeds')
        .select('*')
        .eq('embed_type', 'user')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!roleError && !userError) {
        const allEmbeds = [...(roleEmbeds || []), ...(userEmbeds || [])];
        setEmbeds(allEmbeds);
      }
    };
    fetchEmbeds();
  }, [userRole]);

  const getRoleTitle = () => {
    switch (userRole) {
      case 'admin':
        return 'Admin Dashboard';
      case 'recruitpro':
        return 'RecruitPro Dashboard';
      case 'jobseeker':
        return 'Job Seeker Dashboard';
      case 'client':
        return 'Client Dashboard';
      default:
        return 'Career Kitchen';
    }
  };

  // Hardcoded dashboard route for each role
  const getDashboardRoute = () => {
    switch (userRole) {
      case 'admin':
        return '/dashboard/admin';
      case 'recruitpro':
        return '/dashboard/recruitpro';
      case 'jobseeker':
        return '/dashboard/jobseeker';
      case 'client':
        return '/dashboard/client';
      default:
        return '/';
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800">Career Kitchen</h2>
        <p className="text-sm text-gray-500">{getRoleTitle()}</p>
      </div>

      <nav className="mt-6">
        <div className="px-4 space-y-2">
          {/* Dashboard Link - hardcoded per role */}
          <NavLink to={getDashboardRoute()} className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
              isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            }`
          }>
            <i className="fa-solid fa-house mr-3" />
            <span>Dashboard</span>
          </NavLink>

          {/* Settings Link for RecruitPro and Job Seeker */}
          {(isRecruitPro || isJobSeeker) && (
            <NavLink to="/settings" className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`
            }>
              <i className="fa-solid fa-gear mr-3" />
              <span>Settings</span>
            </NavLink>
          )}

          {/* Admin Menu Items */}
          {isAdmin && (
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
              <NavLink to="/forms" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-file-lines mr-3" />
                <span>Forms</span>
              </NavLink>
              <NavLink to="/admin-embeds" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-layer-group mr-3" />
                <span>Admin Embeds</span>
              </NavLink>
            </>
          )}

          {/* RecruitPro Menu Items */}
          {isRecruitPro && (
            <>
              <NavLink to="/my-files" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-folder mr-3" />
                <span>User Files</span>
              </NavLink>
              <NavLink to="/forms" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-file-lines mr-3" />
                <span>Forms</span>
              </NavLink>
              <a href="https://academy.careerkitchen.co" target="_blank" rel="noreferrer" className="flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                <i className="fa-solid fa-graduation-cap mr-3" />
                <span>RecruitPro Training</span>
              </a>
            </>
          )}

          {/* Job Seeker Menu Items */}
          {isJobSeeker && (
            <>
              <NavLink to="/files" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-folder mr-3" />
                <span>Files</span>
              </NavLink>
              <NavLink to="/forms" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-file-lines mr-3" />
                <span>Forms</span>
              </NavLink>
            </>
          )}

          {/* Client Menu Items */}
          {isClient && (
            <>
              <NavLink to="/files" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-folder mr-3" />
                <span>Files</span>
              </NavLink>
              <NavLink to="/forms" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-file-lines mr-3" />
                <span>Forms</span>
              </NavLink>
              <NavLink to="/embedded-tools" className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }>
                <i className="fa-solid fa-tools mr-3" />
                <span>Embedded Tools</span>
              </NavLink>
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

