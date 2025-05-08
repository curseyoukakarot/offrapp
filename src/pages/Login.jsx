import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { getUserRole } from '../utils/getUserRole';
import offrAppLogo from '../assets/images/offrapp-logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    console.log('Attempting login with:', email, password);

    try {
      // Check if Supabase client is properly initialized
      if (!supabase) {
        console.error('Supabase client is not initialized');
        setErrorMsg('Authentication service is not available. Please try again later.');
        return;
      }

      // Step 1: Sign in with password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      console.log('Step 1 - Sign in response:', { 
        success: !!signInData?.user,
        error: signInError?.message,
        userId: signInData?.user?.id
      });

      if (signInError) {
        setErrorMsg(signInError.message);
        console.error('Login error:', signInError.message);
        return;
      }

      if (!signInData?.user) {
        setErrorMsg('No user data received. Please try again.');
        console.error('No user data in response');
        return;
      }

      // Get user role and redirect to appropriate dashboard
      const role = await getUserRole(signInData.user.id);
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
          navigate('/complete-profile');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg(error.message || 'An error occurred during login');
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
