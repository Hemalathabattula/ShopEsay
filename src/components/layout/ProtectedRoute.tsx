import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // If not authenticated, redirect to login with return URL
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // If specific roles are required, check user role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on user role
      const redirectPath = getDashboardRoute(user.role);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

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

export default ProtectedRoute;
