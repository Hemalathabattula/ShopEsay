import React, { useState, useEffect } from 'react';
import {
  Users, ShoppingCart, Package, TrendingUp, AlertTriangle,
  Eye, Heart, MessageSquare, DollarSign, ArrowUp, ArrowDown,
  Calendar, Filter, Download, RefreshCw, Bell, Star
} from 'lucide-react';
import { useAdminRealtime } from '../../../hooks/useAdminRealtime';
import { api } from '../../../utils/api';
import { toast } from 'react-hot-toast';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title, value, change, changeType, icon, color, bgColor
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-lg ${bgColor}`}>
        <div className={color}>{icon}</div>
      </div>
      <div className={`flex items-center text-sm font-medium ${
        changeType === 'increase' ? 'text-green-600' : 'text-red-600'
      }`}>
        {changeType === 'increase' ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
        {Math.abs(change)}%
      </div>
    </div>
    <div className="mt-4">
      <h3 className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</h3>
      <p className="text-gray-600 text-sm mt-1">{title}</p>
    </div>
  </div>
);

const DashboardOverview: React.FC = () => {
  const { data: realtimeData, isConnected, requestDashboardUpdate } = useAdminRealtime();
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/dashboard');

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        throw new Error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Use real data from API or fallback to mock data
  const metrics = [
    {
      title: 'Total Users',
      value: dashboardData?.totalCustomers || realtimeData?.dashboardData?.totalUsers || 12847,
      change: dashboardData?.customerGrowth || 12.5,
      changeType: (dashboardData?.customerGrowth || 12.5) >= 0 ? 'increase' as const : 'decrease' as const,
      icon: <Users className="w-6 h-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Orders',
      value: dashboardData?.totalOrders || realtimeData?.dashboardData?.totalOrders || 1284,
      change: 8.2, // Would need historical data for real change calculation
      changeType: 'increase' as const,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Revenue',
      value: `$${(dashboardData?.totalRevenue || realtimeData?.dashboardData?.totalRevenue || 89420).toLocaleString()}`,
      change: 15.3, // Would need historical data for real change calculation
      changeType: 'increase' as const,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Products',
      value: dashboardData?.totalProducts || realtimeData?.dashboardData?.totalProducts || 2847,
      change: 3.1, // Would need historical data for real change calculation
      changeType: 'increase' as const,
      icon: <Package className="w-6 h-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // Use real data from API or fallback to mock data
  const recentOrders = dashboardData?.recentTransactions?.map((transaction: any) => ({
    id: `#${transaction.id}`,
    customer: transaction.customer,
    amount: `$${transaction.amount.toFixed(2)}`,
    status: transaction.status,
    time: new Date(transaction.date).toLocaleDateString()
  })) || [
    { id: '#FE-2024-001', customer: 'Sarah Johnson', amount: '$299.99', status: 'Shipped', time: '2 min ago' },
    { id: '#FE-2024-002', customer: 'Mike Chen', amount: '$159.50', status: 'Processing', time: '5 min ago' },
    { id: '#FE-2024-003', customer: 'Emma Davis', amount: '$89.99', status: 'Delivered', time: '12 min ago' },
    { id: '#FE-2024-004', customer: 'Alex Wilson', amount: '$449.00', status: 'Pending', time: '18 min ago' },
    { id: '#FE-2024-005', customer: 'Lisa Brown', amount: '$199.99', status: 'Shipped', time: '25 min ago' }
  ];

  const topProducts = dashboardData?.topProducts?.map((product: any) => ({
    name: product.name,
    sales: product.sales,
    revenue: `$${product.revenue.toLocaleString()}`,
    trend: product.profit > product.revenue * 0.2 ? 'up' : 'down'
  })) || [
    { name: 'Designer Silk Dress', sales: 234, revenue: '$23,400', trend: 'up' },
    { name: 'Luxury Handbag', sales: 189, revenue: '$18,900', trend: 'up' },
    { name: 'Premium Sneakers', sales: 156, revenue: '$15,600', trend: 'down' },
    { name: 'Cashmere Sweater', sales: 143, revenue: '$14,300', trend: 'up' },
    { name: 'Designer Sunglasses', sales: 128, revenue: '$12,800', trend: 'up' }
  ];

  const stockAlerts = [
    { product: 'Summer Floral Dress', stock: 3, status: 'critical' },
    { product: 'Leather Boots', stock: 8, status: 'low' },
    { product: 'Denim Jacket', stock: 12, status: 'low' },
    { product: 'Silk Scarf', stock: 5, status: 'critical' }
  ];

  const blogPosts = [
    { title: 'Summer Fashion Trends 2024', views: 12500, likes: 890, comments: 156 },
    { title: 'Sustainable Fashion Guide', views: 9800, likes: 654, comments: 89 },
    { title: 'Celebrity Style Spotlight', views: 15600, likes: 1200, comments: 234 },
    { title: 'Wardrobe Essentials', views: 7800, likes: 456, comments: 67 }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await requestDashboardUpdate();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with Fashion-Era today.</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800">Real-time connection lost. Data may not be current.</span>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{order.id}</span>
                      <span className="text-sm text-gray-500">{order.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{order.customer}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold text-gray-900">{order.amount}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
              <Bell className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stockAlerts.map((item, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getStockStatusColor(item.status)}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.product}</span>
                    <span className="text-sm font-semibold">{item.stock} left</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium">
              Manage Inventory
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.sales} sales</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold text-gray-900">{product.revenue}</span>
                    <TrendingUp className={`w-4 h-4 ${product.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Blog Posts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Popular Blog Posts</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {blogPosts.map((post, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium text-gray-900">{post.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {post.views.toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      {post.likes}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {post.comments}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
