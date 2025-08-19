import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { withAuth, withTenant } from '../middleware/auth.js';

const router = express.Router();

const getSupabase = () => {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
};

// GET /api/tenant-roles - Get custom roles for a tenant
router.get('/', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const tenantId = req.tenantId;

    const { data: roles, error } = await supabase
      .from('tenant_roles')
      .select('role_key, role_label, role_color, is_active, sort_order')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      console.error('Error fetching tenant roles:', error);
      return res.status(500).json({ error: 'Failed to fetch roles' });
    }

    return res.json({ roles: roles || [] });
  } catch (error) {
    console.error('Tenant roles GET error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
})));

// PUT /api/tenant-roles - Update custom roles for a tenant
router.put('/', withAuth(withTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const tenantId = req.tenantId;
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
      console.error('Error saving tenant roles:', insertError);
      return res.status(500).json({ error: 'Failed to save roles' });
    }

    return res.json({ message: 'Roles updated successfully' });
  } catch (error) {
    console.error('Tenant roles PUT error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
})));

export default router;
