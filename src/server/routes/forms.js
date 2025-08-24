import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { withAuth, withSuperOrTenant } from '../middleware/auth.js';

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key);
}

// GET /api/forms -> list forms for a tenant (or all if no header)
router.get('/', withAuth(withSuperOrTenant(async (req, res) => {
  try {
    const supabase = getSupabase();
    const tenantId = String(req.headers['x-tenant-id'] || '').trim();
    const limit = Math.min(parseInt(String(req.query.limit || '100'), 10) || 100, 500);

    if (!tenantId) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(JSON.stringify({ forms: [] }));
    }
    
    // Verify user belongs to this tenant (unless super admin)
    const userId = req.authedUser?.id;
    if (userId) {
      const { data: isSuperData } = await supabase.from('user_global_roles').select('role').eq('user_id', userId);
      const isSuper = (isSuperData || []).some(r => ['super_admin', 'superadmin', 'super-admin'].includes(String(r.role || '').toLowerCase()));
      
      if (!isSuper) {
        const { data: membership } = await supabase.from('memberships').select('tenant_id').eq('tenant_id', tenantId).eq('user_id', userId).maybeSingle();
        if (!membership) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(403).send(JSON.stringify({ error: 'not a member of this tenant' }));
        }
      }
    }
    
    let query = supabase
      .from('forms')
      .select('*')
      .eq('tenant_id', tenantId)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })
      .limit(limit);

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
})));

// DELETE /api/forms/:id -> delete a form (and its dependent data)
router.delete('/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    const id = req.params.id;

    // Best-effort cascade: delete form_responses first to avoid FK violations
    const { error: respErr } = await supabase.from('form_responses').delete().eq('form_id', id);
    if (respErr) {
      // Log but continue; parent delete may still succeed if no FK
      console.warn('DELETE /api/forms/:id form_responses error:', respErr.message);
    }

    // Delete the form record itself (hard delete)
    const { error: formErr } = await supabase.from('forms').delete().eq('id', id);
    if (formErr) {
      // If hard delete fails (e.g., unforeseen FKs), fallback to soft-delete
      console.warn('DELETE /api/forms/:id hard delete failed, attempting soft delete:', formErr.message);
      const { error: softErr } = await supabase
        .from('forms')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('id', id);
      if (softErr) throw softErr;
    }

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


