const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration for admin portal
app.use(cors({
  origin: [`http://localhost:${PORT}`, 'http://localhost:5000', 'http://localhost:5176'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Admin API routes - proxy to main backend
app.use('/api', (req, res) => {
  // Proxy requests to main backend server
  const backendUrl = 'http://localhost:5000';
  const axios = require('axios');
  
  const config = {
    method: req.method,
    url: `${backendUrl}${req.originalUrl}`,
    headers: {
      ...req.headers,
      host: 'localhost:5000'
    },
    data: req.body
  };

  axios(config)
    .then(response => {
      res.status(response.status).json(response.data);
    })
    .catch(error => {
      console.error('Proxy error:', error.message);
      res.status(error.response?.status || 500).json({
        error: 'Backend connection failed',
        message: error.message
      });
    });
});

// Admin portal routes - serve the React app for all admin routes
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Default route - redirect to admin portal
app.get('/', (req, res) => {
  res.redirect('/admin-portal-login');
});

// Catch all other routes and serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Admin Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// Start the admin server
app.listen(PORT, () => {
  console.log('🛡️  Fashion-Era Admin Portal Server');
  console.log('=====================================');
  console.log(`🌐 Admin Portal: http://localhost:${PORT}`);
  console.log(`🔐 Admin Login: http://localhost:${PORT}/admin-portal-login`);
  console.log(`📊 Admin Dashboard: http://localhost:${PORT}/admin-portal`);
  console.log('=====================================');
  console.log(`🔗 Backend API: http://localhost:5000`);
  console.log(`🏪 Main Website: http://localhost:5176`);
  console.log('=====================================');
});

module.exports = app;
