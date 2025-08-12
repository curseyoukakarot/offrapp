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

export default router;


