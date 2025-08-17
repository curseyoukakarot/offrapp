import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': '*',
      },
    });
  }

  let body;
  try {
    body = await req.json();
    console.log('📦 Delete request body:', body);
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { id, deleteFiles } = body;

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Missing user ID' }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // ✅ Step 0: (optional) gather file keys before deleting the auth user (for storage cleanup)
  let fileKeys: string[] = [];
  if (deleteFiles) {
    try {
      const listRes = await fetch(`${SUPABASE_URL}/rest/v1/files?select=file_url&user_id=eq.${id}`, { headers });
      const list = listRes.ok ? await listRes.json() : [];
      for (const row of list) {
        const url: string = row.file_url || '';
        const match = url.match(/\/storage\/v1\/object\/public\/user-files\/(.*)$/);
        if (match && match[1]) fileKeys.push(match[1]);
      }
    } catch (e) {
      console.warn('⚠️ could not list files before delete:', e);
    }
  }

  // ✅ Step 1: Delete from Supabase Auth FIRST (DB cascades will clean public.*)
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!authRes.ok) {
    const error = await authRes.text();
    console.error('❌ Auth delete error:', error);
    return new Response(JSON.stringify({ success: false, error }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  // ✅ Step 2: If requested, remove storage objects and any lingering file rows
  if (deleteFiles && fileKeys.length > 0) {
    for (const key of fileKeys) {
      const delObj = await fetch(`${SUPABASE_URL}/storage/v1/object/user-files/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers,
      });
      if (!delObj.ok) {
        console.warn('⚠️ storage delete failed for', key, await delObj.text());
      }
    }
    // Best-effort: remove file rows that still reference this user (in case cascade set null earlier, this is harmless)
    await fetch(`${SUPABASE_URL}/rest/v1/files?user_id=eq.${id}`, { method: 'DELETE', headers });
  }

  console.log('✅ User deleted:', id);

  return new Response(JSON.stringify({ success: true, id }), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
});
