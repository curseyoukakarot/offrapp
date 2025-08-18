import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getAuthedUser(req) {
  const supabase = getSupabase();
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data?.user || null;
}

async function ensureSuper(req, res) {
  const supabase = getSupabase();
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
  const isSuper = (roles || []).some((r) => ['super_admin', 'superadmin', 'super-admin'].includes(String(r.role || '').toLowerCase()));
  if (!isSuper) {
    res.status(403).json({ error: 'forbidden' });
    return null;
  }
  return { supabase, user };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const ctx = await ensureSuper(req, res);
    if (!ctx) return;
    const { supabase } = ctx;
    if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
    const tenantId = String(req.query.id || '').trim();
    if (!tenantId) return res.status(400).json({ error: 'id required' });

    const { data: mems, error: memErr } = await supabase
      .from('memberships')
      .select('user_id, role, status, created_at')
      .eq('tenant_id', tenantId);
    if (memErr) throw memErr;
    const userIds = Array.from(new Set((mems || []).map((m) => m.user_id)));
    if (userIds.length === 0) return res.status(200).json({ items: [] });
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);
    if (uErr) throw uErr;
    const items = (mems || []).map((m) => {
      const u = (users || []).find((x) => x.id === m.user_id) || { id: m.user_id, email: '' };
      return { id: u.id, email: u.email, name: null, last_login_at: null, role: m.role, status: m.status || 'active' };
    });
    return res.status(200).json({ items, page: 1, pageSize: items.length, total: items.length });
  } catch (e) {
    console.error('api/super/tenant-users error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


