const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const adminSchema = new mongoose.Schema({
  adminId: {
    type: String,
    required: [true, 'Admin ID is required'],
    unique: true,
    trim: true,
    minlength: [6, 'Admin ID must be at least 6 characters'],
    maxlength: [20, 'Admin ID cannot exceed 20 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
    validate: {
      validator: function(password) {
        // Strong password: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password);
      },
      message: 'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 special character'
    }
  },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SECURITY_ADMIN'],
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'VIEW_DASHBOARD', 'MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS',
      'MANAGE_FINANCES', 'MANAGE_SETTINGS', 'MANAGE_ADMINS', 'VIEW_ANALYTICS',
      'MANAGE_INVENTORY', 'VIEW_PAYMENTS', 'MANAGE_REFUNDS', 'SECURITY_AUDIT',
      'SYSTEM_MAINTENANCE', 'BACKUP_RESTORE', 'API_ACCESS'
    ]
  }],
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    trim: true
  },
  
  // Security fields
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Two-Factor Authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  twoFactorBackupCodes: [{
    code: String,
    used: { type: Boolean, default: false }
  }],
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  
  // Login tracking
  lastLogin: Date,
  lastLoginIP: String,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Session management
  activeSessions: [{
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  }],
  
  // Security settings
  ipWhitelist: [String],
  requireIPWhitelist: {
    type: Boolean,
    default: false
  },
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes for performance and security
adminSchema.index({ adminId: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ lastLogin: -1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Set permissions based on role
adminSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    this.permissions = this.getPermissionsByRole(this.role);
  }
  next();
});

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get permissions by role
adminSchema.methods.getPermissionsByRole = function(role) {
  const rolePermissions = {
    'SUPER_ADMIN': [
      'VIEW_DASHBOARD', 'MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS',
      'MANAGE_FINANCES', 'MANAGE_SETTINGS', 'MANAGE_ADMINS', 'VIEW_ANALYTICS',
      'MANAGE_INVENTORY', 'VIEW_PAYMENTS', 'MANAGE_REFUNDS', 'SECURITY_AUDIT',
      'SYSTEM_MAINTENANCE', 'BACKUP_RESTORE', 'API_ACCESS'
    ],
    'FINANCE_ADMIN': [
      'VIEW_DASHBOARD', 'MANAGE_FINANCES', 'VIEW_PAYMENTS', 'MANAGE_REFUNDS',
      'VIEW_ANALYTICS'
    ],
    'OPERATIONS_ADMIN': [
      'VIEW_DASHBOARD', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS', 'MANAGE_INVENTORY',
      'VIEW_ANALYTICS'
    ],
    'SECURITY_ADMIN': [
      'VIEW_DASHBOARD', 'SECURITY_AUDIT', 'MANAGE_USERS', 'SYSTEM_MAINTENANCE'
    ]
  };
  
  return rolePermissions[role] || ['VIEW_DASHBOARD'];
};

// Check if admin has permission
adminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Increment login attempts
adminSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Generate 2FA backup codes
adminSchema.methods.generateBackupCodes = function() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push({
      code: crypto.randomBytes(4).toString('hex').toUpperCase(),
      used: false
    });
  }
  this.twoFactorBackupCodes = codes;
  return codes.map(c => c.code);
};

// Add active session
adminSchema.methods.addSession = function(sessionId, ipAddress, userAgent) {
  this.activeSessions.push({
    sessionId,
    ipAddress,
    userAgent,
    createdAt: new Date(),
    lastActivity: new Date(),
    isActive: true
  });
  
  // Keep only last 5 sessions
  if (this.activeSessions.length > 5) {
    this.activeSessions = this.activeSessions.slice(-5);
  }
  
  return this.save();
};

// Remove session
adminSchema.methods.removeSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(s => s.sessionId !== sessionId);
  return this.save();
};

// Update session activity
adminSchema.methods.updateSessionActivity = function(sessionId) {
  const session = this.activeSessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastActivity = new Date();
    return this.save();
  }
};

// Remove password and sensitive data from JSON output
adminSchema.methods.toJSON = function() {
  const adminObject = this.toObject();
  delete adminObject.password;
  delete adminObject.passwordResetToken;
  delete adminObject.passwordResetExpires;
  delete adminObject.emailVerificationToken;
  delete adminObject.twoFactorSecret;
  delete adminObject.twoFactorBackupCodes;
  delete adminObject.activeSessions;
  return adminObject;
};

module.exports = mongoose.model('Admin', adminSchema);
