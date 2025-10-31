import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';
import SecureAdminRoute, {
  SuperAdminRoute,
  UserManagementRoute,
  SecurityAuditRoute
} from './components/admin/SecureAdminRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductViewPage from './pages/ProductViewPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ShippingDetailsPage from './pages/ShippingDetailsPage';
import PaymentPage from './pages/PaymentPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';

import ProfilePage from './pages/ProfilePage';
import SellerDashboard from './pages/SellerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboardNew';
import AdminUserManagement from './pages/AdminUserManagement';

import AdminPortal from './pages/AdminPortal';
import AdminPortalLogin from './pages/AdminPortalLogin';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegistrationSuccessPage from './pages/RegistrationSuccessPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SellerLoginPage from './pages/SellerLoginPage';
import SellerRegisterPage from './pages/SellerRegisterPage';
import AddProductPage from './pages/AddProductPage';
import { useAuthStore } from './store/authStore';



function App() {
  const { user, initializeAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await initializeAuth();
      setLoading(false);
    };
    initAuth();
  }, [initializeAuth]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-900 via-purple-700 to-pink-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-white">Loading ShopEasy...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Navbar />
        <main className="flex-1">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductViewPage />} />


            {/* Auth Routes - Redirect if already logged in */}
            <Route
              path="/login"
              element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <LoginPage />}
            />
            <Route
              path="/register"
              element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <RegisterPage />}
            />
            <Route path="/registration-success" element={<RegistrationSuccessPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Seller Auth Routes */}
            <Route
              path="/seller-login"
              element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <SellerLoginPage />}
            />
            <Route
              path="/seller-register"
              element={user ? <Navigate to={getDashboardRoute(user.role)} replace /> : <SellerRegisterPage />}
            />

            {/* Protected Routes */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipping-details"
              element={
                <ProtectedRoute>
                  <ShippingDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order-confirmation"
              element={
                <ProtectedRoute>
                  <OrderConfirmationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Customer Dashboard */}
            <Route
              path="/customer-dashboard"
              element={
                <ProtectedRoute allowedRoles={['CUSTOMER']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Seller Dashboard */}
            <Route
              path="/seller-dashboard"
              element={
                <ProtectedRoute allowedRoles={['SELLER']}>
                  <SellerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products/new"
              element={
                <ProtectedRoute allowedRoles={['SELLER']}>
                  <AddProductPage />
                </ProtectedRoute>
              }
            />

            {/* Standalone Admin Portal Routes */}
            <Route path="/admin-portal-login" element={<AdminPortalLogin />} />
            <Route path="/admin-portal" element={<AdminPortal />} />



            {/* Secure Admin Routes - Protected with enhanced security */}
            <Route
              path="/admin-dashboard"
              element={
                <SecureAdminRoute requiredPermissions={['VIEW_DASHBOARD']}>
                  <AdminDashboard />
                </SecureAdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <UserManagementRoute>
                  <AdminUserManagement />
                </UserManagementRoute>
              }
            />

            {/* Additional secure admin routes */}
            <Route
              path="/admin/analytics"
              element={
                <SecureAdminRoute requiredPermissions={['VIEW_ANALYTICS']}>
                  <div>Analytics Dashboard (Coming Soon)</div>
                </SecureAdminRoute>
              }
            />
            <Route
              path="/admin/security"
              element={
                <SecurityAuditRoute>
                  <div>Security Dashboard (Coming Soon)</div>
                </SecurityAuditRoute>
              }
            />
            <Route
              path="/admin/finances"
              element={
                <SecureAdminRoute requiredPermissions={['MANAGE_FINANCES']}>
                  <div>Financial Dashboard (Coming Soon)</div>
                </SecureAdminRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <SuperAdminRoute>
                  <div>System Settings (Coming Soon)</div>
                </SuperAdminRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

// Helper function to get dashboard route based on user role
const getDashboardRoute = (role: string) => {
  switch (role) {
    case 'CUSTOMER':
      return '/customer-dashboard';
    case 'SELLER':
      return '/seller-dashboard';
    case 'ADMIN':
    case 'SUPER_ADMIN':
    case 'FINANCE_ADMIN':
    case 'OPERATIONS_ADMIN':
      return '/admin-dashboard';
    default:
      return '/';
  }
};

export default App;
