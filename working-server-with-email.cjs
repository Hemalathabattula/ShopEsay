// Working server with email functionality (CommonJS)
const http = require('http');
const url = require('url');
const nodemailer = require('nodemailer');
require('dotenv').config();

const PORT = 5001;

console.log('🚀 Starting FashionVR Server with Email...');

// Email transporter configuration
let transporter = null;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  // Verify email configuration
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email configuration error:', error.message);
      console.log('📧 Email functionality disabled');
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
} catch (error) {
  console.log('❌ Email setup failed:', error.message);
  console.log('📧 Email functionality disabled');
}

// Simple in-memory user store
const users = new Map();
const resetTokens = new Map();

// Add default test users
users.set('customer@example.com', {
  id: '1',
  name: 'Customer User',
  email: 'customer@example.com',
  password: 'password123',
  role: 'CUSTOMER'
});

users.set('seller@example.com', {
  id: '2',
  name: 'Seller User',
  email: 'seller@example.com',
  password: 'password123',
  role: 'SELLER'
});

users.set('admin@example.com', {
  id: '3',
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'password123',
  role: 'ADMIN'
});

// Helper function to parse JSON body
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

// Helper function to send JSON response
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

// Function to send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  if (!transporter) {
    console.log('📧 Email not configured, showing reset link in console:');
    const resetLink = `http://localhost:5174/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    console.log('🔗 Reset Link:', resetLink);
    return true; // Return true to continue the flow
  }

  const resetLink = `http://localhost:5174/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Reset Your FashionVR Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1>🛍️ FashionVR</h1>
          <h2>Password Reset Request</h2>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Hello ${userName || 'there'},</p>
          
          <p>We received a request to reset your password for your FashionVR account. Click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset My Password</a>
          </div>
          
          <p>Or copy and paste this link: ${resetLink}</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>⚠️ Important:</strong>
            <ul>
              <li>This link will expire in 1 hour</li>
              <li>If you didn't request this, ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <p>Best regards,<br>The FashionVR Team</p>
        </div>
      </div>
    `,
    text: `
      Hello ${userName || 'there'},
      
      Reset your FashionVR password: ${resetLink}
      
      This link expires in 1 hour.
      
      Best regards,
      The FashionVR Team
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Password reset email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    // Show link in console as fallback
    console.log('🔗 Reset Link (email failed):', resetLink);
    return true; // Still return true to continue the flow
  }
};

// Create server
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
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'FashionVR server with email is running!',
        port: PORT,
        emailConfigured: !!transporter
      });
      return;
    }

    // Auth - Register
    if (path === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      console.log('📝 Registration:', body);

      if (users.has(body.email)) {
        sendJSON(res, {
          success: false,
          message: 'User already exists with this email'
        }, 400);
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        name: body.name || 'Test User',
        email: body.email || 'test@example.com',
        password: body.password || 'password123',
        role: (body.role || 'CUSTOMER').toUpperCase()
      };

      users.set(newUser.email, newUser);

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

    // Auth - Login
    if (path === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      console.log('🔐 Login:', body);

      const user = users.get(body.email);
      
      if (!user || user.password !== body.password) {
        sendJSON(res, {
          success: false,
          message: 'Invalid email or password'
        }, 401);
        return;
      }

      const mockToken = 'jwt-token-' + Date.now();
      const { password, ...userWithoutPassword } = user;

      sendJSON(res, {
        success: true,
        data: {
          user: userWithoutPassword,
          token: mockToken
        },
        message: 'Login successful'
      });
      return;
    }

    // Auth - Forgot Password
    if (path === '/api/auth/forgot-password' && method === 'POST') {
      const body = await parseBody(req);
      console.log('🔐 Forgot password request:', body);

      const user = users.get(body.email);
      
      if (!user) {
        // Don't reveal if email exists
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

      console.log('📧 Reset token generated:', resetToken, 'for email:', user.email);

      // Send password reset email
      const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.name);
      
      sendJSON(res, {
        success: true,
        message: 'Password reset instructions have been sent to your email address. Please check your inbox and spam folder.',
        data: {
          expiresIn: '1 hour'
        }
      });
      return;
    }

    // Auth - Reset Password
    if (path === '/api/auth/reset-password' && method === 'POST') {
      const body = await parseBody(req);
      console.log('🔐 Reset password request:', body);

      const { token, email, password } = body;

      // Validate token
      const tokenData = resetTokens.get(token);
      
      if (!tokenData || tokenData.used || tokenData.expiry < Date.now() || tokenData.email !== email) {
        sendJSON(res, {
          success: false,
          message: 'Invalid or expired reset token'
        }, 400);
        return;
      }

      // Find user
      const user = users.get(email);
      if (!user) {
        sendJSON(res, {
          success: false,
          message: 'User not found'
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
        message: 'Password has been reset successfully.'
      });
      return;
    }

    // Products
    if (path === '/api/products' && method === 'GET') {
      const mockProducts = [
        {
          _id: '1',
          title: 'Classic T-Shirt',
          price: 29.99,
          images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
          category: 'clothing',
          description: 'Comfortable cotton t-shirt'
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
      message: `Route ${path} not found`,
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
      message: 'Internal server error'
    }, 500);
  }
});

// Start server
server.listen(PORT, () => {
  console.log('\n🎉 SUCCESS! FashionVR Server Started!');
  console.log('=' .repeat(60));
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`📧 Email: ${transporter ? 'Configured' : 'Disabled (console fallback)'}`);
  console.log('=' .repeat(60));
  console.log('✅ Ready to accept requests from frontend!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
