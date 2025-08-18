import { createClient } from '@supabase/supabase-js';
import { PLANS } from './_plans.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    const { name, email, password, companyName, source, sourceOther, title, plan: planFromClient, invite } = body;
    if (!name || !email || !password || !companyName) return res.status(400).json({ error: 'Missing fields' });

    const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const svc = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const siteBase = (process.env.PUBLIC_SITE_URL && process.env.PUBLIC_SITE_URL.startsWith('http'))
      ? process.env.PUBLIC_SITE_URL.replace(/\/$/, '')
      : `${(req.headers['x-forwarded-proto'] || 'https')}://${(req.headers['x-forwarded-host'] || req.headers.host || req.headers['host'])}`;
    let signErr = null;
    if (invite) {
      // For invited users, avoid Supabase confirmation email flow; create as confirmed
      const { error: createErr } = await svc.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, title }
      });
      if (createErr && !String(createErr.message || '').toLowerCase().includes('already')) {
        // If creation failed with a generic DB error, check if the user already exists
        try {
          const { data: list } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
          const exists = (list?.users || []).some((u) => String(u.email || '').toLowerCase() === String(email).toLowerCase());
          if (!exists) {
            signErr = createErr;
          }
        } catch (_) {
          signErr = createErr;
        }
      }
    } else {
      const { error } = await anon.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, title },
          emailRedirectTo: `${siteBase}/login`
        }
      });
      signErr = error || null;
    }
    if (signErr) {
      const msg = String(signErr.message || '').toLowerCase();
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('already')) {
        // Fallback: ensure user exists without sending email, to unblock onboarding
        const { data: created, error: createErr } = await svc.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: name, title }
        });
        if (createErr && !String(createErr.message || '').toLowerCase().includes('already')) {
          // Last resort: if admin create failed, check if user exists and proceed if so
          try {
            const { data: list } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
            const exists = (list?.users || []).some((u) => String(u.email || '').toLowerCase() === String(email).toLowerCase());
            if (!exists) return res.status(400).json({ error: signErr.message });
          } catch (_) {
            return res.status(400).json({ error: signErr.message });
          }
        }
        // proceed even if user already exists
      } else {
        return res.status(400).json({ error: signErr.message });
      }
    }

    // We no longer force-create a public users row here to avoid CHECK constraint mismatches.

    // Merge any pre-existing onboarding cookie (which may contain a verified plan from Stripe)
    const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('onb='));
    const existing = cookie ? JSON.parse(Buffer.from(cookie.split('=')[1], 'base64').toString('utf8')) : {};

    // If invite token is present, resolve it and stash tenant/role/bypass in cookie context
    let invitedTenantId = existing.tenant_id || null;
    let invitedRole = existing.invited_role || null;
    let invitedBypass = !!existing.bypass_billing;
    if (invite) {
      try {
        const svc = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: inv } = await svc.from('invitations').select('tenant_id, role, bypass_billing, status').eq('token', invite).maybeSingle();
        if (inv && inv.status === 'pending') {
          invitedTenantId = inv.tenant_id || null;
          invitedRole = inv.role || null;
          invitedBypass = !!inv.bypass_billing;
        }
      } catch (_) {}
    }

    // Determine effective plan: prefer existing verified plan, then client-provided (fallback), then starter
    const effectivePlan = (existing.plan || planFromClient || 'starter').toLowerCase();

    // Decide next step based on plan features
    const hasCustomDomain = !!(PLANS[effectivePlan]?.features?.custom_domain);
    const nextStep = hasCustomDomain ? 'branding' : 'capabilities';

    // Stash onboarding session in a cookie (opaque, minimal). In real app use DB/cache.
    const session = { email, companyName, source, sourceOther, plan: effectivePlan, step: nextStep, invite, tenant_id: invitedTenantId, invited_role: invitedRole, bypass_billing: invitedBypass };
    res.setHeader('Set-Cookie', `onb=${Buffer.from(JSON.stringify(session)).toString('base64')}; Path=/; HttpOnly; SameSite=Lax`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('onboarding/start error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


