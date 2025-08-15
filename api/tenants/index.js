export default function handler(req, res) {
  res.status(200).json({ ok: true, message: 'Tenants root' });
}

export const config = { api: { bodyParser: false } };


