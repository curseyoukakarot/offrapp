import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getAuthedUser(req) {
  const supabase = getSupabase();
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data?.user || null;
}

async function ensureSuper(req, res) {
  const supabase = getSupabase();
  const user = await getAuthedUser(req);
  if (!user) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
  const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
  const isSuper = (roles || []).some((r) => ['super_admin', 'superadmin', 'super-admin'].includes(String(r.role || '').toLowerCase()));
  if (!isSuper) {
    res.status(403).json({ error: 'forbidden' });
    return null;
  }
  return { supabase, user };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  try {
    const ctx = await ensureSuper(req, res);
    if (!ctx) return;
    const { supabase, user } = ctx;
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
    const body = req.body || {};
    const inviter = user.id;
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    if (body.tenant) {
      const { name, slug, tier, seats_total } = body.tenant || {};
      const { data: tenant, error: terr } = await supabase
        .from('tenants')
        .insert([{ name, slug, tier, seats_total, status: 'active' }])
        .select('*')
        .single();
      if (terr) throw terr;
      const { data: invite, error: ierr } = await supabase
        .from('invitations')
        .insert([{ email: body.admin.email, tenant_id: tenant.id, role: 'owner', token, expires_at: expires, invited_by: inviter, bypass_billing: !!body.bypass_billing }])
        .select('id, token')
        .single();
      if (ierr) throw ierr;
      const siteBase = (process.env.PUBLIC_SITE_URL && process.env.PUBLIC_SITE_URL.startsWith('http'))
        ? process.env.PUBLIC_SITE_URL.replace(/\/$/, '')
        : `${(req.headers['x-forwarded-proto'] || 'https')}://${(req.headers['x-forwarded-host'] || req.headers.host)}`;
      const signupUrl = `${siteBase}/signup?invite=${encodeURIComponent(invite.token)}${body.bypass_billing ? '&bypass_billing=1' : ''}`;
      let emailSent = false, emailError = null;
      try {
        if (process.env.SENDGRID_API_KEY) {
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          await sgMail.send({
            to: body.admin.email,
            from: process.env.SENDGRID_FROM || 'noreply@nestbase.io',
            subject: `You're invited to ${name} on NestBase`,
            html: `<p>You have been invited as <b>Owner</b> of ${name}.</p><p><a href="${signupUrl}">Click here to get started</a></p>`
          });
          emailSent = true;
        }
      } catch (e) { emailError = e?.message || String(e); }
      return res.status(200).json({ invitationId: invite.id, token: invite.token, tenant_id: tenant.id, bypass_billing: !!body.bypass_billing, signup_url: signupUrl, emailSent, emailError });
    }

    const { email, role, tenant_id } = body;
    const { data: invite, error } = await supabase
      .from('invitations')
      .insert([{ email, tenant_id, role, token, expires_at: expires, invited_by: inviter }])
      .select('id, token')
      .single();
    if (error) throw error;
    const siteBase = (process.env.PUBLIC_SITE_URL && process.env.PUBLIC_SITE_URL.startsWith('http'))
      ? process.env.PUBLIC_SITE_URL.replace(/\/$/, '')
      : `${(req.headers['x-forwarded-proto'] || 'https')}://${(req.headers['x-forwarded-host'] || req.headers.host)}`;
    const signupUrl = `${siteBase}/signup?invite=${encodeURIComponent(invite.token)}`;
    let emailSent = false, emailError = null;
    try {
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send({
          to: email,
          from: process.env.SENDGRID_FROM || 'noreply@nestbase.io',
          subject: `You're invited to join a workspace on NestBase`,
          html: `<p>You have been invited as <b>${role}</b>.</p><p><a href="${signupUrl}">Accept your invite</a></p>`
        });
        emailSent = true;
      }
    } catch (e) { emailError = e?.message || String(e); }
    return res.status(200).json({ invitationId: invite.id, token: invite.token, signup_url: signupUrl, emailSent, emailError });
  } catch (e) {
    const errorContext = {
      user_id: user?.id || null,
      tenant_id: body.tenant?.id || body.tenant_id || null,
      invite_id: null,
      action: 'invitation_failed',
      error: e.message || String(e),
      context: { 
        email: body.admin?.email || body.email,
        tenant_name: body.tenant?.name,
        role: body.admin?.role || body.role,
        bypass_billing: body.bypass_billing
      }
    };
    
    console.error('🚨 api/super/invitations error', errorContext);
    
    // Send to debug endpoint for monitoring
    try {
      await fetch('/api/_debug/onboarding-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorContext)
      });
    } catch (_) {}
    
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: true } };


