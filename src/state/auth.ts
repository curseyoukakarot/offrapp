import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

export type Membership = {
  tenant_id: string;
  role: string;
};

export type Tenant = {
  id: string;
  name?: string;
  slug?: string;
};

type AuthState = {
  user: any;
  isSuperAdmin: boolean;
  memberships: Membership[];
  activeTenant: Tenant | null;
  setActiveTenant: (tenant: Tenant | null) => void;
  loading: boolean;
};

const ACTIVE_TENANT_KEY = 'offrapp-active-tenant-id';

export function useAuth(): AuthState {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);

  // Persist active tenant
  const setActiveTenant = (tenant: Tenant | null) => {
    setActiveTenantState(tenant);
    if (tenant?.id) localStorage.setItem(ACTIVE_TENANT_KEY, tenant.id);
    else localStorage.removeItem(ACTIVE_TENANT_KEY);
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      setLoading(true);
      const { data: userResp } = await supabase.auth.getUser();
      const authedUser = userResp?.user || null;
      if (!mounted) return;
      setUser(authedUser);
      if (!authedUser) {
        setMemberships([]);
        setIsSuperAdmin(false);
        setActiveTenant(null);
        setLoading(false);
        return;
      }

      // Global roles → isSuperAdmin
      const { data: globalRoles } = await supabase
        .from('user_global_roles')
        .select('role')
        .eq('user_id', authedUser.id);
      const rolesList = (globalRoles || []).map((r: any) => (r.role || '').toLowerCase());
      const superFlag = rolesList.includes('super_admin') || rolesList.includes('superadmin') || rolesList.includes('super-admin');
      if (!mounted) return;
      setIsSuperAdmin(superFlag);

      // Memberships
      const { data: mems } = await supabase
        .from('memberships')
        .select('tenant_id, role');
      setMemberships(mems || []);

      // Resolve tenant records for switcher label (best-effort)
      const tenantIds = Array.from(new Set((mems || []).map((m: any) => m.tenant_id)));
      if (tenantIds.length) {
        const { data: trows } = await supabase
          .from('tenants')
          .select('id, name, slug')
          .in('id', tenantIds);
        setTenants(trows || []);
      } else {
        setTenants([]);
      }

      // Active tenant from storage fallback to first membership
      const storedId = localStorage.getItem(ACTIVE_TENANT_KEY);
      const pick = (tenantsList: Tenant[], id?: string | null): Tenant | null => {
        if (!tenantsList.length) return null;
        if (id) {
          const found = tenantsList.find((t) => t.id === id);
          if (found) return found;
        }
        return tenantsList[0];
      };
      const nextActive = pick(tenants.length ? tenants : (await supabase.from('tenants').select('id, name, slug').in('id', tenantIds)).data || [], storedId);
      setActiveTenant(nextActive);
      setLoading(false);
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Memoize API headers with x-tenant-id for convenience
  const headers = useMemo(() => {
    return activeTenant?.id ? { 'x-tenant-id': activeTenant.id } : {};
  }, [activeTenant?.id]);
  // Note: headers not returned directly to avoid API coupling; consumers can derive

  return { user, isSuperAdmin, memberships, activeTenant, setActiveTenant, loading } as AuthState;
}


