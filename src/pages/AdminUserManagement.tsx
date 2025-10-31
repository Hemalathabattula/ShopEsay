import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Store, Settings, Search, Filter, Download, Plus,
  Eye, Edit, Trash2, Ban, CheckCircle, AlertTriangle, UserCheck,
  Mail, Phone, Calendar, DollarSign, Package, ShoppingCart, Crown
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import UserModal from '../components/admin/UserModal';

const AdminUserManagement = () => {
  const [activeTab, setActiveTab] = useState('sellers');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'create'
  
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Mock data for sellers and admins
  const [sellers, setSellers] = useState([
    {
      id: 'seller1',
      name: 'Fashion Store Owner',
      email: 'seller@example.com',
      storeName: 'Fashion Era Store',
      phone: '+1 (555) 123-4567',
      status: 'Active',
      joinDate: '2023-03-15',
      totalProducts: 45,
      totalSales: 12500,
      commission: 1875,
      rating: 4.8,
      lastLogin: '2024-01-15',
      isVerified: true
    },
    {
      id: 'seller2',
      name: 'Tech Hub Owner',
      email: 'tech@example.com',
      storeName: 'Tech Hub Store',
      phone: '+1 (555) 234-5678',
      status: 'Active',
      joinDate: '2023-01-20',
      totalProducts: 78,
      totalSales: 25600,
      commission: 3840,
      rating: 4.9,
      lastLogin: '2024-01-14',
      isVerified: true
    },
    {
      id: 'seller3',
      name: 'Home Decor Owner',
      email: 'home@example.com',
      storeName: 'Home Decor Plus',
      phone: '+1 (555) 345-6789',
      status: 'Pending',
      joinDate: '2024-01-10',
      totalProducts: 32,
      totalSales: 8900,
      commission: 1335,
      rating: 4.6,
      lastLogin: '2024-01-13',
      isVerified: false
    },
    {
      id: 'seller4',
      name: 'Sports World Owner',
      email: 'sports@example.com',
      storeName: 'Sports World',
      phone: '+1 (555) 456-7890',
      status: 'Suspended',
      joinDate: '2023-08-05',
      totalProducts: 56,
      totalSales: 18700,
      commission: 2805,
      rating: 4.2,
      lastLogin: '2024-01-10',
      isVerified: true
    }
  ]);

  const [admins, setAdmins] = useState([
    {
      id: 'admin001',
      name: 'Super Admin',
      email: 'admin001@admin.platform.com',
      role: 'SUPER_ADMIN',
      phone: '+1 (555) 000-0001',
      status: 'Active',
      joinDate: '2022-01-01',
      lastLogin: '2024-01-15',
      permissions: ['VIEW_DASHBOARD', 'MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_FINANCES', 'MANAGE_SETTINGS', 'MANAGE_ADMINS'],
      department: 'Administration',
      isVerified: true
    },
    {
      id: 'admin002',
      name: 'Finance Admin',
      email: 'admin002@admin.platform.com',
      role: 'FINANCE_ADMIN',
      phone: '+1 (555) 000-0002',
      status: 'Active',
      joinDate: '2022-06-15',
      lastLogin: '2024-01-14',
      permissions: ['VIEW_DASHBOARD', 'MANAGE_FINANCES', 'VIEW_PAYMENTS', 'MANAGE_REFUNDS'],
      department: 'Finance',
      isVerified: true
    },
    {
      id: 'admin003',
      name: 'Operations Admin',
      email: 'admin003@admin.platform.com',
      role: 'OPERATIONS_ADMIN',
      phone: '+1 (555) 000-0003',
      status: 'Active',
      joinDate: '2023-02-10',
      lastLogin: '2024-01-13',
      permissions: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_INVENTORY'],
      department: 'Operations',
      isVerified: true
    },
    {
      id: 'admin004',
      name: 'Support Admin',
      email: 'admin004@admin.platform.com',
      role: 'SUPPORT_ADMIN',
      phone: '+1 (555) 000-0004',
      status: 'Pending',
      joinDate: '2024-01-05',
      lastLogin: '2024-01-12',
      permissions: ['VIEW_DASHBOARD', 'MANAGE_SUPPORT', 'VIEW_TICKETS'],
      department: 'Customer Support',
      isVerified: false
    }
  ]);

  const handleStatusChange = (userId, newStatus, userType) => {
    if (userType === 'seller') {
      setSellers(sellers.map(seller => 
        seller.id === userId ? { ...seller, status: newStatus } : seller
      ));
    } else {
      setAdmins(admins.map(admin => 
        admin.id === userId ? { ...admin, status: newStatus } : admin
      ));
    }
  };

  const handleViewUser = (userData, userType) => {
    setSelectedUser({ ...userData, userType });
    setModalType('view');
    setShowModal(true);
  };

  const handleEditUser = (userData, userType) => {
    setSelectedUser({ ...userData, userType });
    setModalType('edit');
    setShowModal(true);
  };

  const handleDeleteUser = (userId, userType) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      if (userType === 'seller') {
        setSellers(sellers.filter(seller => seller.id !== userId));
      } else {
        setAdmins(admins.filter(admin => admin.id !== userId));
      }
    }
  };

  const handleSaveUser = (userData) => {
    if (modalType === 'create') {
      const newUser = {
        ...userData,
        id: `${userData.role === 'SELLER' ? 'seller' : 'admin'}${Date.now()}`,
        joinDate: new Date().toISOString().split('T')[0],
        lastLogin: 'Never',
        ...(userData.role === 'SELLER' ? {
          totalProducts: 0,
          totalSales: 0,
          commission: 0,
          rating: 0
        } : {})
      };

      if (userData.role === 'SELLER') {
        setSellers([...sellers, newUser]);
      } else {
        setAdmins([...admins, newUser]);
      }
    } else if (modalType === 'edit') {
      if (selectedUser?.userType === 'seller') {
        setSellers(sellers.map(seller =>
          seller.id === selectedUser.id ? { ...seller, ...userData } : seller
        ));
      } else {
        setAdmins(admins.map(admin =>
          admin.id === selectedUser.id ? { ...admin, ...userData } : admin
        ));
      }
    }
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seller.storeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || seller.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || admin.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Active': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Suspended': 'bg-red-100 text-red-800',
      'Inactive': 'bg-gray-100 text-gray-800'
    };
    return `inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`;
  };

  if (!user || !user.role?.includes('ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access user management.</p>
          <button
            onClick={() => navigate('/admin-login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Shield className="w-6 h-6" />
                <span className="font-medium">← Back to Admin Dashboard</span>
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-medium text-gray-900">{user?.name}</span>
              </span>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-600">Manage sellers and admin accounts</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('sellers')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sellers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Store className="w-4 h-4" />
                Sellers ({sellers.length})
              </button>
              <button
                onClick={() => setActiveTab('admins')}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admins'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Crown className="w-4 h-4" />
                Admins ({admins.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => {
                setSelectedUser(null);
                setModalType('create');
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add {activeTab === 'sellers' ? 'Seller' : 'Admin'}
            </button>
          </div>
        </div>

        {/* Sellers Table */}
        {activeTab === 'sellers' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSellers.map((seller) => (
                    <tr key={seller.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <Store className="h-5 w-5 text-purple-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                            <div className="text-sm text-gray-500">{seller.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{seller.storeName}</div>
                        <div className="text-sm text-gray-500">Rating: {seller.rating}/5</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{seller.totalProducts} products</div>
                        <div className="text-sm text-gray-500">${seller.totalSales.toLocaleString()} sales</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(seller.status)}>
                          {seller.status}
                        </span>
                        {seller.isVerified && (
                          <CheckCircle className="inline-block ml-1 h-4 w-4 text-green-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {seller.joinDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewUser(seller, 'seller')}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(seller, 'seller')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <select
                            value={seller.status}
                            onChange={(e) => handleStatusChange(seller.id, e.target.value, 'seller')}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Suspended">Suspended</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(seller.id, 'seller')}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admins Table */}
        {activeTab === 'admins' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Crown className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                            <div className="text-sm text-gray-500">{admin.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.role.replace('_', ' ')}</div>
                        <div className="text-sm text-gray-500">{admin.permissions.length} permissions</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {admin.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(admin.status)}>
                          {admin.status}
                        </span>
                        {admin.isVerified && (
                          <CheckCircle className="inline-block ml-1 h-4 w-4 text-green-500" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {admin.lastLogin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewUser(admin, 'admin')}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(admin, 'admin')}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <select
                            value={admin.status}
                            onChange={(e) => handleStatusChange(admin.id, e.target.value, 'admin')}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="Active">Active</option>
                            <option value="Pending">Pending</option>
                            <option value="Suspended">Suspended</option>
                          </select>
                          {admin.role !== 'SUPER_ADMIN' && (
                            <button
                              onClick={() => handleDeleteUser(admin.id, 'admin')}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Modal */}
        <UserModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          user={selectedUser}
          modalType={modalType}
          onSave={handleSaveUser}
        />
      </div>
    </div>
  );
};

export default AdminUserManagement;
