import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';

const EmbedPage = () => {
  const { userRole } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [embed, setEmbed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!userRole) return;
    setRole(userRole);
    initializePage(userRole);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole]);

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

      // Fetch embed data via server API (bypasses RLS) with tenant header
      const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
      const res = await fetch(`/api/embeds?id=${encodeURIComponent(id)}`, { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } });
      const json = await res.json();
      const embedData = json?.embed || null;

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
          console.log('No access to embed for this user');
          setEmbed(null);
          setHasAccess(false);
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
      <div className="min-h-screen">
        <main className="bg-gray-50 p-0 flex flex-col min-h-screen">
          <div className="flex justify-center items-center h-screen text-gray-600">
            Loading embed...
          </div>
        </main>
      </div>
    );
  }

  if (!hasAccess || !embed) {
    return (
      <div className="min-h-screen">
        <main className="bg-gray-50 p-0 flex flex-col min-h-screen">
          <div className="flex justify-center items-center h-screen text-gray-600">
            You don't have access to this embed.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="bg-gray-50 p-0 flex flex-col min-h-screen">
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