import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { withAuth, withTenant } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env missing');
  return createClient(url, key);
}

// Helper to generate API keys
function generateApiKey() {
  return 'ofr_' + crypto.randomBytes(32).toString('hex');
}

// Helper to mask API keys for display
function maskApiKey(key) {
  if (!key) return '';
  return key.substring(0, 8) + '••••••••' + key.substring(key.length - 4);
}

// GET /api/integrations - Super admin global settings
router.get('/', withAuth(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    
    // Check super admin
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
    const isSuperAdmin = (roles || []).some(r => ['super_admin', 'superadmin', 'super-admin'].includes((r.role || '').toLowerCase()));
    if (!isSuperAdmin) return res.status(403).json({ error: 'super_admin_required' });

    // Mock global integration settings (could be stored in a global_settings table)
    const globals = {
      slack: { 
        key: process.env.SLACK_WEBHOOK_URL ? 'configured' : '', 
        description: 'Global Slack webhook URL',
        masked: process.env.SLACK_WEBHOOK_URL ? 'https://hooks.slack.com/••••' : '',
        lastUsedAt: null
      },
      sendgrid: { 
        key: process.env.SENDGRID_API_KEY ? 'configured' : '', 
        description: 'SendGrid API key for email delivery',
        masked: process.env.SENDGRID_API_KEY ? maskApiKey(process.env.SENDGRID_API_KEY) : '',
        lastUsedAt: null
      },
      google: { 
        key: process.env.GOOGLE_CLIENT_ID ? 'configured' : '', 
        description: 'Google OAuth client credentials',
        masked: process.env.GOOGLE_CLIENT_ID ? 'client_••••' : '',
        lastUsedAt: null
      },
      microsoft: { 
        key: '', 
        description: 'Microsoft OAuth client credentials',
        masked: '',
        lastUsedAt: null
      },
      cloudflare: { 
        key: '', 
        description: 'Cloudflare API token for SSL management',
        masked: '',
        lastUsedAt: null
      },
      automation: { 
        key: '', 
        description: 'Zapier/Make.com webhook endpoints',
        masked: '',
        lastUsedAt: null
      }
    };

    res.json({ globals });
  } catch (error) {
    console.error('Integrations error:', error);
    res.status(500).json({ error: 'server_error' });
  }
}));

// PATCH /api/integrations/:key - Update global integration setting (super admin)
router.patch('/:key', withAuth(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    const { key } = req.params;
    const { value } = req.body;
    
    // Check super admin
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
    const isSuperAdmin = (roles || []).some(r => ['super_admin', 'superadmin', 'super-admin'].includes((r.role || '').toLowerCase()));
    if (!isSuperAdmin) return res.status(403).json({ error: 'super_admin_required' });

    // In a real implementation, you'd store this in a global_settings table
    // For now, return a mock response
    const global = {
      key: value ? 'configured' : '',
      description: `Updated ${key} configuration`,
      masked: value ? maskApiKey(value) : '',
      lastUsedAt: null
    };

    res.json({ global });
  } catch (error) {
    console.error('Update integration error:', error);
    res.status(500).json({ error: 'server_error' });
  }
}));

// GET /api/integrations/api-keys - List tenant API keys
router.get('/api-keys', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.user;
    const tenantId = req.tenantId;

    // Check tenant admin
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'admin_required' });
    }

    // Get API keys for this tenant (you'd need an api_keys table)
    // For now, return mock data
    const keys = [
      {
        id: '1',
        label: 'Production API Key',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        last_used_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tenant_id: tenantId
      }
    ];

    res.json({ keys });
  } catch (error) {
    console.error('API keys error:', error);
    res.status(500).json({ error: 'server_error' });
  }
})));

// POST /api/integrations/api-keys - Generate new API key
router.post('/api-keys', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.user;
    const tenantId = req.tenantId;

    // Check tenant admin
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'admin_required' });
    }

    // Generate new API key
    const apiKey = generateApiKey();
    
    // In real implementation, store in api_keys table
    const key = {
      id: crypto.randomUUID(),
      label: 'API Key',
      key: apiKey,
      created_at: new Date().toISOString(),
      last_used_at: null,
      tenant_id: tenantId
    };

    res.json({ key });
  } catch (error) {
    console.error('Generate API key error:', error);
    res.status(500).json({ error: 'server_error' });
  }
})));

// DELETE /api/integrations/api-keys/:id - Revoke API key
router.delete('/api-keys/:id', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.user;
    const tenantId = req.tenantId;
    const { id } = req.params;

    // Check tenant admin
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'admin_required' });
    }

    // In real implementation, delete from api_keys table
    res.json({ ok: true });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'server_error' });
  }
})));



// POST /api/integrations/webhooks - Create webhook
router.post('/webhooks', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.user;
    const tenantId = req.tenantId;
    const { url, events, enabled } = req.body;

    // Check tenant admin
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'admin_required' });
    }

    if (!url) {
      return res.status(400).json({ error: 'url_required' });
    }

    // In real implementation, store in webhooks table
    const webhook = {
      id: crypto.randomUUID(),
      url,
      events: events || 'all',
      enabled: enabled !== false,
      created_at: new Date().toISOString(),
      tenant_id: tenantId
    };

    res.json({ webhook });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({ error: 'server_error' });
  }
})));

// POST /api/integrations/webhooks/:id/test - Test webhook
router.post('/webhooks/:id/test', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.user;
    const tenantId = req.tenantId;
    const { id } = req.params;

    // Check tenant admin
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'admin_required' });
    }

    // In real implementation, send test webhook
    res.json({ ok: true, message: 'Test webhook sent' });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'server_error' });
  }
})));

// DELETE /api/integrations/webhooks/:id - Delete webhook
router.delete('/webhooks/:id', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.user;
    const tenantId = req.tenantId;
    const { id } = req.params;

    // Check tenant admin
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({ error: 'admin_required' });
    }

    // In real implementation, delete from webhooks table
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({ error: 'server_error' });
  }
})));

// Enhanced GET /api/integrations/webhooks - Handle both tenant and super admin webhook debugger
router.get('/webhooks', async (req, res) => {
  try {
    const supabase = getSupabase();
    const { tenantId } = req.query;
    
    // If tenantId query param, this is super admin webhook debugger
    if (tenantId) {
      const user = req.authedUser;
      if (!user) return res.status(401).json({ error: 'unauthorized' });
      const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
      const isSuperAdmin = (roles || []).some(r => ['super_admin', 'superadmin', 'super-admin'].includes((r.role || '').toLowerCase()));
      if (!isSuperAdmin) return res.status(403).json({ error: 'super_admin_required' });

      // Mock webhook delivery data for debugger
      const deliveries = [
        {
          id: '1',
          event: 'form.submitted',
          status: 200,
          deliveredAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          event: 'file.uploaded',
          status: 404,
          deliveredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];

      return res.json({ deliveries });
    }

    // Otherwise, this is regular tenant webhook listing - use middleware
    return withAuth(withTenant(async (req, res) => {
      const supabase = getSupabase();
      const user = req.user;
      const tenantId = req.tenantId;

      // Check tenant admin
      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return res.status(403).json({ error: 'admin_required' });
      }

      // Get webhooks for this tenant (you'd need a webhooks table)
      // For now, return mock data
      const webhooks = [
        {
          id: '1',
          url: 'https://example.com/webhook',
          events: 'all',
          enabled: true,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          tenant_id: tenantId
        }
      ];

      res.json({ webhooks });
    }))(req, res);
  } catch (error) {
    console.error('Webhooks error:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

// PATCH /api/integrations/webhooks/replay - Replay webhook (super admin)
router.patch('/webhooks/replay', withAuth(async (req, res) => {
  try {
    const supabase = getSupabase();
    const user = req.authedUser;
    const { id } = req.body;

    // Check super admin
    if (!user) return res.status(401).json({ error: 'unauthorized' });
    const { data: roles } = await supabase.from('user_global_roles').select('role').eq('user_id', user.id);
    const isSuperAdmin = (roles || []).some(r => ['super_admin', 'superadmin', 'super-admin'].includes((r.role || '').toLowerCase()));
    if (!isSuperAdmin) return res.status(403).json({ error: 'super_admin_required' });

    // In real implementation, replay the webhook
    res.json({ ok: true, message: 'Webhook replayed' });
  } catch (error) {
    console.error('Replay webhook error:', error);
    res.status(500).json({ error: 'server_error' });
  }
}));

export default router;
