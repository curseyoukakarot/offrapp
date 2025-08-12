import { createClient } from '@supabase/supabase-js';

// Vercel serverless function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, new_password } = req.body;
  if (!user_id || !new_password) {
    return res.status(400).json({ error: 'Missing user_id or new_password' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Use the admin API to update the user's password
  const { error } = await supabase.auth.admin.updateUserById(user_id, {
    password: new_password,
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
} 