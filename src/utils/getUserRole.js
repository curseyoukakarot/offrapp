import { supabase } from '../supabaseClient';

// Fetches the user's role from the public.users table using their id
export async function getUserRole(userId) {
  if (!userId) {
    console.error('getUserRole: No userId provided');
    throw new Error('No user ID provided');
  }
  
  console.log('getUserRole: Fetching role for userId:', userId);
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
      
    console.log('getUserRole: Query result:', { data, error });
    
    if (error) {
      console.error('getUserRole: Error fetching role:', error.message);
      throw error;
    }
    
    if (!data?.role) {
      console.error('getUserRole: No role found for user');
      throw new Error('No role found for user');
    }
    
    console.log('getUserRole: Found role:', data.role);
    return data.role;
  } catch (error) {
    console.error('getUserRole: Unexpected error:', error);
    throw error;
  }
}
  