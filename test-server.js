// Minimal test server
console.log('🔧 Starting minimal test server...');

const http = require('http');
const url = require('url');

const PORT = 5000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Set content type
  res.setHeader('Content-Type', 'application/json');
  
  // Routes
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Test server is running!'
    }));
  } else if (path === '/api/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'API is working!',
      timestamp: new Date().toISOString()
    }));
  } else if (path.startsWith('/api/auth/')) {
    // Mock auth responses
    if (path === '/api/auth/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            data: {
              user: {
                id: '1',
                name: data.email.split('@')[0],
                email: data.email,
                role: data.email.includes('seller') ? 'SELLER' : data.email.includes('admin') ? 'ADMIN' : 'CUSTOMER'
              },
              token: 'mock-token-' + Date.now()
            },
            message: 'Login successful'
          }));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
        }
      });
    } else if (path === '/api/auth/register' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          res.writeHead(200);
          res.end(JSON.stringify({
            success: true,
            data: {
              user: {
                id: Date.now().toString(),
                name: data.name,
                email: data.email,
                role: data.role || 'CUSTOMER'
              },
              token: 'mock-token-' + Date.now()
            },
            message: 'Registration successful'
          }));
        } catch (error) {
          res.writeHead(400);
          res.end(JSON.stringify({ success: false, message: 'Invalid JSON' }));
        }
      });
    } else {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Auth endpoint (mock)',
        path: path
      }));
    }
  } else if (path.startsWith('/api/')) {
    // Mock API responses
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      message: 'Mock API response',
      path: path,
      data: []
    }));
  } else {
    // 404 for other routes
    res.writeHead(404);
    res.end(JSON.stringify({
      success: false,
      message: 'Endpoint not found',
      path: path
    }));
  }
});

server.listen(PORT, () => {
  console.log('🚀 ShopEasy Test Server Started!');
  console.log('=' .repeat(50));
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log('=' .repeat(50));
  console.log('✅ Server is ready to accept connections!');
  console.log('💡 Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
