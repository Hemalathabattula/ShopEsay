// Working MERN E-commerce Server
const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting ShopEasy E-commerce Server...');

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'ShopEasy server is running!',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Registration request:', req.body);
  
  const { name, email, password, role } = req.body;
  
  // Mock successful registration
  const mockUser = {
    id: Date.now().toString(),
    name,
    email,
    role: role || 'CUSTOMER'
  };
  
  const mockToken = 'jwt-token-' + Date.now();
  
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
  console.log('🔐 Login request:', req.body);
  
  const { email, password } = req.body;
  
  // Mock successful login
  const mockUser = {
    id: '1',
    name: email.split('@')[0],
    email,
    role: email.includes('seller') ? 'SELLER' : email.includes('admin') ? 'ADMIN' : 'CUSTOMER'
  };
  
  const mockToken = 'jwt-token-' + Date.now();
  
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

// Products routes
app.get('/api/products', (req, res) => {
  const mockProducts = [
    {
      _id: '1',
      title: 'Classic T-Shirt',
      price: 29.99,
      images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
      category: 'clothing',
      description: 'Comfortable cotton t-shirt',
      variants: [
        { size: 'S', color: 'White', stock: 10, price: 29.99 },
        { size: 'M', color: 'White', stock: 15, price: 29.99 },
        { size: 'L', color: 'White', stock: 8, price: 29.99 }
      ]
    },
    {
      _id: '2',
      title: 'Denim Jeans',
      price: 79.99,
      images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
      category: 'clothing',
      description: 'Classic blue denim jeans',
      variants: [
        { size: '30', color: 'Blue', stock: 5, price: 79.99 },
        { size: '32', color: 'Blue', stock: 12, price: 79.99 },
        { size: '34', color: 'Blue', stock: 7, price: 79.99 }
      ]
    },
    {
      _id: '3',
      title: 'Summer Dress',
      price: 59.99,
      images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400'],
      category: 'clothing',
      description: 'Light and airy summer dress',
      variants: [
        { size: 'S', color: 'Floral', stock: 6, price: 59.99 },
        { size: 'M', color: 'Floral', stock: 9, price: 59.99 },
        { size: 'L', color: 'Floral', stock: 4, price: 59.99 }
      ]
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

app.get('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  // Mock product detail
  const mockProduct = {
    _id: id,
    title: 'Product ' + id,
    price: 49.99,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'],
    category: 'clothing',
    description: 'Amazing product description',
    variants: [
      { size: 'S', color: 'White', stock: 10, price: 49.99 },
      { size: 'M', color: 'White', stock: 15, price: 49.99 }
    ]
  };
  
  res.json({
    success: true,
    data: { product: mockProduct }
  });
});

// Cart routes
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

// Orders routes
app.get('/api/orders', (req, res) => {
  res.json({
    success: true,
    data: {
      orders: []
    }
  });
});

// Payment routes
app.post('/api/payments/paypal/create-order', (req, res) => {
  console.log('💳 PayPal order creation:', req.body);
  
  res.json({
    success: true,
    data: {
      orderId: 'PAYPAL-ORDER-' + Date.now(),
      approvalUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=mock-token'
    }
  });
});

// Catch all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🎉 ShopEasy Server Started Successfully!');
  console.log('=' .repeat(60));
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth Endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`🛍️ Products: http://localhost:${PORT}/api/products`);
  console.log('=' .repeat(60));
  console.log('✅ Ready to accept requests from frontend!');
  console.log('💡 Frontend should run on: http://localhost:3000');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
