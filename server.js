import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded' : 'Missing');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Supabase setup
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// ✅ Supabase invite helper function
async function inviteUser(email, role) {
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

// Zapier notification endpoint
app.post('/api/notify-zapier', async (req, res) => {
  const payload = req.body;
  const webhookUrl = 'https://hooks.zapier.com/hooks/catch/18279230/2nifu2l/';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to send to Zapier');
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    from: 'noreply@offr.app', // Updated sender address
    templateId: 'd-2779cc0fb09c47b9a5c8b853a14e0baa',
    dynamic_template_data: {
      first_name: first_name
    },
  };

  try {
    await sgMail.send(msg);
    // Optionally update the profile to mark email as sent
    await supabase.from('profiles').update({ welcome_email_sent: true }).eq('id', user_id);
    res.json({ success: true });
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    res.status(500).json({ error: error.response?.body || error.message });
  }
});

// For Vercel deployment
export default app;
