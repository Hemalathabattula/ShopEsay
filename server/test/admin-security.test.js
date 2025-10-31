const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Admin = require('../models/Admin');
const securityService = require('../services/securityService');
const adminAuthService = require('../services/adminAuthService');

describe('Admin Security System', () => {
  let adminToken;
  let adminSessionId;
  let testAdmin;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/fashion-era-test');
    }

    // Create test admin
    testAdmin = new Admin({
      adminId: 'test-admin-001',
      name: 'Test Admin',
      email: 'test@admin.com',
      password: 'TestAdmin123!',
      role: 'SUPER_ADMIN',
      isActive: true,
      isEmailVerified: true
    });
    await testAdmin.save();
  });

  afterAll(async () => {
    // Clean up test data
    await Admin.deleteMany({ adminId: { $regex: /^test-/ } });
    await mongoose.connection.close();
  });

  describe('Authentication Security', () => {
    test('should reject login without credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    test('should reject invalid admin credentials', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          adminId: 'invalid-admin',
          password: 'wrongpassword',
          captchaToken: 'test-captcha'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should successfully authenticate valid admin', async () => {
      const response = await request(app)
        .post('/api/admin/login')
        .send({
          adminId: 'test-admin-001',
          password: 'TestAdmin123!',
          captchaToken: 'test-captcha'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();

      adminToken = response.body.data.token;
      adminSessionId = response.body.data.sessionId;
    });

    test('should validate admin session', async () => {
      const response = await request(app)
        .get('/api/admin/validate-session')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Session-ID', adminSessionId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.admin).toBeDefined();
    });

    test('should reject invalid session', async () => {
      const response = await request(app)
        .get('/api/admin/validate-session')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Session-ID', 'invalid-session');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Authorization & RBAC', () => {
    test('should allow super admin to access dashboard', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Session-ID', adminSessionId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    test('should allow super admin to access user management', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Session-ID', adminSessionId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should allow super admin to access audit logs', async () => {
      const response = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Session-ID', adminSessionId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject unauthorized access without token', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard');

      expect(response.status).toBe(401);
    });
  });

  describe('Security Monitoring', () => {
    test('should track security events', async () => {
      // Attempt invalid login to trigger security monitoring
      await request(app)
        .post('/api/admin/login')
        .send({
          adminId: 'test-admin-001',
          password: 'wrongpassword',
          captchaToken: 'test-captcha'
        });

      const stats = securityService.getSecurityStats();
      expect(stats).toBeDefined();
      expect(stats.timestamp).toBeDefined();
    });

    test('should provide system health status', async () => {
      const response = await request(app)
        .get('/api/admin/system-health')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Session-ID', adminSessionId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.server).toBeDefined();
      expect(response.body.data.database).toBeDefined();
      expect(response.body.data.security).toBeDefined();
    });
  });

  describe('Session Management', () => {
    test('should list admin sessions', async () => {
      const response = await request(app)
        .get('/api/admin/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Session-ID', adminSessionId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeDefined();
    });

    test('should successfully logout admin', async () => {
      const response = await request(app)
        .post('/api/admin/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Session-ID', adminSessionId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should reject access after logout', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Session-ID', adminSessionId);

      expect(response.status).toBe(401);
    });
  });

  describe('Error Handling', () => {
    test('should handle and log frontend errors', async () => {
      // Re-authenticate for this test
      const loginResponse = await request(app)
        .post('/api/admin/login')
        .send({
          adminId: 'test-admin-001',
          password: 'TestAdmin123!',
          captchaToken: 'test-captcha'
        });

      const token = loginResponse.body.data.token;
      const sessionId = loginResponse.body.data.sessionId;

      const response = await request(app)
        .post('/api/admin/log-error')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Session-ID', sessionId)
        .send({
          message: 'Test error',
          stack: 'Error stack trace',
          errorId: 'test-error-001',
          timestamp: new Date().toISOString(),
          url: '/admin-dashboard'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limiting on admin login', async () => {
      const promises = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app)
            .post('/api/admin/login')
            .send({
              adminId: 'invalid-admin',
              password: 'wrongpassword',
              captchaToken: 'test-captcha'
            })
        );
      }

      const responses = await Promise.all(promises);
      
      // At least one should be rate limited
      const rateLimited = responses.some(response => response.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});

describe('Customer/Seller Isolation', () => {
  test('should not expose admin routes to customers', async () => {
    // Test that customer routes don't have admin access
    const response = await request(app)
      .get('/api/admin/dashboard');

    expect(response.status).toBe(401);
  });

  test('should maintain separate authentication for different user types', async () => {
    // Test customer login doesn't grant admin access
    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer@test.com',
        password: 'password123'
      });

    // Even if customer login succeeds, they shouldn't access admin routes
    if (customerLogin.status === 200) {
      const adminAccess = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${customerLogin.body.data?.token}`);

      expect(adminAccess.status).toBe(401);
    }
  });
});

describe('Data Protection', () => {
  test('should not expose sensitive admin data in responses', async () => {
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({
        adminId: 'test-admin-001',
        password: 'TestAdmin123!',
        captchaToken: 'test-captcha'
      });

    if (loginResponse.status === 200) {
      const adminData = loginResponse.body.data.admin;
      
      // Should not expose sensitive fields
      expect(adminData.password).toBeUndefined();
      expect(adminData.twoFactorSecret).toBeUndefined();
      expect(adminData.twoFactorBackupCodes).toBeUndefined();
      expect(adminData.activeSessions).toBeUndefined();
    }
  });
});

// Performance tests
describe('Performance & Scalability', () => {
  test('should handle concurrent admin requests', async () => {
    const loginResponse = await request(app)
      .post('/api/admin/login')
      .send({
        adminId: 'test-admin-001',
        password: 'TestAdmin123!',
        captchaToken: 'test-captcha'
      });

    if (loginResponse.status === 200) {
      const token = loginResponse.body.data.token;
      const sessionId = loginResponse.body.data.sessionId;

      const promises = [];
      
      // Make 10 concurrent dashboard requests
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${token}`)
            .set('X-Session-ID', sessionId)
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }
  });
});
