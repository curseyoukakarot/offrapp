import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get auth token and tenant ID
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const tenantId = req.headers['x-tenant-id'];

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  if (!tenantId) {
    return res.status(400).json({ error: 'Missing x-tenant-id header' });
  }

  try {
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user has admin access to this tenant
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    // Generate invitation token
    const token_string = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        email,
        tenant_id: tenantId,
        role,
        token: token_string,
        expires_at: expires_at.toISOString(),
        invited_by: user.id,
        bypass_billing: false // Tenant invites don't bypass billing
      })
      .select('*')
      .single();

    if (inviteError) {
      console.error('Failed to create invitation:', inviteError);
      console.error('Invitation data:', { email, tenant_id: tenantId, role, token: token_string, expires_at, invited_by: user.id });
      return res.status(500).json({ 
        error: 'Failed to create invitation', 
        details: inviteError.message,
        code: inviteError.code 
      });
    }

    // Send invitation email
    if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM) {
      try {
        // Get tenant info for email
        const { data: tenant } = await supabase
          .from('tenants')
          .select('name')
          .eq('id', tenantId)
          .single();

        const siteBase = process.env.PUBLIC_SITE_URL || 
          (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host'] 
            ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
            : 'https://www.nestbase.io');
            
        const signup_url = `${siteBase}/signup?invite=${token_string}`;

        const msg = {
          to: email,
          from: process.env.SENDGRID_FROM,
          subject: `Invitation to join ${tenant?.name || 'the team'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>You've been invited to join ${tenant?.name || 'the team'}!</h2>
              <p>Click the link below to create your account and get started:</p>
              <p style="margin: 20px 0;">
                <a href="${signup_url}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Accept Invitation
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                This invitation will expire in 7 days. If you have any questions, please contact the team.
              </p>
              <p style="color: #999; font-size: 12px;">
                If the button doesn't work, copy and paste this link: ${signup_url}
              </p>
            </div>
          `
        };

        await sgMail.send(msg);
        console.log('✅ Invitation email sent to:', email);
      } catch (emailError) {
        console.error('❌ Failed to send invitation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return res.status(200).json({ 
      message: 'Invitation sent successfully',
      invitation_id: invitation.id,
      expires_at: invitation.expires_at
    });
  } catch (error) {
    console.error('Tenant invite API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
