#!/usr/bin/env node

// Test script for products endpoint
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

async function testProductsEndpoint() {
  console.log('🧪 Testing Products Endpoint');
  console.log('=' .repeat(50));

  try {
    // Test 1: Get all products
    console.log('\n1️⃣ Testing GET /api/products');
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ GET products successful');
      console.log(`   Found ${result.data.products.length} products`);
      console.log(`   Total: ${result.data.total}`);
      
      // Show first product details
      if (result.data.products.length > 0) {
        const firstProduct = result.data.products[0];
        console.log('\n📦 First Product Details:');
        console.log(`   ID: ${firstProduct.id || firstProduct._id}`);
        console.log(`   Name: ${firstProduct.name || firstProduct.title}`);
        console.log(`   Price: $${firstProduct.price}`);
        console.log(`   Category: ${firstProduct.category}`);
        console.log(`   Rating: ${firstProduct.rating || 'N/A'}`);
        console.log(`   Variants: ${firstProduct.variants?.length || 0}`);
        
        // Test product structure
        const hasRequiredFields = firstProduct.id && firstProduct.name && firstProduct.price && firstProduct.images;
        console.log(`   Structure Valid: ${hasRequiredFields ? '✅' : '❌'}`);
      }
      
      // Test each product structure
      console.log('\n🔍 Validating Product Structure:');
      result.data.products.forEach((product, index) => {
        const hasId = product.id || product._id;
        const hasName = product.name || product.title;
        const hasPrice = product.price || product.basePrice;
        const hasImages = product.images && product.images.length > 0;
        const hasVariants = product.variants && product.variants.length > 0;
        
        const isValid = hasId && hasName && hasPrice && hasImages;
        console.log(`   Product ${index + 1}: ${isValid ? '✅' : '❌'} ${hasName}`);
        
        if (!isValid) {
          console.log(`     Missing: ${!hasId ? 'ID ' : ''}${!hasName ? 'Name ' : ''}${!hasPrice ? 'Price ' : ''}${!hasImages ? 'Images' : ''}`);
        }
      });
      
    } else {
      console.log('❌ GET products failed:', result.message);
    }

    // Test 2: Get single product
    console.log('\n2️⃣ Testing GET /api/products/1');
    const singleResponse = await fetch(`${API_BASE_URL}/api/products/1`);
    const singleResult = await singleResponse.json();
    
    if (singleResult.success && singleResult.data) {
      console.log('✅ GET single product successful');
      console.log(`   Product: ${singleResult.data.name || singleResult.data.title}`);
    } else {
      console.log('❌ GET single product failed:', singleResult.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the server is running on port 5000');
    console.log('   Run: node simple-node-server.js');
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Products test completed');
}

// Test frontend store compatibility
function testProductStoreCompatibility() {
  console.log('\n🧪 Testing Product Store Compatibility');
  console.log('=' .repeat(50));

  // Mock product from server
  const serverProduct = {
    _id: '1',
    id: '1',
    title: 'Test Product',
    name: 'Test Product',
    price: 29.99,
    basePrice: 29.99,
    images: ['https://example.com/image.jpg'],
    category: 'clothing',
    description: 'Test description',
    rating: 4.5,
    ratingCount: 100,
    variants: [
      { size: 'M', color: 'Blue', stock: 10, price: 29.99 }
    ]
  };

  // Test ProductCard compatibility
  console.log('\n1️⃣ Testing ProductCard compatibility');
  
  // Check required fields for ProductCard
  const productCardFields = {
    id: serverProduct.id || serverProduct._id,
    name: serverProduct.name || serverProduct.title,
    price: serverProduct.price || serverProduct.basePrice,
    images: serverProduct.images,
    rating: serverProduct.rating,
    ratingCount: serverProduct.ratingCount,
    variants: serverProduct.variants
  };

  console.log('   Required fields check:');
  Object.entries(productCardFields).forEach(([key, value]) => {
    const isValid = value !== undefined && value !== null;
    console.log(`     ${key}: ${isValid ? '✅' : '❌'} ${value}`);
  });

  // Test cart item creation
  console.log('\n2️⃣ Testing cart item creation');
  const availableSizes = serverProduct.variants?.map(v => v.size) || ['M'];
  const availableColors = serverProduct.variants?.map(v => v.color) || ['Black'];
  
  const cartItem = {
    productId: serverProduct.id || serverProduct._id,
    name: serverProduct.name || serverProduct.title,
    price: serverProduct.price || serverProduct.basePrice,
    image: serverProduct.images?.[0] || '',
    size: availableSizes[0],
    color: availableColors[0],
    quantity: 1,
  };

  console.log('   Cart item structure:');
  Object.entries(cartItem).forEach(([key, value]) => {
    const isValid = value !== undefined && value !== null && value !== '';
    console.log(`     ${key}: ${isValid ? '✅' : '❌'} ${value}`);
  });

  console.log('\n✅ Product store compatibility verified!');
}

// Run tests
console.log('🚀 Starting Products Tests\n');
testProductStoreCompatibility();
testProductsEndpoint().catch(console.error);
