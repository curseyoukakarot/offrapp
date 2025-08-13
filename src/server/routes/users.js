import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key);
}

async function isSuper(userId) {
  const supabase = getSupabase();
  const { data } = await supabase.from('user_global_roles').select('role').eq('user_id', userId);
  return (data || []).some((r) => ['super_admin', 'superadmin', 'super-admin'].includes(String(r.role || '').toLowerCase()));
}

router.get('/', async (req, res) => {
  try {
    const user = req.authedUser;
    if (!user || !(await isSuper(user.id))) return res.status(403).json({ error: 'forbidden' });
    const q = String(req.query.query || '').toLowerCase();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role')
      .ilike('email', `%${q}%`)
      .limit(50);
    if (error) throw error;
    res.json({ users: data || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Recent users per tenant (by membership created_at) or global fallback
router.get('/recent', async (req, res) => {
  try {
    const user = req.authedUser;
    const supabase = getSupabase();
    const limit = Math.min(parseInt(String(req.query.limit || '3'), 10) || 3, 20);
    const tenantId = String(req.headers['x-tenant-id'] || '').trim();

    if (!user) return res.status(401).json({ error: 'unauthorized' });

    // Allow super admins to view any tenant/global
    const superFlag = await isSuper(user.id);

    // If tenant specified, ensure requester is either super or member of that tenant
    if (tenantId && !superFlag) {
      const { data: membership } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (!membership) return res.status(403).json({ error: 'forbidden' });
    }

    if (tenantId) {
      const { data: mems, error: memErr } = await supabase
        .from('memberships')
        .select('user_id, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (memErr) throw memErr;
      const ids = Array.from(new Set((mems || []).map((m) => m.user_id)));
      if (ids.length === 0) return res.json({ users: [] });
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .in('id', ids)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (uErr) throw uErr;
      return res.json({ users: users || [] });
    }

    // Global fallback: newest users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ users: users || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;


