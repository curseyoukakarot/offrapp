import React, { useEffect, useState } from 'react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [source, setSource] = useState('');
  const [sourceOther, setSourceOther] = useState('');
  const [title, setTitle] = useState('Owner/Founder');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState('starter');
  const valid = name && companyName && /.+@.+\..+/.test(email) && password.length >= 8;

  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get('session_id');
    if (sessionId) {
      // Verify the session and write a trusted plan into the onboarding cookie
      fetch(`/api/checkout-verify?session_id=${encodeURIComponent(sessionId)}`)
        .then(() => {})
        .catch(() => {});
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    const res = await fetch('/api/onboarding-start', { method: 'POST', body: JSON.stringify({ name, email, password, companyName, source, sourceOther, title, plan }) });
    setLoading(false);
    if (res.ok) window.location.href = '/onboarding';
    else alert('Sign up failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold mb-2">Step 0: Create Account</h1>
        <div className="mb-4 text-sm text-gray-700">Selected plan: <span className="font-semibold capitalize">{plan}</span></div>
        <p className="text-sm text-gray-600 mb-6">Create your admin account and workspace to get started.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
            <input type="email" className="w-full border rounded-lg px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="w-full border rounded-lg px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company / Workspace Name</label>
            <input className="w-full border rounded-lg px-3 py-2" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about us?</label>
              <select className="w-full border rounded-lg px-3 py-2" value={source} onChange={(e) => setSource(e.target.value)}>
                <option value="">Select…</option>
                <option>Google</option>
                <option>Referral</option>
                <option>Social</option>
                <option>Other</option>
              </select>
            </div>
            {source === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Please specify</label>
                <input className="w-full border rounded-lg px-3 py-2" value={sourceOther} onChange={(e) => setSourceOther(e.target.value)} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title / Role</label>
            <select className="w-full border rounded-lg px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)}>
              <option>Owner/Founder</option>
              <option>Admin</option>
              <option>Manager</option>
              <option>Other</option>
            </select>
          </div>
          <button type="submit" disabled={!valid || loading} className={`w-full rounded-lg px-4 py-2 text-white ${valid && !loading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300 cursor-not-allowed'}`}>{loading ? 'Creating…' : 'Continue to Setup'}</button>
        </form>
        <div className="mt-4 text-sm text-gray-600">
          Already have an account? <a href="/login" className="text-blue-600 underline">Log in</a>
        </div>
      </div>
    </div>
  );
}


