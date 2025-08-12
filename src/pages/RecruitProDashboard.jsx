import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import recruiterBanner from '../assets/images/recruiter-banner.png';

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
      <main className="flex-1 bg-purple-50 p-8 ml-64">
        <img
          src={recruiterBanner}
          alt="Recruiter Banner"
          className="w-full h-64 object-cover rounded mb-6"
        />
        <h1 className="text-2xl font-bold mb-6 text-purple-800">Welcome to RecruitPro!</h1>
        <div className="space-y-4 text-gray-700">
          <p>We're excited to help you break into a new career path of being a tech recruiter! Our team is here to support you in every step of the way and help you find success quickly!</p>
          <h2 className="text-xl font-semibold">Ensure that you take the following steps!</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Sign your important documents!</strong> You should have received our Recruiting Contract, NDA and W9 tax forms! Please sign and return ASAP so we can log those in your file!</li>
            <li><strong>Access the training!</strong> You should have received a link giving you access to our RecruitPro training when you paid! Bookmark the website in your browser so you can quickly refer to it as needed! It's also linked here in your RecruitPro portal!</li>
            <li><strong>Join our Slack Workspaces!</strong> It's vital that you join our Slack communities! Our main company communication takes place there! Make sure you join this link here to stay in the loop!</li>
            <li><strong>Schedule your SPR (Sourcing Process Review)!</strong> Take the training at your own pace! Once you finish, use the "Meet with Brandon" link to schedule your SPR training! This is your Final Exam you need to pass to get access to our recruiting job requisitions and money-making opportunities!</li>
          </ul>
          <p>Excited to work with you! Ping me with any questions and I'll see you on the other side!</p>
        </div>
      </main>
    </div>
  );
}
