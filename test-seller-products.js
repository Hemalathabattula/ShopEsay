#!/usr/bin/env node

// Test script for seller product creation
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5001';

// Test data
const testProduct = {
  title: 'Test Product from Seller',
  description: 'This is a test product created by a seller to verify the product creation functionality works correctly.',
  basePrice: 49.99,
  category: 'clothing',
  subcategory: 'T-Shirts',
  material: 'Cotton',
  brand: 'Test Brand',
  images: [
    {
      url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
      alt: 'Test Product Image',
      isPrimary: true
    }
  ],
  variants: [
    {
      size: 'S',
      color: 'Blue',
      stock: 10,
      price: 49.99
    },
    {
      size: 'M',
      color: 'Blue',
      stock: 15,
      price: 49.99
    },
    {
      size: 'L',
      color: 'Blue',
      stock: 8,
      price: 49.99
    }
  ],
  tags: ['comfortable', 'casual', 'cotton'],
  features: ['Soft fabric', 'Machine washable', 'Breathable']
};

async function testSellerProductEndpoints() {
  console.log('🧪 Testing Seller Product Endpoints');
  console.log('=' .repeat(50));

  try {
    // Test 1: Get seller products (should work without auth for testing)
    console.log('\n1️⃣ Testing GET /api/seller/products');
    const getResponse = await fetch(`${API_BASE_URL}/api/seller/products`);
    const getResult = await getResponse.json();
    
    if (getResult.success) {
      console.log('✅ GET seller products successful');
      console.log(`   Found ${getResult.data.length} products`);
    } else {
      console.log('❌ GET seller products failed:', getResult.message);
    }

    // Test 2: Create new product
    console.log('\n2️⃣ Testing POST /api/seller/products');
    const createResponse = await fetch(`${API_BASE_URL}/api/seller/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct)
    });
    
    const createResult = await createResponse.json();
    
    if (createResult.success) {
      console.log('✅ Product creation successful!');
      console.log(`   Product ID: ${createResult.data._id}`);
      console.log(`   Product Title: ${createResult.data.title}`);
      console.log(`   Base Price: $${createResult.data.basePrice}`);
      console.log(`   Variants: ${createResult.data.variants.length}`);
    } else {
      console.log('❌ Product creation failed:', createResult.message);
      if (createResult.errors) {
        console.log('   Validation errors:', createResult.errors);
      }
    }

    // Test 3: Test validation with incomplete data
    console.log('\n3️⃣ Testing validation with incomplete data');
    const incompleteProduct = {
      title: 'Incomplete Product',
      // Missing required fields
    };
    
    const validationResponse = await fetch(`${API_BASE_URL}/api/seller/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incompleteProduct)
    });
    
    const validationResult = await validationResponse.json();
    
    if (!validationResult.success) {
      console.log('✅ Validation working correctly');
      console.log(`   Error: ${validationResult.message}`);
    } else {
      console.log('❌ Validation should have failed');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the server is running on port 5001');
    console.log('   Run: node simple-node-server.js');
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Test completed');
}

// Run tests
testSellerProductEndpoints();
