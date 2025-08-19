import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useActiveTenant } from '../contexts/ActiveTenantContext';
import { tenantFetch } from '../lib/tenantFetch';

const EmbedPage = () => {
  const { userRole } = useAuth();
  const { activeTenantId, scope } = useActiveTenant();
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

      // Fetch embed data via server API with proper tenant context
      console.log('🎯 EmbedPage: Fetching embed with activeTenantId:', activeTenantId, 'embedId:', id);
      const res = await tenantFetch(`/api/embeds?id=${encodeURIComponent(id)}`, {}, activeTenantId, scope);
      const json = await res.json();
      const embedData = json?.embed || null;
      
      console.log('🎯 EmbedPage: Embed data from API:', embedData);
      console.log('🎯 EmbedPage: Current user ID:', session.user.id);

      if (embedData) {
        let accessGranted = false;
        if (embedData.embed_type === 'role') {
          // Map current userRole back to actual role keys for access check
          const actualRoleKeys = [];
          if (currentRole === 'admin') actualRoleKeys.push('admin');
          if (currentRole === 'client') actualRoleKeys.push('client', 'role2', 'role3');
          if (currentRole === 'recruitpro') actualRoleKeys.push('recruitpro', 'role1');
          if (currentRole === 'jobseeker') actualRoleKeys.push('jobseeker', 'role2');
          
          accessGranted = actualRoleKeys.includes(embedData.role);
          console.log('Role-based access check:', { 
            userRole: currentRole, 
            actualRoleKeys, 
            embedRole: embedData.role, 
            hasAccess: accessGranted 
          });
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
    <div className="h-screen flex flex-col">
      {/* Header with embed title */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">{embed.title}</h1>
      </div>
      
      {/* Iframe container that takes remaining space */}
      <div className="flex-1 bg-white">
        <iframe
          src={embed.url}
          title={embed.title}
          className="w-full h-full border-none"
          allow="camera; microphone; fullscreen; clipboard-read; clipboard-write"
          loading="lazy"
        />
      </div>
    </div>
  );
};

export default EmbedPage; 