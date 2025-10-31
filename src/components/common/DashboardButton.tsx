import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

interface DashboardButtonProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

const DashboardButton: React.FC<DashboardButtonProps> = ({ 
  className = '', 
  showLabel = true,
  variant = 'primary'
}) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return null;
  }

  // Helper function to get dashboard route based on user role
  const getDashboardRoute = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'CUSTOMER':
        return '/customer-dashboard';
      case 'SELLER':
        return '/seller-dashboard';
      case 'ADMIN':
        return '/admin-dashboard';
      default:
        return '/customer-dashboard';
    }
  };

  // Helper function to get dashboard label based on user role
  const getDashboardLabel = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'CUSTOMER':
        return 'My Dashboard';
      case 'SELLER':
        return 'Seller Dashboard';
      case 'ADMIN':
        return 'Admin Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const baseClasses = 'inline-flex items-center justify-center space-x-2 font-medium transition-colors rounded-md';
  
  const variantClasses = {
    primary: 'bg-purple-600 text-white hover:bg-purple-700 px-4 py-2',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2',
    outline: 'border border-purple-600 text-purple-600 hover:bg-purple-50 px-4 py-2'
  };

  return (
    <Link
      to={getDashboardRoute(user.role)}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title={getDashboardLabel(user.role)}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
        />
      </svg>
      {showLabel && <span>{getDashboardLabel(user.role)}</span>}
    </Link>
  );
};

export default DashboardButton;
