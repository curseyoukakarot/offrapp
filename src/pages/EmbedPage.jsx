import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { getUserRole } from '../utils/getUserRole';

const EmbedPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [embed, setEmbed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('EmbedPage - Session:', session);
      
      if (!session) {
        console.log('No session found, redirecting to login');
        navigate('/login');
        return;
      }

      if (session?.user?.id) {
        const userRole = await getUserRole(session.user.id);
        console.log('EmbedPage - User role:', userRole);
        setRole(userRole);
      } else {
        setRole('guest');
      }
    };
    fetchRole();
  }, [navigate]);

  useEffect(() => {
    const fetchEmbed = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('EmbedPage - Fetching embed with session:', session);
      
      if (!session) {
        console.log('No session during embed fetch, redirecting to login');
        navigate('/login');
        return;
      }

      const userId = session?.user?.id;

      const { data, error } = await supabase.from('embeds').select('*').eq('id', id).single();
      console.log('EmbedPage - Embed fetch result:', { data, error });
      
      if (error) {
        console.error('Error fetching embed:', error);
        navigate('/');
        return;
      }

      if (data) {
        let accessGranted = false;
        // Check if user has access to this embed
        if (data.embed_type === 'role') {
          // For role-based embeds, check if user's role matches
          accessGranted = data.role === role;
          console.log('Role-based access check:', { userRole: role, embedRole: data.role, hasAccess: accessGranted });
        } else if (data.embed_type === 'user') {
          // For user-specific embeds, check if user ID matches
          accessGranted = data.user_id === userId;
          console.log('User-based access check:', { userId, embedUserId: data.user_id, hasAccess: accessGranted });
        }

        setHasAccess(accessGranted);

        if (accessGranted) {
          setEmbed(data);
        } else {
          console.log('No access to embed, redirecting to home');
          navigate('/');
        }
      }
      
      setLoading(false);
    };

    if (role) {
      fetchEmbed();
    }
  }, [id, role, navigate, hasAccess]);

  if (loading || !embed) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading embed...</div>;
  }

  if (!hasAccess) {
    return <div className="flex justify-center items-center h-screen text-gray-600">You don't have access to this embed.</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <main className="flex-1 bg-gray-50 p-0 ml-64 flex flex-col min-h-screen">
        <div className="p-8 pb-0">
          <h1 className="text-2xl font-bold mb-4">{embed.title}</h1>
        </div>
        <div className="flex-1 flex min-h-0">
          {/* Render iframe or embed based on provider */}
          <iframe
            src={embed.url}
            title={embed.title}
            className="w-full h-full border-none rounded flex-1 min-h-0"
            allow="camera; microphone; fullscreen"
          />
        </div>
      </main>
    </div>
  );
};

export default EmbedPage; 