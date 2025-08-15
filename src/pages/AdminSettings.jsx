import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminSettings() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null); // {type,message}

  const [brand, setBrand] = useState({ name: '', support_email: '', logo_url: '', favicon_url: '' });
  const [savingBrand, setSavingBrand] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id;
        // Profile
        const { data: profile } = await supabase.from('profiles').select('first_name,last_name,phone,linkedin').eq('id', uid).maybeSingle();
        setFirstName(profile?.first_name || '');
        setLastName(profile?.last_name || '');
        setPhone(profile?.phone || '');
        setLinkedin(profile?.linkedin || '');
        setEmail(session?.user?.email || '');
        // Tenant branding
        const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
        const res = await fetch('/api/tenant-config', { headers: { ...(tenantId ? { 'x-tenant-id': tenantId } : {}) } });
        const json = await res.json();
        setBrand({
          name: json?.name || '',
          support_email: json?.support_email || '',
          logo_url: json?.logo_url || '',
          favicon_url: json?.favicon_url || ''
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveContact = async (e) => {
    e.preventDefault();
    try {
      setToast(null);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      await supabase.from('profiles').upsert({ id: uid, first_name: firstName, last_name: lastName, phone, linkedin });
      if (email && email !== session?.user?.email) {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
      }
      setToast({ type: 'success', message: 'Profile saved' });
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setToast({ type: 'error', message: e.message || 'Save failed' });
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const currentPassword = form.get('current');
    const newPassword = form.get('new');
    const confirmPassword = form.get('confirm');
    if (!newPassword || newPassword !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords must match' });
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const emailAddr = session?.user?.email;
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: emailAddr, password: currentPassword });
      if (signInError) throw new Error('Current password is incorrect');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setToast({ type: 'success', message: 'Password updated' });
      setTimeout(() => setToast(null), 2000);
      e.currentTarget.reset();
    } catch (e2) {
      setToast({ type: 'error', message: e2.message || 'Update failed' });
    }
  };

  const saveBrand = async () => {
    try {
      setSavingBrand(true);
      const tenantId = localStorage.getItem('offrapp-active-tenant-id') || '';
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/tenant-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}`, ...(tenantId ? { 'x-tenant-id': tenantId } : {}) },
        body: JSON.stringify({ name: brand.name, support_email: brand.support_email, logo_url: brand.logo_url, favicon_url: brand.favicon_url, role_labels: undefined })
      });
      setToast({ type: 'success', message: 'Brand saved' });
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setToast({ type: 'error', message: e.message || 'Save failed' });
    } finally {
      setSavingBrand(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`text-sm px-3 py-2 rounded ${toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{toast.message}</div>
      )}

      {/* Brand & Legal */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Brand &amp; Legal</h2>
          <div className="space-x-2">
            <button className="px-3 py-1.5 text-sm rounded bg-gray-100" onClick={() => setBrand({ name: '', support_email: '', logo_url: '', favicon_url: '' })}>Reset</button>
            <button className={`px-3 py-1.5 text-sm rounded text-white ${savingBrand ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} onClick={saveBrand} disabled={savingBrand}>Save</button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="border rounded px-3 py-2" placeholder="App name" value={brand.name} onChange={(e) => setBrand((b) => ({ ...b, name: e.target.value }))} />
          <input className="border rounded px-3 py-2" placeholder="Support email" value={brand.support_email} onChange={(e) => setBrand((b) => ({ ...b, support_email: e.target.value }))} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Logo URL" value={brand.logo_url} onChange={(e) => setBrand((b) => ({ ...b, logo_url: e.target.value }))} />
          <input className="border rounded px-3 py-2 md:col-span-2" placeholder="Favicon URL" value={brand.favicon_url} onChange={(e) => setBrand((b) => ({ ...b, favicon_url: e.target.value }))} />
        </div>
      </section>

      {/* Contact Info */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Profile</h2>
        <form onSubmit={saveContact} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="border rounded px-3 py-2" placeholder="LinkedIn URL" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>
          <input className="border rounded px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Save Profile</button>
        </form>
      </section>

      {/* Change Password */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <input className="border rounded px-3 py-2" name="current" type="password" placeholder="Current password" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" name="new" type="password" placeholder="New password" />
            <input className="border rounded px-3 py-2" name="confirm" type="password" placeholder="Confirm new password" />
          </div>
          <button className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Update Password</button>
        </form>
      </section>
    </div>
  );
}


