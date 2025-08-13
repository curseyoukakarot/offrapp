export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).json({ ok: true, path: req.url, time: new Date().toISOString() });
}

export const config = { api: { bodyParser: false } };


