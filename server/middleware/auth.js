const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const Admin = require('../models/Admin');
const { logSecurityEvent } = require('./secureAuth');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    if (!token) {
      await logSecurityEvent('AUTH_MISSING_TOKEN', null, ipAddress, userAgent);
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      await logSecurityEvent('AUTH_INVALID_TOKEN', null, ipAddress, userAgent, { error: error.message });
      return res.status(401).json({
        success: false,
        message: 'Token is not valid.'
      });
    }

    // Find user based on role in token
    let user;
    if (decoded.role === 'CUSTOMER') {
      user = await Customer.findById(decoded.id).select('-password');
    } else if (decoded.role === 'SELLER') {
      user = await Seller.findById(decoded.id).select('-password');
    } else if (['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SECURITY_ADMIN'].includes(decoded.role)) {
      user = await Admin.findById(decoded.id).select('-password -twoFactorSecret');
    }

    if (!user) {
      await logSecurityEvent('AUTH_USER_NOT_FOUND', decoded.id, ipAddress, userAgent);
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (!user.isActive) {
      await logSecurityEvent('AUTH_INACTIVE_ACCOUNT', user._id, ipAddress, userAgent);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Store additional request info for logging
    req.user = user;
    req.ipAddress = ipAddress;
    req.userAgent = userAgent;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    await logSecurityEvent('AUTH_SYSTEM_ERROR', null, req.ip, req.get('User-Agent'), { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Authentication system error.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = { auth, authorize };
