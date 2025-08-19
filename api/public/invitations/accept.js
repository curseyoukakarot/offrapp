import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getAuthedUser(req) {
  const supabase = getSupabase();
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data?.user || null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  const supabase = getSupabase();
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'missing_token' });

    const { data: inv, error } = await supabase.from('invitations').select('*').eq('token', token).single();
    if (error || !inv) return res.status(400).json({ error: 'invalid_token' });
    if (inv.status !== 'pending') return res.status(400).json({ error: 'not_pending' });
    if (new Date(inv.expires_at).getTime() < Date.now()) return res.status(400).json({ error: 'expired' });

    const authed = await getAuthedUser(req);
    let userId = authed?.id || null;
    if (!userId) {
      // Not logged in; let the client route to signup with invite
      const redirect = inv.bypass_billing
        ? `/signup?invite=${encodeURIComponent(token)}&bypass_billing=1`
        : `/signup?invite=${encodeURIComponent(token)}`;
      return res.status(200).json({ ok: true, redirect });
    }

    // Attach membership if tenant invite
    if (inv.tenant_id && userId) {
      try {
        await supabase
          .from('memberships')
          .upsert({ 
            tenant_id: inv.tenant_id, 
            user_id: userId, 
            role: inv.role,
            status: 'active'
          }, { onConflict: 'tenant_id,user_id' });
        console.log('✅ Membership attached:', { tenant_id: inv.tenant_id, user_id: userId, role: inv.role });
      } catch (membershipError) {
        console.error('❌ Failed to attach membership:', membershipError);
        // Continue anyway - user can be manually added later
      }
    }
    
    try {
      await supabase.from('invitations').update({ status: 'accepted' }).eq('id', inv.id);
      console.log('✅ Invitation marked as accepted:', inv.id);
    } catch (inviteError) {
      console.error('❌ Failed to mark invitation accepted:', inviteError);
      // Continue anyway
    }
    const redirect = inv.bypass_billing
      ? `/onboarding?tenant=${inv.tenant_id}&bypass_billing=1`
      : `/`;
    return res.status(200).json({ ok: true, redirect, tenant_id: inv.tenant_id, bypass_billing: !!inv.bypass_billing });
  } catch (e) {
    console.error('api/public/invitations/accept error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: true } };


