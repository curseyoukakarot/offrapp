import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const CompleteProfile = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const user = supabase.auth.user ? supabase.auth.user() : (await supabase.auth.getUser()).data.user;
    if (!user) {
      setError('User not found. Please log in again.');
      setLoading(false);
      return;
    }
    // Upsert profile
    const { error: upsertError } = await supabase.from('profiles').upsert({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      linkedin,
    });
    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }
    // Re-fetch the profile to ensure it's updated
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('id', user.id)
      .maybeSingle();
    if (profileError || !profile || !profile.first_name || !profile.last_name) {
      setError('Profile not saved correctly. Please try again.');
      setLoading(false);
      return;
    }
    // Fetch user role from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (userError || !userData?.role) {
      setError('Could not determine user role. Please contact support.');
      setLoading(false);
      return;
    }
    // Send welcome email using the existing user variable
    await import('../lib/api');
    await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        first_name: firstName,
        user_id: user.id
      }),
    });
    // Redirect based on role
    switch (userData.role) {
      case 'admin':
        navigate('/dashboard/admin');
        break;
      case 'recruitpro':
        navigate('/dashboard/recruitpro');
        break;
      case 'jobseeker':
        navigate('/dashboard/jobseeker');
        break;
      case 'client':
        navigate('/dashboard/client');
        break;
      default:
        navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-800">Complete Your Profile</h2>
        {error && <div className="text-red-600 text-center">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name</label>
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 w-full border border-gray-300 p-3 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 w-full border border-gray-300 p-3 rounded-md" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">LinkedIn (optional)</label>
          <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} className="mt-1 w-full border border-gray-300 p-3 rounded-md" placeholder="https://linkedin.com/in/yourprofile" />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile; 