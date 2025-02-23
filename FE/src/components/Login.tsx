// src/components/Login.tsx
import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { Calendar } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useCalendarStore } from '../store/calendarStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

function Login() {
  const { login } = useAuthStore();
  const { fetchAllEvents, fetchGmailEvents } = useCalendarStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const res = await axios.post('http://localhost:8080/api/auth/google', {
          code: codeResponse.code,
        }, {
          withCredentials: true,
        });

        const { token, user } = res.data;
        Cookies.set('authToken', token, { expires: 7, secure: true });
        login(user, token);

        await Promise.all([
          fetchAllEvents(token),
          fetchGmailEvents(token)
        ]);

        toast.success('Successfully logged in!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Login failed:', error);
        toast.error(`Login failed: ${error.response?.data?.message || 'Please try again'}`);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      toast.error('Google authentication failed');
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly',
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Calendar className="h-12 w-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          AI Calendar Automation
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Smart scheduling powered by AI
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <button
            onClick={() => googleLogin()}
            className="w-full flex justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Login with Google
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Powered by Google Calendar & Gmail
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;