import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../lib/useUser';
import WelcomeScreen from '../components/WelcomeScreen';
import Sidebar from '../components/Sidebar';

export default function RoleBasedDashboard() {
  const { user } = useUser();
  const [dbUser, setDbUser] = useState(null);

  useEffect(() => {
    const fetchDbUser = async () => {
      if (user?.id) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error) {
          console.error('Error fetching user:', error.message);
        }
        setDbUser(data);
      }
    };
    fetchDbUser();
  }, [user?.id]);

  // Provide a safe fallback
  const effectiveUser = dbUser || user || { name: 'Guest', role: 'guest' };
  const sidebarRole = effectiveUser.role || 'guest';

  if (!dbUser) {
    return <div className="p-6">Loading...</div>;
  }

  if (!dbUser.onboarding_complete) {
    return <WelcomeScreen user={effectiveUser} onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="flex">
      <Sidebar role={sidebarRole} />
      <div className="ml-64 p-6 w-full">
        <h1 className="text-xl font-bold mb-4">Welcome, {effectiveUser.name}</h1>
        <p>🎉 This is your {sidebarRole} dashboard!</p>
      </div>
    </div>
  );
}
