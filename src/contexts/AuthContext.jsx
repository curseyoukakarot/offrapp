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
    // Initial session check
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user?.id) {
          const role = await getUserRole(initialSession.user.id);
          setUserRole(role);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user?.id) {
        try {
          const role = await getUserRole(currentSession.user.id);
          setUserRole(role);
        } catch (err) {
          console.error('Error fetching user role:', err);
          setError(err.message);
        }
      } else {
        setUserRole(null);
      }
    });

    // Set up session refresh listener
    const refreshInterval = setInterval(async () => {
      try {
        const { data: { session: currentSession }, error: refreshError } = await supabase.auth.getSession();
        
        if (refreshError) throw refreshError;
        
        if (currentSession) {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) throw refreshError;
          setSession(refreshedSession);
        }
      } catch (err) {
        console.error('Error refreshing session:', err);
        setError(err.message);
      }
    }, 1000 * 60 * 30); // Refresh every 30 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const value = {
    session,
    user,
    userRole,
    loading,
    error,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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