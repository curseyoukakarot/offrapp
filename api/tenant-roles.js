import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-tenant-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // Check if user has access to this tenant (membership check)
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    if (req.method === 'GET') {
      // Get tenant roles
      const { data: roles, error } = await supabase
        .from('tenant_roles')
        .select('role_key, role_label, role_color, is_active, sort_order')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch roles' });
      }

      return res.status(200).json({ roles: roles || [] });
    }

    if (req.method === 'PUT') {
      // Update tenant roles
      const { roles } = req.body;

      if (!Array.isArray(roles)) {
        return res.status(400).json({ error: 'Roles must be an array' });
      }

      // Delete existing roles for this tenant
      await supabase
        .from('tenant_roles')
        .delete()
        .eq('tenant_id', tenantId);

      // Insert new roles
      const roleInserts = roles.map((role, index) => ({
        tenant_id: tenantId,
        role_key: role.role_key,
        role_label: role.role_label,
        role_color: role.role_color,
        sort_order: index + 1,
        is_active: true
      }));

      const { error: insertError } = await supabase
        .from('tenant_roles')
        .insert(roleInserts);

      if (insertError) {
        return res.status(500).json({ error: 'Failed to save roles' });
      }

      return res.status(200).json({ message: 'Roles updated successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Tenant roles API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
