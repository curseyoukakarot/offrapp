import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { ensureClientCapacity, ensureTeamCapacity } from '../middleware/enforcePlanLimits.ts';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  return createClient(url, key);
}

function isSuperAdmin(roles: any[]): boolean {
  return roles.some((r) => ['super_admin', 'superadmin', 'super-admin'].includes((r.role || '').toLowerCase()));
}

// Middleware to enrich req.user-like info via Authorization: Bearer
router.use(async (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
    if (!token) return next();
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser(token);
    (req as any).authedUser = data.user || null;
    next();
  } catch (e) {
    next();
  }
});

// GET /api/tenants (super_admin)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).authedUser;
    let superFlag = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      superFlag = isSuperAdmin(roles || []);
    }
    if (!superFlag) return res.status(403).json({ error: 'forbidden' });
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    res.json({ tenants: data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/tenants (super_admin)
router.post('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).authedUser;
    let superFlag = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      superFlag = isSuperAdmin(roles || []);
    }
    if (!superFlag) return res.status(403).json({ error: 'forbidden' });
    const { name, slug, plan } = req.body || {};
    const { data, error } = await supabase.from('tenants').insert([{ name, slug, plan }]).select('*').single();
    if (error) throw error;
    res.json({ tenant: data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/tenants/:id (super_admin or tenant member)
router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).authedUser;
    const tid = req.params.id;
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []).valueOf();
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('id').eq('user_id', user.id).eq('tenant_id', tid).maybeSingle();
        allowed = !!mem;
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const { data, error } = await supabase.from('tenants').select('*').eq('id', tid).single();
    if (error) throw error;
    res.json({ tenant: data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Membership mutations (tenant admin)
router.post('/:id/memberships', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).authedUser;
    const tid = req.params.id;
    const { user_id, role } = req.body || {};
    // authorize: super OR tenant admin
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes((mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    // Enforce plan limits before upsert
    const normalizedRole = String(role || '').toLowerCase();
    const isTeamRole = ['owner','admin','editor'].includes(normalizedRole);
    const isClientRole = ['member','client','jobseeker','recruitpro','role1','role2','role3'].includes(normalizedRole);
    try {
      if (isTeamRole) {
        await ensureTeamCapacity(tid, supabase);
      } else if (isClientRole) {
        await ensureClientCapacity(tid, supabase);
      }
    } catch (e) {
      const status = e.status || 400;
      return res.status(status).json({ error: e.code || 'BAD_REQUEST', message: e.message || 'Plan limit reached' });
    }
    const { data, error } = await supabase.from('memberships').upsert({ tenant_id: tid, user_id, role }, { onConflict: 'tenant_id,user_id' }).select('*').single();
    if (error) throw error;
    res.json({ membership: data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id/memberships/:userId', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).authedUser;
    const tid = req.params.id;
    const targetUser = req.params.userId;
    const { role } = req.body || {};
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes((mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const { data, error } = await supabase.from('memberships').update({ role }).eq('tenant_id', tid).eq('user_id', targetUser).select('*').single();
    if (error) throw error;
    res.json({ membership: data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id/memberships/:userId', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).authedUser;
    const tid = req.params.id;
    const targetUser = req.params.userId;
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes((mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const { error } = await supabase.from('memberships').delete().eq('tenant_id', tid).eq('user_id', targetUser);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Domain flows (stubs)
router.post('/:id/domains', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).authedUser;
    const tid = req.params.id;
    const { domain, type } = req.body || {};
    // tenant admin check
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes((mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const txtToken = Math.random().toString(36).slice(2);
    const { data, error } = await supabase.from('tenant_domains').insert([{ tenant_id: tid, domain, type, txt_token: txtToken }]).select('*').single();
    if (error) throw error;
    res.json({ domain: data, txt_token: txtToken });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/domains/:domain/verify', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).authedUser;
    const tid = req.params.id;
    const domain = req.params.domain;
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes((mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    // Stub: mark verified and set ssl_status
    const { data, error } = await supabase
      .from('tenant_domains')
      .update({ verified_at: new Date().toISOString(), ssl_status: 'provisioned' })
      .eq('tenant_id', tid)
      .eq('domain', domain)
      .select('*')
      .single();
    if (error) throw error;
    res.json({ domain: data });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id/domains/:domain', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = (req as any).authedUser;
    const tid = req.params.id;
    const domain = req.params.domain;
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes((mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const { error } = await supabase.from('tenant_domains').delete().eq('tenant_id', tid).eq('domain', domain);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;


