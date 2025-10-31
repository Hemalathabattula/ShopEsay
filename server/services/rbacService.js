const { logSecurityEvent } = require('../middleware/secureAuth');

/**
 * Role-Based Access Control (RBAC) Service
 * Provides comprehensive access control for Fashion Era platform
 */
class RBACService {
  constructor() {
    // Define role hierarchy (higher number = more permissions)
    this.roleHierarchy = {
      'CUSTOMER': 1,
      'SELLER': 2,
      'SECURITY_ADMIN': 3,
      'OPERATIONS_ADMIN': 4,
      'FINANCE_ADMIN': 4,
      'SUPER_ADMIN': 5
    };

    // Define resource-based permissions
    this.resourcePermissions = {
      // Customer resources
      'customer:profile': ['CUSTOMER', 'SUPER_ADMIN'],
      'customer:orders': ['CUSTOMER', 'SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      'customer:cart': ['CUSTOMER'],
      'customer:wishlist': ['CUSTOMER'],
      'customer:reviews': ['CUSTOMER', 'SUPER_ADMIN'],
      
      // Seller resources
      'seller:profile': ['SELLER', 'SUPER_ADMIN'],
      'seller:products': ['SELLER', 'SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      'seller:orders': ['SELLER', 'SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      'seller:analytics': ['SELLER', 'SUPER_ADMIN', 'FINANCE_ADMIN'],
      'seller:payouts': ['SELLER', 'SUPER_ADMIN', 'FINANCE_ADMIN'],
      
      // Admin resources
      'admin:dashboard': ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SECURITY_ADMIN'],
      'admin:users': ['SUPER_ADMIN', 'SECURITY_ADMIN'],
      'admin:products': ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      'admin:orders': ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      'admin:finances': ['SUPER_ADMIN', 'FINANCE_ADMIN'],
      'admin:analytics': ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN'],
      'admin:settings': ['SUPER_ADMIN'],
      'admin:security': ['SUPER_ADMIN', 'SECURITY_ADMIN'],
      'admin:audit': ['SUPER_ADMIN', 'SECURITY_ADMIN'],
      'admin:backup': ['SUPER_ADMIN'],
      
      // System resources
      'system:maintenance': ['SUPER_ADMIN'],
      'system:api': ['SUPER_ADMIN', 'SECURITY_ADMIN']
    };

    // Define action-based permissions
    this.actionPermissions = {
      'read': ['CUSTOMER', 'SELLER', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SECURITY_ADMIN'],
      'create': ['CUSTOMER', 'SELLER', 'SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      'update': ['CUSTOMER', 'SELLER', 'SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      'delete': ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      'admin_create': ['SUPER_ADMIN'],
      'admin_update': ['SUPER_ADMIN', 'OPERATIONS_ADMIN'],
      'admin_delete': ['SUPER_ADMIN'],
      'financial_read': ['SUPER_ADMIN', 'FINANCE_ADMIN'],
      'financial_write': ['SUPER_ADMIN', 'FINANCE_ADMIN'],
      'security_read': ['SUPER_ADMIN', 'SECURITY_ADMIN'],
      'security_write': ['SUPER_ADMIN', 'SECURITY_ADMIN']
    };

    // Define route-based access control
    this.routeAccess = {
      // Public routes (no authentication required)
      'public': [
        '/api/products',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/auth/reset-password'
      ],
      
      // Customer-only routes
      'customer': [
        '/api/customer',
        '/api/cart',
        '/api/wishlist',
        '/api/orders/customer'
      ],
      
      // Seller-only routes
      'seller': [
        '/api/seller',
        '/api/seller/products',
        '/api/seller/orders'
      ],
      
      // Admin-only routes
      'admin': [
        '/api/admin',
        '/api/admin/users',
        '/api/admin/dashboard',
        '/api/admin/analytics',
        '/api/admin/settings'
      ]
    };
  }

  /**
   * Check if user has permission to access a resource
   */
  hasResourcePermission(userRole, resource) {
    const allowedRoles = this.resourcePermissions[resource];
    return allowedRoles && allowedRoles.includes(userRole);
  }

  /**
   * Check if user has permission to perform an action
   */
  hasActionPermission(userRole, action) {
    const allowedRoles = this.actionPermissions[action];
    return allowedRoles && allowedRoles.includes(userRole);
  }

  /**
   * Check if user has permission to access a route
   */
  hasRouteAccess(userRole, route) {
    // Check public routes
    if (this.routeAccess.public.some(publicRoute => route.startsWith(publicRoute))) {
      return true;
    }

    // Check role-specific routes
    for (const [roleType, routes] of Object.entries(this.routeAccess)) {
      if (roleType === 'public') continue;
      
      if (routes.some(allowedRoute => route.startsWith(allowedRoute))) {
        if (roleType === 'customer' && userRole === 'CUSTOMER') return true;
        if (roleType === 'seller' && userRole === 'SELLER') return true;
        if (roleType === 'admin' && this.isAdminRole(userRole)) return true;
      }
    }

    return false;
  }

  /**
   * Check if role is an admin role
   */
  isAdminRole(role) {
    return ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SECURITY_ADMIN'].includes(role);
  }

  /**
   * Check if user can access another user's data
   */
  canAccessUserData(currentUser, targetUserId, targetUserRole) {
    // Users can always access their own data
    if (currentUser._id.toString() === targetUserId.toString()) {
      return true;
    }

    // Admins can access user data based on their role
    if (this.isAdminRole(currentUser.role)) {
      if (currentUser.role === 'SUPER_ADMIN') return true;
      if (currentUser.role === 'SECURITY_ADMIN' && targetUserRole !== 'SUPER_ADMIN') return true;
      if (currentUser.role === 'OPERATIONS_ADMIN' && ['CUSTOMER', 'SELLER'].includes(targetUserRole)) return true;
    }

    return false;
  }

  /**
   * Check if user can perform admin actions
   */
  canPerformAdminAction(userRole, action, targetResource) {
    if (!this.isAdminRole(userRole)) return false;

    const adminPermissions = {
      'SUPER_ADMIN': ['*'], // Can do everything
      'FINANCE_ADMIN': ['financial_read', 'financial_write', 'read'],
      'OPERATIONS_ADMIN': ['admin_update', 'read', 'create', 'update'],
      'SECURITY_ADMIN': ['security_read', 'security_write', 'read', 'admin_update']
    };

    const userPermissions = adminPermissions[userRole] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
  }

  /**
   * Get user's effective permissions
   */
  getUserPermissions(user) {
    const permissions = {
      role: user.role,
      level: this.roleHierarchy[user.role] || 0,
      resources: [],
      actions: [],
      routes: []
    };

    // Get resource permissions
    for (const [resource, allowedRoles] of Object.entries(this.resourcePermissions)) {
      if (allowedRoles.includes(user.role)) {
        permissions.resources.push(resource);
      }
    }

    // Get action permissions
    for (const [action, allowedRoles] of Object.entries(this.actionPermissions)) {
      if (allowedRoles.includes(user.role)) {
        permissions.actions.push(action);
      }
    }

    // Get route permissions
    for (const [routeType, routes] of Object.entries(this.routeAccess)) {
      if (routeType === 'public') {
        permissions.routes.push(...routes);
      } else if (
        (routeType === 'customer' && user.role === 'CUSTOMER') ||
        (routeType === 'seller' && user.role === 'SELLER') ||
        (routeType === 'admin' && this.isAdminRole(user.role))
      ) {
        permissions.routes.push(...routes);
      }
    }

    return permissions;
  }

  /**
   * Middleware factory for route-based access control
   */
  createRouteGuard(requiredRoles = [], requiredPermissions = []) {
    return async (req, res, next) => {
      try {
        const user = req.user;
        const route = req.originalUrl;
        const method = req.method;
        const ipAddress = req.ipAddress;
        const userAgent = req.userAgent;

        if (!user) {
          await logSecurityEvent('AUTH_MISSING_USER', null, ipAddress, userAgent, { route, method });
          return res.status(401).json({
            success: false,
            message: 'Authentication required'
          });
        }

        // Check role requirements
        if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
          await logSecurityEvent('AUTH_INSUFFICIENT_ROLE', user._id, ipAddress, userAgent, {
            route,
            method,
            userRole: user.role,
            requiredRoles
          });
          return res.status(403).json({
            success: false,
            message: `Access denied. Required roles: ${requiredRoles.join(', ')}`
          });
        }

        // Check permission requirements
        if (requiredPermissions.length > 0) {
          const userPermissions = user.permissions || [];
          const hasPermission = requiredPermissions.some(perm => userPermissions.includes(perm));
          
          if (!hasPermission) {
            await logSecurityEvent('AUTH_INSUFFICIENT_PERMISSIONS', user._id, ipAddress, userAgent, {
              route,
              method,
              userPermissions,
              requiredPermissions
            });
            return res.status(403).json({
              success: false,
              message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
            });
          }
        }

        // Check route access
        if (!this.hasRouteAccess(user.role, route)) {
          await logSecurityEvent('AUTH_ROUTE_ACCESS_DENIED', user._id, ipAddress, userAgent, {
            route,
            method,
            userRole: user.role
          });
          return res.status(403).json({
            success: false,
            message: 'Access denied to this route'
          });
        }

        // Log successful access for admin routes
        if (route.startsWith('/api/admin')) {
          await logSecurityEvent('AUTH_ADMIN_ACCESS', user._id, ipAddress, userAgent, {
            route,
            method,
            userRole: user.role
          });
        }

        next();
      } catch (error) {
        console.error('RBAC middleware error:', error);
        await logSecurityEvent('AUTH_SYSTEM_ERROR', req.user?._id, req.ipAddress, req.userAgent, {
          error: error.message,
          route: req.originalUrl
        });
        res.status(500).json({
          success: false,
          message: 'Access control system error'
        });
      }
    };
  }

  /**
   * Check if user can access specific data based on ownership and role
   */
  canAccessData(user, dataOwnerId, dataType) {
    // Own data access
    if (user._id.toString() === dataOwnerId.toString()) {
      return true;
    }

    // Admin access based on data type
    if (this.isAdminRole(user.role)) {
      const adminDataAccess = {
        'SUPER_ADMIN': ['*'],
        'FINANCE_ADMIN': ['orders', 'payments', 'refunds', 'analytics'],
        'OPERATIONS_ADMIN': ['products', 'orders', 'inventory', 'users'],
        'SECURITY_ADMIN': ['users', 'audit', 'security']
      };

      const allowedDataTypes = adminDataAccess[user.role] || [];
      return allowedDataTypes.includes('*') || allowedDataTypes.includes(dataType);
    }

    return false;
  }
}

module.exports = new RBACService();
