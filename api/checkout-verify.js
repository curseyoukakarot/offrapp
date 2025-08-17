import Stripe from 'stripe'
import { PLANS, hasFeature } from './_plans.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  try {
    const sessionId = (req.query?.session_id || req.body?.session_id || '').toString()
    if (!sessionId) return res.status(400).json({ error: 'Missing session_id' })

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items.data.price.product'] })

    // Determine plan
    let plan = (session.metadata?.plan || '').toLowerCase()
    const li = session.line_items?.data?.[0]
    const product = li?.price?.product
    const productPlan = (product && typeof product === 'object' && product.metadata && (product.metadata.plan || product.metadata.tier))
      ? String(product.metadata.plan || product.metadata.tier).toLowerCase()
      : ''
    if (!plan && productPlan) plan = productPlan
    if (!plan && typeof product === 'object' && product && 'name' in product && product.name) {
      const n = String(product.name).toLowerCase()
      if (n.includes('starter')) plan = 'starter'
      else if (n.includes('advanced')) plan = 'advanced'
      else if (n.includes('pro')) plan = 'pro'
    }
    if (!['starter','pro','advanced','custom'].includes(plan)) plan = 'starter'

    const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('onb='))
    const existing = cookie ? JSON.parse(Buffer.from(cookie.split('=')[1], 'base64').toString('utf8')) : {}

    const nextStep = hasFeature(plan, 'custom_domain') ? 'branding' : 'capabilities'
    const next = { ...existing, plan, step: nextStep }
    res.setHeader('Set-Cookie', `onb=${Buffer.from(JSON.stringify(next)).toString('base64')}; Path=/; HttpOnly; SameSite=Lax`)
    return res.status(200).json({ ok: true, plan, step: nextStep })
  } catch (e) {
    console.error('checkout-verify error:', e)
    return res.status(500).json({ error: 'Could not verify checkout session' })
  }
}

export const config = { api: { bodyParser: true } }



