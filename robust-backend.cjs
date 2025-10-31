// Robust Fashion Era Backend - Works seamlessly for all auth flows
const http = require('http');
const url = require('url');
const nodemailer = require('nodemailer');
require('dotenv').config();

const PORT = 5001;

console.log('🚀 Starting Robust Fashion Era Backend...');

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
        console.log('📧 Email functionality disabled - will show reset links in console');
      } else {
        console.log('✅ Email server ready');
      }
    });
  } else {
    console.log('📧 Email not configured - will show reset links in console');
  }
} catch (error) {
  console.log('📧 Email setup failed - will show reset links in console');
}

// In-memory data stores
const users = new Map();
const resetTokens = new Map();

// Initialize default users for testing
const defaultUsers = [
  {
    id: '1',
    name: 'Customer User',
    email: 'customer@example.com',
    password: 'password123',
    role: 'CUSTOMER'
  },
  {
    id: '2',
    name: 'Seller User',
    email: 'seller@example.com',
    password: 'password123',
    role: 'SELLER'
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'ADMIN'
  },
  {
    id: '4',
    name: 'Varshith',
    email: 'varshith@adrasti.com',
    password: 'password123',
    role: 'CUSTOMER'
  }
];

// Add default users to the system
defaultUsers.forEach(user => {
  users.set(user.email, user);
});

console.log('👥 Default users initialized:', Array.from(users.keys()));

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
    subject: '🔐 Reset Your Fashion Era Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1>🛍️ Fashion Era</h1>
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
    text: `Reset your Fashion Era password: ${resetLink} (expires in 1 hour)`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    console.log('🔗 Fallback - Reset link:', resetLink);
    return true; // Still return true to continue the flow
  }
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`📡 ${method} ${path}`);

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
      sendJSON(res, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Fashion Era Backend is running smoothly!',
        users: Array.from(users.keys()),
        emailConfigured: !!transporter
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
      if (users.has(body.email)) {
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
        id: Date.now().toString(),
        name: body.name,
        email: body.email,
        password: body.password,
        role: (body.role || 'CUSTOMER').toUpperCase(),
        storeName: body.storeName || null,
        businessType: body.businessType || null,
        createdAt: new Date().toISOString()
      };

      // Store user
      users.set(newUser.email, newUser);
      console.log('✅ User registered successfully:', newUser.email, 'as', newUser.role);

      sendJSON(res, {
        success: true,
        message: 'Registration successful! Please login with your credentials.',
        data: {
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

      // Find user
      const user = users.get(body.email);
      
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

      const user = users.get(body.email);
      
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
      const resetExpiry = Date.now() + (60 * 60 * 1000); // 1 hour

      // Store reset token
      resetTokens.set(resetToken, {
        email: user.email,
        expiry: resetExpiry,
        used: false
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

      // Validate token
      const tokenData = resetTokens.get(token);
      
      if (!tokenData || tokenData.used || tokenData.expiry < Date.now() || tokenData.email !== email) {
        sendJSON(res, {
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.'
        }, 400);
        return;
      }

      // Find user
      const user = users.get(email);
      if (!user) {
        sendJSON(res, {
          success: false,
          message: 'User not found.'
        }, 404);
        return;
      }

      // Update password
      user.password = password;
      users.set(email, user);

      // Mark token as used
      tokenData.used = true;
      resetTokens.set(token, tokenData);

      console.log('✅ Password reset successful for:', email);

      sendJSON(res, {
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
      });
      return;
    }

    // Debug endpoint - View all stored data
    if (path === '/api/debug/users' && method === 'GET') {
      const userList = Array.from(users.entries()).map(([email, user]) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        storeName: user.storeName || null,
        businessType: user.businessType || null,
        createdAt: user.createdAt || 'Default User',
        // password hidden for security
      }));

      const tokenList = Array.from(resetTokens.entries()).map(([token, data]) => ({
        token: token.substring(0, 20) + '...', // Show partial token
        email: data.email,
        expiry: new Date(data.expiry).toISOString(),
        used: data.used,
        expired: data.expiry < Date.now()
      }));

      sendJSON(res, {
        success: true,
        data: {
          totalUsers: users.size,
          totalResetTokens: resetTokens.size,
          users: userList,
          resetTokens: tokenList,
          storage: {
            type: 'In-Memory (JavaScript Map)',
            persistent: false,
            location: 'Server RAM',
            note: 'Data is lost when server restarts'
          }
        },
        message: 'Current data storage overview'
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

    // 404 - Route not found
    sendJSON(res, {
      success: false,
      message: `Route ${method} ${path} not found`,
      availableRoutes: [
        'GET /health',
        'POST /api/auth/register',
        'POST /api/auth/login',
        'POST /api/auth/forgot-password',
        'POST /api/auth/reset-password',
        'GET /api/products'
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
server.listen(PORT, () => {
  console.log('\n🎉 ROBUST BACKEND STARTED SUCCESSFULLY!');
  console.log('=' .repeat(60));
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`📧 Email: ${transporter ? 'Configured' : 'Console Mode'}`);
  console.log('=' .repeat(60));
  console.log('✅ Ready for Customer & Seller Registration/Login!');
  console.log('👥 Available test users:');
  defaultUsers.forEach(user => {
    console.log(`   ${user.role}: ${user.email} / password123`);
  });
  console.log('=' .repeat(60));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server stopped successfully');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = server;
