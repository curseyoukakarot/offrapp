import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key);
}

async function ensureSuper(req, res, next) {
  try {
    const user = req.authedUser;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const supabase = getSupabase();
    const { data } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
    const isSuper = (data || []).some((r) => ['super_admin', 'superadmin', 'super-admin'].includes(String(r.role || '').toLowerCase()));
    if (!isSuper) return res.status(403).json({ error: 'forbidden' });
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// GET /api/super/tenants
router.get('/tenants', ensureSuper, async (req, res) => {
  try {
    const supabase = getSupabase();
    const q = String(req.query.q || '').trim();
    const tier = String(req.query.tier || '').trim();
    const status = String(req.query.status || '').trim();
    let query = supabase.from('tenants').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (q) query = query.ilike('name', `%${q}%`);
    if (tier) query = query.eq('tier', tier);
    if (status) query = query.eq('status', status);
    const { data, error, count } = await query;
    if (error) throw error;
    // Compute seats_used fallback via memberships count when missing
    const { data: memAgg } = await supabase
      .from('memberships')
      .select('tenant_id, count:count(*)')
      .in('tenant_id', (data || []).map((t) => t.id));
    const usedByTenant = new Map((memAgg || []).map((m) => [m.tenant_id, Number(m.count || 0)]));
    const items = (data || []).map((t) => ({
      ...t,
      tier: t.tier || 'starter',
      status: t.status || 'active',
      seats_total: typeof t.seats_total === 'number' ? t.seats_total : 3,
      seats_used: typeof t.seats_used === 'number' ? t.seats_used : (usedByTenant.get(t.id) || 0),
      slug: t.slug || (t.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }));
    res.json({ items, page: 1, pageSize: items.length, total: count || items.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/super/tenants/:id/users
router.get('/tenants/:id/users', ensureSuper, async (req, res) => {
  try {
    const supabase = getSupabase();
    const tenantId = req.params.id;
    const { data: mems, error: memErr } = await supabase
      .from('memberships')
      .select('user_id, role, status, created_at')
      .eq('tenant_id', tenantId);
    if (memErr) throw memErr;
    const userIds = Array.from(new Set((mems || []).map((m) => m.user_id)));
    if (userIds.length === 0) return res.json({ items: [] });
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id, email, name, last_login_at')
      .in('id', userIds);
    if (uErr) throw uErr;
    const items = (mems || []).map((m) => {
      const u = (users || []).find((x) => x.id === m.user_id) || { id: m.user_id, email: '', name: null, last_login_at: null };
      return { id: u.id, email: u.email, name: u.name, last_login_at: u.last_login_at, role: m.role, status: m.status || 'active' };
    });
    res.json({ items, page: 1, pageSize: items.length, total: items.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/super/tenants/:id
router.patch('/tenants/:id', ensureSuper, async (req, res) => {
  try {
    const supabase = getSupabase();
    const tenantId = req.params.id;
    const { name, tier, seats_total, status } = req.body || {};
    if (typeof seats_total === 'number') {
      // Guard: seats_total >= seats_used
      const { data: t } = await supabase.from('tenants').select('seats_used').eq('id', tenantId).single();
      if (t && seats_total < (t.seats_used || 0)) return res.status(400).json({ error: 'seats_total cannot be less than seats_used' });
    }
    const updates = {};
    if (name) updates.name = name;
    if (tier) updates.tier = tier;
    if (status) updates.status = status;
    if (typeof seats_total === 'number') updates.seats_total = seats_total;
    const { data, error } = await supabase.from('tenants').update(updates).eq('id', tenantId).select('*').single();
    if (error) throw error;
    res.json({ tenant: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/super/invitations
router.post('/invitations', ensureSuper, async (req, res) => {
  try {
    const supabase = getSupabase();
    const body = req.body || {};
    const inviter = req.authedUser?.id || null;
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    if (body.tenant) {
      // New tenant + invite
      const { name, slug, tier, seats_total } = body.tenant || {};
      const { data: tenant, error: terr } = await supabase
        .from('tenants')
        .insert([{ name, slug, tier, seats_total, status: 'active' }])
        .select('*')
        .single();
      if (terr) throw terr;
      const { data: invite, error: ierr } = await supabase
        .from('invitations')
        .insert([{ email: body.admin.email, tenant_id: tenant.id, role: 'owner', token, expires_at: expires, invited_by: inviter, bypass_billing: !!body.bypass_billing }])
        .select('id, token')
        .single();
      if (ierr) throw ierr;
      return res.json({ invitationId: invite.id, token: invite.token });
    }

    // Existing tenant invite
    const { email, role, tenant_id } = body;
    const { data: invite, error } = await supabase
      .from('invitations')
      .insert([{ email, tenant_id, role, token, expires_at: expires, invited_by: inviter }])
      .select('id, token')
      .single();
    if (error) throw error;
    res.json({ invitationId: invite.id, token: invite.token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public accept (no auth)
router.post('/public/invitations/accept', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { token } = req.body || {};
    const { data: inv, error } = await supabase.from('invitations').select('*').eq('token', token).single();
    if (error || !inv) return res.status(400).json({ error: 'invalid_token' });
    if (inv.status !== 'pending') return res.status(400).json({ error: 'not_pending' });
    if (new Date(inv.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'expired' });
    // Find or create user (by email) – assume auth.users already created via magic invite flow elsewhere
    const { data: u } = await supabase.from('users').select('id').eq('email', inv.email).maybeSingle();
    const userId = u?.id || null;
    if (inv.tenant_id && userId) {
      await supabase.from('memberships').upsert({ tenant_id: inv.tenant_id, user_id: userId, role: inv.role }, { onConflict: 'tenant_id,user_id' });
    }
    await supabase.from('invitations').update({ status: 'accepted' }).eq('id', inv.id);
    const redirect = inv.bypass_billing ? `/onboarding?tenant=${inv.tenant_id}&bypass_billing=1` : '/login';
    res.json({ ok: true, redirect });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;


