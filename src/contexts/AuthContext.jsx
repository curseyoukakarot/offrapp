import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getUserRole } from '../utils/getUserRole';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔄 AuthProvider mounted');
    
    // 1️⃣ one-shot fetch for the stored session
    console.log('📥 Fetching initial session...');
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (sessionError) {
        console.error('❌ Error fetching initial session:', sessionError);
        setError(sessionError.message);
        setLoading(false);
        return;
      }
      
      console.log('✅ Initial session fetched:', initialSession);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      
      if (initialSession?.user?.id) {
        console.log('👤 Fetching initial user role for:', initialSession.user.id);
        getUserRole(initialSession.user.id)
          .then(role => {
            console.log('✅ Initial user role fetched:', role);
            setUserRole(role);
            setLoading(false);
          })
          .catch(roleError => {
            console.error('❌ Error fetching initial role:', roleError);
            setError(roleError.message);
            setLoading(false);
          });
      } else {
        console.log('ℹ️ No user ID found in initial session');
        setLoading(false);
      }
    });

    // 2️⃣ live listener keeps state fresh
    console.log('👂 Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      console.log('🔄 Auth state changed:', _event, currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user?.id) {
        console.log('👤 Fetching updated user role for:', currentSession.user.id);
        try {
          const role = await getUserRole(currentSession.user.id);
          console.log('✅ Updated user role fetched:', role);
          setUserRole(role);
          setLoading(false);
        } catch (roleError) {
          console.error('❌ Error fetching updated role:', roleError);
          setError(roleError.message);
          setLoading(false);
        }
      } else {
        console.log('ℹ️ No user ID in current session');
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth state listener');
      subscription.unsubscribe();
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

  // 3️⃣ gate the app until we know for sure
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