// Simple standalone server that uses the main node_modules
console.log('🔧 Loading dependencies...');

try {
  const express = require('express');
  console.log('✅ Express loaded');

  const cors = require('cors');
  console.log('✅ CORS loaded');

  const path = require('path');
  console.log('✅ Path loaded');

  require('dotenv').config();
  console.log('✅ Dotenv loaded');
} catch (error) {
  console.error('❌ Error loading dependencies:', error.message);
  process.exit(1);
}

console.log('🚀 Creating Express app...');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
console.log('✅ Express app created');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Mock API endpoints for testing
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Mock auth endpoints
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Mock successful registration
  const mockUser = {
    id: Date.now().toString(),
    name,
    email,
    role: role || 'CUSTOMER'
  };
  
  const mockToken = 'mock-jwt-token-' + Date.now();
  
  res.json({
    success: true,
    data: {
      user: mockUser,
      token: mockToken
    },
    message: 'Registration successful'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Mock successful login
  const mockUser = {
    id: '1',
    name: email.split('@')[0],
    email,
    role: email.includes('seller') ? 'SELLER' : email.includes('admin') ? 'ADMIN' : 'CUSTOMER'
  };
  
  const mockToken = 'mock-jwt-token-' + Date.now();
  
  res.json({
    success: true,
    data: {
      user: mockUser,
      token: mockToken
    },
    message: 'Login successful'
  });
});

app.get('/api/auth/me', (req, res) => {
  // Mock current user
  res.json({
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
});

// Mock products endpoint
app.get('/api/products', (req, res) => {
  const mockProducts = [
    {
      id: '1',
      title: 'Classic T-Shirt',
      price: 29.99,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      category: 'clothing',
      description: 'Comfortable cotton t-shirt'
    },
    {
      id: '2',
      title: 'Denim Jeans',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
      category: 'clothing',
      description: 'Classic blue denim jeans'
    },
    {
      id: '3',
      title: 'Summer Dress',
      price: 59.99,
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
      category: 'clothing',
      description: 'Light and airy summer dress'
    }
  ];
  
  res.json({
    success: true,
    data: {
      products: mockProducts,
      total: mockProducts.length
    }
  });
});

// Mock cart endpoints
app.get('/api/cart', (req, res) => {
  res.json({
    success: true,
    data: {
      cart: {
        items: [],
        total: 0
      }
    }
  });
});

// Mock orders endpoints
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      orders: []
    }
  });
});

app.get('/api/orders/seller', (req, res) => {
  res.json({
    success: true,
    data: {
      orders: []
    }
  });
});

// Mock payment endpoints
app.post('/api/payments/paypal/create-order', (req, res) => {
  res.json({
    success: true,
    data: {
      orderId: 'MOCK-ORDER-' + Date.now(),
      approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-token'
    }
  });
});

// Mock forgot password
app.post('/api/auth/forgot-password', (req, res) => {
  res.json({
    success: true,
    message: 'Password reset email sent (mock)'
  });
});

// Serve static files from the dist directory if it exists
const distPath = path.join(__dirname, 'dist');
try {
  app.use(express.static(distPath));
  
  // Catch all handler for SPA
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
} catch (error) {
  console.log('No dist folder found, serving API only');
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 FashionVR Backend Server Started!');
  console.log('=' .repeat(50));
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('=' .repeat(50));
  console.log('✅ Server is ready to accept connections!');
  console.log('💡 Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  process.exit(0);
});
