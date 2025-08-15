import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { hasFeature } from '../_plans';
import { resolveNestbaseTxt } from '../_dns';
import { vercelAddDomain, vercelGetDomain, vercelRemoveDomain } from '../_vercelClient';

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
  if (error) throw error; if (!data) return false; return ['admin', 'super_admin', 'owner'].includes(String(data.role).toLowerCase());
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const segments = (req.url.split('?')[0] || '').split('/').filter(Boolean).slice(2); // after /api/tenants
    // segments: [tenantId, 'domains', ...]
    const [tenantId, section, p2, p3] = segments;
    if (!tenantId) return res.status(404).json({ error: 'not found' });
    const isAdmin = await assertAdmin(tenantId, user.id);
    if (!isAdmin) return res.status(403).json({ error: 'forbidden' });

    if (section === 'domains') {
      // Create/list
      if ((req.method === 'POST' || req.method === 'GET') && !p2) {
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
        if (req.method === 'GET') {
          const { data, error } = await svc().from('tenant_domains').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
          if (error) return res.status(400).json({ error: error.message });
          const result = (data || []).map((d) => ({ ...d, txt_token: undefined }));
          return res.status(200).json({ domains: result });
        }
      }
      // Verify
      if (req.method === 'POST' && p2 && p3 === 'verify') {
        if (!process.env.VERCEL_TOKEN || !process.env.VERCEL_PROJECT_ID) return res.status(500).json({ error: 'MISSING_ENV' });
        const { data: tenant } = await svc().from('tenants').select('plan').eq('id', tenantId).maybeSingle();
        if (!hasFeature(tenant?.plan || 'starter', 'custom_domain')) return res.status(403).json({ error: 'Plan does not include custom domains' });
        const { data: row, error } = await svc().from('tenant_domains').select('*').eq('tenant_id', tenantId).eq('domain', p2.toLowerCase()).maybeSingle();
        if (error) return res.status(400).json({ error: error.message });
        if (!row) return res.status(404).json({ error: 'Domain not found' });
        const txts = await resolveNestbaseTxt(row.domain);
        if (!txts.includes(row.txt_token)) return res.status(409).json({ verified: false, reason: 'TXT_MISMATCH' });
        const added = await vercelAddDomain(row.domain);
        if (added && added.rateLimited) { await svc().from('tenant_domains').update({ ssl_status: 'failed' }).eq('id', row.id); return res.status(429).json({ verified: false, reason: 'RATE_LIMIT' }); }
        let tries = 0; let ready = false; let last;
        while (tries < 12 && !ready) {
          await new Promise(r => setTimeout(r, 500 + tries * 150));
          const got = await vercelGetDomain(row.domain).catch(() => null);
          if (got && got.rateLimited) { tries++; continue; }
          last = got?.json || {};
          ready = !!last && (last.apexName || last.verified) !== false;
          tries++;
        }
        if (!ready) { await svc().from('tenant_domains').update({ ssl_status: 'failed' }).eq('id', row.id); return res.status(409).json({ verified: false, reason: 'RATE_LIMIT' }); }
        await svc().from('tenant_domains').update({ verified_at: new Date().toISOString(), ssl_status: 'ready' }).eq('id', row.id);
        return res.status(200).json({ verified: true, ssl: 'ready' });
      }
      // Delete
      if (req.method === 'DELETE' && p2 && !p3) {
        await vercelRemoveDomain(p2).catch(() => {});
        await svc().from('tenant_domains').delete().eq('tenant_id', tenantId).eq('domain', p2);
        return res.status(204).end();
      }
    }

    return res.status(404).json({ error: 'not found' });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


