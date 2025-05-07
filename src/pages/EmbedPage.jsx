import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { getUserRole } from '../utils/getUserRole';

const EmbedPage = () => {
  const { id } = useParams();
  const [embed, setEmbed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchEmbed = async () => {
      const { data, error } = await supabase.from('embeds').select('*').eq('id', id).single();
      if (!error) setEmbed(data);
      setLoading(false);
    };
    fetchEmbed();
  }, [id]);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const userRole = await getUserRole(session.user.id);
        setRole(userRole);
      } else {
        setRole('guest');
      }
    };
    fetchRole();
  }, []);

  if (loading || !embed) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading embed...</div>;
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