import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables not configured');
  }
  return createClient(url, key);
}

/**
 * Middleware to authenticate user via JWT and attach to req.user
 */
export const withAuth = (handler) => async (req, res) => {
  try {
    const supabase = getSupabase();
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'unauthorized - missing token' });
    }
    
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'unauthorized - invalid token' });
    }
    
    req.user = data.user;
    req.supabase = supabase;
    return handler(req, res);
  } catch (error) {
    console.error('withAuth error:', error);
    return res.status(500).json({ error: 'authentication failed' });
  }
};

/**
 * Middleware to verify user belongs to the requested tenant
 */
export const withTenant = (handler) => async (req, res) => {
  try {
    const user = req.user;
    const supabase = req.supabase;
    const tenantId = req.headers['x-tenant-id'];
    
    if (!tenantId) {
      return res.status(400).json({ error: 'x-tenant-id header required' });
    }
    
    // Verify membership
    const { data: membership, error } = await supabase
      .from('memberships')
      .select('tenant_id, role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Membership check error:', error);
      return res.status(500).json({ error: 'membership verification failed' });
    }
    
    if (!membership) {
      return res.status(403).json({ error: 'not a member of this tenant' });
    }
    
    req.tenantId = tenantId;
    req.membership = membership;
    return handler(req, res);
  } catch (error) {
    console.error('withTenant error:', error);
    return res.status(500).json({ error: 'tenant verification failed' });
  }
};

/**
 * Middleware that allows super admin without tenant header, otherwise requires tenant membership
 */
export const withSuperOrTenant = (handler) => async (req, res) => {
  try {
    const user = req.user;
    const supabase = req.supabase;
    
    // Check if user is super admin
    const { data: globalRoles } = await supabase
      .from('user_global_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isSuper = (globalRoles || []).some(r => 
      ['super_admin', 'superadmin', 'super-admin'].includes(String(r.role || '').toLowerCase())
    );
    
    if (isSuper) {
      req.isSuperAdmin = true;
      req.tenantId = req.headers['x-tenant-id'] || null; // Optional for super admin
      return handler(req, res);
    }
    
    // Not super admin - require tenant membership
    return withTenant(handler)(req, res);
  } catch (error) {
    console.error('withSuperOrTenant error:', error);
    return res.status(500).json({ error: 'authorization check failed' });
  }
};

/**
 * Middleware to check super admin role specifically
 */
export const withSuperAdmin = (handler) => async (req, res) => {
  try {
    const user = req.user;
    const supabase = req.supabase;
    
    const { data: globalRoles } = await supabase
      .from('user_global_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isSuper = (globalRoles || []).some(r => 
      ['super_admin', 'superadmin', 'super-admin'].includes(String(r.role || '').toLowerCase())
    );
    
    if (!isSuper) {
      return res.status(403).json({ error: 'super admin access required' });
    }
    
    req.isSuperAdmin = true;
    return handler(req, res);
  } catch (error) {
    console.error('withSuperAdmin error:', error);
    return res.status(500).json({ error: 'super admin check failed' });
  }
};
