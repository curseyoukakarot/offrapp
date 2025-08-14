import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const tenantId = String(req.headers['x-tenant-id'] || '').trim();

  try {
    if (req.method === 'GET') {
      const limit = Math.min(parseInt(String(req.query.limit || '100'), 10) || 100, 500);
      let query = supabase.from('files').select('*').order('created_at', { ascending: false }).limit(limit);
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ files: data || [] });
    }

    if (req.method === 'POST') {
      const { title, file_url, user_id, assigned_roles } = req.body || {};
      const payload = {
        title,
        file_url,
        user_id: user_id || null,
        assigned_roles: Array.isArray(assigned_roles) && assigned_roles.length ? assigned_roles : null,
        tenant_id: tenantId || null,
      };
      const { data, error } = await supabase.from('files').insert([payload]).select('*').single();
      if (error) throw error;
      return res.status(200).json({ file: data });
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('api/files error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };

