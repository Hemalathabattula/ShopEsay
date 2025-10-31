import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ShoppingBag, Heart, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        role: 'CUSTOMER', // Always set to CUSTOMER for this registration page
        password: formData.password,
      });

      if (result.success) {
        toast.success('Account created successfully!');
        // Redirect to registration success page
        navigate('/registration-success', {
          state: {
            email: formData.email,
            name: formData.name,
            role: 'CUSTOMER',
            message: 'Customer registration successful! Please login to start shopping.'
          }
        });
      } else {
        // Show specific error message from backend
        toast.error(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Join Fashion Era</h2>
          <p className="mt-2 text-gray-600">Create your account and discover your perfect style</p>
        </div>

        {/* Customer Benefits */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            What you'll get as a FashionVR member:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 p-1 rounded-full">
                <ShoppingBag className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">Personalized shopping</span>
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
              <span className="text-sm text-gray-700">Wishlist & favorites</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-purple-100 p-1 rounded-full">
                <User className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-sm text-gray-700">Style recommendations</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter your email address"
                />
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                We'll use this for order updates and style recommendations
              </p>
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
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Create a secure password"
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
              <p className="mt-1 text-sm text-gray-500">
                Must be at least 6 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <input
                  id="newsletter"
                  name="newsletter"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="newsletter" className="ml-3 block text-sm text-gray-700">
                  <span className="font-medium">Get style updates & exclusive offers</span>
                  <p className="text-gray-500 text-xs mt-1">
                    Be the first to know about new arrivals, sales, and fashion trends
                  </p>
                </label>
              </div>
            </div>

          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              I agree to the{' '}
              <Link to="/terms" className="text-purple-600 hover:text-purple-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-purple-600 hover:text-purple-700">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:transform-none"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <ShoppingBag className="h-5 w-5 text-purple-500 group-hover:text-purple-400" />
            </span>
            {loading ? 'Creating Your Account...' : 'Start Shopping with FashionVR'}
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="w-full flex justify-center py-3 px-4 border border-purple-600 text-sm font-medium rounded-xl text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                Sign In to Your Account
              </Link>
            </div>
          </div>

          {/* Seller Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Want to sell on FashionVR?{' '}
              <Link to="/seller-register" className="font-medium text-blue-600 hover:text-blue-500">
                Join as a Seller
              </Link>
            </p>
          </div>
        </form>
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
          <h3 className="text-center font-semibold text-gray-900 mb-4">Join 100,000+ Happy Customers</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">4.8★</div>
              <div className="text-xs text-gray-600">Customer Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">50K+</div>
              <div className="text-xs text-gray-600">Products</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">24/7</div>
              <div className="text-xs text-gray-600">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;