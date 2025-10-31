const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test credentials
const testCredentials = {
    customer: {
        email: 'customer@example.com',
        password: 'password123'
    },
    seller: {
        email: 'seller@example.com',
        password: 'password123'
    }
};

async function testHealthCheck() {
    console.log('🏥 Testing health check...');
    try {
        const response = await axios.get(`${API_BASE}/auth/health`);
        console.log('✅ Health check passed:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return false;
    }
}

async function testCustomerLogin() {
    console.log('👤 Testing customer login...');
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, testCredentials.customer);
        console.log('✅ Customer login successful:', {
            user: response.data.data.user.name,
            role: response.data.data.user.role,
            token: response.data.data.token.substring(0, 20) + '...'
        });
        return response.data.data.token;
    } catch (error) {
        console.log('❌ Customer login failed:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testSellerLogin() {
    console.log('🏪 Testing seller login...');
    try {
        const response = await axios.post(`${API_BASE}/auth/seller/login`, testCredentials.seller);
        console.log('✅ Seller login successful:', {
            user: response.data.data.user.name,
            role: response.data.data.user.role,
            store: response.data.data.user.storeName,
            token: response.data.data.token.substring(0, 20) + '...'
        });
        return response.data.data.token;
    } catch (error) {
        console.log('❌ Seller login failed:', error.response?.data?.message || error.message);
        return null;
    }
}

async function testInvalidLogin() {
    console.log('❌ Testing invalid login...');
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'invalid@example.com',
            password: 'wrongpassword'
        });
        console.log('❌ Invalid login should have failed!');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Invalid login correctly rejected:', error.response.data.message);
        } else {
            console.log('❌ Unexpected error:', error.message);
        }
    }
}

async function testProtectedRoute(token) {
    console.log('🔒 Testing protected route...');
    try {
        const response = await axios.get(`${API_BASE}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ Protected route access successful:', response.data);
    } catch (error) {
        console.log('❌ Protected route failed:', error.response?.data?.message || error.message);
    }
}

async function runAllTests() {
    console.log('🧪 Starting authentication tests...\n');
    
    // Test health check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        console.log('❌ Server is not running. Please start the backend server first.');
        return;
    }
    
    console.log('');
    
    // Test customer login
    const customerToken = await testCustomerLogin();
    console.log('');
    
    // Test seller login
    const sellerToken = await testSellerLogin();
    console.log('');
    
    // Test invalid login
    await testInvalidLogin();
    console.log('');
    
    // Test protected route if we have a token
    if (customerToken) {
        await testProtectedRoute(customerToken);
    }
    
    console.log('\n🎉 Authentication tests completed!');
    console.log('\n📋 Summary:');
    console.log(`✅ Health Check: ${healthOk ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Customer Login: ${customerToken ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Seller Login: ${sellerToken ? 'PASS' : 'FAIL'}`);
    
    if (customerToken || sellerToken) {
        console.log('\n🚀 You can now use these credentials in the frontend:');
        console.log('👤 Customer: customer@example.com / password123');
        console.log('🏪 Seller: seller@example.com / password123');
    }
}

// Run tests
runAllTests().catch(console.error);
