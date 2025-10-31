const { MongoClient } = require('mongodb');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://payment:payment@cluster0.dhgtxhw.mongodb.net/fashion-era?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'fashion-era';

async function cleanSampleData() {
  let client;
  
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    
    // Remove the sample products (Classic White T-Shirt and Denim Jacket)
    const result = await db.collection('products').deleteMany({
      title: { $in: ['Classic White T-Shirt', 'Denim Jacket'] }
    });
    
    console.log(`🗑️ Removed ${result.deletedCount} sample products`);
    
    // Show remaining products
    const remainingProducts = await db.collection('products').find({}).toArray();
    
    console.log('\n📦 Remaining products:');
    console.log('=====================');
    
    remainingProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.title}`);
      console.log(`   Price: $${product.basePrice}`);
      console.log(`   Image: ${product.images[0]?.url}`);
    });
    
    console.log(`\n📊 Total remaining products: ${remainingProducts.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Database connection closed');
    }
  }
}

cleanSampleData();
