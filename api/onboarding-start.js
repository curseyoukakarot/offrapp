import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    const { name, email, password, companyName, source, sourceOther, title } = body;
    if (!name || !email || !password || !companyName) return res.status(400).json({ error: 'Missing fields' });

    const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data: sign, error: signErr } = await anon.auth.signUp({ email, password, options: { data: { full_name: name, title } } });
    if (signErr) return res.status(400).json({ error: signErr.message });

    // Stash onboarding session in a cookie (opaque, minimal). In real app use DB/cache.
    const session = { email, companyName, source, sourceOther, step: 'plan' };
    res.setHeader('Set-Cookie', `onb=${Buffer.from(JSON.stringify(session)).toString('base64')}; Path=/; HttpOnly; SameSite=Lax`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('onboarding/start error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


