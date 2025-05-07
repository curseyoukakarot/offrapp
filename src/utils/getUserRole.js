import { supabase } from '../supabaseClient';

// Fetches the user's role from the public.users table using their id
export async function getUserRole(userId) {
  if (!userId) {
    console.error('getUserRole: No userId provided');
    return 'guest';
  }
  
  console.log('getUserRole: Fetching role for userId:', userId);
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
    
  console.log('getUserRole: Query result:', { data, error });
  
  if (error) {
    console.error('getUserRole: Error fetching role:', error.message);
    return 'guest';
  }
  
  if (!data?.role) {
    console.error('getUserRole: No role found for user');
    return 'guest';
  }
  
  console.log('getUserRole: Found role:', data.role);
  return data.role;
}
  