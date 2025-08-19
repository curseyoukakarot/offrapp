import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env not configured');
  return createClient(url, key);
}

async function fetchTenantAndUsage(supabase, tenantId) {
  const { data: tenant, error: tErr } = await supabase
    .from('tenants')
    .select('id, plan, tier, seats_purchased, seats_total')
    .eq('id', tenantId)
    .single();
  if (tErr) throw tErr;
  const { data: usage, error: uErr } = await supabase
    .from('tenant_usage')
    .select('clients_count, team_count')
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (uErr) throw uErr;
  // Fix plan/tier mismatch: prefer tier first
  if (tenant) {
    tenant.plan = tenant.tier || tenant.plan || 'starter';  // Prefer tier first
    tenant.seats_purchased = tenant.seats_purchased || tenant.seats_total || 1;
  }
  return { tenant, usage: usage || { clients_count: 0, team_count: 1 } };
}

export async function ensureClientCapacity(tenantId, supabase) {
  const sb = supabase || getSupabase();
  const { tenant, usage } = await fetchTenantAndUsage(sb, tenantId);
  const plan = String(tenant.plan || 'starter').toLowerCase();
  if (plan === 'starter' && usage.clients_count >= 30) {
    const e = new Error('Starter plan allows up to 30 clients.');
    e.code = 'LIMIT_REACHED';
    e.status = 409;
    throw e;
  }
  if (plan === 'pro' && usage.clients_count >= 500) {
    const e = new Error('Pro plan allows up to 500 clients.');
    e.code = 'LIMIT_REACHED';
    e.status = 409;
    throw e;
  }
  // advanced: no cap
}

export async function ensureTeamCapacity(tenantId, supabase) {
  const sb = supabase || getSupabase();
  const { tenant, usage } = await fetchTenantAndUsage(sb, tenantId);
  const plan = String(tenant.plan || 'starter').toLowerCase();
  const seats = Math.max(1, Number(tenant.seats_purchased || 1));

  if (plan === 'starter') {
    // Allow only the very first admin (team_count <= 1)
    if ((usage.team_count || 0) > 1) {
      const e = new Error('Add team members is a Pro/Advanced feature.');
      e.code = 'NOT_ALLOWED';
      e.status = 403;
      throw e;
    }
    return;
  }

  // pro/advanced: enforce seats
  if ((usage.team_count || 0) >= seats) {
    const e = new Error('All seats in use. Add more seats on Billing.');
    e.code = 'SEATS_REQUIRED';
    e.status = 409;
    throw e;
  }
}


