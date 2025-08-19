import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Store events in memory for the debug endpoint (in production, use Redis or DB)
const recentEvents = [];
const MAX_EVENTS = 100;

function addEvent(event) {
  recentEvents.unshift({
    ...event,
    timestamp: new Date().toISOString(),
    id: Math.random().toString(36).substr(2, 9)
  });
  
  // Keep only recent events
  if (recentEvents.length > MAX_EVENTS) {
    recentEvents.splice(MAX_EVENTS);
  }
}

// Log to audit_logs table for persistence
async function logToAuditTable(event) {
  try {
    const supabase = getSupabase();
    await supabase.from('audit_logs').insert({
      actor_id: event.user_id || null,
      action: event.action || 'onboarding_error',
      entity_type: event.entity_type || 'onboarding',
      entity_id: event.entity_id || null,
      tenant_id: event.tenant_id || null,
      details: {
        error: event.error,
        invite_id: event.invite_id,
        context: event.context
      },
      ip_address: event.ip || null,
      user_agent: event.user_agent || null
    });
  } catch (error) {
    console.error('Failed to log to audit_logs table:', error);
  }
}

// Send to Slack if webhook configured
async function sendToSlack(event) {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    const message = {
      text: `🚨 Onboarding Error`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Onboarding Error*\n\`\`\`${event.error}\`\`\``
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*User:* ${event.user_id || 'Unknown'}`
            },
            {
              type: "mrkdwn", 
              text: `*Tenant:* ${event.tenant_id || 'Unknown'}`
            },
            {
              type: "mrkdwn",
              text: `*Invite:* ${event.invite_id || 'N/A'}`
            },
            {
              type: "mrkdwn",
              text: `*Time:* ${new Date().toLocaleString()}`
            }
          ]
        }
      ]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (error) {
    console.error('Failed to send to Slack:', error);
  }
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  
  try {
    if (req.method === 'GET') {
      // Return recent events for debugging
      return res.status(200).json({ 
        events: recentEvents,
        total: recentEvents.length,
        timestamp: new Date().toISOString()
      });
    }
    
    if (req.method === 'POST') {
      // Receive and process an onboarding event
      const event = req.body || {};
      
      console.error('🚨 Onboarding Event:', {
        timestamp: new Date().toISOString(),
        user_id: event.user_id,
        tenant_id: event.tenant_id,
        invite_id: event.invite_id,
        action: event.action,
        error: event.error,
        context: event.context,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      });
      
      // Store in memory
      addEvent({
        ...event,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      });
      
      // Log to audit table
      await logToAuditTable({
        ...event,
        ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
        user_agent: req.headers['user-agent']
      });
      
      // Send to Slack
      await sendToSlack(event);
      
      return res.status(200).json({ ok: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export const config = { api: { bodyParser: true } };
