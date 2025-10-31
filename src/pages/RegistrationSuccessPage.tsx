import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Mail, Lock } from 'lucide-react';

const RegistrationSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const registrationData = location.state;

  // Redirect to home if no registration data
  useEffect(() => {
    if (!registrationData) {
      navigate('/');
    }
  }, [registrationData, navigate]);

  if (!registrationData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>

          {/* Success Message */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Registration Successful! 🎉
          </h2>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <p className="text-lg text-gray-700 mb-4">
              Welcome to <span className="font-semibold text-purple-600">Fashion Era</span>!
            </p>
            
            <div className="bg-gray-50 rounded-md p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Account Details:</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{registrationData.email}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Name:</span>
                  <span className="ml-2">{registrationData.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium">Role:</span>
                  <span className="ml-2 capitalize bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                    {registrationData.role?.toLowerCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Lock className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Next Step: Login to Continue
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Your account has been created successfully. Please login with your credentials to access your dashboard and start exploring FashionVR!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="text-left mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What you can do now:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {registrationData.role?.toUpperCase() === 'CUSTOMER' && (
                  <>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Browse thousands of fashion products
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Try on clothes virtually with AI
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Add items to cart and wishlist
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                      Track your orders and deliveries
                    </li>
                  </>
                )}
                {registrationData.role?.toUpperCase() === 'SELLER' && (
                  <>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Add and manage your products
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Process customer orders
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      View sales analytics
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Manage inventory and shipping
                    </li>
                  </>
                )}
                {registrationData.role?.toUpperCase() === 'ADMIN' && (
                  <>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                      Manage all users and sellers
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                      Monitor platform analytics
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                      Oversee all orders and transactions
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                      Configure platform settings
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Link
              to={registrationData.role?.toUpperCase() === 'SELLER' ? '/seller-login' : '/login'}
              state={{ 
                email: registrationData.email,
                message: 'Registration successful! Please login to continue.' 
              }}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-purple-500 group-hover:text-purple-400" />
              </span>
              Login to Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              to="/"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Having trouble? <Link to="/contact" className="text-purple-600 hover:text-purple-500">Contact Support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;
