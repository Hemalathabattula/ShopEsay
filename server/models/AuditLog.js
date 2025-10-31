const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Event identification
  eventType: {
    type: String,
    required: true,
    enum: [
      // Authentication events
      'AUTH_LOGIN_SUCCESS', 'AUTH_LOGIN_FAILED', 'AUTH_LOGOUT', 'AUTH_TOKEN_REFRESH',
      'AUTH_PASSWORD_CHANGE', 'AUTH_PASSWORD_RESET', 'AUTH_2FA_ENABLED', 'AUTH_2FA_DISABLED',
      'AUTH_2FA_SUCCESS', 'AUTH_2FA_FAILED', 'AUTH_2FA_BACKUP_CODE_USED',
      'AUTH_MISSING_TOKEN', 'AUTH_INVALID_TOKEN', 'AUTH_USER_NOT_FOUND',
      'AUTH_INACTIVE_ACCOUNT', 'AUTH_LOCKED_ACCOUNT', 'AUTH_IP_NOT_WHITELISTED',
      'AUTH_INVALID_SESSION', 'AUTH_PASSWORD_CHANGED', 'AUTH_INSUFFICIENT_PERMISSIONS',
      'AUTH_ADMIN_ACCESS', 'AUTH_CAPTCHA_FAILED', 'AUTH_SYSTEM_ERROR',
      
      // Admin actions
      'ADMIN_USER_CREATED', 'ADMIN_USER_UPDATED', 'ADMIN_USER_DELETED', 'ADMIN_USER_ACTIVATED',
      'ADMIN_USER_DEACTIVATED', 'ADMIN_ROLE_CHANGED', 'ADMIN_PERMISSIONS_CHANGED',
      'ADMIN_PRODUCT_CREATED', 'ADMIN_PRODUCT_UPDATED', 'ADMIN_PRODUCT_DELETED',
      'ADMIN_ORDER_UPDATED', 'ADMIN_ORDER_CANCELLED', 'ADMIN_REFUND_PROCESSED',
      'ADMIN_SETTINGS_CHANGED', 'ADMIN_BACKUP_CREATED', 'ADMIN_BACKUP_RESTORED',
      'ADMIN_SYSTEM_MAINTENANCE', 'ADMIN_SECURITY_SETTINGS_CHANGED',
      
      // System events
      'SYSTEM_STARTUP', 'SYSTEM_SHUTDOWN', 'SYSTEM_ERROR', 'SYSTEM_BACKUP',
      'SYSTEM_RESTORE', 'SYSTEM_UPDATE', 'SYSTEM_MAINTENANCE_START', 'SYSTEM_MAINTENANCE_END',
      
      // Security events
      'SECURITY_BREACH_ATTEMPT', 'SECURITY_SUSPICIOUS_ACTIVITY', 'SECURITY_IP_BLOCKED',
      'SECURITY_RATE_LIMIT_EXCEEDED', 'SECURITY_MALICIOUS_REQUEST', 'SECURITY_DATA_EXPORT',
      'SECURITY_ADMIN_PRIVILEGE_ESCALATION', 'SECURITY_UNAUTHORIZED_ACCESS_ATTEMPT',
      
      // Business events
      'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_CANCELLED', 'PAYMENT_PROCESSED',
      'PAYMENT_FAILED', 'REFUND_PROCESSED', 'PRODUCT_CREATED', 'PRODUCT_UPDATED',
      'PRODUCT_DELETED', 'INVENTORY_UPDATED', 'PRICE_CHANGED',
      
      // Data events
      'DATA_EXPORT', 'DATA_IMPORT', 'DATA_DELETION', 'DATA_BACKUP', 'DATA_RESTORE',
      'DATA_MIGRATION', 'DATA_CORRUPTION_DETECTED', 'DATA_INTEGRITY_CHECK'
    ]
  },
  
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel'
  },
  userModel: {
    type: String,
    enum: ['Customer', 'Seller', 'Admin']
  },
  userName: String,
  userRole: String,
  
  // Request information
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  requestId: String,
  sessionId: String,
  
  // Event details
  resource: String, // What was accessed/modified
  resourceId: String, // ID of the resource
  action: String, // What action was performed
  endpoint: String, // API endpoint accessed
  method: String, // HTTP method
  
  // Event metadata
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'INFO'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'ERROR', 'WARNING'],
    default: 'SUCCESS'
  },
  
  // Additional data
  additionalData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Changes tracking (for update operations)
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Error information
  errorMessage: String,
  errorCode: String,
  stackTrace: String,
  
  // Geolocation (if available)
  location: {
    country: String,
    region: String,
    city: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Risk assessment
  riskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  riskFactors: [String],
  
  // Compliance and retention
  retentionPeriod: {
    type: Number, // Days
    default: 2555 // 7 years default
  },
  complianceFlags: [String], // GDPR, HIPAA, SOX, etc.
  
  // Investigation and response
  investigated: {
    type: Boolean,
    default: false
  },
  investigatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  investigationNotes: String,
  investigationDate: Date,
  
  // Alerting
  alertSent: {
    type: Boolean,
    default: false
  },
  alertRecipients: [String],
  alertSentAt: Date,
  
  // Archival
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes for performance
auditLogSchema.index({ eventType: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ ipAddress: 1, timestamp: -1 });
auditLogSchema.index({ severity: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ investigated: 1, severity: 1 });
auditLogSchema.index({ archived: 1, timestamp: -1 });

// TTL index for automatic cleanup based on retention period
auditLogSchema.index({ 
  timestamp: 1 
}, { 
  expireAfterSeconds: 0,
  partialFilterExpression: { archived: true }
});

// Static methods for common queries
auditLogSchema.statics.getSecurityEvents = function(timeframe = 24) {
  const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  return this.find({
    timestamp: { $gte: since },
    severity: { $in: ['HIGH', 'CRITICAL'] },
    eventType: { $regex: /^(AUTH_|SECURITY_)/ }
  }).sort({ timestamp: -1 });
};

auditLogSchema.statics.getAdminActions = function(adminId, timeframe = 24) {
  const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  return this.find({
    userId: adminId,
    timestamp: { $gte: since },
    eventType: { $regex: /^ADMIN_/ }
  }).sort({ timestamp: -1 });
};

auditLogSchema.statics.getFailedLogins = function(timeframe = 1) {
  const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  return this.find({
    eventType: 'AUTH_LOGIN_FAILED',
    timestamp: { $gte: since }
  }).sort({ timestamp: -1 });
};

auditLogSchema.statics.getSuspiciousActivity = function(ipAddress, timeframe = 1) {
  const since = new Date(Date.now() - timeframe * 60 * 60 * 1000);
  return this.find({
    ipAddress,
    timestamp: { $gte: since },
    $or: [
      { severity: { $in: ['HIGH', 'CRITICAL'] } },
      { eventType: { $regex: /^(AUTH_.*_FAILED|SECURITY_)/ } },
      { riskScore: { $gte: 70 } }
    ]
  }).sort({ timestamp: -1 });
};

// Instance methods
auditLogSchema.methods.markInvestigated = function(investigatorId, notes) {
  this.investigated = true;
  this.investigatedBy = investigatorId;
  this.investigationNotes = notes;
  this.investigationDate = new Date();
  return this.save();
};

auditLogSchema.methods.sendAlert = function(recipients) {
  this.alertSent = true;
  this.alertRecipients = recipients;
  this.alertSentAt = new Date();
  return this.save();
};

auditLogSchema.methods.archive = function(archivedBy) {
  this.archived = true;
  this.archivedAt = new Date();
  this.archivedBy = archivedBy;
  return this.save();
};

// Pre-save middleware to calculate risk score
auditLogSchema.pre('save', function(next) {
  if (this.isNew) {
    this.riskScore = this.calculateRiskScore();
  }
  next();
});

// Calculate risk score based on event type and context
auditLogSchema.methods.calculateRiskScore = function() {
  let score = 0;
  const riskFactors = [];
  
  // Base score by event type
  const eventRiskScores = {
    'AUTH_LOGIN_FAILED': 20,
    'AUTH_LOCKED_ACCOUNT': 40,
    'AUTH_IP_NOT_WHITELISTED': 60,
    'AUTH_INSUFFICIENT_PERMISSIONS': 50,
    'AUTH_2FA_FAILED': 30,
    'SECURITY_BREACH_ATTEMPT': 90,
    'SECURITY_SUSPICIOUS_ACTIVITY': 70,
    'SECURITY_UNAUTHORIZED_ACCESS_ATTEMPT': 80,
    'ADMIN_PRIVILEGE_ESCALATION': 95
  };
  
  score += eventRiskScores[this.eventType] || 0;
  
  // Increase score for repeated events from same IP
  if (this.eventType.includes('FAILED') || this.eventType.includes('SECURITY_')) {
    riskFactors.push('REPEATED_FAILURES');
    score += 20;
  }
  
  // Increase score for admin-related events
  if (this.userRole && this.userRole.includes('ADMIN')) {
    riskFactors.push('ADMIN_ACCOUNT');
    score += 15;
  }
  
  // Increase score for high severity events
  if (this.severity === 'CRITICAL') {
    riskFactors.push('CRITICAL_SEVERITY');
    score += 25;
  } else if (this.severity === 'HIGH') {
    riskFactors.push('HIGH_SEVERITY');
    score += 15;
  }
  
  this.riskFactors = riskFactors;
  return Math.min(score, 100); // Cap at 100
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
