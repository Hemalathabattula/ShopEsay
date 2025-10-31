const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const { logSecurityEvent } = require('../middleware/secureAuth');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
    this.connectedSellers = new Map();
    this.connectedAdmins = new Map();
    this.adminSessions = new Map(); // Track admin sessions for security
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    return this.io;
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);
      const ipAddress = socket.handshake.address;
      const userAgent = socket.handshake.headers['user-agent'];

      // Secure authentication with JWT verification
      socket.on('authenticate', async (data) => {
        try {
          const { token, sessionId } = data;

          if (!token) {
            await logSecurityEvent('SOCKET_AUTH_MISSING_TOKEN', null, ipAddress, userAgent);
            socket.emit('auth_error', { message: 'Authentication token required' });
            socket.disconnect();
            return;
          }

          // Verify JWT token
          let decoded;
          try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
          } catch (error) {
            await logSecurityEvent('SOCKET_AUTH_INVALID_TOKEN', null, ipAddress, userAgent, { error: error.message });
            socket.emit('auth_error', { message: 'Invalid authentication token' });
            socket.disconnect();
            return;
          }

          // Find user based on role
          let user;
          if (decoded.role === 'CUSTOMER') {
            user = await Customer.findById(decoded.id).select('-password');
          } else if (decoded.role === 'SELLER') {
            user = await Seller.findById(decoded.id).select('-password');
          } else if (['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SECURITY_ADMIN'].includes(decoded.role)) {
            user = await Admin.findById(decoded.id).select('-password -twoFactorSecret');

            // For admin users, verify session
            if (sessionId) {
              const session = user.activeSessions.find(s => s.sessionId === sessionId && s.isActive);
              if (!session) {
                await logSecurityEvent('SOCKET_AUTH_INVALID_SESSION', user._id, ipAddress, userAgent);
                socket.emit('auth_error', { message: 'Invalid session' });
                socket.disconnect();
                return;
              }
            }
          }

          if (!user || !user.isActive) {
            await logSecurityEvent('SOCKET_AUTH_USER_NOT_FOUND', decoded.id, ipAddress, userAgent);
            socket.emit('auth_error', { message: 'User not found or inactive' });
            socket.disconnect();
            return;
          }

          // Set socket properties
          socket.userId = user._id.toString();
          socket.userType = user.role;
          socket.sessionId = sessionId;
          socket.ipAddress = ipAddress;
          socket.userAgent = userAgent;

          // Join appropriate rooms based on user type
          if (user.role === 'CUSTOMER') {
            socket.join(`user-${user._id}`);
            this.connectedUsers.set(user._id.toString(), socket.id);
            console.log(`👤 Customer ${user._id} joined room user-${user._id}`);
          } else if (user.role === 'SELLER') {
            socket.join(`seller-${user._id}`);
            this.connectedSellers.set(user._id.toString(), socket.id);
            console.log(`🏪 Seller ${user._id} joined room seller-${user._id}`);
          } else if (['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SECURITY_ADMIN'].includes(user.role)) {
            // Admin users join role-specific rooms
            socket.join('admin');
            socket.join(`admin-${user.role.toLowerCase()}`);
            socket.join(`admin-${user._id}`);

            this.connectedAdmins.set(user._id.toString(), {
              socketId: socket.id,
              role: user.role,
              permissions: user.permissions,
              sessionId,
              connectedAt: new Date()
            });

            // Track admin session for security monitoring
            this.adminSessions.set(socket.id, {
              adminId: user._id.toString(),
              role: user.role,
              ipAddress,
              userAgent,
              connectedAt: new Date()
            });

            console.log(`👑 Admin ${user._id} (${user.role}) joined admin rooms`);
          }

          await logSecurityEvent('SOCKET_AUTH_SUCCESS', user._id, ipAddress, userAgent, {
            userType: user.role,
            sessionId
          });

          socket.emit('authenticated', {
            success: true,
            userId: user._id,
            role: user.role,
            permissions: user.permissions
          });

        } catch (error) {
          console.error('Socket authentication error:', error);
          await logSecurityEvent('SOCKET_AUTH_ERROR', null, ipAddress, userAgent, { error: error.message });
          socket.emit('auth_error', { message: 'Authentication system error' });
          socket.disconnect();
        }
      });

      // Order tracking
      socket.on('track-order', (orderId) => {
        socket.join(`order-${orderId}`);
        console.log(`📦 User tracking order: ${orderId}`);
      });

      // Live chat support
      socket.on('join-support-chat', (data) => {
        const { userId, orderId } = data;
        const chatRoom = `support-${userId}-${orderId}`;
        socket.join(chatRoom);
        console.log(`💬 User joined support chat: ${chatRoom}`);
      });

      socket.on('support-message', (data) => {
        const { userId, orderId, message, sender } = data;
        const chatRoom = `support-${userId}-${orderId}`;
        
        this.io.to(chatRoom).emit('support-message', {
          message,
          sender,
          timestamp: new Date(),
          userId,
          orderId
        });
      });

      // Seller notifications
      socket.on('join-seller-notifications', (sellerId) => {
        socket.join(`seller-notifications-${sellerId}`);
        console.log(`🔔 Seller ${sellerId} joined notifications`);
      });

      // Inventory alerts
      socket.on('monitor-inventory', (productIds) => {
        if (socket.userType === 'SELLER' || socket.userType.includes('ADMIN')) {
          productIds.forEach(productId => {
            socket.join(`inventory-${productId}`);
          });
          console.log(`📊 Monitoring inventory for products: ${productIds.join(', ')}`);
        }
      });

      // Admin-specific event handlers
      socket.on('admin-subscribe-analytics', () => {
        if (socket.userType && socket.userType.includes('ADMIN')) {
          socket.join('admin-analytics');
          console.log(`📊 Admin ${socket.userId} subscribed to analytics updates`);
        }
      });

      socket.on('admin-subscribe-security', () => {
        if (socket.userType && ['SUPER_ADMIN', 'SECURITY_ADMIN'].includes(socket.userType)) {
          socket.join('admin-security');
          console.log(`🔒 Admin ${socket.userId} subscribed to security alerts`);
        }
      });

      socket.on('admin-subscribe-orders', () => {
        if (socket.userType && ['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(socket.userType)) {
          socket.join('admin-orders');
          console.log(`📦 Admin ${socket.userId} subscribed to order updates`);
        }
      });

      socket.on('admin-subscribe-finances', () => {
        if (socket.userType && ['SUPER_ADMIN', 'FINANCE_ADMIN'].includes(socket.userType)) {
          socket.join('admin-finances');
          console.log(`💰 Admin ${socket.userId} subscribed to financial updates`);
        }
      });

      // Admin dashboard real-time data request
      socket.on('admin-request-dashboard-update', async () => {
        if (socket.userType && socket.userType.includes('ADMIN')) {
          try {
            const dashboardData = await this.getRealtimeDashboardData(socket.userType);
            socket.emit('admin-dashboard-update', dashboardData);
          } catch (error) {
            console.error('Dashboard update error:', error);
            socket.emit('admin-dashboard-error', { message: 'Failed to get dashboard data' });
          }
        }
      });

      // Disconnect handling with security logging
      socket.on('disconnect', async () => {
        console.log(`🔌 User disconnected: ${socket.id}`);

        if (socket.userId) {
          if (socket.userType === 'CUSTOMER') {
            this.connectedUsers.delete(socket.userId);
          } else if (socket.userType === 'SELLER') {
            this.connectedSellers.delete(socket.userId);
          } else if (socket.userType && socket.userType.includes('ADMIN')) {
            this.connectedAdmins.delete(socket.userId);
            this.adminSessions.delete(socket.id);

            await logSecurityEvent('SOCKET_ADMIN_DISCONNECT', socket.userId, socket.ipAddress, socket.userAgent, {
              role: socket.userType,
              sessionId: socket.sessionId
            });
          }
        }
      });
    });
  }

  // Order-related notifications
  notifyOrderCreated(order) {
    // Notify customer
    this.io.to(`user-${order.userId}`).emit('order-created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      timestamp: new Date()
    });

    // Notify sellers
    const sellerIds = [...new Set(order.items.map(item => item.sellerId.toString()))];
    sellerIds.forEach(sellerId => {
      const sellerItems = order.items.filter(item => item.sellerId.toString() === sellerId);
      this.io.to(`seller-${sellerId}`).emit('new-order', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        items: sellerItems,
        customerInfo: {
          name: order.shippingAddress.firstName + ' ' + order.shippingAddress.lastName,
          address: order.shippingAddress
        },
        timestamp: new Date()
      });
    });

    // Notify admin
    this.io.to('admin').emit('new-order-admin', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      total: order.total,
      itemCount: order.items.length,
      timestamp: new Date()
    });
  }

  notifyOrderStatusUpdate(order, previousStatus) {
    const statusUpdate = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      previousStatus,
      timestamp: new Date()
    };

    // Notify customer
    this.io.to(`user-${order.userId}`).emit('order-status-updated', statusUpdate);

    // Notify order trackers
    this.io.to(`order-${order._id}`).emit('order-status-updated', statusUpdate);

    // Notify sellers if relevant
    if (['shipped', 'delivered'].includes(order.status)) {
      const sellerIds = [...new Set(order.items.map(item => item.sellerId.toString()))];
      sellerIds.forEach(sellerId => {
        this.io.to(`seller-${sellerId}`).emit('order-status-updated', statusUpdate);
      });
    }
  }

  notifyPaymentUpdate(order, paymentStatus) {
    const paymentUpdate = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      paymentStatus,
      timestamp: new Date()
    };

    // Notify customer
    this.io.to(`user-${order.userId}`).emit('payment-updated', paymentUpdate);

    // Notify sellers
    const sellerIds = [...new Set(order.items.map(item => item.sellerId.toString()))];
    sellerIds.forEach(sellerId => {
      this.io.to(`seller-${sellerId}`).emit('payment-updated', paymentUpdate);
    });
  }

  // Inventory notifications
  notifyLowStock(product, sellerId) {
    this.io.to(`seller-${sellerId}`).emit('low-stock-alert', {
      productId: product._id,
      productName: product.title,
      currentStock: product.totalStock,
      threshold: 5,
      timestamp: new Date()
    });

    this.io.to(`inventory-${product._id}`).emit('stock-updated', {
      productId: product._id,
      stock: product.totalStock,
      timestamp: new Date()
    });
  }

  notifyStockUpdate(productId, newStock) {
    this.io.to(`inventory-${productId}`).emit('stock-updated', {
      productId,
      stock: newStock,
      timestamp: new Date()
    });
  }

  // Shipping notifications
  notifyShippingUpdate(shipment) {
    const shippingUpdate = {
      orderId: shipment.orderId,
      trackingNumber: shipment.trackingNumber,
      carrier: shipment.carrier,
      status: shipment.status,
      events: shipment.events,
      timestamp: new Date()
    };

    // Notify customer
    this.io.to(`order-${shipment.orderId}`).emit('shipping-updated', shippingUpdate);
  }

  // Analytics and live updates
  notifyLiveSales(saleData) {
    this.io.to('admin').emit('live-sale', {
      orderId: saleData.orderId,
      amount: saleData.amount,
      productCount: saleData.productCount,
      timestamp: new Date()
    });
  }

  // Broadcast system announcements
  broadcastAnnouncement(message, userType = 'all') {
    if (userType === 'all') {
      this.io.emit('system-announcement', {
        message,
        timestamp: new Date()
      });
    } else if (userType === 'customers') {
      this.connectedUsers.forEach((socketId, userId) => {
        this.io.to(`user-${userId}`).emit('system-announcement', {
          message,
          timestamp: new Date()
        });
      });
    } else if (userType === 'sellers') {
      this.connectedSellers.forEach((socketId, userId) => {
        this.io.to(`seller-${userId}`).emit('system-announcement', {
          message,
          timestamp: new Date()
        });
      });
    }
  }

  // Admin-specific notifications
  notifyAdminSecurityAlert(alertData) {
    this.io.to('admin-security').emit('security-alert', {
      ...alertData,
      timestamp: new Date(),
      severity: alertData.severity || 'HIGH'
    });
  }

  notifyAdminOrderUpdate(orderData) {
    this.io.to('admin-orders').emit('order-update', {
      ...orderData,
      timestamp: new Date()
    });
  }

  notifyAdminFinancialUpdate(financialData) {
    this.io.to('admin-finances').emit('financial-update', {
      ...financialData,
      timestamp: new Date()
    });
  }

  notifyAdminAnalyticsUpdate(analyticsData) {
    this.io.to('admin-analytics').emit('analytics-update', {
      ...analyticsData,
      timestamp: new Date()
    });
  }

  notifyAdminUserActivity(activityData) {
    this.io.to('admin').emit('user-activity', {
      ...activityData,
      timestamp: new Date()
    });
  }

  // Broadcast critical system alerts to all admins
  broadcastCriticalAlert(alertData) {
    this.io.to('admin').emit('critical-alert', {
      ...alertData,
      timestamp: new Date(),
      severity: 'CRITICAL'
    });
  }

  // Send targeted notification to specific admin
  notifySpecificAdmin(adminId, eventType, data) {
    this.io.to(`admin-${adminId}`).emit(eventType, {
      ...data,
      timestamp: new Date()
    });
  }

  // Real-time dashboard data for admins
  async getRealtimeDashboardData(adminRole) {
    try {
      const data = {
        timestamp: new Date(),
        connections: this.getConnectionStats()
      };

      // Add role-specific data
      if (adminRole === 'SUPER_ADMIN') {
        data.systemHealth = await this.getSystemHealth();
        data.securityStatus = await this.getSecurityStatus();
      }

      if (['SUPER_ADMIN', 'FINANCE_ADMIN'].includes(adminRole)) {
        data.realtimeRevenue = await this.getRealtimeRevenue();
      }

      if (['SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(adminRole)) {
        data.orderQueue = await this.getOrderQueue();
        data.inventoryAlerts = await this.getInventoryAlerts();
      }

      return data;
    } catch (error) {
      console.error('Error getting realtime dashboard data:', error);
      throw error;
    }
  }

  // Helper methods for realtime data
  async getSystemHealth() {
    return {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: this.io.sockets.sockets.size
    };
  }

  async getSecurityStatus() {
    // This would integrate with your security monitoring
    return {
      activeThreats: 0,
      blockedIPs: [],
      suspiciousActivity: 0
    };
  }

  async getRealtimeRevenue() {
    // This would calculate real-time revenue
    return {
      today: 0,
      thisHour: 0,
      trend: 'up'
    };
  }

  async getOrderQueue() {
    // This would get pending orders
    return {
      pending: 0,
      processing: 0,
      urgent: 0
    };
  }

  async getInventoryAlerts() {
    // This would get low stock alerts
    return {
      lowStock: 0,
      outOfStock: 0,
      criticalItems: []
    };
  }

  // Get connection statistics with admin details
  getConnectionStats() {
    return {
      totalConnections: this.io.sockets.sockets.size,
      connectedCustomers: this.connectedUsers.size,
      connectedSellers: this.connectedSellers.size,
      connectedAdmins: this.connectedAdmins.size,
      adminSessions: Array.from(this.adminSessions.values()),
      rooms: Array.from(this.io.sockets.adapter.rooms.keys())
    };
  }

  // Get admin-specific connection info
  getAdminConnections() {
    return Array.from(this.connectedAdmins.entries()).map(([adminId, info]) => ({
      adminId,
      ...info,
      sessionInfo: this.adminSessions.get(info.socketId)
    }));
  }
}

module.exports = new SocketService();
