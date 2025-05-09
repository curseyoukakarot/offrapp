import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../lib/useUser';
import offrAppLogo from '../assets/images/offrapp-logo.png';

const Login = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Get role from JWT
      const jwtRole = 
        user.app_metadata?.role ??
        user.user_metadata?.role ??
        'authenticated';
      
      console.log('User role from JWT:', jwtRole);
      
      // Redirect based on role
      switch (jwtRole) {
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
    }
  }, [user, navigate]);

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

      // Get role from JWT
      const jwtRole = 
        signInData.user.app_metadata?.role ??
        signInData.user.user_metadata?.role ??
        'authenticated';
      
      console.log('User role from JWT:', jwtRole);

      // Redirect based on role
      let redirectPath;
      switch (jwtRole) {
        case 'admin':
          redirectPath = '/dashboard/admin';
          break;
        case 'recruitpro':
          redirectPath = '/dashboard/recruitpro';
          break;
        case 'jobseeker':
          redirectPath = '/dashboard/jobseeker';
          break;
        case 'client':
          redirectPath = '/dashboard/client';
          break;
        default:
          redirectPath = '/complete-profile';
      }

      console.log('Redirecting to:', redirectPath);
      navigate(redirectPath);
    } catch (error) {
      console.error('Unexpected error during login:', error);
      setErrorMsg(error.message || 'An unexpected error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src={offrAppLogo}
          alt="Career Kitchen"
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
        </div>
      </div>
    </div>
  );
};

export default Login;
