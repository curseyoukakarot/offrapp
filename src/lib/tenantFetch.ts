/**
 * Tenant-aware fetch wrapper that automatically injects x-tenant-id header
 * based on the current scope and active tenant context
 */

export interface TenantFetchOptions extends RequestInit {
  scope?: 'super' | 'tenant' | 'auto';
  tenantId?: string;
}

export async function tenantFetch(
  path: string, 
  options: TenantFetchOptions = {},
  activeTenantId?: string,
  currentScope: 'super' | 'tenant' = 'tenant'
): Promise<Response> {
  const { scope = 'auto', tenantId, ...fetchOptions } = options;
  
  // Determine effective scope
  let effectiveScope = scope;
  if (scope === 'auto') {
    effectiveScope = currentScope;
  }
  
  // Prepare headers
  const headers = new Headers(fetchOptions.headers || {});
  
  // Inject tenant header for tenant-scoped requests
  if (effectiveScope === 'tenant') {
    const targetTenantId = tenantId || activeTenantId;
    if (targetTenantId) {
      headers.set('x-tenant-id', targetTenantId);
    }
  }
  
  // Add auth header if available
  try {
    const { data } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
    if (data.session?.access_token) {
      headers.set('Authorization', `Bearer ${data.session.access_token}`);
    }
  } catch (error) {
    console.warn('Could not get auth token for request:', error);
  }
  
  return fetch(path, {
    ...fetchOptions,
    headers,
  });
}

/**
 * Hook version that uses the ActiveTenantContext automatically
 */
export function useTenantFetch() {
  // This will be imported and used after ActiveTenantContext is integrated
  return {
    tenantFetch: (path: string, options: TenantFetchOptions = {}) => {
      // Will be enhanced to use useActiveTenant() hook
      return tenantFetch(path, options);
    }
  };
}
