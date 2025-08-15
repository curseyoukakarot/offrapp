export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    const { plan, adminSeats } = body;
    if (!plan) return res.status(400).json({ error: 'plan required' });
    if ((adminSeats || 1) < 1) return res.status(400).json({ error: 'invalid seats' });

    const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('onb='));
    const current = cookie ? JSON.parse(Buffer.from(cookie.split('=')[1], 'base64').toString('utf8')) : {};
    const next = { ...current, plan, adminSeats: adminSeats || 1, step: 'branding' };
    res.setHeader('Set-Cookie', `onb=${Buffer.from(JSON.stringify(next)).toString('base64')}; Path=/; HttpOnly; SameSite=Lax`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


