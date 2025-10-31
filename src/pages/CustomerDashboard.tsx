import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Package, Heart, User, MapPin, CreditCard, ShoppingBag, MessageCircle, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useOrderStore, Order } from '../store/orderStore';
import { ChatDashboard } from '../components/chat/ChatDashboard';
import { FloatingChatButton } from '../components/chat/FloatingChatButton';

const CustomerDashboard = () => {
  const { user } = useAuthStore();
  const { items: wishlistItems, removeItem } = useWishlistStore();
  const { items: cartItems } = useCartStore();
  const { getUserOrders, updateOrderStatus } = useOrderStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Get user's orders
  const userOrders = user ? getUserOrders(user.id) : [];

  // Update URL when tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Update tab when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Helper function to get the correct image URL
  const getImageUrl = (item: any) => {
    if (item.images && item.images.length > 0) {
      return typeof item.images[0] === 'string' ? item.images[0] : item.images[0]?.url;
    }
    return item.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center';
  };

  // Format orders for display
  const formatOrdersForDisplay = (orders: any[]) => {
    return orders.map(order => ({
      id: order.id,
      date: new Date(order.createdAt).toLocaleDateString(),
      status: order.status,
      total: order.total,
      items: order.items || [],
      trackingNumber: order.trackingNumber || null,
      image: typeof order.items[0]?.image === 'string' ? order.items[0]?.image : order.items[0]?.image?.url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop&crop=center'
    }));
  };

  const recentOrders = formatOrdersForDisplay(userOrders);

  const recentlyViewed = [
    {
      id: '1',
      name: 'Premium Cotton T-Shirt',
      price: 29.99,
      image: 'https://images.pexels.com/photos/1021693/pexels-photo-1021693.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '2',
      name: 'Slim Fit Jeans',
      price: 79.99,
      image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: '3',
      name: 'Elegant Blazer',
      price: 149.99,
      image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShoppingBag },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'messages', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Order placed': return 'text-blue-600 bg-blue-100';
      case 'Processing': return 'text-yellow-600 bg-yellow-100';
      case 'Shipped': return 'text-purple-600 bg-purple-100';
      case 'Delivered': return 'text-green-600 bg-green-100';
      case 'Cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Removed duplicate handleCancelOrder function to fix redeclaration error

  const canCancelOrder = (status: string) => {
    return status === 'Order placed' || status === 'Processing';
  };

  const handleViewOrderDetails = (order: any) => {
    // Find the full order object from the original orders array
    const fullOrder = userOrders.find(o => o.id === order.id);
    setSelectedOrderDetails(fullOrder || order);
    setShowOrderModal(true);
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      updateOrderStatus(orderId, 'Cancelled');
      setShowOrderModal(false);
      alert('Order has been cancelled successfully.');
    }
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrderDetails(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-gray-600">Ready to discover amazing fashion?</p>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userOrders.length}</div>
                <div className="text-sm text-gray-600">Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{wishlistItems.length}</div>
                <div className="text-sm text-gray-600">Wishlist</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{cartItems.length}</div>
                <div className="text-sm text-gray-600">Cart Items</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
                <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mt-2">
                  Customer
                </span>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">

                  <Link
                    to="/products"
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center block"
                  >
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h2>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100">Total Orders</p>
                          <p className="text-3xl font-bold">{userOrders.length}</p>
                        </div>
                        <Package className="h-8 w-8 text-blue-200" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-pink-100">Wishlist Items</p>
                          <p className="text-3xl font-bold">{wishlistItems.length}</p>
                        </div>
                        <Heart className="h-8 w-8 text-pink-200" />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100">Cart Items</p>
                          <p className="text-3xl font-bold">{cartItems.length}</p>
                        </div>
                        <ShoppingBag className="h-8 w-8 text-purple-200" />
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Recent Orders</h3>
                      <button
                        onClick={() => handleTabChange('orders')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {recentOrders.slice(0, 3).map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <img
                                src={order.image}
                                alt="Order"
                                className="w-12 h-12 object-cover rounded-lg"
                              />
                              <div>
                                <h4 className="font-semibold text-gray-900">Order {order.id}</h4>
                                <p className="text-sm text-gray-600">{order.date} • {order.items.length} items</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                              </span>
                              <p className="text-lg font-bold text-gray-900 mt-1">${order.total}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recently Viewed */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Recently Viewed</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {recentlyViewed.map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          className="group border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                            <p className="text-blue-600 font-bold">${product.price.toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">My Orders</h2>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Order {order.id}</h3>
                            <p className="text-gray-600">Placed on {order.date}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <img
                                src={order.image}
                                alt="Order"
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div>
                                <p className="text-gray-600">{order.items.length} items</p>
                                <p className="text-lg font-bold text-gray-900">${order.total}</p>
                              </div>
                            </div>
                          <div className="text-right">
                            {order.trackingNumber && (
                              <p className="text-sm text-blue-600 mb-2">
                                Tracking: {order.trackingNumber}
                              </p>
                            )}
                            <button
                              onClick={() => handleViewOrderDetails(order)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wishlist Tab */}
              {activeTab === 'wishlist' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">My Wishlist</h2>
                    <button
                      onClick={() => handleTabChange('overview')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Back to Dashboard</span>
                    </button>
                  </div>
                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-16">
                      <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
                      <p className="text-gray-600 mb-6">Save items you love to your wishlist</p>
                      <Link
                        to="/products"
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlistItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                          <img
                            src={getImageUrl(item)}
                            alt={item.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">{item.name}</h4>
                            <p className="text-blue-600 font-bold mb-4">${item.price.toFixed(4)}</p>
                            <div className="flex space-x-2">
                              <Link
                                to={`/product/${item.productId}`}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div>
                  <ChatDashboard />
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Profile Settings</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                          <Link
                            to="/profile"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="text-gray-900">{user?.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="text-gray-900">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
                          <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Manage
                          </button>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <MapPin className="h-5 w-5" />
                          <span>No addresses saved</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
                          <button className="text-blue-600 hover:text-blue-700 font-medium">
                            Add
                          </button>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <CreditCard className="h-5 w-5" />
                          <span>No payment methods saved</span>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                        <div className="space-y-3">
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded mr-3" defaultChecked />
                            <span className="text-gray-700">Email notifications</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded mr-3" defaultChecked />
                            <span className="text-gray-700">SMS notifications</span>
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="rounded mr-3" />
                            <span className="text-gray-700">Marketing emails</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Order Details Modal */}
      {showOrderModal && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                <button
                  onClick={closeOrderModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="mt-2 flex items-center space-x-4">
                <span className="text-lg font-semibold text-gray-900">Order #{selectedOrderDetails.id}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrderDetails.status)}`}>
                  {selectedOrderDetails.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
                <div className="space-y-4">
                  {selectedOrderDetails.items && selectedOrderDetails.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 border border-gray-200 rounded-lg p-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">Size: {item.size} | Color: {item.color}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">${(selectedOrderDetails.total - (selectedOrderDetails.tax || 0) - (selectedOrderDetails.shipping || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-semibold">${(selectedOrderDetails.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-semibold">${(selectedOrderDetails.shipping || 0).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">${selectedOrderDetails.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Order Tracking */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Tracking</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    {['Order placed', 'Processing', 'Shipped', 'Delivered'].map((step, index) => {
                      const isActive = ['Order placed', 'Processing', 'Shipped', 'Delivered'].indexOf(selectedOrderDetails.status) >= index;
                      return (
                        <div key={step} className="flex-1 flex flex-col items-center relative">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                            {index + 1}
                          </div>
                          <span className={`text-xs font-semibold ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>{step}</span>
                          {index < 3 && (
                            <div className={`absolute top-4 right-0 w-full h-1 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`} style={{ zIndex: -1, left: '50%', right: '-50%' }}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {selectedOrderDetails.trackingNumber ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Tracking Number:</span>
                        <span className="text-blue-700">{selectedOrderDetails.trackingNumber}</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Track your package at: <a href="#" className="underline hover:text-blue-800">Track Package</a>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="text-blue-700">Tracking information will be available once your order ships.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">
                      {selectedOrderDetails.shippingAddress.firstName} {selectedOrderDetails.shippingAddress.lastName}
                    </p>
                    <p className="text-gray-600">{selectedOrderDetails.shippingAddress.address}</p>
                    <p className="text-gray-600">
                      {selectedOrderDetails.shippingAddress.city}, {selectedOrderDetails.shippingAddress.state} {selectedOrderDetails.shippingAddress.zipCode}
                    </p>
                    <p className="text-gray-600">{selectedOrderDetails.shippingAddress.country}</p>
                    <p className="text-gray-600 mt-2">{selectedOrderDetails.shippingAddress.phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <span className="font-semibold text-gray-900">•••• •••• •••• {selectedOrderDetails.paymentInfo.cardNumber.slice(-4)}</span>
                    </div>
                    <p className="text-gray-600">{selectedOrderDetails.paymentInfo.cardName}</p>
                    <p className="text-gray-600">Expires: {selectedOrderDetails.paymentInfo.expiryDate}</p>
                  </div>
                </div>
              </div>

              {/* Order Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Placed:</span>
                    <span className="font-semibold">{new Date(selectedOrderDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="font-semibold">{new Date(selectedOrderDetails.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={closeOrderModal}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {canCancelOrder(selectedOrderDetails.status) && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrderDetails.id)}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
};

export default CustomerDashboard;
