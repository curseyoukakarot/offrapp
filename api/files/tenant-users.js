import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const tenantId = String(req.headers['x-tenant-id'] || '').trim();
    if (!tenantId) return res.status(200).json({ users: [] });

    const { data: mems, error: memErr } = await supabase
      .from('memberships')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .limit(1000);
    if (memErr) throw memErr;

    const ids = Array.from(new Set((mems || []).map((m) => m.user_id)));
    const users = [];
    for (const uid of ids) {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(uid);
        if (!error && data?.user) {
          users.push({ id: uid, email: data.user.email || '', created_at: data.user.created_at });
        }
      } catch (_e) {
        // ignore individual failures
      }
    }
    return res.status(200).json({ users });
  } catch (e) {
    console.error('tenant-users handler error', e);
    return res.status(200).json({ users: [] });
  }
}

export const config = { api: { bodyParser: false } };

