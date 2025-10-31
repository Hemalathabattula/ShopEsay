// Test forgot password endpoint
const http = require('http');

const testForgotPassword = (email) => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ email });
    
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/auth/forgot-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`✅ Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(responseData);
          console.log('📧 Response:', parsed);
          if (parsed.data && parsed.data.resetLink) {
            console.log('🔗 Reset Link:', parsed.data.resetLink);
          }
        } catch (e) {
          console.log('📄 Raw Response:', responseData);
        }
        resolve(true);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('⏰ Request timeout');
      req.destroy();
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
};

const runTest = async () => {
  console.log('🧪 Testing Forgot Password Endpoint...\n');
  
  // Test with existing user
  console.log('Testing with existing user:');
  await testForgotPassword('customer@example.com');
  
  console.log('\nTesting with non-existing user:');
  await testForgotPassword('nonexistent@example.com');
  
  console.log('\n🏁 Test completed');
};

runTest();
