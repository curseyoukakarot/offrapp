import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key);
}

export async function logAudit({ action, entityType, entityId, tenantId, reason, before, after, req }) {
  try {
    const supabase = getSupabase();
    const actor = req?.authedUser?.id || null;
    const ip = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || null;
    const ua = req?.headers['user-agent'] || null;
    await supabase.from('audit_logs').insert([
      { action, entity_type: entityType, entity_id: entityId || null, tenant_id: tenantId || null, reason: reason || null, before: before || null, after: after || null, actor_user_id: actor, ip, ua },
    ]);
  } catch (e) {
    console.error('audit log failed', e);
  }
}


