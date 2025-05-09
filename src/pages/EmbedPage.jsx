import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useUser } from '../lib/useUser';

const EmbedPage = () => {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [embed, setEmbed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Get role from JWT
    const jwtRole = 
      user.app_metadata?.role ??
      user.user_metadata?.role ??
      'authenticated';
    
    console.log('User role from JWT:', jwtRole);
    setRole(jwtRole);
    initializePage(jwtRole); // Pass the role directly to initializePage
  }, [user]);

  const initializePage = async (currentRole) => {
    try {
      setLoading(true);
      
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        navigate('/login');
        return;
      }

      if (!session) {
        console.log('No session found');
        navigate('/login');
        return;
      }

      // Fetch embed data
      const { data: embedData, error: embedError } = await supabase
        .from('embeds')
        .select('*')
        .eq('id', id)
        .single();

      console.log('Embed fetch result:', { data: embedData, error: embedError });

      if (embedError) {
        console.error('Error fetching embed:', embedError);
        navigate('/');
        return;
      }

      if (embedData) {
        let accessGranted = false;
        if (embedData.embed_type === 'role') {
          accessGranted = embedData.role === currentRole;
          console.log('Role-based access check:', { userRole: currentRole, embedRole: embedData.role, hasAccess: accessGranted });
        } else if (embedData.embed_type === 'user') {
          accessGranted = embedData.user_id === session.user.id;
          console.log('User-based access check:', { userId: session.user.id, embedUserId: embedData.user_id, hasAccess: accessGranted });
        }

        if (accessGranted) {
          setEmbed(embedData);
          setHasAccess(true);
        } else {
          console.log('No access to embed, redirecting to home');
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Error in initializePage:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar role={role} />
        <main className="flex-1 bg-gray-50 p-0 ml-64 flex flex-col min-h-screen">
          <div className="flex justify-center items-center h-screen text-gray-600">
            Loading embed...
          </div>
        </main>
      </div>
    );
  }

  if (!hasAccess || !embed) {
    return (
      <div className="flex min-h-screen">
        <Sidebar role={role} />
        <main className="flex-1 bg-gray-50 p-0 ml-64 flex flex-col min-h-screen">
          <div className="flex justify-center items-center h-screen text-gray-600">
            You don't have access to this embed.
          </div>
        </main>
      </div>
    );
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