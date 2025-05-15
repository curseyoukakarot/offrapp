import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useUser } from '../lib/useUser';

const Settings = () => {
  const { user } = useUser();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Email
  const [email, setEmail] = useState('');
  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Contact Info
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchRoleAndProfile = async () => {
      setLoading(true);
      // Get role
      const { data: userRow } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      setRole(userRow?.role || 'authenticated');
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, linkedin')
        .eq('id', user.id)
        .maybeSingle();
      setPhone(profile?.phone || '');
      setLinkedin(profile?.linkedin || '');
      setEmail(user.email || '');
      setLoading(false);
    };
    fetchRoleAndProfile();
  }, [user]);

  // Change password
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSuccess(''); setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    // Re-authenticate and update password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (signInError) {
      setError('Current password is incorrect.');
      return;
    }
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
    if (pwError) setError(pwError.message);
    else setSuccess('Password updated successfully!');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  // Change email
  const handleEmailChange = async (e) => {
    e.preventDefault();
    setSuccess(''); setError('');
    if (!email) {
      setError('Email cannot be empty.');
      return;
    }
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) setError(emailError.message);
    else setSuccess('Email updated! Please check your inbox to confirm.');
  };

  // Update contact info
  const handleContactInfo = async (e) => {
    e.preventDefault();
    setSuccess(''); setError('');
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, phone, linkedin });
    if (profileError) setError(profileError.message);
    else setSuccess('Contact info updated!');
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-gray-600">Loading...</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <main className="flex-1 bg-gray-50 p-8 ml-64 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        {success && <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">{success}</div>}
        {error && <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">{error}</div>}

        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <h2 className="font-semibold mb-2">Change Password</h2>
          <input type="password" placeholder="Current Password" className="w-full border p-2 rounded" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          <input type="password" placeholder="New Password" className="w-full border p-2 rounded" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <input type="password" placeholder="Confirm New Password" className="w-full border p-2 rounded" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Update Password</button>
        </form>

        {/* Change Email */}
        <form onSubmit={handleEmailChange} className="bg-white p-4 rounded shadow mb-6 space-y-3">
          <h2 className="font-semibold mb-2">Change Email</h2>
          <input type="email" placeholder="Email" className="w-full border p-2 rounded" value={email} onChange={e => setEmail(e.target.value)} />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Update Email</button>
        </form>

        {/* Contact Info */}
        <form onSubmit={handleContactInfo} className="bg-white p-4 rounded shadow space-y-3">
          <h2 className="font-semibold mb-2">Contact Info</h2>
          <input type="text" placeholder="Phone" className="w-full border p-2 rounded" value={phone} onChange={e => setPhone(e.target.value)} />
          <input type="text" placeholder="LinkedIn URL" className="w-full border p-2 rounded" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Update Contact Info</button>
        </form>
      </main>
    </div>
  );
};

export default Settings; 