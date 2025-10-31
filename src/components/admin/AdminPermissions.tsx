import React, { useState } from 'react';
import { 
  Shield, Lock, Key, Users, Package, ShoppingCart, DollarSign, 
  Settings, BarChart3, MessageSquare, FileText, Monitor, Database,
  CheckCircle, AlertTriangle, Eye, Edit, Trash2, Plus, Crown
} from 'lucide-react';

interface AdminPermissionsProps {
  userRole: string;
  permissions: string[];
}

const AdminPermissions: React.FC<AdminPermissionsProps> = ({ userRole, permissions }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const permissionCategories = {
    'Platform Management': {
      icon: Crown,
      color: 'purple',
      permissions: [
        { id: 'PLATFORM_ADMIN', name: 'Platform Administration', description: 'Full platform control and configuration' },
        { id: 'SYSTEM_CONTROL', name: 'System Control', description: 'Server management and system operations' },
        { id: 'EMERGENCY_ACCESS', name: 'Emergency Access', description: 'Emergency system lockdown and recovery' },
        { id: 'GLOBAL_SETTINGS', name: 'Global Settings', description: 'Platform-wide configuration management' }
      ]
    },
    'User Management': {
      icon: Users,
      color: 'blue',
      permissions: [
        { id: 'MANAGE_USERS', name: 'User Management', description: 'Create, edit, delete user accounts' },
        { id: 'MANAGE_ADMINS', name: 'Admin Management', description: 'Manage admin accounts and roles' },
        { id: 'USER_ANALYTICS', name: 'User Analytics', description: 'Access user behavior and analytics' },
        { id: 'BULK_USER_OPERATIONS', name: 'Bulk Operations', description: 'Perform bulk user operations' }
      ]
    },
    'Product Control': {
      icon: Package,
      color: 'green',
      permissions: [
        { id: 'MANAGE_PRODUCTS', name: 'Product Management', description: 'Full product catalog control' },
        { id: 'PRODUCT_APPROVAL', name: 'Product Approval', description: 'Approve/reject product listings' },
        { id: 'INVENTORY_CONTROL', name: 'Inventory Control', description: 'Advanced inventory management' },
        { id: 'CATEGORY_MANAGEMENT', name: 'Category Management', description: 'Manage product categories' }
      ]
    },
    'Financial Control': {
      icon: DollarSign,
      color: 'yellow',
      permissions: [
        { id: 'MANAGE_FINANCES', name: 'Financial Management', description: 'Revenue and commission control' },
        { id: 'PROCESS_PAYOUTS', name: 'Process Payouts', description: 'Handle seller payouts' },
        { id: 'FINANCIAL_REPORTS', name: 'Financial Reports', description: 'Access financial analytics' },
        { id: 'REFUND_MANAGEMENT', name: 'Refund Management', description: 'Process refunds and disputes' }
      ]
    },
    'Security & Monitoring': {
      icon: Shield,
      color: 'red',
      permissions: [
        { id: 'SECURITY_MONITORING', name: 'Security Monitoring', description: 'Monitor security threats' },
        { id: 'ACCESS_LOGS', name: 'Access Logs', description: 'View system and user logs' },
        { id: 'IP_MANAGEMENT', name: 'IP Management', description: 'Block/unblock IP addresses' },
        { id: 'AUDIT_TRAIL', name: 'Audit Trail', description: 'Access complete audit logs' }
      ]
    },
    'Analytics & Reports': {
      icon: BarChart3,
      color: 'indigo',
      permissions: [
        { id: 'ADVANCED_ANALYTICS', name: 'Advanced Analytics', description: 'Business intelligence access' },
        { id: 'CUSTOM_REPORTS', name: 'Custom Reports', description: 'Create custom reports' },
        { id: 'DATA_EXPORT', name: 'Data Export', description: 'Export platform data' },
        { id: 'PERFORMANCE_METRICS', name: 'Performance Metrics', description: 'System performance analytics' }
      ]
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const hasPermission = (permissionId: string) => {
    return permissions.includes(permissionId) || userRole === 'SUPER_ADMIN';
  };

  const getPermissionCount = (categoryPerms: any[]) => {
    return categoryPerms.filter(perm => hasPermission(perm.id)).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">Admin Access Control</h3>
          <p className="text-gray-600">Comprehensive permission management and access control</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-100 rounded-lg">
            <Crown className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-600">{userRole.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">{permissions.length} Permissions</span>
          </div>
        </div>
      </div>

      {/* Permission Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(permissionCategories).map(([category, data]) => {
          const IconComponent = data.icon;
          const permissionCount = getPermissionCount(data.permissions);
          const totalPermissions = data.permissions.length;
          
          return (
            <div key={category} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getColorClasses(data.color)}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{category}</h4>
                    <p className="text-sm text-gray-600">{permissionCount}/{totalPermissions} permissions</p>
                  </div>
                </div>
                {permissionCount === totalPermissions ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : permissionCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-400" />
                )}
              </div>
              
              <div className="space-y-2">
                {data.permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                      <p className="text-xs text-gray-600">{permission.description}</p>
                    </div>
                    {hasPermission(permission.id) ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Capabilities Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Admin Capabilities</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">User Control</p>
              <p className="text-sm text-gray-600">
                {hasPermission('MANAGE_USERS') ? 'Full Access' : 'Limited Access'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <Package className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-gray-900">Product Management</p>
              <p className="text-sm text-gray-600">
                {hasPermission('MANAGE_PRODUCTS') ? 'Full Access' : 'View Only'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-medium text-gray-900">Financial Control</p>
              <p className="text-sm text-gray-600">
                {hasPermission('MANAGE_FINANCES') ? 'Full Access' : 'Restricted'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <Shield className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-gray-900">Security Access</p>
              <p className="text-sm text-gray-600">
                {hasPermission('SECURITY_MONITORING') ? 'Full Access' : 'Basic Access'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Admin Actions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {hasPermission('MANAGE_USERS') && (
            <button className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium text-blue-600">Manage Users</span>
            </button>
          )}
          
          {hasPermission('MANAGE_PRODUCTS') && (
            <button className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <Package className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium text-green-600">Product Control</span>
            </button>
          )}
          
          {hasPermission('MANAGE_FINANCES') && (
            <button className="flex flex-col items-center gap-2 p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
              <DollarSign className="w-5 h-5 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-600">Financial Mgmt</span>
            </button>
          )}
          
          {hasPermission('SECURITY_MONITORING') && (
            <button className="flex flex-col items-center gap-2 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              <Shield className="w-5 h-5 text-red-600" />
              <span className="text-xs font-medium text-red-600">Security Center</span>
            </button>
          )}
          
          {hasPermission('ADVANCED_ANALYTICS') && (
            <button className="flex flex-col items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-medium text-purple-600">Analytics</span>
            </button>
          )}
          
          {hasPermission('SYSTEM_CONTROL') && (
            <button className="flex flex-col items-center gap-2 p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
              <Monitor className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-600">System Control</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPermissions;
