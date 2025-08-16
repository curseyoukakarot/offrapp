import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { hasFeature } from './_plans.js';
import { vercelRemoveDomain } from './_vercelClient.js';

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
  const tenantId = String(req.headers['x-tenant-id'] || '').trim();
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    if (!tenantId) return res.status(400).json({ error: 'missing tenant id' });
    const isAdmin = await assertAdmin(tenantId, user.id);
    if (!isAdmin) return res.status(403).json({ error: 'forbidden' });

    if (req.method === 'GET') {
      const { data, error } = await svc().from('tenant_domains').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
      if (error) return res.status(400).json({ error: error.message });
      const result = (data || []).map((d) => ({ ...d, txt_token: undefined }));
      return res.status(200).json({ domains: result });
    }

    if (req.method === 'POST') {
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
      const domainRaw = String(body.domain || '').trim().toLowerCase();
      if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domainRaw)) return res.status(400).json({ error: 'Invalid domain' });
      const { data: tenant } = await svc().from('tenants').select('plan').eq('id', tenantId).maybeSingle();
      if (!hasFeature(tenant?.plan || 'starter', 'custom_domain')) return res.status(403).json({ error: 'Plan does not include custom domains' });
      const type = domainRaw.split('.').length === 2 ? 'apex' : 'sub';
      const txt = crypto.randomBytes(24).toString('hex');
      const { data, error } = await svc().from('tenant_domains').insert({ tenant_id: tenantId, domain: domainRaw, type, txt_token: txt, ssl_status: 'pending' }).select('*').single();
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ domain: data.domain, type: data.type, txtRecord: { name: `_nestbase.${data.domain}`, type: 'TXT', value: txt } });
    }

    if (req.method === 'DELETE') {
      const chunks = []; for await (const c of req) chunks.push(c);
      let body = {};
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch {}
      const domain = String(body.domain || req.query.domain || '').toLowerCase();
      if (!domain) return res.status(400).json({ error: 'domain required' });
      await vercelRemoveDomain(domain).catch(() => {});
      await svc().from('tenant_domains').delete().eq('tenant_id', tenantId).eq('domain', domain);
      return res.status(204).end();
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


