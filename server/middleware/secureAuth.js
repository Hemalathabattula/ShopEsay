const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for successful authentications
    return req.authSuccess === true;
  }
});

// Strict rate limiting for admin endpoints (temporarily relaxed for testing)
const adminAuthLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 15)
  max: 10, // limit each IP to 10 requests per windowMs for admin auth (increased from 3)
  message: {
    success: false,
    message: 'Too many admin authentication attempts, please try again later.',
    retryAfter: 5 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Enhanced authentication middleware
const secureAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const sessionId = req.header('X-Session-ID');
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

    // Find user based on role
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

    // Check if admin account is locked
    if (user.isLocked) {
      await logSecurityEvent('AUTH_LOCKED_ACCOUNT', user._id, ipAddress, userAgent);
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts.'
      });
    }

    // For admin users, check IP whitelist if enabled
    if (user.role && user.role.includes('ADMIN') && user.requireIPWhitelist) {
      if (!user.ipWhitelist.includes(ipAddress)) {
        await logSecurityEvent('AUTH_IP_NOT_WHITELISTED', user._id, ipAddress, userAgent);
        return res.status(403).json({
          success: false,
          message: 'Access denied from this IP address.'
        });
      }
    }

    // Check session validity for admin users
    if (user.role && user.role.includes('ADMIN') && sessionId) {
      const session = user.activeSessions.find(s => s.sessionId === sessionId && s.isActive);
      if (!session) {
        await logSecurityEvent('AUTH_INVALID_SESSION', user._id, ipAddress, userAgent);
        return res.status(401).json({
          success: false,
          message: 'Invalid session. Please login again.'
        });
      }
      
      // Update session activity
      await user.updateSessionActivity(sessionId);
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      await logSecurityEvent('AUTH_PASSWORD_CHANGED', user._id, ipAddress, userAgent);
      return res.status(401).json({
        success: false,
        message: 'Password was changed. Please login again.'
      });
    }

    req.user = user;
    req.sessionId = sessionId;
    req.ipAddress = ipAddress;
    req.userAgent = userAgent;
    
    next();
  } catch (error) {
    console.error('Secure auth middleware error:', error);
    await logSecurityEvent('AUTH_SYSTEM_ERROR', null, req.ip, req.get('User-Agent'), { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Authentication system error.'
    });
  }
};

// Role-based authorization with permission checking
const authorize = (...rolesOrPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. Please login.'
        });
      }

      const userRole = req.user.role;
      const userPermissions = req.user.permissions || [];

      // Check if user has required role
      const hasRole = rolesOrPermissions.some(roleOrPerm => {
        if (userRole === roleOrPerm) return true;
        if (userPermissions.includes(roleOrPerm)) return true;
        return false;
      });

      if (!hasRole) {
        await logSecurityEvent('AUTH_INSUFFICIENT_PERMISSIONS', req.user._id, req.ipAddress, req.userAgent, {
          requiredRoles: rolesOrPermissions,
          userRole,
          userPermissions
        });
        
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permissions: ${rolesOrPermissions.join(' or ')}`
        });
      }

      // Log successful authorization for admin actions
      if (userRole && userRole.includes('ADMIN')) {
        await logSecurityEvent('AUTH_ADMIN_ACCESS', req.user._id, req.ipAddress, req.userAgent, {
          endpoint: req.originalUrl,
          method: req.method
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization system error.'
      });
    }
  };
};

// Two-factor authentication verification
const verify2FA = async (req, res, next) => {
  try {
    const { twoFactorCode } = req.body;
    const user = req.user;

    if (!user.twoFactorEnabled) {
      return next(); // Skip 2FA if not enabled
    }

    if (!twoFactorCode) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication code is required.',
        requires2FA: true
      });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2 // Allow 2 time steps (60 seconds) of drift
    });

    if (!verified) {
      // Check backup codes
      const backupCode = user.twoFactorBackupCodes.find(
        code => code.code === twoFactorCode.toUpperCase() && !code.used
      );

      if (backupCode) {
        backupCode.used = true;
        await user.save();
        await logSecurityEvent('AUTH_2FA_BACKUP_CODE_USED', user._id, req.ipAddress, req.userAgent);
      } else {
        await logSecurityEvent('AUTH_2FA_FAILED', user._id, req.ipAddress, req.userAgent);
        return res.status(401).json({
          success: false,
          message: 'Invalid two-factor authentication code.'
        });
      }
    }

    await logSecurityEvent('AUTH_2FA_SUCCESS', user._id, req.ipAddress, req.userAgent);
    next();
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: '2FA verification system error.'
    });
  }
};

// CAPTCHA verification middleware
const verifyCaptcha = async (req, res, next) => {
  try {
    const { captchaToken } = req.body;
    
    if (!captchaToken) {
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification is required.'
      });
    }

    // Verify reCAPTCHA with Google
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
    });

    const data = await response.json();

    if (!data.success || data.score < 0.5) {
      await logSecurityEvent('AUTH_CAPTCHA_FAILED', null, req.ip, req.get('User-Agent'), { score: data.score });
      return res.status(400).json({
        success: false,
        message: 'CAPTCHA verification failed. Please try again.'
      });
    }

    next();
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'CAPTCHA verification system error.'
    });
  }
};

// Security event logging
const logSecurityEvent = async (eventType, userId, ipAddress, userAgent, additionalData = {}) => {
  try {
    const auditLog = new AuditLog({
      eventType,
      userId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      additionalData,
      severity: getSeverityLevel(eventType)
    });
    
    await auditLog.save();
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

// Get severity level for different event types
const getSeverityLevel = (eventType) => {
  const severityMap = {
    'AUTH_MISSING_TOKEN': 'LOW',
    'AUTH_INVALID_TOKEN': 'MEDIUM',
    'AUTH_USER_NOT_FOUND': 'MEDIUM',
    'AUTH_INACTIVE_ACCOUNT': 'MEDIUM',
    'AUTH_LOCKED_ACCOUNT': 'HIGH',
    'AUTH_IP_NOT_WHITELISTED': 'HIGH',
    'AUTH_INVALID_SESSION': 'MEDIUM',
    'AUTH_PASSWORD_CHANGED': 'MEDIUM',
    'AUTH_INSUFFICIENT_PERMISSIONS': 'HIGH',
    'AUTH_ADMIN_ACCESS': 'INFO',
    'AUTH_2FA_FAILED': 'HIGH',
    'AUTH_2FA_SUCCESS': 'INFO',
    'AUTH_2FA_BACKUP_CODE_USED': 'MEDIUM',
    'AUTH_CAPTCHA_FAILED': 'MEDIUM',
    'AUTH_SYSTEM_ERROR': 'CRITICAL'
  };
  
  return severityMap[eventType] || 'MEDIUM';
};

module.exports = {
  secureAuth,
  authorize,
  verify2FA,
  verifyCaptcha,
  authLimiter,
  adminAuthLimiter,
  logSecurityEvent
};
