import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AnalyticsCards from '../components/AnalyticsCards';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import UserManager from '../components/UserManager';
import { useEffect, useState } from 'react';
import { getUserRole } from '../utils/getUserRole';

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const userRole = await getUserRole(session.user.id);
        if (isMounted) setRole(userRole);
      } else {
        if (isMounted) setRole('guest');
      }
      if (isMounted) setLoading(false);
    };
    fetchRole();
    return () => { isMounted = false; };
  }, []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar role={role} />
      <main className="flex-1 ml-64 relative">
        {/* 🔴 Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>

        <Header />
        <div className="p-6 space-y-8">
          <AnalyticsCards />
          <FileUpload />
          <UserManager />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;