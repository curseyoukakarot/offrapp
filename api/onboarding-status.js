export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('onb='));
    if (!cookie) return res.status(200).json({ step: 'plan' });
    const json = JSON.parse(Buffer.from(cookie.split('=')[1], 'base64').toString('utf8'));
    return res.status(200).json(json);
  } catch (e) {
    return res.status(200).json({ step: 'plan' });
  }
}

export const config = { api: { bodyParser: false } };


