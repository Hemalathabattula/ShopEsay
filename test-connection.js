// Test if the server is running
const http = require('http');

console.log('🧪 Testing server connection...');

const testEndpoint = (path, description) => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ ${description}: Status ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log(`   Response:`, parsed);
        } catch (e) {
          console.log(`   Response:`, data.substring(0, 100));
        }
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`⏰ ${description}: Request timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

const runTests = async () => {
  console.log('Testing endpoints...\n');
  
  await testEndpoint('/health', 'Health Check');
  await testEndpoint('/api/test', 'API Test');
  
  console.log('\n🏁 Test completed');
};

runTests();
