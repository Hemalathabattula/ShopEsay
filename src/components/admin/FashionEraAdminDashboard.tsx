import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText,
  BarChart3, Settings, Bell, Search, Menu, X, ChevronDown,
  TrendingUp, AlertTriangle, Eye, Plus,
  Heart, Star, MessageSquare, Gift, CheckCircle, DollarSign
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAdminRealtime } from '../../hooks/useAdminRealtime';
import DashboardOverview from './sections/DashboardOverview';
import UserManagement from './sections/UserManagement';
import ProductManagement from './sections/ProductManagement';
import OrderManagement from './sections/OrderManagement';
import ContentManagement from './sections/ContentManagement';
import Analytics from './sections/Analytics';
import SettingsComponent from './sections/Settings';

interface AdminDashboardProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const FashionEraAdminDashboard: React.FC<AdminDashboardProps> = ({
  activeSection = 'dashboard',
  onSectionChange
}) => {
  const { user } = useAuthStore();
  const { data: realtimeData, isConnected } = useAdminRealtime();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications] = useState([]);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      permission: 'VIEW_DASHBOARD'
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      permission: 'MANAGE_USERS',
      submenu: [
        { id: 'users-customers', label: 'Customers', count: realtimeData?.dashboardData?.totalUsers || 0 },
        { id: 'users-influencers', label: 'Influencers', count: 12 },
        { id: 'users-admins', label: 'Administrators', count: 4 }
      ]
    },
    {
      id: 'products',
      label: 'Product Management',
      icon: Package,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      permission: 'MANAGE_PRODUCTS',
      submenu: [
        { id: 'products-all', label: 'All Products', count: realtimeData?.dashboardData?.totalProducts || 0 },
        { id: 'products-categories', label: 'Categories' },
        { id: 'products-inventory', label: 'Inventory' }
      ]
    },
    {
      id: 'orders',
      label: 'Order Management',
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      permission: 'MANAGE_ORDERS',
      submenu: [
        { id: 'orders-all', label: 'All Orders', count: realtimeData?.dashboardData?.totalOrders || 0 },
        { id: 'orders-pending', label: 'Pending', count: 15 },
        { id: 'orders-shipped', label: 'Shipped', count: 32 }
      ]
    },
    {
      id: 'content',
      label: 'Content Management',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      permission: 'MANAGE_CONTENT',
      submenu: [
        { id: 'content-blog', label: 'Blog Posts' },
        { id: 'content-lookbooks', label: 'Lookbooks' },
        { id: 'content-banners', label: 'Banners' }
      ]
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      permission: 'MANAGE_INVENTORY',
      badge: '5 Low Stock'
    },
    {
      id: 'promotions',
      label: 'Promotions & Coupons',
      icon: Gift,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      permission: 'MANAGE_PROMOTIONS'
    },
    {
      id: 'feedback',
      label: 'Customer Feedback',
      icon: MessageSquare,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      permission: 'MANAGE_FEEDBACK',
      badge: '3 New'
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      icon: BarChart3,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      permission: 'VIEW_ANALYTICS'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      permission: 'MANAGE_SETTINGS'
    }
  ];

  const hasPermission = (permission: string) => {
    return user?.permissions?.includes(permission) || user?.role === 'SUPER_ADMIN';
  };

  const filteredNavigation = navigationItems.filter(item => hasPermission(item.permission));

  const handleSectionChange = (sectionId: string) => {
    onSectionChange?.(sectionId);
    setMobileMenuOpen(false);
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'users':
      case 'users-customers':
      case 'users-influencers':
      case 'users-admins':
        return <UserManagement />;
      case 'products':
      case 'products-all':
      case 'products-categories':
      case 'products-inventory':
        return <ProductManagement />;
      case 'orders':
      case 'orders-all':
      case 'orders-pending':
      case 'orders-shipped':
        return <OrderManagement />;
      case 'content':
      case 'content-blog':
      case 'content-lookbooks':
      case 'content-banners':
        return <ContentManagement />;
      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Inventory & Stock</h2>
                  <p className="text-gray-600 mt-1">Monitor and manage product inventory levels</p>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stock
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-red-900">5</p>
                      <p className="text-sm text-red-600">Low Stock Items</p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Package className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-900">23</p>
                      <p className="text-sm text-yellow-600">Out of Stock</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-green-900">1,247</p>
                      <p className="text-sm text-green-600">In Stock</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-blue-900">$125K</p>
                      <p className="text-sm text-blue-600">Total Value</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Inventory Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Advanced inventory tracking and management features are being developed.
                </p>
              </div>
            </div>
          </div>
        );
      case 'promotions':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Promotions & Coupons</h2>
                  <p className="text-gray-600 mt-1">Create and manage promotional campaigns</p>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Promotion
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-pink-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Gift className="w-8 h-8 text-pink-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-pink-900">12</p>
                      <p className="text-sm text-pink-600">Active Promotions</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-green-900">$15.2K</p>
                      <p className="text-sm text-green-600">Savings Generated</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-blue-900">1,456</p>
                      <p className="text-sm text-blue-600">Coupon Uses</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center py-8">
                <Gift className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Promotion Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Advanced promotion and coupon management features are being developed.
                </p>
              </div>
            </div>
          </div>
        );
      case 'feedback':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Customer Feedback</h2>
                  <p className="text-gray-600 mt-1">Monitor and respond to customer reviews and feedback</p>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Star className="w-8 h-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-900">4.8</p>
                      <p className="text-sm text-yellow-600">Average Rating</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <MessageSquare className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-blue-900">234</p>
                      <p className="text-sm text-blue-600">Total Reviews</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-red-900">3</p>
                      <p className="text-sm text-red-600">Pending Response</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Heart className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-2xl font-bold text-green-900">89%</p>
                      <p className="text-sm text-green-600">Satisfaction Rate</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Feedback Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Advanced feedback and review management features are being developed.
                </p>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SettingsComponent />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'}
        w-72
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">FE</span>
              </div>
              {!sidebarCollapsed && (
                <div className="ml-3">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Fashion-Era
                  </h1>
                  <p className="text-xs text-gray-500">Admin Dashboard</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleSectionChange(item.id)}
                className={`
                  w-full flex items-center px-3 py-3 text-left rounded-lg transition-all duration-200
                  ${activeSection === item.id 
                    ? `${item.bgColor} ${item.color} shadow-sm` 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                  ${sidebarCollapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                {!sidebarCollapsed && (
                  <>
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {item.submenu && (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </>
                )}
              </button>
              
              {/* Submenu */}
              {item.submenu && !sidebarCollapsed && activeSection === item.id && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.submenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => handleSectionChange(subItem.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                    >
                      <span>{subItem.label}</span>
                      {subItem.count !== undefined && (
                        <span className="text-xs text-gray-400">{subItem.count}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0) || 'A'}
              </span>
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`lg:ml-${sidebarCollapsed ? '20' : '72'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 mr-4"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Desktop Sidebar Toggle */}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:block p-2 rounded-md text-gray-400 hover:text-gray-600 mr-4"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products, orders, users..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64 lg:w-96"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-6">
          {renderSectionContent()}
        </main>
      </div>
    </div>
  );
};

export default FashionEraAdminDashboard;
