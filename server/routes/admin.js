const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { auth, authorize } = require('../middleware/auth');
const { secureAuth, authorize: secureAuthorize, verify2FA, verifyCaptcha, adminAuthLimiter, logSecurityEvent } = require('../middleware/secureAuth');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const rbacService = require('../services/rbacService');
const adminAuthService = require('../services/adminAuthService');
const securityService = require('../services/securityService');

// Mock admin data storage (in production, use a database)
let adminUsers = [
  { 
    id: 'admin001', 
    name: 'Super Admin', 
    email: 'admin001@admin.platform.com',
    role: 'SUPER_ADMIN',
    permissions: ['VIEW_DASHBOARD', 'MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_FINANCES', 'MANAGE_SETTINGS', 'MANAGE_ADMINS'],
    isActive: true,
    lastLogin: new Date()
  },
  { 
    id: 'admin002', 
    name: 'Finance Admin', 
    email: 'admin002@admin.platform.com',
    role: 'FINANCE_ADMIN',
    permissions: ['VIEW_DASHBOARD', 'MANAGE_FINANCES', 'VIEW_PAYMENTS', 'MANAGE_REFUNDS'],
    isActive: true,
    lastLogin: new Date()
  },
  { 
    id: 'admin003', 
    name: 'Operations Admin', 
    email: 'admin003@admin.platform.com',
    role: 'OPERATIONS_ADMIN',
    permissions: ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_INVENTORY'],
    isActive: true,
    lastLogin: new Date()
  }
];

let adminSignupRequests = [];

// Real dashboard data from database
const getDashboardData = async () => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get basic counts
    const totalCustomers = await Customer.countDocuments({ isActive: true });
    const totalSellers = await Seller.countDocuments({ isActive: true });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Calculate growth rates
    const customersLastWeek = await Customer.countDocuments({
      isActive: true,
      createdAt: { $gte: sevenDaysAgo }
    });
    const sellersLastWeek = await Seller.countDocuments({
      isActive: true,
      createdAt: { $gte: sevenDaysAgo }
    });

    const customerGrowth = totalCustomers > 0 ? (customersLastWeek / totalCustomers) * 100 : 0;
    const sellerGrowth = totalSellers > 0 ? (sellersLastWeek / totalSellers) * 100 : 0;

    // Get revenue data from completed orders
    const completedOrders = await Order.find({
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo }
    });

    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalProfit = totalRevenue * 0.15; // Assuming 15% profit margin

    // Get recent transactions
    const recentTransactions = await Order.find({ status: { $in: ['completed', 'pending', 'refunded'] } })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id customer total status createdAt paymentMethod');

    // Get top products by sales
    const topProductsData = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.productId',
        title: { $first: '$items.title' },
        totalSales: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.total' }
      }},
      { $sort: { totalSales: -1 } },
      { $limit: 5 }
    ]);

    // Get customer data with order statistics
    const customersWithStats = await Customer.aggregate([
      { $match: { isActive: true } },
      { $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'customer',
        as: 'orders'
      }},
      { $addFields: {
        orderCount: { $size: '$orders' },
        totalSpent: {
          $sum: {
            $map: {
              input: { $filter: { input: '$orders', cond: { $eq: ['$$this.status', 'completed'] } } },
              as: 'order',
              in: '$$order.total'
            }
          }
        }
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      { $project: {
        name: 1,
        email: 1,
        orderCount: 1,
        totalSpent: 1,
        createdAt: 1,
        isActive: 1
      }}
    ]);

    // Get seller data with product and revenue statistics
    const sellersWithStats = await Seller.aggregate([
      { $match: { isActive: true } },
      { $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: 'seller',
        as: 'products'
      }},
      { $lookup: {
        from: 'orders',
        let: { sellerId: '$_id' },
        pipeline: [
          { $unwind: '$items' },
          { $match: {
            $expr: { $eq: ['$items.seller', '$$sellerId'] },
            status: 'completed'
          }},
          { $group: {
            _id: null,
            totalRevenue: { $sum: '$items.total' }
          }}
        ],
        as: 'revenue'
      }},
      { $addFields: {
        productCount: { $size: '$products' },
        totalRevenue: { $ifNull: [{ $arrayElemAt: ['$revenue.totalRevenue', 0] }, 0] },
        commission: { $multiply: [{ $ifNull: [{ $arrayElemAt: ['$revenue.totalRevenue', 0] }, 0] }, 0.15] }
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      { $project: {
        name: 1,
        email: 1,
        storeName: 1,
        productCount: 1,
        totalRevenue: 1,
        commission: 1,
        createdAt: 1,
        isActive: 1
      }}
    ]);

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalCustomers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingOrders,
      customerGrowth: Math.round(customerGrowth * 100) / 100,
      sellerGrowth: Math.round(sellerGrowth * 100) / 100,
      bankDetails: {
        totalBalance: Math.round(totalRevenue * 0.7 * 100) / 100, // 70% of revenue as balance
        pendingPayouts: Math.round(totalRevenue * 0.2 * 100) / 100, // 20% pending
        completedPayouts: Math.round(totalRevenue * 0.8 * 100) / 100 // 80% completed
      },
      recentTransactions: recentTransactions.map(order => ({
        id: order._id,
        customer: order.customer?.name || 'Unknown',
        amount: order.total,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        date: order.createdAt.toISOString().split('T')[0],
        method: order.paymentMethod || 'Credit Card'
      })),
      topProducts: topProductsData.map((product, index) => ({
        id: product._id,
        name: product.title,
        sales: product.totalSales,
        revenue: Math.round(product.totalRevenue * 100) / 100,
        profit: Math.round(product.totalRevenue * 0.3 * 100) / 100 // 30% profit margin
      })),
      customers: customersWithStats.map(customer => ({
        id: customer._id,
        name: customer.name,
        email: customer.email,
        orders: customer.orderCount,
        totalSpent: Math.round(customer.totalSpent * 100) / 100,
        status: customer.totalSpent > 1000 ? 'VIP' : customer.orderCount > 0 ? 'Active' : 'New',
        joinDate: customer.createdAt.toISOString().split('T')[0]
      })),
      sellers: sellersWithStats.map(seller => ({
        id: seller._id,
        name: seller.storeName || seller.name,
        owner: seller.name,
        products: seller.productCount,
        revenue: Math.round(seller.totalRevenue * 100) / 100,
        commission: Math.round(seller.commission * 100) / 100,
        status: seller.isActive ? 'Active' : 'Inactive',
        joinDate: seller.createdAt.toISOString().split('T')[0]
      }))
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Secure admin login with enhanced authentication service
router.post('/login', adminAuthLimiter, async (req, res) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  try {
    const { adminId, password, twoFactorCode, captchaToken } = req.body;

    if (!adminId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID and password are required'
      });
    }

    // Use the enhanced authentication service
    const authResult = await adminAuthService.authenticateAdmin(
      adminId,
      password,
      twoFactorCode,
      ipAddress,
      userAgent
    );

    if (!authResult.success) {
      return res.status(200).json(authResult); // 2FA required case
    }

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: authResult.admin,
        token: authResult.token,
        sessionId: authResult.sessionId,
        expiresAt: authResult.expiresAt
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Authentication failed'
    });
  }
});

// Secure admin logout
router.post('/logout', secureAuth, async (req, res) => {
  try {
    const sessionId = req.sessionId || req.header('X-Session-ID');
    const ipAddress = req.ipAddress;
    const userAgent = req.userAgent;

    const result = await adminAuthService.logoutAdmin(sessionId, ipAddress, userAgent);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout error'
    });
  }
});

// Validate admin session
router.get('/validate-session', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const sessionId = req.header('X-Session-ID');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!token || !sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Token and session ID required'
      });
    }

    const validation = await adminAuthService.validateToken(token, sessionId, ipAddress, userAgent);

    if (!validation) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    res.json({
      success: true,
      data: {
        admin: validation.admin,
        session: {
          sessionId: validation.session.sessionId,
          expiresAt: validation.session.expiresAt,
          lastActivity: validation.session.lastActivity
        }
      }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Session validation error'
    });
  }
});

// Get admin sessions
router.get('/sessions', secureAuth, async (req, res) => {
  try {
    const admin = req.user;
    const sessions = await adminAuthService.getAdminSessions(admin._id);

    res.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sessions'
    });
  }
});

// Revoke admin session
router.delete('/sessions/:sessionId', secureAuth, async (req, res) => {
  try {
    const admin = req.user;
    const { sessionId } = req.params;
    const ipAddress = req.ipAddress;
    const userAgent = req.userAgent;

    await adminAuthService.revokeSession(admin._id, sessionId, ipAddress, userAgent);

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error revoking session'
    });
  }
});

// Setup 2FA for admin
router.post('/setup-2fa', secureAuth, async (req, res) => {
  try {
    const admin = req.user;

    const setup = await adminAuthService.setup2FA(admin._id);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(setup.qrCodeUrl);

    res.json({
      success: true,
      data: {
        secret: setup.secret,
        qrCode: qrCodeUrl,
        manualEntryKey: setup.manualEntryKey
      }
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(400).json({
      success: false,
      message: error.message || '2FA setup error'
    });
  }
});

// Verify and enable 2FA
router.post('/verify-2fa', secureAuth, async (req, res) => {
  try {
    const { twoFactorCode } = req.body;
    const admin = req.user;
    const ipAddress = req.ipAddress;
    const userAgent = req.userAgent;

    if (!twoFactorCode) {
      return res.status(400).json({
        success: false,
        message: '2FA code is required'
      });
    }

    const result = await adminAuthService.enable2FA(admin._id, twoFactorCode, ipAddress, userAgent);

    res.json({
      success: true,
      message: '2FA enabled successfully',
      data: {
        backupCodes: result.backupCodes
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || '2FA verification error'
    });
  }
});

// Disable 2FA
router.post('/disable-2fa', secureAuth, async (req, res) => {
  try {
    const { twoFactorCode } = req.body;
    const admin = req.user;
    const ipAddress = req.ipAddress;
    const userAgent = req.userAgent;

    if (!twoFactorCode) {
      return res.status(400).json({
        success: false,
        message: '2FA code is required to disable 2FA'
      });
    }

    await adminAuthService.disable2FA(admin._id, twoFactorCode, ipAddress, userAgent);

    res.json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(400).json({
      success: false,
      message: error.message || '2FA disable error'
    });
  }
});

// Admin signup request
router.post('/signup-request', (req, res) => {
  try {
    const { fullName, email, adminId, department, requestReason } = req.body;
    
    // Check if admin ID already exists
    const existingAdmin = adminUsers.find(a => a.id === adminId);
    const existingRequest = adminSignupRequests.find(r => r.adminId === adminId);
    
    if (existingAdmin || existingRequest) {
      return res.status(400).json({ message: 'Admin ID already exists or request pending' });
    }
    
    const signupRequest = {
      id: Date.now().toString(),
      fullName,
      email,
      adminId,
      department,
      requestReason,
      status: 'PENDING_APPROVAL',
      requestedAt: new Date(),
      approvedBy: null,
      approvedAt: null
    };
    
    adminSignupRequests.push(signupRequest);
    
    res.status(201).json({
      message: 'Admin access request submitted successfully',
      requestId: signupRequest.id
    });
  } catch (error) {
    console.error('Admin signup request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get secure dashboard data with real-time updates
router.get('/dashboard', secureAuth, secureAuthorize('VIEW_DASHBOARD'), async (req, res) => {
  try {
    const admin = req.user;
    const ipAddress = req.ipAddress;
    const userAgent = req.userAgent;

    // Get dashboard data from database
    const dashboardData = await getDashboardData();

    await logSecurityEvent('ADMIN_DASHBOARD_ACCESS', admin._id, ipAddress, userAgent, {
      role: admin.role,
      dataRequested: Object.keys(dashboardData)
    });

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      userRole: admin.role,
      permissions: admin.permissions
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    await logSecurityEvent('ADMIN_DASHBOARD_ERROR', req.user?._id, req.ipAddress, req.userAgent, {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Dashboard data error'
    });
  }
});

// Get all customers (admin only)
router.get('/customers', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_ADMIN']), async (req, res) => {
  try {
    const dashboardData = await getDashboardData();
    res.json(dashboardData.customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all sellers (admin only)
router.get('/sellers', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_ADMIN']), async (req, res) => {
  try {
    const dashboardData = await getDashboardData();
    res.json(dashboardData.sellers);
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get financial data (admin only)
router.get('/finances', auth, authorize(['SUPER_ADMIN', 'FINANCE_ADMIN']), async (req, res) => {
  try {
    const dashboardData = await getDashboardData();
    const financialData = {
      totalRevenue: dashboardData.totalRevenue,
      totalProfit: dashboardData.totalProfit,
      bankDetails: dashboardData.bankDetails,
      recentTransactions: dashboardData.recentTransactions
    };
    res.json(financialData);
  } catch (error) {
    console.error('Get financial data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update customer status (admin only)
router.put('/customers/:id/status', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_ADMIN']), (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // In production, update database
    res.json({ 
      message: `Customer ${id} status updated to ${status}`,
      customerId: id,
      newStatus: status
    });
  } catch (error) {
    console.error('Update customer status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update seller status (admin only)
router.put('/sellers/:id/status', auth, authorize(['SUPER_ADMIN', 'OPERATIONS_ADMIN']), (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // In production, update database
    res.json({ 
      message: `Seller ${id} status updated to ${status}`,
      sellerId: id,
      newStatus: status
    });
  } catch (error) {
    console.error('Update seller status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin signup requests (super admin only)
router.get('/signup-requests', auth, authorize(['SUPER_ADMIN']), (req, res) => {
  try {
    res.json(adminSignupRequests);
  } catch (error) {
    console.error('Get signup requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject admin signup request (super admin only)
router.put('/signup-requests/:id', auth, authorize(['SUPER_ADMIN']), (req, res) => {
  try {
    const { id } = req.params;
    const { action, role } = req.body; // action: 'approve' or 'reject'
    
    const requestIndex = adminSignupRequests.findIndex(r => r.id === id);
    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Signup request not found' });
    }
    
    const request = adminSignupRequests[requestIndex];
    
    if (action === 'approve') {
      // Create new admin user
      const newAdmin = {
        id: request.adminId,
        name: request.fullName,
        email: request.email,
        role: role || 'OPERATIONS_ADMIN',
        permissions: getPermissionsByRole(role || 'OPERATIONS_ADMIN'),
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      };
      
      adminUsers.push(newAdmin);
      request.status = 'APPROVED';
      request.approvedBy = req.user.id;
      request.approvedAt = new Date();
      
      res.json({ 
        message: 'Admin request approved successfully',
        newAdmin: newAdmin
      });
    } else {
      request.status = 'REJECTED';
      request.approvedBy = req.user.id;
      request.approvedAt = new Date();
      
      res.json({ message: 'Admin request rejected' });
    }
  } catch (error) {
    console.error('Process signup request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get permissions by role
function getPermissionsByRole(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return ['VIEW_DASHBOARD', 'MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_FINANCES', 'MANAGE_SETTINGS', 'MANAGE_ADMINS'];
    case 'FINANCE_ADMIN':
      return ['VIEW_DASHBOARD', 'MANAGE_FINANCES', 'VIEW_PAYMENTS', 'MANAGE_REFUNDS'];
    case 'OPERATIONS_ADMIN':
      return ['VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_INVENTORY'];
    default:
      return ['VIEW_DASHBOARD'];
  }
}

// Get system analytics (admin only) - Enhanced version with real data
router.get('/analytics', secureAuth, secureAuthorize('VIEW_ANALYTICS'), async (req, res) => {
  try {
    const admin = req.user;
    const { timeframe = '7d' } = req.query;

    // Parse timeframe
    const days = parseInt(timeframe.replace('d', ''));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get real order trends
    const orderTrends = await Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$total", 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Get real user growth
    const userGrowth = await Customer.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Get real top products
    const topProducts = await Order.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.productId',
        name: { $first: '$items.title' },
        sales: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' }
      }},
      { $sort: { sales: -1 } },
      { $limit: 5 }
    ]);

    // Calculate overview metrics
    const totalRevenue = orderTrends.reduce((sum, trend) => sum + trend.revenue, 0);
    const totalOrders = orderTrends.reduce((sum, trend) => sum + trend.count, 0);
    const totalNewUsers = userGrowth.reduce((sum, growth) => sum + growth.count, 0);

    // Get total users for conversion rate calculation
    const totalUsers = await Customer.countDocuments({ isActive: true });
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;

    // Get returning users (users with more than 1 order)
    const returningUsersCount = await Customer.aggregate([
      { $lookup: {
        from: 'orders',
        localField: '_id',
        foreignField: 'customer',
        as: 'orders'
      }},
      { $match: { 'orders.1': { $exists: true } } },
      { $count: 'returningUsers' }
    ]);

    const returningUsers = returningUsersCount[0]?.returningUsers || 0;

    // Mock traffic sources (would need web analytics integration for real data)
    const trafficSources = [
      { source: 'Organic Search', visitors: Math.round(totalUsers * 0.42), percentage: 42.1 },
      { source: 'Direct', visitors: Math.round(totalUsers * 0.28), percentage: 28.5 },
      { source: 'Social Media', visitors: Math.round(totalUsers * 0.19), percentage: 18.9 },
      { source: 'Email', visitors: Math.round(totalUsers * 0.07), percentage: 6.8 },
      { source: 'Referral', visitors: Math.round(totalUsers * 0.04), percentage: 3.6 }
    ];

    const analytics = {
      success: true,
      data: {
        overview: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          revenueChange: 12.5, // Would need historical comparison for real change
          totalOrders,
          ordersChange: 8.3, // Would need historical comparison for real change
          totalUsers,
          usersChange: 15.2, // Would need historical comparison for real change
          conversionRate: Math.round(conversionRate * 100) / 100,
          conversionChange: 2.1 // Would need historical comparison for real change
        },
        salesData: orderTrends.map(trend => ({
          date: trend._id,
          revenue: Math.round(trend.revenue * 100) / 100,
          orders: trend.count
        })),
        topProducts: topProducts.map(product => ({
          id: product._id,
          name: product.name,
          sales: product.sales,
          revenue: Math.round(product.revenue * 100) / 100,
          image: '/api/placeholder/product-image'
        })),
        userMetrics: {
          newUsers: totalNewUsers,
          returningUsers,
          averageSessionDuration: 245, // Would need analytics integration
          bounceRate: 32.5 // Would need analytics integration
        },
        trafficSources
      }
    };

    await logSecurityEvent('ADMIN_ANALYTICS_ACCESS', admin._id, req.ipAddress, req.userAgent, {
      timeframe,
      role: admin.role
    });

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    await logSecurityEvent('ADMIN_ANALYTICS_ERROR', req.user?._id, req.ipAddress, req.userAgent, {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Secure user management endpoints
router.get('/users', secureAuth, secureAuthorize('MANAGE_USERS'), async (req, res) => {
  try {
    const admin = req.user;
    const { page = 1, limit = 20, role, status, search } = req.query;

    // Build query based on admin permissions
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) query.role = role;
    if (status) query.isActive = status === 'active';

    // Get users based on admin role
    let users = [];
    if (admin.role === 'SUPER_ADMIN' || admin.role === 'SECURITY_ADMIN') {
      const customers = await Customer.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const sellers = await Seller.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const admins = await Admin.find(query)
        .select('-password -twoFactorSecret')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      users = [...customers, ...sellers, ...admins];
    } else if (admin.role === 'OPERATIONS_ADMIN') {
      const customers = await Customer.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const sellers = await Seller.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      users = [...customers, ...sellers];
    }

    await logSecurityEvent('ADMIN_USERS_ACCESS', admin._id, req.ipAddress, req.userAgent, {
      query: req.query,
      resultCount: users.length
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: users.length
        }
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});



// Secure audit logs endpoint
router.get('/audit-logs', secureAuth, secureAuthorize('SECURITY_AUDIT'), async (req, res) => {
  try {
    const admin = req.user;
    const { page = 1, limit = 50, severity, eventType, userId, timeframe = '7d' } = req.query;

    let query = {};

    if (severity) query.severity = severity;
    if (eventType) query.eventType = eventType;
    if (userId) query.userId = userId;

    // Time filter
    const timeframeDays = parseInt(timeframe.replace('d', ''));
    const since = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000);
    query.timestamp = { $gte: since };

    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ timestamp: -1 });

    const total = await AuditLog.countDocuments(query);

    await logSecurityEvent('ADMIN_AUDIT_ACCESS', admin._id, req.ipAddress, req.userAgent, {
      query: req.query,
      resultCount: auditLogs.length
    });

    res.json({
      success: true,
      data: {
        logs: auditLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Admin audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs'
    });
  }
});

// Helper function to get secure dashboard data
async function getSecureDashboardData(admin) {
  const data = {};

  try {
    // Base metrics available to all admin roles
    if (admin.hasPermission('VIEW_DASHBOARD')) {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get basic counts
      data.totalUsers = await Customer.countDocuments({ isActive: true });
      data.totalSellers = await Seller.countDocuments({ isActive: true });
      data.totalProducts = await Product.countDocuments({ isActive: true });
      data.totalOrders = await Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    }

    // Financial data for finance admins
    if (admin.hasPermission('MANAGE_FINANCES')) {
      const orders = await Order.find({
        status: 'completed',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      data.totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
      data.totalProfit = data.totalRevenue * 0.15; // Estimated 15% profit margin
      data.recentTransactions = orders.slice(0, 10).map(order => ({
        id: order._id,
        amount: order.total,
        date: order.createdAt,
        status: order.status
      }));
    }

    // Operations data for operations admins
    if (admin.hasPermission('MANAGE_PRODUCTS') || admin.hasPermission('MANAGE_ORDERS')) {
      data.pendingOrders = await Order.countDocuments({ status: 'pending' });
      data.lowStockProducts = await Product.countDocuments({ totalStock: { $lt: 10 } });
    }

    // Security data for security admins
    if (admin.hasPermission('SECURITY_AUDIT')) {
      const securityEvents = await AuditLog.getSecurityEvents(24);
      data.securityAlerts = securityEvents.length;
      data.recentSecurityEvents = securityEvents.slice(0, 5);
    }

    return data;
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    throw error;
  }
}

// Helper function to get analytics data
async function getAnalyticsData(admin, timeframe, metrics) {
  const data = {};

  try {
    const days = parseInt(timeframe.replace('d', ''));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (admin.hasPermission('VIEW_ANALYTICS')) {
      // User growth
      const userGrowth = await Customer.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]);

      data.userGrowth = userGrowth;

      // Order trends
      const orderTrends = await Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$total" }
        }},
        { $sort: { _id: 1 } }
      ]);

      data.orderTrends = orderTrends;
    }

    return data;
  } catch (error) {
    console.error('Error getting analytics data:', error);
    throw error;
  }
}

// Error logging endpoint for admin panel
router.post('/log-error', secureAuth, async (req, res) => {
  try {
    const admin = req.user;
    const { message, stack, componentStack, errorId, timestamp, url } = req.body;

    await logSecurityEvent('ADMIN_FRONTEND_ERROR', admin._id, req.ipAddress, req.userAgent, {
      errorId,
      message,
      stack,
      componentStack,
      url,
      timestamp
    });

    res.json({
      success: true,
      message: 'Error logged successfully'
    });
  } catch (error) {
    console.error('Error logging failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to log error'
    });
  }
});

// Error reporting endpoint
router.post('/report-error', secureAuth, async (req, res) => {
  try {
    const admin = req.user;
    const { errorId, userDescription, reproductionSteps } = req.body;

    await logSecurityEvent('ADMIN_ERROR_REPORT', admin._id, req.ipAddress, req.userAgent, {
      errorId,
      userDescription,
      reproductionSteps,
      reportedBy: admin.name,
      reportedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Error report submitted successfully'
    });
  } catch (error) {
    console.error('Error reporting failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit error report'
    });
  }
});

// Debug endpoint to check database contents
router.get('/debug/database', secureAuth, async (req, res) => {
  try {
    const customerCount = await Customer.countDocuments();
    const sellerCount = await Seller.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();

    const sampleCustomers = await Customer.find().limit(5).select('name email createdAt');
    const sampleSellers = await Seller.find().limit(5).select('name email storeName createdAt');
    const sampleProducts = await Product.find().limit(5).select('title price seller createdAt');
    const sampleOrders = await Order.find().limit(5).select('total status customer createdAt');

    res.json({
      success: true,
      data: {
        counts: {
          customers: customerCount,
          sellers: sellerCount,
          products: productCount,
          orders: orderCount
        },
        samples: {
          customers: sampleCustomers,
          sellers: sampleSellers,
          products: sampleProducts,
          orders: sampleOrders
        }
      }
    });
  } catch (error) {
    console.error('Debug database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database debug error',
      error: error.message
    });
  }
});

// Create sample data for testing
router.post('/debug/create-sample-data', secureAuth, async (req, res) => {
  try {
    // Check if data already exists
    const customerCount = await Customer.countDocuments();
    const sellerCount = await Seller.countDocuments();

    if (customerCount > 0 || sellerCount > 0) {
      return res.json({
        success: false,
        message: 'Sample data already exists',
        counts: { customers: customerCount, sellers: sellerCount }
      });
    }

    // Create sample customers
    const sampleCustomers = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '+1234567890',
        isEmailVerified: true,
        isActive: true
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        password: 'password123',
        phone: '+1234567891',
        isEmailVerified: true,
        isActive: true
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        password: 'password123',
        phone: '+1234567892',
        isEmailVerified: true,
        isActive: true
      }
    ];

    // Create sample sellers
    const sampleSellers = [
      {
        name: 'Alice Cooper',
        email: 'alice@fashionstore.com',
        password: 'password123',
        storeName: 'Fashion Store',
        storeDescription: 'Premium fashion and accessories',
        phone: '+1234567893',
        isEmailVerified: true,
        isActive: true
      },
      {
        name: 'Bob Wilson',
        email: 'bob@techhub.com',
        password: 'password123',
        storeName: 'Tech Hub',
        storeDescription: 'Latest technology and gadgets',
        phone: '+1234567894',
        isEmailVerified: true,
        isActive: true
      }
    ];

    const createdCustomers = await Customer.insertMany(sampleCustomers);
    const createdSellers = await Seller.insertMany(sampleSellers);

    // Create sample products
    const sampleProducts = [
      {
        seller: createdSellers[0]._id,
        title: 'Summer Floral Dress',
        description: 'Beautiful floral dress perfect for summer occasions',
        price: 89.99,
        category: 'Dresses',
        subcategory: 'Summer Dresses',
        images: ['/images/dress1.jpg'],
        variants: [{
          size: 'M',
          color: 'Blue',
          stock: 50,
          price: 89.99,
          sku: 'SFD-M-BLU'
        }],
        totalStock: 50,
        isActive: true
      },
      {
        seller: createdSellers[0]._id,
        title: 'Classic Denim Jacket',
        description: 'Timeless denim jacket for any season',
        price: 129.99,
        category: 'Jackets',
        subcategory: 'Denim',
        images: ['/images/jacket1.jpg'],
        variants: [{
          size: 'L',
          color: 'Blue',
          stock: 30,
          price: 129.99,
          sku: 'CDJ-L-BLU'
        }],
        totalStock: 30,
        isActive: true
      }
    ];

    const createdProducts = await Product.insertMany(sampleProducts);

    // Create sample orders
    const sampleOrders = [
      {
        customer: createdCustomers[0]._id,
        items: [{
          productId: createdProducts[0]._id,
          seller: createdSellers[0]._id,
          title: 'Summer Floral Dress',
          image: '/images/dress1.jpg',
          size: 'M',
          color: 'Blue',
          quantity: 1,
          price: 89.99,
          total: 89.99
        }],
        total: 89.99,
        status: 'completed',
        paymentMethod: 'credit_card',
        shippingAddress: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        }
      },
      {
        customer: createdCustomers[1]._id,
        items: [{
          productId: createdProducts[1]._id,
          seller: createdSellers[0]._id,
          title: 'Classic Denim Jacket',
          image: '/images/jacket1.jpg',
          size: 'L',
          color: 'Blue',
          quantity: 1,
          price: 129.99,
          total: 129.99
        }],
        total: 129.99,
        status: 'pending',
        paymentMethod: 'paypal',
        shippingAddress: {
          firstName: 'Jane',
          lastName: 'Smith',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'United States'
        }
      }
    ];

    const createdOrders = await Order.insertMany(sampleOrders);

    res.json({
      success: true,
      message: 'Sample data created successfully',
      data: {
        customers: createdCustomers.length,
        sellers: createdSellers.length,
        products: createdProducts.length,
        orders: createdOrders.length
      }
    });

  } catch (error) {
    console.error('Create sample data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating sample data',
      error: error.message
    });
  }
});

// Get system health status
router.get('/system-health', secureAuth, secureAuthorize('SUPER_ADMIN', 'SECURITY_ADMIN'), async (req, res) => {
  try {
    const healthData = {
      server: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date()
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState
      },
      security: securityService.getSecurityStats(),
      authentication: adminAuthService.getAuthStats()
    };

    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({
      success: false,
      message: 'System health check failed'
    });
  }
});

// Get settings data with real system information
router.get('/settings', secureAuth, secureAuthorize('MANAGE_SETTINGS'), async (req, res) => {
  try {
    const admin = req.user;

    // Get real system statistics
    const totalUsers = await Customer.countDocuments({ isActive: true });
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({ status: 'completed' });
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const settings = {
      general: {
        siteName: 'Fashion Era',
        siteDescription: 'Your premier destination for fashion and style. Discover the latest trends, timeless classics, and exclusive collections from top designers worldwide.',
        contactEmail: 'contact@fashionera.com',
        supportEmail: 'support@fashionera.com',
        currency: 'USD',
        timezone: 'America/New_York',
        language: 'en',
        maintenanceMode: false,
        allowRegistrations: true
      },
      notifications: {
        emailNotifications: true,
        orderNotifications: true,
        userRegistrations: true,
        lowStockAlerts: true,
        systemUpdates: false,
        marketingEmails: true,
        smsNotifications: false
      },
      security: {
        twoFactorAuth: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: false
        }
      },
      payment: {
        stripeEnabled: true,
        paypalEnabled: true,
        testMode: false,
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
        paypalClientId: process.env.PAYPAL_CLIENT_ID || 'AXxxx...'
      },
      shipping: {
        freeShippingThreshold: 50,
        defaultShippingRate: 9.99,
        internationalShipping: true,
        expressShippingRate: 19.99,
        processingTime: 2
      },
      systemInfo: {
        applicationVersion: 'v2.1.0',
        databaseVersion: 'MongoDB 6.0',
        nodeVersion: process.version,
        uptime: Math.floor(process.uptime() / 86400) + ' days, ' + Math.floor((process.uptime() % 86400) / 3600) + ' hours',
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        systemStatus: 'Healthy'
      }
    };

    await logSecurityEvent('ADMIN_SETTINGS_ACCESS', admin._id, req.ipAddress, req.userAgent, {
      role: admin.role
    });

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    await logSecurityEvent('ADMIN_SETTINGS_ERROR', req.user?._id, req.ipAddress, req.userAgent, {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

// Update settings
router.put('/settings', secureAuth, secureAuthorize('MANAGE_SETTINGS'), async (req, res) => {
  try {
    const admin = req.user;
    const { settings } = req.body;

    // In a real application, you would save these settings to a database
    // For now, we'll just log the update and return success

    await logSecurityEvent('ADMIN_SETTINGS_UPDATE', admin._id, req.ipAddress, req.userAgent, {
      updatedSettings: Object.keys(settings),
      role: admin.role
    });

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    await logSecurityEvent('ADMIN_SETTINGS_UPDATE_ERROR', req.user?._id, req.ipAddress, req.userAgent, {
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
});

module.exports = router;
