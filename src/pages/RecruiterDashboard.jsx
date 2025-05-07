import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useUser } from '../lib/useUser';
import recruiterBanner from '../assets/images/recruiter-banner.png';

const RecruiterDashboard = () => {
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
      <Sidebar role="recruiter" />
      <main className="flex-1 bg-gray-50 p-8 ml-64">
        {/* Add banner image */}
        <div className="w-full h-48 mb-8 rounded-lg overflow-hidden">
          <img 
            src={recruiterBanner} 
            alt="Recruiter Dashboard Banner" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Rest of your dashboard content */}
        <h1 className="text-2xl font-bold mb-6">Welcome to Your Dashboard</h1>
        // ... rest of your existing JSX ...
      </main>
    </div>
  );
};

export default RecruiterDashboard; 