const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function listAdmins() {
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
    console.log('Database name:', mongoose.connection.db.databaseName);

    // List all admins
    const admins = await Admin.find({}).select('adminId name email role isActive');
    
    console.log('\n📋 All Admins in Database:');
    console.log('================================');
    
    if (admins.length === 0) {
      console.log('❌ No admins found in database');
    } else {
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. Admin ID: ${admin.adminId}`);
        console.log(`   Name: ${admin.name}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Active: ${admin.isActive}`);
        console.log('   ---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing admins:', error);
    process.exit(1);
  }
}

listAdmins();
