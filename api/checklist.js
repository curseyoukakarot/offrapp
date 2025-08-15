import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const tenantId = String(req.headers['x-tenant-id'] || '').trim();
  const userId = String(req.headers['x-user-id'] || '').trim();

  try {
    if (req.method === 'GET') {
      if (!tenantId || !userId) return res.status(200).json({ items: [] });
      const { data, error } = await supabase
        .from('checklist_items')
        .select('id, title, completed')
        .eq('tenant_id', tenantId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return res.status(200).json({ items: data || [] });
    }
    if (req.method === 'PATCH') {
      const { id, completed } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase
        .from('checklist_items')
        .update({ completed: !!completed })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return res.status(200).json({ item: data });
    }
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('api/checklist error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: true } };
