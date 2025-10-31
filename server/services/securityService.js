const crypto = require('crypto');
const AuditLog = require('../models/AuditLog');
const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const Seller = require('../models/Seller');

/**
 * Comprehensive Security Service for Fashion Era Platform
 * Handles encryption, session management, threat detection, and security monitoring
 */
class SecurityService {
  constructor() {
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    this.algorithm = 'aes-256-gcm';
    this.suspiciousIPs = new Map(); // IP -> { attempts, lastAttempt, blocked }
    this.activeSessions = new Map(); // sessionId -> session data
    this.securityThresholds = {
      maxLoginAttempts: 5,
      maxRequestsPerMinute: 100,
      suspiciousActivityThreshold: 10,
      sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours for admin
      customerSessionTimeout: 24 * 60 * 60 * 1000 // 24 hours for customers
    };
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('fashion-era-auth'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      
      decipher.setAAD(Buffer.from('fashion-era-auth'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate secure session ID
   */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create secure session
   */
  async createSession(user, ipAddress, userAgent) {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    const sessionData = {
      sessionId,
      userId: user._id.toString(),
      userRole: user.role,
      ipAddress,
      userAgent,
      createdAt: now,
      lastActivity: now,
      isActive: true,
      expiresAt: new Date(now.getTime() + (
        user.role?.includes('ADMIN') 
          ? this.securityThresholds.sessionTimeout 
          : this.securityThresholds.customerSessionTimeout
      ))
    };

    // Store in memory for quick access
    this.activeSessions.set(sessionId, sessionData);

    // Store in database for persistence
    if (user.role?.includes('ADMIN')) {
      await user.addSession(sessionId, ipAddress, userAgent);
    }

    await this.logSecurityEvent('SESSION_CREATED', user._id, ipAddress, userAgent, {
      sessionId,
      userRole: user.role
    });

    return sessionData;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId, ipAddress, userAgent) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      await this.logSecurityEvent('SESSION_NOT_FOUND', null, ipAddress, userAgent, { sessionId });
      return null;
    }

    if (!session.isActive) {
      await this.logSecurityEvent('SESSION_INACTIVE', session.userId, ipAddress, userAgent, { sessionId });
      return null;
    }

    if (new Date() > session.expiresAt) {
      await this.invalidateSession(sessionId, 'expired');
      return null;
    }

    // Check for session hijacking
    if (session.ipAddress !== ipAddress) {
      await this.logSecurityEvent('SESSION_IP_MISMATCH', session.userId, ipAddress, userAgent, {
        sessionId,
        originalIP: session.ipAddress,
        currentIP: ipAddress
      });
      
      // For admin sessions, be strict about IP changes
      if (session.userRole?.includes('ADMIN')) {
        await this.invalidateSession(sessionId, 'ip_mismatch');
        return null;
      }
    }

    // Update last activity
    session.lastActivity = new Date();
    this.activeSessions.set(sessionId, session);

    return session;
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId, reason = 'manual') {
    const session = this.activeSessions.get(sessionId);
    
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);

      await this.logSecurityEvent('SESSION_INVALIDATED', session.userId, session.ipAddress, session.userAgent, {
        sessionId,
        reason
      });

      // Remove from database if admin session
      if (session.userRole?.includes('ADMIN')) {
        const admin = await Admin.findById(session.userId);
        if (admin) {
          await admin.removeSession(sessionId);
        }
      }
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions() {
    const now = new Date();
    const expiredSessions = [];

    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      await this.invalidateSession(sessionId, 'expired');
    }

    console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
  }

  /**
   * Monitor suspicious activity
   */
  async monitorSuspiciousActivity(ipAddress, eventType, userId = null) {
    const now = new Date();
    const suspicious = this.suspiciousIPs.get(ipAddress) || {
      attempts: 0,
      lastAttempt: now,
      blocked: false,
      events: []
    };

    suspicious.attempts++;
    suspicious.lastAttempt = now;
    suspicious.events.push({ eventType, timestamp: now, userId });

    // Keep only last 50 events
    if (suspicious.events.length > 50) {
      suspicious.events = suspicious.events.slice(-50);
    }

    this.suspiciousIPs.set(ipAddress, suspicious);

    // Check for suspicious patterns
    const recentEvents = suspicious.events.filter(
      event => now - event.timestamp < 60 * 60 * 1000 // Last hour
    );

    if (recentEvents.length >= this.securityThresholds.suspiciousActivityThreshold) {
      await this.handleSuspiciousActivity(ipAddress, suspicious, userId);
    }

    return suspicious;
  }

  /**
   * Handle suspicious activity
   */
  async handleSuspiciousActivity(ipAddress, suspicious, userId) {
    if (!suspicious.blocked) {
      suspicious.blocked = true;
      suspicious.blockedAt = new Date();
      this.suspiciousIPs.set(ipAddress, suspicious);

      await this.logSecurityEvent('SECURITY_IP_BLOCKED', userId, ipAddress, null, {
        attempts: suspicious.attempts,
        events: suspicious.events.slice(-10) // Last 10 events
      });

      // Notify admins
      await this.notifyAdminsSecurityAlert({
        type: 'IP_BLOCKED',
        ipAddress,
        attempts: suspicious.attempts,
        severity: 'HIGH'
      });
    }
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress) {
    const suspicious = this.suspiciousIPs.get(ipAddress);
    return suspicious?.blocked || false;
  }

  /**
   * Unblock IP address
   */
  async unblockIP(ipAddress, adminId) {
    const suspicious = this.suspiciousIPs.get(ipAddress);
    if (suspicious) {
      suspicious.blocked = false;
      suspicious.unblockedAt = new Date();
      suspicious.unblockedBy = adminId;
      this.suspiciousIPs.set(ipAddress, suspicious);

      await this.logSecurityEvent('SECURITY_IP_UNBLOCKED', adminId, ipAddress, null, {
        unblockedBy: adminId
      });
    }
  }

  /**
   * Get security statistics
   */
  getSecurityStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let blockedIPs = 0;
    let recentSuspiciousActivity = 0;
    let totalAttempts = 0;

    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (data.blocked) blockedIPs++;
      totalAttempts += data.attempts;
      
      const recentEvents = data.events.filter(event => event.timestamp > oneHourAgo);
      recentSuspiciousActivity += recentEvents.length;
    }

    return {
      activeSessions: this.activeSessions.size,
      blockedIPs,
      recentSuspiciousActivity,
      totalAttempts,
      monitoredIPs: this.suspiciousIPs.size,
      timestamp: now
    };
  }

  /**
   * Log security event
   */
  async logSecurityEvent(eventType, userId, ipAddress, userAgent, additionalData = {}) {
    try {
      const auditLog = new AuditLog({
        eventType,
        userId,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        additionalData,
        severity: this.getSeverityLevel(eventType)
      });
      
      await auditLog.save();
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get severity level for event types
   */
  getSeverityLevel(eventType) {
    const severityMap = {
      'SESSION_CREATED': 'INFO',
      'SESSION_INVALIDATED': 'INFO',
      'SESSION_NOT_FOUND': 'MEDIUM',
      'SESSION_INACTIVE': 'MEDIUM',
      'SESSION_IP_MISMATCH': 'HIGH',
      'SECURITY_IP_BLOCKED': 'HIGH',
      'SECURITY_IP_UNBLOCKED': 'MEDIUM',
      'SECURITY_BREACH_ATTEMPT': 'CRITICAL',
      'SECURITY_SUSPICIOUS_ACTIVITY': 'HIGH'
    };
    
    return severityMap[eventType] || 'MEDIUM';
  }

  /**
   * Notify admins of security alerts
   */
  async notifyAdminsSecurityAlert(alertData) {
    // This would integrate with your notification system
    console.log('🚨 Security Alert:', alertData);
    
    // You could send emails, push notifications, etc.
    // For now, we'll just log it
  }

  /**
   * Start security monitoring
   */
  startMonitoring() {
    // Clean up expired sessions every 15 minutes
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 15 * 60 * 1000);

    // Generate security reports every hour
    setInterval(() => {
      this.generateSecurityReport();
    }, 60 * 60 * 1000);

    console.log('🔒 Security monitoring started');
  }

  /**
   * Generate security report
   */
  async generateSecurityReport() {
    const stats = this.getSecurityStats();
    
    await this.logSecurityEvent('SECURITY_REPORT_GENERATED', null, 'system', 'security-service', {
      stats
    });

    // If there are concerning metrics, alert admins
    if (stats.blockedIPs > 10 || stats.recentSuspiciousActivity > 50) {
      await this.notifyAdminsSecurityAlert({
        type: 'HIGH_SECURITY_ACTIVITY',
        stats,
        severity: 'HIGH'
      });
    }
  }
}

module.exports = new SecurityService();
