import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({
  session: null,
  user: null,
  userRole: null,
  isSuperAdmin: false,
  loading: true,
  error: null,
  signOut: async () => {},
});

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasRedirected, setHasRedirected] = useState(false);

  const handleSession = async (currentSession) => {
    console.log('🔄 Handling session:', currentSession);
    setSession(currentSession);
    setUser(currentSession?.user ?? null);

    if (!currentSession || !currentSession.user) {
      setUserRole('anonymous');
      setLoading(false);
      return;
    }

    // Fetch role from users table
    // Resolve effective role from memberships, fallback to app_users.role
    try {
      const { data: mems } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', currentSession.user.id);
      const roles = (mems || []).map(r => String(r.role || '').toLowerCase());
      let effective = roles.includes('owner') || roles.includes('admin') ? 'admin' : '';
      if (!effective) {
        const { data: appUser } = await supabase
          .from('app_users')
          .select('role')
          .eq('id', currentSession.user.id)
          .maybeSingle();
        const appRole = String(appUser?.role || '').toLowerCase();
        if (appRole === 'owner' || appRole === 'admin') effective = 'admin';
        else if (appRole) effective = appRole;
      }
      if (!effective) effective = 'client';
      console.log('✅ Effective role from memberships:', effective, roles);
      setUserRole(effective);
    } catch (e) {
      console.warn('⚠️ memberships lookup failed; defaulting to client');
      setUserRole('client');
    }

    // Fetch global roles for super admin awareness
    try {
      const { data: globalRoles, error: grErr } = await supabase
        .from('user_global_roles')
        .select('role')
        .eq('user_id', currentSession.user.id);
      if (grErr) {
        console.warn('⚠️ Could not fetch user_global_roles:', grErr.message);
      }
      const rolesList = (globalRoles || []).map((r) => (r.role || '').toLowerCase());
      const superAdmin = rolesList.includes('super_admin') || rolesList.includes('superadmin') || rolesList.includes('super-admin');
      setIsSuperAdmin(superAdmin);
      console.log('🔐 isSuperAdmin:', superAdmin);
      
      // Centralized redirect logic after auth resolution
      handleRedirect(superAdmin, currentSession.user.id);
    } catch (e) {
      console.warn('⚠️ Error resolving user_global_roles:', e);
      setIsSuperAdmin(false);
    }
    setLoading(false);
  };

  const handleRedirect = async (isSuper, userId) => {
    if (hasRedirected) return;
    
    // Skip redirect if we're already on the right page
    const currentPath = window.location.pathname;
    if (currentPath === '/login' || currentPath === '/signup' || currentPath === '/onboarding') {
      // Only redirect from auth pages
    } else {
      return; // Don't redirect if user is already navigating
    }
    
    try {
      if (isSuper) {
        console.log('🔄 Redirecting super admin to /super');
        setHasRedirected(true);
        navigate('/super');
        return;
      }
      
      // Check memberships for regular users with retry logic for race conditions
      let mems = [];
      let memsError = null;
      let attempts = 0;
      
      console.log('🔍 AuthContext: Fetching memberships for user', userId);
      
      while (mems.length === 0 && attempts < 3) {
        const { data, error } = await supabase
          .from('memberships')
          .select('tenant_id, role')
          .eq('user_id', userId)
          .eq('status', 'active'); // Add status filter
          
        memsError = error;
        mems = data || [];
        
        console.log(`🔍 Memberships attempt ${attempts + 1}:`, mems, 'Error:', memsError);
        
        if (memsError) {
          console.warn('⚠️ Error fetching memberships (possibly RLS blocking):', memsError.message);
          break; // Don't retry on actual errors
        }
        
        if (mems.length === 0) {
          console.log(`🔄 No memberships on attempt ${attempts + 1} - retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1s wait
        }
        attempts++;
      }
      
      if (memsError && currentPath === '/login') {
        console.log('🔄 RLS blocking memberships, staying on login page');
        return; // Stay on login, don't redirect
      }
      
      if (mems && mems.length > 0) {
        // Get tenant from URL or use first membership
        const urlParams = new URLSearchParams(window.location.search);
        const urlTenantId = urlParams.get('tenant_id');
        const targetTenantId = urlTenantId || mems[0].tenant_id;
        const userRole = mems[0].role;
        
        // Route based on user's role in the tenant
        if (userRole === 'admin' || userRole === 'owner') {
          console.log('🔄 Redirecting tenant admin to /dashboard/admin with tenant:', targetTenantId);
          setHasRedirected(true);
          navigate(`/dashboard/admin?tenant_id=${targetTenantId}`);
        } else {
          // Members (role1, role2, role3, etc.) go to client dashboard
          console.log('🔄 Redirecting member to /dashboard/client with tenant:', targetTenantId);
          setHasRedirected(true);
          navigate(`/dashboard/client?tenant_id=${targetTenantId}`);
        }
        return;
      }
      
      // Only redirect to onboarding if we're sure there are no memberships
      // and we're not dealing with an RLS error
      // Also check if this is a member invite that should skip onboarding
      const urlParams = new URLSearchParams(window.location.search);
      const inviteMessage = urlParams.get('message');
      
      if (inviteMessage === 'account_created' || inviteMessage === 'invitation_accepted') {
        // This is a member who just signed up, don't send to onboarding
        console.log('🔄 Member signup detected, staying on login');
        return;
      }
      
      if (!memsError) {
        console.log('🔄 No memberships found, redirecting to /onboarding');
        setHasRedirected(true);
        navigate('/onboarding');
      } else {
        console.log('🔄 Cannot determine memberships due to RLS, staying put');
      }
      
    } catch (error) {
      console.error('Error in handleRedirect:', error);
    }
  };

  useEffect(() => {
    console.log('🔄 AuthProvider mounted');
    // 1️⃣ one-shot fetch for the stored session
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (sessionError) {
        console.error('❌ Error fetching initial session:', sessionError);
        setError(sessionError.message);
        setLoading(false);
        return;
      }
      handleSession(initialSession);
    });
    // 2️⃣ live listener keeps state fresh
    console.log('👂 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      console.log('🔄 Auth state changed:', _event, currentSession);
      handleSession(currentSession);
    });
    // 3️⃣ Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⚠️ Loading timeout reached, forcing UI to render');
      setLoading(false);
    }, 5000);
    return () => {
      console.log('🧹 Cleaning up auth state listener');
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const value = {
    session,
    user,
    userRole,
    isSuperAdmin,
    loading,
    error,
    signOut: async () => {
      try {
        console.log('🚪 Signing out...');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUserRole(null);
        setIsSuperAdmin(false);
        console.log('✅ Signed out successfully');
      } catch (err) {
        console.error('❌ Error signing out:', err);
        setError(err.message);
      }
    },
  };

  if (loading) {
    console.log('⏳ Still loading...', { session, user, userRole, error });
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  console.log('🎉 AuthProvider ready:', { session, user, userRole, error });
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 