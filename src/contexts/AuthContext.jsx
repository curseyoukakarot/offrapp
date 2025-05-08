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

  const fetchUserRole = async (userId) => {
    try {
      console.log('Fetching user role for:', userId);
      const role = await getUserRole(userId);
      console.log('User role fetched:', role);
      setUserRole(role);
      return role;
    } catch (err) {
      console.error('Error fetching user role:', err);
      setError(err.message);
      // If we can't get the role, we should sign out the user
      await supabase.auth.signOut();
      return null;
    }
  };

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting initial session:', sessionError);
          throw sessionError;
        }

        console.log('Initial session:', initialSession ? 'Found' : 'Not found');
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user?.id) {
          await fetchUserRole(initialSession.user.id);
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
      console.log('Auth state changed:', event, currentSession ? 'Session exists' : 'No session');
      
      try {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user?.id) {
          await fetchUserRole(currentSession.user.id);
        } else {
          console.log('No user ID in session, setting role to null');
          setUserRole(null);
        }
      } catch (err) {
        console.error('Error in auth state change handler:', err);
        setError(err.message);
      }
    });

    // Set up session refresh listener
    const refreshInterval = setInterval(async () => {
      try {
        console.log('Attempting to refresh session...');
        const { data: { session: currentSession }, error: refreshError } = await supabase.auth.getSession();
        
        if (refreshError) {
          console.error('Error getting current session for refresh:', refreshError);
          throw refreshError;
        }
        
        if (currentSession) {
          console.log('Refreshing session for user:', currentSession.user.id);
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Error refreshing session:', refreshError);
            throw refreshError;
          }
          
          console.log('Session refreshed successfully');
          setSession(refreshedSession);
          
          // Refresh the user role as well
          if (refreshedSession?.user?.id) {
            await fetchUserRole(refreshedSession.user.id);
          }
        } else {
          console.log('No session to refresh');
        }
      } catch (err) {
        console.error('Error in session refresh:', err);
        setError(err.message);
      }
    }, 1000 * 60 * 30); // Refresh every 30 minutes

    return () => {
      console.log('Cleaning up auth listeners');
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
    signOut: async () => {
      try {
        console.log('Signing out...');
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        console.log('Sign out successful');
        setUserRole(null);
      } catch (err) {
        console.error('Error signing out:', err);
        setError(err.message);
      }
    },
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