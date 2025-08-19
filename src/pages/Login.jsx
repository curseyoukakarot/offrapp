import { useRef, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
const logoUrl = '/images/nestbase-logo.png?v=1';

const Login = () => {
  const navigate = useNavigate();
  const redirectedRef = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotMsg, setForgotMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check for success messages from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message === 'account_created') {
      setSuccessMsg('Account created successfully! Please log in.');
    } else if (message === 'signup_complete') {
      setSuccessMsg('Account created! Please log in.');
    } else if (message === 'invitation_accepted') {
      setSuccessMsg('Invitation accepted! Please log in.');
    }
  }, []);

  // Redirect logic now handled by AuthContext
  // No need for useEffect redirect here

  const checkProfileAndRedirect = async (userId) => {
    try {
      // 1. Determine role from memberships
      const { data: mems, error: memsError } = await supabase
        .from('memberships')
        .select('role, tenant_id')
        .eq('user_id', userId);
        
      if (memsError) {
        console.warn('⚠️ Error fetching memberships in Login:', memsError.message);
        // If RLS is blocking, let AuthContext handle the redirect
        return;
      }
      
      const roles = (mems || []).map(r => String(r.role || '').toLowerCase());
      let role = (roles.includes('owner') || roles.includes('admin')) ? 'admin' : '';
      if (!role) {
        const { data: appUser } = await supabase
          .from('app_users')
          .select('role')
          .eq('id', userId)
          .maybeSingle();
        const appRole = String(appUser?.role || '').toLowerCase();
        if (appRole === 'owner' || appRole === 'admin') role = 'admin';
        else if (appRole) role = appRole;
      }
      if (!role) role = 'client';

      // 3. Check if user is super admin first
      const { data: globalRoles } = await supabase
        .from('user_global_roles')
        .select('role')
        .eq('user_id', userId);
      
      const isSuper = (globalRoles || []).some(r => 
        ['super_admin', 'superadmin', 'super-admin'].includes(String(r.role || '').toLowerCase())
      );
      
      if (isSuper) {
        navigate('/super');
        return;
      }
      
      // 4. For tenant users, redirect to admin dashboard with tenant context
      if (mems && mems.length > 0) {
        const firstTenant = mems[0].tenant_id;
        navigate(`/dashboard/admin?tenant_id=${firstTenant}`);
        return;
      }
      
      // 5. Fallback based on role
      switch (role) {
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
          navigate('/dashboard/client');
      }
    } catch (error) {
      console.error('Error in profile or role check:', error);
      setErrorMsg('Error checking profile or role status');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    console.log('Starting login process...');

    try {
      // Check if Supabase client is properly initialized
      if (!supabase) {
        console.error('Supabase client is not initialized');
        setErrorMsg('Authentication service is not available. Please try again later.');
        return;
      }

      // Step 1: Sign in with password
      console.log('Attempting to sign in with email:', email);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        setErrorMsg(signInError.message);
        return;
      }

      if (!signInData?.user) {
        console.error('No user data in sign in response');
        setErrorMsg('No user data received. Please try again.');
        return;
      }

      console.log('Sign in successful for user:', signInData.user.id);

      // AuthContext will handle redirect automatically
      console.log('✅ Login successful, AuthContext will handle redirect');
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setErrorMsg(error.message || 'An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (e) => {
    e?.preventDefault();
    setForgotMsg('');
    setForgotSending(true);
    try {
      const resp = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Failed to send reset');
      setForgotMsg('A temporary password has been emailed to you.');
    } catch (err) {
      setForgotMsg(err.message || 'Failed to send reset');
    } finally {
      setForgotSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src={logoUrl}
          alt="NestBase"
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-red-600 text-sm">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded p-2">{successMsg}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-700"
              onClick={() => setForgotOpen(true)}
            >
              Forgot Password?
            </button>
            <a href="/#pricing" className="text-gray-600 hover:text-navy">
              No Account? Click here to sign up
            </a>
          </div>
        </div>
      </div>
      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-navy">Reset your password</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setForgotOpen(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <form onSubmit={submitForgot} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">Email address</label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              {forgotMsg && <div className="text-sm text-gray-600">{forgotMsg}</div>}
              <div className="flex gap-3 justify-end">
                <button type="button" className="px-4 py-2 rounded-md border" onClick={() => setForgotOpen(false)}>Cancel</button>
                <button
                  type="submit"
                  disabled={forgotSending}
                  className={`px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 ${forgotSending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {forgotSending ? 'Sending...' : 'Send Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
