import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

type Plan = 'starter' | 'pro' | 'advanced';

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !key) throw new Error('Supabase env not configured');
  return createClient(url, key);
}

async function fetchTenantAndUsage(supabase: SupabaseClient, tenantId: string) {
  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .select('id, plan, seats_purchased')
    .eq('id', tenantId)
    .single();
  if (tErr) throw tErr;
  const { data: usage, error: uErr } = await supabase
    .from('tenant_usage')
    .select('clients_count, team_count')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (uErr) throw uErr;
  return { tenant, usage: usage || { clients_count: 0, team_count: 1 } } as {
    tenant: { id: string; plan: Plan; seats_purchased: number };
    usage: { clients_count: number; team_count: number };
  };
}

export async function ensureClientCapacity(tenantId: string, supabase?: SupabaseClient) {
  const sb = supabase || getSupabase();
  const { tenant, usage } = await fetchTenantAndUsage(sb as SupabaseClient, tenantId);
  const plan = String(tenant.plan || 'starter').toLowerCase() as Plan;
  if (plan === 'starter' && usage.clients_count >= 30) {
    const e: any = new Error('Starter plan allows up to 30 clients.');
    e.code = 'LIMIT_REACHED';
    e.status = 409;
    throw e;
  }
  if (plan === 'pro' && usage.clients_count >= 500) {
    const e: any = new Error('Pro plan allows up to 500 clients.');
    e.code = 'LIMIT_REACHED';
    e.status = 409;
    throw e;
  }
  // advanced: no cap
}

export async function ensureTeamCapacity(tenantId: string, supabase?: SupabaseClient) {
  const sb = supabase || getSupabase();
  const { tenant, usage } = await fetchTenantAndUsage(sb as SupabaseClient, tenantId);
  const plan = String(tenant.plan || 'starter').toLowerCase() as Plan;
  const seats = Math.max(1, Number(tenant.seats_purchased || 1));

  if (plan === 'starter') {
    // Allow only the very first admin (team_count <= 1)
    if ((usage.team_count || 0) > 1) {
      const e: any = new Error('Add team members is a Pro/Advanced feature.');
      e.code = 'NOT_ALLOWED';
      e.status = 403;
      throw e;
    }
    return;
  }

  // pro/advanced: enforce seats
  if ((usage.team_count || 0) >= seats) {
    const e: any = new Error('All seats in use. Add more seats on Billing.');
    e.code = 'SEATS_REQUIRED';
    e.status = 409;
    throw e;
  }
}


