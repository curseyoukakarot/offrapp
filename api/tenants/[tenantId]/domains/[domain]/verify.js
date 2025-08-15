import { createClient } from '@supabase/supabase-js';
import { resolveNestbaseTxt } from '../../../_dns';
import { vercelAddDomain, vercelGetDomain } from '../../../_vercelClient';
import { hasFeature } from '../../../_plans';

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: { user } } = await supabase.auth.getUser(req.headers.authorization?.replace('Bearer ', '') || undefined);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const isAdmin = await assertAdmin(tenantId, user.id);
    if (!isAdmin) return res.status(403).json({ error: 'Forbidden' });

    const { data: tenant } = await svc().from('tenants').select('plan').eq('id', tenantId).maybeSingle();
    if (!hasFeature(tenant?.plan || 'starter', 'custom_domain')) return res.status(403).json({ error: 'Plan does not include custom domains' });
    const { data: row, error } = await svc().from('tenant_domains').select('*').eq('tenant_id', tenantId).eq('domain', domain).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    if (!row) return res.status(404).json({ error: 'Domain not found' });

    const txts = await resolveNestbaseTxt(domain);
    const ok = txts.includes(row.txt_token);
    if (!ok) return res.status(409).json({ verified: false, reason: 'TXT not found' });

    await vercelAddDomain(domain);
    // Poll up to ~25s
    let tries = 0; let ready = false; let last;
    while (tries < 12 && !ready) {
      await new Promise(r => setTimeout(r, 500 + tries * 150));
      last = await vercelGetDomain(domain).catch(() => null);
      ready = !!last && (last.apexName || last.verified) !== false; // tolerate shape
      tries++;
    }

    if (!ready) {
      await svc().from('tenant_domains').update({ ssl_status: 'failed' }).eq('id', row.id);
      return res.status(409).json({ verified: false, reason: 'SSL pending/failed' });
    }

    await svc().from('tenant_domains').update({ verified_at: new Date().toISOString(), ssl_status: 'ready' }).eq('id', row.id);
    return res.status(200).json({ verified: true, ssl: 'ready' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


