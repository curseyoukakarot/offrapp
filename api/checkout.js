import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { price_id } = req.body || {}
  if (!price_id) {
    return res.status(400).json({ error: 'Missing price_id' })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
    const baseUrl = process.env.APP_BASE_URL || process.env.VERCEL_URL || 'http://localhost:5173'
    const successUrl = `${baseUrl}/?checkout=success`
    const cancelUrl = `${baseUrl}/#pricing`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return res.status(200).json({ id: session.id, url: session.url })
  } catch (err) {
    console.error('checkout error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}


