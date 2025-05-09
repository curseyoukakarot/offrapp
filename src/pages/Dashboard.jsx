import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AnalyticsCards from '../components/AnalyticsCards';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/FileUpload';
import UserManager from '../components/UserManager';
import { useEffect, useState } from 'react';
import { useUser } from '../lib/useUser';

const Dashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [showProfileBanner, setShowProfileBanner] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch role from users table
    const fetchRole = async () => {
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      setRole(userRow?.role || 'authenticated');
      setLoading(false);
      // Check if profile is incomplete
      checkProfileCompleteness(user.id);
    };
    fetchRole();
  }, [user]);

  const checkProfileCompleteness = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .maybeSingle();
    if (!profile || !profile.first_name || !profile.last_name) {
      setShowProfileBanner(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {showProfileBanner && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 flex items-center justify-between">
          <span>
            <strong>Complete your profile!</strong> For a better experience, please <button className="underline text-blue-700" onClick={() => navigate('/complete-profile')}>add your contact info</button>.
          </span>
          <button onClick={() => setShowProfileBanner(false)} className="ml-4 text-yellow-700 hover:text-yellow-900">Dismiss</button>
        </div>
      )}
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