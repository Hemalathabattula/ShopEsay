// Alternative server on port 5001
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001; // Different port

console.log('🚀 Starting Fashion Era Server on port 5001...');

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
    port: PORT
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
      description: 'Comfortable cotton t-shirt'
    },
    {
      _id: '2',
      title: 'Denim Jeans',
      price: 79.99,
      images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'],
      category: 'clothing',
      description: 'Classic blue denim jeans'
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

// Catch all
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/products'
    ]
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('\n🎉 SUCCESS! Fashion Era Server Started!');
  console.log('=' .repeat(50));
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/*`);
  console.log('=' .repeat(50));
  console.log('✅ Server is ready for requests!');
  console.log('\n💡 Next step: Update frontend to use port 5001');
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
