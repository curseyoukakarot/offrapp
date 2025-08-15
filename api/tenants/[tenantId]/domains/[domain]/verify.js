import { createClient } from '@supabase/supabase-js';
import { hasFeature } from '../../../_plans';
import { resolveNestbaseTxt } from '../../../_dns';
import { vercelAddDomain, vercelGetDomain } from '../../../_vercelClient';

function svc() { return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); }

async function getUser(req) {
  const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const { data } = await anon.auth.getUser(token || undefined);
  return data?.user || null;
}

async function assertAdmin(tenantId, userId) {
  const s = svc();
  const { data, error } = await s.from('memberships').select('role').eq('tenant_id', tenantId).eq('user_id', userId).maybeSingle();
  if (error) throw error; if (!data) return false; return ['admin','owner','super_admin'].includes(String(data.role || '').toLowerCase());
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const tenantId = req.query.tenantId;
  const domain = String(req.query.domain || '').toLowerCase();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const isAdmin = await assertAdmin(tenantId, user.id);
    if (!isAdmin) return res.status(403).json({ error: 'forbidden' });
    if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) return res.status(500).json({ error: 'MISSING_ENV' });

    const { data: tenant } = await svc().from('tenants').select('plan').eq('id', tenantId).maybeSingle();
    if (!hasFeature(tenant?.plan || 'starter', 'custom_domain')) return res.status(403).json({ error: 'Plan does not include custom domains' });
    const { data: row, error } = await svc().from('tenant_domains').select('*').eq('tenant_id', tenantId).eq('domain', domain).maybeSingle();
    if (error) return res.status(400).json({ error: error.message });
    if (!row) return res.status(404).json({ error: 'Domain not found' });

    const txts = await resolveNestbaseTxt(domain);
    if (!txts.includes(row.txt_token)) return res.status(409).json({ verified: false, reason: 'TXT_MISMATCH' });

    const added = await vercelAddDomain(domain);
    if (added && added.rateLimited) { await svc().from('tenant_domains').update({ ssl_status: 'failed' }).eq('id', row.id); return res.status(429).json({ verified: false, reason: 'RATE_LIMIT' }); }

    let tries = 0; let ready = false; let last;
    while (tries < 12 && !ready) {
      await new Promise(r => setTimeout(r, 500 + tries * 150));
      const got = await vercelGetDomain(domain).catch(() => null);
      if (got && got.rateLimited) { tries++; continue; }
      last = got?.json || {};
      ready = !!last && (last.apexName || last.verified) !== false;
      tries++;
    }
    if (!ready) { await svc().from('tenant_domains').update({ ssl_status: 'failed' }).eq('id', row.id); return res.status(409).json({ verified: false, reason: 'RATE_LIMIT' }); }
    await svc().from('tenant_domains').update({ verified_at: new Date().toISOString(), ssl_status: 'ready' }).eq('id', row.id);
    return res.status(200).json({ verified: true, ssl: 'ready' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


