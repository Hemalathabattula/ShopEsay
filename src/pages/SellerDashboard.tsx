import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, DollarSign, TrendingUp, Edit, Trash2, BarChart3, PieChart, Calendar, Target, ShoppingCart, Star, Users, Eye, MessageCircle, Heart } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { useWishlistStore } from '../store/wishlistStore';
import { ChatDashboard } from '../components/chat/ChatDashboard';
import { FloatingChatButton } from '../components/chat/FloatingChatButton';

const SellerDashboard = () => {
  const { user } = useAuthStore();
  const { products, fetchSellerProducts } = useProductStore();
  const { orders, fetchSellerOrders } = useOrderStore();
  const { items: wishlistItems, removeFromWishlist } = useWishlistStore();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSellerProducts();
    fetchSellerOrders();

    // Handle URL parameters for tab switching
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['overview', 'products', 'orders', 'wishlist', 'messages', 'analytics', 'performance'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Enhanced seller analytics
  const calculateSellerStats = () => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const totalProducts = products.length;

    // Calculate profit (assuming 30% profit margin)
    const totalProfit = totalRevenue * 0.3;

    // Calculate per product analytics
    const productSales = products.map(product => {
      const productOrders = orders.filter(order =>
        order.items.some(item => item.productId === product.id || item.productId === product._id)
      );
      const productRevenue = productOrders.reduce((acc, order) => {
        const productItems = order.items.filter(item => item.productId === product.id || item.productId === product._id);
        return acc + productItems.reduce((itemAcc, item) => itemAcc + (item.price * item.quantity), 0);
      }, 0);

      return {
        ...product,
        orderCount: productOrders.length,
        revenue: productRevenue,
        profit: productRevenue * 0.3
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Calculate monthly data (mock for last 6 months)
    const monthlyData = [
      { month: 'Jan', orders: Math.floor(totalOrders * 0.15), revenue: totalRevenue * 0.15, profit: totalProfit * 0.15 },
      { month: 'Feb', orders: Math.floor(totalOrders * 0.12), revenue: totalRevenue * 0.12, profit: totalProfit * 0.12 },
      { month: 'Mar', orders: Math.floor(totalOrders * 0.18), revenue: totalRevenue * 0.18, profit: totalProfit * 0.18 },
      { month: 'Apr', orders: Math.floor(totalOrders * 0.20), revenue: totalRevenue * 0.20, profit: totalProfit * 0.20 },
      { month: 'May', orders: Math.floor(totalOrders * 0.17), revenue: totalRevenue * 0.17, profit: totalProfit * 0.17 },
      { month: 'Jun', orders: Math.floor(totalOrders * 0.18), revenue: totalRevenue * 0.18, profit: totalProfit * 0.18 }
    ];

    return {
      totalProducts,
      totalOrders,
      totalRevenue,
      totalProfit,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      monthlyGrowth: 12.5,
      productSales,
      monthlyData,
      topProducts: productSales.slice(0, 5),
      recentOrders: orders.slice(0, 5).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  };

  const sellerStats = calculateSellerStats();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'performance', label: 'Performance', icon: Target }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Welcome to your Store, {user?.name}! 🏪
              </h1>
              <p className="text-gray-600">Manage your products and grow your business</p>
            </div>

            {/* Quick Stats - Responsive */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:flex lg:items-center lg:space-x-6">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-green-600">{sellerStats.totalProducts}</div>
                <div className="text-xs md:text-sm text-gray-600">Products</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{sellerStats.totalOrders}</div>
                <div className="text-xs md:text-sm text-gray-600">Orders</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-yellow-600">${sellerStats.totalRevenue.toFixed(2)}</div>
                <div className="text-xs md:text-sm text-gray-600">Revenue</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-purple-600">${sellerStats.totalProfit.toFixed(2)}</div>
                <div className="text-xs md:text-sm text-gray-600">Profit</div>
              </div>
            </div>
          </div>
        </div>

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">Store Management</h2>
        <Link to="/seller/products/new" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add Product</span>
        </Link>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex flex-wrap space-x-4 md:space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 md:px-4 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {/* Total Products */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Products</p>
                  <p className="text-2xl md:text-3xl font-bold">{sellerStats.totalProducts}</p>
                  <p className="text-green-200 text-xs mt-1">Active listings</p>
                </div>
                <Package className="h-8 w-8 text-green-200" />
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Orders</p>
                  <p className="text-2xl md:text-3xl font-bold">{sellerStats.totalOrders}</p>
                  <p className="text-blue-200 text-xs mt-1">All time</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-200" />
              </div>
            </div>

            {/* Total Revenue */}
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl md:text-3xl font-bold">${sellerStats.totalRevenue.toFixed(2)}</p>
                  <p className="text-yellow-200 text-xs mt-1">Gross sales</p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-200" />
              </div>
            </div>

            {/* Total Profit */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Profit</p>
                  <p className="text-2xl md:text-3xl font-bold">${sellerStats.totalProfit.toFixed(2)}</p>
                  <p className="text-purple-200 text-xs mt-1">30% margin</p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Avg Order Value</p>
                  <p className="text-2xl md:text-3xl font-bold">${sellerStats.averageOrderValue.toFixed(2)}</p>
                  <p className="text-indigo-200 text-xs mt-1">Per order</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-200" />
              </div>
            </div>
          </div>

          {/* Top Performing Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  Top Performing Products
                </h3>
              </div>
              <div className="p-6">
                {sellerStats.topProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No product sales data available</p>
                ) : (
                  <div className="space-y-4">
                    {sellerStats.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                              #{index + 1}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{product.name || product.title}</h4>
                            <p className="text-xs text-gray-500">{product.orderCount} orders</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">${product.revenue.toFixed(2)}</p>
                          <p className="text-xs text-green-600">+${product.profit.toFixed(2)} profit</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Performance */}
            <div className="bg-white rounded-2xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  Monthly Performance
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {sellerStats.monthlyData.map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">{month.month} 2025</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{month.orders} orders</p>
                        <p className="text-xs text-gray-500">${month.revenue.toFixed(2)} revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <ShoppingCart className="h-5 w-5 text-green-500 mr-2" />
                  Recent Orders
                </h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.items.map(item => item.title).join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${order.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-gray-900">Your Products</h3>
            <Link
              to="/seller/products/new"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Product</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sellerStats.productSales.map((product) => {
              const salesData = sellerStats.productSales.find(p => p.id === product.id) || { orderCount: 0, revenue: 0, profit: 0 };
              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                    {salesData.orderCount > 0 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {salesData.orderCount} sold
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{product.name || product.title}</h4>
                    <p className="text-purple-600 font-bold mb-3">${product.price}</p>

                    {/* Sales Performance */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                          <p className="text-gray-500">Orders</p>
                          <p className="font-semibold text-gray-900">{salesData.orderCount}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500">Revenue</p>
                          <p className="font-semibold text-green-600">${salesData.revenue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center space-x-1">
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button className="bg-blue-100 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-200 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div>
          <ChatDashboard />
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Manage Orders</h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items.map(item => item.title).join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${order.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button className="text-green-600 hover:text-green-700 mr-3">
                        Update Status
                      </button>
                      <button className="text-gray-600 hover:text-gray-700">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">My Wishlist</h3>
          {wishlistItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h4>
              <p className="text-gray-600 mb-6">
                Start adding products to your wishlist to keep track of items you love!
              </p>
              <button
                onClick={() => setActiveTab('products')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={item.image || '/api/placeholder/300/200'}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.name}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-purple-600">${item.price}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Add to cart logic here
                            console.log('Add to cart:', item);
                          }}
                          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Detailed Sales Analytics</h3>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                Revenue Breakdown
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Gross Revenue:</span>
                  <span className="font-semibold text-gray-900">${sellerStats.totalRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated Profit:</span>
                  <span className="font-semibold text-green-600">${sellerStats.totalProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit Margin:</span>
                  <span className="font-semibold text-purple-600">30%</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Avg Order Value:</span>
                  <span className="font-semibold text-blue-600">${sellerStats.averageOrderValue.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
                Order Analytics
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Orders:</span>
                  <span className="font-semibold text-gray-900">{sellerStats.totalOrders}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed Orders:</span>
                  <span className="font-semibold text-green-600">{orders.filter(o => o.status === 'delivered').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pending Orders:</span>
                  <span className="font-semibold text-yellow-600">{orders.filter(o => o.status === 'pending' || o.status === 'processing').length}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-semibold text-green-600">
                    {sellerStats.totalOrders > 0 ? ((orders.filter(o => o.status === 'delivered').length / sellerStats.totalOrders) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 text-purple-500 mr-2" />
                Performance Metrics
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Products Listed:</span>
                  <span className="font-semibold text-gray-900">{sellerStats.totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Products Sold:</span>
                  <span className="font-semibold text-green-600">{sellerStats.productSales.filter(p => p.orderCount > 0).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conversion Rate:</span>
                  <span className="font-semibold text-blue-600">
                    {sellerStats.totalProducts > 0 ? ((sellerStats.productSales.filter(p => p.orderCount > 0).length / sellerStats.totalProducts) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Monthly Growth:</span>
                  <span className="font-semibold text-green-600">+{sellerStats.monthlyGrowth}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="h-5 w-5 text-green-500 mr-2" />
                Product Performance Analysis
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sellerStats.productSales.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400'}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-lg mr-3"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name || product.title}</p>
                            <p className="text-xs text-gray-500">${product.price}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.orderCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${product.revenue.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${product.profit.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min((product.revenue / (sellerStats.totalRevenue || 1)) * 100, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {((product.revenue / (sellerStats.totalRevenue || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Vendor Performance Dashboard</h3>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Store Rating</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    <span className="text-2xl font-bold text-gray-900">4.8</span>
                    <span className="text-sm text-gray-500">/5.0</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Based on {sellerStats.totalOrders} orders</p>
                </div>
                <Star className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">2.4h</p>
                  <p className="text-xs text-gray-500 mt-1">Average response</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Return Rate</p>
                  <p className="text-2xl font-bold text-gray-900">2.1%</p>
                  <p className="text-xs text-gray-500 mt-1">Very low</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fulfillment Rate</p>
                  <p className="text-2xl font-bold text-gray-900">98.5%</p>
                  <p className="text-xs text-gray-500 mt-1">Excellent</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
                Monthly Sales Trends
              </h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {sellerStats.monthlyData.map((month, index) => (
                  <div key={month.month} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{month.month}</p>
                    <p className="text-lg font-bold text-blue-600">{month.orders}</p>
                    <p className="text-xs text-gray-500">orders</p>
                    <p className="text-sm font-semibold text-green-600 mt-1">${month.revenue.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">revenue</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Vendor Insights */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 text-purple-500 mr-2" />
                Vendor Performance Insights
              </h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900">Store Performance</h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-700">Products with Sales</span>
                      <span className="font-semibold text-green-600">
                        {sellerStats.productSales.filter(p => p.orderCount > 0).length} / {sellerStats.totalProducts}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm text-gray-700">Best Selling Category</span>
                      <span className="font-semibold text-blue-600">Fashion</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm text-gray-700">Peak Sales Month</span>
                      <span className="font-semibold text-purple-600">
                        {sellerStats.monthlyData.reduce((max, month) => month.revenue > max.revenue ? month : max, sellerStats.monthlyData[0]).month}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-semibold text-gray-900">Growth Opportunities</h5>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm font-medium text-yellow-800">Inventory Optimization</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {sellerStats.productSales.filter(p => p.orderCount === 0).length} products have no sales
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Revenue Potential</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Increase avg order value by 15% = +${(sellerStats.totalRevenue * 0.15).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">Performance Score</p>
                      <p className="text-xs text-green-600 mt-1">
                        Excellent seller - Top 10% performance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Floating Chat Button */}
    <FloatingChatButton />
    </div>
  );

  function getStatusColor(status: string) {
    switch (status) {
      case 'Delivered': return 'text-green-600 bg-green-100';
      case 'Shipped': return 'text-blue-600 bg-blue-100';
      case 'Processing': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }
};

export default SellerDashboard;
