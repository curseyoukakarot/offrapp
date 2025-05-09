import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleSession = async (currentSession) => {
    console.log('🔄 Handling session:', currentSession);
    setSession(currentSession);
    setUser(currentSession?.user ?? null);

    if (!currentSession || !currentSession.user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    // Fetch role from users table
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', currentSession.user.id)
      .maybeSingle();
    const dbRole = userRow?.role || 'authenticated';
    console.log('✅ User role from users table:', dbRole);
    setUserRole(dbRole);
    setLoading(false);
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
    loading,
    error,
    signOut: async () => {
      try {
        console.log('🚪 Signing out...');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUserRole(null);
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