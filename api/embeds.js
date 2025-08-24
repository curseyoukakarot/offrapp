import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const tenantId = String(req.headers['x-tenant-id'] || '').trim();
  const scope = String(req.headers['x-scope'] || 'tenant').trim();
  
  // Check if user is super admin for cross-tenant operations
  const isSuperAdmin = scope === 'super';

  try {
    if (req.method === 'POST') {
      const { title, provider, url, embed_type, user_id, role, target_tenant_id } = req.body || {};
      const payload = {
        title,
        provider,
        url,
        embed_type: embed_type || 'role',
        user_id: embed_type === 'user' ? user_id || null : null,
        role: embed_type === 'role' ? (role || 'all') : null,
        // Super admins can specify target tenant, otherwise use current tenant
        tenant_id: (isSuperAdmin && target_tenant_id) ? target_tenant_id : (tenantId || null),
        is_active: true,
        // Mark as super admin embed for cross-tenant visibility
        is_super_admin_embed: isSuperAdmin && embed_type === 'user',
      };
      const { data, error } = await supabase.from('embeds').insert([payload]).select('*').single();
      if (error) throw error;
      return res.status(200).json({ embed: data });
    }

    if (req.method === 'GET') {
      const id = req.query?.id ? String(req.query.id) : null;
      const userId = req.query?.user_id ? String(req.query.user_id) : null;
      
      let query = supabase.from('embeds').select('*');
      
      if (id) {
        query = query.eq('id', id).limit(1);
      } else {
        query = query.order('created_at', { ascending: false }).limit(200);
        
        if (isSuperAdmin) {
          // Super admins can see all embeds
          console.log('🔑 Super admin fetching all embeds');
        } else if (userId) {
          // For regular users, get embeds for their tenant + super admin user embeds for them
          query = query.or(`and(tenant_id.eq.${tenantId}),and(is_super_admin_embed.eq.true,user_id.eq.${userId})`);
        } else if (tenantId) {
          // Default tenant-scoped query
          query = query.eq('tenant_id', tenantId);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (id) {
        return res.status(200).json({ embed: Array.isArray(data) ? data[0] || null : data || null });
      }
      return res.status(200).json({ embeds: data || [] });
    }

    if (req.method === 'PATCH') {
      const id = req.query?.id ? String(req.query.id) : null;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { title, provider, url, embed_type, user_id, role, is_active } = req.body || {};
      const payload = {};
      if (typeof title === 'string') payload.title = title;
      if (typeof provider === 'string') payload.provider = provider;
      if (typeof url === 'string') payload.url = url;
      if (typeof embed_type === 'string') payload.embed_type = embed_type;
      if (embed_type === 'user') payload.user_id = user_id || null;
      if (embed_type === 'role') payload.role = role || null;
      if (typeof is_active === 'boolean') payload.is_active = is_active;
      const { data, error } = await supabase.from('embeds').update(payload).eq('id', id).select('*').single();
      if (error) throw error;
      return res.status(200).json({ embed: data });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id ? String(req.query.id) : null;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('embeds').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('api/embeds error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: true } };


