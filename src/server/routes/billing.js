import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { withAuth, withTenant } from '../middleware/auth.js';

const router = express.Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env missing');
  return createClient(url, key);
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY missing');
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' });
}

// Map plan -> base subscription price IDs
function getPlanPriceId(plan) {
  const p = String(plan || '').toLowerCase();
  if (p === 'pro') return process.env.STRIPE_PRICE_PRO_SUBSCRIPTION || process.env.VITE_STRIPE_PRICE_PRO_MONTHLY || process.env.VITE_STRIPE_PRICE_PRO_ANNUAL;
  if (p === 'advanced') return process.env.STRIPE_PRICE_ADVANCED_SUBSCRIPTION || process.env.VITE_STRIPE_PRICE_ADVANCED_MONTHLY || process.env.VITE_STRIPE_PRICE_ADVANCED_ANNUAL;
  if (p === 'starter') return process.env.STRIPE_PRICE_STARTER_SUBSCRIPTION || process.env.VITE_STRIPE_PRICE_STARTER_MONTHLY || process.env.VITE_STRIPE_PRICE_STARTER_ANNUAL;
  return null;
}

function getSeatPriceId(plan) {
  const p = String(plan || '').toLowerCase();
  if (p === 'pro') return process.env.STRIPE_PRICE_PRO_SEAT || '';
  if (p === 'advanced') return process.env.STRIPE_PRICE_ADVANCED_SEAT || '';
  return '';
}

async function getOrCreateStripeCustomer(tenant) {
  const supabase = getSupabase();
  const stripe = getStripe();
  if (tenant.stripe_customer_id) return tenant.stripe_customer_id;
  const customer = await stripe.customers.create({
    metadata: { tenant_id: tenant.id },
  });
  await supabase.from('tenants').update({ stripe_customer_id: customer.id }).eq('id', tenant.id);
  return customer.id;
}

async function updateTenantPlanAndSeats({ tenantId, plan, seats }) {
  const supabase = getSupabase();
  const safeSeats = Math.max(1, parseInt(seats || 1, 10));
  const updates = {};
  if (plan) updates.plan = String(plan).toLowerCase();
  if (safeSeats) updates.seats_purchased = safeSeats;
  await supabase.from('tenants').update(updates).eq('id', tenantId);
}

// GET /api/billing/summary
router.get('/summary', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = req.supabase || getSupabase();
    const tenantId = req.tenantId;
    const { data: tenant } = await supabase.from('tenants').select('id, plan, seats_purchased, stripe_customer_id, stripe_subscription_id').eq('id', tenantId).single();
    const { data: usage } = await supabase.from('tenant_usage').select('clients_count, team_count, updated_at').eq('tenant_id', tenantId).maybeSingle();
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, stripe_invoice_id, amount_cents, status, hosted_invoice_url, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(12);
    res.json({ tenant, usage: usage || { clients_count: 0, team_count: 1 }, invoices: invoices || [] });
  } catch (e) {
    console.error('billing.summary error', e);
    res.status(500).json({ error: 'failed_to_load_billing' });
  }
}))); 

// POST /api/billing/checkout
// Body: { mode: 'subscription'|'payment', purpose: 'upgrade_plan'|'add_seats', plan?: 'pro'|'advanced', seats?: number }
router.post('/checkout', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = req.supabase || getSupabase();
    const stripe = getStripe();
    const tenantId = req.tenantId;
    const { mode, purpose, plan, seats } = req.body || {};
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, plan, seats_purchased, stripe_customer_id, stripe_subscription_id')
      .eq('id', tenantId)
      .single();
    // require tenant admin
    const role = (req.membership?.role || '').toLowerCase();
    if (!['owner','admin'].includes(role)) return res.status(403).json({ error: 'admin_required' });

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
    const success_url = `${baseUrl}/dashboard/admin`;
    const cancel_url = `${baseUrl}/dashboard/admin`;

    if (purpose === 'upgrade_plan') {
      const targetPlan = (plan || '').toLowerCase();
      if (!['pro','advanced'].includes(targetPlan)) {
        return res.status(400).json({ error: 'invalid_plan' });
      }
      const price = getPlanPriceId(targetPlan);
      if (!price) return res.status(400).json({ error: 'plan_price_not_configured' });
      const customerId = await getOrCreateStripeCustomer(tenant);
      // Seats: moving from starter -> keep seats at 1 initially; additional seats via separate flow
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price, quantity: 1 }],
        success_url,
        cancel_url,
        customer: customerId,
        metadata: { tenant_id: tenantId, purpose: 'upgrade_plan', plan: targetPlan },
      });
      return res.json({ url: session.url });
    }

    if (purpose === 'add_seats') {
      const seatsToAdd = Math.max(parseInt(seats || 0, 10), 0);
      if (!seatsToAdd) return res.status(400).json({ error: 'invalid_seats' });
      if (!tenant.stripe_subscription_id) return res.status(400).json({ error: 'no_subscription' });

      // Prefer Checkout Session to adjust seat quantity (via subscription_data)
      const seatPriceId = getSeatPriceId(tenant.plan);
      if (!seatPriceId) return res.status(400).json({ error: 'seat_price_not_configured' });
      const customerId = await getOrCreateStripeCustomer(tenant);
      const newQty = (tenant.seats_purchased || 1) + seatsToAdd;
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        success_url,
        cancel_url,
        subscription_data: {
          items: [
            { price: seatPriceId, quantity: newQty },
          ],
          metadata: { tenant_id: tenantId, purpose: 'add_seats' },
        },
      });
      return res.json({ url: session.url });
    }

    return res.status(400).json({ error: 'invalid_purpose' });
  } catch (e) {
    console.error('billing.checkout error', e);
    res.status(500).json({ error: 'checkout_failed' });
  }
}))); 

// GET /api/billing/portal
router.get('/portal', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = req.supabase || getSupabase();
    const stripe = getStripe();
    const tenantId = req.tenantId;
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, stripe_customer_id')
      .eq('id', tenantId)
      .single();
    const role = (req.membership?.role || '').toLowerCase();
    if (!['owner','admin'].includes(role)) return res.status(403).json({ error: 'admin_required' });
    if (!tenant.stripe_customer_id) return res.status(400).json({ error: 'no_customer' });
    const returnUrl = process.env.STRIPE_PORTAL_RETURN_URL || (process.env.APP_BASE_URL || 'http://localhost:5173');
    const session = await stripe.billingPortal.sessions.create({ customer: tenant.stripe_customer_id, return_url: returnUrl });
    res.json({ url: session.url });
  } catch (e) {
    console.error('billing.portal error', e);
    res.status(500).json({ error: 'portal_failed' });
  }
}))); 

// Stripe webhook (legacy path; kept for compatibility)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event = req.body;
  try {
    const stripe = getStripe();
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (whSecret) {
      const sig = req.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, whSecret);
      } catch (err) {
        console.warn('⚠️  Webhook signature verification failed, proceeding without verification');
        event = req.body;
      }
    }

    const supabase = getSupabase();
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        const tenantId = s.metadata?.tenant_id;
        const purpose = s.metadata?.purpose;
        const plan = s.metadata?.plan;
        if (tenantId) {
          await supabase
            .from('tenants')
            .update({
              stripe_customer_id: s.customer || null,
              stripe_subscription_id: s.subscription || null,
              plan: purpose === 'upgrade_plan' && plan ? plan : undefined,
            })
            .eq('id', tenantId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;
        // Determine plan by matching known plan price ids in items
        const priceIds = (sub.items?.data || []).map(i => i.price?.id).filter(Boolean);
        let plan = 'starter';
        if (priceIds.includes(process.env.VITE_STRIPE_PRICE_PRO_MONTHLY) || priceIds.includes(process.env.VITE_STRIPE_PRICE_PRO_ANNUAL)) plan = 'pro';
        if (priceIds.includes(process.env.VITE_STRIPE_PRICE_ADVANCED_MONTHLY) || priceIds.includes(process.env.VITE_STRIPE_PRICE_ADVANCED_ANNUAL)) plan = 'advanced';
        // Seats: seat price item quantity if present
        const seatPriceId = getSeatPriceId(plan);
        const seatItem = (sub.items?.data || []).find(i => i.price?.id === seatPriceId);
        const seatsPurchased = seatItem ? (seatItem.quantity || 1) : null;
        await supabase
          .from('tenants')
          .update({
            plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            ...(seatsPurchased ? { seats_purchased: seatsPurchased } : {}),
          })
          .eq('stripe_subscription_id', sub.id);
        // Fallback by customer id if subscription id not yet stored
        await supabase
          .from('tenants')
          .update({
            plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            ...(seatsPurchased ? { seats_purchased: seatsPurchased } : {}),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await getSupabase()
          .from('tenants')
          .update({ plan: 'starter', stripe_subscription_id: null })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv = event.data.object;
        // Find tenant by customer or subscription
        const tenantBySub = await getSupabase().from('tenants').select('id').eq('stripe_subscription_id', inv.subscription).maybeSingle();
        const tenantId = tenantBySub.data?.id;
        if (tenantId) {
          await getSupabase().from('invoices').insert({
            tenant_id: tenantId,
            stripe_invoice_id: inv.id,
            amount_cents: inv.amount_paid || inv.amount_due || 0,
            status: inv.status || 'paid',
            hosted_invoice_url: inv.hosted_invoice_url || null,
          });
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (e) {
    console.error('billing.webhook error', e);
    res.status(200).json({ received: true });
  }
});

// Stripe webhook (verified path)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripe = getStripe();
    const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!whSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
      return res.status(400).send('');
    }
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(req.body, sig, whSecret);

    const supabase = getSupabase();
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        const tenantId = s.metadata?.tenant_id;
        const purpose = s.metadata?.purpose;
        const plan = s.metadata?.plan;
        if (tenantId) {
          await supabase
            .from('tenants')
            .update({
              stripe_customer_id: s.customer || null,
              stripe_subscription_id: s.subscription || null,
              plan: purpose === 'upgrade_plan' && plan ? plan : undefined,
            })
            .eq('id', tenantId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const customerId = sub.customer;
        const priceIds = (sub.items?.data || []).map(i => i.price?.id).filter(Boolean);
        let plan = 'starter';
        if (priceIds.includes(process.env.STRIPE_PRICE_PRO_SUBSCRIPTION) || priceIds.includes(process.env.VITE_STRIPE_PRICE_PRO_MONTHLY) || priceIds.includes(process.env.VITE_STRIPE_PRICE_PRO_ANNUAL)) plan = 'pro';
        if (priceIds.includes(process.env.STRIPE_PRICE_ADVANCED_SUBSCRIPTION) || priceIds.includes(process.env.VITE_STRIPE_PRICE_ADVANCED_MONTHLY) || priceIds.includes(process.env.VITE_STRIPE_PRICE_ADVANCED_ANNUAL)) plan = 'advanced';
        const seatPriceId = getSeatPriceId(plan);
        const seatItem = (sub.items?.data || []).find(i => i.price?.id === seatPriceId);
        const seatsPurchased = seatItem ? (seatItem.quantity || 1) : null;
        // Update by subscription id, then by customer id fallback
        await supabase
          .from('tenants')
          .update({
            plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            ...(seatsPurchased ? { seats_purchased: seatsPurchased } : {}),
          })
          .eq('stripe_subscription_id', sub.id);
        await supabase
          .from('tenants')
          .update({
            plan,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            ...(seatsPurchased ? { seats_purchased: seatsPurchased } : {}),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await getSupabase()
          .from('tenants')
          .update({ plan: 'starter', stripe_subscription_id: null })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
      case 'invoice.payment_succeeded': {
        const inv = event.data.object;
        const tenantBySub = await getSupabase().from('tenants').select('id').eq('stripe_subscription_id', inv.subscription).maybeSingle();
        const tenantId = tenantBySub.data?.id;
        if (tenantId) {
          await getSupabase().from('invoices').insert({
            tenant_id: tenantId,
            stripe_invoice_id: inv.id,
            amount_cents: inv.amount_paid || inv.amount_due || 0,
            status: inv.status || 'paid',
            hosted_invoice_url: inv.hosted_invoice_url || null,
          });
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (e) {
    console.error('billing.stripe.webhook error', e);
    res.status(400).send('');
  }
});

export default router;


