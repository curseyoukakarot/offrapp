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

    const q = String(req.query.q || '').trim();
    const tier = String(req.query.tier || '').trim();
    const status = String(req.query.status || '').trim();
    let query = supabase.from('tenants').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (q) query = query.ilike('name', `%${q}%`);
    if (tier) query = query.eq('tier', tier);
    if (status) query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) throw error;

    const ids = (data || []).map((t) => t.id);
    let usedByTenant = new Map();
    if (ids.length > 0) {
      const { data: memAgg } = await supabase
        .from('memberships')
        .select('tenant_id, count:count(*)')
        .in('tenant_id', ids);
      usedByTenant = new Map((memAgg || []).map((m) => [m.tenant_id, Number(m.count || 0)]));
    }
    const items = (data || []).map((t) => ({
      ...t,
      tier: t.tier || 'starter',
      status: t.status || 'active',
      seats_total: typeof t.seats_total === 'number' ? t.seats_total : 3,
      seats_used: typeof t.seats_used === 'number' ? t.seats_used : (usedByTenant.get(t.id) || 0),
      slug: t.slug || (t.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
    return res.status(200).json({ items, page: 1, pageSize: items.length, total: count || items.length });
  } catch (e) {
    console.error('api/super/tenants error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


