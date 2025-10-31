// Quick test of auth endpoints
const http = require('http');

const testUrl = (path) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:5000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`✅ ${path}: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          console.log('   ', parsed.message || parsed.status);
        } catch (e) {
          console.log('   ', data.substring(0, 100));
        }
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${path}: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log(`⏰ ${path}: timeout`);
      req.destroy();
      resolve(false);
    });
  });
};

const runTest = async () => {
  console.log('🧪 Quick API test...\n');
  
  await testUrl('/health');
  await testUrl('/api/auth/test');
  await testUrl('/api/auth/register');
  
  console.log('\n🏁 Done');
};

runTest();
