import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const tenantId = String(req.headers['x-tenant-id'] || '').trim();

  try {
    if (req.method === 'POST') {
      const { title, provider, url, embed_type, user_id, role } = req.body || {};
      const payload = {
        title,
        provider,
        url,
        embed_type: embed_type || 'role',
        user_id: embed_type === 'user' ? user_id || null : null,
        role: embed_type === 'role' ? (role || 'all') : null,
        tenant_id: tenantId || null,
        is_active: true,
      };
      const { data, error } = await supabase.from('embeds').insert([payload]).select('*').single();
      if (error) throw error;
      return res.status(200).json({ embed: data });
    }

    if (req.method === 'GET') {
      let query = supabase.from('embeds').select('*').order('created_at', { ascending: false }).limit(200);
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ embeds: data || [] });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('api/embeds error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: true } };


