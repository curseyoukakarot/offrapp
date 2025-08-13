import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useUser } from '../lib/useUser';
import ClientDashboard from './ClientDashboard';

const JobSeekerDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      if (!profile || !profile.first_name || !profile.last_name) {
        navigate('/complete-profile');
      }
    };
    checkProfile();
  }, [navigate]);

  return (
    <div className="flex min-h-screen">
      <Sidebar role="jobseeker" />
      <main className="flex-1 ml-64">
        <ClientDashboard variant="jobseeker" />
      </main>
    </div>
  );
};

export default JobSeekerDashboard;
