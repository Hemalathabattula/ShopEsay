// MongoDB-Powered Fashion Era Backend - Persistent Data Storage
const http = require('http');
const url = require('url');
const { MongoClient, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
require('dotenv').config();

const PORT = 5001;

console.log('🚀 Starting MongoDB-Powered Fashion Era Backend...');

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/fashion-era';
const DB_NAME = 'fashion-era';

let db = null;
let client = null;

// Email transporter configuration
let transporter = null;
try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    transporter.verify((error, success) => {
      if (error) {
        console.log('⚠️ Email configuration issue:', error.message);
      } else {
        console.log('✅ Email server ready');
      }
    });
  }
} catch (error) {
  console.log('📧 Email setup failed - will show reset links in console');
}

// Connect to MongoDB
const connectMongoDB = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in log
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Test connection
    await db.admin().ping();
    console.log('✅ MongoDB connected successfully!');
    
    // Create indexes for better performance
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('resetTokens').createIndex({ expiry: 1 }, { expireAfterSeconds: 0 });
    console.log('📊 Database indexes created');
    
    // Initialize default users if they don't exist
    await initializeDefaultUsers();
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 Please check your MongoDB URI and ensure the database is accessible');
    return false;
  }
};

// Initialize default users
const initializeDefaultUsers = async () => {
  try {
    const usersCollection = db.collection('users');
    const existingUsers = await usersCollection.countDocuments();
    
    if (existingUsers === 0) {
      console.log('👥 Initializing default users...');
      
      const defaultUsers = [
        {
          name: 'Customer User',
          email: 'customer@example.com',
          password: 'password123',
          role: 'CUSTOMER',
          createdAt: new Date()
        },
        {
          name: 'Seller User',
          email: 'seller@example.com',
          password: 'password123',
          role: 'SELLER',
          createdAt: new Date()
        },
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password123',
          role: 'ADMIN',
          createdAt: new Date()
        },
        {
          name: 'Varshith',
          email: 'varshith@adrasti.com',
          password: 'password123',
          role: 'CUSTOMER',
          createdAt: new Date()
        }
      ];
      
      await usersCollection.insertMany(defaultUsers);
      console.log('✅ Default users created in MongoDB');
    } else {
      console.log(`👥 Found ${existingUsers} existing users in database`);
    }
  } catch (error) {
    console.error('❌ Error initializing default users:', error.message);
  }
};

// Helper functions
const parseBody = (req) => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
  });
};

const sendJSON = (res, data, statusCode = 200) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'http://localhost:5174',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  });
  res.end(JSON.stringify(data));
};

const generateToken = () => 'jwt-token-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetLink = `http://localhost:5174/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  if (!transporter) {
    console.log('🔗 Password reset link (email not configured):');
    console.log(`   Email: ${email}`);
    console.log(`   Link: ${resetLink}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Reset Your FashionVR Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>🛍️ FashionVR</h1>
          <h2>Password Reset Request</h2>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Hello ${userName || 'there'},</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy this link: ${resetLink}</p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⚠️ Important:</strong> This link expires in 1 hour.
          </div>
        </div>
      </div>
    `,
    text: `Reset your FashionVR password: ${resetLink} (expires in 1 hour)`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    console.log('🔗 Fallback - Reset link:', resetLink);
    return true;
  }
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`📡 ${method} ${path}`);

  // Check if database is connected
  if (!db) {
    sendJSON(res, {
      success: false,
      message: 'Database not connected. Please try again later.'
    }, 503);
    return;
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': 'http://localhost:5174',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    });
    res.end();
    return;
  }

  try {
    // Health check
    if (path === '/health' && method === 'GET') {
      const usersCount = await db.collection('users').countDocuments();
      const resetTokensCount = await db.collection('resetTokens').countDocuments();
      
      sendJSON(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'MongoDB-powered Fashion Era Backend is running!',
        database: {
          connected: true,
          name: DB_NAME,
          users: usersCount,
          resetTokens: resetTokensCount
        },
        emailConfigured: !!transporter
      });
      return;
    }

    // Debug endpoint - View all stored data
    if (path === '/api/debug/users' && method === 'GET') {
      const users = await db.collection('users').find({}, { 
        projection: { password: 0 } // Hide passwords
      }).toArray();
      
      const resetTokens = await db.collection('resetTokens').find({}).toArray();
      
      sendJSON(res, {
        success: true,
        data: {
          totalUsers: users.length,
          totalResetTokens: resetTokens.length,
          users: users.map(user => ({
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            storeName: user.storeName || null,
            businessType: user.businessType || null,
            createdAt: user.createdAt
          })),
          resetTokens: resetTokens.map(token => ({
            token: token.token.substring(0, 20) + '...',
            email: token.email,
            expiry: token.expiry,
            used: token.used,
            expired: token.expiry < new Date()
          })),
          storage: {
            type: 'MongoDB Atlas',
            persistent: true,
            location: 'Cloud Database',
            note: 'Data persists across server restarts'
          }
        },
        message: 'MongoDB data storage overview'
      });
      return;
    }

    // Registration endpoint
    if (path === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      console.log('📝 Registration request:', { email: body.email, role: body.role });

      // Validate required fields
      if (!body.email || !body.password || !body.name) {
        sendJSON(res, {
          success: false,
          message: 'Please provide name, email, and password.',
          error: 'MISSING_FIELDS'
        }, 400);
        return;
      }

      // Check if user already exists
      const existingUser = await db.collection('users').findOne({ email: body.email });
      if (existingUser) {
        console.log('❌ Registration failed: User exists -', body.email);
        sendJSON(res, {
          success: false,
          message: 'An account with this email address already exists. Please use a different email or try logging in.',
          error: 'USER_EXISTS',
          data: { email: body.email }
        }, 400);
        return;
      }

      // Create new user
      const newUser = {
        name: body.name,
        email: body.email,
        password: body.password, // In production, hash this!
        role: (body.role || 'CUSTOMER').toUpperCase(),
        storeName: body.storeName || null,
        businessType: body.businessType || null,
        createdAt: new Date()
      };

      // Insert user into MongoDB
      const result = await db.collection('users').insertOne(newUser);
      console.log('✅ User registered in MongoDB:', newUser.email, 'as', newUser.role);

      sendJSON(res, {
        success: true,
        message: 'Registration successful! Please login with your credentials.',
        data: {
          id: result.insertedId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      });
      return;
    }

    // Login endpoint
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      console.log('🔐 Login request:', { email: body.email });

      // Validate required fields
      if (!body.email || !body.password) {
        sendJSON(res, {
          success: false,
          message: 'Please provide email and password.'
        }, 400);
        return;
      }

      // Find user in MongoDB
      const user = await db.collection('users').findOne({ email: body.email });
      
      if (!user || user.password !== body.password) {
        console.log('❌ Login failed: Invalid credentials -', body.email);
        sendJSON(res, {
          success: false,
          message: 'Invalid email or password. Please check your credentials and try again.'
        }, 401);
        return;
      }

      // Generate token
      const token = generateToken();
      const { password, ...userWithoutPassword } = user;

      console.log('✅ Login successful:', user.email, 'as', user.role);

      sendJSON(res, {
        success: true,
        data: {
          user: userWithoutPassword,
          token: token
        },
        message: 'Login successful'
      });
      return;
    }

    // Forgot password endpoint
    if (path === '/api/auth/forgot-password' && method === 'POST') {
      const body = await parseBody(req);
      console.log('🔐 Forgot password request:', { email: body.email });

      if (!body.email) {
        sendJSON(res, {
          success: false,
          message: 'Please provide your email address.'
        }, 400);
        return;
      }

      const user = await db.collection('users').findOne({ email: body.email });

      if (!user) {
        // Don't reveal if email exists for security
        sendJSON(res, {
          success: true,
          message: 'If an account with that email exists, we have sent password reset instructions.'
        });
        return;
      }

      // Generate reset token
      const resetToken = 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const resetExpiry = new Date(Date.now() + (60 * 60 * 1000)); // 1 hour

      // Store reset token in MongoDB
      await db.collection('resetTokens').insertOne({
        token: resetToken,
        email: user.email,
        expiry: resetExpiry,
        used: false,
        createdAt: new Date()
      });

      console.log('📧 Reset token generated for:', user.email);

      // Send reset email
      await sendPasswordResetEmail(user.email, resetToken, user.name);

      sendJSON(res, {
        success: true,
        message: 'Password reset instructions have been sent to your email address.',
        data: { expiresIn: '1 hour' }
      });
      return;
    }

    // Reset password endpoint
    if (path === '/api/auth/reset-password' && method === 'POST') {
      const body = await parseBody(req);
      console.log('🔐 Reset password request:', { email: body.email });

      const { token, email, password } = body;

      if (!token || !email || !password) {
        sendJSON(res, {
          success: false,
          message: 'Missing required fields for password reset.'
        }, 400);
        return;
      }

      // Find and validate token in MongoDB
      const tokenData = await db.collection('resetTokens').findOne({
        token: token,
        email: email,
        used: false,
        expiry: { $gt: new Date() }
      });

      if (!tokenData) {
        sendJSON(res, {
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.'
        }, 400);
        return;
      }

      // Update user password in MongoDB
      const updateResult = await db.collection('users').updateOne(
        { email: email },
        { $set: { password: password, updatedAt: new Date() } }
      );

      if (updateResult.matchedCount === 0) {
        sendJSON(res, {
          success: false,
          message: 'User not found.'
        }, 404);
        return;
      }

      // Mark token as used
      await db.collection('resetTokens').updateOne(
        { token: token },
        { $set: { used: true, usedAt: new Date() } }
      );

      console.log('✅ Password reset successful for:', email);

      sendJSON(res, {
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
      });
      return;
    }

    // Products endpoint (for testing)
    if (path === '/api/products' && method === 'GET') {
      const mockProducts = [
        {
          _id: '1',
          title: 'Classic T-Shirt',
          price: 29.99,
          images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
          category: 'clothing',
          description: 'Comfortable cotton t-shirt'
        },
        {
          _id: '2',
          title: 'Denim Jacket',
          price: 89.99,
          images: ['https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400'],
          category: 'clothing',
          description: 'Stylish denim jacket'
        }
      ];

      sendJSON(res, {
        success: true,
        data: {
          products: mockProducts,
          total: mockProducts.length
        }
      });
      return;
    }

    // Admin error logging endpoint
    if (path === '/api/admin/log-error' && method === 'POST') {
      try {
        const body = await parseBody(req);

        // Log error to database
        await db.collection('adminErrors').insertOne({
          ...body,
          timestamp: new Date(),
          resolved: false
        });

        console.log('🚨 Admin Error Logged:', body.message);

        sendJSON(res, { success: true, message: 'Error logged successfully' });
      } catch (error) {
        console.error('Error logging failed:', error);
        sendJSON(res, { error: 'Failed to log error' }, 500);
      }
      return;
    }

    // Admin error reporting endpoint
    if (path === '/api/admin/report-error' && method === 'POST') {
      try {
        const body = await parseBody(req);

        // Update error report with user description
        await db.collection('adminErrors').updateOne(
          { errorId: body.errorId },
          {
            $set: {
              userDescription: body.userDescription,
              reproductionSteps: body.reproductionSteps,
              reportedAt: new Date()
            }
          }
        );

        console.log('📝 Admin Error Report Updated:', body.errorId);

        sendJSON(res, { success: true, message: 'Error report submitted successfully' });
      } catch (error) {
        console.error('Error reporting failed:', error);
        sendJSON(res, { error: 'Failed to submit error report' }, 500);
      }
      return;
    }

    // 404 - Route not found
    sendJSON(res, {
      success: false,
      message: `Route ${method} ${path} not found`,
      availableRoutes: [
        'GET /health',
        'GET /api/debug/users',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/forgot-password',
        'POST /api/auth/reset-password',
        'GET /api/products',
        'POST /api/admin/log-error',
        'POST /api/admin/report-error'
      ]
    }, 404);

  } catch (error) {
    console.error('❌ Server error:', error);
    sendJSON(res, {
      success: false,
      message: 'Internal server error. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, 500);
  }
});

// Start server
const startServer = async () => {
  const dbConnected = await connectMongoDB();
  
  if (!dbConnected) {
    console.log('❌ Cannot start server without database connection');
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log('\n🎉 MONGODB BACKEND STARTED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log(`🌐 Server URL: http://localhost:${PORT}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/health`);
    console.log(`🔍 Debug Users: http://localhost:${PORT}/api/debug/users`);
    console.log(`🗄️ Database: ${DB_NAME} (MongoDB Atlas)`);
    console.log(`📧 Email: ${transporter ? 'Configured' : 'Console Mode'}`);
    console.log('=' .repeat(60));
    console.log('✅ Ready for Customer & Seller Registration/Login!');
    console.log('💾 All data is now stored persistently in MongoDB');
    console.log('=' .repeat(60));
  });
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  if (client) {
    await client.close();
    console.log('✅ MongoDB connection closed');
  }
  server.close(() => {
    console.log('✅ Server stopped successfully');
    process.exit(0);
  });
});

// Start the server
startServer();
