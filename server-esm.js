// ES Module server for Fashion Era E-commerce
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5001;

console.log('🚀 Starting Fashion Era Server (ES Module) on port 5001...');

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  console.log('📊 Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Fashion Era server is running on port 5001!',
    port: PORT,
    moduleType: 'ES Module'
  });
});

// Auth routes
app.post('/api/auth/register', (req, res) => {
  console.log('📝 Registration request received:', req.body);
  
  const { name, email, password, role } = req.body;
  
  // Mock successful registration
  const mockUser = {
    id: Date.now().toString(),
    name: name || 'Test User',
    email: email || 'test@example.com',
    role: role || 'CUSTOMER'
  };
  
  const mockToken = 'jwt-token-' + Date.now();
  
  const response = {
    success: true,
    data: {
      user: mockUser,
      token: mockToken
    },
    message: 'Registration successful'
  };
  
  console.log('✅ Registration response:', response);
  res.json(response);
});

app.post('/api/auth/login', (req, res) => {
  console.log('🔐 Login request received:', req.body);
  
  const { email, password } = req.body;
  
  // Mock successful login
  const mockUser = {
    id: '1',
    name: email ? email.split('@')[0] : 'TestUser',
    email: email || 'test@example.com',
    role: email && email.includes('seller') ? 'SELLER' : 
          email && email.includes('admin') ? 'ADMIN' : 'CUSTOMER'
  };
  
  const mockToken = 'jwt-token-' + Date.now();
  
  const response = {
    success: true,
    data: {
      user: mockUser,
      token: mockToken
    },
    message: 'Login successful'
  };
  
  console.log('✅ Login response:', response);
  res.json(response);
});

app.get('/api/auth/me', (req, res) => {
  console.log('👤 Get current user requested');
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

// Products route
app.get('/api/products', (req, res) => {
  console.log('🛍️ Products requested');
  
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
  console.log(`🛍️ Product ${id} requested`);
  
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
  
  res.json({
    success: true,
    data: { product: mockProduct }
  });
});

// Cart routes
app.get('/api/cart', (req, res) => {
  console.log('🛒 Cart requested');
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
  console.log('📋 Orders requested');
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
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/products',
      'GET /api/products/:id',
      'GET /api/cart',
      'GET /api/orders',
      'POST /api/payments/paypal/create-order'
    ]
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
const server = app.listen(PORT, () => {
  console.log('\n🎉 SUCCESS! Fashion Era Server Started!');
  console.log('=' .repeat(50));
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/*`);
  console.log(`🛍️ Products: http://localhost:${PORT}/api/products`);
  console.log('=' .repeat(50));
  console.log('✅ Server is ready for requests!');
  console.log('💡 Module Type: ES Module');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`❌ Port ${PORT} is in use. Trying port ${PORT + 1}...`);
    server.listen(PORT + 1);
  } else {
    console.error('❌ Server error:', err);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
