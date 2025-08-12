import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useUser } from '../lib/useUser';
import jobseekerBanner from '../assets/images/jobseeker-banner.png';

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
      <main className="flex-1 bg-gray-50 p-8 ml-64">
        <div className="w-full h-48 mb-8 rounded-lg overflow-hidden">
          <img 
            src={jobseekerBanner} 
            alt="Job Seeker Dashboard Banner" 
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold mb-6 text-green-800">Welcome to Career Kitchen!</h1>
        <div className="space-y-4 text-gray-700">
          <p>We're excited to help you break into a new career path! Our team is here to support you in every step of the way and help you find success quickly!</p>
          <h2 className="text-xl font-semibold">Ensure that you take the following steps!</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access to career trainings!</strong> Access our career navigation trainings that teach you key networking and methods of being able to reach out to a hiring manager directly!</li>
            <li><strong>Join our Slack Workspaces!</strong> It's vital that you join our Slack communities! Our main company communication takes place there! Make sure you join this link here to stay in the loop!</li>
            <li><strong>Fill out the required intake form!</strong> Click on "Forms" on the left side and fill out the required info. We will need this from you so we can start finding you key job opportunities asap!</li>
          </ul>
          <p>Excited to work with you! Ping me with any questions and I'll see you on the other side!</p>
        </div>
      </main>
    </div>
  );
};

export default JobSeekerDashboard;
