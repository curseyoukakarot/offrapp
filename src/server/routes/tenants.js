import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logAudit } from '../utils/audit.js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key);
}

function isSuperAdmin(roles = []) {
  return roles.some((r) => ['super_admin', 'superadmin', 'super-admin'].includes(String(r.role || '').toLowerCase()));
}

router.use(async (req, _res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
    if (!token) return next();
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser(token);
    req.authedUser = data.user || null;
  } catch (_e) {
    // ignore auth errors -> treated as anonymous
  }
  next();
});

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    let superFlag = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      superFlag = isSuperAdmin(roles || []);
    }
    if (!superFlag) return res.status(403).json({ error: 'forbidden' });
    const { data, error } = await supabase.from('tenants').select('*');
    if (error) throw error;
    res.json({ tenants: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    let superFlag = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      superFlag = isSuperAdmin(roles || []);
    }
    if (!superFlag) return res.status(403).json({ error: 'forbidden' });
    const { name, slug, plan } = req.body || {};
    const { data, error } = await supabase.from('tenants').insert([{ name, slug, plan }]).select('*').single();
    if (error) throw error;
    await logAudit({ action: 'tenant.create', entityType: 'tenant', entityId: data.id, reason: null, before: null, after: data, req });
    res.json({ tenant: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const tid = req.params.id;
    // Return minimal tenant info for labeling. Service role bypasses RLS.
    const { data, error } = await supabase.from('tenants').select('*').eq('id', tid).maybeSingle();
    if (error) throw error;
    res.json({ tenant: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/memberships', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    const tid = req.params.id;
    const { user_id, role } = req.body || {};
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes(String(mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const { data, error } = await supabase.from('memberships').upsert({ tenant_id: tid, user_id, role }, { onConflict: 'tenant_id,user_id' }).select('*').single();
    if (error) throw error;
    await logAudit({ action: 'membership.upsert', entityType: 'membership', entityId: data.id, tenantId: tid, reason: null, before: null, after: data, req });
    res.json({ membership: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id/memberships/:userId', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    const tid = req.params.id;
    const targetUser = req.params.userId;
    const { role } = req.body || {};
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes(String(mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const { data, error } = await supabase.from('memberships').update({ role }).eq('tenant_id', tid).eq('user_id', targetUser).select('*').single();
    if (error) throw error;
    await logAudit({ action: 'membership.update', entityType: 'membership', entityId: data.id, tenantId: tid, reason: null, before: null, after: data, req });
    res.json({ membership: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id/memberships/:userId', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    const tid = req.params.id;
    const targetUser = req.params.userId;
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes(String(mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const { error } = await supabase.from('memberships').delete().eq('tenant_id', tid).eq('user_id', targetUser);
    if (error) throw error;
    await logAudit({ action: 'membership.delete', entityType: 'membership', entityId: targetUser, tenantId: tid, reason: null, before: null, after: null, req });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/domains', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    const tid = req.params.id;
    const { domain, type } = req.body || {};
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes(String(mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const txtToken = Math.random().toString(36).slice(2);
    const { data, error } = await supabase.from('tenant_domains').insert([{ tenant_id: tid, domain, type, txt_token: txtToken }]).select('*').single();
    if (error) throw error;
    await logAudit({ action: 'domain.add', entityType: 'tenant_domain', entityId: data.id, tenantId: tid, reason: null, before: null, after: data, req });
    res.json({ domain: data, txt_token: txtToken });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/domains/:domain/verify', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    const tid = req.params.id;
    const domain = req.params.domain;
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes(String(mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const { data, error } = await supabase
      .from('tenant_domains')
      .update({ verified_at: new Date().toISOString(), ssl_status: 'provisioned' })
      .eq('tenant_id', tid)
      .eq('domain', domain)
      .select('*')
      .single();
    if (error) throw error;
    await logAudit({ action: 'domain.verify', entityType: 'tenant_domain', entityId: data.id, tenantId: tid, reason: null, before: null, after: data, req });
    res.json({ domain: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id/domains/:domain', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    const tid = req.params.id;
    const domain = req.params.domain;
    let allowed = false;
    if (user) {
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      allowed = isSuperAdmin(roles || []);
      if (!allowed) {
        const { data: mem } = await supabase.from('memberships').select('role').eq('tenant_id', tid).eq('user_id', user.id).maybeSingle();
        allowed = !!mem && ['owner', 'admin'].includes(String(mem.role || '').toLowerCase());
      }
    }
    if (!allowed) return res.status(403).json({ error: 'forbidden' });
    const { error } = await supabase.from('tenant_domains').delete().eq('tenant_id', tid).eq('domain', domain);
    if (error) throw error;
    await logAudit({ action: 'domain.remove', entityType: 'tenant_domain', entityId: null, tenantId: tid, reason: null, before: null, after: null, req });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;


