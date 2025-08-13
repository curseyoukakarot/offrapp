import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key);
}

// GET /api/forms -> list forms for a tenant (or all if no header)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase();
    const tenantId = String(req.headers['x-tenant-id'] || '').trim();
    const limit = Math.min(parseInt(String(req.query.limit || '100'), 10) || 100, 500);

    let query = supabase.from('forms').select('*').order('updated_at', { ascending: false }).limit(limit);
    // Include global (tenant_id IS NULL) plus active tenant
    if (tenantId) query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);

    const { data, error, status } = await query;
    if (error) {
      console.warn('GET /api/forms supabase error:', status, error.message);
      // Return empty list on auth/rls errors to avoid HTML error pages surfacing to client
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify({ forms: [] }));
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ forms: data || [] }));
  } catch (e) {
    console.error('GET /api/forms exception:', e);
    // Fail soft with empty list so the client never parses HTML
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify({ forms: [] }));
  }
});

// DELETE /api/forms/:id -> delete a form
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const id = req.params.id;
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/forms/:id error:', e);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/forms/:id/copy -> duplicate a form
router.post('/:id/copy', async (req, res) => {
  try {
    const supabase = getSupabase();
    const id = req.params.id;
    const { data: src, error: readErr } = await supabase.from('forms').select('*').eq('id', id).maybeSingle();
    if (readErr) throw readErr;
    if (!src) return res.status(404).json({ error: 'Form not found' });
    const copy = { ...src };
    delete copy.id;
    copy.title = `${src.title || 'Untitled'} (Copy)`;
    copy.created_at = new Date().toISOString();
    copy.updated_at = new Date().toISOString();
    const { data: inserted, error: insErr } = await supabase.from('forms').insert([copy]).select('*').single();
    if (insErr) throw insErr;
    res.json({ form: inserted });
  } catch (e) {
    console.error('POST /api/forms/:id/copy error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;


