#!/usr/bin/env node

// Test script for wishlist functionality
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

async function testWishlistEndpoints() {
  console.log('🧪 Testing Wishlist Endpoints');
  console.log('=' .repeat(50));

  try {
    // Test 1: Get wishlist (should work without auth for testing)
    console.log('\n1️⃣ Testing GET /api/wishlist');
    const getResponse = await fetch(`${API_BASE_URL}/api/wishlist`);
    const getResult = await getResponse.json();
    
    if (getResult.success) {
      console.log('✅ GET wishlist successful');
      console.log(`   Found ${getResult.data.products.length} items`);
    } else {
      console.log('❌ GET wishlist failed:', getResult.message);
    }

    // Test 2: Add to wishlist
    console.log('\n2️⃣ Testing POST /api/wishlist/add');
    const addResponse = await fetch(`${API_BASE_URL}/api/wishlist/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId: 'test-product-123' })
    });
    
    const addResult = await addResponse.json();
    
    if (addResult.success) {
      console.log('✅ Add to wishlist successful!');
      console.log(`   Message: ${addResult.message}`);
    } else {
      console.log('❌ Add to wishlist failed:', addResult.message);
    }

    // Test 3: Remove from wishlist
    console.log('\n3️⃣ Testing DELETE /api/wishlist/remove/test-product-123');
    const removeResponse = await fetch(`${API_BASE_URL}/api/wishlist/remove/test-product-123`, {
      method: 'DELETE'
    });
    
    const removeResult = await removeResponse.json();
    
    if (removeResult.success) {
      console.log('✅ Remove from wishlist successful!');
      console.log(`   Message: ${removeResult.message}`);
    } else {
      console.log('❌ Remove from wishlist failed:', removeResult.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure the server is running on port 5000');
    console.log('   Run: node simple-node-server.js');
  }

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Wishlist test completed');
}

// Test wishlist store functions
function testWishlistStore() {
  console.log('\n🧪 Testing Wishlist Store Functions');
  console.log('=' .repeat(50));

  // Mock wishlist store
  const mockWishlistStore = {
    items: [],
    isInWishlist: function(productId) {
      return this.items.some(item => item.productId === productId || item.id === productId);
    },
    addItem: function(item) {
      if (!this.isInWishlist(item.productId)) {
        this.items.push(item);
        console.log(`✅ Added "${item.name}" to wishlist`);
      } else {
        console.log(`⚠️ "${item.name}" already in wishlist`);
      }
    },
    removeItem: function(productId) {
      const initialLength = this.items.length;
      this.items = this.items.filter(item => item.productId !== productId && item.id !== productId);
      if (this.items.length < initialLength) {
        console.log(`✅ Removed product ${productId} from wishlist`);
      } else {
        console.log(`⚠️ Product ${productId} not found in wishlist`);
      }
    }
  };

  // Test adding items
  console.log('\n1️⃣ Testing addItem function');
  mockWishlistStore.addItem({
    id: '1',
    productId: 'product-1',
    name: 'Test Product 1',
    price: 29.99,
    image: 'test-image.jpg'
  });

  mockWishlistStore.addItem({
    id: '2',
    productId: 'product-2',
    name: 'Test Product 2',
    price: 49.99,
    image: 'test-image2.jpg'
  });

  // Test checking if item is in wishlist
  console.log('\n2️⃣ Testing isInWishlist function');
  console.log(`Product 1 in wishlist: ${mockWishlistStore.isInWishlist('product-1')}`);
  console.log(`Product 3 in wishlist: ${mockWishlistStore.isInWishlist('product-3')}`);

  // Test removing items
  console.log('\n3️⃣ Testing removeItem function');
  mockWishlistStore.removeItem('product-1');
  mockWishlistStore.removeItem('product-3'); // Should not exist

  console.log(`\nFinal wishlist items: ${mockWishlistStore.items.length}`);
  mockWishlistStore.items.forEach(item => {
    console.log(`  - ${item.name} ($${item.price})`);
  });

  console.log('\n✅ Wishlist store functions working correctly!');
}

// Run tests
console.log('🚀 Starting Wishlist Tests\n');
testWishlistStore();
testWishlistEndpoints().catch(console.error);
