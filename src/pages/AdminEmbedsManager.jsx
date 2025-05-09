import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useUser } from '../lib/useUser';
import { useNavigate } from 'react-router-dom';

const AdminEmbedsManager = () => {
  const { user } = useUser();
  const [embeds, setEmbeds] = useState([]);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [newEmbed, setNewEmbed] = useState({
    title: '',
    role: 'jobseeker',
    provider: 'calendly',
    url: '',
    sort_order: 0,
    is_active: true,
    user_id: null,
    embed_type: 'role'
  });
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    // Get role from JWT
    const jwtRole = 
      user.app_metadata?.role ??
      user.user_metadata?.role ??
      'authenticated';
    
    console.log('User role from JWT:', jwtRole);
    setRole(jwtRole);
    
    // Redirect if not admin
    if (jwtRole !== 'admin') {
      navigate('/');
    }
    
    setLoading(false);
  }, [user, navigate]);

  useEffect(() => {
    if (role === 'admin') {
      fetchEmbeds();
      fetchUsers();
    }
  }, [role]);

  async function fetchUsers() {
    const { data: usersData, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (!error) {
      setUsers(usersData);
      // Fetch all profiles for these users
      const userIds = usersData.map(u => u.id);
      const { data: profilesData } = await supabase.from('profiles').select('id, first_name, last_name').in('id', userIds);
      // Map profiles by user id
      const profilesMap = {};
      if (profilesData) {
        profilesData.forEach(profile => {
          profilesMap[profile.id] = profile;
        });
      }
      setProfiles(profilesMap);
    }
  }

  async function fetchEmbeds() {
    console.log('Fetching embeds...');
    const { data, error } = await supabase
      .from('embeds')
      .select('id, title, role, provider, url, sort_order, is_active, user_id, embed_type')
      .order('sort_order');
    
    console.log('Embeds response:', { data, error });
    
    if (error) {
      console.error('Error fetching embeds:', error);
      setNotification({ type: 'error', message: 'Failed to fetch embeds. Please try again.' });
    } else {
      setEmbeds(data);
    }
  }

  async function addEmbed() {
    const { error } = await supabase.from('embeds').insert([newEmbed]);
    if (!error) {
      setNewEmbed({ 
        title: '', 
        role: 'jobseeker', 
        provider: 'calendly', 
        url: '', 
        sort_order: 0, 
        is_active: true, 
        user_id: null,
        embed_type: 'role'
      });
      fetchEmbeds();
      setNotification({ type: 'success', message: 'Embed created successfully!' });
    } else {
      setNotification({ type: 'error', message: 'Failed to create embed. Please try again.' });
    }
    setTimeout(() => setNotification(null), 3000);
  }

  async function toggleEmbed(id, is_active) {
    await supabase.from('embeds').update({ is_active }).eq('id', id);
    fetchEmbeds();
  }

  async function deleteEmbed(id) {
    await supabase.from('embeds').delete().eq('id', id);
    fetchEmbeds();
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;
  }

  if (role !== 'admin') {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar role={role} />

      <div className="ml-64 p-6 w-full">
        <h2 className="text-xl font-bold mb-4">Admin Embed Manager</h2>

        {notification && (
          <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="mb-6 grid gap-4 grid-cols-1 md:grid-cols-2">
          <input className="border p-2 rounded" placeholder="Title" value={newEmbed.title} onChange={e => setNewEmbed({ ...newEmbed, title: e.target.value })} />
          
          <div className="flex gap-2">
            <select 
              className="border p-2 rounded flex-1" 
              value={newEmbed.embed_type} 
              onChange={e => setNewEmbed({ ...newEmbed, embed_type: e.target.value, user_id: null, role: 'jobseeker' })}
            >
              <option value="role">User Type Embed</option>
              <option value="user">Individual User Embed</option>
            </select>
          </div>

          {newEmbed.embed_type === 'role' ? (
            <select className="border p-2 rounded" value={newEmbed.role} onChange={e => setNewEmbed({ ...newEmbed, role: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="recruitpro">RecruitPro</option>
              <option value="jobseeker">Job Seeker</option>
              <option value="client">Client</option>
            </select>
          ) : (
            <select 
              className="border p-2 rounded" 
              value={newEmbed.user_id || ''} 
              onChange={e => setNewEmbed({ ...newEmbed, user_id: e.target.value })}
            >
              <option value="">Select User</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {profiles[user.id]?.first_name && profiles[user.id]?.last_name
                    ? `${profiles[user.id].first_name} ${profiles[user.id].last_name}`
                    : user.email}
                </option>
              ))}
            </select>
          )}

          <select className="border p-2 rounded" value={newEmbed.provider} onChange={e => setNewEmbed({ ...newEmbed, provider: e.target.value })}>
            <option value="calendly">Calendly</option>
            <option value="notion">Notion</option>
            <option value="monday">Monday</option>
            <option value="custom">Custom</option>
          </select>
          <input className="border p-2 rounded" placeholder="Embed URL" value={newEmbed.url} onChange={e => setNewEmbed({ ...newEmbed, url: e.target.value })} />
          <input className="border p-2 rounded" type="number" placeholder="Sort Order" value={newEmbed.sort_order} onChange={e => setNewEmbed({ ...newEmbed, sort_order: parseInt(e.target.value) })} />
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded" 
            onClick={addEmbed}
            disabled={newEmbed.embed_type === 'user' && !newEmbed.user_id}
          >
            Add Embed
          </button>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Target</th>
              <th>Provider</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {embeds.map(embed => (
              <tr key={embed.id}>
                <td>{embed.title}</td>
                <td>{embed.embed_type === 'role' ? 'User Type' : 'Individual User'}</td>
                <td>
                  {embed.embed_type === 'role' ? (
                    embed.role
                  ) : (
                    profiles[embed.user_id]?.first_name && profiles[embed.user_id]?.last_name
                      ? `${profiles[embed.user_id].first_name} ${profiles[embed.user_id].last_name}`
                      : users.find(u => u.id === embed.user_id)?.email || 'Unknown User'
                  )}
                </td>
                <td>{embed.provider}</td>
                <td>{embed.is_active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button className="mr-2 text-green-600" onClick={() => toggleEmbed(embed.id, !embed.is_active)}>
                    {embed.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="text-red-600" onClick={() => deleteEmbed(embed.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminEmbedsManager;
