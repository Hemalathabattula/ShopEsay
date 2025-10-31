const http = require('http');

function testWishlistAPI() {
  console.log('🧪 Testing Wishlist API...');
  
  // Test GET /api/wishlist
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/wishlist',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('\n📋 GET /api/wishlist Response:');
        console.log('Status:', res.statusCode);
        console.log('Response:', JSON.stringify(response, null, 2));
        
        if (res.statusCode === 401) {
          console.log('\n🔐 Authentication required - this is expected');
          console.log('💡 The wishlist requires user authentication');
        }
      } catch (error) {
        console.error('❌ Error parsing response:', error);
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error);
  });

  req.end();
}

testWishlistAPI();
