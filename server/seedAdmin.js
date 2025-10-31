const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function seedAdmin() {
  try {
    // Connect to MongoDB with explicit database name
    let mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

    // Ensure the database name is included for Atlas connections
    if (mongoURI && mongoURI.includes('mongodb+srv') && mongoURI.includes('/?')) {
        const dbName = 'fashion-era'; // Use same database as server
        mongoURI = mongoURI.replace('/?', `/${dbName}?`);
        console.log(`🔧 Forcing database name for Atlas connection: ${dbName}`);
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    // Check if admin already exists and delete it to recreate with correct permissions
    const existingAdmin = await Admin.findOne({ adminId: 'admin001' });
    if (existingAdmin) {
      console.log('🔄 Deleting existing admin to recreate with correct permissions');
      await Admin.deleteOne({ adminId: 'admin001' });
    }

    // Create admin user
    const adminData = {
      adminId: 'admin001',
      name: 'Super Admin',
      email: 'admin001@admin.platform.com',
      password: 'Admin123!', // This will be hashed by the pre-save middleware
      role: 'SUPER_ADMIN',
      permissions: [
        'VIEW_DASHBOARD', 'MANAGE_USERS', 'MANAGE_PRODUCTS', 'MANAGE_ORDERS',
        'MANAGE_FINANCES', 'MANAGE_SETTINGS', 'MANAGE_ADMINS', 'VIEW_ANALYTICS',
        'MANAGE_INVENTORY', 'VIEW_PAYMENTS', 'MANAGE_REFUNDS', 'SECURITY_AUDIT',
        'SYSTEM_MAINTENANCE', 'BACKUP_RESTORE', 'API_ACCESS'
      ],
      isActive: true,
      isEmailVerified: true
    };

    const admin = new Admin(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🆔 Admin ID:', adminData.adminId);
    console.log('🔑 Password: Admin123!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

seedAdmin();
