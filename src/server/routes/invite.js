import express from 'express';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';
import { ensureClientCapacity, ensureTeamCapacity } from '../middleware/enforcePlanLimits.ts';
import { withAuth, withTenant } from '../middleware/auth.js';

const router = express.Router();

const getSupabase = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
};

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// POST /api/invite - Tenant admin invites user to their tenant
router.post('/', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.user;
    const tenantId = req.tenantId;
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
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

    // Enforce plan & seats before creating invitation
    const normalizedRole = String(role || '').toLowerCase();
    const isTeamRole = ['owner','admin','editor'].includes(normalizedRole);
    const isClientRole = ['member','client','jobseeker','recruitpro','role1','role2','role3'].includes(normalizedRole);

    try {
      if (isTeamRole) {
        await ensureTeamCapacity(tenantId, supabase);
      } else if (isClientRole) {
        await ensureClientCapacity(tenantId, supabase);
      }
    } catch (e) {
      const status = e?.status || 400;
      return res.status(status).json({ error: e?.code || 'BAD_REQUEST', message: e?.message || 'Plan limit reached' });
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

        const siteBase = process.env.PUBLIC_SITE_URL || 'http://localhost:5173';
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

    return res.json({ 
      message: 'Invitation sent successfully',
      invitation_id: invitation.id,
      expires_at: invitation.expires_at
    });
  } catch (error) {
    console.error('Tenant invite error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
})));

export default router;
