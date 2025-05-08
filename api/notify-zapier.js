import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const payload = req.body;
  const webhookUrl = 'https://hooks.zapier.com/hooks/catch/18279230/2nifu2l/';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Failed to send to Zapier');
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Zapier webhook error:', err);
    return res.status(500).json({ error: err.message });
  }
} 