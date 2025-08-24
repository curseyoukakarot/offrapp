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
      // Extract form ID from URL path - handle different URL formats
      let id;
      
      try {
        // Try multiple ways to extract the ID
        if (req.query && req.query.id) {
          // If ID is in query params: /api/forms?id=xxx
          id = String(req.query.id);
        } else {
          // Extract from URL path: /api/forms/xxx
          const urlPath = req.url.split('?')[0]; // Remove query params
          const pathParts = urlPath.split('/').filter(Boolean); // Remove empty parts
          id = pathParts[pathParts.length - 1]; // Get the last part
        }
        
        console.log('DELETE request - extracted ID:', id, 'from URL:', req.url);
        
        if (!id || id === 'forms' || id === 'api') {
          return res.status(400).json({ error: 'Form ID is required for deletion' });
        }
        
        // Validate ID format (should be a UUID)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(id)) {
          return res.status(400).json({ error: 'Invalid form ID format' });
        }
        
        // Build delete query with tenant scoping for security
        let deleteQuery = supabase.from('forms').delete().eq('id', id);
        if (tenantId) {
          deleteQuery = deleteQuery.eq('tenant_id', tenantId);
        }
        
        console.log('Attempting to delete form:', id, 'for tenant:', tenantId);
        
        const { error, count } = await deleteQuery;
        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
        
        console.log('Delete successful, affected rows:', count);
        return res.status(200).json({ success: true, message: 'Form deleted successfully' });
        
      } catch (parseError) {
        console.error('Error parsing DELETE request:', parseError);
        return res.status(400).json({ error: 'Invalid request format' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('api/forms error', e);
    return res.status(500).json({ error: e.message });
  }
}

export const config = { api: { bodyParser: false } };

