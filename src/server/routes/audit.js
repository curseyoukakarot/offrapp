import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key);
}

router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const limit = Math.min(parseInt(req.query.limit as string) || 200, 1000);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id, actor_user_id, action, entity_type, entity_id, tenant_id, reason, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    res.json({ logs: data || [] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/export', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('created_at, actor_user_id, action, entity_type, entity_id, tenant_id, reason')
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) throw error;
    const rows = data || [];
    const header = 'created_at,actor_user_id,action,entity_type,entity_id,tenant_id,reason\n';
    const csv = header + rows.map((r) => [r.created_at, r.actor_user_id, r.action, r.entity_type, r.entity_id, r.tenant_id, r.reason].map((v) => (v == null ? '' : String(v).replace(/,/g, ';'))).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit.csv"');
    res.send(csv);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;


