import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

interface SecureAdminRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: string[];
}

const SecureAdminRoute: React.FC<SecureAdminRouteProps> = ({ 
  children, 
  requiredPermissions = [],
  requiredRoles = []
}) => {
  const { user, isAuthenticated, token } = useAuthStore();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    validateAdminAccess();
  }, [user, token, location.pathname]);

  const validateAdminAccess = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      // Basic authentication check
      if (!isAuthenticated || !user || !token) {
        setValidationError('Authentication required');
        setIsValidating(false);
        return;
      }

      // Check if user is admin
      const adminRoles = ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SECURITY_ADMIN'];
      if (!adminRoles.includes(user.role)) {
        setValidationError('Admin access required');
        setIsValidating(false);
        return;
      }

      // Check if account is active
      if (!user.isActive) {
        setValidationError('Account is deactivated');
        setIsValidating(false);
        return;
      }

      // Check required roles
      if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        setValidationError(`Access denied. Required roles: ${requiredRoles.join(', ')}`);
        setIsValidating(false);
        return;
      }

      // Check required permissions
      if (requiredPermissions.length > 0) {
        const userPermissions = user.permissions || [];
        const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));
        
        if (!hasPermission) {
          setValidationError(`Access denied. Required permissions: ${requiredPermissions.join(', ')}`);
          setIsValidating(false);
          return;
        }
      }

      // Validate token with backend (optional for extra security)
      if (process.env.NODE_ENV === 'production') {
        try {
          const response = await fetch('/api/admin/validate-session', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Session-ID': localStorage.getItem('sessionId') || ''
            }
          });

          if (!response.ok) {
            setValidationError('Session validation failed');
            setIsValidating(false);
            return;
          }
        } catch (error) {
          console.warn('Session validation failed:', error);
          // Don't block access if validation endpoint is unavailable
        }
      }

      setIsValidating(false);
    } catch (error) {
      console.error('Admin access validation error:', error);
      setValidationError('Validation system error');
      setIsValidating(false);
    }
  };

  // Show loading state during validation
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate 
        to="/admin-login" 
        state={{ from: location.pathname, reason: 'authentication_required' }} 
        replace 
      />
    );
  }

  // Show access denied if validation failed
  if (validationError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            {validationError.includes('Authentication') ? (
              <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
            ) : validationError.includes('Admin') ? (
              <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">{validationError}</p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/admin-login'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Go to Admin Login
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Back to Store
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If you believe this is an error, please contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render children if all validations pass
  return <>{children}</>;
};

// Higher-order component for specific admin permissions
export const withAdminPermission = (
  Component: React.ComponentType<any>,
  requiredPermissions: string[] = [],
  requiredRoles: string[] = []
) => {
  return (props: any) => (
    <SecureAdminRoute 
      requiredPermissions={requiredPermissions}
      requiredRoles={requiredRoles}
    >
      <Component {...props} />
    </SecureAdminRoute>
  );
};

// Specific route guards for different admin functions
export const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecureAdminRoute requiredRoles={['SUPER_ADMIN']}>
    {children}
  </SecureAdminRoute>
);

export const FinanceAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecureAdminRoute requiredRoles={['SUPER_ADMIN', 'FINANCE_ADMIN']}>
    {children}
  </SecureAdminRoute>
);

export const OperationsAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecureAdminRoute requiredRoles={['SUPER_ADMIN', 'OPERATIONS_ADMIN']}>
    {children}
  </SecureAdminRoute>
);

export const SecurityAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecureAdminRoute requiredRoles={['SUPER_ADMIN', 'SECURITY_ADMIN']}>
    {children}
  </SecureAdminRoute>
);

// Permission-based guards
export const UserManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecureAdminRoute requiredPermissions={['MANAGE_USERS']}>
    {children}
  </SecureAdminRoute>
);

export const FinancialDataRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecureAdminRoute requiredPermissions={['MANAGE_FINANCES']}>
    {children}
  </SecureAdminRoute>
);

export const SecurityAuditRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SecureAdminRoute requiredPermissions={['SECURITY_AUDIT']}>
    {children}
  </SecureAdminRoute>
);

export default SecureAdminRoute;
