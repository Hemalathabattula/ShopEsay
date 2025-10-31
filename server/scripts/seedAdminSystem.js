const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

/**
 * Seed script to initialize the secure admin system
 * Creates default admin accounts and sets up initial security configuration
 */

const defaultAdmins = [
  {
    adminId: 'superadmin',
    name: 'Super Administrator',
    email: 'superadmin@fashionera.com',
    password: 'SuperAdmin123!',
    role: 'SUPER_ADMIN',
    isActive: true,
    isEmailVerified: true,
    phone: '+1-555-0001'
  },
  {
    adminId: 'finance-admin',
    name: 'Finance Administrator',
    email: 'finance@fashionera.com',
    password: 'FinanceAdmin123!',
    role: 'FINANCE_ADMIN',
    isActive: true,
    isEmailVerified: true,
    phone: '+1-555-0002'
  },
  {
    adminId: 'operations-admin',
    name: 'Operations Administrator',
    email: 'operations@fashionera.com',
    password: 'OpsAdmin123!',
    role: 'OPERATIONS_ADMIN',
    isActive: true,
    isEmailVerified: true,
    phone: '+1-555-0003'
  },
  {
    adminId: 'security-admin',
    name: 'Security Administrator',
    email: 'security@fashionera.com',
    password: 'SecurityAdmin123!',
    role: 'SECURITY_ADMIN',
    isActive: true,
    isEmailVerified: true,
    phone: '+1-555-0004'
  }
];

async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fashion-era';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createDefaultAdmins() {
  console.log('🔧 Creating default admin accounts...');
  
  for (const adminData of defaultAdmins) {
    try {
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ 
        $or: [
          { adminId: adminData.adminId },
          { email: adminData.email }
        ]
      });

      if (existingAdmin) {
        console.log(`⚠️  Admin ${adminData.adminId} already exists, skipping...`);
        continue;
      }

      // Create new admin
      const admin = new Admin(adminData);
      await admin.save();

      console.log(`✅ Created admin: ${adminData.adminId} (${adminData.role})`);
      
      // Log admin creation
      const auditLog = new AuditLog({
        eventType: 'ADMIN_USER_CREATED',
        userId: admin._id,
        userModel: 'Admin',
        userName: admin.name,
        userRole: admin.role,
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Seed Script',
        resource: 'Admin',
        resourceId: admin._id.toString(),
        action: 'CREATE',
        timestamp: new Date(),
        severity: 'INFO',
        status: 'SUCCESS',
        additionalData: {
          createdBy: 'system',
          seedScript: true,
          role: admin.role,
          permissions: admin.permissions
        }
      });
      
      await auditLog.save();

    } catch (error) {
      console.error(`❌ Error creating admin ${adminData.adminId}:`, error.message);
    }
  }
}

async function createInitialAuditLog() {
  console.log('📝 Creating initial audit log entry...');
  
  try {
    const systemLog = new AuditLog({
      eventType: 'SYSTEM_STARTUP',
      ipAddress: '127.0.0.1',
      userAgent: 'Admin Seed Script',
      resource: 'System',
      action: 'INITIALIZE',
      timestamp: new Date(),
      severity: 'INFO',
      status: 'SUCCESS',
      additionalData: {
        event: 'Admin system initialization',
        seedScript: true,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      }
    });
    
    await systemLog.save();
    console.log('✅ Initial audit log created');
  } catch (error) {
    console.error('❌ Error creating initial audit log:', error.message);
  }
}

async function displayAdminCredentials() {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 FASHION ERA ADMIN SYSTEM - DEFAULT CREDENTIALS');
  console.log('='.repeat(80));
  console.log('⚠️  IMPORTANT: Change these passwords immediately in production!');
  console.log('');
  
  for (const admin of defaultAdmins) {
    console.log(`👤 ${admin.role}:`);
    console.log(`   Admin ID: ${admin.adminId}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${admin.password}`);
    console.log(`   Name: ${admin.name}`);
    console.log('');
  }
  
  console.log('🌐 Admin Login URL: http://localhost:5175/admin-login');
  console.log('📊 Admin Dashboard: http://localhost:5175/admin-dashboard');
  console.log('');
  console.log('🔒 Security Features:');
  console.log('   • Role-based access control (RBAC)');
  console.log('   • Two-factor authentication (2FA) support');
  console.log('   • Session management');
  console.log('   • Comprehensive audit logging');
  console.log('   • Real-time security monitoring');
  console.log('   • Rate limiting and CAPTCHA protection');
  console.log('');
  console.log('📋 Admin Roles & Permissions:');
  console.log('   • SUPER_ADMIN: Full system access');
  console.log('   • FINANCE_ADMIN: Financial data and reports');
  console.log('   • OPERATIONS_ADMIN: Products, orders, inventory');
  console.log('   • SECURITY_ADMIN: Security audit and user management');
  console.log('');
  console.log('='.repeat(80));
}

async function verifyAdminSystem() {
  console.log('🔍 Verifying admin system setup...');
  
  try {
    const adminCount = await Admin.countDocuments();
    const auditLogCount = await AuditLog.countDocuments();
    
    console.log(`✅ Admin accounts created: ${adminCount}`);
    console.log(`✅ Audit log entries: ${auditLogCount}`);
    
    // Test admin permissions
    const superAdmin = await Admin.findOne({ role: 'SUPER_ADMIN' });
    if (superAdmin && superAdmin.permissions.length > 0) {
      console.log(`✅ Super admin permissions: ${superAdmin.permissions.length} permissions`);
    }
    
    console.log('✅ Admin system verification complete');
    
  } catch (error) {
    console.error('❌ Admin system verification failed:', error.message);
  }
}

async function seedAdminSystem() {
  console.log('🚀 Starting Fashion Era Admin System Seed...');
  console.log('');
  
  try {
    await connectDatabase();
    await createDefaultAdmins();
    await createInitialAuditLog();
    await verifyAdminSystem();
    await displayAdminCredentials();
    
    console.log('🎉 Admin system seed completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Visit: http://localhost:5175/admin-login');
    console.log('3. Login with any of the admin credentials above');
    console.log('4. Enable 2FA for enhanced security');
    console.log('5. Change default passwords');
    console.log('');
    
  } catch (error) {
    console.error('❌ Admin system seed failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Handle command line execution
if (require.main === module) {
  seedAdminSystem().catch(console.error);
}

module.exports = {
  seedAdminSystem,
  createDefaultAdmins,
  defaultAdmins
};
