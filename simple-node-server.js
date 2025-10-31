// Pure Node.js HTTP Server (No Express dependencies)
import { createServer } from 'http';
import { parse } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = 5001;

console.log('🚀 Starting Pure Node.js Server...');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Debug email configuration
console.log('📧 Email configuration check:');
console.log('   EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (length: ' + process.env.EMAIL_PASS.length + ')' : 'Not set');

// Verify email configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error.message);
    console.log('   Full error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Simple in-memory user store
const users = new Map();

// Simple in-memory reset token store
const resetTokens = new Map();

// Function to send password reset email
const sendPasswordResetEmail = async (email, resetToken, userName) => {
  const resetLink = `http://localhost:5174/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Reset Your FashionVR Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ FashionVR</h1>
            <h2>Password Reset Request</h2>
          </div>

          <div class="content">
            <p>Hello ${userName || 'there'},</p>

            <p>We received a request to reset your password for your FashionVR account. If you made this request, click the button below to reset your password:</p>

            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset My Password</a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${resetLink}
            </p>

            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul>
                <li>This link will expire in <strong>1 hour</strong> for your security</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
                <li>FashionVR will never ask for your password via email</li>
              </ul>
            </div>

            <p>If you're having trouble with the button above, you can also visit our website and use the "Forgot Password" feature.</p>

            <p>Best regards,<br>
            The FashionVR Team</p>
          </div>

          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© 2024 FashionVR. All rights reserved.</p>
            <p>If you have any questions, contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${userName || 'there'},

      We received a request to reset your password for your FashionVR account.

      To reset your password, click this link:
      ${resetLink}

      This link will expire in 1 hour for your security.

      If you didn't request this reset, please ignore this email.

      Best regards,
      The FashionVR Team
    `
  };

  try {
    console.log('📧 Sending email to:', email);
    console.log('📧 From:', mailOptions.from);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Full error:', error);
    return false;
  }
};

// Function to send password reset confirmation email
const sendPasswordResetConfirmationEmail = async (email, userName) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: '✅ Your FashionVR Password Has Been Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #00b894; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ Fashion Era</h1>
            <h2>✅ Password Reset Successful</h2>
          </div>

          <div class="content">
            <p>Hello ${userName || 'there'},</p>

            <div class="success">
              <strong>🎉 Great news!</strong> Your FashionVR account password has been successfully reset.
            </div>

            <p>You can now log in to your account using your new password. If you didn't make this change, please contact our support team immediately.</p>

            <div style="text-align: center;">
              <a href="http://localhost:5174/login" class="button">Login to FashionVR</a>
            </div>

            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Keep your password secure and don't share it with anyone</li>
              <li>Use a unique password for your FashionVR account</li>
              <li>Consider using a password manager</li>
              <li>Log out from shared devices</li>
            </ul>

            <p>Thank you for using Fashion Era!</p>

            <p>Best regards,<br>
            The Fashion Era Team</p>
          </div>

          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>© 2024 Fashion Era. All rights reserved.</p>
            <p>If you have any questions, contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${userName || 'there'},

      Your Fashion Era account password has been successfully reset.

      You can now log in using your new password at: http://localhost:5174/login

      If you didn't make this change, please contact our support team immediately.

      Best regards,
      The Fashion Era Team
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Password reset confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send confirmation email:', error);
    return false;
  }
};

// Add some default test users
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

users.set('varshith@adrasti.com', {
  id: '4',
  name: 'Varshith',
  email: 'varshith@adrasti.com',
  password: 'password123',
  role: 'CUSTOMER'
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
    'Access-Control-Allow-Origin': '*', // Allow all origins for development
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  });
  res.end(JSON.stringify(data));
};

// Create server
const server = createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  console.log(`📡 ${method} ${path}`);

  // Debug: Log all auth-related requests
  if (path.startsWith('/api/auth/')) {
    console.log(`🔍 Auth request: ${method} ${path}`);
  }

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*', // Allow all origins for development
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
        message: 'Pure Node.js server is running!',
        port: PORT
      });
      return;
    }

    // Auth - Register
    if (path === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      console.log('📝 Registration:', body);

      // Check if user already exists
      if (users.has(body.email)) {
        console.log('❌ Registration failed: User already exists -', body.email);
        sendJSON(res, {
          success: false,
          message: 'An account with this email address already exists. Please use a different email or try logging in.',
          error: 'USER_EXISTS',
          data: {
            email: body.email
          }
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

      // Store user in memory
      users.set(newUser.email, newUser);

      // Return success without auto-login data
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

      // Find user in our store
      const user = users.get(body.email);

      if (!user || user.password !== body.password) {
        sendJSON(res, {
          success: false,
          message: 'Invalid email or password'
        }, 401);
        return;
      }

      const mockToken = 'jwt-token-' + Date.now();

      // Return user without password
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
      console.log('🔍 Looking up user for email:', body.email);
      console.log('🔍 User found:', user ? 'Yes' : 'No');
      console.log('🔍 Available users:', Array.from(users.keys()));

      if (!user) {
        // Don't reveal if email exists or not for security
        console.log('❌ User not found, sending generic response');
        sendJSON(res, {
          success: true,
          message: 'If an account with that email exists, we have sent password reset instructions.'
        });
        return;
      }

      // Generate reset token
      const resetToken = 'reset_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const resetExpiry = Date.now() + (60 * 60 * 1000); // 1 hour from now

      // Store reset token
      resetTokens.set(resetToken, {
        email: user.email,
        expiry: resetExpiry,
        used: false
      });

      console.log('📧 Reset token generated:', resetToken, 'for email:', user.email);

      // Send password reset email
      console.log('📧 Attempting to send email to:', user.email);
      const emailSent = await sendPasswordResetEmail(user.email, resetToken, user.name);

      if (emailSent) {
        console.log('✅ Password reset email sent successfully to:', user.email);
        sendJSON(res, {
          success: true,
          message: 'Password reset instructions have been sent to your email address. Please check your inbox and spam folder.',
          data: {
            expiresIn: '1 hour',
            // For testing - show reset link in response (remove in production)
            resetLink: `http://localhost:5174/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`
          }
        });
      } else {
        console.log('❌ Failed to send password reset email to:', user.email);
        // Still provide reset link for testing
        console.log('🔗 Reset link for testing:', `http://localhost:5174/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`);
        sendJSON(res, {
          success: false,
          message: 'Failed to send password reset email. Please try again later.',
          data: {
            // For testing - provide reset link even if email fails
            resetLink: `http://localhost:5174/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`
          }
        }, 500);
      }
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

      // Send confirmation email
      await sendPasswordResetConfirmationEmail(user.email, user.name);

      sendJSON(res, {
        success: true,
        message: 'Password has been reset successfully. A confirmation email has been sent to your email address.'
      });
      return;
    }

    // Auth - Get current user
    if (path === '/api/auth/me' && method === 'GET') {
      sendJSON(res, {
        success: true,
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'CUSTOMER'
          }
        }
      });
      return;
    }

    // Products - Get all
    if (path === '/api/products' && method === 'GET') {
      const mockProducts = [
        {
          _id: '1',
          id: '1',
          title: 'Classic T-Shirt',
          name: 'Classic T-Shirt',
          price: 29.99,
          basePrice: 29.99,
          images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
          category: 'clothing',
          description: 'Comfortable cotton t-shirt perfect for everyday wear',
          rating: 4.5,
          ratingCount: 128,
          variants: [
            { size: 'S', color: 'White', stock: 10, price: 29.99 },
            { size: 'M', color: 'White', stock: 15, price: 29.99 },
            { size: 'L', color: 'White', stock: 8, price: 29.99 }
          ]
        },
        {
          _id: '2',
          id: '2',
          title: 'Denim Jeans',
          name: 'Denim Jeans',
          price: 79.99,
          basePrice: 79.99,
          images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
          category: 'clothing',
          description: 'Classic blue denim jeans with perfect fit',
          rating: 4.2,
          ratingCount: 89,
          variants: [
            { size: '30', color: 'Blue', stock: 5, price: 79.99 },
            { size: '32', color: 'Blue', stock: 12, price: 79.99 },
            { size: '34', color: 'Blue', stock: 7, price: 79.99 }
          ]
        },
        {
          _id: '3',
          id: '3',
          title: 'Summer Dress',
          name: 'Summer Dress',
          price: 59.99,
          basePrice: 59.99,
          images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400'],
          category: 'clothing',
          description: 'Light and airy summer dress perfect for warm weather',
          rating: 4.7,
          ratingCount: 203,
          variants: [
            { size: 'S', color: 'Floral', stock: 6, price: 59.99 },
            { size: 'M', color: 'Floral', stock: 9, price: 59.99 },
            { size: 'L', color: 'Floral', stock: 4, price: 59.99 }
          ]
        },
        {
          _id: '4',
          id: '4',
          title: 'Leather Sneakers',
          name: 'Leather Sneakers',
          price: 99.99,
          basePrice: 99.99,
          images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400'],
          category: 'shoes',
          description: 'Premium leather sneakers for style and comfort',
          rating: 4.8,
          ratingCount: 156,
          variants: [
            { size: '8', color: 'White', stock: 12, price: 99.99 },
            { size: '9', color: 'White', stock: 8, price: 99.99 },
            { size: '10', color: 'Black', stock: 15, price: 99.99 }
          ]
        },
        {
          _id: '5',
          id: '5',
          title: 'Designer Handbag',
          name: 'Designer Handbag',
          price: 149.99,
          basePrice: 149.99,
          images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'],
          category: 'bags',
          description: 'Elegant designer handbag for professional and casual use',
          rating: 4.6,
          ratingCount: 94,
          variants: [
            { size: 'One Size', color: 'Brown', stock: 8, price: 149.99 },
            { size: 'One Size', color: 'Black', stock: 12, price: 149.99 }
          ]
        },
        {
          _id: '6',
          id: '6',
          title: 'Wool Sweater',
          name: 'Wool Sweater',
          price: 89.99,
          basePrice: 89.99,
          images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400'],
          category: 'clothing',
          description: 'Cozy wool sweater perfect for cold weather',
          rating: 4.4,
          ratingCount: 167,
          variants: [
            { size: 'S', color: 'Gray', stock: 7, price: 89.99 },
            { size: 'M', color: 'Gray', stock: 11, price: 89.99 },
            { size: 'L', color: 'Navy', stock: 9, price: 89.99 }
          ]
        }
      ];

      console.log(`📦 Returning ${mockProducts.length} products to customer`);

      sendJSON(res, {
        success: true,
        data: {
          products: mockProducts,
          total: mockProducts.length
        }
      });
      return;
    }

    // Products - Get single product
    if (path.startsWith('/api/products/') && method === 'GET') {
      const id = path.split('/')[3];
      
      const mockProduct = {
        _id: id,
        title: `Product ${id}`,
        price: 49.99,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
        category: 'clothing',
        description: 'Amazing product description',
        variants: [
          { size: 'S', color: 'White', stock: 10, price: 49.99 },
          { size: 'M', color: 'White', stock: 15, price: 49.99 }
        ]
      };

      sendJSON(res, {
        success: true,
        data: { product: mockProduct }
      });
      return;
    }

    // Cart
    if (path === '/api/cart' && method === 'GET') {
      sendJSON(res, {
        success: true,
        data: {
          cart: {
            items: [],
            total: 0
          }
        }
      });
      return;
    }

    // Orders
    if (path === '/api/orders' && method === 'GET') {
      sendJSON(res, {
        success: true,
        data: {
          orders: []
        }
      });
      return;
    }

    // Seller Products - Get seller's products
    if (path === '/api/seller/products' && method === 'GET') {
      // Mock seller products
      const sellerProducts = [
        {
          _id: '1',
          title: 'Seller Product 1',
          description: 'A great product from this seller',
          basePrice: 29.99,
          category: 'clothing',
          subcategory: 'T-Shirts',
          material: 'Cotton',
          images: [{ url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', alt: 'Product 1', isPrimary: true }],
          variants: [{ size: 'M', color: 'Blue', stock: 10, price: 29.99 }],
          tags: ['comfortable', 'casual'],
          features: ['Soft fabric', 'Machine washable'],
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ];

      sendJSON(res, {
        success: true,
        data: sellerProducts
      });
      return;
    }

    // Seller Products - Create new product
    if (path === '/api/seller/products' && method === 'POST') {
      const body = await parseBody(req);
      console.log('🏪 Creating seller product:', body);

      // Validate required fields
      const requiredFields = ['title', 'description', 'basePrice', 'category', 'subcategory', 'material', 'variants'];
      const missingFields = requiredFields.filter(field => !body[field]);

      if (missingFields.length > 0) {
        sendJSON(res, {
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        }, 400);
        return;
      }

      if (!body.variants || body.variants.length === 0) {
        sendJSON(res, {
          success: false,
          message: 'At least one variant is required'
        }, 400);
        return;
      }

      // Create mock product
      const newProduct = {
        _id: Date.now().toString(),
        ...body,
        seller: 'mock-seller-id',
        isActive: true,
        ratingAverage: 0,
        ratingCount: 0,
        totalSold: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('✅ Product created successfully:', newProduct.title);

      sendJSON(res, {
        success: true,
        message: 'Product created successfully',
        data: newProduct
      }, 201);
      return;
    }

    // Seller Products - Update product
    if (path.startsWith('/api/seller/products/') && method === 'PUT') {
      const productId = path.split('/').pop();
      const body = await parseBody(req);
      console.log(`🔄 Updating seller product ${productId}:`, body);

      const updatedProduct = {
        _id: productId,
        ...body,
        seller: 'mock-seller-id',
        updatedAt: new Date().toISOString()
      };

      sendJSON(res, {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });
      return;
    }

    // Seller Products - Delete product
    if (path.startsWith('/api/seller/products/') && method === 'DELETE') {
      const productId = path.split('/').pop();
      console.log(`🗑️ Deleting seller product ${productId}`);

      sendJSON(res, {
        success: true,
        message: 'Product deleted successfully'
      });
      return;
    }

    // Wishlist - Get user's wishlist
    if (path === '/api/wishlist' && method === 'GET') {
      sendJSON(res, {
        success: true,
        data: {
          products: []
        }
      });
      return;
    }

    // Wishlist - Add to wishlist
    if (path === '/api/wishlist/add' && method === 'POST') {
      const body = await parseBody(req);
      console.log('❤️ Add to wishlist:', body);

      sendJSON(res, {
        success: true,
        message: 'Product added to wishlist'
      });
      return;
    }

    // Wishlist - Remove from wishlist
    if (path.startsWith('/api/wishlist/remove/') && method === 'DELETE') {
      const productId = path.split('/').pop();
      console.log('💔 Remove from wishlist:', productId);

      sendJSON(res, {
        success: true,
        message: 'Product removed from wishlist'
      });
      return;
    }

    // PayPal payment
    if (path === '/api/payments/paypal/create-order' && method === 'POST') {
      const body = await parseBody(req);
      console.log('💳 PayPal order:', body);

      sendJSON(res, {
        success: true,
        data: {
          orderId: 'PAYPAL-ORDER-' + Date.now(),
          approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-token'
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
        'GET /api/auth/me',
        'POST /api/auth/forgot-password',
        'GET /api/products',
        'GET /api/products/:id',
        'GET /api/seller/products',
        'POST /api/seller/products',
        'PUT /api/seller/products/:id',
        'DELETE /api/seller/products/:id',
        'GET /api/cart',
        'GET /api/orders',
        'GET /api/wishlist',
        'POST /api/wishlist/add',
        'DELETE /api/wishlist/remove/:id',
        'POST /api/payments/paypal/create-order'
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
  console.log('\n🎉 SUCCESS! Fashion Era Server Started!');
  console.log('=' .repeat(60));
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`🛍️ Products: http://localhost:${PORT}/api/products`);
  console.log('=' .repeat(60));
  console.log('✅ No Express dependencies - Pure Node.js!');
  console.log('✅ Ready to accept requests from frontend!');
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is in use. Please stop other servers first.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
