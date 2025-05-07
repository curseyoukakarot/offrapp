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

      console.log('About to check database for user:', signInData.user.id);

      // Direct database check for user and role
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      console.log('Database check result:', { userData, dbError });

      if (dbError) {
        console.error('Database error:', dbError);
        setErrorMsg('Error accessing user data. Please contact support.');
        return;
      }

      if (!userData) {
        console.error('No user found in database');
        setErrorMsg('User account not found. Please contact support.');
        return;
      }

      if (!userData.role) {
        console.error('No role found for user');
        setErrorMsg('User role not set. Please contact support.');
        return;
      }

      console.log('Found user with role:', userData.role);

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
          setErrorMsg('Invalid user role. Please contact support.');
          console.error('Invalid role:', userData.role);
          await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <img 
          src={offrAppLogo} 
          alt="OffrApp Logo" 
          className="h-16 w-auto"
        />
      </div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Offr App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{errorMsg}</span>
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-gray-300 p-3 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
