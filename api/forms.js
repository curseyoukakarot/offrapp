import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const tenantId = String(req.headers['x-tenant-id'] || '').trim();

    if (req.method === 'GET') {
      const limit = Math.min(parseInt(String(req.query.limit || '200'), 10) || 200, 500);
      let query = supabase.from('forms').select('*').order('updated_at', { ascending: false }).limit(limit);
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ forms: data || [] });
    }

    if (req.method === 'POST') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyRaw = Buffer.concat(chunks).toString('utf8') || '{}';
      const body = JSON.parse(bodyRaw);
      
      const payload = {
        tenant_id: tenantId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      ['title','description','status','schema','assigned_roles','theme','published'].forEach((k) => {
        if (body[k] !== undefined) payload[k] = body[k];
      });
      
      const { data, error } = await supabase.from('forms').insert([payload]).select('*').single();
      if (error) throw error;
      return res.status(200).json({ form: data });
    }

    if (req.method === 'PATCH') {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const bodyRaw = Buffer.concat(chunks).toString('utf8') || '{}';
      const body = JSON.parse(bodyRaw);
      const id = body.id;
      if (!id) return res.status(400).json({ error: 'id is required' });
      const patch = {};
      ['title','description','status','schema','assigned_roles','theme','published'].forEach((k) => {
        if (body[k] !== undefined) patch[k] = body[k];
      });
      patch.updated_at = new Date().toISOString();
      if (tenantId) patch.tenant_id = tenantId; // keep scoped if provided
      const { data, error } = await supabase.from('forms').update(patch).eq('id', id).select('*').maybeSingle();
      if (error) throw error;
      return res.status(200).json({ form: data });
    }

    if (req.method === 'DELETE') {
      // Extract form ID from URL path (e.g., /api/forms/b983cd53-250d-4e2e-91b4-387930698729)
      const url = new URL(req.url, `http://${req.headers.host}`);
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 1]; // Get the last part of the path
      
      if (!id || id === 'forms') {
        return res.status(400).json({ error: 'Form ID is required for deletion' });
      }
      
      // Build delete query with tenant scoping for security
      let deleteQuery = supabase.from('forms').delete().eq('id', id);
      if (tenantId) {
        deleteQuery = deleteQuery.eq('tenant_id', tenantId);
      }
      
      const { error } = await deleteQuery;
      if (error) throw error;
      
      return res.status(200).json({ success: true, message: 'Form deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('api/forms error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };

