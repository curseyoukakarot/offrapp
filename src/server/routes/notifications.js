import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { logAudit } from '../utils/audit.js';

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

// Announcements
router.post('/announce', async (req, res) => {
  try {
    const user = req.authedUser;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (!(await isSuper(user.id))) return res.status(403).json({ error: 'forbidden' });
    const { title, message, audience, startAt, endAt, tenantIds, plan } = req.body || {};
    const supabase = getSupabase();
    const { data, error } = await supabase.from('announcements').insert([
      { title, message, audience, start_at: startAt, end_at: endAt, tenant_ids: tenantIds || null, plan: plan || null, created_by: user.id },
    ]).select('*').single();
    if (error) throw error;
    await logAudit({ action: 'announcement.create', entityType: 'announcement', entityId: data.id, reason: null, before: null, after: data, req });
    res.json({ ok: true, announcement: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    const tenantId = req.headers['x-tenant-id'];
    const now = new Date().toISOString();
    // Basic filter: active window, and audience match (all or includes tenant)
    let query = supabase.from('announcements').select('*').lte('start_at', now).gte('end_at', now);
    const { data, error } = await query;
    if (error) throw error;
    const banners = (data || []).filter((a) => {
      if (a.audience === 'all') return true;
      if (a.audience === 'tenantIds' && tenantId) return Array.isArray(a.tenant_ids) && a.tenant_ids.includes(tenantId);
      if (a.audience === 'plan' && a.plan) return true; // stub
      return false;
    });
    res.json({ banners });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// History (simple list)
router.get('/history', async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ history: data || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Ops rules
router.post('/rules', async (req, res) => {
  try {
    const user = req.authedUser;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (!(await isSuper(user.id))) return res.status(403).json({ error: 'forbidden' });
    const supabase = getSupabase();
    const { metric, op, value, window, actions } = req.body || {};
    const { data, error } = await supabase.from('notification_rules').insert([
      { metric, op, value, window, actions },
    ]).select('*').single();
    if (error) throw error;
    await logAudit({ action: 'notification_rule.create', entityType: 'notification_rule', entityId: data.id, reason: null, before: null, after: data, req });
    res.json({ rule: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/rules', async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('notification_rules').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ rules: data || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;


