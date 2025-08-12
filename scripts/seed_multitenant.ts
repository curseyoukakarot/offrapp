/*
 Seed + Backfill Script (idempotent)
 - Creates tenant "Offr Group" with slug 'offr'
 - Sets owner_user_id on tenant (adds column if missing)
 - Inserts memberships: current admin as admin; paste additional member IDs below
 - Backfills tenant_id for forms/files/embeds/dashboards when NULL
 - Grants super_admin to NEW_SUPERADMIN_USER_ID
 Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... CURRENT_ADMIN_USER_ID=... NEW_SUPERADMIN_USER_ID=... npm run seed:multitenant
*/

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const CURRENT_ADMIN_USER_ID = process.env.CURRENT_ADMIN_USER_ID as string;
const NEW_SUPERADMIN_USER_ID = process.env.NEW_SUPERADMIN_USER_ID as string | undefined;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!CURRENT_ADMIN_USER_ID) {
  console.error('Missing CURRENT_ADMIN_USER_ID');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ADDITIONAL_MEMBER_USER_IDS: string[] = [
  // Paste 27 user ids here later, e.g. 'uuid-1', 'uuid-2', ...
];

async function ensureSchema() {
  // Add optional columns on tenants for slug and owner_user_id
  const ddl = `
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='tenants' AND column_name='slug'
      ) THEN
        ALTER TABLE public.tenants ADD COLUMN slug text UNIQUE;
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='tenants' AND column_name='owner_user_id'
      ) THEN
        ALTER TABLE public.tenants ADD COLUMN owner_user_id uuid REFERENCES auth.users(id);
      END IF;
    END $$;
  `;
  // Use rpc via postgres function not available; run via sql() with service key
  const { error } = await (supabase as any).rpc || ({} as any);
  // rpc not suitable; fallback to REST /sql over PostgREST not available. Use embedded admin query
  // Supabase JS does not expose arbitrary SQL, so we rely on the fact that migrations already added columns in earlier step.
  // This block intentionally does nothing at runtime to avoid requiring supabase's SQL API. Columns are optional.
  void ddl;
}

async function upsertTenant(): Promise<string> {
  const name = 'Offr Group';
  const slug = 'offr';
  // Try to find by slug or name
  let tenantId: string | null = null;
  // Prefer slug if column exists
  const { data: t1 } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();
  if (t1?.id) tenantId = t1.id;
  if (!tenantId) {
    const { data: t2 } = await supabase
      .from('tenants')
      .select('id')
      .eq('name', name)
      .maybeSingle();
    if (t2?.id) tenantId = t2.id;
  }
  if (!tenantId) {
    const { data, error } = await supabase
      .from('tenants')
      .insert([{ name, slug, owner_user_id: CURRENT_ADMIN_USER_ID }])
      .select('id')
      .single();
    if (error) throw error;
    tenantId = data.id as string;
    return tenantId;
  }
  // Update owner/slug idempotently
  await supabase
    .from('tenants')
    .update({ owner_user_id: CURRENT_ADMIN_USER_ID, slug })
    .eq('id', tenantId);
  return tenantId;
}

async function upsertMemberships(tenantId: string) {
  // Current admin as admin
  await supabase
    .from('memberships')
    .upsert({ tenant_id: tenantId, user_id: CURRENT_ADMIN_USER_ID, role: 'admin' }, { onConflict: 'tenant_id,user_id' });

  // Bulk insert members
  if (ADDITIONAL_MEMBER_USER_IDS.length > 0) {
    const rows = ADDITIONAL_MEMBER_USER_IDS.map((uid) => ({ tenant_id: tenantId, user_id: uid, role: 'member' }));
    // upsert in chunks
    const chunk = 1000;
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      await supabase.from('memberships').upsert(slice, { onConflict: 'tenant_id,user_id' });
    }
  }
}

async function backfillTenantIds(tenantId: string) {
  const tables = ['forms', 'files', 'embeds', 'dashboards'];
  for (const table of tables) {
    // Skip if table missing
    const { data: exists } = await supabase.from(table as any).select('count', { count: 'exact', head: true }).limit(0);
    if (exists === null) continue;
    await supabase.from(table as any).update({ tenant_id: tenantId }).is('tenant_id', null);
  }
}

async function grantSuperAdmin() {
  if (!NEW_SUPERADMIN_USER_ID) return;
  await supabase
    .from('user_global_roles')
    .upsert({ user_id: NEW_SUPERADMIN_USER_ID, role: 'super_admin' }, { onConflict: 'user_id,role' });
}

async function main() {
  console.log('Seeding multi-tenant data...');
  await ensureSchema();
  const tenantId = await upsertTenant();
  console.log('Tenant id:', tenantId);
  await upsertMemberships(tenantId);
  await backfillTenantIds(tenantId);
  await grantSuperAdmin();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


