import { createClient } from '@supabase/supabase-js';

function isValidSubdomain(s) {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/.test(s);
}

const RESERVED = new Set(['www', 'admin', 'api', 'app', 'offr', 'nestbase']);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const chunks = []; for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    let sub = String(body.subdomain || '').toLowerCase().trim();
    // sanitize basic
    sub = sub.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-');
    if (!isValidSubdomain(sub) || RESERVED.has(sub)) {
      return res.status(200).json({ available: false, reason: 'invalid' });
    }
    const svc = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await svc.from('tenants').select('id').or(`slug.eq.${sub},subdomain.eq.${sub}`).limit(1);
    if (error) throw error;
    const taken = Array.isArray(data) && data.length > 0;
    return res.status(200).json({ available: !taken, reason: taken ? 'taken' : undefined });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


