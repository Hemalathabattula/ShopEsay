const { MongoClient } = require('mongodb');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://payment:payment@cluster0.dhgtxhw.mongodb.net/fashion-era?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'fashion-era';

console.log('🚀 Creating Fashion Era Database...');
console.log('📍 Connecting to MongoDB Atlas...');

async function createFashionEraDatabase() {
  let client;
  
  try {
    // Connect to MongoDB Atlas
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    
    // Create collections and indexes
    console.log('📊 Creating collections and indexes...');
    
    // Users collection (for customers, sellers, admins)
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    
    // Products collection
    await db.collection('products').createIndex({ title: 'text', description: 'text' });
    await db.collection('products').createIndex({ category: 1, subcategory: 1 });
    await db.collection('products').createIndex({ seller: 1 });
    await db.collection('products').createIndex({ isActive: 1 });
    
    // Orders collection
    await db.collection('orders').createIndex({ customer: 1 });
    await db.collection('orders').createIndex({ orderNumber: 1 }, { unique: true });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    
    // Carts collection
    await db.collection('carts').createIndex({ userId: 1 }, { unique: true });
    
    // Reviews collection
    await db.collection('reviews').createIndex({ productId: 1 });
    await db.collection('reviews').createIndex({ userId: 1, productId: 1 }, { unique: true });
    
    // Shipments collection
    await db.collection('shipments').createIndex({ orderId: 1 }, { unique: true });
    await db.collection('shipments').createIndex({ trackingNumber: 1 }, { unique: true });
    
    console.log('✅ Collections and indexes created');
    
    // Insert sample data
    console.log('📝 Inserting sample data...');
    
    // Sample users
    const sampleUsers = [
      {
        name: 'John Customer',
        email: 'customer@example.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO', // password123
        role: 'CUSTOMER',
        isEmailVerified: true,
        isActive: true,
        addresses: [{
          type: 'shipping',
          firstName: 'John',
          lastName: 'Customer',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
          isDefault: true
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Fashion Store',
        email: 'seller@example.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO', // password123
        role: 'SELLER',
        storeName: 'Fashion Store',
        storeDescription: 'Premium fashion clothing and accessories',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uIoO', // password123
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Check if users already exist
    const existingUsers = await db.collection('users').countDocuments();
    if (existingUsers === 0) {
      await db.collection('users').insertMany(sampleUsers);
      console.log('✅ Sample users created');
    } else {
      console.log(`👥 Found ${existingUsers} existing users`);
    }
    
    // Get seller ID for products
    const seller = await db.collection('users').findOne({ role: 'SELLER' });
    
    // Sample products
    const sampleProducts = [
      {
        seller: seller._id,
        title: 'Classic White T-Shirt',
        description: 'Premium cotton white t-shirt perfect for everyday wear',
        slug: 'classic-white-t-shirt',
        images: [{
          url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
          alt: 'Classic White T-Shirt',
          isPrimary: true
        }],
        category: 'clothing',
        subcategory: 't-shirts',
        brand: 'Fashion Era',
        material: '100% Cotton',
        careInstructions: ['Machine wash cold', 'Tumble dry low'],
        variants: [
          { size: 'S', color: 'White', stock: 50, sku: 'CWT-S-W' },
          { size: 'M', color: 'White', stock: 75, sku: 'CWT-M-W' },
          { size: 'L', color: 'White', stock: 60, sku: 'CWT-L-W' }
        ],
        basePrice: 29.99,
        originalPrice: 39.99,
        tags: ['casual', 'cotton', 'basic'],
        features: ['Comfortable fit', 'Breathable fabric', 'Easy care'],
        ratingAverage: 4.5,
        ratingCount: 128,
        totalSold: 245,
        isActive: true,
        isFeatured: true,
        isNewProduct: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        seller: seller._id,
        title: 'Denim Jacket',
        description: 'Stylish denim jacket with a modern fit',
        slug: 'denim-jacket',
        images: [{
          url: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=500',
          alt: 'Denim Jacket',
          isPrimary: true
        }],
        category: 'clothing',
        subcategory: 'jackets',
        brand: 'Fashion Era',
        material: '100% Denim',
        careInstructions: ['Machine wash cold', 'Hang dry'],
        variants: [
          { size: 'S', color: 'Blue', stock: 30, sku: 'DJ-S-B' },
          { size: 'M', color: 'Blue', stock: 45, sku: 'DJ-M-B' },
          { size: 'L', color: 'Blue', stock: 35, sku: 'DJ-L-B' }
        ],
        basePrice: 89.99,
        originalPrice: 119.99,
        tags: ['denim', 'jacket', 'casual'],
        features: ['Classic fit', 'Durable fabric', 'Versatile style'],
        ratingAverage: 4.3,
        ratingCount: 89,
        totalSold: 156,
        isActive: true,
        isFeatured: false,
        isNewProduct: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Check if products already exist
    const existingProducts = await db.collection('products').countDocuments();
    if (existingProducts === 0) {
      await db.collection('products').insertMany(sampleProducts);
      console.log('✅ Sample products created');
    } else {
      console.log(`📦 Found ${existingProducts} existing products`);
    }
    
    // Create sample categories collection
    const sampleCategories = [
      {
        name: 'Clothing',
        slug: 'clothing',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300',
        subcategories: [
          { name: 'T-Shirts', slug: 't-shirts' },
          { name: 'Jackets', slug: 'jackets' },
          { name: 'Jeans', slug: 'jeans' },
          { name: 'Dresses', slug: 'dresses' }
        ],
        isActive: true,
        createdAt: new Date()
      },
      {
        name: 'Accessories',
        slug: 'accessories',
        image: 'https://images.unsplash.com/photo-1506629905607-d405b7a82d8b?w=300',
        subcategories: [
          { name: 'Bags', slug: 'bags' },
          { name: 'Jewelry', slug: 'jewelry' },
          { name: 'Watches', slug: 'watches' },
          { name: 'Sunglasses', slug: 'sunglasses' }
        ],
        isActive: true,
        createdAt: new Date()
      }
    ];
    
    const existingCategories = await db.collection('categories').countDocuments();
    if (existingCategories === 0) {
      await db.collection('categories').insertMany(sampleCategories);
      console.log('✅ Sample categories created');
    } else {
      console.log(`📂 Found ${existingCategories} existing categories`);
    }
    
    console.log('\n🎉 FASHION ERA DATABASE CREATED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log(`🗄️ Database Name: ${DB_NAME}`);
    console.log(`👥 Users: ${await db.collection('users').countDocuments()}`);
    console.log(`📦 Products: ${await db.collection('products').countDocuments()}`);
    console.log(`📂 Categories: ${await db.collection('categories').countDocuments()}`);
    console.log('=' .repeat(60));
    console.log('✅ Ready to use with your Fashion Era application!');
    console.log('\n📝 Test Accounts:');
    console.log('👤 Customer: customer@example.com / password123');
    console.log('🏪 Seller: seller@example.com / password123');
    console.log('👑 Admin: admin@example.com / password123');
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    if (error.message.includes('authentication failed')) {
      console.log('💡 Please check your MongoDB Atlas credentials');
    } else if (error.message.includes('network')) {
      console.log('💡 Please check your internet connection');
    }
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
createFashionEraDatabase();
