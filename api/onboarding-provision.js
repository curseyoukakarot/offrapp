import { createClient } from '@supabase/supabase-js';

// Inline plan definitions to avoid importing TS modules in serverless env
const PLANS = {
  starter: { maxClients: 30, features: { embeds: true, forms: true, files: true, custom_domain: false, custom_email: false, slack: false } },
  pro: { maxClients: 150, features: { embeds: true, forms: true, files: true, custom_domain: true, custom_email: true, slack: true, embedded_payments: false } },
  advanced: { maxClients: 1000, features: { embeds: true, forms: true, files: true, custom_domain: true, custom_email: true, slack: true, zapier: true, make: true, embedded_payments: true } },
  custom: { maxClients: null, features: { embeds: true, forms: true, files: true, custom_domain: true, custom_email: true, slack: true, zapier: true, make: true, embedded_payments: true } },
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('onb='));
    if (!cookie) return res.status(400).json({ error: 'Missing onboarding session' });
    const onb = JSON.parse(Buffer.from(cookie.split('=')[1], 'base64').toString('utf8'));
    const { plan: onbPlan = 'starter', adminSeats = 1, branding = {}, email, tenant_id: invitedTenantId, invited_role } = onb || {};
    const PLAN_ALIASES = { basic: 'starter', professional: 'pro', enterprise: 'advanced', adv: 'advanced' };
    const planRaw = String(onbPlan || '').toLowerCase();
    const plan = (['starter','pro','advanced','custom'].includes(planRaw) ? planRaw : (PLAN_ALIASES[planRaw] || 'starter'));

    const svc = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Find user by email (prefer public users view, fallback to admin list)
    let user = null;
    try {
      const { data: urow } = await svc.from('users').select('id').eq('email', email).maybeSingle();
      if (urow?.id) user = { id: urow.id };
    } catch (_) { /* ignore */ }
    if (!user) {
      try {
        const { data: userData, error: userErr } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (userErr) throw userErr;
        const found = (userData?.users || []).find((u) => String(u.email || '').toLowerCase() === String(email).toLowerCase());
        if (found) user = { id: found.id };
      } catch (_) { /* ignore */ }
    }
    if (!user) return res.status(400).json({ error: 'User not found from onboarding email' });

    // Use existing invited tenant if present; otherwise create a new one
    let tenant = null;
    if (invitedTenantId) {
      const { data: trow, error: terr } = await svc.from('tenants').select('*').eq('id', invitedTenantId).maybeSingle();
      if (terr) throw terr;
      if (!trow) throw new Error('Invited tenant not found');
      tenant = trow;
    } else {
      const { data: trow, error: terr } = await svc.from('tenants').insert({
        name: onb.companyName,
        slug: branding.subdomain,
        tier: plan,
      }).select('*').single();
      if (terr) throw terr;
      tenant = trow;
    }

    // Membership: use invited role if provided (only if not already attached)
    try {
      const { data: existingMem } = await svc.from('memberships').select('id').eq('tenant_id', tenant.id).eq('user_id', user.id).maybeSingle();
      if (!existingMem) {
        await svc.from('memberships').insert({ 
          tenant_id: tenant.id, 
          user_id: user.id, 
          role: invited_role || 'owner',
          status: 'active'
        });
        console.log('✅ Membership created:', { tenant_id: tenant.id, user_id: user.id, role: invited_role || 'owner' });
      } else {
        console.log('ℹ️ Membership already exists, skipping');
      }
    } catch (membershipError) {
      console.error('❌ Failed to create membership:', membershipError);
      // Don't fail the entire provisioning - user can be added manually
    }

    // Limits
    const planDef = PLANS[plan] || PLANS.starter;
    try { await svc.from('tenant_limits').upsert({ tenant_id: tenant.id, max_clients: planDef.maxClients, features: planDef.features }); } catch (_) {}
    try { await svc.from('tenant_stats').upsert({ tenant_id: tenant.id, admin_seats: adminSeats, clients_count: 0 }); } catch (_) {}

    // Seed sample content (only if new tenant was created)
    if (!invitedTenantId) {
      try {
        await svc.from('embeds').insert({ tenant_id: tenant.id, title: 'Welcome to Nestbase', url: 'https://nestbase.io', active: true });
        await svc.from('forms').insert({ tenant_id: tenant.id, title: 'Client Intake', status: 'draft', assigned_roles: ['admin'] });
        console.log('✅ Sample content seeded for new tenant');
      } catch (seedError) {
        console.warn('⚠️ Failed to seed sample content:', seedError);
        // Continue anyway
      }
    }

    // Cookie/host note: we keep the user on the same host during provisioning.
    // If you redirect to a different host (e.g., slug.nestbase.io), ensure the
    // auth cookie is set for that host. Here we simply return slug and let the
    // client perform a navigation; the app should establish a session on the
    // destination host via Supabase auth (token exchange or regular login).
    // Clear onboarding cookie and mark invitation accepted if any
    res.setHeader('Set-Cookie', 'onb=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    return res.status(200).json({ ready: true, tenantSlug: tenant.slug });
  } catch (e) {
    const msg = e?.message || String(e);
    console.error('onboarding/provision error', msg);
    
    // Notify about provisioning errors for monitoring
    try {
      const svc = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await svc.rpc('pg_notify', { 
        channel: 'onboarding_errors', 
        payload: `provision_failed user=${user?.id || 'unknown'} tenant=${invitedTenantId || 'new'} err=${msg}` 
      });
    } catch (_) {
      // Ignore notification failures
    }
    
    return res.status(500).json({ error: msg });
  }
}

export const config = { api: { bodyParser: false } };


