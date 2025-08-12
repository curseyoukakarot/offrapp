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

  const { id } = body;

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

  // ✅ Step 1: Delete from users table FIRST
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!dbRes.ok) {
    const error = await dbRes.text();
    console.error('❌ DB delete error:', error);
    return new Response(JSON.stringify({ success: false, error }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  // ✅ Step 2: Delete from Supabase Auth
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

  console.log('✅ User deleted:', id);

  return new Response(JSON.stringify({ success: true, id }), {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
  });
});
