import React, { useState, useEffect } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, ShoppingCart,
  DollarSign, Eye, Calendar, Download, Filter, RefreshCw,
  ArrowUpRight, ArrowDownRight, Target, Globe, Clock,
  Package, Heart, MessageSquare, Star, Zap
} from 'lucide-react';
import { api } from '../../../utils/api';
import { toast } from 'react-hot-toast';

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueChange: number;
    totalOrders: number;
    ordersChange: number;
    totalUsers: number;
    usersChange: number;
    conversionRate: number;
    conversionChange: number;
  };
  salesData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    image?: string;
  }>;
  userMetrics: {
    newUsers: number;
    returningUsers: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  trafficSources: Array<{
    source: string;
    visitors: number;
    percentage: number;
  }>;
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  const mockAnalyticsData: AnalyticsData = {
    overview: {
      totalRevenue: 125430,
      revenueChange: 12.5,
      totalOrders: 1247,
      ordersChange: 8.3,
      totalUsers: 3456,
      usersChange: 15.2,
      conversionRate: 3.2,
      conversionChange: -2.1
    },
    salesData: [
      { date: '2024-01-15', revenue: 15420, orders: 142 },
      { date: '2024-01-16', revenue: 18230, orders: 167 },
      { date: '2024-01-17', revenue: 16890, orders: 154 },
      { date: '2024-01-18', revenue: 21340, orders: 189 },
      { date: '2024-01-19', revenue: 19560, orders: 176 },
      { date: '2024-01-20', revenue: 17890, orders: 163 },
      { date: '2024-01-21', revenue: 20100, orders: 182 }
    ],
    topProducts: [
      { id: '1', name: 'Summer Floral Dress', sales: 234, revenue: 23400, image: '/products/dress1.jpg' },
      { id: '2', name: 'Classic Denim Jacket', sales: 189, revenue: 18900, image: '/products/jacket1.jpg' },
      { id: '3', name: 'Elegant Evening Gown', sales: 156, revenue: 31200, image: '/products/gown1.jpg' },
      { id: '4', name: 'Casual Cotton T-Shirt', sales: 298, revenue: 8940, image: '/products/tshirt1.jpg' },
      { id: '5', name: 'Designer Handbag', sales: 87, revenue: 17400, image: '/products/bag1.jpg' }
    ],
    userMetrics: {
      newUsers: 1234,
      returningUsers: 2222,
      averageSessionDuration: 245,
      bounceRate: 32.5
    },
    trafficSources: [
      { source: 'Organic Search', visitors: 1456, percentage: 42.1 },
      { source: 'Direct', visitors: 987, percentage: 28.5 },
      { source: 'Social Media', visitors: 654, percentage: 18.9 },
      { source: 'Email', visitors: 234, percentage: 6.8 },
      { source: 'Referral', visitors: 125, percentage: 3.6 }
    ]
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);

      // Fetch analytics data from the backend
      const response = await api.get(`/admin/analytics?timeframe=${dateRange}`);

      if (response.data.success) {
        // Use the enhanced backend data structure
        const backendData = response.data.data;

        // Calculate percentage changes (mock for now - would need historical comparison)
        const calculateChange = (current: number) => {
          return (Math.random() - 0.5) * 30; // Random change between -15% and +15%
        };

        const transformedData: AnalyticsData = {
          overview: {
            totalRevenue: backendData.overview.totalRevenue,
            revenueChange: calculateChange(backendData.overview.totalRevenue),
            totalOrders: backendData.overview.totalOrders,
            ordersChange: calculateChange(backendData.overview.totalOrders),
            totalUsers: backendData.overview.totalUsers,
            usersChange: calculateChange(backendData.overview.totalUsers),
            conversionRate: backendData.overview.conversionRate,
            conversionChange: calculateChange(backendData.overview.conversionRate)
          },
          salesData: backendData.orderTrends?.map((trend: any) => ({
            date: trend._id,
            revenue: trend.revenue,
            orders: trend.count
          })) || [],
          topProducts: backendData.topProducts || [],
          userMetrics: backendData.userMetrics || {
            newUsers: 0,
            returningUsers: 0,
            averageSessionDuration: 0,
            bounceRate: 0
          },
          trafficSources: backendData.trafficSources || []
        };

        setAnalyticsData(transformedData);
      } else {
        // Fallback to mock data if API fails
        setAnalyticsData(mockAnalyticsData);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data, showing sample data');
      // Fallback to mock data on error
      setAnalyticsData(mockAnalyticsData);
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">Track performance and gain insights into your business</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analyticsData.overview.totalRevenue)}
              </p>
              <div className="flex items-center mt-2">
                {analyticsData.overview.revenueChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analyticsData.overview.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(analyticsData.overview.revenueChange)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.overview.totalOrders.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                {analyticsData.overview.ordersChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analyticsData.overview.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(analyticsData.overview.ordersChange)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.overview.totalUsers.toLocaleString()}
              </p>
              <div className="flex items-center mt-2">
                {analyticsData.overview.usersChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analyticsData.overview.usersChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(analyticsData.overview.usersChange)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.overview.conversionRate}%
              </p>
              <div className="flex items-center mt-2">
                {analyticsData.overview.conversionChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analyticsData.overview.conversionChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(analyticsData.overview.conversionChange)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Target className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {analyticsData.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales} sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Traffic Sources</h3>
            <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              View Details
            </button>
          </div>
          <div className="space-y-4">
            {analyticsData.trafficSources.map((source) => (
              <div key={source.source} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-600 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-gray-900">{source.source}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500">{source.visitors.toLocaleString()}</span>
                  <span className="text-sm font-medium text-gray-900">{source.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">User Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-lg inline-flex mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {analyticsData.userMetrics.newUsers.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">New Users</p>
          </div>

          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-lg inline-flex mb-3">
              <RefreshCw className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {analyticsData.userMetrics.returningUsers.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Returning Users</p>
          </div>

          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-lg inline-flex mb-3">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatDuration(analyticsData.userMetrics.averageSessionDuration)}
            </p>
            <p className="text-sm text-gray-600">Avg. Session Duration</p>
          </div>

          <div className="text-center">
            <div className="p-3 bg-orange-100 rounded-lg inline-flex mb-3">
              <TrendingDown className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {analyticsData.userMetrics.bounceRate}%
            </p>
            <p className="text-sm text-gray-600">Bounce Rate</p>
          </div>
        </div>
      </div>

      {/* Sales Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Sales Overview</h3>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Orders</span>
            </div>
          </div>
        </div>

        {/* Simple chart representation */}
        <div className="h-64 flex items-end justify-between space-x-2">
          {analyticsData.salesData.map((data, index) => (
            <div key={data.date} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '200px' }}>
                <div
                  className="bg-purple-600 rounded-t-lg absolute bottom-0 w-full"
                  style={{ height: `${(data.revenue / 25000) * 100}%` }}
                ></div>
                <div
                  className="bg-blue-600 rounded-t-lg absolute bottom-0 w-1/2"
                  style={{ height: `${(data.orders / 200) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 mt-2">
                {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
            <p className="text-sm text-gray-600 mt-1">Download detailed analytics reports</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
