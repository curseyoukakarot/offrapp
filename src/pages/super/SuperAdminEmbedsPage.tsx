import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  tenant_name?: string;
  tenant_id?: string;
}

interface Embed {
  id: string;
  title: string;
  provider: string;
  url: string;
  embed_type: string;
  user_id?: string;
  role?: string;
  is_active: boolean;
  is_super_admin_embed?: boolean;
  tenant_id?: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  tenant_name?: string;
}

export default function SuperAdminEmbedsPage() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [embeds, setEmbeds] = useState<Embed[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [newEmbed, setNewEmbed] = useState({
    title: '',
    provider: 'calendly',
    url: '',
    user_id: '',
    embed_type: 'user'
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/');
      return;
    }
    
    fetchEmbeds();
    fetchAllUsers();
  }, [isSuperAdmin, navigate]);

  const fetchEmbeds = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch('/api/embeds', {
        headers: {
          'x-scope': 'super',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch embeds');
      
      const json = await res.json();
      const embedsData = json.embeds || [];
      
      // Enrich embeds with user and tenant info
      const enrichedEmbeds = await Promise.all(
        embedsData.map(async (embed: Embed) => {
          if (embed.embed_type === 'user' && embed.user_id) {
            // Get user info
            const { data: userData } = await supabase
              .from('users')
              .select('email')
              .eq('id', embed.user_id)
              .single();
            
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name')
              .eq('id', embed.user_id)
              .single();
            
            // Get tenant info if available
            let tenantName = 'Unknown Tenant';
            if (embed.tenant_id) {
              const { data: tenantData } = await supabase
                .from('tenants')
                .select('name')
                .eq('id', embed.tenant_id)
                .single();
              tenantName = tenantData?.name || 'Unknown Tenant';
            }
            
            return {
              ...embed,
              user_email: userData?.email,
              user_name: profileData ? `${profileData.first_name} ${profileData.last_name}`.trim() : userData?.email,
              tenant_name: tenantName
            };
          }
          return embed;
        })
      );
      
      setEmbeds(enrichedEmbeds);
    } catch (error) {
      console.error('Error fetching embeds:', error);
      setNotification({ type: 'error', message: 'Failed to fetch embeds' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Get all users with their tenant info
      const { data: usersData } = await supabase
        .from('users')
        .select(`
          id,
          email,
          profiles(first_name, last_name),
          memberships(
            tenant_id,
            tenants(name)
          )
        `)
        .order('email');
      
      const processedUsers = usersData?.map(user => ({
        id: user.id,
        email: user.email,
        first_name: user.profiles?.first_name,
        last_name: user.profiles?.last_name,
        tenant_name: user.memberships?.[0]?.tenants?.name,
        tenant_id: user.memberships?.[0]?.tenant_id
      })) || [];
      
      setUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const createEmbed = async () => {
    if (!newEmbed.title || !newEmbed.url || !newEmbed.user_id) {
      setNotification({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Find the target user's tenant
      const targetUser = users.find(u => u.id === newEmbed.user_id);
      
      const res = await fetch('/api/embeds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-scope': 'super',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...newEmbed,
          target_tenant_id: targetUser?.tenant_id
        })
      });

      if (!res.ok) throw new Error('Failed to create embed');

      setNotification({ type: 'success', message: 'Super Admin embed created successfully!' });
      setNewEmbed({
        title: '',
        provider: 'calendly',
        url: '',
        user_id: '',
        embed_type: 'user'
      });
      
      fetchEmbeds();
    } catch (error) {
      console.error('Error creating embed:', error);
      setNotification({ type: 'error', message: 'Failed to create embed' });
    }
  };

  const deleteEmbed = async (embedId: string) => {
    if (!confirm('Are you sure you want to delete this embed?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const res = await fetch(`/api/embeds?id=${embedId}`, {
        method: 'DELETE',
        headers: {
          'x-scope': 'super',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) throw new Error('Failed to delete embed');

      setNotification({ type: 'success', message: 'Embed deleted successfully!' });
      fetchEmbeds();
    } catch (error) {
      console.error('Error deleting embed:', error);
      setNotification({ type: 'error', message: 'Failed to delete embed' });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Super Admin Embeds Manager</h1>
        <p className="text-gray-600">Send embeds to any user across all tenants. These embeds will appear in the user's sidebar regardless of their tenant.</p>
      </div>

      {notification && (
        <div className={`fixed top-8 right-8 z-50 px-6 py-4 rounded shadow-lg text-white transition-all ${
          notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {notification.message}
          <button 
            onClick={() => setNotification(null)}
            className="ml-4 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Create New Embed */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Create Cross-Tenant Embed</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Embed Title"
            value={newEmbed.title}
            onChange={e => setNewEmbed({ ...newEmbed, title: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={newEmbed.provider}
            onChange={e => setNewEmbed({ ...newEmbed, provider: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="calendly">Calendly</option>
            <option value="monday">Monday.com</option>
            <option value="notion">Notion</option>
            <option value="custom">Custom</option>
          </select>
          
          <input
            type="url"
            placeholder="Embed URL"
            value={newEmbed.url}
            onChange={e => setNewEmbed({ ...newEmbed, url: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={newEmbed.user_id}
            onChange={e => setNewEmbed({ ...newEmbed, user_id: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Target User</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name} (${user.email})` 
                  : user.email
                } - {user.tenant_name || 'No Tenant'}
              </option>
            ))}
          </select>
        </div>
        
        <button
          onClick={createEmbed}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <i className="fa-solid fa-plus mr-2"></i>
          Create Super Admin Embed
        </button>
      </div>

      {/* Existing Embeds */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">All Embeds ({embeds.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {embeds.map(embed => (
                <tr key={embed.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{embed.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{embed.url}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      embed.is_super_admin_embed 
                        ? 'bg-purple-100 text-purple-800' 
                        : embed.embed_type === 'user' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {embed.is_super_admin_embed ? 'Super Admin' : embed.embed_type === 'user' ? 'User' : 'Role'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {embed.embed_type === 'user' ? (
                      <div>
                        <div className="font-medium text-gray-900">{embed.user_name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{embed.user_email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Role: {embed.role}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {embed.tenant_name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {embed.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      embed.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {embed.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => deleteEmbed(embed.id)}
                      className="text-red-600 hover:text-red-900 ml-4"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {embeds.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <i className="fa-solid fa-layer-group text-2xl mb-2"></i>
              <p>No embeds found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
