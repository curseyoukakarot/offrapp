import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import ClientDashboard from './ClientDashboard';

export default function RecruitProDashboard() {
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
      <Sidebar role="recruitpro" />
      <main className="flex-1 ml-64">
        <ClientDashboard variant="recruitpro" />
      </main>
    </div>
  );
}
