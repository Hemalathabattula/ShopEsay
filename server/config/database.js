const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    // Try multiple environment variable names and provide fallback
    let mongoURI = process.env.MONGODB_URI ||
                     process.env.MONGO_URI ||
                     'mongodb://localhost:27017/mern-ecommerce';

    // Ensure the database name is included for Atlas connections
    if (mongoURI.includes('mongodb+srv') && mongoURI.includes('/?')) {
        const dbName = 'fashion-era'; // Explicitly set your database name here
        mongoURI = mongoURI.replace('/?', `/${dbName}?`);
        console.log(`🔧 Forcing database name for Atlas connection: ${dbName}`);
    }

    console.log('🔍 Attempting to connect to MongoDB...');
    console.log('🌐 Environment:', process.env.NODE_ENV || 'development');

    const conn = await mongoose.connect(mongoURI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('💡 Tip: Make sure MongoDB is running or check your connection string');
    console.log('🔧 Falling back to mock mode...');

    // Don't exit in development, just warn
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = { connectDB };
