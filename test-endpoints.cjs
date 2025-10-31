// Test all endpoints to see what's working
const http = require('http');

const testEndpoint = (path, method = 'GET', data = null) => {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 3000
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
          console.log('   Response:', parsed.message || parsed.status || 'Success');
        } catch (e) {
          console.log('   Response:', responseData.substring(0, 100));
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
  console.log('🧪 Testing all endpoints...\n');
  
  // Test basic endpoints
  await testEndpoint('/health', 'GET');
  await testEndpoint('/api/auth/login', 'POST', { email: 'test@test.com', password: 'test' });
  await testEndpoint('/api/auth/register', 'POST', { name: 'Test', email: 'test@test.com', password: 'test' });
  await testEndpoint('/api/auth/forgot-password', 'POST', { email: 'customer@example.com' });
  await testEndpoint('/api/products', 'GET');
  
  console.log('\n🏁 Test completed');
};

runTests();
