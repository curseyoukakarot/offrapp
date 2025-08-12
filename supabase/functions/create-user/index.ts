import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
  'Content-Type': 'application/json',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      status: 200,
      headers: corsHeaders,
    });
  }
  console.log('🔔 Function hit');

  let body;
  try {
    body = await req.json();
    console.log('📦 Body:', body);
  } catch (e) {
    console.error('❌ Invalid JSON:', e);
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON input' }),
      { 
        status: 400,
        headers: corsHeaders
      }
    );
  }

  const { email, password, role } = body;
  console.log('📝 Creating user with role:', role);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const headers = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1. Create the auth user
  console.log('🔑 Creating auth user with metadata:', { app_metadata: { role } });
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
    }),
  });

  const authData = await authRes.json();
  console.log('👤 Auth user created:', authData);
  console.log('🔍 Auth user metadata:', authData.user?.app_metadata);

  if (!authRes.ok) {
    console.error('❌ Auth user error:', authData);
    return new Response(
      JSON.stringify({ success: false, error: authData }), 
      { 
        status: 400,
        headers: corsHeaders
      }
    );
  }

  const userId = authData.id;

  // 2. Insert into users table
  console.log('📥 Inserting into users table with role:', role);
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify([
      {
        id: userId,
        email,
        role,
      },
    ]),
  });

  const insertText = await insertRes.text();
  console.log('📥 Insert result:', insertText);

  if (!insertRes.ok) {
    console.error('❌ Error inserting into users table:', insertText);
    return new Response(
      JSON.stringify({ success: false, error: insertText }), 
      {
        status: 400,
        headers: corsHeaders
      }
    );
  }

  // 3. Verify the role was set correctly
  console.log('🔍 Verifying role assignment...');
  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'GET',
    headers,
  });
  const verifyData = await verifyRes.json();
  console.log('✅ Final user metadata:', verifyData.user?.app_metadata);

  return new Response(
    JSON.stringify({
      success: true,
      userId: userId ?? 'unknown',
      metadata: verifyData.user?.app_metadata,
    }),
    {
      status: 200,
      headers: corsHeaders
    }
  );
});