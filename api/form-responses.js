import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const formId = String(req.query.formId || '').trim();
    if (!formId) return res.status(400).json({ error: 'formId is required' });

    const { data, error } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const responses = data || [];
    // Enrich with user emails using admin API (tolerant to failures)
    const uniqueUserIds = Array.from(new Set(responses.map((r) => r.user_id).filter(Boolean)));
    const idToEmail = {};
    for (const uid of uniqueUserIds) {
      try {
        const { data: userData, error: userErr } = await supabase.auth.admin.getUserById(uid);
        if (!userErr && userData?.user) idToEmail[uid] = userData.user.email || null;
      } catch (_) {
        // ignore
      }
    }

    const enriched = responses.map((r) => ({ ...r, user_email: r.user_id ? (idToEmail[r.user_id] || null) : null }));
    return res.status(200).json({ responses: enriched });
  } catch (e) {
    console.error('api/form-responses GET error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };
