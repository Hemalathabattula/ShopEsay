import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ShoppingCart, FileText, BarChart3,
  Settings, Bell, Search, Menu, X, LogOut, Shield, Crown, Star,
  TrendingUp, ArrowUp, ArrowDown, Eye, Heart, MessageSquare,
  DollarSign, AlertTriangle, RefreshCw, Plus, Filter, Download
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAdminRealtime } from '../hooks/useAdminRealtime';
import { toast } from 'react-hot-toast';
import UserManagement from '../components/admin/sections/UserManagement';
import ProductManagement from '../components/admin/sections/ProductManagement';
import OrderManagement from '../components/admin/sections/OrderManagement';
import ContentManagement from '../components/admin/sections/ContentManagement';
import Analytics from '../components/admin/sections/Analytics';
import SettingsComponent from '../components/admin/sections/Settings';

const AdminPortalDashboard = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { data: realtimeData, isConnected } = useAdminRealtime();
  const navigate = useNavigate();

  // Redirect if not admin
  useEffect(() => {
    if (!user?.role?.includes('ADMIN')) {
      navigate('/admin-portal-login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/admin-portal-login');
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'text-purple-600' },
    { id: 'users', name: 'User Management', icon: Users, color: 'text-blue-600' },
    { id: 'products', name: 'Products', icon: Package, color: 'text-green-600' },
    { id: 'orders', name: 'Orders', icon: ShoppingCart, color: 'text-orange-600' },
    { id: 'content', name: 'Content', icon: FileText, color: 'text-indigo-600' },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, color: 'text-pink-600' },
    { id: 'settings', name: 'Settings', icon: Settings, color: 'text-gray-600' }
  ];

  const stats = [
    {
      name: 'Total Users',
      value: realtimeData?.dashboardData?.totalUsers || 12847,
      change: '+12.5%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      name: 'Products',
      value: realtimeData?.dashboardData?.totalProducts || 2847,
      change: '+3.1%',
      changeType: 'increase',
      icon: Package,
      color: 'bg-green-500'
    },
    {
      name: 'Orders',
      value: realtimeData?.dashboardData?.totalOrders || 1284,
      change: '+8.2%',
      changeType: 'increase',
      icon: ShoppingCart,
      color: 'bg-orange-500'
    },
    {
      name: 'Revenue',
      value: `$${(realtimeData?.dashboardData?.totalRevenue || 89420).toLocaleString()}`,
      change: '+15.3%',
      changeType: 'increase',
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ];

  const recentActivities = [
    { id: 1, type: 'order', message: 'New order #FE-2024-001 received', time: '2 min ago', icon: ShoppingCart },
    { id: 2, type: 'user', message: 'New user registration: Sarah Johnson', time: '5 min ago', icon: Users },
    { id: 3, type: 'product', message: 'Product "Designer Silk Dress" updated', time: '12 min ago', icon: Package },
    { id: 4, type: 'alert', message: 'Low stock alert: Premium Sneakers', time: '18 min ago', icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Fashion Era</h1>
                <p className="text-sm text-purple-100">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users, products, orders..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-white placeholder-white/50"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-500/20 text-green-100 border border-green-400/30' : 'bg-red-500/20 text-red-100 border border-red-400/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            {/* Notifications */}
            <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg relative">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-purple-900 text-xs rounded-full flex items-center justify-center font-bold">
                3
              </span>
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-white">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-purple-100 flex items-center">
                  <Crown className="w-3 h-3 mr-1 text-yellow-400" />
                  {user?.role || 'Administrator'}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full flex items-center justify-center">
                <span className="text-purple-900 font-bold text-sm">
                  {user?.name?.charAt(0) || 'A'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-white/70 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar */}
        <aside className={`${
          isSidebarOpen ? 'w-64' : 'w-16'
        } bg-white/10 backdrop-blur-lg border-r border-white/20 transition-all duration-300 flex-shrink-0 relative`}>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-yellow-400 to-pink-400 text-purple-900 shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-900' : 'text-white/70'}`} />
                  {isSidebarOpen && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 relative">
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Section */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-white border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">
                      Welcome back, {user?.name || 'Administrator'}!
                    </h2>
                    <p className="text-purple-100">
                      Here's what's happening with Fashion Era today.
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full flex items-center justify-center">
                      <Crown className="w-10 h-10 text-purple-900" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-100 mb-1">{stat.name}</p>
                          <p className="text-2xl font-bold text-white">{stat.value}</p>
                          <div className={`flex items-center text-sm mt-2 ${
                            stat.changeType === 'increase' ? 'text-green-300' : 'text-red-300'
                          }`}>
                            {stat.changeType === 'increase' ? (
                              <ArrowUp className="w-4 h-4 mr-1" />
                            ) : (
                              <ArrowDown className="w-4 h-4 mr-1" />
                            )}
                            <span>{stat.change}</span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recent Activities */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Recent Activities</h3>
                    <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium">
                      View All
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivities.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <div key={activity.id} className="flex items-center space-x-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <Icon className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{activity.message}</p>
                            <p className="text-xs text-purple-200">{activity.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Management Section */}
          {activeSection === 'users' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <UserManagement />
            </div>
          )}

          {/* Products Management Section */}
          {activeSection === 'products' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <ProductManagement />
            </div>
          )}

          {/* Orders Management Section */}
          {activeSection === 'orders' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <OrderManagement />
            </div>
          )}

          {/* Content Management Section */}
          {activeSection === 'content' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <ContentManagement />
            </div>
          )}

          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <Analytics />
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
              <SettingsComponent />
            </div>
          )}

          {/* Other sections placeholder */}
          {activeSection !== 'dashboard' && activeSection !== 'users' && activeSection !== 'products' && activeSection !== 'orders' && activeSection !== 'content' && activeSection !== 'analytics' && activeSection !== 'settings' && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                {React.createElement(navigation.find(nav => nav.id === activeSection)?.icon || LayoutDashboard, {
                  className: "w-8 h-8 text-purple-900"
                })}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {navigation.find(nav => nav.id === activeSection)?.name}
              </h3>
              <p className="text-purple-100 mb-6">
                This section is under development. Full functionality coming soon!
              </p>
              <button className="bg-gradient-to-r from-yellow-400 to-pink-400 text-purple-900 px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all duration-300">
                Coming Soon
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPortalDashboard;
