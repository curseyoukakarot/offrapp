import Stripe from 'stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { price_id, plan } = req.body || {}
  if (!price_id) {
    return res.status(400).json({ error: 'Missing price_id' })
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
    const vercelHost = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''
    const baseUrl = process.env.APP_BASE_URL || vercelHost || 'http://localhost:5173'
    // Redirect back with a verifiable Checkout Session ID instead of a spoofable plan param
    const successUrl = `${baseUrl}/signup?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/#pricing`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: plan ? { plan } : undefined,
    })

    const accepts = String(req.headers.accept || '')
    const ctype = String(req.headers['content-type'] || '')
    const isBrowserPost = accepts.includes('text/html') || ctype.includes('application/x-www-form-urlencoded')
    if (isBrowserPost) {
      res.statusCode = 303
      res.setHeader('Location', session.url)
      return res.end()
    }
    return res.status(200).json({ id: session.id, url: session.url })
  } catch (err) {
    console.error('checkout error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}


