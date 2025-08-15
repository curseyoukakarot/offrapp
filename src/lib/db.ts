import { createClient } from '@supabase/supabase-js';

export function sbAnon() {
  return createClient(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '');
}

export function sbService() {
  return createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
}


