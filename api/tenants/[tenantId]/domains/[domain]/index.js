import { createClient } from '@supabase/supabase-js';
import { vercelRemoveDomain } from '../../../_vercelClient';

function svc() { return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); }

async function assertAdmin(tenantId, userId) {
  const s = svc();
  const { data, error } = await s.from('memberships').select('role').eq('tenant_id', tenantId).eq('user_id', userId).maybeSingle();
  if (error) throw error; if (!data) return false; return data.role === 'admin' || data.role === 'super_admin';
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const tenantId = req.query.tenantId;
  const domain = String(req.query.domain || '').toLowerCase();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', '') || undefined);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const isAdmin = await assertAdmin(tenantId, user.id);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    // Attempt to remove from Vercel; tolerate 404 (already removed)
    await vercelRemoveDomain(domain).catch(() => {});
    await svc().from('tenant_domains').delete().eq('tenant_id', tenantId).eq('domain', domain);
    return res.status(204).end();
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


