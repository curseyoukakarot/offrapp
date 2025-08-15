import { createClient } from '@supabase/supabase-js';

function defaults() {
  return {
    name: 'Offr.app',
    role_labels: {
      admin: 'Admin',
      recruitpro: 'RecruitPro',
      jobseeker: 'Job Seeker',
      client: 'Client',
    },
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const tenantId = String(req.headers['x-tenant-id'] || '').trim();
  if (!tenantId) return res.status(200).json(defaults());

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase.from('tenants').select('*').eq('id', tenantId).maybeSingle();
      if (error) throw error;
      return res.status(200).json({
        name: data?.name || defaults().name,
        role_labels: data?.role_labels || defaults().role_labels,
      });
    }

    if (req.method === 'PATCH') {
      try {
        const auth = req.headers.authorization || '';
        const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
        if (!token) return res.status(401).json({ error: 'unauthorized' });
        const { data: userRes } = await supabase.auth.getUser(token);
        const uid = userRes?.user?.id;
        if (!uid) return res.status(401).json({ error: 'unauthorized' });
        const { data: mem } = await supabase
          .from('memberships')
          .select('role')
          .eq('tenant_id', tenantId)
          .eq('user_id', uid)
          .maybeSingle();
        const role = String(mem?.role || '').toLowerCase();
        if (!mem || !['owner', 'admin'].includes(role)) return res.status(403).json({ error: 'forbidden' });
      } catch (_e) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      const { name, role_labels } = req.body || {};
      const payload = {};
      if (typeof name === 'string' && name.trim()) payload.name = name.trim();
      if (role_labels && typeof role_labels === 'object') payload.role_labels = role_labels;
      if (Object.keys(payload).length === 0) return res.status(400).json({ error: 'no fields' });
      const { data, error } = await supabase.from('tenants').update(payload).eq('id', tenantId).select('*').maybeSingle();
      if (error) throw error;
      return res.status(200).json({
        name: data?.name || defaults().name,
        role_labels: data?.role_labels || defaults().role_labels,
      });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('tenant-config error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: true } };


