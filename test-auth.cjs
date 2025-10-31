// Test auth endpoints specifically
const http = require('http');

console.log('🧪 Testing auth endpoints...');

const testEndpoint = (path, method = 'GET', data = null) => {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 5000
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`${method} ${path}: Status ${res.statusCode}`);
        try {
          const parsed = JSON.parse(responseData);
          console.log('   Response:', parsed);
        } catch (e) {
          console.log('   Response:', responseData.substring(0, 200));
        }
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${method} ${path}: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${method} ${path}: Request timeout`);
      req.destroy();
      resolve(false);
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
};

const runTests = async () => {
  console.log('Testing auth endpoints...\n');
  
  // Test basic endpoints
  await testEndpoint('/health', 'GET');
  await testEndpoint('/api/auth', 'GET');
  
  // Test registration
  await testEndpoint('/api/auth/register', 'POST', {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'CUSTOMER'
  });
  
  // Test login
  await testEndpoint('/api/auth/login', 'POST', {
    email: 'test@example.com',
    password: 'password123'
  });
  
  console.log('\n🏁 Auth test completed');
};

runTests();
