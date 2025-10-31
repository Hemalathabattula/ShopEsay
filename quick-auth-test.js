// Quick authentication test
const http = require('http');

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAuth() {
    console.log('🧪 Quick Authentication Test\n');
    
    // Test customer login
    console.log('👤 Testing customer login...');
    try {
        const result = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            email: 'customer@example.com',
            password: 'password123'
        });
        
        if (result.status === 200) {
            console.log('✅ Customer login SUCCESS!');
            console.log(`   User: ${result.data.data.user.name}`);
            console.log(`   Role: ${result.data.data.user.role}`);
            console.log(`   Token: ${result.data.data.token.substring(0, 20)}...`);
        } else {
            console.log('❌ Customer login FAILED:', result.status, result.data.message);
        }
    } catch (error) {
        console.log('❌ Customer login ERROR:', error.message);
    }
    
    console.log('');
    
    // Test seller login
    console.log('🏪 Testing seller login...');
    try {
        const result = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/seller/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            email: 'seller@example.com',
            password: 'password123'
        });
        
        if (result.status === 200) {
            console.log('✅ Seller login SUCCESS!');
            console.log(`   User: ${result.data.data.user.name}`);
            console.log(`   Role: ${result.data.data.user.role}`);
            console.log(`   Store: ${result.data.data.user.storeName}`);
            console.log(`   Token: ${result.data.data.token.substring(0, 20)}...`);
        } else {
            console.log('❌ Seller login FAILED:', result.status, result.data.message);
        }
    } catch (error) {
        console.log('❌ Seller login ERROR:', error.message);
    }
    
    console.log('');
    
    // Test invalid login
    console.log('❌ Testing invalid login...');
    try {
        const result = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, {
            email: 'invalid@example.com',
            password: 'wrongpassword'
        });
        
        if (result.status === 401) {
            console.log('✅ Invalid login correctly REJECTED!');
            console.log(`   Message: ${result.data.message}`);
        } else {
            console.log('❌ Invalid login should have been rejected!');
        }
    } catch (error) {
        console.log('❌ Invalid login test ERROR:', error.message);
    }
    
    console.log('\n🎉 Authentication test completed!');
    console.log('\n📋 Working Credentials:');
    console.log('👤 Customer: customer@example.com / password123');
    console.log('🏪 Seller: seller@example.com / password123');
    console.log('🛡️ Admin: Use admin001 / Admin@123! on admin login page');
}

testAuth().catch(console.error);
