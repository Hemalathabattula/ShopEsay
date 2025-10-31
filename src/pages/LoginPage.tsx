import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ShoppingBag, Heart, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle state from registration redirect
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.message) {
      toast.success(location.state.message);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Get user from auth store to check role
        const { user } = useAuthStore.getState();
        if (user) {
          // Verify user is actually a customer
          if (user.role.toUpperCase() === 'CUSTOMER') {
            toast.success('Welcome back to FashionVR!');
            navigate('/customer-dashboard');
          } else if (user.role.toUpperCase() === 'SELLER') {
            toast.error('This login is for customers only. Please use the seller login.');
            // Logout the user since they're not a customer
            useAuthStore.getState().logout();
          } else if (user.role.toUpperCase() === 'ADMIN') {
            toast.success('Welcome Admin!');
            navigate('/admin-dashboard');
          } else {
            toast.error('Invalid account type. Please contact support.');
            useAuthStore.getState().logout();
          }
        } else {
          navigate('/');
        }
      } else {
        toast.error(result.message || 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Customer Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back!</h2>
          <p className="mt-2 text-gray-600">Sign in to continue your fashion journey</p>
        </div>

        {location.state?.message && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-green-800 mb-1">
                  🎉 Welcome to FashionVR!
                </h3>
                <p className="text-sm text-green-700">
                  Your account has been created successfully. Please enter your password below to start shopping!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Benefits */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Ready to explore fashion?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 p-1 rounded-full">
                <ShoppingBag className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">Shop latest trends</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 p-1 rounded-full">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">Virtual try-on</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 p-1 rounded-full">
                <Heart className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">Save favorites</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 p-1 rounded-full">
                <Mail className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">Style updates</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <Link to="/forgot-password" className="text-sm text-purple-600 hover:text-purple-700">
              Forgot your password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <ShoppingBag className="h-5 w-5 text-purple-500 group-hover:text-purple-400" />
            </span>
            {loading ? 'Signing You In...' : 'Start Shopping'}
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to FashionVR?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="w-full flex justify-center py-3 px-4 border border-purple-600 text-sm font-medium rounded-xl text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                Create Customer Account
              </Link>
            </div>
          </div>

          {/* Seller Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Want to sell on FashionVR?{' '}
              <Link to="/seller-login" className="font-medium text-blue-600 hover:text-blue-500">
                Seller Login
              </Link>
            </p>
          </div>
        </form>
        </div>

        {/* Customer Demo Credentials */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-center font-semibold text-gray-900 mb-4">🧪 Try Demo Account</h3>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">Customer Demo Account:</h4>
            <div className="text-sm text-purple-800 space-y-1">
              <p><strong>Email:</strong> customer@example.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Use these credentials to explore the customer dashboard
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 p-4 bg-white rounded-xl shadow-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-purple-600">50K+</div>
              <div className="text-xs text-gray-600">Happy Customers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">4.8★</div>
              <div className="text-xs text-gray-600">Customer Rating</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">24/7</div>
              <div className="text-xs text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;