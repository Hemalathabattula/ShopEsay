import axios from 'axios';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'CUSTOMER'
};

const TEST_SELLER = {
  name: 'Test Seller',
  email: 'seller@example.com',
  password: 'password123',
  role: 'SELLER',
  storeName: 'Test Store',
  storeDescription: 'A test store for testing purposes'
};

let authToken = '';
let sellerToken = '';
let testOrderId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = authToken) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🔍 Testing Health Check...');
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    console.log('📊 Status:', result.data);
  } else {
    console.log('❌ Health check failed:', result.error);
  }
  
  return result.success;
};

const testUserRegistration = async () => {
  console.log('\n👤 Testing User Registration...');
  
  // Test customer registration
  const customerResult = await makeRequest('POST', '/api/auth/register', TEST_USER);
  
  if (customerResult.success) {
    console.log('✅ Customer registration successful');
    authToken = customerResult.data.data.token;
  } else {
    console.log('❌ Customer registration failed:', customerResult.error);
    return false;
  }
  
  // Test seller registration
  const sellerResult = await makeRequest('POST', '/api/auth/register', TEST_SELLER);
  
  if (sellerResult.success) {
    console.log('✅ Seller registration successful');
    sellerToken = sellerResult.data.data.token;
  } else {
    console.log('❌ Seller registration failed:', sellerResult.error);
    return false;
  }
  
  return true;
};

const testUserLogin = async () => {
  console.log('\n🔐 Testing User Login...');
  
  const result = await makeRequest('POST', '/api/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  
  if (result.success) {
    console.log('✅ Login successful');
    authToken = result.data.data.token;
  } else {
    console.log('❌ Login failed:', result.error);
  }
  
  return result.success;
};

const testGetCurrentUser = async () => {
  console.log('\n👤 Testing Get Current User...');
  
  const result = await makeRequest('GET', '/api/auth/me');
  
  if (result.success) {
    console.log('✅ Get current user successful');
    console.log('👤 User:', result.data.data.user.name);
  } else {
    console.log('❌ Get current user failed:', result.error);
  }
  
  return result.success;
};

const testProductOperations = async () => {
  console.log('\n📦 Testing Product Operations...');
  
  // Test get products
  const getResult = await makeRequest('GET', '/api/products');
  
  if (getResult.success) {
    console.log('✅ Get products successful');
    console.log('📦 Products count:', getResult.data.data.products.length);
  } else {
    console.log('❌ Get products failed:', getResult.error);
    return false;
  }
  
  return true;
};

const testCartOperations = async () => {
  console.log('\n🛒 Testing Cart Operations...');
  
  // Test get cart
  const getCartResult = await makeRequest('GET', '/api/cart');
  
  if (getCartResult.success) {
    console.log('✅ Get cart successful');
  } else {
    console.log('❌ Get cart failed:', getCartResult.error);
    return false;
  }
  
  return true;
};

const testOrderOperations = async () => {
  console.log('\n📋 Testing Order Operations...');
  
  // Test get orders
  const getOrdersResult = await makeRequest('GET', '/api/orders');
  
  if (getOrdersResult.success) {
    console.log('✅ Get orders successful');
    console.log('📋 Orders count:', getOrdersResult.data.data.orders.length);
  } else {
    console.log('❌ Get orders failed:', getOrdersResult.error);
    return false;
  }
  
  return true;
};

const testSellerOperations = async () => {
  console.log('\n🏪 Testing Seller Operations...');
  
  // Test seller dashboard access
  const result = await makeRequest('GET', '/api/orders/seller', null, sellerToken);
  
  if (result.success) {
    console.log('✅ Seller operations successful');
  } else {
    console.log('❌ Seller operations failed:', result.error);
  }
  
  return result.success;
};

const testPaymentFlow = async () => {
  console.log('\n💳 Testing Payment Flow...');
  
  // Test PayPal order creation (mock)
  const orderData = {
    shippingAddress: {
      firstName: 'Test',
      lastName: 'User',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'United States'
    }
  };
  
  const result = await makeRequest('POST', '/api/payments/paypal/create-order', { orderData });
  
  if (result.success) {
    console.log('✅ Payment flow test successful');
  } else {
    console.log('❌ Payment flow test failed:', result.error);
  }
  
  return result.success;
};

const testEmailService = async () => {
  console.log('\n📧 Testing Email Service...');
  
  // Test forgot password (which sends an email)
  const result = await makeRequest('POST', '/api/auth/forgot-password', {
    email: TEST_USER.email
  });
  
  if (result.success) {
    console.log('✅ Email service test successful');
  } else {
    console.log('❌ Email service test failed:', result.error);
  }
  
  return result.success;
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Backend API Tests...');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Get Current User', fn: testGetCurrentUser },
    { name: 'Product Operations', fn: testProductOperations },
    { name: 'Cart Operations', fn: testCartOperations },
    { name: 'Order Operations', fn: testOrderOperations },
    { name: 'Seller Operations', fn: testSellerOperations },
    { name: 'Payment Flow', fn: testPaymentFlow },
    { name: 'Email Service', fn: testEmailService },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw an error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your backend is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the server logs and fix any issues.');
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
