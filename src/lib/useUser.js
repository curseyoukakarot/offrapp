import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useUser() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth error or no user found:', error);
        setUser(null);
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  return { user };
}
