import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';

const AdminPortalLogin = () => {
  const [formData, setFormData] = useState({
    adminId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { adminLogin, user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // Redirect if already authenticated as admin
  useEffect(() => {
    if (isAuthenticated && user?.role?.includes('ADMIN')) {
      navigate('/admin-portal');
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.adminId) {
      newErrors.adminId = 'Admin ID is required';
    } else if (formData.adminId.length < 6) {
      newErrors.adminId = 'Admin ID must be at least 6 characters';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await adminLogin(formData.adminId, formData.password);

      if (result.success && result.user?.role?.includes('ADMIN')) {
        toast.success('Welcome to Fashion Era Admin Portal!');
        navigate('/admin-portal');
      } else if (result.success && !result.user?.role?.includes('ADMIN')) {
        toast.error('Access denied. Admin privileges required.');
        setErrors({ general: 'This portal is restricted to administrators only.' });
      } else {
        toast.error(result.message || 'Login failed');
        setErrors({ general: result.message || 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('An unexpected error occurred');
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Admin Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Fashion Era</h1>
          <p className="text-purple-100 text-lg">Administrator Portal</p>
          <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-pink-400 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Login Form */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-100 px-4 py-3 rounded-lg flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{errors.general}</span>
              </div>
            )}

            {/* Admin ID Field */}
            <div className="space-y-2">
              <label htmlFor="adminId" className="block text-sm font-medium text-white">
                Administrator ID
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  type="text"
                  id="adminId"
                  name="adminId"
                  value={formData.adminId}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-white bg-opacity-20 border ${
                    errors.adminId ? 'border-red-400' : 'border-white border-opacity-30'
                  } rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent backdrop-blur-sm`}
                  placeholder="Enter your admin ID"
                  disabled={isLoading}
                />
              </div>
              {errors.adminId && (
                <p className="text-red-300 text-sm flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.adminId}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-3 bg-white bg-opacity-20 border ${
                    errors.password ? 'border-red-400' : 'border-white border-opacity-30'
                  } rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 focus:border-transparent backdrop-blur-sm`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-300 text-sm flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.password}</span>
                </p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-purple-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Access Admin Portal</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Additional Links */}
          <div className="mt-6 pt-6 border-t border-white border-opacity-20">
            <div className="text-center space-y-3">
              <Link
                to="/forgot-password"
                className="text-purple-200 hover:text-white text-sm transition-colors"
              >
                Forgot your password?
              </Link>
              <div className="text-purple-200 text-sm">
                Need help? Contact{' '}
                <a href="mailto:admin@fashionera.com" className="text-white hover:underline">
                  admin@fashionera.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Main Site */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-purple-200 hover:text-white text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>← Back to Fashion Era</span>
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-100">
              <p className="font-medium text-white mb-1">Secure Admin Access</p>
              <p>This portal is protected with enterprise-grade security. All access attempts are logged and monitored.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortalLogin;
