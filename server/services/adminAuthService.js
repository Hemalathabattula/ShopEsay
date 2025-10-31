const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const Admin = require('../models/Admin');
const securityService = require('./securityService');
const { logSecurityEvent } = require('../middleware/secureAuth');

/**
 * Enhanced Admin Authentication Service
 * Provides secure authentication with 2FA, session management, and security monitoring
 */
class AdminAuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.jwtExpiresIn = '8h'; // Shorter sessions for admin security
    this.maxLoginAttempts = 5;
    this.lockoutDuration = 2 * 60 * 60 * 1000; // 2 hours
  }

  /**
   * Authenticate admin with enhanced security
   */
  async authenticateAdmin(adminId, password, twoFactorCode, ipAddress, userAgent) {
    try {
      // Check if IP is blocked
      if (securityService.isIPBlocked(ipAddress)) {
        await logSecurityEvent('AUTH_BLOCKED_IP_ATTEMPT', null, ipAddress, userAgent, { adminId });
        throw new Error('Access denied from this IP address');
      }

      // Find admin
      const admin = await Admin.findOne({ adminId }).select('+password +twoFactorSecret');

      if (!admin) {
        await securityService.monitorSuspiciousActivity(ipAddress, 'ADMIN_NOT_FOUND');
        await logSecurityEvent('AUTH_ADMIN_NOT_FOUND', null, ipAddress, userAgent, { adminId });
        throw new Error('Invalid admin credentials');
      }

      // Check if account is locked
      if (admin.isLocked) {
        await logSecurityEvent('AUTH_LOCKED_ADMIN_ATTEMPT', admin._id, ipAddress, userAgent);
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Check if account is active
      if (!admin.isActive) {
        await logSecurityEvent('AUTH_INACTIVE_ADMIN_ATTEMPT', admin._id, ipAddress, userAgent);
        throw new Error('Admin account is deactivated');
      }

      // Verify password
      const isPasswordValid = await admin.comparePassword(password);
      if (!isPasswordValid) {
        await admin.incLoginAttempts();
        await securityService.monitorSuspiciousActivity(ipAddress, 'INVALID_PASSWORD', admin._id);
        await logSecurityEvent('AUTH_ADMIN_INVALID_PASSWORD', admin._id, ipAddress, userAgent);
        throw new Error('Invalid admin credentials');
      }

      // Check 2FA if enabled
      if (admin.twoFactorEnabled) {
        if (!twoFactorCode) {
          return {
            success: false,
            requires2FA: true,
            adminId: admin.adminId,
            message: 'Two-factor authentication code is required'
          };
        }

        const is2FAValid = await this.verify2FA(admin, twoFactorCode, ipAddress, userAgent);
        if (!is2FAValid) {
          await securityService.monitorSuspiciousActivity(ipAddress, 'INVALID_2FA', admin._id);
          throw new Error('Invalid two-factor authentication code');
        }
      }

      // Reset login attempts on successful authentication
      await admin.resetLoginAttempts();

      // Update last login info
      admin.lastLogin = new Date();
      admin.lastLoginIP = ipAddress;
      await admin.save();

      // Create secure session
      const session = await securityService.createSession(admin, ipAddress, userAgent);

      // Generate JWT token
      const token = this.generateToken(admin, session.sessionId);

      await logSecurityEvent('AUTH_ADMIN_LOGIN_SUCCESS', admin._id, ipAddress, userAgent, {
        sessionId: session.sessionId,
        role: admin.role,
        twoFactorUsed: admin.twoFactorEnabled
      });

      return {
        success: true,
        admin: this.sanitizeAdminData(admin),
        token,
        sessionId: session.sessionId,
        expiresAt: session.expiresAt
      };

    } catch (error) {
      await logSecurityEvent('AUTH_ADMIN_LOGIN_ERROR', null, ipAddress, userAgent, {
        error: error.message,
        adminId
      });
      throw error;
    }
  }

  /**
   * Verify 2FA code
   */
  async verify2FA(admin, twoFactorCode, ipAddress, userAgent) {
    try {
      // Verify TOTP code
      const verified = speakeasy.totp.verify({
        secret: admin.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2 // Allow 2 time steps (60 seconds) of drift
      });

      if (verified) {
        await logSecurityEvent('AUTH_2FA_SUCCESS', admin._id, ipAddress, userAgent);
        return true;
      }

      // Check backup codes
      const backupCode = admin.twoFactorBackupCodes.find(
        code => code.code === twoFactorCode.toUpperCase() && !code.used
      );

      if (backupCode) {
        backupCode.used = true;
        await admin.save();
        await logSecurityEvent('AUTH_2FA_BACKUP_CODE_USED', admin._id, ipAddress, userAgent);
        return true;
      }

      await logSecurityEvent('AUTH_2FA_FAILED', admin._id, ipAddress, userAgent);
      return false;

    } catch (error) {
      await logSecurityEvent('AUTH_2FA_ERROR', admin._id, ipAddress, userAgent, { error: error.message });
      return false;
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(admin, sessionId) {
    const payload = {
      id: admin._id,
      adminId: admin.adminId,
      role: admin.role,
      permissions: admin.permissions,
      sessionId,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
  }

  /**
   * Validate admin token and session
   */
  async validateToken(token, sessionId, ipAddress, userAgent) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Find admin
      const admin = await Admin.findById(decoded.id).select('-password -twoFactorSecret');
      if (!admin || !admin.isActive) {
        await logSecurityEvent('AUTH_TOKEN_INVALID_ADMIN', decoded.id, ipAddress, userAgent);
        return null;
      }

      // Validate session
      const session = await securityService.validateSession(sessionId, ipAddress, userAgent);
      if (!session || session.userId !== admin._id.toString()) {
        await logSecurityEvent('AUTH_TOKEN_INVALID_SESSION', admin._id, ipAddress, userAgent, { sessionId });
        return null;
      }

      // Check if password was changed after token was issued
      if (admin.passwordChangedAt && decoded.iat < admin.passwordChangedAt.getTime() / 1000) {
        await logSecurityEvent('AUTH_TOKEN_PASSWORD_CHANGED', admin._id, ipAddress, userAgent);
        return null;
      }

      return {
        admin: this.sanitizeAdminData(admin),
        session
      };

    } catch (error) {
      await logSecurityEvent('AUTH_TOKEN_VALIDATION_ERROR', null, ipAddress, userAgent, { error: error.message });
      return null;
    }
  }

  /**
   * Logout admin
   */
  async logoutAdmin(sessionId, ipAddress, userAgent) {
    try {
      await securityService.invalidateSession(sessionId, 'logout');
      await logSecurityEvent('AUTH_ADMIN_LOGOUT', null, ipAddress, userAgent, { sessionId });
      return { success: true };
    } catch (error) {
      await logSecurityEvent('AUTH_ADMIN_LOGOUT_ERROR', null, ipAddress, userAgent, { error: error.message });
      throw error;
    }
  }

  /**
   * Setup 2FA for admin
   */
  async setup2FA(adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      if (admin.twoFactorEnabled) {
        throw new Error('2FA is already enabled');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Fashion Era Admin (${admin.adminId})`,
        issuer: 'Fashion Era'
      });

      // Save secret temporarily (will be confirmed when verified)
      admin.twoFactorSecret = secret.base32;
      await admin.save();

      return {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Enable 2FA after verification
   */
  async enable2FA(adminId, twoFactorCode, ipAddress, userAgent) {
    try {
      const admin = await Admin.findById(adminId).select('+twoFactorSecret');
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Verify the code
      const verified = speakeasy.totp.verify({
        secret: admin.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        await logSecurityEvent('AUTH_2FA_ENABLE_FAILED', admin._id, ipAddress, userAgent);
        throw new Error('Invalid 2FA code');
      }

      // Enable 2FA and generate backup codes
      admin.twoFactorEnabled = true;
      const backupCodes = admin.generateBackupCodes();
      await admin.save();

      await logSecurityEvent('AUTH_2FA_ENABLED', admin._id, ipAddress, userAgent);

      return {
        success: true,
        backupCodes
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Disable 2FA
   */
  async disable2FA(adminId, twoFactorCode, ipAddress, userAgent) {
    try {
      const admin = await Admin.findById(adminId).select('+twoFactorSecret');
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Verify current 2FA code before disabling
      const is2FAValid = await this.verify2FA(admin, twoFactorCode, ipAddress, userAgent);
      if (!is2FAValid) {
        throw new Error('Invalid 2FA code');
      }

      // Disable 2FA
      admin.twoFactorEnabled = false;
      admin.twoFactorSecret = undefined;
      admin.twoFactorBackupCodes = [];
      await admin.save();

      await logSecurityEvent('AUTH_2FA_DISABLED', admin._id, ipAddress, userAgent);

      return { success: true };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get admin sessions
   */
  async getAdminSessions(adminId) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      return admin.activeSessions.filter(session => session.isActive);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoke admin session
   */
  async revokeSession(adminId, sessionId, ipAddress, userAgent) {
    try {
      await securityService.invalidateSession(sessionId, 'revoked');
      await logSecurityEvent('AUTH_SESSION_REVOKED', adminId, ipAddress, userAgent, { sessionId });
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Sanitize admin data for client
   */
  sanitizeAdminData(admin) {
    const adminData = admin.toJSON();
    delete adminData.password;
    delete adminData.twoFactorSecret;
    delete adminData.twoFactorBackupCodes;
    delete adminData.activeSessions;
    return adminData;
  }

  /**
   * Get authentication statistics
   */
  getAuthStats() {
    return {
      securityStats: securityService.getSecurityStats(),
      timestamp: new Date()
    };
  }
}

module.exports = new AdminAuthService();
