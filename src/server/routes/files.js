import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key);
}

// List files for a tenant (or all if no tenant header)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const tenantId = String(req.headers['x-tenant-id'] || '').trim();
    const limit = Math.min(parseInt(String(req.query.limit || '100'), 10) || 100, 500);
    let query = supabase.from('files').select('*').order('created_at', { ascending: false }).limit(limit);
    if (tenantId) query = query.eq('tenant_id', tenantId);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ files: data || [] });
  } catch (e) {
    console.error('GET /api/files error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Insert a file row (expects title, file_url, user_id, assigned_roles)
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const tenantId = String(req.headers['x-tenant-id'] || '').trim() || null;
    const { title, file_url, user_id, assigned_roles } = req.body || {};
    const payload = {
      title,
      file_url,
      user_id: user_id || null,
      assigned_roles: Array.isArray(assigned_roles) && assigned_roles.length ? assigned_roles : null,
      tenant_id: tenantId,
    };
    const { data, error } = await supabase.from('files').insert([payload]).select('*').single();
    if (error) throw error;
    res.json({ file: data });
  } catch (e) {
    console.error('POST /api/files error:', e);
    res.status(500).json({ error: e.message });
  }
});

// List users for a tenant via memberships, avoiding client-side RLS
router.get('/tenant-users', async (req, res) => {
  try {
    const supabase = getSupabase();
    const tenantId = String(req.headers['x-tenant-id'] || '').trim();
    if (!tenantId) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify({ users: [] }));
    }
    try {
      const { data: mems, error: memErr } = await supabase
        .from('memberships')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .limit(1000);
      if (memErr) throw memErr;
      const ids = Array.from(new Set((mems || []).map((m) => m.user_id)));
      if (!ids.length) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).send(JSON.stringify({ users: [] }));
      }
      // Fetch user records directly from auth using service role to avoid public.users schema assumptions
      const users = [];
      for (const uid of ids) {
        try {
          const { data: adminUser, error: aErr } = await supabase.auth.admin.getUserById(uid);
          if (!aErr && adminUser?.user) {
            users.push({ id: uid, email: adminUser.user.email || '', created_at: adminUser.user.created_at });
          }
        } catch (_e) {
          // ignore individual failures
        }
      }
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify({ users }));
    } catch (inner) {
      console.warn('membership-based user lookup failed:', inner.message || inner);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify({ users: [] }));
    }
  } catch (e) {
    console.error('GET /api/files/tenant-users error:', e);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ users: [] }));
  }
});

export default router;


