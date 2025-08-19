import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';
import tenantsRouter from './src/server/routes/tenants.js';
import impersonateRouter from './src/server/routes/impersonate.js';
import metricsRouter from './src/server/routes/metrics.js';
import jobsRouter from './src/server/routes/jobs.js';
import notificationsRouter from './src/server/routes/notifications.js';
import auditRouter from './src/server/routes/audit.js';
import usersRouter from './src/server/routes/users.js';
import superRouter from './src/server/routes/super.js';
import filesRouter from './src/server/routes/files.js';
import formsRouter from './src/server/routes/forms.js';
import tenantRolesRouter from './src/server/routes/tenant-roles.js';
import { impersonationMiddleware } from './src/server/middleware/impersonation.js';

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'Missing');

const app = express();
app.use(cors());
app.use(express.json());
// Ensure JSON content type for API responses
app.use((req, res, next) => {
  if (req.url.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    // Prevent CDN/browser caching API responses to avoid SPA HTML being served
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }
  next();
});

// ✅ Supabase setup (lazy if envs missing to allow server health to run)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
} else {
  console.warn('Supabase env not set; running in limited mode. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'noreply@nestbase.io';
// Attach user to req if Authorization token present
app.use(async (req, _res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
    if (!token || !supabase) return next();
    const { data } = await supabase.auth.getUser(token);
    req.authedUser = data.user || null;
  } catch (_e) {
    // ignore
  }
  next();
});
// Impersonation header injection
app.use(impersonationMiddleware);
// Log tenant/user context for triage
app.use((req, _res, next) => {
  if (req.url.startsWith('/api/')) {
    const tenantId = req.headers['x-tenant-id'];
    const userId = req.authedUser?.id || null;
    console.log(`[API] ${req.method} ${req.url} tenant=${tenantId || 'none'} user=${userId || 'anon'}`);
  }
  next();
});
app.use('/api/tenants', tenantsRouter);
app.use('/api/impersonate', impersonateRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/users', usersRouter);
app.use('/api/super', superRouter);
app.use('/api/files', filesRouter);
app.use('/api/forms', formsRouter);
app.use('/api/tenant-roles', tenantRolesRouter);

// Simple health endpoints
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// ✅ Supabase invite helper function
async function inviteUser(email, role) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    user_metadata: { role },
    email_confirm: false,
    send_email_invite: true,
  });

  if (error) {
    console.error('❌ Error inviting user:', error);
    throw error;
  } else {
    console.log('✅ Invite sent to:', email);
    return data;
  }
}

// ✅ Admin API endpoint to invite user + send Slack alert
app.post('/api/invite', async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ message: 'Email and role are required' });
  }

  try {
    const result = await inviteUser(email, role);

    // ✅ Send Slack notification
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    const slackMessage = {
      text: `🎉 *New user invited!*\n\n*Email:* ${email}\n*Role:* ${role}`,
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });

    res.status(200).json({ message: 'Invite sent successfully', data: result });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send invite', error: err.message });
  }
});

// ✅ Existing Slack notification endpoint
app.post('/api/sendSlackNotification', async (req, res) => {
  const { fullName, formTitle, createdAt, fileUrl } = req.body;

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  const messageBlocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🎯 *New Form Submission Received!*`,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${fullName}` },
        { type: 'mrkdwn', text: `*Form:*\n${formTitle}` },
        { type: 'mrkdwn', text: `*Submitted:*\n${new Date(createdAt).toLocaleString()}` },
        ...(fileUrl ? [{ type: 'mrkdwn', text: `*File:*\n<${fileUrl}|View File>` }] : []),
      ],
    },
  ];

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks: messageBlocks }),
    });

    if (!response.ok) {
      return res.status(500).json({ message: 'Slack error', error: await response.text() });
    }

    res.status(200).json({ message: 'Slack sent!' });
  } catch (error) {
    res.status(500).json({ message: 'Slack error', error: error.message });
  }
});

// Add this near your other environment variables
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

// Add this with your other endpoints
app.post('/api/notify-slack', async (req, res) => {
  try {
    const { slackMessage } = req.body;
    
    if (!SLACK_WEBHOOK_URL) {
      throw new Error('Slack webhook URL not configured');
    }

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: slackMessage }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error sending to Slack:', error);
    res.status(500).json({ error: error.message });
  }
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/api/send-welcome-email', async (req, res) => {
  const { email, first_name, user_id } = req.body;
  const msg = {
    to: email,
    from: SENDGRID_FROM,
    templateId: 'd-2779cc0fb09c47b9a5c8b853a14e0baa',
    dynamic_template_data: {
      first_name: first_name
    },
  };

  try {
    // Send welcome email
    await sgMail.send(msg);
    console.log('✅ Welcome email sent successfully to:', email);

    // Update profile to mark email as sent
    const { data, error } = await supabase
      .from('profiles')
      .update({ welcome_email_sent: true })
      .eq('id', user_id)
      .select();

    if (error) {
      console.error('❌ Error updating welcome_email_sent flag:', error);
      throw error;
    }

    console.log('✅ Profile updated successfully:', data);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error in send-welcome-email:', error.response?.body || error.message);
    res.status(500).json({ error: error.response?.body || error.message });
  }
});

// Public invitation accept (no auth)
app.post('/api/public/invitations/accept', async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'missing_token' });
    const { data: inv, error } = await supabase.from('invitations').select('*').eq('token', token).single();
    if (error || !inv) return res.status(400).json({ error: 'invalid_token' });
    if (inv.status !== 'pending') return res.status(400).json({ error: 'not_pending' });
    if (new Date(inv.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'expired' });
    const { data: u } = await supabase.from('users').select('id').eq('email', inv.email).maybeSingle();
    const userId = u?.id || null;
    if (inv.tenant_id && userId) {
      await supabase.from('memberships').upsert({ tenant_id: inv.tenant_id, user_id: userId, role: inv.role }, { onConflict: 'tenant_id,user_id' });
    }
    await supabase.from('invitations').update({ status: 'accepted' }).eq('id', inv.id);
    const redirect = inv.bypass_billing ? `/onboarding?tenant=${inv.tenant_id}&bypass_billing=1` : '/login';
    res.json({ ok: true, redirect });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// For Vercel deployment
export default app;
export const config = { api: { bodyParser: false } };

// --- Super Admin no-op endpoints (stubs) ---
app.post('/api/tenants/:id/suspend', async (req, res) => {
  res.json({ ok: true });
});
app.post('/api/impersonate/start', async (req, res) => {
  res.json({ ok: true });
});
app.post('/api/cache/purge', async (req, res) => {
  res.json({ ok: true });
});
app.post('/api/search/reindex', async (req, res) => {
  res.json({ ok: true });
});
app.post('/api/notify/admins', async (req, res) => {
  res.json({ ok: true });
});

// Express error handler to avoid plain text FUNCTION_INVOCATION_FAILED
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[UNHANDLED]', err);
  try {
    res.status(500).json({ error: err?.message || 'Server error' });
  } catch (_e) {
    res.status(500).send('{"error":"Server error"}');
  }
});
