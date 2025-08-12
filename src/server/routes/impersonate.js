import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { startImpersonation, stopImpersonation } from '../middleware/impersonation.js';
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

router.post('/start', async (req, res) => {
  try {
    const user = req.authedUser;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (!(await isSuper(user.id))) return res.status(403).json({ error: 'forbidden' });
    const { targetUserId, reason } = req.body || {};
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });
    startImpersonation(user.id, targetUserId, reason);
    await logAudit({ action: 'impersonate.start', entityType: 'user', entityId: targetUserId, reason, before: null, after: null, req });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/stop', async (req, res) => {
  try {
    const user = req.authedUser;
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (!(await isSuper(user.id))) return res.status(403).json({ error: 'forbidden' });
    stopImpersonation(user.id);
    await logAudit({ action: 'impersonate.stop', entityType: 'user', entityId: user.id, reason: null, before: null, after: null, req });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;


