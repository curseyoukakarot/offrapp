import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

interface Membership {
  tenant_id: string;
  role: string;
  tenant_name?: string;
}

interface ActiveTenantContextType {
  scope: 'super' | 'tenant';
  activeTenantId: string | null;
  memberships: Membership[];
  isSuperAdmin: boolean;
  setScope: (scope: 'super' | 'tenant') => void;
  setActiveTenantId: (tenantId: string | null) => void;
  loading: boolean;
}

const ActiveTenantContext = createContext<ActiveTenantContextType>({
  scope: 'tenant',
  activeTenantId: null,
  memberships: [],
  isSuperAdmin: false,
  setScope: () => {},
  setActiveTenantId: () => {},
  loading: true,
});

export const ActiveTenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, user, isSuperAdmin, loading: authLoading } = useAuth();
  const [scope, setScope] = useState<'super' | 'tenant'>('tenant');
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  // Storage keys per user
  const getStorageKey = (key: string) => user?.id ? `offrapp-${key}-${user.id}` : `offrapp-${key}`;

  // Load persisted state
  useEffect(() => {
    if (!user || authLoading) return;
    
    const savedScope = localStorage.getItem(getStorageKey('scope')) as 'super' | 'tenant' | null;
    const savedTenantId = localStorage.getItem(getStorageKey('active-tenant-id'));
    
    if (savedScope) setScope(savedScope);
    if (savedTenantId) setActiveTenantId(savedTenantId);
  }, [user, authLoading]);

  // Fetch memberships and resolve active tenant
  useEffect(() => {
    if (!session || !user || authLoading) {
      setLoading(false);
      return;
    }

    const loadMemberships = async () => {
      try {
        setLoading(true);
        
        // Fetch user's memberships with tenant names
        const { data: membershipData } = await supabase
          .from('memberships')
          .select(`
            tenant_id,
            role,
            tenants:tenant_id (
              name
            )
          `)
          .eq('user_id', user.id);

        const mems: Membership[] = (membershipData || []).map(m => ({
          tenant_id: m.tenant_id,
          role: m.role,
          tenant_name: (m as any).tenants?.name || 'Unknown Tenant'
        }));

        setMemberships(mems);

        // Determine initial scope and active tenant
        const urlParams = new URLSearchParams(window.location.search);
        const urlTenantId = urlParams.get('tenant_id');
        
        if (isSuperAdmin && !urlTenantId) {
          // Super admin defaults to super scope unless specific tenant requested
          setScope('super');
          setActiveTenantId(null);
        } else if (mems.length > 0) {
          // Has memberships - use tenant scope
          setScope('tenant');
          
          // Determine active tenant: URL param > saved > first membership
          const targetTenantId = urlTenantId || 
                                 activeTenantId || 
                                 mems[0]?.tenant_id || 
                                 null;
          
          // Verify the target tenant is in user's memberships
          const validTenant = mems.find(m => m.tenant_id === targetTenantId);
          if (validTenant) {
            setActiveTenantId(targetTenantId);
          } else if (mems.length > 0) {
            setActiveTenantId(mems[0].tenant_id);
          }
        } else {
          // No memberships - redirect to onboarding or error
          console.warn('User has no tenant memberships');
          setScope('tenant');
          setActiveTenantId(null);
        }
        
      } catch (error) {
        console.error('Error loading memberships:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMemberships();
  }, [session, user, isSuperAdmin, authLoading]);

  // Persist state changes
  useEffect(() => {
    if (!user) return;
    localStorage.setItem(getStorageKey('scope'), scope);
  }, [scope, user]);

  useEffect(() => {
    if (!user) return;
    if (activeTenantId) {
      localStorage.setItem(getStorageKey('active-tenant-id'), activeTenantId);
    } else {
      localStorage.removeItem(getStorageKey('active-tenant-id'));
    }
  }, [activeTenantId, user]);

  const handleSetScope = (newScope: 'super' | 'tenant') => {
    setScope(newScope);
    
    if (newScope === 'super') {
      setActiveTenantId(null);
      // Update URL to remove tenant_id param
      const url = new URL(window.location.href);
      url.searchParams.delete('tenant_id');
      window.history.replaceState({}, '', url.toString());
    } else if (newScope === 'tenant' && memberships.length > 0 && !activeTenantId) {
      // Auto-select first tenant when switching to tenant scope
      setActiveTenantId(memberships[0].tenant_id);
    }
  };

  const handleSetActiveTenantId = (tenantId: string | null) => {
    setActiveTenantId(tenantId);
    
    if (tenantId && scope === 'tenant') {
      // Update URL to include tenant_id param
      const url = new URL(window.location.href);
      url.searchParams.set('tenant_id', tenantId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  const value: ActiveTenantContextType = {
    scope,
    activeTenantId,
    memberships,
    isSuperAdmin,
    setScope: handleSetScope,
    setActiveTenantId: handleSetActiveTenantId,
    loading: loading || authLoading,
  };

  return (
    <ActiveTenantContext.Provider value={value}>
      {children}
    </ActiveTenantContext.Provider>
  );
};

export const useActiveTenant = () => {
  const context = useContext(ActiveTenantContext);
  if (context === undefined) {
    throw new Error('useActiveTenant must be used within an ActiveTenantProvider');
  }
  return context;
};
