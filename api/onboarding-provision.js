import { createClient } from '@supabase/supabase-js';
import { PLANS } from '../src/lib/plans.ts';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('onb='));
    if (!cookie) return res.status(400).json({ error: 'Missing onboarding session' });
    const onb = JSON.parse(Buffer.from(cookie.split('=')[1], 'base64').toString('utf8'));
    const { plan = 'starter', adminSeats = 1, branding = {}, email } = onb || {};

    const svc = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Find user by email
    const { data: userData, error: userErr } = await svc.auth.admin.listUsers({ page: 1, perPage: 1, email });
    if (userErr) throw userErr;
    const user = userData?.users?.[0];
    if (!user) return res.status(400).json({ error: 'User not found from onboarding' });

    // Create tenant
    const { data: tenant, error: tenantErr } = await svc.from('tenants').insert({
      name: onb.companyName,
      slug: branding.subdomain,
      subdomain: branding.subdomain,
      plan,
      brand_color: branding.brandColor || null,
      logo_url: branding.logoUrl || null,
      created_by: user.id,
    }).select('*').single();
    if (tenantErr) throw tenantErr;

    // Membership admin
    await svc.from('memberships').insert({ tenant_id: tenant.id, user_id: user.id, role: 'admin' });

    // Limits
    const planDef = PLANS[plan] || PLANS.starter;
    await svc.from('tenant_limits').upsert({ tenant_id: tenant.id, max_clients: planDef.maxClients, features: planDef.features });
    await svc.from('tenant_stats').upsert({ tenant_id: tenant.id, admin_seats: adminSeats, clients_count: 0 });

    // Seed sample content
    await svc.from('embeds').insert({ tenant_id: tenant.id, title: 'Welcome to Nestbase', url: 'https://nestbase.io', active: true });
    await svc.from('forms').insert({ tenant_id: tenant.id, title: 'Client Intake', status: 'draft', assigned_roles: ['admin'] });

    // Cookie/host note: we keep the user on the same host during provisioning.
    // If you redirect to a different host (e.g., slug.nestbase.io), ensure the
    // auth cookie is set for that host. Here we simply return slug and let the
    // client perform a navigation; the app should establish a session on the
    // destination host via Supabase auth (token exchange or regular login).
    // Clear onboarding cookie
    res.setHeader('Set-Cookie', 'onb=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    return res.status(200).json({ ready: true, tenantSlug: tenant.slug });
  } catch (e) {
    console.error('onboarding/provision error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };


