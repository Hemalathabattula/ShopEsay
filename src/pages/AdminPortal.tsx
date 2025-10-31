import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AdminPortalLogin from './AdminPortalLogin';
import AdminPortalDashboard from './AdminPortalDashboard';

const AdminPortal = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated but not an admin, redirect to main site
    if (isAuthenticated && !user?.role?.includes('ADMIN')) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Show login if not authenticated or not admin
  if (!isAuthenticated || !user?.role?.includes('ADMIN')) {
    return <AdminPortalLogin />;
  }

  // Show dashboard if authenticated admin
  return <AdminPortalDashboard />;
};

export default AdminPortal;
