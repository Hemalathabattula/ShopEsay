import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Calendar, Store, Crown, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  modalType: 'view' | 'edit' | 'create';
  onSave: (userData: any) => void;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, modalType, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'Active',
    role: 'SELLER',
    storeName: '',
    department: '',
    permissions: [],
    isVerified: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        status: user.status || 'Active',
        role: user.role || (user.userType === 'seller' ? 'SELLER' : 'SUPER_ADMIN'),
        storeName: user.storeName || '',
        department: user.department || '',
        permissions: user.permissions || [],
        isVerified: user.isVerified || false
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        email: '',
        phone: '',
        status: 'Active',
        role: 'SELLER',
        storeName: '',
        department: '',
        permissions: [],
        isVerified: false
      });
    }
    setErrors({});
  }, [user, modalType]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    if (formData.role === 'SELLER' && !formData.storeName.trim()) {
      newErrors.storeName = 'Store name is required for sellers';
    }

    if (formData.role !== 'SELLER' && !formData.department.trim()) {
      newErrors.department = 'Department is required for admins';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const adminRoles = [
    { value: 'SUPER_ADMIN', label: 'Super Admin' },
    { value: 'FINANCE_ADMIN', label: 'Finance Admin' },
    { value: 'OPERATIONS_ADMIN', label: 'Operations Admin' },
    { value: 'SUPPORT_ADMIN', label: 'Support Admin' }
  ];

  const allPermissions = [
    'VIEW_DASHBOARD',
    'MANAGE_USERS',
    'MANAGE_PRODUCTS',
    'MANAGE_ORDERS',
    'MANAGE_FINANCES',
    'MANAGE_SETTINGS',
    'MANAGE_ADMINS',
    'VIEW_PAYMENTS',
    'MANAGE_REFUNDS',
    'MANAGE_INVENTORY',
    'MANAGE_SUPPORT',
    'VIEW_TICKETS'
  ];

  if (!isOpen) return null;

  const isReadOnly = modalType === 'view';
  const isSellerType = formData.role === 'SELLER' || user?.userType === 'seller';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isSellerType ? (
              <Store className="w-6 h-6 text-purple-600" />
            ) : (
              <Crown className="w-6 h-6 text-blue-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {modalType === 'create' ? `Add New ${isSellerType ? 'Seller' : 'Admin'}` :
               modalType === 'edit' ? `Edit ${isSellerType ? 'Seller' : 'Admin'}` :
               `${isSellerType ? 'Seller' : 'Admin'} Details`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadOnly ? 'bg-gray-50' : 'bg-white'
                  } ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadOnly ? 'bg-gray-50' : 'bg-white'
                  } ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadOnly ? 'bg-gray-50' : 'bg-white'
                  } ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isReadOnly ? 'bg-gray-50' : 'bg-white'
                  } border-gray-300`}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              {!isReadOnly && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={formData.isVerified}
                    onChange={(e) => handleInputChange('isVerified', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isVerified" className="ml-2 block text-sm text-gray-900">
                    Email Verified
                  </label>
                </div>
              )}
            </div>

            {/* Role-specific Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Role Information
              </h3>

              {modalType === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type
                  </label>
                  <select
                    value={formData.role === 'SELLER' ? 'SELLER' : 'ADMIN'}
                    onChange={(e) => {
                      const isSeller = e.target.value === 'SELLER';
                      handleInputChange('role', isSeller ? 'SELLER' : 'SUPER_ADMIN');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="SELLER">Seller</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              )}

              {isSellerType ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      value={formData.storeName}
                      onChange={(e) => handleInputChange('storeName', e.target.value)}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isReadOnly ? 'bg-gray-50' : 'bg-white'
                      } ${errors.storeName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.storeName && <p className="text-red-500 text-sm mt-1">{errors.storeName}</p>}
                  </div>

                  {isReadOnly && user && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Products
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                          {user.totalProducts || 0}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Sales
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                          ${(user.totalSales || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Commission
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                          ${(user.commission || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rating
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                          {user.rating || 0}/5
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isReadOnly ? 'bg-gray-50' : 'bg-white'
                      } border-gray-300`}
                    >
                      {adminRoles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      disabled={isReadOnly}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isReadOnly ? 'bg-gray-50' : 'bg-white'
                      } ${errors.department ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
                  </div>

                  {!isReadOnly && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Permissions
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                        {allPermissions.map(permission => (
                          <div key={permission} className="flex items-center mb-1">
                            <input
                              type="checkbox"
                              id={permission}
                              checked={formData.permissions.includes(permission)}
                              onChange={(e) => {
                                const newPermissions = e.target.checked
                                  ? [...formData.permissions, permission]
                                  : formData.permissions.filter(p => p !== permission);
                                handleInputChange('permissions', newPermissions);
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={permission} className="ml-2 block text-sm text-gray-900">
                              {permission.replace('_', ' ')}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isReadOnly && user && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Permissions ({user.permissions?.length || 0})
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {(user.permissions || []).map((permission: string) => (
                          <span
                            key={permission}
                            className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {permission.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {!isReadOnly && (
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {modalType === 'create' ? 'Create' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
